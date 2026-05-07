<?php

use Kongling\Server\Core\Router;
use Kongling\Server\Core\Request;
use Kongling\Server\Core\Response;
use Kongling\Server\Core\JWT;
use Kongling\Server\Core\Middleware;
use Kongling\Server\Database\Database;
use Kongling\Server\Controller\AuthController;
use Kongling\Server\Controller\SystemController;
use Kongling\Server\Controller\AdminController;
use Kongling\Server\Controller\PointsController;
use Kongling\Server\Controller\ExamplesController;
use Kongling\Server\Controller\LibrariesController;
use Kongling\Server\Controller\AppController;
use Kongling\Server\Controller\UploadController;
use Kongling\Server\Controller\WebSocketController;
use Kongling\Server\Controller\AIModelController;

$config = require __DIR__ . '/../config/config.php';

$db = new Database($config['db']);
$jwt = new JWT($config['jwt']);
$middleware = new Middleware($config, $jwt, $db);

$router = new Router();

$router->get('/api/v1/health', 'Kongling\Server\Controller\SystemController@health');
$router->get('/api/v1/version', 'Kongling\Server\Controller\SystemController@version');

$router->get('/api/v1/app/update-check', 'Kongling\Server\Controller\AppController@checkUpdate');
$router->get('/api/v1/app/announcements', 'Kongling\Server\Controller\AppController@getAnnouncements');
$router->get('/api/v1/app/update-logs', 'Kongling\Server\Controller\AppController@getUpdateLogs');

$router->group('/api/v1/app', function (Router $r) {
    $r->post('/announcements/{id}/dismiss', 'Kongling\Server\Controller\AppController@dismissAnnouncement');
}, ['auth']);

$router->post('/api/v1/auth/register', 'Kongling\Server\Controller\AuthController@register');
$router->post('/api/v1/auth/login', 'Kongling\Server\Controller\AuthController@login');
$router->post('/api/v1/auth/refresh', 'Kongling\Server\Controller\AuthController@refresh');

$router->group('/api/v1', function (Router $r) {
    $r->post('/auth/logout', 'Kongling\Server\Controller\AuthController@logout');
    $r->get('/auth/me', 'Kongling\Server\Controller\AuthController@me');
    $r->put('/auth/profile', 'Kongling\Server\Controller\AuthController@updateProfile');
    $r->put('/auth/password', 'Kongling\Server\Controller\AuthController@changePassword');
    $r->get('/auth/devices', 'Kongling\Server\Controller\AuthController@devices');
    $r->post('/auth/devices/remove', 'Kongling\Server\Controller\AuthController@removeDevice');
    $r->post('/upload/avatar', 'Kongling\Server\Controller\UploadController@uploadAvatar');
    $r->post('/upload/image', 'Kongling\Server\Controller\UploadController@uploadImage');
    $r->get('/realtime/subscribe', 'Kongling\Server\Controller\WebSocketController@subscribe');
    $r->post('/realtime/send', 'Kongling\Server\Controller\WebSocketController@sendNotification');
    $r->post('/realtime/broadcast', 'Kongling\Server\Controller\WebSocketController@broadcastNotification');
    $r->get('/realtime/unread', 'Kongling\Server\Controller\WebSocketController@getUnreadCount');
    $r->get('/ai-models', 'Kongling\Server\Controller\AIModelController@list');
}, ['auth']);

$router->get('/api/v1/upload/file/{type}/{filename}', 'Kongling\Server\Controller\UploadController@getFile');

$router->get('/api/v1/examples', 'Kongling\Server\Controller\ExamplesController@list');
$router->get('/api/v1/examples/categories', 'Kongling\Server\Controller\ExamplesController@categories');
$router->get('/api/v1/examples/my', 'Kongling\Server\Controller\ExamplesController@myExamples', ['auth']);
$router->get('/api/v1/examples/{id}', 'Kongling\Server\Controller\ExamplesController@detail');

$router->group('/api/v1/examples', function (Router $r) {
    $r->post('/{id}/download', 'Kongling\Server\Controller\ExamplesController@download');
    $r->post('/{id}/star', 'Kongling\Server\Controller\ExamplesController@star');
    $r->post('/upload', 'Kongling\Server\Controller\ExamplesController@upload');
    $r->post('/upload-file', 'Kongling\Server\Controller\ExamplesController@uploadFile');
    $r->put('/{id}', 'Kongling\Server\Controller\ExamplesController@update');
    $r->delete('/{id}', 'Kongling\Server\Controller\ExamplesController@delete');
}, ['auth']);

$router->get('/api/v1/libraries', 'Kongling\Server\Controller\LibrariesController@list');
$router->get('/api/v1/libraries/categories', 'Kongling\Server\Controller\LibrariesController@categories');
$router->get('/api/v1/libraries/my', 'Kongling\Server\Controller\LibrariesController@myLibraries', ['auth']);
$router->get('/api/v1/libraries/{id}', 'Kongling\Server\Controller\LibrariesController@detail');

