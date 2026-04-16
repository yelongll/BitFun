import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Bug, 
  Hammer, 
  Square,
  ChevronDown,
  Terminal,
  Settings,
  RotateCcw,
  Wand2
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
  isRunning?: boolean;
  isDebugging?: boolean;
  isBuilding?: boolean;
  language?: string;
  filePath?: string;
  runConfigs?: RunConfig[];
  selectedConfig?: string;
  onConfigChange?: (configId: string) => void;
}

export const EditorFloatingToolbar: React.FC<EditorFloatingToolbarProps> = ({
  isVisible,
  position = { x: 20, y: 20 },
  onRun,
  onDebug,
  onBuild,
  onStop,
  onRestart,
  onFormat,
  onOpenTerminal,
  onOpenSettings,
  isRunning = false,
  isDebugging = false,
  isBuilding = false,
  language,
  filePath,
  runConfigs = [],
  selectedConfig = 'default',
  onConfigChange,
}) => {
  const { t } = useI18n('editor');
  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleRun = useCallback(() => {
    if (onRun) {
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

  // Get language-specific run button label
  const getRunLabel = () => {
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

  // Check if any operation is active
  const isActive = isRunning || isDebugging || isBuilding;

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className="editor-floating-toolbar"
    >
      <div className="editor-floating-toolbar__container">
        {/* Run Button with Config Dropdown */}
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
          
          {/* Config Selector Dropdown */}
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
            </div>
          )}
        </div>

        {/* Debug Button */}
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

        {/* Build Button */}
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

        {/* Stop Button */}
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

        {/* Divider */}
        <div className="editor-floating-toolbar__divider" />

        {/* Restart Button */}
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

        {/* Format Button */}
        <Tooltip content={t('toolbar.format', { defaultValue: '格式化代码' })}>
          <IconButton
            variant="ghost"
            size="small"
            onClick={onFormat}
            className="editor-floating-toolbar__format-btn"
          >
            <Wand2 size={16} />
          </IconButton>
        </Tooltip>

        {/* Terminal Button */}
        <Tooltip content={t('toolbar.terminal', { defaultValue: '打开终端' })}>
          <IconButton
            variant="ghost"
            size="small"
            onClick={onOpenTerminal}
            className="editor-floating-toolbar__terminal-btn"
          >
            <Terminal size={16} />
          </IconButton>
        </Tooltip>

        {/* Settings Button */}
        <Tooltip content={t('toolbar.settings', { defaultValue: '运行设置' })}>
          <IconButton
            variant="ghost"
            size="small"
            onClick={onOpenSettings}
            className="editor-floating-toolbar__settings-btn"
          >
            <Settings size={16} />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
};
