<?php

namespace Kongling\Server\Controller;

use Kongling\Server\Core\Request;
use Kongling\Server\Core\Response;
use Kongling\Server\Database\Database;

class UploadController
{
    private $db;
    private $config;
    private $uploadDir;
    private $allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    private $maxFileSize = 5 * 1024 * 1024;

    public function __construct(Database $db, array $config)
    {
        $this->db = $db;
        $this->config = $config;
        $this->uploadDir = dirname(__DIR__, 2) . '/uploads';
    }

    public function uploadAvatar(Request $request)
    {
        try {
            $userId = $request->param('auth_user_id');
            
            if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
                $errorMessages = [
                    UPLOAD_ERR_INI_SIZE => '文件大小超过服务器限制',
                    UPLOAD_ERR_FORM_SIZE => '文件大小超过表单限制',
                    UPLOAD_ERR_PARTIAL => '文件只有部分被上传',
                    UPLOAD_ERR_NO_FILE => '没有文件被上传',
                    UPLOAD_ERR_NO_TMP_DIR => '缺少临时文件夹',
                    UPLOAD_ERR_CANT_WRITE => '写入文件失败',
                ];
                $errorCode = $_FILES['avatar']['error'] ?? UPLOAD_ERR_NO_FILE;
                return Response::error($errorMessages[$errorCode] ?? '上传失败', 422, 42201);
            }

            $file = $_FILES['avatar'];
            
            if ($file['size'] > $this->maxFileSize) {
                return Response::error('文件大小不能超过5MB', 422, 42202);
            }

            $mimeType = $this->getMimeType($file['tmp_name']);
            
            if (!in_array($mimeType, $this->allowedImageTypes)) {
                return Response::error('只支持 JPG、PNG、GIF、WEBP 格式的图片', 422, 42203);
            }

            $extension = $this->getExtension($mimeType);
            $filename = sprintf('avatar_%d_%s.%s', $userId, time(), $extension);
            $avatarDir = $this->uploadDir . '/avatars';
            
            if (!is_dir($avatarDir)) {
                if (!mkdir($avatarDir, 0755, true)) {
                    return Response::error('无法创建头像目录: ' . $avatarDir, 500, 50001);
                }
            }
            
            $filepath = $avatarDir . '/' . $filename;

            $oldAvatar = $this->db->fetchOne(
                "SELECT avatar_url FROM users WHERE id = ?",
                [$userId]
            );
            
            if ($oldAvatar && $oldAvatar['avatar_url']) {
                $oldFilename = basename(parse_url($oldAvatar['avatar_url'], PHP_URL_PATH));
                $oldPath = $avatarDir . '/' . $oldFilename;
                if (file_exists($oldPath) && strpos($oldAvatar['avatar_url'], '/avatar') !== false) {
                    @unlink($oldPath);
                }
            }

            if (!move_uploaded_file($file['tmp_name'], $filepath)) {
                return Response::error('文件保存失败: ' . $filepath, 500, 50002);
            }

            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
            $baseUrl = $protocol . '://' . $host;
            $avatarUrl = $baseUrl . '/api/v1/upload/file/avatars/' . $filename;

            $this->db->update('users', ['avatar_url' => $avatarUrl], 'id = ?', [$userId]);

            $this->logAction($userId, 'upload_avatar', 'user', (string)$userId, $request->getClientIp());

            return Response::success([
                'avatar_url' => $avatarUrl,
                'user' => $this->getUserInfo($userId),
            ], '头像上传成功');
        } catch (\Throwable $e) {
            return Response::error('上传异常: ' . $e->getMessage(), 500, 50099);
        }
    }

    public function uploadImage(Request $request)
    {
        $userId = $request->param('auth_user_id');
        
        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            $errorMessages = [
                UPLOAD_ERR_INI_SIZE => '文件大小超过服务器限制',
                UPLOAD_ERR_FORM_SIZE => '文件大小超过表单限制',
                UPLOAD_ERR_PARTIAL => '文件只有部分被上传',
                UPLOAD_ERR_NO_FILE => '没有文件被上传',
            ];
            $errorCode = $_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE;
            return Response::error($errorMessages[$errorCode] ?? '上传失败', 422, 42201);
        }

        $file = $_FILES['image'];
        
        if ($file['size'] > $this->maxFileSize) {
            return Response::error('文件大小不能超过5MB', 422, 42202);
        }

        $mimeType = $this->getMimeType($file['tmp_name']);
        
        if (!in_array($mimeType, $this->allowedImageTypes)) {
            return Response::error('只支持 JPG、PNG、GIF、WEBP 格式的图片', 422, 42203);
        }

        $extension = $this->getExtension($mimeType);
        $subdir = date('Y/m');
        $uploadPath = $this->uploadDir . '/images/' . $subdir;
        
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }

        $filename = sprintf('%s_%s.%s', time(), bin2hex(random_bytes(4)), $extension);
        $filepath = $uploadPath . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            return Response::error('文件保存失败', 500, 50001);
        }

        $baseUrl = $this->config['app']['url'] ?? '';
        $imageUrl = $baseUrl . '/uploads/images/' . $subdir . '/' . $filename;

        return Response::success([
            'url' => $imageUrl,
            'filename' => $filename,
        ], '上传成功');
    }

    public function getFile(Request $request)
    {
        $type = $request->param('type');
        $filename = $request->param('filename');
        
        $allowedTypes = ['avatars', 'images'];
        if (!in_array($type, $allowedTypes)) {
            return Response::notFound('文件不存在');
        }
        
        $filename = basename($filename);
        $filepath = $this->uploadDir . '/' . $type . '/' . $filename;
        
        if (!file_exists($filepath)) {
            return Response::notFound('文件不存在');
        }
        
        $mimeType = $this->getMimeType($filepath);
        
        $allowedMimeTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/octet-stream',
        ];
        
        if (!in_array($mimeType, $allowedMimeTypes)) {
            return Response::error('不支持的文件类型', 403, 40301);
        }
        
        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . filesize($filepath));
        header('Cache-Control: public, max-age=31536000');
        header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');
        
        readfile($filepath);
        exit;
    }

    private function getMimeType($filepath)
    {
        if (class_exists('finfo')) {
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            return $finfo->file($filepath);
        }
        
        if (function_exists('mime_content_type')) {
            return mime_content_type($filepath);
        }
        
        $extension = strtolower(pathinfo($filepath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
        ];
        
        return $mimeTypes[$extension] ?? 'application/octet-stream';
    }

    private function getExtension($mimeType)
    {
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
        ];
        return $extensions[$mimeType] ?? 'jpg';
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
