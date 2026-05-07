<?php
return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'database' => 'ide',
        'username' => 'ide',
        'password' => '2yzfTsNydn6apHaK',
        'charset' => 'utf8mb4',
        'prefix' => '',
    ],

    'jwt' => [
        'secret' => 'kongling-jwt-secret-key-2024-please-change-this',
        'access_ttl' => 3600,
        'refresh_ttl' => 2592000,
        'issuer' => 'kongling-ide-server',
        'algorithm' => 'HS256',
    ],

    'app' => [
        'debug' => true,
        'url' => 'http://localhost:8080',
        'name' => '空灵语言',
        'version' => '1.0.0',
    ],

    'security' => [
        'bcrypt_cost' => 12,
        'max_devices_per_user' => 5,
        'rate_limit_login_per_minute' => 10,
        'rate_limit_register_per_hour' => 5,
    ],

    'cors' => [
        'allowed_origins' => ['*'],
        'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization', 'X-Device-Id', 'X-Device-Name', 'X-Platform', 'X-App-Version'],
        'max_age' => 86400,
    ],

    'mail' => [
        'enabled' => false,
        'smtp_host' => '',
        'smtp_port' => 587,
        'smtp_user' => '',
        'smtp_pass' => '',
        'from_email' => 'noreply@kongling.dev',
        'from_name' => '空灵语言',
    ],
];
