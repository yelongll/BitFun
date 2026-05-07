<?php

namespace Kongling\Server\Core;

class Request
{
    private $body = [];
    private $query = [];
    private $headers = [];
    private $params = [];
    private $method;
    private $path;
    private $clientIp;

    public function __construct()
    {
        $this->method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
        $this->path = '/' . trim(parse_url(isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/', PHP_URL_PATH), '/');
        
        if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $this->clientIp = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } elseif (isset($_SERVER['HTTP_X_REAL_IP'])) {
            $this->clientIp = $_SERVER['HTTP_X_REAL_IP'];
        } elseif (isset($_SERVER['REMOTE_ADDR'])) {
            $this->clientIp = $_SERVER['REMOTE_ADDR'];
        } else {
            $this->clientIp = '0.0.0.0';
        }

        $this->query = $_GET;
        $this->headers = $this->parseHeaders();

        if ($this->method !== 'GET') {
            $contentType = $this->getHeader('Content-Type');
            if ($contentType !== null && stripos($contentType, 'application/json') !== false) {
                $raw = file_get_contents('php://input');
                $decoded = json_decode($raw, true);
                $this->body = $decoded !== null ? $decoded : [];
            } else {
                $this->body = $_POST;
            }
        }
    }

    private function parseHeaders()
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (strpos($key, 'HTTP_') === 0) {
                $headerKey = str_replace('_', '-', substr($key, 5));
                $headers[strtolower($headerKey)] = $value;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = $_SERVER['CONTENT_TYPE'];
        }
        if (isset($_SERVER['CONTENT_LENGTH'])) {
            $headers['content-length'] = $_SERVER['CONTENT_LENGTH'];
        }
        return $headers;
    }

    public function getMethod()
    {
        return $this->method;
    }

    public function getPath()
    {
        return $this->path;
    }

    public function getClientIp()
    {
        return $this->clientIp;
    }

    public function getBody()
    {
        return $this->body;
    }

    public function input($key, $default = null)
    {
        return isset($this->body[$key]) ? $this->body[$key] : $default;
    }

    public function query($key, $default = null)
    {
        return isset($this->query[$key]) ? $this->query[$key] : $default;
    }

    public function getHeader($key)
    {
        $key = strtolower($key);
        return isset($this->headers[$key]) ? $this->headers[$key] : null;
    }

    public function getHeaders()
    {
        return $this->headers;
    }

    public function getParams()
    {
        return $this->params;
    }

    public function param($key, $default = null)
    {
        return isset($this->params[$key]) ? $this->params[$key] : $default;
    }

    public function setParams(array $params)
    {
        $this->params = $params;
    }

    public function getBearerToken()
    {
        $auth = $this->getHeader('Authorization');
        if ($auth && preg_match('/^Bearer\s+(.+)$/i', $auth, $matches)) {
            return $matches[1];
        }
        return null;
    }

    public function getDeviceId()
    {
        $deviceId = $this->getHeader('X-Device-Id');
        return $deviceId !== null ? $deviceId : 'unknown';
    }

    public function getDeviceName()
    {
        $deviceName = $this->getHeader('X-Device-Name');
        return $deviceName !== null ? $deviceName : 'Unknown Device';
    }

    public function getPlatform()
    {
        $platform = $this->getHeader('X-Platform');
        return $platform !== null ? $platform : 'unknown';
    }

    public function getAppVersion()
    {
        $version = $this->getHeader('X-App-Version');
        return $version !== null ? $version : '0.0.0';
    }
}
