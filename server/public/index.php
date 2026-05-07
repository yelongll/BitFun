<?php

spl_autoload_register(function (string $class) {
    $prefix = 'Kongling\\Server\\';
    $baseDir = __DIR__ . '/../src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

$config = require __DIR__ . '/../config/config.php';
$router = require __DIR__ . '/../routes/routes.php';

$request = new \Kongling\Server\Core\Request();

$db = new \Kongling\Server\Database\Database($config['db']);
$jwt = new \Kongling\Server\Core\JWT($config['jwt']);
$middlewareObj = new \Kongling\Server\Core\Middleware($config, $jwt, $db);

$middlewareObj->cors($request, new \Kongling\Server\Core\Response());

$dispatch = $router->dispatch($request->getMethod(), $request->getPath());

if ($dispatch['handler'] === null) {
    \Kongling\Server\Core\Response::notFound('接口不存在')->send();
}

$request->setParams(array_merge($request->getParams(), $dispatch['params']));

foreach ($dispatch['middleware'] as $mw) {
    if ($mw === 'auth') {
        $result = $middlewareObj->auth($request);
        if ($result !== null) {
            $result->send();
        }
    }
}

$handlerParts = explode('@', $dispatch['handler']);
$controllerClass = $handlerParts[0];
$method = $handlerParts[1];

if (!class_exists($controllerClass)) {
    \Kongling\Server\Core\Response::serverError('控制器不存在')->send();
}

if ($controllerClass === \Kongling\Server\Controller\AuthController::class) {
    $controller = new \Kongling\Server\Controller\AuthController($db, $jwt, $middlewareObj, $config);
} elseif ($controllerClass === \Kongling\Server\Controller\SystemController::class) {
    $controller = new \Kongling\Server\Controller\SystemController($db, $config);
} elseif ($controllerClass === \Kongling\Server\Controller\AdminController::class) {
    $controller = new \Kongling\Server\Controller\AdminController($db, $jwt, $middlewareObj, $config);
} elseif ($controllerClass === \Kongling\Server\Controller\PointsController::class) {
    $controller = new \Kongling\Server\Controller\PointsController($db, $jwt, $middlewareObj, $config);
} elseif ($controllerClass === \Kongling\Server\Controller\ExamplesController::class) {
    $controller = new \Kongling\Server\Controller\ExamplesController($db, $jwt, $middlewareObj, $config);
} elseif ($controllerClass === \Kongling\Server\Controller\LibrariesController::class) {
    $controller = new \Kongling\Server\Controller\LibrariesController($db, $jwt, $middlewareObj, $config);
} elseif ($controllerClass === \Kongling\Server\Controller\AppController::class) {
    $controller = new \Kongling\Server\Controller\AppController($db, $jwt, $middlewareObj, $config);
} elseif ($controllerClass === \Kongling\Server\Controller\UploadController::class) {
    $controller = new \Kongling\Server\Controller\UploadController($db, $config);
} elseif ($controllerClass === \Kongling\Server\Controller\WebSocketController::class) {
    $controller = new \Kongling\Server\Controller\WebSocketController($db, $config);
} elseif ($controllerClass === \Kongling\Server\Controller\AIModelController::class) {
    $controller = new \Kongling\Server\Controller\AIModelController($db, $config);
} else {
    \Kongling\Server\Core\Response::serverError('未知控制器')->send();
}

if (!method_exists($controller, $method)) {
    \Kongling\Server\Core\Response::serverError('方法不存在')->send();
}

try {
    $response = $controller->$method($request);
    $response->send();
} catch (\Throwable $e) {
    if ($config['app']['debug']) {
        \Kongling\Server\Core\Response::json([
            'success' => false,
            'error' => [
                'code' => 500,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => array_slice($e->getTrace(), 0, 10),
            ],
        ], 500)->send();
    } else {
        \Kongling\Server\Core\Response::serverError()->send();
    }
}
