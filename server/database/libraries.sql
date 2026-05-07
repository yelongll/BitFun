-- 库表
CREATE TABLE IF NOT EXISTS `libraries` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '库名称',
  `description` TEXT COMMENT '描述',
  `version` VARCHAR(50) DEFAULT '1.0.0' COMMENT '版本号',
  `author` VARCHAR(100) DEFAULT NULL COMMENT '作者',
  `category` VARCHAR(50) NOT NULL COMMENT '分类',
  `tags` VARCHAR(500) DEFAULT NULL COMMENT '标签，逗号分隔',
  `file_content` LONGTEXT COMMENT '文件内容（文本）',
  `file_path` VARCHAR(255) DEFAULT NULL COMMENT '文件路径',
  `file_size` INT UNSIGNED DEFAULT 0 COMMENT '文件大小（字节）',
  `downloads` INT UNSIGNED DEFAULT 0 COMMENT '下载次数',
  `stars` INT UNSIGNED DEFAULT 0 COMMENT '收藏数',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `is_official` TINYINT NOT NULL DEFAULT 1 COMMENT '是否官方库',
  `user_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '用户ID',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`),
  KEY `idx_downloads` (`downloads`),
  KEY `idx_is_official` (`is_official`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库表';

-- 库收藏表
CREATE TABLE IF NOT EXISTS `library_stars` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `library_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_library` (`user_id`, `library_id`),
  KEY `idx_library_id` (`library_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库收藏表';

-- 插入一些示例库
INSERT INTO `libraries` (`name`, `description`, `version`, `author`, `category`, `tags`, `file_content`, `status`, `sort_order`) VALUES
('标准输入输出库', '提供控制台输入输出功能', '1.0.0', '空灵团队', 'standard', '输入,输出,控制台', '// 标准输入输出库\nimport \"std/io.kl\"\n\n// 打印到控制台\nfunction print(text) {\n    std.io.write(text)\n}\n\n// 从控制台读取\nfunction input() {\n    return std.io.read()\n}', 1, 1),
('数学运算库', '提供常用数学函数', '1.0.0', '空灵团队', 'standard', '数学,计算,函数', '// 数学运算库\nimport \"std/math.kl\"\n\n// 计算平方根\nfunction sqrt(n) {\n    return std.math.sqrt(n)\n}\n\n// 计算幂\nfunction pow(base, exp) {\n    return std.math.pow(base, exp)\n}', 1, 2),
('字符串处理库', '提供字符串操作函数', '1.0.0', '空灵团队', 'standard', '字符串,文本,处理', '// 字符串处理库\nimport \"std/string.kl\"\n\n// 字符串长度\nfunction len(s) {\n    return std.string.length(s)\n}\n\n// 字符串分割\nfunction split(s, sep) {\n    return std.string.split(s, sep)\n}', 1, 3);
