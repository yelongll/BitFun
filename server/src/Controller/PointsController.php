<?php

namespace Kongling\Server\Controller;

use Kongling\Server\Core\Request;
use Kongling\Server\Core\Response;
use Kongling\Server\Core\JWT;
use Kongling\Server\Core\Middleware;
use Kongling\Server\Database\Database;

class PointsController
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

    private function getConfig($key, $default = 0)
    {
        $result = $this->db->fetchOne("SELECT config_value FROM point_config WHERE config_key = ?", [$key]);
        return $result ? (int)$result['config_value'] : $default;
    }

    public function balance(Request $request)
    {
        $userId = $request->param('auth_user_id');
        $user = $this->db->fetchOne("SELECT points, total_earned_points FROM users WHERE id = ?", [$userId]);

        if (!$user) {
            return Response::notFound('用户不存在');
        }

        return Response::success([
            'points' => (int)$user['points'],
            'total_earned' => (int)$user['total_earned_points'],
        ]);
    }

    public function records(Request $request)
    {
        $userId = $request->param('auth_user_id');
        $page = max(1, (int)$request->input('page', 1));
        $pageSize = min(50, max(10, (int)$request->input('page_size', 20)));
        $type = $request->input('type', '');

        $where = "user_id = ?";
        $params = [$userId];

        if ($type) {
            $where .= " AND type = ?";
            $params[] = $type;
        }

        $countSql = "SELECT COUNT(*) as cnt FROM point_records WHERE {$where}";
        $totalResult = $this->db->fetchOne($countSql, $params);
        $total = (int)($totalResult['cnt'] ?? 0);

        $offset = ($page - 1) * $pageSize;
        $sql = "SELECT * FROM point_records WHERE {$where} ORDER BY created_at DESC LIMIT {$offset}, {$pageSize}";
        $records = $this->db->fetchAll($sql, $params);

        return Response::success([
            'records' => $records,
            'pagination' => [
                'page' => $page,
                'page_size' => $pageSize,
                'total' => $total,
                'total_pages' => ceil($total / $pageSize),
            ],
        ]);
    }

    public function ranking(Request $request)
    {
        $page = max(1, (int)$request->input('page', 1));
        $pageSize = min(100, max(10, (int)$request->input('page_size', 50)));
        $type = $request->input('type', 'current');

        $orderField = $type === 'total' ? 'total_earned_points' : 'points';

        $offset = ($page - 1) * $pageSize;
        $sql = "SELECT id, username, nickname, avatar_url, points, total_earned_points FROM users WHERE status = 1 ORDER BY {$orderField} DESC, id ASC LIMIT {$offset}, {$pageSize}";
        $users = $this->db->fetchAll($sql);

        $totalResult = $this->db->fetchOne("SELECT COUNT(*) as cnt FROM users WHERE status = 1");
        $total = (int)($totalResult['cnt'] ?? 0);

        $userId = $request->param('auth_user_id');
        $myRank = null;
        if ($userId) {
            $userPoints = $this->db->fetchOne("SELECT {$orderField} as pts FROM users WHERE id = ?", [$userId]);
            if ($userPoints) {
                $rankResult = $this->db->fetchOne(
                    "SELECT COUNT(*) + 1 as rank FROM users WHERE status = 1 AND ({$orderField} > ? OR ({$orderField} = ? AND id < ?))",
                    [$userPoints['pts'], $userPoints['pts'], $userId]
                );
                $myRank = $rankResult ? (int)$rankResult['rank'] : null;
            }
        }

        foreach ($users as $i => &$user) {
            $user['rank'] = $offset + $i + 1;
        }

        return Response::success([
            'ranking' => $users,
            'my_rank' => $myRank,
            'pagination' => [
                'page' => $page,
                'page_size' => $pageSize,
                'total' => $total,
                'total_pages' => ceil($total / $pageSize),
            ],
        ]);
    }

    public function addBuildReward(Request $request)
    {
        $userId = $request->param('auth_user_id');
        $buildId = $request->input('build_id', uniqid('build_'));
        $description = $request->input('description', 'IDE编译');

        $reward = $this->getConfig('build_reward', 1);
        $maxPerDay = $this->getConfig('max_points_per_day', 100);

        $todayEarned = $this->db->fetchOne(
            "SELECT COALESCE(SUM(points), 0) as total FROM point_records WHERE user_id = ? AND type = 'build' AND DATE(created_at) = CURDATE()",
            [$userId]
        );
        $todayTotal = (int)($todayEarned['total'] ?? 0);

        if ($todayTotal >= $maxPerDay) {
            return Response::success([
                'awarded' => false,
                'message' => '今日积分已达上限',
                'points' => 0,
            ]);
        }

        $actualReward = min($reward, $maxPerDay - $todayTotal);

        $result = $this->addPoints($userId, $actualReward, 'build', $description, $buildId);

        return Response::success([
            'awarded' => true,
            'message' => "获得 {$actualReward} 积分",
            'points' => $actualReward,
            'balance' => $result['balance'],
        ]);
    }

    public function addDailyLoginReward(Request $request)
    {
        $userId = $request->param('auth_user_id');

        $todayRecord = $this->db->fetchOne(
            "SELECT id FROM point_records WHERE user_id = ? AND type = 'daily_login' AND DATE(created_at) = CURDATE()",
            [$userId]
        );

        if ($todayRecord) {
            return Response::success([
                'awarded' => false,
                'message' => '今日已领取',
                'points' => 0,
            ]);
        }

        $reward = $this->getConfig('daily_login_reward', 5);
        $result = $this->addPoints($userId, $reward, 'daily_login', '每日登录奖励');

        return Response::success([
            'awarded' => true,
            'message' => "获得 {$reward} 积分",
            'points' => $reward,
            'balance' => $result['balance'],
        ]);
    }

    public function deduct(Request $request)
    {
        $userId = $request->param('auth_user_id');
        $points = (int)$request->input('points', 0);
        $description = $request->input('description', '');
        $relatedId = $request->input('related_id', '');

        if ($points <= 0) {
            return Response::error('扣减积分必须大于0', 422, 42201);
        }

        $user = $this->db->fetchOne("SELECT points FROM users WHERE id = ?", [$userId]);
        if (!$user) {
            return Response::notFound('用户不存在');
        }

        $minPoints = $this->getConfig('min_points_to_deduct', 0);
        if ((int)$user['points'] < $minPoints) {
            return Response::error("积分不足，最低需要 {$minPoints} 积分", 400, 40001);
        }

        if ((int)$user['points'] < $points) {
            return Response::error('积分不足', 400, 40002);
        }

        $result = $this->deductPoints($userId, $points, 'deduct', $description, $relatedId);

        return Response::success([
            'message' => "扣除 {$points} 积分",
            'points' => -$points,
            'balance' => $result['balance'],
        ]);
    }

    private function addPoints($userId, $points, $type, $description = '', $relatedId = '')
    {
        $this->db->beginTransaction();
        try {
            $this->db->execute(
                "UPDATE users SET points = points + ?, total_earned_points = total_earned_points + ? WHERE id = ?",
                [$points, $points, $userId]
            );

            $user = $this->db->fetchOne("SELECT points FROM users WHERE id = ?", [$userId]);
            $balance = (int)$user['points'];

            $this->db->insert('point_records', [
                'user_id' => $userId,
                'points' => $points,
                'balance' => $balance,
                'type' => $type,
                'description' => $description,
                'related_id' => $relatedId,
            ]);

            $this->db->commit();

            return ['balance' => $balance];
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    private function deductPoints($userId, $points, $type, $description = '', $relatedId = '')
    {
        $this->db->beginTransaction();
        try {
            $this->db->execute(
                "UPDATE users SET points = points - ? WHERE id = ?",
                [$points, $userId]
            );

            $user = $this->db->fetchOne("SELECT points FROM users WHERE id = ?", [$userId]);
            $balance = (int)$user['points'];

            $this->db->insert('point_records', [
                'user_id' => $userId,
                'points' => -$points,
                'balance' => $balance,
                'type' => $type,
                'description' => $description,
                'related_id' => $relatedId,
            ]);

            $this->db->commit();

            return ['balance' => $balance];
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function adminAddPoints(Request $request)
    {
        $userId = $request->param('auth_user_id');
        $targetUserId = (int)$request->input('user_id', 0);
        $points = (int)$request->input('points', 0);
        $description = $request->input('description', '管理员赠送');

        if (!$this->isAdmin($userId)) {
            return Response::error('无权限', 403, 40303);
        }

        if ($targetUserId <= 0) {
            return Response::error('用户ID无效', 422, 42201);
        }

        if ($points <= 0) {
            return Response::error('积分必须大于0', 422, 42202);
        }

        $targetUser = $this->db->fetchOne("SELECT id FROM users WHERE id = ?", [$targetUserId]);
        if (!$targetUser) {
            return Response::notFound('用户不存在');
        }

        $result = $this->addPoints($targetUserId, $points, 'admin', $description);

        return Response::success([
            'message' => "已赠送 {$points} 积分",
            'balance' => $result['balance'],
        ]);
    }

    public function adminDeductPoints(Request $request)
    {
        $userId = $request->param('auth_user_id');
        $targetUserId = (int)$request->input('user_id', 0);
        $points = (int)$request->input('points', 0);
        $description = $request->input('description', '管理员扣减');

        if (!$this->isAdmin($userId)) {
            return Response::error('无权限', 403, 40303);
        }

        if ($targetUserId <= 0) {
            return Response::error('用户ID无效', 422, 42201);
        }

        if ($points <= 0) {
            return Response::error('积分必须大于0', 422, 42202);
        }

        $targetUser = $this->db->fetchOne("SELECT points FROM users WHERE id = ?", [$targetUserId]);
        if (!$targetUser) {
            return Response::notFound('用户不存在');
        }

        if ((int)$targetUser['points'] < $points) {
            return Response::error('用户积分不足', 400, 40002);
        }

        $result = $this->deductPoints($targetUserId, $points, 'admin', $description);

        return Response::success([
            'message' => "已扣除 {$points} 积分",
            'balance' => $result['balance'],
        ]);
    }

    public function adminGetConfigs(Request $request)
    {
        $userId = $request->param('auth_user_id');
        if (!$this->isAdmin($userId)) {
            return Response::error('无权限', 403, 40303);
        }

        $configs = $this->db->fetchAll("SELECT * FROM point_config ORDER BY id");
        return Response::success(['configs' => $configs]);
    }

    public function adminUpdateConfig(Request $request)
    {
        $userId = $request->param('auth_user_id');
        if (!$this->isAdmin($userId)) {
            return Response::error('无权限', 403, 40303);
        }

        $key = trim($request->input('key', ''));
        $value = (int)$request->input('value', 0);

        if (!$key) {
            return Response::error('配置键不能为空', 422, 42201);
        }

        $this->db->update('point_config', ['config_value' => $value], 'config_key = ?', [$key]);

        return Response::success(null, '配置已更新');
    }

    private function isAdmin($userId)
    {
        $user = $this->db->fetchOne("SELECT role FROM users WHERE id = ?", [$userId]);
        return $user && isset($user['role']) && $user['role'] === 'admin';
    }
}
