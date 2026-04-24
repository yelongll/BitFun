/**
 * 组件属性配置
 * 定义每种组件类型支持的属性
 */

export type PropertyType =
  | 'text'           // 文本输入
  | 'number'         // 数字输入
  | 'color'          // 颜色选择
  | 'boolean'        // 布尔值（复选框）
  | 'select'         // 下拉选择
  | 'range'          // 滑块范围
  | 'textarea'       // 多行文本
  | 'file'           // 文件选择
  | 'array'          // 数组（如选项列表）
  | 'object'         // 对象（如样式对象）
  | 'event';         // 事件（带跳转按钮）

export interface PropertyConfig {
  key: string;                    // 属性名
  label: string;                  // 显示标签
  type: PropertyType;             // 属性类型
  defaultValue?: unknown;         // 默认值
  options?: { label: string; value: string | number }[];  // 下拉选项
  min?: number;                   // 最小值（用于number/range）
  max?: number;                   // 最大值
  step?: number;                  // 步长
  placeholder?: string;           // 占位符
  description?: string;           // 属性描述
  group?: string;                 // 分组（如basic/style/layout）
  condition?: (props: Record<string, unknown>) => boolean; // 显示条件
}

export interface ComponentPropertySchema {
  componentType: string;
  properties: PropertyConfig[];
  tabs: {
    id: string;
    label: string;
    propertyKeys: string[];  // 该标签页包含的属性key
  }[];
}

// 通用样式属性（所有组件共享）
const commonStyleProperties: PropertyConfig[] = [
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
    { label: '100', value: '100' },
    { label: '200', value: '200' },
    { label: '300', value: '300' },
    { label: '400', value: '400' },
    { label: '500', value: '500' },
    { label: '600', value: '600' },
    { label: '700', value: '700' },
    { label: '800', value: '800' },
    { label: '900', value: '900' },
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
  { key: 'styles.marginTop', label: '上外边距', type: 'number', defaultValue: 0, min: 0, group: 'style' },
  { key: 'styles.marginRight', label: '右外边距', type: 'number', defaultValue: 0, min: 0, group: 'style' },
  { key: 'styles.marginBottom', label: '下外边距', type: 'number', defaultValue: 0, min: 0, group: 'style' },
  { key: 'styles.marginLeft', label: '左外边距', type: 'number', defaultValue: 0, min: 0, group: 'style' },
  { key: 'styles.boxShadow', label: '阴影', type: 'text', defaultValue: '', placeholder: '如: 0 2px 4px rgba(0,0,0,0.1)', group: 'style' },
];

// 通用布局属性
const commonLayoutProperties: PropertyConfig[] = [
  { key: 'name', label: '名称', type: 'text', defaultValue: '', group: 'layout' },
  { key: 'x', label: 'X坐标', type: 'number', defaultValue: 0, group: 'layout' },
  { key: 'y', label: 'Y坐标', type: 'number', defaultValue: 0, group: 'layout' },
  { key: 'width', label: '宽度', type: 'number', defaultValue: 100, min: 0, group: 'layout' },
  { key: 'height', label: '高度', type: 'number', defaultValue: 36, min: 0, group: 'layout' },
  { key: 'title', label: '悬停提示', type: 'text', defaultValue: '', placeholder: '鼠标悬停时显示的提示文本', group: 'layout' },
  { key: 'description', label: '描述', type: 'textarea', defaultValue: '', placeholder: '元素描述', group: 'layout' },
  { key: 'className', label: '类名', type: 'text', defaultValue: '', placeholder: 'CSS类名', group: 'layout' },
  { key: 'locked', label: '锁定', type: 'boolean', defaultValue: false, group: 'layout' },
  { key: 'hidden', label: '隐藏', type: 'boolean', defaultValue: false, group: 'layout' },
];

// 通用事件属性
const commonEventProperties: PropertyConfig[] = [
  { key: 'events.onClick', label: '点击事件', type: 'event', defaultValue: '', placeholder: '事件处理代码', group: 'events' },
  { key: 'events.onDoubleClick', label: '双击事件', type: 'event', defaultValue: '', placeholder: '事件处理代码', group: 'events' },
  { key: 'events.onMouseEnter', label: '鼠标进入', type: 'event', defaultValue: '', placeholder: '事件处理代码', group: 'events' },
  { key: 'events.onMouseLeave', label: '鼠标离开', type: 'event', defaultValue: '', placeholder: '事件处理代码', group: 'events' },
  { key: 'events.onFocus', label: '获得焦点', type: 'event', defaultValue: '', placeholder: '事件处理代码', group: 'events' },
  { key: 'events.onBlur', label: '失去焦点', type: 'event', defaultValue: '', placeholder: '事件处理代码', group: 'events' },
];

