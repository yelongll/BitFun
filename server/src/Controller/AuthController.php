<?php

namespace Kongling\Server\Controller;

use Kongling\Server\Core\Request;
use Kongling\Server\Core\Response;
use Kongling\Server\Core\JWT;
use Kongling\Server\Core\Middleware;
use Kongling\Server\Database\Database;

class AuthController
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

    public function register(Request $request)
    {
        $rlResult = $this->middleware->rateLimit($request, 'register', $this->config['security']['rate_limit_register_per_hour'], 3600);
        if ($rlResult) return $rlResult;

        $registerEnabled = $this->db->fetchOne("SELECT config_value FROM system_config WHERE config_key = 'register_enabled'");
        if ($registerEnabled && !$registerEnabled['config_value']) {
            return Response::error('注册功能暂未开放', 403, 40301);
        }

        $username = trim($request->input('username', ''));
        $email = trim($request->input('email', ''));
        $password = $request->input('password', '');
        $confirmPassword = $request->input('confirm_password', '');

        if (!$username || !$email || !$password) {
            return Response::error('用户名、邮箱和密码不能为空', 422, 42201);
        }

        if (mb_strlen($username) < 3 || mb_strlen($username) > 32) {
            return Response::error('用户名长度需在3-32个字符之间', 422, 42202);
        }

        if (!preg_match('/^[a-zA-Z0-9_\x{4e00}-\x{9fa5}]+$/u', $username)) {
            return Response::error('用户名只能包含字母、数字、下划线和中文', 422, 42203);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return Response::error('邮箱格式不正确', 422, 42204);
        }

        if (mb_strlen($password) < 6) {
            return Response::error('密码长度不能少于6位', 422, 42205);
        }

        if ($password !== $confirmPassword) {
            return Response::error('两次输入的密码不一致', 422, 42206);
        }

        $existing = $this->db->fetchOne("SELECT id FROM users WHERE username = ? OR email = ?", [$username, $email]);
        if ($existing) {
            return Response::error('用户名或邮箱已被注册', 409, 40901);
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => $this->config['security']['bcrypt_cost']]);

        try {
            $this->db->beginTransaction();

            $userId = $this->db->insert('users', [
                'username' => $username,
                'email' => $email,
                'password_hash' => $passwordHash,
                'nickname' => $username,
                'status' => 1,
            ]);

            $this->logAction($userId, 'register', 'user', (string)$userId, $request->getClientIp());

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            return Response::serverError('注册失败，请稍后再试');
        }

        $tokens = $this->generateTokens($userId, $request);

        return Response::success([
            'user' => $this->getUserInfo($userId),
            'tokens' => $tokens,
        ], '注册成功');
    }

    public function login(Request $request)
    {
        $rlResult = $this->middleware->rateLimit($request, 'login', $this->config['security']['rate_limit_login_per_minute'], 60);
        if ($rlResult) return $rlResult;

        $login = trim($request->input('login', ''));
        $password = $request->input('password', '');

        if (!$login || !$password) {
            return Response::error('请输入用户名/邮箱和密码', 422, 42201);
        }

        $user = $this->db->fetchOne(
            "SELECT id, username, email, password_hash, nickname, avatar_url, status, role, points, total_earned_points, email_verified_at, created_at FROM users WHERE username = ? OR email = ?",
            [$login, $login]
        );

        if (!$user || !password_verify($password, $user['password_hash'])) {
            return Response::error('用户名或密码错误', 401, 40101);
        }

        if ($user['status'] !== 1) {
            return Response::error('账号已被禁用，请联系管理员', 403, 40302);
        }

        $maxDevices = $this->config['security']['max_devices_per_user'];
        $this->enforceMaxDevices($user['id'], $maxDevices);

        $this->db->execute(
            "UPDATE users SET last_login_at = ?, last_login_ip = ?, login_count = login_count + 1 WHERE id = ?",
            [date('Y-m-d H:i:s'), $request->getClientIp(), $user['id']]
        );

        $tokens = $this->generateTokens($user['id'], $request);

        $this->logAction($user['id'], 'login', 'user', (string)$user['id'], $request->getClientIp());

        return Response::success([
            'user' => [
                'id' => (int)$user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'nickname' => $user['nickname'],
                'avatar_url' => $user['avatar_url'],
                'status' => (int)$user['status'],
                'role' => $user['role'] ?? 'user',
                'points' => (int)($user['points'] ?? 0),
                'total_earned_points' => (int)($user['total_earned_points'] ?? 0),
                'email_verified' => $user['email_verified_at'] !== null,
                'last_login_at' => date('Y-m-d H:i:s'),
                'last_login_ip' => $request->getClientIp(),
                'created_at' => $user['created_at'] ?? '',
            ],
            'tokens' => $tokens,
        ], '登录成功');
    }

    public function logout(Request $request)
    {
        $token = $request->getBearerToken();
        if ($token) {
            $payload = $this->jwt->verify($token);
            if ($payload) {
                $jti = isset($payload['jti']) ? $payload['jti'] : '';
                $exp = isset($payload['exp']) ? $payload['exp'] : 0;
                $userId = isset($payload['sub']) ? (int)$payload['sub'] : 0;

                if ($jti) {
                    $this->db->insert('token_blacklist', [
                        'jti' => $jti,
                        'user_id' => $userId,
                        'expired_at' => date('Y-m-d H:i:s', $exp),
                    ]);
                }

                $deviceId = $request->getDeviceId();
                if ($deviceId && $deviceId !== 'unknown') {
                    $this->db->delete('user_devices', 'user_id = ? AND device_id = ?', [$userId, $deviceId]);
                }

                $this->logAction($userId, 'logout', 'user', (string)$userId, $request->getClientIp());
            }
        }

        return Response::success(null, '已退出登录');
    }

    public function refresh(Request $request)
    {
        $refreshToken = $request->input('refresh_token', '');
        if (!$refreshToken) {
            return Response::error('缺少刷新令牌', 422, 42201);
        }

        $payload = $this->jwt->verify($refreshToken);
        if (!$payload) {
            return Response::unauthorized('刷新令牌无效或已过期');
        }

        $type = isset($payload['type']) ? $payload['type'] : '';
        if ($type !== 'refresh') {
            return Response::unauthorized('令牌类型错误');
        }

        $deviceId = isset($payload['device_id']) ? $payload['device_id'] : '';
        $userId = (int)$payload['sub'];

        $device = $this->db->fetchOne(
            "SELECT id FROM user_devices WHERE user_id = ? AND device_id = ?",
            [$userId, $deviceId]
        );

        if (!$device) {
            return Response::unauthorized('设备未授权');
        }

        $oldJti = isset($payload['jti']) ? $payload['jti'] : '';
        if ($oldJti) {
            $this->db->insert('token_blacklist', [
                'jti' => $oldJti,
                'user_id' => $userId,
                'expired_at' => date('Y-m-d H:i:s', $payload['exp']),
            ]);
        }

        $tokens = $this->generateTokens($userId, $request);

        return Response::success(['tokens' => $tokens], '令牌已刷新');
    }

    public function me(Request $request)
    {
        $userId = $request->param('auth_user_id');
        $user = $this->getUserInfo($userId);

        if (!$user) {
            return Response::notFound('用户不存在');
        }

        return Response::success(['user' => $user]);
    }

    public function updateProfile(Request $request)
    {
        $userId = $request->param('auth_user_id');

        $nickname = trim($request->input('nickname', ''));
        $avatarUrl = trim($request->input('avatar_url', ''));

        $updates = [];
        if ($nickname) $updates['nickname'] = $nickname;
        if ($avatarUrl) $updates['avatar_url'] = $avatarUrl;

        if (empty($updates)) {
            return Response::error('没有需要更新的内容', 422, 42201);
        }

        $this->db->update('users', $updates, 'id = ?', [$userId]);

        $this->logAction($userId, 'update_profile', 'user', (string)$userId, $request->getClientIp());

        return Response::success(['user' => $this->getUserInfo($userId)], '更新成功');
    }

    public function changePassword(Request $request)
    {
        $userId = $request->param('auth_user_id');
        $oldPassword = $request->input('old_password', '');
        $newPassword = $request->input('new_password', '');
        $confirmPassword = $request->input('confirm_password', '');

        if (!$oldPassword || !$newPassword) {
            return Response::error('请输入旧密码和新密码', 422, 42201);
        }

        if (mb_strlen($newPassword) < 6) {
            return Response::error('新密码长度不能少于6位', 422, 42205);
        }

        if ($newPassword !== $confirmPassword) {
            return Response::error('两次输入的新密码不一致', 422, 42206);
        }

        $user = $this->db->fetchOne("SELECT password_hash FROM users WHERE id = ?", [$userId]);
        if (!$user || !password_verify($oldPassword, $user['password_hash'])) {
            return Response::error('旧密码错误', 401, 40102);
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => $this->config['security']['bcrypt_cost']]);
        $this->db->update('users', ['password_hash' => $newHash], 'id = ?', [$userId]);

        $this->logAction($userId, 'change_password', 'user', (string)$userId, $request->getClientIp());

        return Response::success(null, '密码修改成功');
    }

    public function devices(Request $request)
    {
        $userId = $request->param('auth_user_id');

        $devices = $this->db->fetchAll(
            "SELECT device_id, device_name, device_type, platform, app_version, ip_address, last_active_at, created_at FROM user_devices WHERE user_id = ? ORDER BY last_active_at DESC",
            [$userId]
        );

        return Response::success(['devices' => $devices]);
    }

    public function removeDevice(Request $request)
    {
        $userId = $request->param('auth_user_id');
        $deviceId = $request->input('device_id', '');

        if (!$deviceId) {
            return Response::error('缺少设备ID', 422, 42201);
        }

        $deleted = $this->db->delete('user_devices', 'user_id = ? AND device_id = ?', [$userId, $deviceId]);

        if ($deleted === 0) {
            return Response::notFound('设备不存在');
        }

        $this->logAction($userId, 'remove_device', 'device', $deviceId, $request->getClientIp());

        return Response::success(null, '设备已移除');
    }

    private function generateTokens($userId, Request $request)
    {
        $deviceId = $request->getDeviceId();
        $deviceName = $request->getDeviceName();
        $platform = $request->getPlatform();
        $appVersion = $request->getAppVersion();

        $accessToken = $this->jwt->generateAccessToken($userId);
        $refreshToken = $this->jwt->generateRefreshToken($userId, $deviceId);

        $refreshTokenHash = hash('sha256', $refreshToken['token']);

        $existing = $this->db->fetchOne(
            "SELECT id FROM user_devices WHERE user_id = ? AND device_id = ?",
            [$userId, $deviceId]
        );

        $deviceType = (strpos($platform, 'win') !== false || strpos($platform, 'mac') !== false || strpos($platform, 'linux') !== false) ? 'desktop' : 'web';

        if ($existing) {
            $this->db->update('user_devices', [
                'device_name' => $deviceName,
                'device_type' => $deviceType,
                'platform' => $platform,
                'app_version' => $appVersion,
                'refresh_token_hash' => $refreshTokenHash,
                'last_active_at' => date('Y-m-d H:i:s'),
                'ip_address' => $request->getClientIp(),
            ], 'user_id = ? AND device_id = ?', [$userId, $deviceId]);
        } else {
            $this->db->insert('user_devices', [
                'user_id' => $userId,
                'device_id' => $deviceId,
                'device_name' => $deviceName,
                'device_type' => $deviceType,
                'platform' => $platform,
                'app_version' => $appVersion,
                'refresh_token_hash' => $refreshTokenHash,
                'ip_address' => $request->getClientIp(),
            ]);
        }

        return [
            'access_token' => $accessToken['token'],
            'refresh_token' => $refreshToken['token'],
            'token_type' => 'Bearer',
            'expires_in' => $accessToken['expires_in'],
        ];
    }

    private function enforceMaxDevices($userId, $maxDevices)
    {
        $count = $this->db->fetchOne(
            "SELECT COUNT(*) as cnt FROM user_devices WHERE user_id = ?",
            [$userId]
        );

        $cnt = isset($count['cnt']) ? (int)$count['cnt'] : 0;
        if ($cnt >= $maxDevices) {
            $limit = $cnt - $maxDevices + 1;
            $oldest = $this->db->fetchAll(
                "SELECT device_id FROM user_devices WHERE user_id = ? ORDER BY last_active_at ASC LIMIT ?",
                [$userId, $limit]
            );

            foreach ($oldest as $device) {
                $this->db->delete('user_devices', 'user_id = ? AND device_id = ?', [$userId, $device['device_id']]);
            }
        }
    }

    private function getUserInfo($userId)
    {
        $user = $this->db->fetchOne(
            "SELECT id, username, email, nickname, avatar_url, status, role, points, total_earned_points, email_verified_at, last_login_at, last_login_ip, created_at FROM users WHERE id = ?",
            [$userId]
        );

        if (!$user) return null;

        return [
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'nickname' => $user['nickname'],
            'avatar_url' => $user['avatar_url'],
            'status' => (int)$user['status'],
            'role' => $user['role'] ?? 'user',
            'points' => (int)($user['points'] ?? 0),
            'total_earned_points' => (int)($user['total_earned_points'] ?? 0),
            'email_verified' => $user['email_verified_at'] !== null,
            'last_login_at' => $user['last_login_at'],
            'last_login_ip' => $user['last_login_ip'],
            'created_at' => $user['created_at'],
        ];
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
