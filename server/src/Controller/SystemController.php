<?php

namespace Kongling\Server\Controller;

use Kongling\Server\Core\Request;
use Kongling\Server\Core\Response;
use Kongling\Server\Database\Database;

class SystemController
{
    private $db;
    private $config;

    public function __construct(Database $db, array $config)
    {
        $this->db = $db;
        $this->config = $config;
    }

    public function health()
    {
        $dbOk = false;
        try {
            $this->db->fetchOne("SELECT 1");
            $dbOk = true;
        } catch (\Throwable $e) {
        }

        return Response::json([
            'success' => true,
            'data' => [
                'status' => $dbOk ? 'healthy' : 'degraded',
                'app' => $this->config['app']['name'],
                'version' => $this->config['app']['version'],
                'database' => $dbOk ? 'connected' : 'disconnected',
                'timestamp' => date('c'),
            ],
        ]);
    }

    public function version()
    {
        return Response::success([
            'app' => $this->config['app']['name'],
            'version' => $this->config['app']['version'],
            'api_version' => 'v1',
        ]);
    }
}
