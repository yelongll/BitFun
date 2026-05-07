import React, { useRef, useCallback, useState } from 'react';
import { 
  Play, 
  Bug, 
  Hammer, 
  Square,
  Terminal,
  Settings,
  RotateCcw,
  Wand2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { IconButton, Tooltip, Select } from '@/component-library';
import { useI18n } from '@/infrastructure/i18n';
import './EditorFloatingToolbar.scss';

export interface RunConfig {
  id: string;
  name: string;
  command: string;
}

export interface EditorFloatingToolbarProps {
  isVisible: boolean;
  position?: { x: number; y: number };
  onRun?: (configId?: string) => void;
  onDebug?: () => void;
  onBuild?: () => void;
  onStop?: () => void;
  onRestart?: () => void;
  onFormat?: () => void;
  onOpenTerminal?: () => void;
  onOpenSettings?: () => void;
  onOpenRunConfig?: () => void;
  isRunning?: boolean;
  isDebugging?: boolean;
  isBuilding?: boolean;
  language?: string;
  filePath?: string;
  runConfigs?: RunConfig[];
  selectedConfig?: string;
  onConfigChange?: (configId: string) => void;
  defaultCollapsed?: boolean;
}

export const EditorFloatingToolbar: React.FC<EditorFloatingToolbarProps> = ({
  isVisible,
  onRun,
  onDebug,
  onBuild,
  onStop,
  onRestart,
  onFormat,
  onOpenTerminal,
  onOpenSettings,
  onOpenRunConfig,
  isRunning = false,
  isDebugging = false,
  isBuilding = false,
  language,
  filePath,
  runConfigs = [],
  selectedConfig = 'default',
  onConfigChange,
  defaultCollapsed = false,
}) => {
  const { t } = useI18n();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleRun = useCallback(() => {
    console.log('[DEBUG] EditorFloatingToolbar handleRun', { onRun: !!onRun, selectedConfig });
    if (onRun) {
      console.log('[DEBUG] EditorFloatingToolbar calling onRun');
      onRun(selectedConfig);
    }
  }, [onRun, selectedConfig]);

  const handleConfigChange = useCallback((value: string) => {
    if (onConfigChange) {
      onConfigChange(value);
    }
  }, [onConfigChange]);

  const handleDebug = useCallback(() => {
    if (onDebug) {
      onDebug();
    }
  }, [onDebug]);

  const handleBuild = useCallback(() => {
    if (onBuild) {
      onBuild();
    }
  }, [onBuild]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const getRunLabel = () => {
    if (filePath?.toLowerCase().endsWith('.灵')) {
      return t('toolbar.runNim', { defaultValue: '运行 空灵' });
    }
    switch (language) {
      case 'python':
        return t('toolbar.runPython', { defaultValue: '运行' });
      case 'javascript':
      case 'typescript':
        return t('toolbar.runNode', { defaultValue: '运行' });
      case 'rust':
        return t('toolbar.runCargo', { defaultValue: '运行' });
      case 'go':
        return t('toolbar.runGo', { defaultValue: '运行' });
      default:
        return t('toolbar.run', { defaultValue: '运行' });
    }
  };

  const isActive = isRunning || isDebugging || isBuilding;

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className={`editor-floating-toolbar ${isCollapsed ? 'is-collapsed' : ''}`}
    >
      <div className="editor-floating-toolbar__container">
        {isCollapsed ? (
          <>
            <Tooltip content={getRunLabel()}>
              <IconButton
                variant="primary"
                size="small"
                onClick={handleRun}
                disabled={isRunning}
                className="editor-floating-toolbar__run-btn"
              >
                {isRunning ? (
                  <div className="editor-floating-toolbar__spinner" />
                ) : (
                  <Play size={16} />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip content={t('toolbar.expand', { defaultValue: '展开工具栏' })}>
              <IconButton
                variant="ghost"
                size="small"
                onClick={toggleCollapse}
                className="editor-floating-toolbar__toggle-btn"
              >
                <ChevronRight size={14} />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <>
            <div className="editor-floating-toolbar__run-group">
              <Tooltip content={getRunLabel()}>
                <IconButton
                  variant="primary"
                  size="small"
                  onClick={handleRun}
                  disabled={isRunning}
                  className="editor-floating-toolbar__run-btn"
                >
                  {isRunning ? (
                    <div className="editor-floating-toolbar__spinner" />
                  ) : (
                    <Play size={16} />
                  )}
                </IconButton>
              </Tooltip>
              
              {runConfigs.length > 0 && (
                <div className="editor-floating-toolbar__config-wrapper">
                  <Select
                    value={selectedConfig}
                    onChange={(value) => handleConfigChange(value as string)}
                    options={runConfigs.map(config => ({
                      value: config.id,
                      label: config.name,
                    }))}
                    size="small"
                    className="editor-floating-toolbar__config-select"
                  />
                  {onOpenRunConfig && (
                    <IconButton
                      variant="ghost"
                      size="small"
                      onClick={onOpenRunConfig}
                      className="editor-floating-toolbar__config-btn"
                      title="运行配置"
                    >
                      <Settings size={14} />
                    </IconButton>
                  )}
                </div>
              )}
            </div>

            <Tooltip content={t('toolbar.debug', { defaultValue: '调试' })}>
              <IconButton
                variant="ghost"
                size="small"
                onClick={handleDebug}
                disabled={isDebugging}
                className="editor-floating-toolbar__debug-btn"
              >
                {isDebugging ? (
                  <div className="editor-floating-toolbar__spinner" />
                ) : (
                  <Bug size={16} />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip content={t('toolbar.build', { defaultValue: '构建' })}>
              <IconButton
                variant="ghost"
                size="small"
                onClick={handleBuild}
                disabled={isBuilding}
                className="editor-floating-toolbar__build-btn"
              >
                {isBuilding ? (
                  <div className="editor-floating-toolbar__spinner" />
                ) : (
                  <Hammer size={16} />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip content={t('toolbar.stop', { defaultValue: '停止' })}>
              <IconButton
                variant="ghost"
                size="small"
                onClick={onStop}
                disabled={!isActive}
                className="editor-floating-toolbar__stop-btn"
              >
                <Square size={14} fill="currentColor" />
              </IconButton>
            </Tooltip>

            <div className="editor-floating-toolbar__divider" />

            <Tooltip content={t('toolbar.restart', { defaultValue: '重新运行' })}>
              <IconButton
                variant="ghost"
                size="small"
                onClick={onRestart}
                disabled={!isActive}
                className="editor-floating-toolbar__restart-btn"
              >
                <RotateCcw size={16} />
              </IconButton>
            </Tooltip>

            <div className="editor-floating-toolbar__divider" />

            <Tooltip content={t('toolbar.collapse', { defaultValue: '折叠工具栏' })}>
              <IconButton
                variant="ghost"
                size="small"
                onClick={toggleCollapse}
                className="editor-floating-toolbar__toggle-btn"
              >
                <ChevronLeft size={14} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
};
