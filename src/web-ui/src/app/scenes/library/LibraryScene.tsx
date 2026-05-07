import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/infrastructure/i18n/hooks/useI18n';
import { Code, Package, Star, Zap, Wrench, Cpu, Layers, Database, Shield, Download, X, FileCode, FolderArchive, Plus } from 'lucide-react';
import { createLogger } from '@/shared/utils/logger';
import {
  getLibraries,
  getLibraryCategories,
  downloadLibraryWithProgress,
  starLibrary,
  getMyLibraries,
  uploadLibrary,
  uploadLibraryFile,
  LibraryItem,
  isLoggedIn,
} from '@/infrastructure/api/service-api/AuthAPI';
import './LibraryScene.scss';

const log = createLogger('LibraryScene');

const categoryIcons: Record<string, React.ReactNode> = {
  standard: <Layers size={20} />,
  async: <Zap size={20} />,
  web: <Code size={20} />,
  database: <Database size={20} />,
  system: <Cpu size={20} />,
  tool: <Wrench size={20} />,
};

const categoryColors: Record<string, string> = {
  standard: '#3b82f6',
  async: '#8b5cf6',
  web: '#10b981',
  database: '#f59e0b',
  system: '#6366f1',
  tool: '#64748b',
};

const LibraryScene: React.FC = () => {
  const { t } = useI18n('common');
  const [libraries, setLibraries] = useState<LibraryItem[]>([]);
  const [categories, setCategories] = useState<{ key: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'official' | 'my'>('official');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'text' | 'file'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category: 'standard',
    version: '1.0.0',
    tags: '',
    file_content: '',
  });

  const fetchLibraries = useCallback(async () => {
    setLoading(true);
    try {
      let result;
      if (activeTab === 'my') {
        if (!isLoggedIn()) {
          setLibraries([]);
          setLoading(false);
          return;
        }
        result = await getMyLibraries({ page: 1, page_size: 100 });
      } else {
        result = await getLibraries({
          page: 1,
          page_size: 100,
          search: search || undefined,
          category: activeFilter !== 'all' ? activeFilter : undefined,
          is_official: 1,
        });
      }
      setLibraries(result.libraries);
    } catch (err) {
      log.error('Failed to fetch libraries', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, activeFilter]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await getLibraryCategories();
        setCategories(result.categories);
      } catch (err) {
        log.error('Failed to fetch categories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchLibraries();
  }, [fetchLibraries]);

  const handleDownload = async (library: LibraryItem) => {
    if (!isLoggedIn()) {
      alert(t('libraries.loginRequired', { defaultValue: '请先登录' }));
      return;
    }

    setDownloading(true);
    setDownloadingId(library.id);
    setDownloadProgress(0);
    try {
      const result = await downloadLibraryWithProgress(library.id, (percent) => {
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
        alert(t('libraries.downloadSuccess', { defaultValue: `文件 "${result.file_name}" 已下载到您的下载文件夹` }));
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
      
      alert(t('libraries.downloadSuccess', { defaultValue: `文件 "${result.file_name}" 已下载到您的下载文件夹` }));
    } catch (err) {
      log.error('Failed to download library', err);
      alert(t('libraries.downloadError', { defaultValue: '下载失败，请重试' }));
    } finally {
      setDownloading(false);
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  };

  const handleStar = async (library: LibraryItem) => {
    if (!isLoggedIn()) {
      alert(t('libraries.loginRequired', { defaultValue: '请先登录' }));
      return;
    }

    try {
      const result = await starLibrary(library.id);
      setLibraries(libraries.map(l => 
        l.id === library.id 
          ? { ...l, stars: result.starred ? l.stars + 1 : l.stars - 1, is_starred: result.starred }
          : l
      ));
    } catch (err) {
      log.error('Failed to star library', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = [
      '.zip', '.rar', '.tar', '.gz', '.tgz', '.tar.gz',
      '.c', '.cpp', '.h', '.hpp', '.java', '.py', '.rs',
      '.js', '.jsx', '.ts', '.tsx', '.json', '.xml',
      '.html', '.css', '.scss', '.sass', '.less',
      '.md', '.txt', '.sh', '.bat', '.ps1',
      '.go', '.php', '.rb', '.swift', '.kt', '.scala',
      '.kl',
    ];

    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExt)) {
      alert(t('libraries.unsupportedFileType', { defaultValue: '不支持的文件类型' }));
      return;
    }

    setSelectedFile(file);
    if (!uploadForm.name) {
      setUploadForm({ ...uploadForm, name: file.name.replace(/\.[^/.]+$/, '') });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.name || !uploadForm.category) {
      alert(t('libraries.uploadRequired', { defaultValue: '请填写名称和分类' }));
      return;
    }

    if (uploadMode === 'text' && !uploadForm.file_content) {
      alert(t('libraries.codeRequired', { defaultValue: '请输入代码内容' }));
      return;
    }

    if (uploadMode === 'file' && !selectedFile) {
      alert(t('libraries.fileRequired', { defaultValue: '请选择文件' }));
      return;
    }

    setUploading(true);
    try {
      if (uploadMode === 'file' && selectedFile) {
        await uploadLibraryFile(selectedFile, {
          name: uploadForm.name,
          description: uploadForm.description,
          category: uploadForm.category,
          version: uploadForm.version,
          tags: uploadForm.tags,
        });
      } else {
        await uploadLibrary({
          name: uploadForm.name,
          description: uploadForm.description,
          category: uploadForm.category,
          version: uploadForm.version,
          tags: uploadForm.tags,
          file_content: uploadForm.file_content,
        });
      }
      setShowUploadModal(false);
      setUploadForm({
        name: '',
        description: '',
        category: 'standard',
        version: '1.0.0',
        tags: '',
        file_content: '',
      });
      setSelectedFile(null);
      setUploadMode('text');
      setActiveTab('my');
      fetchLibraries();
      alert(t('libraries.uploadSuccess', { defaultValue: '上传成功！您可以在"我的库"中查看' }));
    } catch (err) {
      log.error('Failed to upload library', err);
      alert(t('libraries.uploadError', { defaultValue: '上传失败' }));
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = () => {
    fetchLibraries();
  };

  return (
    <div className="bitfun-library-scene">
      <div className="bitfun-library-scene__header">
        <div className="bitfun-library-scene__header-top">
          <h1 className="bitfun-library-scene__title">{t('scenes.library')}</h1>
        </div>
        <p className="bitfun-library-scene__subtitle">{t('library.subtitle', { defaultValue: '探索和下载空灵语言库' })}</p>
      </div>

      <div className="bitfun-library-scene__tabs">
          <button
            className={`bitfun-library-scene__tab ${activeTab === 'official' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('official')}
          >
            {t('libraries.official', { defaultValue: '官方库' })}
          </button>
          <button
            className={`bitfun-library-scene__tab ${activeTab === 'my' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            {t('libraries.myLibraries', { defaultValue: '我的库' })}
          </button>
          {isLoggedIn() && (
            <button
              className="bitfun-library-scene__tab-btn"
              onClick={() => setShowUploadModal(true)}
            >
              <Plus size={16} />
              {t('libraries.upload', { defaultValue: '上传库' })}
            </button>
          )}
        </div>

        <div className="bitfun-library-scene__toolbar">
          <div className="bitfun-library-scene__search">
          <input
            type="text"
            placeholder={t('library.searchPlaceholder', { defaultValue: '搜索库...' })}
            className="bitfun-library-scene__search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="bitfun-library-scene__search-btn" onClick={handleSearch}>
            {t('library.search', { defaultValue: '搜索' })}
          </button>
        </div>
        <div className="bitfun-library-scene__filters">
          <button
            className={`bitfun-library-scene__filter-btn ${activeFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            {t('library.filterAll', { defaultValue: '全部' })}
          </button>
          {categories.map(cat => (
            <button
              key={cat.key}
              className={`bitfun-library-scene__filter-btn ${activeFilter === cat.key ? 'is-active' : ''}`}
              onClick={() => setActiveFilter(cat.key)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bitfun-library-scene__content">
        {loading ? (
          <div className="bitfun-library-scene__loading">{t('common.loading', { defaultValue: '加载中...' })}</div>
        ) : libraries.length === 0 ? (
          <div className="bitfun-library-scene__empty">
            {activeTab === 'my' 
              ? t('libraries.noMyLibraries', { defaultValue: '您还没有上传任何库' })
              : t('libraries.noLibraries', { defaultValue: '暂无库' })}
          </div>
        ) : (
          <div className="bitfun-library-scene__grid">
            {libraries.map((item) => (
              <div key={item.id} className="bitfun-library-scene__card">
                <div className="bitfun-library-scene__card-header-row">
                  <div
                    className="bitfun-library-scene__card-icon"
                    style={{ backgroundColor: `${categoryColors[item.category] || '#64748b'}15`, color: categoryColors[item.category] || '#64748b' }}
                  >
                    {categoryIcons[item.category] || <Package size={20} />}
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
                    {item.is_official === 1 && (
                      <span className="bitfun-library-scene__card-level" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
                        <Shield size={10} />
                        官方
                      </span>
                    )}
                  </div>
                  <span className="bitfun-library-scene__card-stars">
                    <Star size={12} />
                    {item.stars.toLocaleString()}
                  </span>
                  <span className="bitfun-library-scene__card-downloads">
                    <Download size={12} />
                    {item.downloads}
                  </span>
                </div>
                <div className="bitfun-library-scene__card-actions">
                  <button
                    className={`bitfun-library-scene__card-btn ${downloading && downloadingId === item.id ? 'is-downloading' : ''}`}
                    onClick={() => handleDownload(item)}
                    disabled={downloading}
                  >
                    {downloading && downloadingId === item.id ? (
                      <>
                        <div className="bitfun-library-scene__progress-bar">
                          <div
                            className="bitfun-library-scene__progress-fill"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                        <span className="bitfun-library-scene__progress-text">{downloadProgress}%</span>
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        {t('libraries.download', { defaultValue: '下载' })}
                      </>
                    )}
                  </button>
                  <button
                    className={`bitfun-library-scene__card-btn bitfun-library-scene__card-btn--star ${item.is_starred ? 'is-starred' : ''}`}
                    onClick={() => handleStar(item)}
                  >
                    <Star size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="bitfun-library-scene__modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="bitfun-library-scene__modal" onClick={(e) => e.stopPropagation()}>
            <div className="bitfun-library-scene__modal-header">
              <h2>{t('libraries.uploadLibrary', { defaultValue: '上传库' })}</h2>
              <button className="bitfun-library-scene__modal-close" onClick={() => setShowUploadModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="bitfun-library-scene__modal-body">
              <div className="bitfun-library-scene__form-group">
                <label>{t('libraries.name', { defaultValue: '库名称' })} *</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  placeholder={t('libraries.namePlaceholder', { defaultValue: '请输入库名称' })}
                />
              </div>
              <div className="bitfun-library-scene__form-group">
                <label>{t('libraries.description', { defaultValue: '描述' })}</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder={t('libraries.descriptionPlaceholder', { defaultValue: '请输入描述' })}
                  rows={3}
                />
              </div>
              <div className="bitfun-library-scene__form-row">
                <div className="bitfun-library-scene__form-group">
                  <label>{t('libraries.category', { defaultValue: '分类' })} *</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat.key} value={cat.key}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="bitfun-library-scene__form-group">
                  <label>{t('libraries.version', { defaultValue: '版本' })}</label>
                  <input
                    type="text"
                    value={uploadForm.version}
                    onChange={(e) => setUploadForm({ ...uploadForm, version: e.target.value })}
                    placeholder="1.0.0"
                  />
                </div>
              </div>
              <div className="bitfun-library-scene__form-group">
                <label>{t('libraries.tags', { defaultValue: '标签' })}</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  placeholder={t('libraries.tagsPlaceholder', { defaultValue: '标签，逗号分隔' })}
                />
              </div>
              <div className="bitfun-library-scene__form-group">
                <label>{t('libraries.uploadMode', { defaultValue: '上传方式' })}</label>
                <div className="bitfun-library-scene__upload-modes">
                  <button
                    className={`bitfun-library-scene__upload-mode-btn ${uploadMode === 'text' ? 'is-active' : ''}`}
                    onClick={() => setUploadMode('text')}
                  >
                    <FileCode size={16} />
                    {t('libraries.textInput', { defaultValue: '文本输入' })}
                  </button>
                  <button
                    className={`bitfun-library-scene__upload-mode-btn ${uploadMode === 'file' ? 'is-active' : ''}`}
                    onClick={() => setUploadMode('file')}
                  >
                    <FolderArchive size={16} />
                    {t('libraries.fileUpload', { defaultValue: '文件上传' })}
                  </button>
                </div>
              </div>
              {uploadMode === 'text' ? (
                <div className="bitfun-library-scene__form-group">
                  <label>{t('libraries.code', { defaultValue: '代码内容' })}</label>
                  <textarea
                    value={uploadForm.file_content}
                    onChange={(e) => setUploadForm({ ...uploadForm, file_content: e.target.value })}
                    placeholder={t('libraries.codePlaceholder', { defaultValue: '请输入代码内容' })}
                    rows={10}
                    className="bitfun-library-scene__code-textarea"
                  />
                </div>
              ) : (
                <div className="bitfun-library-scene__form-group">
                  <label>{t('libraries.file', { defaultValue: '选择文件' })}</label>
                  <input
                    type="file"
                    accept=".zip,.rar,.tar,.gz,.tgz,.tar.gz,.c,.cpp,.h,.hpp,.java,.py,.rs,.js,.jsx,.ts,.tsx,.json,.xml,.html,.css,.scss,.sass,.less,.md,.txt,.sh,.bat,.ps1,.go,.php,.rb,.swift,.kt,.scala,.kl"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="library-file-input"
                  />
                  <div
                    className="bitfun-library-scene__file-drop-zone"
                    onClick={() => document.getElementById('library-file-input')?.click()}
                  >
                    {selectedFile ? (
                      <div className="bitfun-library-scene__file-info">
                        <FileCode size={32} />
                        <span className="bitfun-library-scene__file-name">{selectedFile.name}</span>
                        <span className="bitfun-library-scene__file-size">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                      </div>
                    ) : (
                      <div className="bitfun-library-scene__file-placeholder">
                        <FolderArchive size={32} />
                        <span>{t('libraries.clickToSelect', { defaultValue: '点击选择文件' })}</span>
                        <span className="bitfun-library-scene__file-hint">
                          {t('libraries.supportedFormats', { defaultValue: '支持 .zip, .rar, .tar.gz 等压缩文件，以及各种代码文件（最大10MB）' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="bitfun-library-scene__modal-footer">
              <button
                className="bitfun-library-scene__btn bitfun-library-scene__btn--secondary"
                onClick={() => setShowUploadModal(false)}
              >
                {t('common.cancel', { defaultValue: '取消' })}
              </button>
              <button
                className="bitfun-library-scene__btn bitfun-library-scene__btn--primary"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? t('common.uploading', { defaultValue: '上传中...' }) : t('common.upload', { defaultValue: '上传' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryScene;
