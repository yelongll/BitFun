import React from 'react';
import { useI18n } from '@/infrastructure/i18n/hooks/useI18n';
import { FolderCode, Globe, Server, Database, Terminal, Smartphone, Gamepad2, Cpu, Star, ExternalLink, Download } from 'lucide-react';
import './ExamplesScene.scss';

interface ExampleItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  stars?: number;
  difficulty?: string;
  author?: string;
  tags?: string[];
}

const exampleItems: ExampleItem[] = [
  {
    id: '1',
    name: '空灵命令行工具',
    description: '学习如何使用空灵语言开发命令行应用，包含参数解析、输出格式化等功能',
    category: 'cli',
    icon: <Terminal size={20} />,
    stars: 1234,
    difficulty: '入门',
    author: '空灵官方',
    tags: ['CLI', '基础'],
  },
  {
    id: '2',
    name: '空灵Web服务',
    description: '使用空灵Web框架构建RESTful API服务，包含路由、中间件、JSON处理',
    category: 'web',
    icon: <Globe size={20} />,
    stars: 987,
    difficulty: '进阶',
    author: 'A米空',
    tags: ['Web', 'API'],
  },
  {
    id: '3',
    name: '空灵数据库应用',
    description: '空灵语言连接SQLite数据库，实现CRUD操作和事务处理',
    category: 'database',
    icon: <Database size={20} />,
    stars: 756,
    difficulty: '进阶',
    author: 'zzl',
    tags: ['数据库', 'SQLite'],
  },
  {
    id: '4',
    name: '空灵并发服务',
    description: '利用空灵异步运行时构建高并发服务，学习协程和事件循环',
    category: 'async',
    icon: <Cpu size={20} />,
    stars: 654,
    difficulty: '高级',
    author: '空灵官方',
    tags: ['并发', '异步'],
  },
  {
    id: '5',
    name: '空灵游戏开发',
    description: '使用空灵语言开发简单的2D游戏，学习图形渲染和事件处理',
    category: 'game',
    icon: <Gamepad2 size={20} />,
    stars: 543,
    difficulty: '高级',
    author: 'follow me',
    tags: ['游戏', '图形'],
  },
  {
    id: '6',
    name: '空灵系统工具',
    description: '开发系统级工具，学习文件操作、进程管理和系统调用',
    category: 'system',
    icon: <Server size={20} />,
    stars: 432,
    difficulty: '进阶',
    author: 'A米空',
    tags: ['系统', '工具'],
  },
  {
    id: '7',
    name: '空灵移动应用',
    description: '使用空灵语言开发跨平台移动应用，支持Android和iOS',
    category: 'mobile',
    icon: <Smartphone size={20} />,
    stars: 321,
    difficulty: '高级',
    author: 'ssxiaoqiao',
    tags: ['移动', '跨平台'],
  },
  {
    id: '8',
    name: '空灵项目模板',
    description: '标准项目模板，包含目录结构、配置文件、测试框架等',
    category: 'template',
    icon: <FolderCode size={20} />,
    stars: 2100,
    difficulty: '入门',
    author: '空灵官方',
    tags: ['模板', '基础'],
  },
];

const categoryColors: Record<string, string> = {
  cli: '#3b82f6',
  web: '#10b981',
  database: '#f59e0b',
  async: '#8b5cf6',
  game: '#ec4899',
  system: '#6366f1',
  mobile: '#14b8a6',
  template: '#64748b',
};

const difficultyColors: Record<string, string> = {
  '入门': '#10b981',
  '进阶': '#f59e0b',
  '高级': '#ef4444',
};

const ExamplesScene: React.FC = () => {
  const { t } = useI18n('common');

  return (
    <div className="bitfun-examples-scene">
      <div className="bitfun-examples-scene__header">
        <div className="bitfun-examples-scene__header-top">
          <h1 className="bitfun-examples-scene__title">{t('scenes.examples')}</h1>
          <span className="bitfun-examples-scene__badge">{t('examples.demo')}</span>
        </div>
        <p className="bitfun-examples-scene__subtitle">{t('examples.subtitle')}</p>
      </div>

      <div className="bitfun-examples-scene__toolbar">
        <div className="bitfun-examples-scene__search">
          <input
            type="text"
            placeholder={t('examples.searchPlaceholder')}
            className="bitfun-examples-scene__search-input"
          />
        </div>
        <div className="bitfun-examples-scene__filters">
          <button className="bitfun-examples-scene__filter-btn is-active">{t('examples.filterAll')}</button>
          <button className="bitfun-examples-scene__filter-btn">{t('examples.filterBeginner')}</button>
          <button className="bitfun-examples-scene__filter-btn">{t('examples.filterAdvanced')}</button>
        </div>
      </div>

      <div className="bitfun-examples-scene__content">
        <div className="bitfun-examples-scene__grid">
          {exampleItems.map((item) => (
            <div key={item.id} className="bitfun-examples-scene__card">
              <div className="bitfun-examples-scene__card-header-row">
                <div
                  className="bitfun-examples-scene__card-icon"
                  style={{ backgroundColor: `${categoryColors[item.category]}15`, color: categoryColors[item.category] }}
                >
                  {item.icon}
                </div>
                <div className="bitfun-examples-scene__card-title-wrap">
                  <h3 className="bitfun-examples-scene__card-name">{item.name}</h3>
                  <span
                    className="bitfun-examples-scene__card-difficulty"
                    style={{ backgroundColor: `${difficultyColors[item.difficulty || '入门']}20`, color: difficultyColors[item.difficulty || '入门'] }}
                  >
                    {item.difficulty}
                  </span>
                </div>
              </div>
              <p className="bitfun-examples-scene__card-description">{item.description}</p>
              <div className="bitfun-examples-scene__card-tags">
                {item.tags?.map((tag, index) => (
                  <span key={index} className="bitfun-examples-scene__card-tag">{tag}</span>
                ))}
              </div>
              <div className="bitfun-examples-scene__card-meta">
                <span className="bitfun-examples-scene__card-author">{item.author}</span>
                {item.stars && (
                  <span className="bitfun-examples-scene__card-stars">
                    <Star size={12} />
                    {item.stars.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="bitfun-examples-scene__card-actions">
                <button className="bitfun-examples-scene__card-btn">
                  <Download size={14} />
                  {t('examples.download')}
                </button>
                <button className="bitfun-examples-scene__card-btn bitfun-examples-scene__card-btn--icon">
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

export default ExamplesScene;
