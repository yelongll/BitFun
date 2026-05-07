<?php

namespace Kongling\Server\Controller;

use Kongling\Server\Core\Request;
use Kongling\Server\Core\Response;
use Kongling\Server\Core\JWT;
use Kongling\Server\Core\Middleware;
use Kongling\Server\Database\Database;

class AdminController
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

    private function isAdmin($userId)
    {
        $user = $this->db->fetchOne("SELECT role FROM users WHERE id = ?", [$userId]);
        return $user && isset($user['role']) && $user['role'] === 'admin';
    }

    private function checkAdmin(Request $request)
    {
        $userId = $request->param('auth_user_id');
        if (!$this->isAdmin($userId)) {
            return Response::error('无权限访问', 403, 40303);
        }
        return null;
    }

    public function dashboard(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $totalUsers = $this->db->fetchOne("SELECT COUNT(*) as cnt FROM users");
        $activeUsers = $this->db->fetchOne("SELECT COUNT(*) as cnt FROM users WHERE status = 1");
        $totalDevices = $this->db->fetchOne("SELECT COUNT(*) as cnt FROM user_devices");
        $todayLogins = $this->db->fetchOne("SELECT COUNT(*) as cnt FROM audit_logs WHERE action = 'login' AND DATE(created_at) = CURDATE()");
        $todayRegisters = $this->db->fetchOne("SELECT COUNT(*) as cnt FROM audit_logs WHERE action = 'register' AND DATE(created_at) = CURDATE()");

        $recentLogins = $this->db->fetchAll(
            "SELECT al.user_id, al.ip_address, al.created_at, u.username, u.nickname 
             FROM audit_logs al 
             LEFT JOIN users u ON al.user_id = u.id 
             WHERE al.action = 'login' 
             ORDER BY al.created_at DESC 
             LIMIT 10"
        );

        return Response::success([
            'stats' => [
                'total_users' => (int)($totalUsers['cnt'] ?? 0),
                'active_users' => (int)($activeUsers['cnt'] ?? 0),
                'total_devices' => (int)($totalDevices['cnt'] ?? 0),
                'today_logins' => (int)($todayLogins['cnt'] ?? 0),
                'today_registers' => (int)($todayRegisters['cnt'] ?? 0),
            ],
            'recent_logins' => $recentLogins,
        ]);
    }

    public function listUsers(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $page = max(1, (int)$request->input('page', 1));
        $pageSize = min(100, max(10, (int)$request->input('page_size', 20)));
        $search = trim($request->input('search', ''));
        $status = $request->input('status', '');

        $where = "1=1";
        $params = [];

        if ($search) {
            $where .= " AND (username LIKE ? OR email LIKE ? OR nickname LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        if ($status !== '' && $status !== null) {
            $where .= " AND status = ?";
            $params[] = (int)$status;
        }

        $countSql = "SELECT COUNT(*) as cnt FROM users WHERE {$where}";
        $totalResult = $this->db->fetchOne($countSql, $params);
        $total = (int)($totalResult['cnt'] ?? 0);

        $offset = ($page - 1) * $pageSize;
        $sql = "SELECT id, username, email, nickname, avatar_url, status, role, points, total_earned_points, email_verified_at, last_login_at, last_login_ip, login_count, created_at FROM users WHERE {$where} ORDER BY id DESC LIMIT {$offset}, {$pageSize}";
        $users = $this->db->fetchAll($sql, $params);

        return Response::success([
            'users' => $users,
            'pagination' => [
                'page' => $page,
                'page_size' => $pageSize,
                'total' => $total,
                'total_pages' => ceil($total / $pageSize),
            ],
        ]);
    }

    public function getUser(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $userId = (int)$request->param('id');
        $user = $this->db->fetchOne(
            "SELECT id, username, email, nickname, avatar_url, status, role, email_verified_at, last_login_at, last_login_ip, login_count, created_at FROM users WHERE id = ?",
            [$userId]
        );

        if (!$user) {
            return Response::notFound('用户不存在');
        }

        $devices = $this->db->fetchAll(
            "SELECT device_id, device_name, device_type, platform, app_version, ip_address, last_active_at, created_at FROM user_devices WHERE user_id = ? ORDER BY last_active_at DESC",
            [$userId]
        );

        $user['devices'] = $devices;

        return Response::success(['user' => $user]);
    }

    public function updateUser(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $userId = (int)$request->param('id');
        $user = $this->db->fetchOne("SELECT id FROM users WHERE id = ?", [$userId]);

        if (!$user) {
            return Response::notFound('用户不存在');
        }

        $nickname = trim($request->input('nickname', ''));
        $status = $request->input('status', '');
        $role = $request->input('role', '');

        $updates = [];
        if ($nickname) $updates['nickname'] = $nickname;
        if ($status !== '' && $status !== null) $updates['status'] = (int)$status;
        if ($role) $updates['role'] = $role;

        if (empty($updates)) {
            return Response::error('没有需要更新的内容', 422, 42201);
        }

        $this->db->update('users', $updates, 'id = ?', [$userId]);

        $adminId = $request->param('auth_user_id');
        $this->logAction($adminId, 'admin_update_user', 'user', (string)$userId, $request->getClientIp());

        return Response::success(null, '更新成功');
    }

    public function deleteUser(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $userId = (int)$request->param('id');
        $user = $this->db->fetchOne("SELECT id, username FROM users WHERE id = ?", [$userId]);

        if (!$user) {
            return Response::notFound('用户不存在');
        }

        $adminId = $request->param('auth_user_id');
        if ($userId === $adminId) {
            return Response::error('不能删除自己', 400, 40001);
        }

        $this->db->beginTransaction();
        try {
            $this->db->delete('user_devices', 'user_id = ?', [$userId]);
            $this->db->delete('token_blacklist', 'user_id = ?', [$userId]);
            $this->db->delete('audit_logs', 'user_id = ?', [$userId]);
            $this->db->delete('users', 'id = ?', [$userId]);
            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            return Response::serverError('删除失败');
        }

        $this->logAction($adminId, 'admin_delete_user', 'user', (string)$userId, $request->getClientIp());

        return Response::success(null, '用户已删除');
    }

    public function resetPassword(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $userId = (int)$request->param('id');
        $newPassword = $request->input('new_password', '');

        if (!$newPassword || mb_strlen($newPassword) < 6) {
            return Response::error('密码长度不能少于6位', 422, 42205);
        }

        $user = $this->db->fetchOne("SELECT id FROM users WHERE id = ?", [$userId]);
        if (!$user) {
            return Response::notFound('用户不存在');
        }

        $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => $this->config['security']['bcrypt_cost']]);
        $this->db->update('users', ['password_hash' => $passwordHash], 'id = ?', [$userId]);

        $this->db->delete('user_devices', 'user_id = ?', [$userId]);

        $adminId = $request->param('auth_user_id');
        $this->logAction($adminId, 'admin_reset_password', 'user', (string)$userId, $request->getClientIp());

        return Response::success(null, '密码已重置');
    }

    public function uploadUserAvatar(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $userId = (int)$request->param('id');
        
        $user = $this->db->fetchOne("SELECT id, username FROM users WHERE id = ?", [$userId]);
        if (!$user) {
            return Response::notFound('用户不存在');
        }

        if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
            return Response::error('请选择要上传的头像文件', 422, 42201);
        }

        $file = $_FILES['avatar'];
        
        if ($file['size'] > 5 * 1024 * 1024) {
            return Response::error('文件大小不能超过5MB', 422, 42202);
        }

        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        
        if (!in_array($mimeType, $allowedTypes)) {
            return Response::error('只支持 JPG、PNG、GIF、WEBP 格式的图片', 422, 42203);
        }

        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
        ];
        $extension = $extensions[$mimeType] ?? 'jpg';
        
        $uploadDir = dirname(__DIR__, 2) . '/uploads/avatars';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $filename = sprintf('avatar_%d_%s.%s', $userId, time(), $extension);
        $filepath = $uploadDir . '/' . $filename;

        $oldAvatar = $this->db->fetchOne("SELECT avatar_url FROM users WHERE id = ?", [$userId]);
        if ($oldAvatar && $oldAvatar['avatar_url']) {
            $oldFilename = basename(parse_url($oldAvatar['avatar_url'], PHP_URL_PATH));
            $oldPath = $uploadDir . '/' . $oldFilename;
            if (file_exists($oldPath) && strpos($oldAvatar['avatar_url'], '/avatar') !== false) {
                @unlink($oldPath);
            }
        }

        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            return Response::error('文件保存失败', 500, 50001);
        }

        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $avatarUrl = $protocol . '://' . $host . '/api/v1/upload/file/avatars/' . $filename;

        $this->db->update('users', ['avatar_url' => $avatarUrl], 'id = ?', [$userId]);

        $adminId = $request->param('auth_user_id');
        $this->logAction($adminId, 'admin_upload_avatar', 'user', (string)$userId, $request->getClientIp());

        return Response::success([
            'avatar_url' => $avatarUrl,
        ], '头像上传成功');
    }

    public function listConfigs(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $configs = $this->db->fetchAll("SELECT * FROM system_config ORDER BY id");

        return Response::success(['configs' => $configs]);
    }

    public function updateConfig(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $key = trim($request->input('key', ''));
        $value = $request->input('value', '');

        if (!$key) {
            return Response::error('配置键不能为空', 422, 42201);
        }

        $existing = $this->db->fetchOne("SELECT id FROM system_config WHERE config_key = ?", [$key]);
        if (!$existing) {
            return Response::notFound('配置项不存在');
        }

        $this->db->update('system_config', ['config_value' => $value], 'config_key = ?', [$key]);

        $adminId = $request->param('auth_user_id');
        $this->logAction($adminId, 'admin_update_config', 'config', $key, $request->getClientIp());

        return Response::success(null, '配置已更新');
    }

    public function logs(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $page = max(1, (int)$request->input('page', 1));
        $pageSize = min(100, max(10, (int)$request->input('page_size', 50)));
        $action = trim($request->input('action', ''));
        $userId = $request->input('user_id', '');
        $startDate = $request->input('start_date', '');
        $endDate = $request->input('end_date', '');

        $where = "1=1";
        $params = [];

        if ($action) {
            $where .= " AND action = ?";
            $params[] = $action;
        }

        if ($userId) {
            $where .= " AND user_id = ?";
            $params[] = (int)$userId;
        }

        if ($startDate) {
            $where .= " AND created_at >= ?";
            $params[] = $startDate . ' 00:00:00';
        }

        if ($endDate) {
            $where .= " AND created_at <= ?";
            $params[] = $endDate . ' 23:59:59';
        }

        $countSql = "SELECT COUNT(*) as cnt FROM audit_logs WHERE {$where}";
        $totalResult = $this->db->fetchOne($countSql, $params);
        $total = (int)($totalResult['cnt'] ?? 0);

        $offset = ($page - 1) * $pageSize;
        $sql = "SELECT al.*, u.username FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id WHERE {$where} ORDER BY al.created_at DESC LIMIT {$offset}, {$pageSize}";
        $logs = $this->db->fetchAll($sql, $params);

        return Response::success([
            'logs' => $logs,
            'pagination' => [
                'page' => $page,
                'page_size' => $pageSize,
                'total' => $total,
                'total_pages' => ceil($total / $pageSize),
            ],
        ]);
    }

    public function listVersions(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $page = max(1, (int)$request->input('page', 1));
        $pageSize = min(100, max(10, (int)$request->input('page_size', 20)));
        $platform = trim($request->input('platform', ''));

        $where = "1=1";
        $params = [];

        if ($platform) {
            $where .= " AND (platform = ? OR platform = 'all')";
            $params[] = $platform;
        }

        $countSql = "SELECT COUNT(*) as cnt FROM app_versions WHERE {$where}";
        $totalResult = $this->db->fetchOne($countSql, $params);
        $total = (int)($totalResult['cnt'] ?? 0);

        $offset = ($page - 1) * $pageSize;
        $sql = "SELECT * FROM app_versions WHERE {$where} ORDER BY id DESC LIMIT {$offset}, {$pageSize}";
        $versions = $this->db->fetchAll($sql, $params);

        return Response::success([
            'versions' => $versions,
            'pagination' => [
                'page' => $page,
                'page_size' => $pageSize,
                'total' => $total,
                'total_pages' => ceil($total / $pageSize),
            ],
        ]);
    }

    public function createVersion(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $version = trim($request->input('version', ''));
        $platform = trim($request->input('platform', 'all'));
        $downloadUrl = trim($request->input('download_url', ''));
        $fileSize = (int)$request->input('file_size', 0);
        $sha256 = trim($request->input('sha256', ''));
        $releaseNotes = trim($request->input('release_notes', ''));
        $isCritical = (int)$request->input('is_critical', 0);
        $publishedAt = $request->input('published_at', '');

        if (!$version) {
            return Response::error('版本号不能为空', 422, 42201);
        }

        $existing = $this->db->fetchOne(
            "SELECT id FROM app_versions WHERE version = ? AND platform = ?",
            [$version, $platform]
        );
        if ($existing) {
            return Response::error('该版本已存在', 409, 40901);
        }

        $id = $this->db->insert('app_versions', [
            'version' => $version,
            'platform' => $platform,
            'download_url' => $downloadUrl,
            'file_size' => $fileSize,
            'sha256' => $sha256,
            'release_notes' => $releaseNotes,
            'is_critical' => $isCritical,
            'status' => 1,
            'published_at' => $publishedAt ?: date('Y-m-d H:i:s'),
        ]);

        $adminId = $request->param('auth_user_id');
        $this->logAction($adminId, 'admin_create_version', 'app_version', (string)$id, $request->getClientIp());

        return Response::success(['id' => $id], '版本已创建');
    }

    public function updateVersion(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $versionId = (int)$request->param('id');
        $existing = $this->db->fetchOne("SELECT id FROM app_versions WHERE id = ?", [$versionId]);
        if (!$existing) {
            return Response::notFound('版本不存在');
        }

        $updates = [];
        $fields = ['version', 'platform', 'download_url', 'file_size', 'sha256', 'release_notes', 'is_critical', 'status'];
        foreach ($fields as $field) {
            $val = $request->input($field);
            if ($val !== null && $val !== '') {
                $updates[$field] = $val;
            }
        }

        $publishedAt = $request->input('published_at');
        if ($publishedAt !== null && $publishedAt !== '') {
            $updates['published_at'] = $publishedAt;
        } elseif (isset($updates['status']) && $updates['status'] == 1) {
            $updates['published_at'] = date('Y-m-d H:i:s');
        }

        if (empty($updates)) {
            return Response::error('没有需要更新的内容', 422, 42201);
        }

        $this->db->update('app_versions', $updates, 'id = ?', [$versionId]);

        $adminId = $request->param('auth_user_id');
        $this->logAction($adminId, 'admin_update_version', 'app_version', (string)$versionId, $request->getClientIp());

        return Response::success(null, '版本已更新');
    }

    public function deleteVersion(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $versionId = (int)$request->param('id');
        $existing = $this->db->fetchOne("SELECT id FROM app_versions WHERE id = ?", [$versionId]);
        if (!$existing) {
            return Response::notFound('版本不存在');
        }

        $this->db->delete('app_versions', 'id = ?', [$versionId]);

        $adminId = $request->param('auth_user_id');
        $this->logAction($adminId, 'admin_delete_version', 'app_version', (string)$versionId, $request->getClientIp());

        return Response::success(null, '版本已删除');
    }

    public function listAnnouncements(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $page = max(1, (int)$request->input('page', 1));
        $pageSize = min(100, max(10, (int)$request->input('page_size', 20)));
        $type = trim($request->input('type', ''));
        $status = $request->input('status', '');

        $where = "1=1";
        $params = [];

        if ($type) {
            $where .= " AND type = ?";
            $params[] = $type;
        }

        if ($status !== '' && $status !== null) {
            $where .= " AND status = ?";
            $params[] = (int)$status;
        }

        $countSql = "SELECT COUNT(*) as cnt FROM announcements WHERE {$where}";
        $totalResult = $this->db->fetchOne($countSql, $params);
        $total = (int)($totalResult['cnt'] ?? 0);

        $offset = ($page - 1) * $pageSize;
        $sql = "SELECT * FROM announcements WHERE {$where} ORDER BY priority DESC, id DESC LIMIT {$offset}, {$pageSize}";
        $announcements = $this->db->fetchAll($sql, $params);

        return Response::success([
            'announcements' => $announcements,
            'pagination' => [
                'page' => $page,
                'page_size' => $pageSize,
                'total' => $total,
                'total_pages' => ceil($total / $pageSize),
            ],
        ]);
    }

    public function createAnnouncement(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $title = trim($request->input('title', ''));
        $content = trim($request->input('content', ''));
        $type = trim($request->input('type', 'info'));
        $icon = trim($request->input('icon', ''));
        $actionText = trim($request->input('action_text', ''));
        $actionUrl = trim($request->input('action_url', ''));
        $isDismissible = (int)$request->input('is_dismissible', 1);
        $priority = (int)$request->input('priority', 0);
        $startDate = $request->input('start_date', '');
        $endDate = $request->input('end_date', '');

        if (!$title) {
            return Response::error('公告标题不能为空', 422, 42201);
        }

        $validTypes = ['info', 'warning', 'success', 'critical'];
        if (!in_array($type, $validTypes)) {
            return Response::error('公告类型无效', 422, 42202);
        }

        $id = $this->db->insert('announcements', [
            'title' => $title,
            'content' => $content,
            'type' => $type,
            'icon' => $icon,
            'action_text' => $actionText,
            'action_url' => $actionUrl,
            'is_dismissible' => $isDismissible,
            'priority' => $priority,
            'start_date' => $startDate ?: null,
            'end_date' => $endDate ?: null,
            'status' => 1,
        ]);

        $adminId = $request->param('auth_user_id');
        $this->logAction($adminId, 'admin_create_announcement', 'announcement', (string)$id, $request->getClientIp());

        return Response::success(['id' => $id], '公告已创建');
    }

    public function updateAnnouncement(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $announcementId = (int)$request->param('id');
        $existing = $this->db->fetchOne("SELECT id FROM announcements WHERE id = ?", [$announcementId]);
        if (!$existing) {
            return Response::notFound('公告不存在');
        }

        $updates = [];
        $fields = ['title', 'content', 'type', 'icon', 'action_text', 'action_url', 'is_dismissible', 'priority', 'start_date', 'end_date', 'status'];
        foreach ($fields as $field) {
            $val = $request->input($field);
            if ($val !== null && $val !== '') {
                $updates[$field] = $val;
            }
        }

        if (empty($updates)) {
            return Response::error('没有需要更新的内容', 422, 42201);
        }

        $this->db->update('announcements', $updates, 'id = ?', [$announcementId]);

        $adminId = $request->param('auth_user_id');
        $this->logAction($adminId, 'admin_update_announcement', 'announcement', (string)$announcementId, $request->getClientIp());

        return Response::success(null, '公告已更新');
    }

    public function deleteAnnouncement(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $announcementId = (int)$request->param('id');
        $existing = $this->db->fetchOne("SELECT id FROM announcements WHERE id = ?", [$announcementId]);
        if (!$existing) {
            return Response::notFound('公告不存在');
        }

        $this->db->delete('user_announcement_dismiss', 'announcement_id = ?', [$announcementId]);
        $this->db->delete('announcements', 'id = ?', [$announcementId]);

        $adminId = $request->param('auth_user_id');
        $this->logAction($adminId, 'admin_delete_announcement', 'announcement', (string)$announcementId, $request->getClientIp());

        return Response::success(null, '公告已删除');
    }

    public function listMessages(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $page = max(1, (int)$request->input('page', 1));
        $pageSize = min(100, max(10, (int)$request->input('page_size', 20)));
        $offset = ($page - 1) * $pageSize;

        $countSql = "SELECT COUNT(*) as cnt FROM realtime_messages";
        $totalResult = $this->db->fetchOne($countSql);
        $total = (int)($totalResult['cnt'] ?? 0);

        $sql = "SELECT rm.*, u.username, u.nickname 
                FROM realtime_messages rm 
                LEFT JOIN users u ON rm.user_id = u.id 
                ORDER BY rm.created_at DESC 
                LIMIT {$offset}, {$pageSize}";
        $messages = $this->db->fetchAll($sql);

        return Response::success([
            'messages' => $messages,
            'pagination' => [
                'page' => $page,
                'page_size' => $pageSize,
                'total' => $total,
                'total_pages' => ceil($total / $pageSize),
            ],
        ]);
    }

    public function getMessageStats(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $total = $this->db->fetchOne("SELECT COUNT(*) as cnt FROM realtime_messages");
        $delivered = $this->db->fetchOne("SELECT COUNT(*) as cnt FROM realtime_messages WHERE delivered_at IS NOT NULL");
        $unread = $this->db->fetchOne("SELECT COUNT(*) as cnt FROM realtime_messages WHERE read_at IS NULL");
        $broadcast = $this->db->fetchOne("SELECT COUNT(*) as cnt FROM realtime_messages WHERE event_type = 'broadcast'");

        return Response::success([
            'total' => (int)($total['cnt'] ?? 0),
            'delivered' => (int)($delivered['cnt'] ?? 0),
            'unread' => (int)($unread['cnt'] ?? 0),
            'broadcast' => (int)($broadcast['cnt'] ?? 0),
        ]);
    }

    public function deleteMessage(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;

        $messageId = (int)$request->param('id');
        $existing = $this->db->fetchOne("SELECT id FROM realtime_messages WHERE id = ?", [$messageId]);
        if (!$existing) {
            return Response::notFound('消息不存在');
        }

        $this->db->delete('realtime_messages', 'id = ?', [$messageId]);

        $adminId = $request->param('auth_user_id');
        $this->logAction($adminId, 'admin_delete_message', 'message', (string)$messageId, $request->getClientIp());

        return Response::success(null, '消息已删除');
    }

    private function logAction($userId, $action, $targetType, $targetId, $ip)
    {
        try {
            $this->db->insert('audit_logs', [
                'user_id' => $userId,
                'action' => $action,
                'target_type' => $targetType,
                'target_id' => $targetId,
                'ip_address' => $ip,
            ]);
        } catch (\Throwable $e) {
        }
    }
}
