/**
 * TabToolbar component.
 * Compact toolbar for tab bar with run/debug actions.
 */

import React, { useCallback, useState } from 'react';
import {
  Play,
  Bug,
  Square,
  RotateCcw,
  Hammer,
  Wand2,
  Terminal,
  Settings,
  ChevronDown,
  ListTree,
  FileCode
} from 'lucide-react';
import { IconButton, Tooltip, Select } from '@/component-library';
import { useTranslation } from 'react-i18next';
import './TabToolbar.scss';

export interface RunConfig {
  id: string;
  name: string;
}

export interface TabToolbarProps {
  /** Whether toolbar is visible */
  isVisible?: boolean;
  /** Run handler */
  onRun?: (configId?: string) => void;
  /** Debug handler */
  onDebug?: () => void;
  /** Stop handler */
  onStop?: () => void;
  /** Restart handler */
  onRestart?: () => void;
  /** Build handler */
  onBuild?: () => void;
  /** Format handler */
  onFormat?: () => void;
  /** Open terminal handler */
  onOpenTerminal?: () => void;
  /** Open settings handler */
  onOpenSettings?: () => void;
  /** Whether operation is running */
  isRunning?: boolean;
  /** Whether debugging */
  isDebugging?: boolean;
  /** Whether building */
  isBuilding?: boolean;
  /** Run configurations */
  runConfigs?: RunConfig[];
  /** Selected config ID */
  selectedConfig?: string;
  /** Config change handler */
  onConfigChange?: (configId: string) => void;
}

export const TabToolbar: React.FC<TabToolbarProps> = ({
  isVisible = true,
  onRun,
  onDebug,
  onStop,
  onRestart,
  onBuild,
  onFormat,
  onOpenTerminal,
  onOpenSettings,
  isRunning = false,
  isDebugging = false,
  isBuilding = false,
  runConfigs = [],
  selectedConfig = 'debug',
  onConfigChange,
}) => {
  const { t } = useTranslation('components');

  const handleRun = useCallback(() => {
    if (onRun) onRun(selectedConfig);
  }, [onRun, selectedConfig]);

  const handleDebug = useCallback(() => {
    if (onDebug) onDebug();
  }, [onDebug]);

  const handleStop = useCallback(() => {
    if (onStop) onStop();
  }, [onStop]);

  const handleRestart = useCallback(() => {
    if (onRestart) onRestart();
  }, [onRestart]);

  const handleBuild = useCallback(() => {
    if (onBuild) onBuild();
  }, [onBuild]);

  const handleFormat = useCallback(() => {
    if (onFormat) onFormat();
  }, [onFormat]);

  const handleOpenTerminal = useCallback(() => {
    if (onOpenTerminal) onOpenTerminal();
  }, [onOpenTerminal]);

  const handleOpenSettings = useCallback(() => {
    if (onOpenSettings) onOpenSettings();
  }, [onOpenSettings]);

  const handleConfigChange = useCallback((value: string) => {
    if (onConfigChange) onConfigChange(value);
  }, [onConfigChange]);

  const isActive = isRunning || isDebugging || isBuilding;

  if (!isVisible) return null;

  return (
    <div className="tab-toolbar">
      {/* Run Group with Config Dropdown */}
      <div className="tab-toolbar__run-group">
        {/* Run Button */}
        <Tooltip content={t('toolbar.run', { defaultValue: '运行' })} placement="bottom">
          <IconButton
            variant="ghost"
            size="small"
          onClick={handleRun}
          disabled={isRunning}
          className="tab-toolbar__btn tab-toolbar__btn--run"
        >
          <Play size={14} />
        </IconButton>
      </Tooltip>

      {/* Config Dropdown */}
      {runConfigs.length > 0 && (
        <Select
          value={selectedConfig}
          onChange={(value) => handleConfigChange(value as string)}
          options={runConfigs.map(config => ({
            value: config.id,
            label: config.name,
          }))}
          size="small"
          className="tab-toolbar__config-select"
        />
      )}
      </div>

      {/* Debug Button */}
      <Tooltip content={t('toolbar.debug', { defaultValue: '调试' })} placement="bottom">
        <IconButton
          variant="ghost"
          size="small"
          onClick={handleDebug}
          disabled={isDebugging}
          className="tab-toolbar__btn tab-toolbar__btn--debug"
        >
          <Bug size={14} />
        </IconButton>
      </Tooltip>

      {/* Build Button */}
      <Tooltip content={t('toolbar.build', { defaultValue: '构建' })} placement="bottom">
        <IconButton
          variant="ghost"
          size="small"
          onClick={handleBuild}
          disabled={isBuilding}
          className="tab-toolbar__btn tab-toolbar__btn--build"
        >
          <Hammer size={14} />
        </IconButton>
      </Tooltip>

      {/* Stop Button */}
      <Tooltip content={t('toolbar.stop', { defaultValue: '停止' })} placement="bottom">
        <IconButton
          variant="ghost"
          size="small"
          onClick={handleStop}
          disabled={!isActive}
          className="tab-toolbar__btn tab-toolbar__btn--stop"
        >
          <Square size={12} fill="currentColor" />
        </IconButton>
      </Tooltip>

      {/* Restart Button */}
      <Tooltip content={t('toolbar.restart', { defaultValue: '重新运行' })} placement="bottom">
        <IconButton
          variant="ghost"
          size="small"
          onClick={handleRestart}
          disabled={!isActive}
          className="tab-toolbar__btn tab-toolbar__btn--restart"
        >
          <RotateCcw size={14} />
        </IconButton>
      </Tooltip>

      {/* Format Button */}
      <Tooltip content={t('toolbar.format', { defaultValue: '格式化' })} placement="bottom">
        <IconButton
          variant="ghost"
          size="small"
          onClick={handleFormat}
          className="tab-toolbar__btn tab-toolbar__btn--format"
        >
          <Wand2 size={14} />
        </IconButton>
      </Tooltip>

      {/* Terminal Button */}
      <Tooltip content={t('toolbar.terminal', { defaultValue: '终端' })} placement="bottom">
        <IconButton
          variant="ghost"
          size="small"
          onClick={handleOpenTerminal}
          className="tab-toolbar__btn tab-toolbar__btn--terminal"
        >
          <Terminal size={14} />
        </IconButton>
      </Tooltip>

      {/* Settings Button */}
      <Tooltip content={t('toolbar.settings', { defaultValue: '设置' })} placement="bottom">
        <IconButton
          variant="ghost"
          size="small"
          onClick={handleOpenSettings}
          className="tab-toolbar__btn tab-toolbar__btn--settings"
        >
          <Settings size={14} />
        </IconButton>
      </Tooltip>
    </div>
  );
};

TabToolbar.displayName = 'TabToolbar';

export default TabToolbar;
