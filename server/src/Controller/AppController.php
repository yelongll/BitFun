<?php

namespace Kongling\Server\Controller;

use Kongling\Server\Core\Request;
use Kongling\Server\Core\Response;
use Kongling\Server\Core\JWT;
use Kongling\Server\Core\Middleware;
use Kongling\Server\Database\Database;

class AppController
{
    private $db;
    private $jwt;
    private $middleware;
    private $config;

    public function __construct(Database $db, JWT $jwt, Middleware $middleware, array $config)
    {
        $this->db = $db;
        $this->jwt = $jwt;
        $this->middleware = $middleware;
        $this->config = $config;
    }

    public function checkUpdate(Request $request)
    {
        $currentVersion = trim($request->query('current_version', '0.0.0'));
        $platform = trim($request->query('platform', 'all'));

        if (!$currentVersion) {
            return Response::error('缺少当前版本号', 422, 42201);
        }

        $platforms = ['all'];
        if ($platform && $platform !== 'all') {
            $platforms[] = $platform;
        }
        $placeholders = implode(',', array_fill(0, count($platforms), '?'));

        $latest = $this->db->fetchOne(
            "SELECT version, download_url, file_size, sha256, release_notes, is_critical, published_at
             FROM app_versions
             WHERE status = 1 AND platform IN ({$placeholders})
               AND published_at IS NOT NULL AND published_at <= NOW()
             ORDER BY id DESC LIMIT 1",
            $platforms
        );

        if (!$latest) {
            return Response::success([
                'has_update' => false,
                'latest_version' => $currentVersion,
                'current_version' => $currentVersion,
                'download_url' => '',
                'release_notes' => '',
                'release_date' => '',
                'is_critical' => false,
                'file_size' => 0,
                'sha256' => '',
            ]);
        }

        $hasUpdate = version_compare($latest['version'], $currentVersion, '>');

        return Response::success([
            'has_update' => $hasUpdate,
            'latest_version' => $latest['version'],
            'current_version' => $currentVersion,
            'download_url' => $latest['download_url'],
            'release_notes' => $latest['release_notes'],
            'release_date' => $latest['published_at'],
            'is_critical' => (bool)$latest['is_critical'],
            'file_size' => (int)$latest['file_size'],
            'sha256' => $latest['sha256'],
        ]);
    }

    public function getAnnouncements(Request $request)
    {
        $now = date('Y-m-d H:i:s');

        $announcements = $this->db->fetchAll(
            "SELECT id, title, content, type, icon, action_text, action_url,
                    is_dismissible, priority, start_date, end_date, created_at
             FROM announcements
             WHERE status = 1
               AND (start_date IS NULL OR start_date <= ?)
               AND (end_date IS NULL OR end_date >= ?)
             ORDER BY priority DESC, id ASC",
            [$now, $now]
        );

        $userId = $request->param('auth_user_id');
        if ($userId) {
            $dismissed = $this->db->fetchAll(
                "SELECT announcement_id FROM user_announcement_dismiss WHERE user_id = ?",
                [$userId]
            );
            $dismissedIds = array_map(function ($row) {
                return (int)$row['announcement_id'];
            }, $dismissed);

            $announcements = array_filter($announcements, function ($a) use ($dismissedIds) {
                return !in_array((int)$a['id'], $dismissedIds);
            });
            $announcements = array_values($announcements);
        }

        $result = array_map(function ($a) {
            return [
                'id' => (int)$a['id'],
                'title' => $a['title'],
                'content' => $a['content'],
                'type' => $a['type'],
                'icon' => $a['icon'],
                'action_text' => $a['action_text'],
                'action_url' => $a['action_url'],
                'is_dismissible' => (bool)$a['is_dismissible'],
                'start_date' => $a['start_date'],
                'end_date' => $a['end_date'],
                'priority' => (int)$a['priority'],
                'created_at' => $a['created_at'],
            ];
        }, $announcements);

        return Response::success(['announcements' => $result]);
    }

    public function getUpdateLogs(Request $request)
    {
        $page = max(1, (int)$request->input('page', 1));
        $pageSize = min(50, max(1, (int)$request->input('page_size', 20)));
        $platform = trim($request->query('platform', ''));

        $where = "status = 1 AND published_at IS NOT NULL";
        $params = [];

        if ($platform && $platform !== 'all') {
            $where .= " AND (platform = ? OR platform = 'all')";
            $params[] = $platform;
        }

        $countSql = "SELECT COUNT(*) as cnt FROM app_versions WHERE {$where}";
        $totalResult = $this->db->fetchOne($countSql, $params);
        $total = (int)($totalResult['cnt'] ?? 0);

        $offset = ($page - 1) * $pageSize;
        $sql = "SELECT id, version, platform, release_notes, is_critical, published_at, created_at
                FROM app_versions
                WHERE {$where}
                ORDER BY published_at DESC, id DESC
                LIMIT {$offset}, {$pageSize}";
        $versions = $this->db->fetchAll($sql, $params);

        $result = array_map(function ($v) {
            return [
                'id' => (int)$v['id'],
                'version' => $v['version'],
                'platform' => $v['platform'],
                'release_notes' => $v['release_notes'],
                'is_critical' => (bool)$v['is_critical'],
                'published_at' => $v['published_at'],
                'created_at' => $v['created_at'],
            ];
        }, $versions);

        return Response::success([
            'logs' => $result,
            'pagination' => [
                'page' => $page,
                'page_size' => $pageSize,
                'total' => $total,
                'total_pages' => ceil($total / $pageSize),
            ],
        ]);
    }

    public function dismissAnnouncement(Request $request)
    {
        $userId = $request->param('auth_user_id');
        if (!$userId) {
            return Response::unauthorized();
        }

        $announcementId = (int)$request->param('id');
        if (!$announcementId) {
            return Response::error('缺少公告ID', 422, 42201);
        }

        $announcement = $this->db->fetchOne(
            "SELECT id, is_dismissible FROM announcements WHERE id = ? AND status = 1",
            [$announcementId]
        );

        if (!$announcement) {
            return Response::notFound('公告不存在');
        }

        if (!(bool)$announcement['is_dismissible']) {
            return Response::error('该公告不可关闭', 400, 40001);
        }

        $existing = $this->db->fetchOne(
            "SELECT id FROM user_announcement_dismiss WHERE user_id = ? AND announcement_id = ?",
            [$userId, $announcementId]
        );

        if (!$existing) {
            $this->db->insert('user_announcement_dismiss', [
                'user_id' => $userId,
                'announcement_id' => $announcementId,
            ]);
        }

        return Response::success(null, '已关闭');
    }
}
