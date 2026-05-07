<?php

namespace Kongling\Server\Core;

class Response
{
    private $statusCode = 200;
    private $headers = [];
    private $data = null;
    private $error = null;
    private $errorCode = 0;

    public static function json(array $data, $status = 200)
    {
        $resp = new self();
        $resp->data = $data;
        $resp->statusCode = $status;
        return $resp;
    }

    public static function success($data = null, $message = 'ok')
    {
        $resp = new self();
        $resp->data = ['message' => $message];
        if ($data !== null) {
            $resp->data['data'] = $data;
        }
        return $resp;
    }

    public static function error($message, $code = 400, $errorCode = 0)
    {
        $resp = new self();
        $resp->error = $message;
        $resp->statusCode = $code;
        $resp->errorCode = $errorCode;
        return $resp;
    }

    public static function unauthorized($message = '未授权，请先登录')
    {
        return self::error($message, 401, 40100);
    }

    public static function forbidden($message = '权限不足')
    {
        return self::error($message, 403, 40300);
    }

    public static function notFound($message = '资源不存在')
    {
        return self::error($message, 404, 40400);
    }

    public static function tooManyRequests($message = '请求过于频繁，请稍后再试')
    {
        return self::error($message, 429, 42900);
    }

    public static function serverError($message = '服务器内部错误')
    {
        return self::error($message, 500, 50000);
    }

    public function setHeader($key, $value)
    {
        $this->headers[$key] = $value;
        return $this;
    }

    public function send()
    {
        http_response_code($this->statusCode);

        $this->headers['Content-Type'] = 'application/json; charset=utf-8';
        foreach ($this->headers as $key => $value) {
            header("$key: $value");
        }

        $body = [];
        if ($this->error !== null) {
            $body = [
                'success' => false,
                'error' => [
                    'code' => $this->errorCode ?: $this->statusCode,
                    'message' => $this->error,
                ],
            ];
        } else {
            $body = array_merge(['success' => true], $this->data ?? []);
        }

        echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
