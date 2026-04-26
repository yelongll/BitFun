import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Download, Trash2, Plus, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { 
  getCustomComponents, 
  saveCustomComponent, 
  deleteCustomComponent, 
  exportComponentToJson 
} from './CustomComponentManager';

import type { ComponentDefinition } from './types';

interface CustomComponentManagerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomComponentManagerPanel: React.FC<CustomComponentManagerPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const [customComponents, setCustomComponents] = useState<ComponentDefinition[]>(getCustomComponents());
  const [jsonInput, setJsonInput] = useState('');
  const [showImportForm, setShowImportForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshComponents = () => {
    setCustomComponents(getCustomComponents());
  };

  const handleImportJson = () => {
    if (!jsonInput.trim()) {
      setError('请输入组件配置JSON');
      return;
    }

    try {
      const definition = JSON.parse(jsonInput) as ComponentDefinition;
      
      if (!definition.id || !definition.name) {
        setError('组件配置缺少必要字段: id 或 name');
        return;
      }

      if (!definition.defaultSize) {
        definition.defaultSize = { width: 100, height: 36 };
      }
      if (!definition.defaultProps) {
        definition.defaultProps = {};
      }
      if (!definition.properties) {
        definition.properties = [];
      }
      if (!definition.events) {
        definition.events = [];
      }

      definition.category = 'custom';

      saveCustomComponent(definition);
      refreshComponents();
      setJsonInput('');
      setShowImportForm(false);
      setError(null);
      setSuccess(`组件 "${definition.name}" 导入成功`);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError('JSON 格式错误: ' + (e as Error).message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      setShowImportForm(true);
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = (id: string) => {
    const json = exportComponentToJson(id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `component-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`确定要删除组件 "${name}" 吗？`)) {
      deleteCustomComponent(id);
      refreshComponents();
      setSuccess(`组件 "${name}" 已删除`);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="custom-component-manager__overlay">
      <div className="custom-component-manager__panel">
        <div className="custom-component-manager__header">
          <h3>自定义组件管理</h3>
          <button className="custom-component-manager__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="custom-component-manager__alert custom-component-manager__alert--error">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={14} /></button>
          </div>
        )}

        {success && (
          <div className="custom-component-manager__alert custom-component-manager__alert--success">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        <div className="custom-component-manager__actions">
          <button 
            className="custom-component-manager__btn custom-component-manager__btn--primary"
            onClick={() => setShowImportForm(!showImportForm)}
          >
            <Plus size={16} />
            新建组件
          </button>
          <label className="custom-component-manager__btn custom-component-manager__btn--secondary">
            <Upload size={16} />
            导入JSON文件
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {showImportForm && (
          <div className="custom-component-manager__import-form">
            <div className="custom-component-manager__import-header">
              <FileJson size={16} />
              <span>粘贴或编辑组件配置JSON</span>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`{
  "id": "my-input",
  "name": "我的输入框",
  "category": "custom",
  "icon": "type",
  "baseComponent": "input",
  "defaultProps": { "placeholder": "请输入..." },
  "defaultSize": { "width": 200, "height": 36 },
  "properties": [
    { "key": "props.placeholder", "label": "占位符", "type": "text", "defaultValue": "请输入..." }
  ],
  "events": [
    { "type": "onChange", "label": "值变化", "chineseName": "值变化" }
  ],
  "codeTemplate": "igInputText(\"{{name}}##{{id}}\", {{statePrefix}}{{name}}_buffer, 256)"
}`}
              rows={12}
            />
            <div className="custom-component-manager__import-actions">
              <button 
                className="custom-component-manager__btn custom-component-manager__btn--primary"
                onClick={handleImportJson}
              >
                导入组件
              </button>
              <button 
                className="custom-component-manager__btn custom-component-manager__btn--ghost"
                onClick={() => { setShowImportForm(false); setJsonInput(''); setError(null); }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="custom-component-manager__list">
          <div className="custom-component-manager__list-header">
            <span>已保存的自定义组件 ({customComponents.length})</span>
          </div>
          
          {customComponents.length === 0 ? (
            <div className="custom-component-manager__empty">
              <p>暂无自定义组件</p>
              <p>点击上方按钮创建或导入组件</p>
            </div>
          ) : (
            <div className="custom-component-manager__items">
              {customComponents.map((comp) => (
                <div key={comp.id} className="custom-component-manager__item">
                  <div className="custom-component-manager__item-info">
                    <span className="custom-component-manager__item-name">{comp.name}</span>
                    <span className="custom-component-manager__item-id">{comp.id}</span>
                  </div>
                  <div className="custom-component-manager__item-actions">
                    <button 
                      className="custom-component-manager__item-btn"
                      onClick={() => handleExport(comp.id)}
                      title="导出"
                    >
                      <Download size={14} />
                    </button>
                    <button 
                      className="custom-component-manager__item-btn custom-component-manager__item-btn--danger"
                      onClick={() => handleDelete(comp.id, comp.name)}
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="custom-component-manager__help">
          <h4>组件配置说明</h4>
          <ul>
            <li><code>id</code> - 组件唯一标识（必填）</li>
            <li><code>name</code> - 组件显示名称（必填）</li>
            <li><code>icon</code> - 图标名称（如: square, type, button）</li>
            <li><code>baseComponent</code> - 基础组件映射（如: button, input, select）</li>
            <li><code>defaultProps</code> - 默认属性值</li>
            <li><code>defaultSize</code> - 默认尺寸</li>
            <li><code>properties</code> - 属性配置列表</li>
            <li><code>events</code> - 事件配置列表</li>
            <li><code>codeTemplate</code> - ImGui代码模板（可选）</li>
          </ul>
          <h4>模板变量</h4>
          <ul>
            <li><code>{"{{id}}"}</code> - 组件ID</li>
            <li><code>{"{{name}}"}</code> - 组件名称</li>
            <li><code>{"{{x}}"}</code> - X坐标</li>
            <li><code>{"{{y}}"}</code> - Y坐标</li>
            <li><code>{"{{width}}"}</code> - 宽度</li>
            <li><code>{"{{height}}"}</code> - 高度</li>
            <li><code>{"{{statePrefix}}"}</code> - 状态前缀</li>
            <li><code>{"{{props.xxx}}"}</code> - 属性值</li>
          </ul>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CustomComponentManagerPanel;
