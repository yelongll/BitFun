<?php

namespace Kongling\Server\Controller;

use Kongling\Server\Core\Request;
use Kongling\Server\Core\Response;
use Kongling\Server\Core\JWT;
use Kongling\Server\Core\Middleware;
use Kongling\Server\Database\Database;

class ExamplesController
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

    public function list(Request $request)
    {
        $page = max(1, (int)$request->input('page', 1));
        $pageSize = min(50, max(10, (int)$request->input('page_size', 20)));
        $category = trim($request->input('category', ''));
        $difficulty = trim($request->input('difficulty', ''));
        $search = trim($request->input('search', ''));
        $authorType = trim($request->input('author_type', ''));
        $userId = $request->param('auth_user_id');

        $where = "status = 1";
        $params = [];

        if ($category) {
            $where .= " AND category = ?";
            $params[] = $category;
        }

        if ($difficulty) {
            $where .= " AND difficulty = ?";
            $params[] = $difficulty;
        }

        if ($search) {
            $where .= " AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $hasOfficialField = $this->checkColumnExists('examples', 'is_official');
        
        if ($authorType === 'official' && $hasOfficialField) {
            $where .= " AND is_official = 1";
        } elseif ($authorType === 'user' && $userId && $hasOfficialField) {
            $where .= " AND is_official = 0 AND user_id = ?";
            $params[] = $userId;
        }

        $countSql = "SELECT COUNT(*) as cnt FROM examples WHERE {$where}";
        $totalResult = $this->db->fetchOne($countSql, $params);
        $total = (int)($totalResult['cnt'] ?? 0);

        $offset = ($page - 1) * $pageSize;
        $selectFields = "id, name, description, category, difficulty, author, tags, stars, downloads, created_at";
        if ($hasOfficialField) {
            $selectFields .= ", is_official, user_id";
        }
        $sql = "SELECT {$selectFields} FROM examples WHERE {$where} ORDER BY sort_order ASC, stars DESC LIMIT {$offset}, {$pageSize}";
        $examples = $this->db->fetchAll($sql, $params);

        foreach ($examples as &$example) {
            $example['tags'] = $example['tags'] ? explode(',', $example['tags']) : [];
            $example['stars'] = (int)$example['stars'];
            $example['downloads'] = (int)$example['downloads'];
            $example['is_official'] = isset($example['is_official']) ? (int)$example['is_official'] : 1;
            $example['is_owner'] = $userId && isset($example['user_id']) && $example['user_id'] == $userId;
        }

        return Response::success([
            'examples' => $examples,
            'pagination' => [
                'page' => $page,
                'page_size' => $pageSize,
                'total' => $total,
                'total_pages' => ceil($total / $pageSize),
            ],
        ]);
    }

    public function detail(Request $request)
    {
        $id = (int)$request->param('id');
        
        $example = $this->db->fetchOne(
            "SELECT * FROM examples WHERE id = ? AND status = 1",
            [$id]
        );

        if (!$example) {
            return Response::notFound('示例不存在');
        }

        $example['tags'] = $example['tags'] ? explode(',', $example['tags']) : [];
        $example['stars'] = (int)$example['stars'];
        $example['downloads'] = (int)$example['downloads'];
        $example['file_size'] = (int)$example['file_size'];

        return Response::success(['example' => $example]);
    }

    public function download(Request $request)
    {
        $id = (int)$request->param('id');
        
        $example = $this->db->fetchOne(
            "SELECT id, name, file_content, file_path, file_size FROM examples WHERE id = ? AND status = 1",
            [$id]
        );

        if (!$example) {
            return Response::notFound('示例不存在');
        }

        $this->db->execute("UPDATE examples SET downloads = downloads + 1 WHERE id = ?", [$id]);

        $userId = $request->param('auth_user_id');
        if ($userId) {
            $this->logAction($userId, 'download_example', 'example', (string)$id, $request->getClientIp());
        }

        $fileName = $example['name'];
        $content = '';
        $downloadUrl = '';
        $isBinary = false;

        if ($example['file_path']) {
            $filePath = dirname(__DIR__, 2) . '/' . $example['file_path'];
            if (file_exists($filePath)) {
                $fileExt = pathinfo($filePath, PATHINFO_EXTENSION);
                $fileName .= '.' . $fileExt;
                $fileSize = filesize($filePath);
                
                if (in_array(strtolower($fileExt), ['zip', 'rar', 'tar', 'gz', 'tgz'])) {
                    $content = base64_encode(file_get_contents($filePath));
                    $isBinary = true;
                    $downloadUrl = '';
                } else {
                    $content = file_get_contents($filePath);
                    $downloadUrl = 'data:text/plain;charset=utf-8,' . urlencode($content);
                }
            }
        }

        if (!$content && !$downloadUrl) {
            $fileName .= '.kl';
            $content = $example['file_content'] ?: '';
            $downloadUrl = 'data:text/plain;charset=utf-8,' . urlencode($content);
        }

        return Response::success([
            'file_name' => $fileName,
            'content' => $content,
            'download_url' => $downloadUrl,
            'file_size' => $example['file_size'] ?: strlen($content),
            'is_binary' => $isBinary,
        ]);
    }

    public function star(Request $request)
    {
        $userId = $request->param('auth_user_id');
        $id = (int)$request->param('id');

        $example = $this->db->fetchOne("SELECT id FROM examples WHERE id = ? AND status = 1", [$id]);
        if (!$example) {
            return Response::notFound('示例不存在');
        }

        $existing = $this->db->fetchOne(
            "SELECT id FROM example_stars WHERE user_id = ? AND example_id = ?",
            [$userId, $id]
        );

        if ($existing) {
            $this->db->execute("DELETE FROM example_stars WHERE id = ?", [$existing['id']]);
            $this->db->execute("UPDATE examples SET stars = GREATEST(0, stars - 1) WHERE id = ?", [$id]);
            return Response::success(['starred' => false, 'message' => '已取消收藏']);
        } else {
            $this->db->insert('example_stars', [
                'user_id' => $userId,
                'example_id' => $id,
            ]);
            $this->db->execute("UPDATE examples SET stars = stars + 1 WHERE id = ?", [$id]);
            return Response::success(['starred' => true, 'message' => '已收藏']);
        }
    }

    public function categories(Request $request)
    {
        $categories = $this->db->fetchAll(
            "SELECT category, COUNT(*) as count FROM examples WHERE status = 1 GROUP BY category ORDER BY count DESC"
        );

        $categoryNames = [
            'cli' => '命令行工具',
            'web' => 'Web服务',
            'database' => '数据库',
            'async' => '并发异步',
            'game' => '游戏开发',
            'system' => '系统工具',
            'mobile' => '移动应用',
            'template' => '项目模板',
        ];

        foreach ($categories as &$cat) {
            $cat['name'] = $categoryNames[$cat['category']] ?? $cat['category'];
            $cat['count'] = (int)$cat['count'];
        }

        return Response::success(['categories' => $categories]);
    }

    public function adminList(Request $request)
    {
        $userId = $request->param('auth_user_id');
        if (!$this->isAdmin($userId)) {
            return Response::error('无权限', 403, 40303);
        }

        $page = max(1, (int)$request->input('page', 1));
        $pageSize = min(100, max(10, (int)$request->input('page_size', 20)));

        $countSql = "SELECT COUNT(*) as cnt FROM examples";
        $totalResult = $this->db->fetchOne($countSql);
        $total = (int)($totalResult['cnt'] ?? 0);

        $offset = ($page - 1) * $pageSize;
        $sql = "SELECT * FROM examples ORDER BY sort_order ASC, id DESC LIMIT {$offset}, {$pageSize}";
        $examples = $this->db->fetchAll($sql);

        foreach ($examples as &$example) {
            $example['tags'] = $example['tags'] ? explode(',', $example['tags']) : [];
        }

        return Response::success([
            'examples' => $examples,
            'pagination' => [
                'page' => $page,
                'page_size' => $pageSize,
                'total' => $total,
                'total_pages' => ceil($total / $pageSize),
            ],
        ]);
    }

    public function adminCreate(Request $request)
    {
        $userId = $request->param('auth_user_id');
        if (!$this->isAdmin($userId)) {
            return Response::error('无权限', 403, 40303);
        }

        $name = trim($request->input('name', ''));
        $description = trim($request->input('description', ''));
        $category = trim($request->input('category', ''));
        $difficulty = trim($request->input('difficulty', '入门'));
        $author = trim($request->input('author', ''));
        $tags = trim($request->input('tags', ''));
        $fileContent = $request->input('file_content', '');
        $filePath = trim($request->input('file_path', ''));
        $status = (int)$request->input('status', 1);
        $sortOrder = (int)$request->input('sort_order', 0);
        $isOfficial = (int)$request->input('is_official', 1);

        if (!$name || !$category) {
            return Response::error('名称和分类不能为空', 422, 42201);
        }

        $id = $this->db->insert('examples', [
            'name' => $name,
            'description' => $description,
            'category' => $category,
            'difficulty' => $difficulty,
            'author' => $author,
            'tags' => $tags,
            'file_content' => $fileContent,
            'file_path' => $filePath,
            'file_size' => strlen($fileContent),
            'status' => $status,
            'sort_order' => $sortOrder,
            'is_official' => $isOfficial,
        ]);

        return Response::success(['id' => $id], '创建成功');
    }

    public function adminUpdate(Request $request)
    {
        $userId = $request->param('auth_user_id');
        if (!$this->isAdmin($userId)) {
            return Response::error('无权限', 403, 40303);
        }

        $id = (int)$request->param('id');
        $example = $this->db->fetchOne("SELECT id FROM examples WHERE id = ?", [$id]);
        if (!$example) {
            return Response::notFound('示例不存在');
        }

        $updates = [];
        $fields = ['name', 'description', 'category', 'difficulty', 'author', 'tags', 'file_content', 'file_path', 'status', 'sort_order', 'is_official'];
        foreach ($fields as $field) {
            $value = $request->input($field);
            if ($value !== null) {
                $updates[$field] = is_string($value) ? trim($value) : $value;
            }
        }

        if (isset($updates['file_content'])) {
            $updates['file_size'] = strlen($updates['file_content']);
        }

        if (!empty($updates)) {
            $this->db->update('examples', $updates, 'id = ?', [$id]);
        }

        return Response::success(null, '更新成功');
    }

    public function adminDelete(Request $request)
    {
        $userId = $request->param('auth_user_id');
        if (!$this->isAdmin($userId)) {
            return Response::error('无权限', 403, 40303);
        }

        $id = (int)$request->param('id');
        $this->db->execute("DELETE FROM examples WHERE id = ?", [$id]);

        return Response::success(null, '删除成功');
    }

    public function myExamples(Request $request)
    {
        $userId = $request->param('auth_user_id');
        if (!$userId) {
            return Response::error('请先登录', 401, 40101);
        }

        $page = max(1, (int)$request->input('page', 1));
        $pageSize = min(50, max(10, (int)$request->input('page_size', 20)));

        $countSql = "SELECT COUNT(*) as cnt FROM examples WHERE user_id = ?";
        $totalResult = $this->db->fetchOne($countSql, [$userId]);
        $total = (int)($totalResult['cnt'] ?? 0);

        $offset = ($page - 1) * $pageSize;
        $sql = "SELECT * FROM examples WHERE user_id = ? ORDER BY created_at DESC LIMIT {$offset}, {$pageSize}";
        $examples = $this->db->fetchAll($sql, [$userId]);

        foreach ($examples as &$example) {
            $example['tags'] = $example['tags'] ? explode(',', $example['tags']) : [];
            $example['stars'] = (int)$example['stars'];
            $example['downloads'] = (int)$example['downloads'];
            $example['is_official'] = (int)$example['is_official'];
            $example['is_owner'] = true;
        }

        return Response::success([
            'examples' => $examples,
            'pagination' => [
                'page' => $page,
                'page_size' => $pageSize,
                'total' => $total,
                'total_pages' => ceil($total / $pageSize),
            ],
        ]);
    }

    public function upload(Request $request)
    {
        $userId = $request->param('auth_user_id');
        if (!$userId) {
            return Response::error('请先登录', 401, 40101);
        }

        $name = trim($request->input('name', ''));
        $description = trim($request->input('description', ''));
        $category = trim($request->input('category', ''));
        $difficulty = trim($request->input('difficulty', '入门'));
        $tags = trim($request->input('tags', ''));
        $fileContent = $request->input('file_content', '');
        $filePath = trim($request->input('file_path', ''));

        if (!$name || !$category) {
            return Response::error('名称和分类不能为空', 422, 42201);
        }

        $user = $this->db->fetchOne("SELECT nickname, username FROM users WHERE id = ?", [$userId]);
        $author = $user ? ($user['nickname'] ?: $user['username']) : '用户';

        $id = $this->db->insert('examples', [
            'name' => $name,
            'description' => $description,
            'category' => $category,
            'difficulty' => $difficulty,
            'author' => $author,
            'tags' => $tags,
            'file_content' => $fileContent,
            'file_path' => $filePath,
            'file_size' => strlen($fileContent),
            'status' => 1,
            'sort_order' => 0,
            'is_official' => 0,
            'user_id' => $userId,
        ]);

        $this->logAction($userId, 'upload_example', 'example', (string)$id, $request->getClientIp());

        return Response::success(['id' => $id], '上传成功');
    }

    public function uploadFile(Request $request)
    {
        $userId = $request->param('auth_user_id');
        if (!$userId) {
            return Response::error('请先登录', 401, 40101);
        }

        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            return Response::error('请选择要上传的文件', 422, 42201);
        }

        $file = $_FILES['file'];
        $allowedTypes = [
            'application/zip',
            'application/x-zip-compressed',
            'application/x-rar-compressed',
            'application/x-tar',
            'application/gzip',
            'text/plain',
            'application/json',
            'application/xml',
            'text/html',
            'text/css',
            'text/javascript',
            'application/javascript',
        ];

        $allowedExtensions = [
            'zip', 'rar', 'tar', 'gz', 'tgz',
            'c', 'cpp', 'h', 'hpp', 'java', 'py', 'rs',
            'js', 'jsx', 'ts', 'tsx', 'json', 'xml',
            'html', 'css', 'scss', 'sass', 'less',
            'md', 'txt', 'sh', 'bat', 'ps1',
            'go', 'php', 'rb', 'swift', 'kt', 'scala',
        ];

        $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if (!in_array($file['type'], $allowedTypes) && !in_array($fileExt, $allowedExtensions)) {
            return Response::error('不支持的文件类型', 422, 42202);
        }

        $maxSize = 10 * 1024 * 1024;
        if ($file['size'] > $maxSize) {
            return Response::error('文件大小不能超过10MB', 422, 42203);
        }

        $name = trim($request->input('name', ''));
        $description = trim($request->input('description', ''));
        $category = trim($request->input('category', ''));
        $difficulty = trim($request->input('difficulty', '入门'));
        $tags = trim($request->input('tags', ''));
        $isOfficial = (int)$request->input('is_official', 0);

        if (!$name || !$category) {
            return Response::error('名称和分类不能为空', 422, 42204);
        }

        $uploadDir = $this->config['upload_dir'] ?? dirname(__DIR__, 2) . '/uploads/examples';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $fileName = uniqid() . '_' . bin2hex(random_bytes(4)) . '.' . $fileExt;
        $filePath = $uploadDir . '/' . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            return Response::error('文件保存失败', 500, 50001);
        }

        $fileContent = '';
        if (in_array($fileExt, ['txt', 'md', 'json', 'xml', 'html', 'css', 'scss', 'sass', 'less', 'js', 'jsx', 'ts', 'tsx', 'c', 'cpp', 'h', 'hpp', 'java', 'py', 'rs', 'go', 'php', 'rb', 'swift', 'kt', 'scala', 'sh', 'bat', 'ps1'])) {
            $fileContent = file_get_contents($filePath);
        }

        $user = $this->db->fetchOne("SELECT nickname, username FROM users WHERE id = ?", [$userId]);
        $author = $user ? ($user['nickname'] ?: $user['username']) : '用户';

        $relativePath = 'uploads/examples/' . $fileName;

        $id = $this->db->insert('examples', [
            'name' => $name,
            'description' => $description,
            'category' => $category,
            'difficulty' => $difficulty,
            'author' => $author,
            'tags' => $tags,
            'file_content' => $fileContent,
            'file_path' => $relativePath,
            'file_size' => $file['size'],
            'status' => 1,
            'sort_order' => 0,
            'is_official' => $isOfficial,
            'user_id' => $userId,
        ]);

        $this->logAction($userId, 'upload_example_file', 'example', (string)$id, $request->getClientIp());

        return Response::success(['id' => $id], '上传成功');
    }

    public function update(Request $request)
    {
        $userId = $request->param('auth_user_id');
        if (!$userId) {
            return Response::error('请先登录', 401, 40101);
        }

        $id = (int)$request->param('id');
        $example = $this->db->fetchOne("SELECT id, user_id FROM examples WHERE id = ?", [$id]);
        if (!$example) {
            return Response::notFound('示例不存在');
        }

        if ($example['user_id'] != $userId && !$this->isAdmin($userId)) {
            return Response::error('无权限修改此示例', 403, 40303);
        }

        $updates = [];
        $fields = ['name', 'description', 'category', 'difficulty', 'tags', 'file_content', 'file_path', 'status'];
        foreach ($fields as $field) {
            $value = $request->input($field);
            if ($value !== null) {
                $updates[$field] = is_string($value) ? trim($value) : $value;
            }
        }

        if (isset($updates['file_content'])) {
            $updates['file_size'] = strlen($updates['file_content']);
        }

        if (!empty($updates)) {
            $this->db->update('examples', $updates, 'id = ?', [$id]);
        }

        return Response::success(null, '更新成功');
    }

    public function delete(Request $request)
    {
        $userId = $request->param('auth_user_id');
        if (!$userId) {
            return Response::error('请先登录', 401, 40101);
        }

        $id = (int)$request->param('id');
        $example = $this->db->fetchOne("SELECT id, user_id FROM examples WHERE id = ?", [$id]);
        if (!$example) {
            return Response::notFound('示例不存在');
        }

        if ($example['user_id'] != $userId && !$this->isAdmin($userId)) {
            return Response::error('无权限删除此示例', 403, 40303);
        }

        $this->db->execute("DELETE FROM examples WHERE id = ?", [$id]);

        return Response::success(null, '删除成功');
    }

    private function isAdmin($userId)
    {
        $user = $this->db->fetchOne("SELECT role FROM users WHERE id = ?", [$userId]);
        return $user && isset($user['role']) && $user['role'] === 'admin';
    }

    private function checkColumnExists($table, $column)
    {
        try {
            $sql = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?";
            $result = $this->db->fetchOne($sql, [$table, $column]);
            return !empty($result);
        } catch (\Throwable $e) {
            return false;
        }
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
