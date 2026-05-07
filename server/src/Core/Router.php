<?php

namespace Kongling\Server\Core;

class Router
{
    private $routes = [];
    private $middlewareGroups = [];
    private $prefix = '';

    public function group($prefix, callable $callback, array $middleware = [])
    {
        $previousPrefix = $this->prefix;
        $this->prefix = $previousPrefix . $prefix;

        $previousMiddleware = $this->middlewareGroups;
        $this->middlewareGroups = array_merge($this->middlewareGroups, $middleware);

        $callback($this);

        $this->prefix = $previousPrefix;
        $this->middlewareGroups = $previousMiddleware;
    }

    public function get($path, $handler, array $middleware = [])
    {
        $this->addRoute('GET', $path, $handler, $middleware);
    }

    public function post($path, $handler, array $middleware = [])
    {
        $this->addRoute('POST', $path, $handler, $middleware);
    }

    public function put($path, $handler, array $middleware = [])
    {
        $this->addRoute('PUT', $path, $handler, $middleware);
    }

    public function patch($path, $handler, array $middleware = [])
    {
        $this->addRoute('PATCH', $path, $handler, $middleware);
    }

    public function delete($path, $handler, array $middleware = [])
    {
        $this->addRoute('DELETE', $path, $handler, $middleware);
    }

    private function addRoute($method, $path, $handler, array $middleware = [])
    {
        $fullPath = $this->prefix . $path;
        $allMiddleware = array_merge($this->middlewareGroups, $middleware);

        $this->routes[] = [
            'method' => $method,
            'path' => $fullPath,
            'pattern' => $this->buildPattern($fullPath),
            'handler' => $handler,
            'middleware' => $allMiddleware,
        ];
    }

    private function buildPattern($path)
    {
        $pattern = preg_replace('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', '(?P<$1>[^/]+)', $path);
        return '#^' . $pattern . '$#';
    }

    public function dispatch($method, $uri)
    {
        $uri = '/' . trim(parse_url($uri, PHP_URL_PATH), '/');

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            if (preg_match($route['pattern'], $uri, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                return [
                    'handler' => $route['handler'],
                    'params' => $params,
                    'middleware' => $route['middleware'],
                ];
            }
        }

        return [
            'handler' => null,
            'params' => [],
            'middleware' => [],
        ];
    }

    public function getRoutes()
    {
        return $this->routes;
    }
}