// 按钮组件属性
const buttonProperties: PropertyConfig[] = [
  // 基础属性
  { key: 'props.text', label: '按钮文本', type: 'text', defaultValue: '按钮', group: 'basic' },
  { key: 'props.disabled', label: '禁用', type: 'boolean', defaultValue: false, group: 'basic' },
  { key: 'props.loading', label: '加载中', type: 'boolean', defaultValue: false, group: 'basic' },
  { key: 'props.block', label: '块级按钮', type: 'boolean', defaultValue: false, group: 'basic' },
  { key: 'props.size', label: '尺寸', type: 'select', defaultValue: 'medium', options: [
    { label: '小', value: 'small' },
    { label: '中', value: 'medium' },
    { label: '大', value: 'large' },
  ], group: 'basic' },
  { key: 'props.type', label: '类型', type: 'select', defaultValue: 'default', options: [
    { label: '默认', value: 'default' },
    { label: '主要', value: 'primary' },
    { label: '成功', value: 'success' },
    { label: '警告', value: 'warning' },
    { label: '危险', value: 'danger' },
    { label: '信息', value: 'info' },
    { label: '链接', value: 'link' },
    { label: '文本', value: 'text' },
  ], group: 'basic' },
  { key: 'props.variant', label: '变体', type: 'select', defaultValue: 'solid', options: [
    { label: '实心', value: 'solid' },
    { label: '轮廓', value: 'outline' },
    { label: '幽灵', value: 'ghost' },
    { label: '虚线', value: 'dashed' },
  ], group: 'basic' },
  { key: 'props.shape', label: '形状', type: 'select', defaultValue: 'default', options: [
    { label: '默认', value: 'default' },
    { label: '圆形', value: 'circle' },
    { label: '圆角', value: 'round' },
  ], group: 'basic' },
  { key: 'props.icon', label: '图标', type: 'text', defaultValue: '', placeholder: '图标名称', group: 'basic' },
  { key: 'props.iconPosition', label: '图标位置', type: 'select', defaultValue: 'left', options: [
    { label: '左侧', value: 'left' },
    { label: '右侧', value: 'right' },
  ], group: 'basic', condition: (props) => !!props.icon },
  { key: 'props.href', label: '链接地址', type: 'text', defaultValue: '', placeholder: '点击后跳转的URL', group: 'basic' },
  { key: 'props.target', label: '打开方式', type: 'select', defaultValue: '_self', options: [
    { label: '当前窗口', value: '_self' },
    { label: '新窗口', value: '_blank' },
  ], group: 'basic', condition: (props) => !!props.href },
];

// 输入框组件属性
const inputProperties: PropertyConfig[] = [
  { key: 'props.value', label: '默认值', type: 'text', defaultValue: '', group: 'basic' },
  { key: 'props.disabled', label: '禁用', type: 'boolean', defaultValue: false, group: 'basic' },
  { key: 'props.readOnly', label: '只读', type: 'boolean', defaultValue: false, group: 'basic' },
  { key: 'props.maxLength', label: '最大长度', type: 'number', defaultValue: undefined, min: 0, group: 'basic' },
  { key: 'props.size', label: '尺寸', type: 'select', defaultValue: 'medium', options: [
    { label: '小', value: 'small' },
    { label: '中', value: 'medium' },
    { label: '大', value: 'large' },
  ], group: 'basic' },
];

// 文本组件属性
const textProperties: PropertyConfig[] = [
  { key: 'props.text', label: '文本内容', type: 'text', defaultValue: '文本', group: 'basic' },
  { key: 'props.ellipsis', label: '自动换行', type: 'boolean', defaultValue: false, group: 'basic' },
];

// 图片组件属性
const imageProperties: PropertyConfig[] = [
  { key: 'props.src', label: '图片地址', type: 'text', defaultValue: '', placeholder: '图片URL', group: 'basic' },
  { key: 'props.alt', label: '替代文本', type: 'text', defaultValue: '', placeholder: '图片描述', group: 'basic' },
];

// 复选框组件属性
const checkboxProperties: PropertyConfig[] = [
  { key: 'props.label', label: '标签', type: 'text', defaultValue: '复选框', group: 'basic' },
  { key: 'props.checked', label: '选中', type: 'boolean', defaultValue: false, group: 'basic' },
  { key: 'props.disabled', label: '禁用', type: 'boolean', defaultValue: false, group: 'basic' },
];

// 单选框组件属性
const radioProperties: PropertyConfig[] = [
  { key: 'props.label', label: '标签', type: 'text', defaultValue: '单选框', group: 'basic' },
  { key: 'props.checked', label: '选中', type: 'boolean', defaultValue: false, group: 'basic' },
  { key: 'props.disabled', label: '禁用', type: 'boolean', defaultValue: false, group: 'basic' },
];

