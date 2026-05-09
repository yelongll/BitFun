import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Play, Settings } from 'lucide-react';
import { Button, Input, Select } from '@/component-library';
import { useI18n } from '@/infrastructure/i18n';
import './RunConfigDialog.scss';

export interface NimRunConfig {
  id: string;
  name: string;
  command: 'compile' | 'run' | 'check' | 'js' | 'c' | 'cpp';
  compileMode: 'debug' | 'release';
  optimization: 'none' | 'speed' | 'size';
  warnings: 'off' | 'on' | 'strict';
  threads: boolean;
  memoryManagement: 'orc' | 'arc' | 'refc' | 'markAndSweep' | 'boehm' | 'go' | 'none' | 'regions';
  appType?: 'console' | 'gui' | 'lib' | 'staticlib';
  backend?: 'c' | 'cpp' | 'js' | 'objc';
  debugInfo?: 'default' | 'on' | 'off';
  stackTrace?: 'default' | 'on' | 'off';
  lineTrace?: 'default' | 'on' | 'off';
  checks?: 'default' | 'on' | 'off';
  assertions?: 'default' | 'on' | 'off';
  targetOS?: string;
  targetCPU?: string;
  nimcache?: string;
  defines: string[];
  additionalArgs: string;
  outputPath?: string;
  // Runtime checks (detailed)
  objChecks?: 'default' | 'on' | 'off';
  fieldChecks?: 'default' | 'on' | 'off';
  rangeChecks?: 'default' | 'on' | 'off';
  boundChecks?: 'default' | 'on' | 'off';
  overflowChecks?: 'default' | 'on' | 'off';
  floatChecks?: 'default' | 'on' | 'off';
  nanChecks?: 'default' | 'on' | 'off';
  infChecks?: 'default' | 'on' | 'off';
  // Output control
  outDir?: string;
  stdoutOutput?: 'default' | 'on' | 'off';
  colors?: 'default' | 'on' | 'off';
  verbosity?: number;
  // Compiler options
  passC?: string;
  passL?: string;
  cc?: string;
  cIncludes?: string;
  cLibDir?: string;
  cLib?: string;
  // Path management
  paths?: string[];
  libPath?: string;
  imports?: string[];
  includes?: string[];
  // Config file control
  skipCfg?: 'default' | 'on' | 'off';
  skipUserCfg?: 'default' | 'on' | 'off';
  skipParentCfg?: 'default' | 'on' | 'off';
  skipProjCfg?: 'default' | 'on' | 'off';
  // Other important options
  forceBuild?: 'default' | 'on' | 'off';
  compileOnly?: 'default' | 'on' | 'off';
  noLinking?: 'default' | 'on' | 'off';
  noMain?: 'default' | 'on' | 'off';
  exceptions?: 'setjmp' | 'cpp' | 'goto' | 'quirky';
  parallelBuild?: number;
  incremental?: 'default' | 'on' | 'off';
  styleCheck?: 'off' | 'hint' | 'error' | 'usages';
  lineDir?: 'default' | 'on' | 'off';
  embedSrc?: 'default' | 'on' | 'off';
  experimental?: string[];
  legacy?: string[];
}

export interface RunConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (configs: NimRunConfig[]) => void;
  configs: NimRunConfig[];
  language: string;
}

const defaultConfig: NimRunConfig = {
  id: '',
  name: '新配置',
  command: 'compile',
  compileMode: 'debug',
  optimization: 'none',
  warnings: 'on',
  threads: false,
  memoryManagement: 'arc',
  defines: [],
  additionalArgs: '',
};

