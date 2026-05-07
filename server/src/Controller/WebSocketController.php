<?php

namespace Kongling\Server\Controller;

use Kongling\Server\Core\Request;
use Kongling\Server\Core\Response;
use Kongling\Server\Database\Database;

class WebSocketController
{
    private $db;
    private $config;

    public function __construct(Database $db, array $config)
    {
        $this->db = $db;
        $this->config = $config;
    }

    public function subscribe(Request $request)
    {
        $userId = $request->param('auth_user_id');
        
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        header('X-Accel-Buffering: no');
        
        @ini_set('zlib.output_compression', 0);
        @ini_set('implicit_flush', 1);
        
        $lastEventId = isset($_SERVER['HTTP_LAST_EVENT_ID']) ? (int)$_SERVER['HTTP_LAST_EVENT_ID'] : 0;
        
        $this->sendEvent('connected', ['status' => 'connected', 'user_id' => $userId]);
        
        $startTime = time();
        $timeout = 300;
        $heartbeatInterval = 30;
        $lastHeartbeat = time();
        
        while (true) {
            if (connection_aborted()) {
                break;
            }
            
            if (time() - $startTime > $timeout) {
                $this->sendEvent('timeout', ['message' => 'Connection timeout']);
                break;
            }
            
            if (time() - $lastHeartbeat >= $heartbeatInterval) {
                $this->sendEvent('heartbeat', ['time' => time()]);
                $lastHeartbeat = time();
            }
            
            $messages = $this->getPendingMessages($userId, $lastEventId);
            
            foreach ($messages as $message) {
                $this->sendEvent($message['event_type'], json_decode($message['data'], true), $message['id']);
                $lastEventId = $message['id'];
                $this->markMessageDelivered($message['id'], $userId);
            }
            
            if (ob_get_level() > 0) {
                ob_flush();
            }
            flush();
            
            sleep(1);
        }
        
        return null;
    }

    public function sendNotification(Request $request)
    {
        $userId = $request->param('auth_user_id');
        
        $targetUserId = $request->input('user_id');
        $eventType = $request->input('event_type', 'notification');
        $data = $request->input('data', []);
        
        if (!$targetUserId) {
            return Response::error('缺少目标用户ID', 422, 42201);
        }
        
        if ($targetUserId !== $userId) {
            $user = $this->db->fetchOne(
                "SELECT role FROM users WHERE id = ?",
                [$userId]
            );
            if (!$user || $user['role'] !== 'admin') {
                return Response::error('无权发送消息给其他用户', 403, 40301);
            }
        }
        
        $messageId = $this->db->insert('realtime_messages', [
            'user_id' => $targetUserId,
            'event_type' => $eventType,
            'data' => json_encode($data, JSON_UNESCAPED_UNICODE),
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        
        return Response::success([
            'message_id' => $messageId,
            'event_type' => $eventType,
            'data' => $data,
        ], '消息已发送');
    }

    public function broadcastNotification(Request $request)
    {
        $userId = $request->param('auth_user_id');
        
        $user = $this->db->fetchOne(
            "SELECT role FROM users WHERE id = ?",
            [$userId]
        );
        if (!$user || $user['role'] !== 'admin') {
            return Response::error('只有管理员可以发送广播消息', 403, 40301);
        }
        
        $eventType = $request->input('event_type', 'broadcast');
        $data = $request->input('data', []);
        
        $users = $this->db->fetchAll("SELECT id FROM users WHERE status = 1");
        
        $count = 0;
        foreach ($users as $user) {
            $this->db->insert('realtime_messages', [
                'user_id' => $user['id'],
                'event_type' => $eventType,
                'data' => json_encode($data, JSON_UNESCAPED_UNICODE),
                'created_at' => date('Y-m-d H:i:s'),
            ]);
            $count++;
        }
        
        return Response::success([
            'recipients' => $count,
            'event_type' => $eventType,
            'data' => $data,
        ], '广播消息已发送');
    }

    public function getUnreadCount(Request $request)
    {
        $userId = $request->param('auth_user_id');
        
        $count = $this->db->fetchOne(
            "SELECT COUNT(*) as cnt FROM realtime_messages WHERE user_id = ? AND delivered_at IS NULL",
            [$userId]
        );
        
        return Response::success([
            'unread_count' => (int)($count['cnt'] ?? 0),
        ]);
    }

    private function sendEvent($event, $data, $id = null)
    {
        if ($id !== null) {
            echo "id: {$id}\n";
        }
        echo "event: {$event}\n";
        echo "data: " . json_encode($data, JSON_UNESCAPED_UNICODE) . "\n\n";
    }

    private function getPendingMessages($userId, $lastEventId)
    {
        $sql = "SELECT id, event_type, data, created_at FROM realtime_messages WHERE user_id = ? AND delivered_at IS NULL";
        $params = [$userId];
        
        if ($lastEventId > 0) {
            $sql .= " AND id > ?";
            $params[] = $lastEventId;
        }
        
        $sql .= " ORDER BY id ASC LIMIT 50";
        
        return $this->db->fetchAll($sql, $params);
    }

    private function markMessageDelivered($messageId, $userId)
    {
        $this->db->update(
            'realtime_messages',
            ['delivered_at' => date('Y-m-d H:i:s')],
            'id = ? AND user_id = ?',
            [$messageId, $userId]
        );
    }
}
