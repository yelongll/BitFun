export type PropertyType =
  | 'text'
  | 'number'
  | 'color'
  | 'boolean'
  | 'select'
  | 'range'
  | 'textarea'
  | 'file'
  | 'array'
  | 'object'
  | 'event';

export interface PropertyOption {
  label: string;
  value: string | number;
}

export interface PropertyConfig {
  key: string;
  label: string;
  type: PropertyType;
  defaultValue?: unknown;
  options?: PropertyOption[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  description?: string;
  group?: string;
  condition?: (elementProps: Record<string, unknown>) => boolean;
}

export interface EventConfig {
  type: string;
  label: string;
  chineseName: string;
  description?: string;
}

export interface PropertyTab {
  id: string;
  label: string;
  propertyKeys: string[];
}

export interface ComponentDefinition {
  id: string;
  name: string;
  category: string;
  icon: string;
  defaultProps: Record<string, unknown>;
  defaultSize: {
    width: number;
    height: number;
  };
  properties: PropertyConfig[];
  events?: EventConfig[];
  tabs?: PropertyTab[];
  baseComponent?: string;
  renderTemplate?: string;
  codeTemplate?: string;
  previewIcon?: string;
}

export interface ComponentCategory {
  id: string;
  name: string;
  order: number;
}

export const DEFAULT_CATEGORIES: ComponentCategory[] = [
  { id: 'layout', name: '布局', order: 1 },
  { id: 'basic', name: '基础', order: 2 },
  { id: 'input', name: '输入', order: 3 },
  { id: 'form', name: '表单', order: 4 },
  { id: 'data', name: '数据', order: 5 },
  { id: 'navigation', name: '导航', order: 6 },
  { id: 'feedback', name: '反馈', order: 7 },
  { id: 'media', name: '媒体', order: 8 },
  { id: 'custom', name: '自定义', order: 99 },
];

export const COMMON_STYLE_PROPERTIES: PropertyConfig[] = [
  { key: 'styles.backgroundColor', label: '背景色', type: 'color', defaultValue: '', group: 'style' },
  { key: 'styles.textColor', label: '文字颜色', type: 'color', defaultValue: '', group: 'style' },
  { key: 'styles.borderColor', label: '边框颜色', type: 'color', defaultValue: '', group: 'style' },
  { key: 'styles.borderWidth', label: '边框宽度', type: 'number', defaultValue: 0, min: 0, group: 'style' },
  { key: 'styles.borderRadius', label: '圆角', type: 'number', defaultValue: 0, min: 0, group: 'style' },
  { key: 'styles.opacity', label: '透明度', type: 'range', defaultValue: 1, min: 0, max: 1, step: 0.01, group: 'style' },
  { key: 'styles.fontSize', label: '字体大小', type: 'number', defaultValue: 14, min: 1, group: 'style' },
  { key: 'styles.fontWeight', label: '字体粗细', type: 'select', defaultValue: 'normal', options: [
    { label: '正常', value: 'normal' },
    { label: '粗体', value: 'bold' },
  ], group: 'style' },
  { key: 'styles.textAlign', label: '文字对齐', type: 'select', defaultValue: 'left', options: [
    { label: '左对齐', value: 'left' },
    { label: '居中', value: 'center' },
    { label: '右对齐', value: 'right' },
  ], group: 'style' },
  { key: 'styles.paddingTop', label: '上内边距', type: 'number', defaultValue: 0, min: 0, group: 'style' },
  { key: 'styles.paddingRight', label: '右内边距', type: 'number', defaultValue: 0, min: 0, group: 'style' },
  { key: 'styles.paddingBottom', label: '下内边距', type: 'number', defaultValue: 0, min: 0, group: 'style' },
  { key: 'styles.paddingLeft', label: '左内边距', type: 'number', defaultValue: 0, min: 0, group: 'style' },
];

export const COMMON_LAYOUT_PROPERTIES: PropertyConfig[] = [
  { key: 'name', label: '名称', type: 'text', defaultValue: '', group: 'layout' },
  { key: 'x', label: 'X坐标', type: 'number', defaultValue: 0, group: 'layout' },
  { key: 'y', label: 'Y坐标', type: 'number', defaultValue: 0, group: 'layout' },
  { key: 'width', label: '宽度', type: 'number', defaultValue: 100, min: 0, group: 'layout' },
  { key: 'height', label: '高度', type: 'number', defaultValue: 36, min: 0, group: 'layout' },
  { key: 'title', label: '悬停提示', type: 'text', defaultValue: '', group: 'layout' },
  { key: 'locked', label: '锁定', type: 'boolean', defaultValue: false, group: 'layout' },
  { key: 'hidden', label: '隐藏', type: 'boolean', defaultValue: false, group: 'layout' },
];

export const COMMON_EVENT_PROPERTIES: PropertyConfig[] = [
  { key: 'events.onClick', label: '点击事件', type: 'event', defaultValue: '', group: 'events' },
  { key: 'events.onDoubleClick', label: '双击事件', type: 'event', defaultValue: '', group: 'events' },
  { key: 'events.onMouseEnter', label: '鼠标进入', type: 'event', defaultValue: '', group: 'events' },
  { key: 'events.onMouseLeave', label: '鼠标离开', type: 'event', defaultValue: '', group: 'events' },
];

export const DEFAULT_EVENTS: EventConfig[] = [
  { type: 'onClick', label: '点击事件', chineseName: '被单击' },
  { type: 'onDoubleClick', label: '双击事件', chineseName: '被双击' },
  { type: 'onMouseEnter', label: '鼠标进入', chineseName: '鼠标进入' },
  { type: 'onMouseLeave', label: '鼠标离开', chineseName: '鼠标离开' },
];