// 开关组件属性
const toggleProperties: PropertyConfig[] = [
  { key: 'props.checked', label: '开启', type: 'boolean', defaultValue: false, group: 'basic' },
  { key: 'props.disabled', label: '禁用', type: 'boolean', defaultValue: false, group: 'basic' },
  { key: 'props.checkedChildren', label: '开启文本', type: 'text', defaultValue: '', group: 'basic' },
  { key: 'props.unCheckedChildren', label: '关闭文本', type: 'text', defaultValue: '', group: 'basic' },
];

// 滑块组件属性
const sliderProperties: PropertyConfig[] = [
  { key: 'props.min', label: '最小值', type: 'number', defaultValue: 0, group: 'basic' },
  { key: 'props.max', label: '最大值', type: 'number', defaultValue: 100, group: 'basic' },
  { key: 'props.step', label: '步长', type: 'number', defaultValue: 1, group: 'basic' },
  { key: 'props.value', label: '当前值', type: 'number', defaultValue: 0, group: 'basic' },
  { key: 'props.disabled', label: '禁用', type: 'boolean', defaultValue: false, group: 'basic' },
  { key: 'props.vertical', label: '垂直', type: 'boolean', defaultValue: false, group: 'basic' },
];

// 进度条组件属性
const progressProperties: PropertyConfig[] = [
  { key: 'props.value', label: '当前值', type: 'number', defaultValue: 50, min: 0, max: 100, group: 'basic' },
  { key: 'props.status', label: '状态', type: 'select', defaultValue: 'normal', options: [
    { label: '正常', value: 'normal' },
    { label: '成功', value: 'success' },
    { label: '异常', value: 'exception' },
    { label: '活动', value: 'active' },
  ], group: 'basic' },
  { key: 'props.showInfo', label: '显示信息', type: 'boolean', defaultValue: true, group: 'basic' },
];

// 提示框组件属性
const alertProperties: PropertyConfig[] = [
  { key: 'props.text', label: '提示内容', type: 'textarea', defaultValue: '提示信息', group: 'basic' },
  { key: 'props.type', label: '类型', type: 'select', defaultValue: 'info', options: [
    { label: '信息', value: 'info' },
    { label: '成功', value: 'success' },
    { label: '警告', value: 'warning' },
    { label: '错误', value: 'error' },
  ], group: 'basic' },
  { key: 'props.showIcon', label: '显示图标', type: 'boolean', defaultValue: true, group: 'basic' },
];

