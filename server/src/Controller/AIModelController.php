<?php

namespace Kongling\Server\Controller;

use Kongling\Server\Core\Request;
use Kongling\Server\Core\Response;
use Kongling\Server\Core\JWT;
use Kongling\Server\Core\Middleware;
use Kongling\Server\Database\Database;

class AIModelController
{
    private $db;
    private $config;

    public function __construct(Database $db, array $config)
    {
        $this->db = $db;
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

    public function list(Request $request)
    {
        $userId = $request->param('auth_user_id');
        
        $models = $this->db->fetchAll(
            "SELECT * FROM ai_models WHERE enabled = 1 ORDER BY sort_order ASC, created_at DESC"
        );
        
        $result = array_map(function($model) use ($userId) {
            $allowedUsers = $model['allowed_users'] ? json_decode($model['allowed_users'], true) : null;
            
            if (is_array($allowedUsers) && count($allowedUsers) === 0) {
                $allowedUsers = null;
            }
            
            if ($allowedUsers !== null && !in_array($userId, $allowedUsers)) {
                return null;
            }
            
            return [
                'id' => (int)$model['id'],
                'name' => $model['name'],
                'provider' => $model['provider'],
                'model_name' => $model['model_name'],
                'base_url' => $model['base_url'],
                'api_format' => $model['api_format'] ?: 'openai',
                'api_key' => $model['api_key'] ?? '',
                'context_window' => (int)$model['context_window'],
                'max_tokens' => (int)$model['max_tokens'],
                'temperature' => $model['temperature'] !== null ? (float)$model['temperature'] : null,
                'enabled' => (bool)$model['enabled'],
                'is_public' => (bool)$model['is_public'],
                'category' => $model['category'] ?: 'general_chat',
                'capabilities' => (function($caps) {
                    if (!$caps) return ['text_chat'];
                    $decoded = json_decode($caps, true);
                    if (is_array($decoded)) return $decoded;
                    return ['text_chat'];
                })($model['capabilities']),
                'reasoning_mode' => $model['reasoning_mode'] ?: 'default',
                'reasoning_effort' => $model['reasoning_effort'],
                'requires_api_key' => (bool)($model['requires_api_key'] ?? true),
                'is_new' => (bool)($model['is_new']),
                'allowed_users' => $model['allowed_users'] ? json_decode($model['allowed_users'], true) : null,
                'custom_headers' => $model['custom_headers'] ? json_decode($model['custom_headers'], true) : null,
                'description' => $model['description'],
                'icon' => $model['icon'],
            ];
        }, $models);
        
        $result = array_filter($result, fn($m) => $m !== null);
        
        return Response::success(['models' => array_values($result)]);
    }
    
    public function adminList(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;
        
        $page = (int)$request->input('page', 1);
        $pageSize = (int)$request->input('page_size', 20);
        $search = $request->input('search', '');
        $provider = $request->input('provider', '');
        
        $offset = ($page - 1) * $pageSize;
        $params = [];
        $where = "1=1";
        
        if ($search) {
            $where .= " AND (name LIKE ? OR model_name LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        if ($provider) {
            $where .= " AND provider = ?";
            $params[] = $provider;
        }
        
        $total = $this->db->fetchOne("SELECT COUNT(*) as count FROM ai_models WHERE $where", $params)['count'];
        
        $params[] = $offset;
        $params[] = $pageSize;
        $models = $this->db->fetchAll("SELECT * FROM ai_models WHERE $where ORDER BY sort_order ASC, created_at DESC LIMIT ?, ?", $params);
        
        $result = array_map(function($model) {
            return [
                'id' => (int)$model['id'],
                'name' => $model['name'],
                'provider' => $model['provider'],
                'model_name' => $model['model_name'],
                'base_url' => $model['base_url'],
                'api_format' => $model['api_format'] ?: 'openai',
                'api_key' => $model['api_key'] ?? '',
                'context_window' => (int)$model['context_window'],
                'max_tokens' => (int)$model['max_tokens'],
                'temperature' => $model['temperature'] !== null ? (float)$model['temperature'] : null,
                'enabled' => (bool)$model['enabled'],
                'is_public' => (bool)$model['is_public'],
                'category' => $model['category'] ?: 'general_chat',
                'capabilities' => (function($caps) {
                    if (!$caps) return ['text_chat'];
                    $decoded = json_decode($caps, true);
                    if (is_array($decoded)) return $decoded;
                    return ['text_chat'];
                })($model['capabilities']),
                'reasoning_mode' => $model['reasoning_mode'] ?: 'default',
                'reasoning_effort' => $model['reasoning_effort'],
                'requires_api_key' => (bool)($model['requires_api_key'] ?? true),
                'is_new' => (bool)($model['is_new']),
                'allowed_users' => $model['allowed_users'] ? json_decode($model['allowed_users'], true) : null,
                'custom_headers' => $model['custom_headers'] ? json_decode($model['custom_headers'], true) : null,
                'description' => $model['description'],
                'icon' => $model['icon'],
                'sort_order' => (int)$model['sort_order'],
                'created_at' => $model['created_at'],
            ];
        }, $models);
        
        return Response::success([
            'models' => $result,
            'pagination' => [
                'page' => $page,
                'page_size' => $pageSize,
                'total' => (int)$total,
                'total_pages' => ceil($total / $pageSize),
            ],
        ]);
    }
    
    public function create(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;
        
        $name = trim($request->input('name', ''));
        $provider = trim($request->input('provider', ''));
        $modelName = trim($request->input('model_name', ''));
        $baseUrl = trim($request->input('base_url', ''));
        $apiFormat = trim($request->input('api_format', 'openai'));
        $apiKey = $request->input('api_key', '');
        $contextWindow = (int)$request->input('context_window', 4096);
        $maxTokens = (int)$request->input('max_tokens', 2048);
        $temperature = $request->input('temperature');
        $enabled = (bool)$request->input('enabled', true);
        $isPublic = (bool)$request->input('is_public', true);
        $category = $request->input('category', 'general_chat');
        $capabilities = $request->input('capabilities', ['text_chat']);
        $reasoningMode = $request->input('reasoning_mode', 'default');
        $reasoningEffort = $request->input('reasoning_effort');
        $requiresApiKey = $request->input('requires_api_key', true);
        $isNew = (bool)$request->input('is_new', false);
        $allowedUsers = $request->input('allowed_users');
        $customHeaders = $request->input('custom_headers');
        $description = $request->input('description', '');
        $icon = $request->input('icon', '');
        $sortOrder = (int)$request->input('sort_order', 0);
        
        if (!$name || !$provider || !$modelName) {
            return Response::error('名称、提供商和模型名称不能为空', 422, 42201);
        }
        
        $id = $this->db->insert('ai_models', [
            'name' => $name,
            'provider' => $provider,
            'model_name' => $modelName,
            'base_url' => $baseUrl,
            'api_format' => $apiFormat,
            'api_key' => $apiKey,
            'context_window' => $contextWindow,
            'max_tokens' => $maxTokens,
            'temperature' => $temperature !== null ? (float)$temperature : null,
            'enabled' => $enabled ? 1 : 0,
            'is_public' => $isPublic ? 1 : 0,
            'category' => $category,
            'capabilities' => json_encode($capabilities),
            'reasoning_mode' => $reasoningMode,
            'reasoning_effort' => $reasoningEffort,
            'requires_api_key' => $requiresApiKey ? 1 : 0,
            'is_new' => $isNew ? 1 : 0,
            'allowed_users' => (is_array($allowedUsers) && count($allowedUsers) > 0) ? json_encode($allowedUsers) : null,
            'custom_headers' => $customHeaders ? json_encode($customHeaders) : null,
            'description' => $description,
            'icon' => $icon,
            'sort_order' => $sortOrder,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        
        return Response::success(['id' => $id], '创建成功');
    }
    
    public function update(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;
        
        $id = (int)$request->param('id');
        
        $model = $this->db->fetchOne("SELECT id FROM ai_models WHERE id = ?", [$id]);
        if (!$model) {
            return Response::notFound('模型不存在');
        }
        
        $data = [];
        
        $fields = ['name', 'provider', 'model_name', 'base_url', 'api_format', 'api_key', 'description', 'icon'];
        foreach ($fields as $field) {
            $value = $request->input($field);
            if ($value !== null) {
                $data[$field] = $field === 'api_key' ? $value : trim($value);
            }
        }
        
        $intFields = ['context_window', 'max_tokens', 'sort_order'];
        foreach ($intFields as $field) {
            $value = $request->input($field);
            if ($value !== null) {
                $data[$field] = (int)$value;
            }
        }
        
        if ($request->input('temperature') !== null) {
            $data['temperature'] = (float)$request->input('temperature');
        }
        
        if ($request->input('enabled') !== null) {
            $data['enabled'] = $request->input('enabled') ? 1 : 0;
        }
        
        if ($request->input('is_public') !== null) {
            $data['is_public'] = $request->input('is_public') ? 1 : 0;
        }
        
        if ($request->input('category') !== null) {
            $data['category'] = $request->input('category');
        }
        
        if ($request->input('capabilities') !== null) {
            $data['capabilities'] = json_encode($request->input('capabilities'));
        }
        
        if ($request->input('reasoning_mode') !== null) {
            $data['reasoning_mode'] = $request->input('reasoning_mode');
        }
        
        if ($request->input('reasoning_effort') !== null) {
            $data['reasoning_effort'] = $request->input('reasoning_effort');
        }
        
        if ($request->input('requires_api_key') !== null) {
            $data['requires_api_key'] = $request->input('requires_api_key') ? 1 : 0;
        }
        
        if ($request->input('is_new') !== null) {
            $data['is_new'] = $request->input('is_new') ? 1 : 0;
        }
        
        if ($request->input('allowed_users') !== null) {
            $allowedUsers = $request->input('allowed_users');
            if (is_array($allowedUsers) && count($allowedUsers) > 0) {
                $data['allowed_users'] = json_encode($allowedUsers);
            } else {
                $data['allowed_users'] = null;
            }
        }
        
        if ($request->input('custom_headers') !== null) {
            $data['custom_headers'] = json_encode($request->input('custom_headers'));
        }
        
        if (!empty($data)) {
            $this->db->update('ai_models', $data, 'id = ?', [$id]);
        }
        
        return Response::success(null, '更新成功');
    }
    
    public function delete(Request $request)
    {
        $check = $this->checkAdmin($request);
        if ($check) return $check;
        
        $id = (int)$request->param('id');
        
        $model = $this->db->fetchOne("SELECT id FROM ai_models WHERE id = ?", [$id]);
        if (!$model) {
            return Response::notFound('模型不存在');
        }
        
        $this->db->delete('ai_models', 'id = ?', [$id]);
        
        return Response::success(null, '删除成功');
    }
}
