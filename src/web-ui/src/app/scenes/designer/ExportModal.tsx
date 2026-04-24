import React, { useState, useMemo } from 'react';
import { X, Copy, Download, Check } from 'lucide-react';
import { DesignerElement } from './DesignerScene';
import { generateNimCode, NimCodeGeneratorOptions, GeneratedNimCode } from './NimCodeGenerator';
import './ExportModal.scss';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: DesignerElement[];
  canvasSettings: {
    name: string;
    width: number;
    height: number;
  };
}

type TabType = 'main' | 'ui' | 'logic' | 'config';

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  elements,
  canvasSettings,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [copied, setCopied] = useState(false);
  const [appName, setAppName] = useState(canvasSettings.name || 'MyApp');

  const generatedCode = useMemo<GeneratedNimCode>(() => {
    const options: NimCodeGeneratorOptions = {
      appName,
      windowWidth: canvasSettings.width || 800,
      windowHeight: canvasSettings.height || 600,
      elements,
    };
    return generateNimCode(options);
  }, [appName, canvasSettings, elements]);

  const tabs: { id: TabType; label: string; filename: string }[] = [
    { id: 'main', label: 'main.nim', filename: 'main.nim' },
    { id: 'ui', label: 'ui.nim', filename: 'ui.nim' },
    { id: 'logic', label: 'logic.nim', filename: 'logic.nim' },
    { id: 'config', label: 'kl.cfg', filename: 'kl.cfg' },
  ];

  const currentCode = generatedCode[activeTab];
  const currentTab = tabs.find(t => t.id === activeTab);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentTab?.filename || 'code.nim';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    Object.entries(generatedCode).forEach(([key, code]) => {
      const tab = tabs.find(t => t.id === key);
      if (tab) {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = tab.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={e => e.stopPropagation()}>
        <div className="export-modal__header">
          <h2>导出 Nim 代码</h2>
          <button className="export-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="export-modal__content">
          <div className="export-modal__settings">
            <div className="export-modal__field">
              <label>应用名称</label>
              <input
                type="text"
                value={appName}
                onChange={e => setAppName(e.target.value)}
                placeholder="应用名称"
              />
            </div>
            <div className="export-modal__info">
              <span>窗口尺寸: {canvasSettings.width} × {canvasSettings.height}</span>
              <span>控件数量: {elements.length}</span>
            </div>
          </div>

          <div className="export-modal__tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`export-modal__tab ${activeTab === tab.id ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="export-modal__code-container">
            <div className="export-modal__code-header">
              <span>{currentTab?.filename}</span>
              <div className="export-modal__code-actions">
                <button
                  className="export-modal__action-btn"
                  onClick={handleCopy}
                  title="复制代码"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? '已复制' : '复制'}
                </button>
                <button
                  className="export-modal__action-btn"
                  onClick={handleDownload}
                  title="下载文件"
                >
                  <Download size={14} />
                  下载
                </button>
              </div>
            </div>
            <pre className="export-modal__code">
              <code>{currentCode}</code>
            </pre>
          </div>
        </div>

        <div className="export-modal__footer">
          <button className="export-modal__btn export-modal__btn--secondary" onClick={onClose}>
            取消
          </button>
          <button className="export-modal__btn export-modal__btn--primary" onClick={handleDownloadAll}>
            <Download size={14} />
            下载全部文件
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
