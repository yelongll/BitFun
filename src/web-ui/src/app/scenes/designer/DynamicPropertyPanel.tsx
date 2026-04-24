import React, { useState } from 'react';
import { Palette, Layout, Zap, SlidersHorizontal, Box, Code2 } from 'lucide-react';
import { componentRegistry } from './registry';
import type { PropertyConfig, ComponentDefinition } from './registry';
import { DesignerElement } from './DesignerPropertiesPanel';
import { eventCodeService, EVENT_LABELS } from './EventCodeService';
import { editorJumpService } from '@/shared/services/EditorJumpService';
import { globalAPI } from '@/infrastructure/api/service-api/GlobalAPI';

interface DynamicPropertyPanelProps {
  element: DesignerElement;
  updateElement: (id: string, updates: Partial<DesignerElement>) => void;
  t: (key: string) => string;
  filePath?: string;
  windowName?: string;
}

interface ComponentPropertySchema {
  componentType: string;
  properties: PropertyConfig[];
  tabs: {
    id: string;
    label: string;
    propertyKeys: string[];
  }[];
}

function getComponentSchema(componentType: string): ComponentPropertySchema | undefined {
  const def = componentRegistry.get(componentType);
  if (!def) return undefined;
  
  return {
    componentType: def.id,
    properties: def.properties,
    tabs: def.tabs || [
      { id: 'basic', label: '基础', propertyKeys: def.properties.filter(p => p.group === 'basic').map(p => p.key) },
      { id: 'layout', label: '布局', propertyKeys: def.properties.filter(p => p.group === 'layout').map(p => p.key) },
      { id: 'style', label: '样式', propertyKeys: def.properties.filter(p => p.group === 'style').map(p => p.key) },
      { id: 'events', label: '事件', propertyKeys: def.properties.filter(p => p.group === 'events').map(p => p.key) },
    ],
  };
}

// 获取嵌套属性值
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let value: unknown = obj;
  for (const key of keys) {
    if (value === null || value === undefined || typeof value !== 'object') {
      return undefined;
    }
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

// 设置嵌套属性值
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const keys = path.split('.');
  const result = { ...obj };
  let current: Record<string, unknown> = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current[key] = { ...(current[key] as Record<string, unknown>) };
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
  return result;
}

