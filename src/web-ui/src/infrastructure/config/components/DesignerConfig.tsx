import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, ConfigPageLoading, ConfigPageMessage } from '@/component-library';
import { configManager } from '../services/ConfigManager';
import {
  ConfigPageLayout,
  ConfigPageHeader,
  ConfigPageContent,
  ConfigPageSection,
  ConfigPageRow,
} from './common';
import { createLogger } from '@/shared/utils/logger';
import './DesignerConfig.scss';

const log = createLogger('DesignerConfig');

const AUTO_SAVE_DELAY = 500;

export interface DesignerConfigType {
  alignmentLines: boolean;
  alignmentThreshold: number;
  alignmentLineColor: string;
  alignmentLineStyle: 'solid' | 'dashed';
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  layoutSpacing: number;
}

export const DEFAULT_DESIGNER_CONFIG: DesignerConfigType = {
  alignmentLines: true,
  alignmentThreshold: 5,
  alignmentLineColor: '#3b82f6',
  alignmentLineStyle: 'dashed',
  showGrid: false,
  snapToGrid: false,
  gridSize: 10,
  layoutSpacing: 10,
};

export type DesignerConfigProps = Record<string, never>;

const DesignerConfig: React.FC<DesignerConfigProps> = () => {
  const { t } = useTranslation('settings');
  const [config, setConfig] = useState<DesignerConfigType>(DEFAULT_DESIGNER_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        const savedConfig = await configManager.getConfig<DesignerConfigType>('designer');
        if (savedConfig) {
          setConfig({ ...DEFAULT_DESIGNER_CONFIG, ...savedConfig });
        } else {
          setConfig(DEFAULT_DESIGNER_CONFIG);
        }
      } catch (err) {
        log.error('Failed to load designer config:', err);
        setError(t('designer.loadError', { defaultValue: '加载设计器配置失败' }));
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [t]);

  const saveConfig = useCallback(async (newConfig: DesignerConfigType) => {
    try {
      await configManager.set('designer', newConfig);
      setHasChanges(false);
      log.info('Designer config saved:', newConfig);
    } catch (err) {
      log.error('Failed to save designer config:', err);
      setError(t('designer.saveError', { defaultValue: '保存设计器配置失败' }));
    }
  }, [t]);

  const debouncedSave = useCallback((newConfig: DesignerConfigType) => {
    setHasChanges(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveConfig(newConfig);
    }, AUTO_SAVE_DELAY);
  }, [saveConfig]);

  const updateConfig = useCallback(<K extends keyof DesignerConfigType>(
    key: K,
    value: DesignerConfigType[K]
  ) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    debouncedSave(newConfig);
  }, [config, debouncedSave]);

  if (loading) {
    return <ConfigPageLoading text={t('designer.loading', { defaultValue: '加载中...' })} />;
  }

  if (error) {
    return (
      <ConfigPageMessage message={{ type: 'error', text: error }} />
    );
  }

  return (
    <ConfigPageLayout>
      <ConfigPageHeader
        title={t('designer.title', { defaultValue: '设计器设置' })}
        subtitle={t('designer.description', { defaultValue: '配置设计器的行为和外观' })}
      />

      <ConfigPageContent>
        <ConfigPageSection title={t('designer.alignment.title', { defaultValue: '对齐辅助' })}>
          <ConfigPageRow
            label={t('designer.alignment.lines.label', { defaultValue: '对齐辅助线' })}
            description={t('designer.alignment.lines.description', { defaultValue: '拖动组件时显示对齐辅助线，帮助精确对齐' })}
          >
            <Switch
              checked={config.alignmentLines}
              onChange={(e) => updateConfig('alignmentLines', e.target.checked)}
              aria-label={t('designer.alignment.lines.label', { defaultValue: '对齐辅助线' })}
            />
          </ConfigPageRow>

          <ConfigPageRow
            label={t('designer.alignment.threshold.label', { defaultValue: '对齐阈值' })}
            description={t('designer.alignment.threshold.description', { defaultValue: '触发对齐线的距离（像素）' })}
          >
            <input
              type="number"
              min={0}
              max={20}
              value={config.alignmentThreshold}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                updateConfig('alignmentThreshold', isNaN(val) ? 5 : val);
              }}
              className="designer-config__number-input"
              disabled={!config.alignmentLines}
            />
          </ConfigPageRow>

          <ConfigPageRow
            label={t('designer.alignment.color.label', { defaultValue: '对齐线颜色' })}
            description={t('designer.alignment.color.description', { defaultValue: '对齐辅助线的颜色' })}
          >
            <input
              type="color"
              value={config.alignmentLineColor}
              onChange={(e) => updateConfig('alignmentLineColor', e.target.value)}
              className="designer-config__color-input"
              disabled={!config.alignmentLines}
            />
          </ConfigPageRow>

          <ConfigPageRow
            label={t('designer.alignment.style.label', { defaultValue: '对齐线样式' })}
            description={t('designer.alignment.style.description', { defaultValue: '对齐辅助线的线条样式' })}
          >
            <select
              value={config.alignmentLineStyle}
              onChange={(e) => updateConfig('alignmentLineStyle', e.target.value as 'solid' | 'dashed')}
              className="designer-config__select-input"
              disabled={!config.alignmentLines}
            >
              <option value="solid">{t('designer.alignment.style.solid', { defaultValue: '实线' })}</option>
              <option value="dashed">{t('designer.alignment.style.dashed', { defaultValue: '虚线' })}</option>
            </select>
          </ConfigPageRow>
        </ConfigPageSection>

        <ConfigPageSection title={t('designer.grid.title', { defaultValue: '网格设置' })}>
          <ConfigPageRow
            label={t('designer.grid.show.label', { defaultValue: '显示网格' })}
            description={t('designer.grid.show.description', { defaultValue: '在设计画布上显示网格' })}
          >
            <Switch
              checked={config.showGrid}
              onChange={(e) => updateConfig('showGrid', e.target.checked)}
              aria-label={t('designer.grid.show.label', { defaultValue: '显示网格' })}
            />
          </ConfigPageRow>

          <ConfigPageRow
            label={t('designer.grid.size.label', { defaultValue: '网格大小' })}
            description={t('designer.grid.size.description', { defaultValue: '设置网格的大小（像素）' })}
          >
            <input
              type="number"
              min={0}
              max={100}
              value={config.gridSize}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                updateConfig('gridSize', isNaN(val) ? 10 : val);
              }}
              className="designer-config__number-input"
              disabled={!config.showGrid}
            />
          </ConfigPageRow>

          <ConfigPageRow
            label={t('designer.grid.snapToGrid.label', { defaultValue: '吸附到网格' })}
            description={t('designer.grid.snapToGrid.description', { defaultValue: '组件移动时自动吸附到网格' })}
          >
            <Switch
              checked={config.snapToGrid}
              onChange={(e) => updateConfig('snapToGrid', e.target.checked)}
              aria-label={t('designer.grid.snapToGrid.label', { defaultValue: '吸附到网格' })}
            />
          </ConfigPageRow>
        </ConfigPageSection>

        <ConfigPageSection title={t('designer.layout.title', { defaultValue: '布局设置' })}>
          <ConfigPageRow
            label={t('designer.layout.spacing.label', { defaultValue: '布局间距' })}
            description={t('designer.layout.spacing.description', { defaultValue: '自动布局时组件之间的间距（像素）' })}
          >
            <input
              type="number"
              min={0}
              max={100}
              value={config.layoutSpacing}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                updateConfig('layoutSpacing', isNaN(val) ? 10 : val);
              }}
              className="designer-config__number-input"
            />
          </ConfigPageRow>
        </ConfigPageSection>
      </ConfigPageContent>
    </ConfigPageLayout>
  );
};

export default DesignerConfig;
