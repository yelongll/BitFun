-- ========================================
-- 空灵语言 IDE 服务端 - 数据库初始化脚本
-- ========================================

CREATE DATABASE IF NOT EXISTS `kongling_server`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `kongling_server`;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(64) NOT NULL COMMENT '用户名',
  `email` VARCHAR(255) NOT NULL COMMENT '邮箱',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希(bcrypt)',
  `nickname` VARCHAR(64) DEFAULT '' COMMENT '昵称',
  `avatar_url` VARCHAR(512) DEFAULT '' COMMENT '头像URL',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0=禁用, 1=正常',
  `email_verified_at` DATETIME DEFAULT NULL COMMENT '邮箱验证时间',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(45) DEFAULT '' COMMENT '最后登录IP',
  `login_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '登录次数',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 设备表(多设备登录管理)
CREATE TABLE IF NOT EXISTS `user_devices` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `device_id` VARCHAR(128) NOT NULL COMMENT '设备唯一标识',
  `device_name` VARCHAR(128) DEFAULT '' COMMENT '设备名称',
  `device_type` VARCHAR(32) DEFAULT '' COMMENT '设备类型: desktop/web/mobile',
  `platform` VARCHAR(32) DEFAULT '' COMMENT '平台: windows/macos/linux',
  `app_version` VARCHAR(32) DEFAULT '' COMMENT '应用版本',
  `refresh_token_hash` VARCHAR(255) NOT NULL COMMENT 'refresh token哈希',
  `last_active_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最后活跃时间',
  `ip_address` VARCHAR(45) DEFAULT '' COMMENT 'IP地址',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_device` (`user_id`, `device_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_last_active` (`last_active_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设备表';

-- Token黑名单(登出时将token加入黑名单)
CREATE TABLE IF NOT EXISTS `token_blacklist` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `jti` VARCHAR(64) NOT NULL COMMENT 'JWT ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `expired_at` DATETIME NOT NULL COMMENT 'token原始过期时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_jti` (`jti`),
  KEY `idx_expired_at` (`expired_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Token黑名单';

-- 验证码表(注册/找回密码)
CREATE TABLE IF NOT EXISTS `verification_codes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL COMMENT '邮箱',
  `code` VARCHAR(16) NOT NULL COMMENT '验证码',
  `type` VARCHAR(32) NOT NULL COMMENT '类型: register/reset_password/change_email',
  `used_at` DATETIME DEFAULT NULL COMMENT '使用时间',
  `expired_at` DATETIME NOT NULL COMMENT '过期时间',
  `ip_address` VARCHAR(45) DEFAULT '' COMMENT '请求IP',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email_type` (`email`, `type`),
  KEY `idx_expired_at` (`expired_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='验证码表';

-- 操作日志
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '用户ID',
  `action` VARCHAR(64) NOT NULL COMMENT '操作类型',
  `target_type` VARCHAR(64) DEFAULT '' COMMENT '目标类型',
  `target_id` VARCHAR(64) DEFAULT '' COMMENT '目标ID',
  `detail` TEXT COMMENT '详情(JSON)',
  `ip_address` VARCHAR(45) DEFAULT '' COMMENT 'IP地址',
  `user_agent` VARCHAR(512) DEFAULT '' COMMENT 'User-Agent',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- 系统配置表(预留扩展)
CREATE TABLE IF NOT EXISTS `system_config` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `config_key` VARCHAR(128) NOT NULL COMMENT '配置键',
  `config_value` TEXT COMMENT '配置值',
  `description` VARCHAR(255) DEFAULT '' COMMENT '说明',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 插入默认系统配置
INSERT IGNORE INTO `system_config` (`config_key`, `config_value`, `description`) VALUES
('jwt_secret', '', 'JWT密钥(留空则自动生成)'),
('jwt_access_ttl', '3600', 'Access Token有效期(秒)'),
('jwt_refresh_ttl', '2592000', 'Refresh Token有效期(秒, 默认30天)'),
('register_enabled', '1', '是否开放注册'),
('max_devices_per_user', '5', '每用户最大设备数'),
('rate_limit_login_per_minute', '10', '登录频率限制(次/分钟)'),
('rate_limit_register_per_hour', '5', '注册频率限制(次/小时)');

-- 实时消息表
CREATE TABLE IF NOT EXISTS `realtime_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `event_type` VARCHAR(64) NOT NULL COMMENT '事件类型',
  `data` TEXT NOT NULL COMMENT '消息数据(JSON)',
  `delivered_at` DATETIME DEFAULT NULL COMMENT '送达时间',
  `read_at` DATETIME DEFAULT NULL COMMENT '阅读时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_delivered` (`delivered_at`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实时消息表';

-- 用户角色字段(如果不存在则添加)
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `role` VARCHAR(32) DEFAULT 'user' COMMENT '角色: user/admin' AFTER `status`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `points` INT DEFAULT 0 COMMENT '积分' AFTER `role`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `total_earned_points` INT DEFAULT 0 COMMENT '累计获得积分' AFTER `points`;

-- 公告表
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL COMMENT '标题',
  `content` TEXT COMMENT '内容',
  `type` VARCHAR(32) DEFAULT 'info' COMMENT '类型: info/warning/success/critical',
  `icon` VARCHAR(64) DEFAULT '' COMMENT '图标',
  `action_text` VARCHAR(128) DEFAULT '' COMMENT '操作按钮文本',
  `action_url` VARCHAR(512) DEFAULT '' COMMENT '操作按钮链接',
  `is_dismissible` TINYINT DEFAULT 1 COMMENT '是否可关闭',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
  `priority` INT DEFAULT 0 COMMENT '优先级(越大越靠前)',
  `start_date` DATETIME DEFAULT NULL COMMENT '开始时间',
  `end_date` DATETIME DEFAULT NULL COMMENT '结束时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `idx_date_range` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表';

-- 用户公告关闭记录
CREATE TABLE IF NOT EXISTS `user_announcement_dismiss` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `announcement_id` BIGINT UNSIGNED NOT NULL COMMENT '公告ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_announcement` (`user_id`, `announcement_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户公告关闭记录';

-- 应用版本表
CREATE TABLE IF NOT EXISTS `app_versions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `version` VARCHAR(32) NOT NULL COMMENT '版本号',
  `platform` VARCHAR(32) DEFAULT 'all' COMMENT '平台: all/windows/macos/linux',
  `download_url` VARCHAR(512) DEFAULT '' COMMENT '下载链接',
  `file_size` BIGINT DEFAULT 0 COMMENT '文件大小(字节)',
  `sha256` VARCHAR(128) DEFAULT '' COMMENT 'SHA256校验',
  `release_notes` TEXT COMMENT '更新说明',
  `is_critical` TINYINT DEFAULT 0 COMMENT '是否重要更新',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
  `published_at` DATETIME DEFAULT NULL COMMENT '发布时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_version` (`version`),
  KEY `idx_platform` (`platform`),
  KEY `idx_status` (`status`),
  KEY `idx_published_at` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='应用版本表';
