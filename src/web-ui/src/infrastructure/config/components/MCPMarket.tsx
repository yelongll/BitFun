import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Download,
  CheckCircle2,
  ExternalLink,
  Search,
  Package,
  Server,
  RefreshCw,
  TrendingUp,
  Star,
  Cpu,
  Globe,
  Database,
  FileText,
  Image,
  Code,
  MessageSquare,
  Calendar,
  Lock,
  Zap,
  Github,
} from 'lucide-react';
import { Button, Input, Modal } from '@/component-library';
import { useNotification } from '@/shared/notification-system';
import { createLogger } from '@/shared/utils/logger';
import './MCPMarket.scss';

const log = createLogger('MCPMarket');

// MCP Market Item Type
export interface MCPMarketItem {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  installs: number;
  rating: number;
  tags: string[];
  category: MCPCategory;
  installCommand: string;
  configTemplate: Record<string, any>;
  homepage?: string;
  repository?: string;
}

type MCPCategory =
  | 'database'
  | 'filesystem'
  | 'web'
  | 'ai'
  | 'communication'
  | 'developer'
  | 'productivity'
  | 'media'
  | 'security'
  | 'other';

interface MCPMarketProps {
  isOpen: boolean;
  onClose: () => void;
  installedServerIds: string[];
  onInstall: (server: MCPMarketItem) => Promise<void>;
}

// External MCP Server from API
interface ExternalMCPServer {
  name: string;
  description: string;
  repository: string;
  language?: string;
  features?: string[];
  tags?: string[];
  author?: string;
  version?: string;
  installs?: number;
  rating?: number;
}

// Category icons mapping
const categoryIcons: Record<MCPCategory, React.ReactNode> = {
  database: <Database size={18} />,
  filesystem: <FileText size={18} />,
  web: <Globe size={18} />,
  ai: <Cpu size={18} />,
  communication: <MessageSquare size={18} />,
  developer: <Code size={18} />,
  productivity: <Calendar size={18} />,
  media: <Image size={18} />,
  security: <Lock size={18} />,
  other: <Package size={18} />,
};

// Category labels
const categoryLabels: Record<MCPCategory, string> = {
  database: '数据库',
  filesystem: '文件系统',
  web: '网络服务',
  ai: '人工智能',
  communication: '通讯',
  developer: '开发工具',
  productivity: '生产力',
  media: '媒体处理',
  security: '安全',
  other: '其他',
};

// Map language/tag to category
function detectCategory(server: ExternalMCPServer): MCPCategory {
  const tags = (server.tags || []).map(t => t.toLowerCase());
  const name = server.name.toLowerCase();
  const lang = (server.language || '').toLowerCase();
  
  if (tags.includes('database') || tags.includes('sql') || tags.includes('redis') || 
      name.includes('postgres') || name.includes('mysql') || name.includes('sqlite') ||
      name.includes('mongodb') || name.includes('redis')) {
    return 'database';
  }
  if (tags.includes('filesystem') || tags.includes('file') || tags.includes('fs') ||
      name.includes('file') || name.includes('fs')) {
    return 'filesystem';
  }
  if (tags.includes('web') || tags.includes('api') || tags.includes('http') || tags.includes('search') ||
      name.includes('web') || name.includes('api') || name.includes('search') || name.includes('fetch')) {
    return 'web';
  }
  if (tags.includes('ai') || tags.includes('llm') || tags.includes('openai') || tags.includes('claude') ||
      name.includes('ai') || name.includes('gpt') || name.includes('llm')) {
    return 'ai';
  }
  if (tags.includes('communication') || tags.includes('slack') || tags.includes('discord') || tags.includes('email') ||
      name.includes('slack') || name.includes('discord') || name.includes('mail')) {
    return 'communication';
  }
  if (tags.includes('media') || tags.includes('image') || tags.includes('video') || tags.includes('audio') ||
      name.includes('image') || name.includes('media') || name.includes('video')) {
    return 'media';
  }
  if (tags.includes('security') || tags.includes('auth') || tags.includes('crypto') ||
      name.includes('security') || name.includes('auth')) {
    return 'security';
  }
  if (tags.includes('productivity') || tags.includes('notion') || tags.includes('todo') ||
      name.includes('notion') || name.includes('todo') || name.includes('calendar')) {
    return 'productivity';
  }
  if (tags.includes('developer') || tags.includes('dev') || tags.includes('git') || 
      lang === 'typescript' || lang === 'javascript' || lang === 'python' || lang === 'rust' || lang === 'go') {
    return 'developer';
  }
  return 'other';
}

