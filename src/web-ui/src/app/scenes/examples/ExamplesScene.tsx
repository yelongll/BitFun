import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '@/infrastructure/i18n/hooks/useI18n';
import { FolderCode, Globe, Server, Database, Terminal, Smartphone, Gamepad2, Cpu, Star, ExternalLink, Download, X, Copy, Check, Upload, Plus, Trash2, FileText, Archive, Loader } from 'lucide-react';
import {
  getExamples,
  getMyExamples,
  downloadExample,
  downloadExampleWithProgress,
  starExample,
  uploadExample,
  uploadExampleFile,
  deleteExample,
  ExampleItem,
  isLoggedIn,
} from '@/infrastructure/api/service-api/AuthAPI';
import { createLogger } from '@/shared/utils/logger';
import './ExamplesScene.scss';

const log = createLogger('ExamplesScene');

const categoryIcons: Record<string, React.ReactNode> = {
  cli: <Terminal size={20} />,
  web: <Globe size={20} />,
  database: <Database size={20} />,
  async: <Cpu size={20} />,
  game: <Gamepad2 size={20} />,
  system: <Server size={20} />,
  mobile: <Smartphone size={20} />,
  template: <FolderCode size={20} />,
};

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

type TabType = 'official' | 'my';

const ExamplesScene: React.FC = () => {
  const { t } = useI18n('common');
  const [examples, setExamples] = useState<ExampleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<TabType>('official');
  const [selectedExample, setSelectedExample] = useState<ExampleItem | null>(null);
  const [codeContent, setCodeContent] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category: 'cli',
    difficulty: '入门',
    tags: '',
    file_content: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'text' | 'file'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchExamples = useCallback(async () => {
    setLoading(true);
    try {
      const difficulty = activeFilter === 'all' ? undefined : activeFilter;
      if (activeTab === 'official') {
        const result = await getExamples({
          page: 1,
          page_size: 50,
          search: search || undefined,
          difficulty,
        });
        setExamples(result.examples);
      } else {
        if (!isLoggedIn()) {
          setExamples([]);
          return;
        }
        const result = await getMyExamples({ page: 1, page_size: 50 });
        setExamples(result.examples);
      }
    } catch (err) {
      log.error('Failed to fetch examples', err);
    } finally {
      setLoading(false);
    }
  }, [search, activeFilter, activeTab]);

  useEffect(() => {
    fetchExamples();
  }, [fetchExamples]);

  const handleDownload = async (example: ExampleItem) => {
    if (!isLoggedIn()) {
      alert(t('examples.loginRequired', { defaultValue: '请先登录' }));
      return;
    }

    setDownloading(true);
    setDownloadingId(example.id);
    setDownloadProgress(0);
    try {
      const result = await downloadExampleWithProgress(example.id, (percent) => {
        setDownloadProgress(percent);
      });
      
      let blob: Blob;
      
      if (result.is_binary && result.content) {
        const binaryString = atob(result.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const fileExt = result.file_name.split('.').pop()?.toLowerCase() || 'bin';
        const mimeTypes: Record<string, string> = {
          'zip': 'application/zip',
          'rar': 'application/x-rar-compressed',
          'tar': 'application/x-tar',
          'gz': 'application/gzip',
          'tgz': 'application/gzip',
        };
        const mimeType = mimeTypes[fileExt] || 'application/octet-stream';
        blob = new Blob([bytes], { type: mimeType });
      } else if (result.download_url && result.download_url.startsWith('http')) {
        const a = document.createElement('a');
        a.href = result.download_url;
        a.download = result.file_name;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        alert(t('examples.downloadSuccess', { defaultValue: `文件 "${result.file_name}" 已下载到您的下载文件夹` }));
        setDownloading(false);
        setDownloadingId(null);
        return;
      } else {
        blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' });
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(t('examples.downloadSuccess', { defaultValue: `文件 "${result.file_name}" 已下载到您的下载文件夹` }));
    } catch (err) {
      log.error('Failed to download example', err);
      alert(t('examples.downloadError', { defaultValue: '下载失败，请重试' }));
    } finally {
      setDownloading(false);
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  };

  const handleStar = async (example: ExampleItem) => {
    if (!isLoggedIn()) {
      alert(t('examples.loginRequired', { defaultValue: '请先登录' }));
      return;
    }

    try {
      await starExample(example.id);
      fetchExamples();
    } catch (err) {
      log.error('Failed to star example', err);
    }
  };

  const handleViewCode = async (example: ExampleItem) => {
    setSelectedExample(example);
    setCodeContent(t('examples.loading', { defaultValue: '加载中...' }));
    try {
      const result = await downloadExample(example.id);
      setCodeContent(result.content);
    } catch (err) {
      log.error('Failed to load code', err);
      setCodeContent(t('examples.loadError', { defaultValue: '加载失败' }));
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      log.error('Failed to copy', err);
    }
  };

  const handleSearch = () => {
    fetchExamples();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-tar',
      'application/gzip',
      'text/plain',
      'text/x-c',
      'text/x-c++',
      'text/x-java',
      'text/x-python',
      'text/x-rust',
      'text/javascript',
      'text/typescript',
      'application/json',
      'application/xml',
      'text/html',
      'text/css',
      'text/markdown',
    ];

    const allowedExtensions = [
      '.zip', '.rar', '.tar', '.gz', '.tgz', '.tar.gz',
      '.c', '.cpp', '.h', '.hpp', '.java', '.py', '.rs',
      '.js', '.jsx', '.ts', '.tsx', '.json', '.xml',
      '.html', '.css', '.scss', '.sass', '.less',
      '.md', '.txt', '.sh', '.bat', '.ps1',
      '.go', '.php', '.rb', '.swift', '.kt', '.scala',
    ];

    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
      alert(t('examples.unsupportedFileType', { defaultValue: '不支持的文件类型，请上传代码文件或压缩文件' }));
      return;
    }

    setSelectedFile(file);
    if (!uploadForm.name) {
      setUploadForm({ ...uploadForm, name: file.name.replace(/\.[^/.]+$/, '') });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.name || !uploadForm.category) {
      alert(t('examples.uploadRequired', { defaultValue: '请填写名称和分类' }));
      return;
    }

    if (uploadMode === 'text' && !uploadForm.file_content) {
      alert(t('examples.codeRequired', { defaultValue: '请输入代码内容' }));
      return;
    }

    if (uploadMode === 'file' && !selectedFile) {
      alert(t('examples.fileRequired', { defaultValue: '请选择文件' }));
      return;
    }

    setUploading(true);
    try {
      if (uploadMode === 'file' && selectedFile) {
        await uploadExampleFile(selectedFile, {
          name: uploadForm.name,
          description: uploadForm.description,
          category: uploadForm.category,
          difficulty: uploadForm.difficulty,
          tags: uploadForm.tags,
        });
      } else {
        await uploadExample({
          name: uploadForm.name,
          description: uploadForm.description,
          category: uploadForm.category,
          difficulty: uploadForm.difficulty,
          tags: uploadForm.tags,
          file_content: uploadForm.file_content,
        });
      }
      setShowUploadModal(false);
      setUploadForm({
        name: '',
        description: '',
        category: 'cli',
        difficulty: '入门',
        tags: '',
        file_content: '',
      });
      setSelectedFile(null);
      setUploadMode('text');
      setActiveTab('my');
      fetchExamples();
      alert(t('examples.uploadSuccess', { defaultValue: '上传成功！您可以在"我的示例"中查看' }));
    } catch (err) {
      log.error('Failed to upload example', err);
      alert(t('examples.uploadError', { defaultValue: '上传失败' }));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (example: ExampleItem) => {
    if (!confirm(t('examples.deleteConfirm', { defaultValue: '确定要删除该示例吗？' }))) return;

    try {
      await deleteExample(example.id);
      fetchExamples();
      alert(t('examples.deleteSuccess', { defaultValue: '删除成功' }));
    } catch (err) {
      log.error('Failed to delete example', err);
      alert(t('examples.deleteError', { defaultValue: '删除失败' }));
    }
  };

  return (
    <div className="bitfun-examples-scene">
      <div className="bitfun-examples-scene__header">
        <div className="bitfun-examples-scene__header-top">
          <h1 className="bitfun-examples-scene__title">{t('scenes.examples')}</h1>
          <span className="bitfun-examples-scene__badge">{t('examples.demo')}</span>
        </div>
        <p className="bitfun-examples-scene__subtitle">{t('examples.subtitle')}</p>
      </div>

      <div className="bitfun-examples-scene__tabs">
        <button
          className={`bitfun-examples-scene__tab ${activeTab === 'official' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('official')}
        >
          {t('examples.official', { defaultValue: '官方示例' })}
        </button>
        <button
          className={`bitfun-examples-scene__tab ${activeTab === 'my' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          {t('examples.myExamples', { defaultValue: '我的示例' })}
        </button>
        {isLoggedIn() && (
          <button
            className="bitfun-examples-scene__tab-btn"
            onClick={() => setShowUploadModal(true)}
          >
            <Plus size={16} />
            {t('examples.upload', { defaultValue: '上传示例' })}
          </button>
        )}
      </div>

      <div className="bitfun-examples-scene__toolbar">
        <div className="bitfun-examples-scene__search">
          <input
            type="text"
            placeholder={t('examples.searchPlaceholder')}
            className="bitfun-examples-scene__search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="bitfun-examples-scene__search-btn" onClick={handleSearch}>
            {t('examples.search', { defaultValue: '搜索' })}
          </button>
        </div>
        <div className="bitfun-examples-scene__filters">
          <button
            className={`bitfun-examples-scene__filter-btn ${activeFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            {t('examples.filterAll')}
          </button>
          <button
            className={`bitfun-examples-scene__filter-btn ${activeFilter === '入门' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('入门')}
          >
            {t('examples.filterBeginner')}
          </button>
          <button
            className={`bitfun-examples-scene__filter-btn ${activeFilter === '进阶' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('进阶')}
          >
            {t('examples.filterAdvanced')}
          </button>
          <button
            className={`bitfun-examples-scene__filter-btn ${activeFilter === '高级' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('高级')}
          >
            {t('examples.filterExpert', { defaultValue: '高级' })}
          </button>
        </div>
      </div>

      <div className="bitfun-examples-scene__content">
        {loading ? (
          <div className="bitfun-examples-scene__loading">
            {t('examples.loading', { defaultValue: '加载中...' })}
          </div>
        ) : examples.length === 0 ? (
          <div className="bitfun-examples-scene__loading">
            {activeTab === 'my'
              ? t('examples.noMyExamples', { defaultValue: '暂无示例，点击"上传示例"添加' })
              : t('examples.noExamples', { defaultValue: '暂无示例' })}
          </div>
        ) : (
          <div className="bitfun-examples-scene__grid">
            {examples.map((item) => (
              <div key={item.id} className="bitfun-examples-scene__card">
                <div className="bitfun-examples-scene__card-header-row">
                  <div
                    className="bitfun-examples-scene__card-icon"
                    style={{ backgroundColor: `${categoryColors[item.category] || '#64748b'}15`, color: categoryColors[item.category] || '#64748b' }}
                  >
                    {categoryIcons[item.category] || <FolderCode size={20} />}
                  </div>
                  <div className="bitfun-examples-scene__card-title-wrap">
                    <h3 className="bitfun-examples-scene__card-name">{item.name}</h3>
                    <span
                      className="bitfun-examples-scene__card-difficulty"
                      style={{ backgroundColor: `${difficultyColors[item.difficulty] || '#64748b'}20`, color: difficultyColors[item.difficulty] || '#64748b' }}
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
                  <div className="bitfun-examples-scene__card-stats">
                    <span className="bitfun-examples-scene__card-stars">
                      <Star size={12} />
                      {item.stars.toLocaleString()}
                    </span>
                    <span className="bitfun-examples-scene__card-downloads">
                      <Download size={12} />
                      {item.downloads}
                    </span>
                  </div>
                </div>
                <div className="bitfun-examples-scene__card-actions">
                  <button
                    className={`bitfun-examples-scene__card-btn ${downloading && downloadingId === item.id ? 'is-downloading' : ''}`}
                    onClick={() => handleDownload(item)}
                    disabled={downloading}
                  >
                    {downloading && downloadingId === item.id ? (
                      <>
                        <div className="bitfun-examples-scene__progress-bar">
                          <div
                            className="bitfun-examples-scene__progress-fill"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                        <span className="bitfun-examples-scene__progress-text">{downloadProgress}%</span>
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        {t('examples.download')}
                      </>
                    )}
                  </button>
                  <button
                    className="bitfun-examples-scene__card-btn"
                    onClick={() => handleViewCode(item)}
                  >
                    <ExternalLink size={14} />
                    {t('examples.viewCode', { defaultValue: '查看' })}
                  </button>
                  {activeTab === 'official' ? (
                    <button
                      className="bitfun-examples-scene__card-btn bitfun-examples-scene__card-btn--icon"
                      onClick={() => handleStar(item)}
                    >
                      <Star size={14} />
                    </button>
                  ) : (
                    <button
                      className="bitfun-examples-scene__card-btn bitfun-examples-scene__card-btn--icon"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedExample && (
        <div className="bitfun-examples-scene__modal">
          <div className="bitfun-examples-scene__modal-content">
            <div className="bitfun-examples-scene__modal-header">
              <h3>{selectedExample.name}</h3>
              <div className="bitfun-examples-scene__modal-actions">
                <button onClick={handleCopy} className="bitfun-examples-scene__modal-btn">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <button onClick={() => handleDownload(selectedExample)} className="bitfun-examples-scene__modal-btn" disabled={downloading}>
                  {downloading && downloadingId === selectedExample.id ? <Loader size={16} className="bitfun-examples-scene__spin" /> : <Download size={16} />}
                </button>
                <button onClick={() => setSelectedExample(null)} className="bitfun-examples-scene__modal-btn">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="bitfun-examples-scene__modal-body">
              <pre className="bitfun-examples-scene__code">
                <code>{codeContent}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="bitfun-examples-scene__modal">
          <div className="bitfun-examples-scene__modal-content" style={{ maxWidth: '600px' }}>
            <div className="bitfun-examples-scene__modal-header">
              <h3>{t('examples.upload', { defaultValue: '上传示例' })}</h3>
              <button onClick={() => setShowUploadModal(false)} className="bitfun-examples-scene__modal-btn">
                <X size={16} />
              </button>
            </div>
            <div className="bitfun-examples-scene__modal-body" style={{ padding: '20px' }}>
              <div className="bitfun-examples-scene__form-group">
                <label>{t('examples.name', { defaultValue: '名称' })} *</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  placeholder={t('examples.namePlaceholder', { defaultValue: '请输入示例名称' })}
                />
              </div>
              <div className="bitfun-examples-scene__form-group">
                <label>{t('examples.description', { defaultValue: '描述' })}</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder={t('examples.descriptionPlaceholder', { defaultValue: '请输入描述' })}
                  rows={2}
                />
              </div>
              <div className="bitfun-examples-scene__form-row">
                <div className="bitfun-examples-scene__form-group">
                  <label>{t('examples.category', { defaultValue: '分类' })} *</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  >
                    <option value="cli">{t('examples.categoryCli', { defaultValue: '命令行工具' })}</option>
                    <option value="web">{t('examples.categoryWeb', { defaultValue: 'Web服务' })}</option>
                    <option value="database">{t('examples.categoryDatabase', { defaultValue: '数据库' })}</option>
                    <option value="async">{t('examples.categoryAsync', { defaultValue: '并发异步' })}</option>
                    <option value="game">{t('examples.categoryGame', { defaultValue: '游戏开发' })}</option>
                    <option value="system">{t('examples.categorySystem', { defaultValue: '系统工具' })}</option>
                    <option value="mobile">{t('examples.categoryMobile', { defaultValue: '移动应用' })}</option>
                    <option value="template">{t('examples.categoryTemplate', { defaultValue: '项目模板' })}</option>
                  </select>
                </div>
                <div className="bitfun-examples-scene__form-group">
                  <label>{t('examples.difficulty', { defaultValue: '难度' })}</label>
                  <select
                    value={uploadForm.difficulty}
                    onChange={(e) => setUploadForm({ ...uploadForm, difficulty: e.target.value })}
                  >
                    <option value="入门">{t('examples.filterBeginner')}</option>
                    <option value="进阶">{t('examples.filterAdvanced')}</option>
                    <option value="高级">{t('examples.filterExpert', { defaultValue: '高级' })}</option>
                  </select>
                </div>
              </div>
              <div className="bitfun-examples-scene__form-group">
                <label>{t('examples.tags', { defaultValue: '标签' })}</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  placeholder={t('examples.tagsPlaceholder', { defaultValue: '标签,逗号分隔' })}
                />
              </div>
              <div className="bitfun-examples-scene__form-group">
                <label>{t('examples.uploadMode', { defaultValue: '上传方式' })}</label>
                <div className="bitfun-examples-scene__upload-modes">
                  <button
                    type="button"
                    className={`bitfun-examples-scene__upload-mode-btn ${uploadMode === 'text' ? 'is-active' : ''}`}
                    onClick={() => setUploadMode('text')}
                  >
                    <FileText size={16} />
                    {t('examples.textInput', { defaultValue: '文本输入' })}
                  </button>
                  <button
                    type="button"
                    className={`bitfun-examples-scene__upload-mode-btn ${uploadMode === 'file' ? 'is-active' : ''}`}
                    onClick={() => setUploadMode('file')}
                  >
                    <Archive size={16} />
                    {t('examples.fileUpload', { defaultValue: '文件上传' })}
                  </button>
                </div>
              </div>
              {uploadMode === 'text' ? (
                <div className="bitfun-examples-scene__form-group">
                  <label>{t('examples.code', { defaultValue: '代码内容' })} *</label>
                  <textarea
                    value={uploadForm.file_content}
                    onChange={(e) => setUploadForm({ ...uploadForm, file_content: e.target.value })}
                    placeholder={t('examples.codePlaceholder', { defaultValue: '请输入代码内容' })}
                    rows={10}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              ) : (
                <div className="bitfun-examples-scene__form-group">
                  <label>{t('examples.file', { defaultValue: '选择文件' })} *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip,.rar,.tar,.gz,.tgz,.tar.gz,.c,.cpp,.h,.hpp,.java,.py,.rs,.js,.jsx,.ts,.tsx,.json,.xml,.html,.css,.scss,.sass,.less,.md,.txt,.sh,.bat,.ps1,.go,.php,.rb,.swift,.kt,.scala"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <div
                    className="bitfun-examples-scene__file-drop-zone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="bitfun-examples-scene__file-info">
                        <Archive size={24} />
                        <span className="bitfun-examples-scene__file-name">{selectedFile.name}</span>
                        <span className="bitfun-examples-scene__file-size">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </span>
                      </div>
                    ) : (
                      <div className="bitfun-examples-scene__file-placeholder">
                        <Upload size={24} />
                        <span>{t('examples.selectFile', { defaultValue: '点击选择文件或拖拽文件到此处' })}</span>
                        <span className="bitfun-examples-scene__file-hint">
                          {t('examples.supportedFormats', { defaultValue: '支持 .zip, .rar, .tar.gz 等压缩文件，以及各种代码文件' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="bitfun-examples-scene__modal-footer">
              <button
                className="bitfun-examples-scene__btn bitfun-examples-scene__btn--secondary"
                onClick={() => setShowUploadModal(false)}
              >
                {t('common.cancel', { defaultValue: '取消' })}
              </button>
              <button
                className="bitfun-examples-scene__btn bitfun-examples-scene__btn--primary"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? t('examples.uploading', { defaultValue: '上传中...' }) : t('examples.upload', { defaultValue: '上传' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamplesScene;
