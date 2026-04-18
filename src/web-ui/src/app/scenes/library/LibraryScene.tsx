import React from 'react';
import { useI18n } from '@/infrastructure/i18n/hooks/useI18n';
import { Book, Code, FileText, Package, GitBranch, Star, ExternalLink, Zap, Bot, Wrench, Cpu, Layers, Database, Shield, Award } from 'lucide-react';
import './LibraryScene.scss';

interface LibraryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  stars?: number;
  language?: string;
  version?: string;
  author?: string;
  level?: string;
}

const libraryItems: LibraryItem[] = [
  {
    id: '1',
    name: '空灵标准库',
    description: '空灵语言核心标准库，包含集合、字符串、IO、并发等基础模块',
    category: 'core',
    icon: <Layers size={20} />,
    stars: 2341,
    language: '空灵',
    version: '2.0.0',
    author: '空灵官方',
    level: '官方',
  },
  {
    id: '2',
    name: '空灵异步运行时',
    description: '高性能异步编程运行时，支持协程、事件循环、定时器等特性',
    category: 'async',
    icon: <Zap size={20} />,
    stars: 1567,
    language: '空灵',
    version: '1.5.0',
    author: '空灵官方',
    level: '官方',
  },
  {
    id: '3',
    name: '空灵Web框架',
    description: '轻量级Web开发框架，支持路由、中间件、模板引擎等功能',
    category: 'web',
    icon: <Code size={20} />,
    stars: 1234,
    language: '空灵',
    version: '3.2.1',
    author: 'A米空',
    level: '金牌贡献者',
  },
  {
    id: '4',
    name: '空灵JSON解析器',
    description: '高性能JSON解析与序列化库，支持流式解析和大文件处理',
    category: 'data',
    icon: <Database size={20} />,
    stars: 876,
    language: '空灵',
    version: '1.8.0',
    author: '空灵官方',
    level: '官方',
  },
  {
    id: '5',
    name: '空灵正则表达式',
    description: '正则表达式引擎，支持PCRE语法和Unicode字符集',
    category: 'text',
    icon: <FileText size={20} />,
    stars: 654,
    language: '空灵',
    version: '1.2.0',
    author: 'follow me',
    level: '银牌贡献者',
  },
  {
    id: '6',
    name: '空灵系统接口',
    description: '操作系统底层接口封装，支持文件系统、进程管理、网络编程',
    category: 'system',
    icon: <Cpu size={20} />,
    stars: 987,
    language: '空灵',
    version: '2.1.0',
    author: 'ssxiaoqiao',
    level: '金牌贡献者',
  },
  {
    id: '7',
    name: '空灵测试框架',
    description: '单元测试和基准测试框架，支持断言、模拟、覆盖率报告',
    category: 'test',
    icon: <Wrench size={20} />,
    stars: 543,
    language: '空灵',
    version: '1.0.0',
    author: 'zzl',
    level: '银牌贡献者',
  },
  {
    id: '8',
    name: '空灵包管理器',
    description: '官方包管理工具，支持依赖解析、版本管理、私有仓库',
    category: 'tool',
    icon: <Package size={20} />,
    stars: 1890,
    language: '空灵',
    version: '1.6.0',
    author: '空灵官方',
    level: '官方',
  },
];

const categoryColors: Record<string, string> = {
  core: '#3b82f6',
  async: '#8b5cf6',
  web: '#10b981',
  data: '#f59e0b',
  text: '#ec4899',
  system: '#6366f1',
  test: '#14b8a6',
  tool: '#64748b',
};

const levelColors: Record<string, string> = {
  '官方': '#f59e0b',
  '金牌贡献者': '#fbbf24',
  '银牌贡献者': '#9ca3af',
  '铜牌贡献者': '#d97706',
};

const LibraryScene: React.FC = () => {
  const { t } = useI18n('common');

  return (
    <div className="bitfun-library-scene">
      <div className="bitfun-library-scene__header">
        <div className="bitfun-library-scene__header-top">
          <h1 className="bitfun-library-scene__title">{t('scenes.library')}</h1>
          <span className="bitfun-library-scene__badge">{t('library.demo')}</span>
        </div>
        <p className="bitfun-library-scene__subtitle">{t('library.subtitle')}</p>
      </div>

      <div className="bitfun-library-scene__toolbar">
        <div className="bitfun-library-scene__search">
          <input
            type="text"
            placeholder={t('library.searchPlaceholder')}
            className="bitfun-library-scene__search-input"
          />
        </div>
        <div className="bitfun-library-scene__filters">
          <button className="bitfun-library-scene__filter-btn is-active">{t('library.filterAll')}</button>
          <button className="bitfun-library-scene__filter-btn">{t('library.filterInstalled')}</button>
          <button className="bitfun-library-scene__filter-btn">{t('library.filterRecent')}</button>
        </div>
      </div>

      <div className="bitfun-library-scene__content">
        <div className="bitfun-library-scene__grid">
          {libraryItems.map((item) => (
            <div key={item.id} className="bitfun-library-scene__card">
              <div className="bitfun-library-scene__card-header-row">
                <div
                  className="bitfun-library-scene__card-icon"
                  style={{ backgroundColor: `${categoryColors[item.category]}15`, color: categoryColors[item.category] }}
                >
                  {item.icon}
                </div>
                <div className="bitfun-library-scene__card-title-wrap">
                  <h3 className="bitfun-library-scene__card-name">{item.name}</h3>
                  <span className="bitfun-library-scene__card-version">v{item.version}</span>
                </div>
              </div>
              <p className="bitfun-library-scene__card-description">{item.description}</p>
              <div className="bitfun-library-scene__card-meta">
                <div className="bitfun-library-scene__card-author-wrap">
                  <span className="bitfun-library-scene__card-author">{item.author}</span>
                  {item.level && (
                    <span
                      className="bitfun-library-scene__card-level"
                      style={{ backgroundColor: `${levelColors[item.level]}20`, color: levelColors[item.level] }}
                    >
                      {item.level === '官方' && <Shield size={10} />}
                      {item.level !== '官方' && <Award size={10} />}
                      {item.level}
                    </span>
                  )}
                </div>
                <span className="bitfun-library-scene__card-language">{item.language}</span>
                {item.stars && (
                  <span className="bitfun-library-scene__card-stars">
                    <Star size={12} />
                    {item.stars.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="bitfun-library-scene__card-actions">
                <button className="bitfun-library-scene__card-btn">{t('library.install')}</button>
                <button className="bitfun-library-scene__card-btn bitfun-library-scene__card-btn--icon">
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LibraryScene;
