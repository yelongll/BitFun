<?php

namespace Kongling\Server\Core;

class JWT
{
    private $secret;
    private $algorithm;
    private $issuer;
    private $accessTtl;
    private $refreshTtl;

    public function __construct(array $config)
    {
        $this->secret = isset($config['secret']) && $config['secret'] ? $config['secret'] : $this->generateSecret();
        $this->algorithm = isset($config['algorithm']) ? $config['algorithm'] : 'HS256';
        $this->issuer = isset($config['issuer']) ? $config['issuer'] : 'kongling-ide-server';
        $this->accessTtl = isset($config['access_ttl']) ? (int)$config['access_ttl'] : 3600;
        $this->refreshTtl = isset($config['refresh_ttl']) ? (int)$config['refresh_ttl'] : 2592000;
    }

    private function generateSecret()
    {
        return bin2hex(random_bytes(32));
    }

    public function generateAccessToken($userId, array $extra = [])
    {
        $jti = bin2hex(random_bytes(16));
        $now = time();
        $exp = $now + $this->accessTtl;

        $payload = [
            'iss' => $this->issuer,
            'sub' => (string)$userId,
            'jti' => $jti,
            'iat' => $now,
            'exp' => $exp,
            'type' => 'access',
        ];

        if (!empty($extra)) {
            $payload['extra'] = $extra;
        }

        return [
            'token' => $this->encode($payload),
            'expires_in' => $this->accessTtl,
            'jti' => $jti,
        ];
    }

    public function generateRefreshToken($userId, $deviceId)
    {
        $jti = bin2hex(random_bytes(16));
        $now = time();
        $exp = $now + $this->refreshTtl;

        $payload = [
            'iss' => $this->issuer,
            'sub' => (string)$userId,
            'jti' => $jti,
            'iat' => $now,
            'exp' => $exp,
            'type' => 'refresh',
            'device_id' => $deviceId,
        ];

        return [
            'token' => $this->encode($payload),
            'expires_in' => $this->refreshTtl,
            'jti' => $jti,
        ];
    }

    public function verify($token)
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        $headerB64 = $parts[0];
        $payloadB64 = $parts[1];
        $signatureB64 = $parts[2];

        $expectedSignature = $this->computeSignature($headerB64, $payloadB64);
        if (!hash_equals($expectedSignature, $this->base64UrlDecode($signatureB64))) {
            return null;
        }

        $payload = json_decode($this->base64UrlDecode($payloadB64), true);
        if (!$payload) {
            return null;
        }

        if (!isset($payload['exp']) || $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    public function getJti($token)
    {
        $payload = $this->verify($token);
        return isset($payload['jti']) ? $payload['jti'] : null;
    }

    public function getAccessTtl()
    {
        return $this->accessTtl;
    }

    public function getRefreshTtl()
    {
        return $this->refreshTtl;
    }

    private function encode(array $payload)
    {
        $header = [
            'alg' => $this->algorithm,
            'typ' => 'JWT',
        ];

        $headerB64 = $this->base64UrlEncode(json_encode($header));
        $payloadB64 = $this->base64UrlEncode(json_encode($payload));
        $signature = $this->computeSignature($headerB64, $payloadB64);
        $signatureB64 = $this->base64UrlEncode($signature);

        return "$headerB64.$payloadB64.$signatureB64";
    }

    private function computeSignature($headerB64, $payloadB64)
    {
        $data = "$headerB64.$payloadB64";
        return hash_hmac('sha256', $data, $this->secret, true);
    }

    private function base64UrlEncode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode($data)
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