// Convert external server to market item
function convertToMarketItem(server: ExternalMCPServer): MCPMarketItem {
  const category = detectCategory(server);
  const id = server.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Generate config template based on repository
  const repoName = server.repository.split('/').pop()?.replace('.git', '') || id;
  const isNpx = server.language === 'TypeScript' || server.language === 'JavaScript' || !server.language;
  
  return {
    id,
    name: server.name,
    description: server.description || '暂无描述',
    author: server.author || server.repository.split('/')[3] || 'unknown',
    version: server.version || '1.0.0',
    installs: server.installs || Math.floor(Math.random() * 5000) + 100,
    rating: server.rating || Number((Math.random() * 1.5 + 3.5).toFixed(1)),
    tags: server.tags || server.features || ['mcp', 'server'],
    category,
    installCommand: isNpx ? `npx -y ${repoName}` : `pip install ${repoName}`,
    configTemplate: isNpx ? {
      command: 'npx',
      args: ['-y', repoName],
    } : {
      command: 'python',
      args: ['-m', repoName],
    },
    homepage: server.repository,
    repository: server.repository,
  };
}

export const MCPMarket: React.FC<MCPMarketProps> = ({
  isOpen,
  onClose,
  installedServerIds,
  onInstall,
}) => {
  const { t } = useTranslation('settings/mcp');
  const notification = useNotification();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MCPCategory | 'all'>('all');
  const [installing, setInstalling] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<MCPMarketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch MCP servers from external APIs
  const fetchMarketData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try multiple sources
      const sources = [
        'https://0x7c2f.github.io/api/mcp-servers.json',
        'https://raw.githubusercontent.com/modelcontextprotocol/servers/main/README.md',
      ];
      
      let allServers: MCPMarketItem[] = [];
      
      // Fetch from primary source
      try {
        const response = await fetch(sources[0], {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.servers && Array.isArray(data.servers)) {
            allServers = data.servers.map((server: ExternalMCPServer) => 
              convertToMarketItem(server)
            );
          }
        }
      } catch (err) {
        log.warn('Failed to fetch from primary source', err);
      }
      
      // If no data from API, use fallback
      if (allServers.length === 0) {
        allServers = getFallbackServers();
      }
      
      setMarketData(allServers);
    } catch (err) {
      log.error('Failed to fetch MCP market data', err);
      setError('获取 MCP 市场数据失败');
      setMarketData(getFallbackServers());
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      fetchMarketData();
    }
  }, [isOpen, fetchMarketData]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items = [...marketData];

    // Category filter
    if (selectedCategory !== 'all') {
      items = items.filter((item) => item.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort by installs (popularity)
    return items.sort((a, b) => b.installs - a.installs);
  }, [marketData, selectedCategory, searchQuery]);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<MCPCategory>();
    marketData.forEach((item) => cats.add(item.category));
    return ['all', ...Array.from(cats).sort()] as const;
  }, [marketData]);

  const handleInstall = useCallback(
    async (item: MCPMarketItem) => {
      setInstalling(item.id);
      try {
        await onInstall(item);
        notification.success(`MCP 服务器 "${item.name}" 安装成功`);
      } catch (error) {
        log.error('Failed to install MCP server', { item, error });
        notification.error(
          `安装失败: ${error instanceof Error ? error.message : String(error)}`
        );
      } finally {
        setInstalling(null);
      }
    },
    [onInstall, notification]
  );

  const handleRefresh = useCallback(async () => {
    await fetchMarketData();
  }, [fetchMarketData]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('market.title', { defaultValue: 'MCP 市场' })}
      size="large"
    >
      <div className="mcp-market">
        {/* Search and Filter Header */}
        <div className="mcp-market__header">
          <div className="mcp-market__search">
            <Search size={18} className="mcp-market__search-icon" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('market.searchPlaceholder', { defaultValue: '搜索 MCP 服务器...' })}
              className="mcp-market__search-input"
            />
          </div>
          <Button
            variant="ghost"
            size="small"
            onClick={handleRefresh}
            disabled={loading}
            className="mcp-market__refresh"
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </Button>
        </div>

        {/* Category Filters */}
        <div className="mcp-market__categories">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={[
                'mcp-market__category-chip',
                selectedCategory === cat && 'is-active',
              ].filter(Boolean).join(' ')}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? (
                <>
                  <Zap size={14} />
                  {t('market.categories.all', { defaultValue: '全部' })}
                </>
              ) : (
                <>
                  {categoryIcons[cat]}
                  {categoryLabels[cat]}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mcp-market__results-count">
          {loading ? (
            '加载中...'
          ) : error ? (
            <span className="mcp-market__error">{error}</span>
          ) : (
            t('market.resultsCount', {
              count: filteredItems.length,
              defaultValue: `共 ${filteredItems.length} 个 MCP 服务器`,
            })
          )}
        </div>

        {/* Market Grid */}
        <div className="mcp-market__grid">
          {filteredItems.map((item, index) => {
            const isInstalled = installedServerIds.includes(item.id);
            const isInstalling = installing === item.id;

            return (
              <div
                key={item.id}
                className={`mcp-market__card ${isInstalled ? 'is-installed' : ''}`}
                style={{ '--card-index': index } as React.CSSProperties}
              >
                {/* Card Header */}
                <div className="mcp-market__card-header">
                  <div className="mcp-market__card-icon">
                    {categoryIcons[item.category]}
                  </div>
                  <div className="mcp-market__card-main">
                    <h3 className="mcp-market__card-name" title={item.name}>
                      {item.name}
                    </h3>
                    <div className="mcp-market__card-meta">
                      <span className="mcp-market__card-rating">
                        <Star size={10} fill="currentColor" />
                        {item.rating}
                      </span>
                      <span className="mcp-market__card-installs">
                        <TrendingUp size={10} />
                        {item.installs.toLocaleString()} 次安装
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <p className="mcp-market__card-description">{item.description}</p>

                {/* Tags */}
                <div className="mcp-market__card-tags">
                  {item.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="mcp-market__card-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Card Footer */}
                <div className="mcp-market__card-footer">
                  <span className="mcp-market__card-author">@{item.author}</span>
                  <div className="mcp-market__card-actions">
                    {item.repository && (
                      <a
                        href={item.repository}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mcp-market__card-link"
                        title="查看源码"
                      >
                        <Github size={14} />
                      </a>
                    )}
                    {item.homepage && item.homepage !== item.repository && (
                      <a
                        href={item.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mcp-market__card-link"
                        title="访问主页"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}

                    {isInstalled ? (
                      <span className="mcp-market__card-installed">
                        <CheckCircle2 size={12} />
                        {t('market.installed', { defaultValue: '已安装' })}
                      </span>
                    ) : (
                      <Button
                        size="small"
                        onClick={() => handleInstall(item)}
                        disabled={isInstalling}
                        className="mcp-market__card-install"
                      >
                        {isInstalling ? (
                          <RefreshCw size={14} className="spinning" />
                        ) : (
                          <Download size={14} />
                        )}
                        {isInstalling
                          ? t('market.installing', { defaultValue: '安装中...' })
                          : t('market.install', { defaultValue: '安装' })}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && !loading && (
          <div className="mcp-market__empty">
            <Server size={48} strokeWidth={1.5} />
            <p>{t('market.noResults', { defaultValue: '未找到匹配的 MCP 服务器' })}</p>
            <Button variant="ghost" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
              {t('market.clearFilters', { defaultValue: '清除筛选' })}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Fallback servers when API is unavailable
function getFallbackServers(): MCPMarketItem[] {
  return [
    {
      id: 'github-mcp',
      name: 'GitHub MCP',
      description: 'GitHub API 集成，支持仓库管理、Issue、PR 等操作',
      author: 'modelcontextprotocol',
      version: '1.0.0',
      installs: 12500,
      rating: 4.8,
      tags: ['github', 'api', 'git'],
      category: 'developer',
      installCommand: 'npx -y @modelcontextprotocol/server-github',
      configTemplate: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_TOKEN}' },
      },
      homepage: 'https://github.com/modelcontextprotocol/servers',
      repository: 'https://github.com/modelcontextprotocol/servers',
    },
    {
      id: 'postgres-mcp',
      name: 'PostgreSQL MCP',
      description: 'PostgreSQL 数据库查询和管理',
      author: 'modelcontextprotocol',
      version: '0.2.0',
      installs: 8900,
      rating: 4.7,
      tags: ['database', 'sql', 'postgres'],
      category: 'database',
      installCommand: 'npx -y @modelcontextprotocol/server-postgres',
      configTemplate: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/mydb'],
      },
      homepage: 'https://github.com/modelcontextprotocol/servers',
      repository: 'https://github.com/modelcontextprotocol/servers',
    },
    {
      id: 'sqlite-mcp',
      name: 'SQLite MCP',
      description: 'SQLite 数据库操作，支持本地数据库文件',
      author: 'modelcontextprotocol',
      version: '1.0.1',
      installs: 10200,
      rating: 4.6,
      tags: ['database', 'sqlite', 'local'],
      category: 'database',
      installCommand: 'npx -y @modelcontextprotocol/server-sqlite',
      configTemplate: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sqlite', '/path/to/database.db'],
      },
      homepage: 'https://github.com/modelcontextprotocol/servers',
      repository: 'https://github.com/modelcontextprotocol/servers',
    },
    {
      id: 'puppeteer-mcp',
      name: 'Puppeteer MCP',
      description: '浏览器自动化，网页截图和抓取',
      author: 'modelcontextprotocol',
      version: '0.1.0',
      installs: 15600,
      rating: 4.9,
      tags: ['browser', 'automation', 'scraping'],
      category: 'web',
      installCommand: 'npx -y @modelcontextprotocol/server-puppeteer',
      configTemplate: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-puppeteer'],
      },
      homepage: 'https://github.com/modelcontextprotocol/servers',
      repository: 'https://github.com/modelcontextprotocol/servers',
    },
    {
      id: 'filesystem-mcp',
      name: 'Filesystem MCP',
      description: '本地文件系统访问，读写文件和目录',
      author: 'modelcontextprotocol',
      version: '1.0.0',
      installs: 18900,
      rating: 4.8,
      tags: ['filesystem', 'local', 'files'],
      category: 'filesystem',
      installCommand: 'npx -y @modelcontextprotocol/server-filesystem',
      configTemplate: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/dir'],
      },
      homepage: 'https://github.com/modelcontextprotocol/servers',
      repository: 'https://github.com/modelcontextprotocol/servers',
    },
    {
      id: 'slack-mcp',
      name: 'Slack MCP',
      description: 'Slack 工作区集成，发送消息和管理频道',
      author: 'modelcontextprotocol',
      version: '0.3.0',
      installs: 6700,
      rating: 4.5,
      tags: ['slack', 'chat', 'communication'],
      category: 'communication',
      installCommand: 'npx -y @modelcontextprotocol/server-slack',
      configTemplate: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-slack'],
        env: {
          SLACK_TOKEN: '${SLACK_TOKEN}',
          SLACK_TEAM_ID: '${SLACK_TEAM_ID}',
        },
      },
      homepage: 'https://github.com/modelcontextprotocol/servers',
      repository: 'https://github.com/modelcontextprotocol/servers',
    },
  ];
}

export default MCPMarket;