// 组件属性配置映射
export const componentPropertySchemas: Record<string, ComponentPropertySchema> = {
  button: {
    componentType: 'button',
    properties: [
      ...buttonProperties,
      ...commonLayoutProperties,
      ...commonStyleProperties,
      ...commonEventProperties,
    ],
    tabs: [
      { id: 'basic', label: '基础', propertyKeys: buttonProperties.map(p => p.key) },
      { id: 'layout', label: '布局', propertyKeys: commonLayoutProperties.map(p => p.key) },
      { id: 'style', label: '样式', propertyKeys: commonStyleProperties.map(p => p.key) },
      { id: 'events', label: '事件', propertyKeys: commonEventProperties.map(p => p.key) },
    ],
  },
  input: {
    componentType: 'input',
    properties: [
      ...inputProperties,
      ...commonLayoutProperties,
      ...commonStyleProperties,
      ...commonEventProperties,
    ],
    tabs: [
      { id: 'basic', label: '基础', propertyKeys: inputProperties.map(p => p.key) },
      { id: 'layout', label: '布局', propertyKeys: commonLayoutProperties.map(p => p.key) },
      { id: 'style', label: '样式', propertyKeys: commonStyleProperties.map(p => p.key) },
      { id: 'events', label: '事件', propertyKeys: commonEventProperties.map(p => p.key) },
    ],
  },
  text: {
    componentType: 'text',
    properties: [
      ...textProperties,
      ...commonLayoutProperties,
      ...commonStyleProperties,
      ...commonEventProperties,
    ],
    tabs: [
      { id: 'basic', label: '基础', propertyKeys: textProperties.map(p => p.key) },
      { id: 'layout', label: '布局', propertyKeys: commonLayoutProperties.map(p => p.key) },
      { id: 'style', label: '样式', propertyKeys: commonStyleProperties.map(p => p.key) },
      { id: 'events', label: '事件', propertyKeys: commonEventProperties.map(p => p.key) },
    ],
  },
  image: {
    componentType: 'image',
    properties: [
      ...imageProperties,
      ...commonLayoutProperties,
      ...commonStyleProperties,
      ...commonEventProperties,
    ],
    tabs: [
      { id: 'basic', label: '基础', propertyKeys: imageProperties.map(p => p.key) },
      { id: 'layout', label: '布局', propertyKeys: commonLayoutProperties.map(p => p.key) },
      { id: 'style', label: '样式', propertyKeys: commonStyleProperties.map(p => p.key) },
      { id: 'events', label: '事件', propertyKeys: commonEventProperties.map(p => p.key) },
    ],
  },
  checkbox: {
    componentType: 'checkbox',
    properties: [
      ...checkboxProperties,
      ...commonLayoutProperties,
      ...commonStyleProperties,
      ...commonEventProperties,
    ],
    tabs: [
      { id: 'basic', label: '基础', propertyKeys: checkboxProperties.map(p => p.key) },
      { id: 'layout', label: '布局', propertyKeys: commonLayoutProperties.map(p => p.key) },
      { id: 'style', label: '样式', propertyKeys: commonStyleProperties.map(p => p.key) },
      { id: 'events', label: '事件', propertyKeys: commonEventProperties.map(p => p.key) },
    ],
  },
  radio: {
    componentType: 'radio',
    properties: [
      ...radioProperties,
      ...commonLayoutProperties,
      ...commonStyleProperties,
      ...commonEventProperties,
    ],
    tabs: [
      { id: 'basic', label: '基础', propertyKeys: radioProperties.map(p => p.key) },
      { id: 'layout', label: '布局', propertyKeys: commonLayoutProperties.map(p => p.key) },
      { id: 'style', label: '样式', propertyKeys: commonStyleProperties.map(p => p.key) },
      { id: 'events', label: '事件', propertyKeys: commonEventProperties.map(p => p.key) },
    ],
  },
  toggle: {
    componentType: 'toggle',
    properties: [
      ...toggleProperties,
      ...commonLayoutProperties,
      ...commonStyleProperties,
      ...commonEventProperties,
    ],
    tabs: [
      { id: 'basic', label: '基础', propertyKeys: toggleProperties.map(p => p.key) },
      { id: 'layout', label: '布局', propertyKeys: commonLayoutProperties.map(p => p.key) },
      { id: 'style', label: '样式', propertyKeys: commonStyleProperties.map(p => p.key) },
      { id: 'events', label: '事件', propertyKeys: commonEventProperties.map(p => p.key) },
    ],
  },
  slider: {
    componentType: 'slider',
    properties: [
      ...sliderProperties,
      ...commonLayoutProperties,
      ...commonStyleProperties,
      ...commonEventProperties,
    ],
    tabs: [
      { id: 'basic', label: '基础', propertyKeys: sliderProperties.map(p => p.key) },
      { id: 'layout', label: '布局', propertyKeys: commonLayoutProperties.map(p => p.key) },
      { id: 'style', label: '样式', propertyKeys: commonStyleProperties.map(p => p.key) },
      { id: 'events', label: '事件', propertyKeys: commonEventProperties.map(p => p.key) },
    ],
  },
  progress: {
    componentType: 'progress',
    properties: [
      ...progressProperties,
      ...commonLayoutProperties,
      ...commonStyleProperties,
      ...commonEventProperties,
    ],
    tabs: [
      { id: 'basic', label: '基础', propertyKeys: progressProperties.map(p => p.key) },
      { id: 'layout', label: '布局', propertyKeys: commonLayoutProperties.map(p => p.key) },
      { id: 'style', label: '样式', propertyKeys: commonStyleProperties.map(p => p.key) },
      { id: 'events', label: '事件', propertyKeys: commonEventProperties.map(p => p.key) },
    ],
  },
  alert: {
    componentType: 'alert',
    properties: [
      ...alertProperties,
      ...commonLayoutProperties,
      ...commonStyleProperties,
      ...commonEventProperties,
    ],
    tabs: [
      { id: 'basic', label: '基础', propertyKeys: alertProperties.map(p => p.key) },
      { id: 'layout', label: '布局', propertyKeys: commonLayoutProperties.map(p => p.key) },
      { id: 'style', label: '样式', propertyKeys: commonStyleProperties.map(p => p.key) },
      { id: 'events', label: '事件', propertyKeys: commonEventProperties.map(p => p.key) },
    ],
  },
};

// 获取组件属性配置
export function getComponentSchema(componentType: string): ComponentPropertySchema | undefined {
  return componentPropertySchemas[componentType];
}

// 获取所有支持的组件类型
export function getSupportedComponentTypes(): string[] {
  return Object.keys(componentPropertySchemas);
}

// 检查组件类型是否支持动态属性
export function isComponentSupported(componentType: string): boolean {
  return componentType in componentPropertySchemas;
}