// 渲染单个属性编辑器
const PropertyEditor: React.FC<{
  config: PropertyConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  elementProps: Record<string, unknown>;
  filePath?: string;
  windowName?: string;
  elementName?: string;
}> = ({ config, value, onChange, elementProps, filePath, windowName, elementName }) => {
  if (config.condition && !config.condition(elementProps)) {
    return null;
  }

  const currentValue = value !== undefined ? value : config.defaultValue;

  const renderInput = () => {
    switch (config.type) {
      case 'text':
        return (
          <input
            type="text"
            value={(currentValue as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            className="designer-properties__input"
          />
        );

      case 'event':
        const eventType = config.key.replace('events.', '');
        const eventLabel = EVENT_LABELS[eventType] || eventType;
        const functionName = elementName ? eventCodeService.generateEventFunctionName(elementName, eventType) : '';
        
        const handleEventButtonClick = async () => {
          if (!elementName || !filePath || !windowName) return;
          
          const result = await eventCodeService.generateEventInLogicFile(elementName, eventType, windowName);
          
          if (result.success) {
            onChange(result.functionName);
            
            const workspacePath = await globalAPI.getCurrentWorkspacePath();
            if (workspacePath && result.line) {
              const logicFilePath = `${workspacePath}/交互_${windowName}.灵`;
              await editorJumpService.jumpToFile(logicFilePath, result.line);
            }
          }
        };
        
        return (
          <div className="designer-properties__event-input">
            <input
              type="text"
              value={(currentValue as string) || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={config.placeholder || '事件处理代码'}
              className="designer-properties__input"
            />
            {elementName && filePath && windowName && (
              <button
                className="designer-properties__event-btn"
                onClick={handleEventButtonClick}
                title={`生成事件处理函数: ${functionName}`}
              >
                <Code2 size={14} />
              </button>
            )}
          </div>
        );

      case 'textarea':
        return (
          <textarea
            value={(currentValue as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            rows={3}
            className="designer-properties__textarea"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={(currentValue as number) ?? config.defaultValue ?? 0}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            min={config.min}
            max={config.max}
            step={config.step}
            className="designer-properties__input"
          />
        );

      case 'color':
        return (
          <div className="designer-properties__color-input">
            <input
              type="color"
              value={(currentValue as string) || '#ffffff'}
              onChange={(e) => onChange(e.target.value)}
            />
            <input
              type="text"
              value={(currentValue as string) || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={config.placeholder || '透明'}
              className="designer-properties__input"
            />
          </div>
        );

      case 'boolean':
        return (
          <label className="designer-properties__checkbox-label">
            <input
              type="checkbox"
              checked={!!currentValue}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span className="designer-properties__checkbox-text">{currentValue ? '是' : '否'}</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={(currentValue as string | number) || config.defaultValue || ''}
            onChange={(e) => onChange(e.target.value)}
            className="designer-properties__select"
          >
            {config.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'range':
        const min = config.min ?? 0;
        const max = config.max ?? 100;
        const step = config.step ?? 1;
        const displayValue = ((currentValue as number) ?? config.defaultValue ?? min);
        const percentage = ((displayValue - min) / (max - min)) * 100;

        return (
          <div className="designer-properties__range-row">
            <input
              type="range"
              value={displayValue}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              min={min}
              max={max}
              step={step}
              className="designer-properties__range"
            />
            <span className="designer-properties__range-value">
              {step < 1 ? displayValue.toFixed(2) : displayValue}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="designer-properties__row">
      <label title={config.description}>{config.label}</label>
      {renderInput()}
    </div>
  );
};

// 动态属性面板组件
export const DynamicPropertyPanel: React.FC<DynamicPropertyPanelProps> = ({
  element,
  updateElement,
  t,
  filePath,
  windowName,
}) => {
  const [activeTab, setActiveTab] = useState<string>('basic');

  // 获取组件属性配置
  const schema = getComponentSchema(element.type);

  // 如果没有配置，显示默认提示
  if (!schema) {
    return (
      <div className="designer-properties__unsupported">
        <p>该组件类型暂无详细属性配置</p>
        <p>组件类型: {element.type}</p>
      </div>
    );
  }

  // 获取当前标签页的配置
  const currentTab = schema.tabs.find((tab) => tab.id === activeTab) || schema.tabs[0];

  // 获取当前标签页的属性配置
  const tabProperties = currentTab.propertyKeys
    .map((key) => schema.properties.find((p) => p.key === key))
    .filter((p): p is PropertyConfig => p !== undefined);

  // 按分组组织属性
  const groupedProperties = tabProperties.reduce((acc, prop) => {
    const group = prop.group || 'default';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(prop);
    return acc;
  }, {} as Record<string, PropertyConfig[]>);

  // 处理属性值变更
  const handlePropertyChange = (key: string, value: unknown) => {
    const keys = key.split('.');

    if (keys.length === 1) {
      // 直接属性
      updateElement(element.id, { [key]: value });
    } else {
      // 嵌套属性 (如 styles.backgroundColor)
      const parentKey = keys[0];
      const parentObj = (element[parentKey as keyof DesignerElement] as Record<string, unknown>) || {};
      const newParentObj = setNestedValue(parentObj, keys.slice(1).join('.'), value);
      updateElement(element.id, { [parentKey]: newParentObj });
    }
  };

  // 获取属性值
  const getPropertyValue = (key: string): unknown => {
    return getNestedValue(element as Record<string, unknown>, key);
  };

  // 获取标签页图标
  const getTabIcon = (tabId: string) => {
    switch (tabId) {
      case 'basic':
        return <Box size={14} />;
      case 'layout':
        return <Layout size={14} />;
      case 'style':
        return <Palette size={14} />;
      case 'events':
        return <Zap size={14} />;
      case 'advanced':
        return <SlidersHorizontal size={14} />;
      default:
        return <Box size={14} />;
    }
  };

  return (
    <div className="designer-properties">
      {/* 标签页导航 */}
      <div className="designer-properties__tabs">
        {schema.tabs.map((tab) => (
          <button
            key={tab.id}
            className={`designer-properties__tab ${activeTab === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {getTabIcon(tab.id)}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 属性列表 */}
      <div className="designer-properties__section">
        {Object.entries(groupedProperties).map(([group, properties]) => (
          <div key={group} className="designer-properties__group">
            {group !== 'default' && (
              <div className="designer-properties__group-title">
                {group === 'basic' && '基础属性'}
                {group === 'layout' && '布局属性'}
                {group === 'style' && '样式属性'}
                {group === 'events' && '事件属性'}
              </div>
            )}
            {properties.map((prop) => (
              <PropertyEditor
                key={prop.key}
                config={prop}
                value={getPropertyValue(prop.key)}
                onChange={(value) => handlePropertyChange(prop.key, value)}
                elementProps={element.props || {}}
                filePath={filePath}
                windowName={windowName}
                elementName={element.name || element.id}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicPropertyPanel;