$router->group('/api/v1/libraries', function (Router $r) {
    $r->post('/{id}/download', 'Kongling\Server\Controller\LibrariesController@download');
    $r->post('/{id}/star', 'Kongling\Server\Controller\LibrariesController@star');
    $r->post('/upload', 'Kongling\Server\Controller\LibrariesController@upload');
    $r->post('/upload-file', 'Kongling\Server\Controller\LibrariesController@uploadFile');
    $r->put('/{id}', 'Kongling\Server\Controller\LibrariesController@update');
    $r->delete('/{id}', 'Kongling\Server\Controller\LibrariesController@delete');
}, ['auth']);

$router->group('/api/v1/points', function (Router $r) {
    $r->get('/balance', 'Kongling\Server\Controller\PointsController@balance');
    $r->get('/records', 'Kongling\Server\Controller\PointsController@records');
    $r->get('/ranking', 'Kongling\Server\Controller\PointsController@ranking');
    $r->post('/build', 'Kongling\Server\Controller\PointsController@addBuildReward');
    $r->post('/daily-login', 'Kongling\Server\Controller\PointsController@addDailyLoginReward');
    $r->post('/deduct', 'Kongling\Server\Controller\PointsController@deduct');
}, ['auth']);

$router->group('/api/v1/admin', function (Router $r) {
    $r->get('/dashboard', 'Kongling\Server\Controller\AdminController@dashboard');
    $r->get('/users', 'Kongling\Server\Controller\AdminController@listUsers');
    $r->get('/users/{id}', 'Kongling\Server\Controller\AdminController@getUser');
    $r->put('/users/{id}', 'Kongling\Server\Controller\AdminController@updateUser');
    $r->delete('/users/{id}', 'Kongling\Server\Controller\AdminController@deleteUser');
    $r->post('/users/{id}/reset-password', 'Kongling\Server\Controller\AdminController@resetPassword');
    $r->post('/users/{id}/avatar', 'Kongling\Server\Controller\AdminController@uploadUserAvatar');
    $r->get('/configs', 'Kongling\Server\Controller\AdminController@listConfigs');
    $r->put('/configs', 'Kongling\Server\Controller\AdminController@updateConfig');
    $r->get('/logs', 'Kongling\Server\Controller\AdminController@logs');
    $r->post('/points/add', 'Kongling\Server\Controller\PointsController@adminAddPoints');
    $r->post('/points/deduct', 'Kongling\Server\Controller\PointsController@adminDeductPoints');
    $r->get('/points/configs', 'Kongling\Server\Controller\PointsController@adminGetConfigs');
    $r->put('/points/configs', 'Kongling\Server\Controller\PointsController@adminUpdateConfig');
    $r->get('/examples', 'Kongling\Server\Controller\ExamplesController@adminList');
    $r->post('/examples', 'Kongling\Server\Controller\ExamplesController@adminCreate');
    $r->put('/examples/{id}', 'Kongling\Server\Controller\ExamplesController@adminUpdate');
    $r->delete('/examples/{id}', 'Kongling\Server\Controller\ExamplesController@adminDelete');
    $r->get('/libraries', 'Kongling\Server\Controller\LibrariesController@adminList');
    $r->post('/libraries', 'Kongling\Server\Controller\LibrariesController@adminCreate');
    $r->put('/libraries/{id}', 'Kongling\Server\Controller\LibrariesController@adminUpdate');
    $r->delete('/libraries/{id}', 'Kongling\Server\Controller\LibrariesController@adminDelete');
    $r->get('/versions', 'Kongling\Server\Controller\AdminController@listVersions');
    $r->post('/versions', 'Kongling\Server\Controller\AdminController@createVersion');
    $r->put('/versions/{id}', 'Kongling\Server\Controller\AdminController@updateVersion');
    $r->delete('/versions/{id}', 'Kongling\Server\Controller\AdminController@deleteVersion');
    $r->get('/announcements', 'Kongling\Server\Controller\AdminController@listAnnouncements');
    $r->post('/announcements', 'Kongling\Server\Controller\AdminController@createAnnouncement');
    $r->put('/announcements/{id}', 'Kongling\Server\Controller\AdminController@updateAnnouncement');
    $r->delete('/announcements/{id}', 'Kongling\Server\Controller\AdminController@deleteAnnouncement');
    $r->get('/messages', 'Kongling\Server\Controller\AdminController@listMessages');
    $r->get('/messages/stats', 'Kongling\Server\Controller\AdminController@getMessageStats');
    $r->delete('/messages/{id}', 'Kongling\Server\Controller\AdminController@deleteMessage');
    $r->get('/ai-models', 'Kongling\Server\Controller\AIModelController@adminList');
    $r->post('/ai-models', 'Kongling\Server\Controller\AIModelController@create');
    $r->put('/ai-models/{id}', 'Kongling\Server\Controller\AIModelController@update');
    $r->delete('/ai-models/{id}', 'Kongling\Server\Controller\AIModelController@delete');
}, ['auth']);

return $router;