export const RunConfigDialog: React.FC<RunConfigDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  configs,
  language,
}) => {
  const { t } = useI18n();
  const [localConfigs, setLocalConfigs] = useState<NimRunConfig[]>(configs);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [editingConfig, setEditingConfig] = useState<NimRunConfig | null>(null);
  const [defineInput, setDefineInput] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'memory' | 'app' | 'debug' | 'cross' | 'advanced'>('basic');

  useEffect(() => {
    setLocalConfigs(configs);
    if (configs.length > 0 && !selectedConfigId) {
      setSelectedConfigId(configs[0].id);
      setEditingConfig(configs[0]);
    }
  }, [configs]);

  useEffect(() => {
    if (selectedConfigId) {
      const config = localConfigs.find(c => c.id === selectedConfigId);
      setEditingConfig(config || null);
    }
  }, [selectedConfigId, localConfigs]);

  const handleAddConfig = () => {
    const newConfig: NimRunConfig = {
      ...defaultConfig,
      id: `config_${Date.now()}`,
      name: `配置 ${localConfigs.length + 1}`,
    };
    setLocalConfigs([...localConfigs, newConfig]);
    setSelectedConfigId(newConfig.id);
    setEditingConfig(newConfig);
  };

  const handleDeleteConfig = (id: string) => {
    const newConfigs = localConfigs.filter(c => c.id !== id);
    setLocalConfigs(newConfigs);
    if (selectedConfigId === id) {
      if (newConfigs.length > 0) {
        setSelectedConfigId(newConfigs[0].id);
      } else {
        setSelectedConfigId('');
        setEditingConfig(null);
      }
    }
  };

  const handleUpdateConfig = (updates: Partial<NimRunConfig>) => {
    if (!editingConfig) return;
    
    const updatedConfig = { ...editingConfig, ...updates };
    setEditingConfig(updatedConfig);
    
    setLocalConfigs(prev => 
      prev.map(c => c.id === editingConfig.id ? updatedConfig : c)
    );
  };

  const handleAddDefine = () => {
    if (!defineInput.trim() || !editingConfig) return;
    
    const newDefine = defineInput.trim();
    if (!editingConfig.defines.includes(newDefine)) {
      handleUpdateConfig({ defines: [...editingConfig.defines, newDefine] });
    }
    setDefineInput('');
  };

  const handleRemoveDefine = (define: string) => {
    if (!editingConfig) return;
    handleUpdateConfig({ defines: editingConfig.defines.filter(d => d !== define) });
  };

  const handleSave = () => {
    onSave(localConfigs);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="run-config-dialog__overlay" onClick={onClose}>
      <div className="run-config-dialog" onClick={e => e.stopPropagation()}>
        <div className="run-config-dialog__header">
          <div className="run-config-dialog__title">
            <Settings size={18} />
            <h2>运行配置</h2>
          </div>
          <button className="run-config-dialog__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="run-config-dialog__body">
          <div className="run-config-dialog__sidebar">
            <div className="run-config-dialog__sidebar-header">
              <h3>配置列表</h3>
              <button className="run-config-dialog__add-btn" onClick={handleAddConfig}>
                <Plus size={16} />
              </button>
            </div>
            <div className="run-config-dialog__config-list">
              {localConfigs.map(config => (
                <div
                  key={config.id}
                  className={`run-config-dialog__config-item ${selectedConfigId === config.id ? 'is-active' : ''}`}
                  onClick={() => setSelectedConfigId(config.id)}
                >
                  <Play size={14} />
                  <span>{config.name}</span>
                  <button
                    className="run-config-dialog__delete-btn"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteConfig(config.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {localConfigs.length === 0 && (
                <div className="run-config-dialog__empty">
                  点击 + 添加配置
                </div>
              )}
            </div>
          </div>

          <div className="run-config-dialog__editor">
            {editingConfig ? (
              <>
                <div className="run-config-dialog__section">
                  <label className="run-config-dialog__label">配置名称</label>
                  <Input
                    value={editingConfig.name}
                    onChange={e => handleUpdateConfig({ name: e.target.value })}
                    placeholder="输入配置名称"
                  />
                </div>

                <div className="run-config-dialog__tabs">
                      <button
                        className={`run-config-dialog__tab ${activeTab === 'basic' ? 'active' : ''}`}
                        onClick={() => setActiveTab('basic')}
                      >
                        基本配置
                      </button>
                      <button
                        className={`run-config-dialog__tab ${activeTab === 'memory' ? 'active' : ''}`}
                        onClick={() => setActiveTab('memory')}
                      >
                        内存与线程
                      </button>
                      <button
                        className={`run-config-dialog__tab ${activeTab === 'app' ? 'active' : ''}`}
                        onClick={() => setActiveTab('app')}
                      >
                        应用类型
                      </button>
                      <button
                        className={`run-config-dialog__tab ${activeTab === 'debug' ? 'active' : ''}`}
                        onClick={() => setActiveTab('debug')}
                      >
                        调试选项
                      </button>
                      <button
                        className={`run-config-dialog__tab ${activeTab === 'cross' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cross')}
                      >
                        交叉编译
                      </button>
                      <button
                        className={`run-config-dialog__tab ${activeTab === 'advanced' ? 'active' : ''}`}
                        onClick={() => setActiveTab('advanced')}
                      >
                        高级选项
                      </button>
                    </div>

                    <div className="run-config-dialog__tab-content">
                      {activeTab === 'basic' && (
                        <>
                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">命令类型</label>
                            <Select
                              value={editingConfig.command}
                              onChange={value => handleUpdateConfig({ command: value as NimRunConfig['command'] })}
                              options={[
                                { value: 'run', label: '编译运行' },
                                { value: 'compile', label: '仅编译' },
                                { value: 'check', label: '语法检查' },
                                { value: 'js', label: '编译为 JavaScript' },
                                { value: 'c', label: '编译为 C 代码' },
                                { value: 'cpp', label: '编译为 C++ 代码' },
                              ]}
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">编译模式</label>
                            <Select
                              value={editingConfig.compileMode}
                              onChange={value => handleUpdateConfig({ compileMode: value as NimRunConfig['compileMode'] })}
                              options={[
                                { value: 'debug', label: '调试版' },
                                { value: 'release', label: '发布版' },
                              ]}
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">优化级别</label>
                            <Select
                              value={editingConfig.optimization}
                              onChange={value => handleUpdateConfig({ optimization: value as NimRunConfig['optimization'] })}
                              options={[
                                { value: 'none', label: '无优化' },
                                { value: 'speed', label: '速度优化' },
                                { value: 'size', label: '大小优化' },
                              ]}
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">警告级别</label>
                            <Select
                              value={editingConfig.warnings}
                              onChange={value => handleUpdateConfig({ warnings: value as NimRunConfig['warnings'] })}
                              options={[
                                { value: 'off', label: '关闭警告' },
                                { value: 'on', label: '显示警告' },
                                { value: 'strict', label: '严格模式' },
                              ]}
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">输出路径 (可选)</label>
                            <Input
                              value={editingConfig.outputPath || ''}
                              onChange={e => handleUpdateConfig({ outputPath: e.target.value || undefined })}
                              placeholder="留空使用默认路径"
                            />
                          </div>
                        </>
                      )}

                      {activeTab === 'memory' && (
                        <>
                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">内存管理</label>
                            <Select
                              value={editingConfig.memoryManagement}
                              onChange={value => handleUpdateConfig({ memoryManagement: value as NimRunConfig['memoryManagement'] })}
                              options={[
                                { value: 'orc', label: 'ORC (推荐)' },
                                { value: 'arc', label: 'ARC' },
                                { value: 'refc', label: 'RefC' },
                                { value: 'markAndSweep', label: 'Mark & Sweep' },
                                { value: 'boehm', label: 'Boehm' },
                                { value: 'go', label: 'Go' },
                                { value: 'none', label: '无 GC' },
                                { value: 'regions', label: 'Regions' },
                              ]}
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">
                              <input
                                type="checkbox"
                                checked={editingConfig.threads}
                                onChange={e => handleUpdateConfig({ threads: e.target.checked })}
                              />
                              启用多线程支持
                            </label>
                          </div>
                        </>
                      )}

                      {activeTab === 'app' && (
                        <>
                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">应用类型 (可选)</label>
                            <Select
                              value={editingConfig.appType || ''}
                              onChange={value => handleUpdateConfig({ appType: value as NimRunConfig['appType'] || undefined })}
                              options={[
                                { value: '', label: '默认' },
                                { value: 'console', label: '控制台应用' },
                                { value: 'gui', label: 'GUI 应用' },
                                { value: 'lib', label: '动态库' },
                                { value: 'staticlib', label: '静态库' },
                              ]}
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">后端 (可选)</label>
                            <Select
                              value={editingConfig.backend || ''}
                              onChange={value => handleUpdateConfig({ backend: value as NimRunConfig['backend'] || undefined })}
                              options={[
                                { value: '', label: '默认' },
                                { value: 'c', label: 'C' },
                                { value: 'cpp', label: 'C++' },
                                { value: 'js', label: 'JavaScript' },
                                { value: 'objc', label: 'Objective-C' },
                              ]}
                            />
                          </div>
                        </>
                      )}

                      {activeTab === 'debug' && (
                        <>
                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">生成调试信息</label>
                            <Select
                              value={editingConfig.debugInfo || 'default'}
                              onChange={value => handleUpdateConfig({ debugInfo: value as NimRunConfig['debugInfo'] || undefined })}
                              options={[
                                { value: 'default', label: '默认' },
                                { value: 'on', label: '开启' },
                                { value: 'off', label: '关闭' },
                              ]}
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">启用堆栈跟踪</label>
                            <Select
                              value={editingConfig.stackTrace || 'default'}
                              onChange={value => handleUpdateConfig({ stackTrace: value as NimRunConfig['stackTrace'] || undefined })}
                              options={[
                                { value: 'default', label: '默认' },
                                { value: 'on', label: '开启' },
                                { value: 'off', label: '关闭' },
                              ]}
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">启用行跟踪</label>
                            <Select
                              value={editingConfig.lineTrace || 'default'}
                              onChange={value => handleUpdateConfig({ lineTrace: value as NimRunConfig['lineTrace'] || undefined })}
                              options={[
                                { value: 'default', label: '默认' },
                                { value: 'on', label: '开启' },
                                { value: 'off', label: '关闭' },
                              ]}
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">启用所有运行时检查</label>
                            <Select
                              value={editingConfig.checks || 'default'}
                              onChange={value => handleUpdateConfig({ checks: value as NimRunConfig['checks'] || undefined })}
                              options={[
                                { value: 'default', label: '默认' },
                                { value: 'on', label: '开启' },
                                { value: 'off', label: '关闭' },
                              ]}
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">启用断言</label>
                            <Select
                              value={editingConfig.assertions || 'default'}
                              onChange={value => handleUpdateConfig({ assertions: value as NimRunConfig['assertions'] || undefined })}
                              options={[
                                { value: 'default', label: '默认' },
                                { value: 'on', label: '开启' },
                                { value: 'off', label: '关闭' },
                              ]}
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">详细运行时检查</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>对象转换检查</label>
                                <Select
                                  value={editingConfig.objChecks || 'default'}
                                  onChange={value => handleUpdateConfig({ objChecks: value as NimRunConfig['objChecks'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>字段检查</label>
                                <Select
                                  value={editingConfig.fieldChecks || 'default'}
                                  onChange={value => handleUpdateConfig({ fieldChecks: value as NimRunConfig['fieldChecks'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>范围检查</label>
                                <Select
                                  value={editingConfig.rangeChecks || 'default'}
                                  onChange={value => handleUpdateConfig({ rangeChecks: value as NimRunConfig['rangeChecks'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>边界检查</label>
                                <Select
                                  value={editingConfig.boundChecks || 'default'}
                                  onChange={value => handleUpdateConfig({ boundChecks: value as NimRunConfig['boundChecks'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>溢出检查</label>
                                <Select
                                  value={editingConfig.overflowChecks || 'default'}
                                  onChange={value => handleUpdateConfig({ overflowChecks: value as NimRunConfig['overflowChecks'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>浮点数检查</label>
                                <Select
                                  value={editingConfig.floatChecks || 'default'}
                                  onChange={value => handleUpdateConfig({ floatChecks: value as NimRunConfig['floatChecks'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>NaN 检查</label>
                                <Select
                                  value={editingConfig.nanChecks || 'default'}
                                  onChange={value => handleUpdateConfig({ nanChecks: value as NimRunConfig['nanChecks'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>无穷大检查</label>
                                <Select
                                  value={editingConfig.infChecks || 'default'}
                                  onChange={value => handleUpdateConfig({ infChecks: value as NimRunConfig['infChecks'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {activeTab === 'cross' && (
                        <>
                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">目标操作系统 (可选)</label>
                            <Select
                              value={editingConfig.targetOS || ''}
                              onChange={value => handleUpdateConfig({ targetOS: value ? String(value) : undefined })}
                              options={[
                                { value: '', label: '默认' },
                                { value: 'windows', label: 'Windows' },
                                { value: 'linux', label: 'Linux' },
                                { value: 'macosx', label: 'macOS' },
                                { value: 'android', label: 'Android' },
                                { value: 'ios', label: 'iOS' },
                                { value: 'freebsd', label: 'FreeBSD' },
                                { value: 'netbsd', label: 'NetBSD' },
                                { value: 'openbsd', label: 'OpenBSD' },
                                { value: 'solaris', label: 'Solaris' },
                                { value: 'haiku', label: 'Haiku' },
                                { value: 'nintendoswitch', label: 'Nintendo Switch' },
                                { value: 'any', label: 'Any (平台无关)' },
                              ]}
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">目标 CPU (可选)</label>
                            <Select
                              value={editingConfig.targetCPU || ''}
                              onChange={value => handleUpdateConfig({ targetCPU: value ? String(value) : undefined })}
                              options={[
                                { value: '', label: '默认' },
                                { value: 'i386', label: 'i386 (32位 x86)' },
                                { value: 'amd64', label: 'AMD64 (64位 x86)' },
                                { value: 'arm', label: 'ARM (32位)' },
                                { value: 'arm64', label: 'ARM64 (64位)' },
                                { value: 'powerpc', label: 'PowerPC (32位)' },
                                { value: 'powerpc64', label: 'PowerPC (64位)' },
                                { value: 'mips', label: 'MIPS (32位)' },
                                { value: 'mips64', label: 'MIPS (64位)' },
                                { value: 'riscv32', label: 'RISC-V (32位)' },
                                { value: 'riscv64', label: 'RISC-V (64位)' },
                                { value: 'sparc', label: 'SPARC' },
                                { value: 'sparc64', label: 'SPARC (64位)' },
                              ]}
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">项目缓存路径 (可选)</label>
                            <Input
                              value={editingConfig.nimcache || ''}
                              onChange={e => handleUpdateConfig({ nimcache: e.target.value || undefined })}
                              placeholder="生成的原生代码存放路径"
                            />
                          </div>
                        </>
                      )}

                      {activeTab === 'advanced' && (
                        <>
                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">自定义定义 (-d)</label>
                            <div className="run-config-dialog__defines">
                              <div className="run-config-dialog__defines-input">
                                <Input
                                  value={defineInput}
                                  onChange={e => setDefineInput(e.target.value)}
                                  onKeyPress={e => e.key === 'Enter' && handleAddDefine()}
                                  placeholder="输入定义名称"
                                />
                                <Button onClick={handleAddDefine} size="small">
                                  <Plus size={14} />
                                </Button>
                              </div>
                              <div className="run-config-dialog__defines-list">
                                {editingConfig.defines.map(define => (
                                  <span key={define} className="run-config-dialog__define-tag">
                                    {define}
                                    <button onClick={() => handleRemoveDefine(define)}>
                                      <X size={12} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">异常处理实现</label>
                            <Select
                              value={editingConfig.exceptions || ''}
                              onChange={value => handleUpdateConfig({ exceptions: value as NimRunConfig['exceptions'] || undefined })}
                              options={[
                                { value: '', label: '默认' },
                                { value: 'setjmp', label: 'setjmp/longjmp' },
                                { value: 'cpp', label: 'C++ 异常' },
                                { value: 'goto', label: 'goto' },
                                { value: 'quirky', label: 'quirky' },
                              ]}
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">样式检查</label>
                            <Select
                              value={editingConfig.styleCheck || ''}
                              onChange={value => handleUpdateConfig({ styleCheck: value as NimRunConfig['styleCheck'] || undefined })}
                              options={[
                                { value: '', label: '默认' },
                                { value: 'off', label: '关闭' },
                                { value: 'hint', label: '提示' },
                                { value: 'error', label: '错误' },
                                { value: 'usages', label: '仅用法检查' },
                              ]}
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">输出详细程度 (0-3)</label>
                            <Select
                              value={String(editingConfig.verbosity || 1)}
                              onChange={value => handleUpdateConfig({ verbosity: value ? parseInt(String(value)) : undefined })}
                              options={[
                                { value: '0', label: '最小输出' },
                                { value: '1', label: '默认' },
                                { value: '2', label: '详细' },
                                { value: '3', label: '调试' },
                              ]}
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">C 编译器选项</label>
                            <Input
                              value={editingConfig.passC || ''}
                              onChange={e => handleUpdateConfig({ passC: e.target.value || undefined })}
                              placeholder="传递给 C 编译器的选项"
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">链接器选项</label>
                            <Input
                              value={editingConfig.passL || ''}
                              onChange={e => handleUpdateConfig({ passL: e.target.value || undefined })}
                              placeholder="传递给链接器的选项"
                            />
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">编译选项</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>强制重新构建</label>
                                <Select
                                  value={editingConfig.forceBuild || 'default'}
                                  onChange={value => handleUpdateConfig({ forceBuild: value as NimRunConfig['forceBuild'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>仅编译不链接</label>
                                <Select
                                  value={editingConfig.compileOnly || 'default'}
                                  onChange={value => handleUpdateConfig({ compileOnly: value as NimRunConfig['compileOnly'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>不链接</label>
                                <Select
                                  value={editingConfig.noLinking || 'default'}
                                  onChange={value => handleUpdateConfig({ noLinking: value as NimRunConfig['noLinking'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>不生成 main</label>
                                <Select
                                  value={editingConfig.noMain || 'default'}
                                  onChange={value => handleUpdateConfig({ noMain: value as NimRunConfig['noMain'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>增量编译</label>
                                <Select
                                  value={editingConfig.incremental || 'default'}
                                  onChange={value => handleUpdateConfig({ incremental: value as NimRunConfig['incremental'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>生成 #line 指令</label>
                                <Select
                                  value={editingConfig.lineDir || 'default'}
                                  onChange={value => handleUpdateConfig({ lineDir: value as NimRunConfig['lineDir'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>嵌入源代码</label>
                                <Select
                                  value={editingConfig.embedSrc || 'default'}
                                  onChange={value => handleUpdateConfig({ embedSrc: value as NimRunConfig['embedSrc'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>彩色输出</label>
                                <Select
                                  value={editingConfig.colors || 'default'}
                                  onChange={value => handleUpdateConfig({ colors: value as NimRunConfig['colors'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">配置文件控制</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>跳过全局配置</label>
                                <Select
                                  value={editingConfig.skipCfg || 'default'}
                                  onChange={value => handleUpdateConfig({ skipCfg: value as NimRunConfig['skipCfg'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>跳过用户配置</label>
                                <Select
                                  value={editingConfig.skipUserCfg || 'default'}
                                  onChange={value => handleUpdateConfig({ skipUserCfg: value as NimRunConfig['skipUserCfg'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>跳过父目录配置</label>
                                <Select
                                  value={editingConfig.skipParentCfg || 'default'}
                                  onChange={value => handleUpdateConfig({ skipParentCfg: value as NimRunConfig['skipParentCfg'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="run-config-dialog__label" style={{ marginBottom: '4px' }}>跳过项目配置</label>
                                <Select
                                  value={editingConfig.skipProjCfg || 'default'}
                                  onChange={value => handleUpdateConfig({ skipProjCfg: value as NimRunConfig['skipProjCfg'] || undefined })}
                                  options={[
                                    { value: 'default', label: '默认' },
                                    { value: 'on', label: '开启' },
                                    { value: 'off', label: '关闭' },
                                  ]}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="run-config-dialog__section">
                            <label className="run-config-dialog__label">额外参数</label>
                            <Input
                              value={editingConfig.additionalArgs}
                              onChange={e => handleUpdateConfig({ additionalArgs: e.target.value })}
                              placeholder="输入额外的命令行参数"
                            />
                          </div>
                        </>
                      )}
                    </div>
              </>
            ) : (
              <div className="run-config-dialog__no-selection">
                <Settings size={48} />
                <p>选择或创建一个配置</p>
              </div>
            )}
          </div>
        </div>

        <div className="run-config-dialog__footer">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>
            <Save size={16} />
            保存
          </Button>
        </div>
      </div>
    </div>
  );
};
