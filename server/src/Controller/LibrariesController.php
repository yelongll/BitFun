<?php

namespace Kongling\Server\Controller;

use Kongling\Server\Core\Request;
use Kongling\Server\Core\Response;
use Kongling\Server\Core\JWT;
use Kongling\Server\Core\Middleware;
use Kongling\Server\Database\Database;

class LibrariesController
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
        $search = trim($request->input('search', ''));
        $isOfficial = $request->input('is_official');

        $where = "status = 1";
        $params = [];

        if ($category) {
            $where .= " AND category = ?";
            $params[] = $category;
        }

        if ($search) {
            $where .= " AND (name LIKE ? OR description LIKE ? OR author LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        if ($isOfficial !== null && $isOfficial !== '') {
            $where .= " AND is_official = ?";
            $params[] = (int)$isOfficial;
        }

        $countSql = "SELECT COUNT(*) as cnt FROM libraries WHERE {$where}";
        $totalResult = $this->db->fetchOne($countSql, $params);
        $total = (int)($totalResult['cnt'] ?? 0);

        $offset = ($page - 1) * $pageSize;
        $sql = "SELECT * FROM libraries WHERE {$where} ORDER BY sort_order ASC, id DESC LIMIT {$offset}, {$pageSize}";
        $libraries = $this->db->fetchAll($sql, $params);

        foreach ($libraries as &$library) {
            $library['tags'] = $library['tags'] ? explode(',', $library['tags']) : [];
            $library['stars'] = (int)$library['stars'];
            $library['downloads'] = (int)$library['downloads'];
        }

        return Response::success([
            'libraries' => $libraries,
            'pagination' => [
                'page' => $page,
                'page_size' => $pageSize,
                'total' => $total,
                'total_pages' => ceil($total / $pageSize),
            ],
        ]);
    }

    public function categories(Request $request)
    {
        $categories = [
            ['key' => 'standard', 'name' => '标准库'],
            ['key' => 'web', 'name' => 'Web开发'],
            ['key' => 'database', 'name' => '数据库'],
            ['key' => 'async', 'name' => '异步并发'],
            ['key' => 'system', 'name' => '系统工具'],
            ['key' => 'tool', 'name' => '开发工具'],
        ];

        return Response::success(['categories' => $categories]);
    }

    public function detail(Request $request)
    {
        $id = (int)$request->param('id');
        
        $library = $this->db->fetchOne(
            "SELECT * FROM libraries WHERE id = ? AND status = 1",
            [$id]
        );

        if (!$library) {
            return Response::notFound('库不存在');
        }

        $library['tags'] = $library['tags'] ? explode(',', $library['tags']) : [];
        $library['stars'] = (int)$library['stars'];
        $library['downloads'] = (int)$library['downloads'];
        $library['file_size'] = (int)$library['file_size'];

        return Response::success(['library' => $library]);
    }

    public function download(Request $request)
    {
        $id = (int)$request->param('id');
        
        $library = $this->db->fetchOne(
            "SELECT id, name, file_content, file_path, file_size FROM libraries WHERE id = ? AND status = 1",
            [$id]
        );

        if (!$library) {
            return Response::notFound('库不存在');
        }

        $this->db->execute("UPDATE libraries SET downloads = downloads + 1 WHERE id = ?", [$id]);

        $userId = $request->param('auth_user_id');
        if ($userId) {
            $this->logAction($userId, 'download_library', 'library', (string)$id, $request->getClientIp());
        }

        $fileName = $library['name'];
        $content = '';
        $downloadUrl = '';
        $isBinary = false;

        if ($library['file_path']) {
            $filePath = dirname(__DIR__, 2) . '/' . $library['file_path'];
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
            $fileName .= '.灵';
            $content = $library['file_content'] ?: '';
            $downloadUrl = 'data:text/plain;charset=utf-8,' . urlencode($content);
        }

        return Response::success([
            'file_name' => $fileName,
            'content' => $content,
            'download_url' => $downloadUrl,
            'file_size' => $library['file_size'] ?: strlen($content),
            'is_binary' => $isBinary,
        ]);
    }

    public function star(Request $request)
    {
        $userId = $request->param('auth_user_id');
        $id = (int)$request->param('id');

        $library = $this->db->fetchOne("SELECT id FROM libraries WHERE id = ? AND status = 1", [$id]);
        if (!$library) {
            return Response::notFound('库不存在');
        }

        $existing = $this->db->fetchOne(
            "SELECT id FROM library_stars WHERE user_id = ? AND library_id = ?",
            [$userId, $id]
        );

        if ($existing) {
            $this->db->execute("DELETE FROM library_stars WHERE id = ?", [$existing['id']]);
            $this->db->execute("UPDATE libraries SET stars = GREATEST(0, stars - 1) WHERE id = ?", [$id]);
            return Response::success(['starred' => false, 'message' => '已取消收藏']);
        } else {
            $this->db->insert('library_stars', [
                'user_id' => $userId,
                'library_id' => $id,
            ]);
            $this->db->execute("UPDATE libraries SET stars = stars + 1 WHERE id = ?", [$id]);
            return Response::success(['starred' => true, 'message' => '已收藏']);
        }
    }

    public function myLibraries(Request $request)
    {
        $userId = $request->param('auth_user_id');
        if (!$userId) {
            return Response::error('请先登录', 401, 40101);
        }

        $page = max(1, (int)$request->input('page', 1));
        $pageSize = min(50, max(10, (int)$request->input('page_size', 20)));

        $countSql = "SELECT COUNT(*) as cnt FROM libraries WHERE user_id = ?";
        $totalResult = $this->db->fetchOne($countSql, [$userId]);
        $total = (int)($totalResult['cnt'] ?? 0);

        $offset = ($page - 1) * $pageSize;
        $sql = "SELECT * FROM libraries WHERE user_id = ? ORDER BY created_at DESC LIMIT {$offset}, {$pageSize}";
        $libraries = $this->db->fetchAll($sql, [$userId]);

        foreach ($libraries as &$library) {
            $library['tags'] = $library['tags'] ? explode(',', $library['tags']) : [];
            $library['stars'] = (int)$library['stars'];
            $library['downloads'] = (int)$library['downloads'];
        }

        return Response::success([
            'libraries' => $libraries,
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
        $version = trim($request->input('version', '1.0.0'));
        $tags = trim($request->input('tags', ''));
        $fileContent = $request->input('file_content', '');
        $filePath = trim($request->input('file_path', ''));

        if (!$name || !$category) {
            return Response::error('名称和分类不能为空', 422, 42201);
        }

        $user = $this->db->fetchOne("SELECT nickname, username FROM users WHERE id = ?", [$userId]);
        $author = $user ? ($user['nickname'] ?: $user['username']) : '用户';

        $id = $this->db->insert('libraries', [
            'name' => $name,
            'description' => $description,
            'category' => $category,
            'version' => $version,
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

        $this->logAction($userId, 'upload_library', 'library', (string)$id, $request->getClientIp());

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
            'kl',
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
        $version = trim($request->input('version', '1.0.0'));
        $tags = trim($request->input('tags', ''));
        $isOfficial = (int)$request->input('is_official', 0);

        if (!$name || !$category) {
            return Response::error('名称和分类不能为空', 422, 42204);
        }

        $uploadDir = $this->config['upload_dir'] ?? dirname(__DIR__, 2) . '/uploads/libraries';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $fileName = uniqid() . '_' . bin2hex(random_bytes(4)) . '.' . $fileExt;
        $filePath = $uploadDir . '/' . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            return Response::error('文件保存失败', 500, 50001);
        }

        $fileContent = '';
        if (in_array($fileExt, ['txt', 'md', 'json', 'xml', 'html', 'css', 'scss', 'sass', 'less', 'js', 'jsx', 'ts', 'tsx', 'c', 'cpp', 'h', 'hpp', 'java', 'py', 'rs', 'go', 'php', 'rb', 'swift', 'kt', 'scala', 'sh', 'bat', 'ps1', 'kl'])) {
            $fileContent = file_get_contents($filePath);
        }

        $user = $this->db->fetchOne("SELECT nickname, username FROM users WHERE id = ?", [$userId]);
        $author = $user ? ($user['nickname'] ?: $user['username']) : '用户';

        $relativePath = 'uploads/libraries/' . $fileName;

        $id = $this->db->insert('libraries', [
            'name' => $name,
            'description' => $description,
            'category' => $category,
            'version' => $version,
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

        $this->logAction($userId, 'upload_library_file', 'library', (string)$id, $request->getClientIp());

        return Response::success(['id' => $id], '上传成功');
    }

    public function update(Request $request)
    {
        $userId = $request->param('auth_user_id');
        if (!$userId) {
            return Response::error('请先登录', 401, 40101);
        }

        $id = (int)$request->param('id');
        $library = $this->db->fetchOne("SELECT id, user_id FROM libraries WHERE id = ?", [$id]);
        if (!$library) {
            return Response::notFound('库不存在');
        }

        if ($library['user_id'] != $userId && !$this->isAdmin($userId)) {
            return Response::error('无权限修改此库', 403, 40303);
        }

        $updates = [];
        $fields = ['name', 'description', 'category', 'version', 'tags', 'file_content', 'file_path', 'status'];
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
            $this->db->update('libraries', $updates, 'id = ?', [$id]);
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
        $library = $this->db->fetchOne("SELECT id, user_id, file_path FROM libraries WHERE id = ?", [$id]);
        if (!$library) {
            return Response::notFound('库不存在');
        }

        if ($library['user_id'] != $userId && !$this->isAdmin($userId)) {
            return Response::error('无权限删除此库', 403, 40303);
        }

        if ($library['file_path']) {
            $filePath = dirname(__DIR__, 2) . '/' . $library['file_path'];
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        $this->db->execute("DELETE FROM libraries WHERE id = ?", [$id]);
        $this->db->execute("DELETE FROM library_stars WHERE library_id = ?", [$id]);

        return Response::success(null, '删除成功');
    }

    public function adminList(Request $request)
    {
        $userId = $request->param('auth_user_id');
        if (!$this->isAdmin($userId)) {
            return Response::error('无权限', 403, 40303);
        }

        $page = max(1, (int)$request->input('page', 1));
        $pageSize = min(100, max(10, (int)$request->input('page_size', 20)));

        $countSql = "SELECT COUNT(*) as cnt FROM libraries";
        $totalResult = $this->db->fetchOne($countSql);
        $total = (int)($totalResult['cnt'] ?? 0);

        $offset = ($page - 1) * $pageSize;
        $sql = "SELECT * FROM libraries ORDER BY sort_order ASC, id DESC LIMIT {$offset}, {$pageSize}";
        $libraries = $this->db->fetchAll($sql);

        foreach ($libraries as &$library) {
            $library['tags'] = $library['tags'] ? explode(',', $library['tags']) : [];
        }

        return Response::success([
            'libraries' => $libraries,
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
        $version = trim($request->input('version', '1.0.0'));
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

        $id = $this->db->insert('libraries', [
            'name' => $name,
            'description' => $description,
            'category' => $category,
            'version' => $version,
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
        $library = $this->db->fetchOne("SELECT id FROM libraries WHERE id = ?", [$id]);
        if (!$library) {
            return Response::notFound('库不存在');
        }

        $updates = [];
        $fields = ['name', 'description', 'category', 'version', 'author', 'tags', 'file_content', 'file_path', 'status', 'sort_order', 'is_official'];
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
            $this->db->update('libraries', $updates, 'id = ?', [$id]);
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
        $library = $this->db->fetchOne("SELECT file_path FROM libraries WHERE id = ?", [$id]);
        
        if ($library && $library['file_path']) {
            $filePath = dirname(__DIR__, 2) . '/' . $library['file_path'];
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        $this->db->execute("DELETE FROM libraries WHERE id = ?", [$id]);
        $this->db->execute("DELETE FROM library_stars WHERE library_id = ?", [$id]);

        return Response::success(null, '删除成功');
    }

    private function isAdmin($userId)
    {
        $user = $this->db->fetchOne("SELECT role FROM users WHERE id = ?", [$userId]);
        return $user && isset($user['role']) && $user['role'] === 'admin';
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
