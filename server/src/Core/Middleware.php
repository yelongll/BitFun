<?php

namespace Kongling\Server\Core;

use Kongling\Server\Database\Database;

class Middleware
{
    private $config;
    private $jwt;
    private $db;

    public function __construct(array $config, JWT $jwt, Database $db)
    {
        $this->config = $config;
        $this->jwt = $jwt;
        $this->db = $db;
    }

    public function cors(Request $request, Response $response)
    {
        $origin = $request->getHeader('Origin');
        $origin = $origin !== null ? $origin : '';
        $corsConfig = isset($this->config['cors']) ? $this->config['cors'] : [];
        $allowedOrigins = isset($corsConfig['allowed_origins']) ? $corsConfig['allowed_origins'] : [];

        if (in_array($origin, $allowedOrigins) || in_array('*', $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
        }

        $allowedMethods = isset($corsConfig['allowed_methods']) ? $corsConfig['allowed_methods'] : ['GET', 'POST', 'OPTIONS'];
        $allowedHeaders = isset($corsConfig['allowed_headers']) ? $corsConfig['allowed_headers'] : ['Content-Type', 'Authorization'];
        $maxAge = isset($corsConfig['max_age']) ? $corsConfig['max_age'] : 86400;

        header('Access-Control-Allow-Methods: ' . implode(', ', $allowedMethods));
        header('Access-Control-Allow-Headers: ' . implode(', ', $allowedHeaders));
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: ' . $maxAge);

        if ($request->getMethod() === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        return null;
    }

    public function auth(Request $request)
    {
        $token = $request->getBearerToken();
        if (!$token) {
            return Response::unauthorized('缺少认证令牌');
        }

        $payload = $this->jwt->verify($token);
        if (!$payload) {
            return Response::unauthorized('令牌无效或已过期');
        }

        $type = isset($payload['type']) ? $payload['type'] : '';
        if ($type !== 'access') {
            return Response::unauthorized('令牌类型错误');
        }

        $jti = isset($payload['jti']) ? $payload['jti'] : '';
        if ($this->isTokenBlacklisted($jti)) {
            return Response::unauthorized('令牌已失效');
        }

        $userId = (int)$payload['sub'];
        $request->setParams(array_merge($request->getParams(), [
            'auth_user_id' => $userId,
            'auth_jti' => $jti,
            'auth_payload' => $payload,
        ]));

        return null;
    }

    public function rateLimit(Request $request, $key, $maxAttempts, $perSeconds)
    {
        $ip = $request->getClientIp();
        $cacheKey = "rate_limit:{$key}:{$ip}";

        $attempts = $this->getRateLimitCount($cacheKey, $perSeconds);
        if ($attempts >= $maxAttempts) {
            return Response::tooManyRequests();
        }

        $this->incrementRateLimit($cacheKey, $perSeconds);
        return null;
    }

    private function isTokenBlacklisted($jti)
    {
        try {
            $row = $this->db->fetchOne(
                "SELECT id FROM token_blacklist WHERE jti = ? AND expired_at > NOW()",
                [$jti]
            );
            return $row !== null;
        } catch (\Throwable $e) {
            return false;
        }
    }

    private function getRateLimitCount($key, $window)
    {
        $cacheFile = sys_get_temp_dir() . '/kongling_rl_' . md5($key);
        if (!file_exists($cacheFile)) {
            return 0;
        }

        $data = json_decode(file_get_contents($cacheFile), true);
        if (!$data || (isset($data['reset_at']) ? $data['reset_at'] : 0) < time()) {
            @unlink($cacheFile);
            return 0;
        }

        return isset($data['count']) ? $data['count'] : 0;
    }

    private function incrementRateLimit($key, $window)
    {
        $cacheFile = sys_get_temp_dir() . '/kongling_rl_' . md5($key);
        $data = [
            'count' => 1,
            'reset_at' => time() + $window,
        ];

        if (file_exists($cacheFile)) {
            $existing = json_decode(file_get_contents($cacheFile), true);
            if ($existing && (isset($existing['reset_at']) ? $existing['reset_at'] : 0) >= time()) {
                $data['count'] = (isset($existing['count']) ? $existing['count'] : 0) + 1;
                $data['reset_at'] = $existing['reset_at'];
            }
        }

        file_put_contents($cacheFile, json_encode($data), LOCK_EX);
    }
}
