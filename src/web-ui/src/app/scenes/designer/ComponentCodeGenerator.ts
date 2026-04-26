/**
 * 组件代码生成器
 * 根据组件类型和属性生成对应的 ImGui 代码
 */

import { DesignerElement } from './DesignerPropertiesPanel';
import { componentRegistry } from './registry/ComponentRegistry';

const EVENT_CHINESE_NAMES: Record<string, string> = {
  onClick: '被单击',
  onDoubleClick: '被双击',
  onMouseEnter: '鼠标进入',
  onMouseLeave: '鼠标离开',
  onFocus: '获得焦点',
  onBlur: '失去焦点',
  onChange: '值变化',
  onKeyDown: '按键按下',
  onKeyUp: '按键释放',
  onLoad: '加载',
  onUnload: '卸载',
};

export interface CodeGenerationContext {
  indent: number;
  statePrefix: string;
}

function getIndent(indent: number): string {
  return '  '.repeat(indent);
}

function sanitizeNimName(name: string): string {
  // 只替换空格和特殊符号为下划线，保留中文、字母、数字
  let sanitized = name.replace(/[\s\-\.\,\!\@\#\$\%\^\&\*\(\)\+\=\[\]\{\}\|\;\'\:\"\,\.\/\<\>\?]/g, '_');
  // 移除连续的下划线
  sanitized = sanitized.replace(/_+/g, '_');
  // 移除开头和结尾的下划线
  sanitized = sanitized.replace(/^_+|_+$/g, '');
  // 确保不以数字开头（Nim 变量名规则）
  if (/^[0-9]/.test(sanitized)) {
    sanitized = 'n' + sanitized;
  }
  // 如果为空，使用默认名称
  if (!sanitized) {
    sanitized = 'unnamed';
  }
  return sanitized;
}

// 生成按钮组件代码
export function generateButtonCode(el: DesignerElement, ctx: CodeGenerationContext): string {
  const indentStr = getIndent(ctx.indent);
  const props = el.props || {};

  const text = (props.text as string) || el.name || '按钮';
  const disabled = props.disabled as boolean;
  const loading = props.loading as boolean;
  const block = props.block as boolean;
  const size = (props.size as string) || 'medium';
  const btnType = (props.type as string) || 'default';
  const variant = (props.variant as string) || 'solid';
  const shape = (props.shape as string) || 'default';
  const icon = (props.icon as string) || '';
  const iconPosition = (props.iconPosition as string) || 'left';
  const href = (props.href as string) || '';
  const title = (el.title as string) || '';
  const x = el.x || 0;
  const y = el.y || 0;

  const sizeMap: Record<string, { width: number; height: number; fontSize: number; padding: number }> = {
    small: { width: 80, height: 28, fontSize: 12, padding: 8 },
    medium: { width: 100, height: 36, fontSize: 14, padding: 12 },
    large: { width: 120, height: 44, fontSize: 16, padding: 16 },
  };
  const dims = sizeMap[size] || sizeMap.medium;

  let code = '';

  code += `${indentStr}igSetCursorPos(ImVec2(x: ${x}.0f, y: ${y}.0f))\n`;

  const colorMap: Record<string, { r: number; g: number; b: number }> = {
    primary: { r: 0.2, g: 0.6, b: 1.0 },
    success: { r: 0.2, g: 0.8, b: 0.2 },
    warning: { r: 1.0, g: 0.8, b: 0.2 },
    danger: { r: 1.0, g: 0.2, b: 0.2 },
    info: { r: 0.2, g: 0.8, b: 1.0 },
  };

  if (btnType !== 'default' && btnType !== 'link' && btnType !== 'text') {
    const color = colorMap[btnType];
    if (color) {
      if (variant === 'solid') {
        code += `${indentStr}igPushStyleColor(ImGui_Col_Button.cint, ImVec4(x: ${color.r.toFixed(2)}f, y: ${color.g.toFixed(2)}f, z: ${color.b.toFixed(2)}f, w: 1.0f))\n`;
        code += `${indentStr}igPushStyleColor(ImGui_Col_ButtonHovered.cint, ImVec4(x: ${(color.r * 1.1).toFixed(2)}f, y: ${(color.g * 1.1).toFixed(2)}f, z: ${(color.b * 1.1).toFixed(2)}f, w: 1.0f))\n`;
        code += `${indentStr}igPushStyleColor(ImGui_Col_ButtonActive.cint, ImVec4(x: ${(color.r * 0.9).toFixed(2)}f, y: ${(color.g * 0.9).toFixed(2)}f, z: ${(color.b * 0.9).toFixed(2)}f, w: 1.0f))\n`;
      } else if (variant === 'outline' || variant === 'ghost') {
        code += `${indentStr}igPushStyleColor(ImGui_Col_Button.cint, ImVec4(x: ${color.r.toFixed(2)}f, y: ${color.g.toFixed(2)}f, z: ${color.b.toFixed(2)}f, w: 0.0f))\n`;
        code += `${indentStr}igPushStyleColor(ImGui_Col_ButtonHovered.cint, ImVec4(x: ${color.r.toFixed(2)}f, y: ${color.g.toFixed(2)}f, z: ${color.b.toFixed(2)}f, w: 0.1f))\n`;
        code += `${indentStr}igPushStyleColor(ImGui_Col_ButtonActive.cint, ImVec4(x: ${color.r.toFixed(2)}f, y: ${color.g.toFixed(2)}f, z: ${color.b.toFixed(2)}f, w: 0.2f))\n`;
        code += `${indentStr}igPushStyleColor(ImGui_Col_Text.cint, ImVec4(x: ${color.r.toFixed(2)}f, y: ${color.g.toFixed(2)}f, z: ${color.b.toFixed(2)}f, w: 1.0f))\n`;
      }
    }
  }

  let borderRadius = 4.0;
  if (shape === 'round') {
    borderRadius = dims.height / 2;
  } else if (shape === 'circle') {
    borderRadius = dims.height / 2;
  }
  code += `${indentStr}igPushStyleVar_Float(ImGui_StyleVar_FrameRounding.cint, ${borderRadius.toFixed(1)}f)\n`;

  if (disabled || loading) {
    code += `${indentStr}igBeginDisabled(true)\n`;
  }

  let width = block ? -1 : (el.width || dims.width);
  const height = el.height || dims.height;

  if (shape === 'circle') {
    width = height;
  }

  let displayText = text;
  if (loading) {
    displayText = '... ' + text;
  }
  if (icon) {
    displayText = iconPosition === 'left' ? `${icon} ${displayText}` : `${displayText} ${icon}`;
  }

  if (btnType === 'link' || btnType === 'text') {
    code += `${indentStr}if igSmallButton("${displayText}##${el.id}"):\n`;
  } else {
    code += `${indentStr}if igButton("${displayText}##${el.id}", ImVec2(x: ${width}.0f, y: ${height}.0f)):\n`;
  }

  if (el.events?.onClick && el.events.onClick.trim()) {
    const elementName = el.name || el.id;
    const chineseEventName = EVENT_CHINESE_NAMES['onClick'] || '被单击';
    const callbackName = `${elementName}_${chineseEventName}`;
    code += `${indentStr}  if callbacks.${callbackName} != nil:\n`;
    code += `${indentStr}    callbacks.${callbackName}()\n`;
  } else if (href) {
    code += `${indentStr}  echo "Navigate to: ${href}"\n`;
  } else {
    code += `${indentStr}  echo "Button clicked: ${text}"\n`;
  }

  if (title) {
    code += `${indentStr}if igIsItemHovered(0.ImGuiHoveredFlags):\n`;
    code += `${indentStr}  igSetTooltip("${title}")\n`;
  }

  if (disabled || loading) {
    code += `${indentStr}igEndDisabled()\n`;
  }

  code += `${indentStr}igPopStyleVar(1)\n`;

  if (btnType !== 'default' && btnType !== 'link' && btnType !== 'text') {
    const popCount = variant === 'outline' || variant === 'ghost' ? 4 : 3;
    code += `${indentStr}igPopStyleColor(${popCount})\n`;
  }

  return code;
}

// 生成输入框组件代码
export function generateInputCode(el: DesignerElement, ctx: CodeGenerationContext): string {
  const indentStr = getIndent(ctx.indent);
  const props = el.props || {};

  const disabled = props.disabled as boolean;
  const readOnly = props.readOnly as boolean;
  const maxLength = (props.maxLength as number) || 256;
  const size = (props.size as string) || 'medium';
  const defaultValue = (props.value as string) || '';
  const nimName = sanitizeNimName(el.name);
  const x = el.x || 0;
  const y = el.y || 0;

  // 尺寸映射
  const sizeMap: Record<string, { width: number; height: number }> = {
    small: { width: el.width || 120, height: el.height || 24 },
    medium: { width: el.width || 200, height: el.height || 32 },
    large: { width: el.width || 280, height: el.height || 40 },
  };
  const dims = sizeMap[size] || sizeMap.medium;

  let code = '';

  // 设置位置
  code += `${indentStr}igSetCursorPos(ImVec2(x: ${x}.0f, y: ${y}.0f))\n`;

  // 禁用/只读状态
  if (disabled) {
    code += `${indentStr}igBeginDisabled(true)\n`;
  }

  // 设置输入框尺寸
  code += `${indentStr}igPushItemWidth(${dims.width}.0f)\n`;

  // 输入框
  const flags = readOnly ? 'ImGui_InputTextFlags_ReadOnly' : '0';

  // 如果有默认值，在初始化时设置
  if (defaultValue) {
    code += `${indentStr}if state.${nimName}_text.len == 0:\n`;
    code += `${indentStr}  state.${nimName}_text = "${defaultValue}"\n`;
  }

  code += `${indentStr}var ${nimName}_buf = state.${nimName}_text\n`;
  code += `${indentStr}${nimName}_buf.setLen(${maxLength})\n`;
  code += `${indentStr}if igInputText("##${el.id}", ${nimName}_buf[0].addr, ${maxLength}, ${flags}, nil, nil):\n`;
  code += `${indentStr}  state.${nimName}_text = $${nimName}_buf\n`;

  code += `${indentStr}igPopItemWidth()\n`;

  // 结束禁用状态
  if (disabled) {
    code += `${indentStr}igEndDisabled()\n`;
  }

  return code;
}

// 生成文本组件代码
export function generateTextCode(el: DesignerElement, ctx: CodeGenerationContext): string {
  const indentStr = getIndent(ctx.indent);
  const props = el.props || {};

  const text = (props.text as string) || el.name || 'Text';
  const ellipsis = props.ellipsis as boolean;
  const x = el.x || 0;
  const y = el.y || 0;

  let code = '';

  // 设置位置
  code += `${indentStr}igSetCursorPos(ImVec2(x: ${x}.0f, y: ${y}.0f))\n`;

  if (ellipsis) {
    code += `${indentStr}igTextWrapped("${text}")\n`;
  } else {
    code += `${indentStr}igText("${text}")\n`;
  }

  return code;
}

// 生成复选框组件代码
export function generateCheckboxCode(el: DesignerElement, ctx: CodeGenerationContext): string {
  const indentStr = getIndent(ctx.indent);
  const props = el.props || {};

  const label = (props.label as string) || el.name || 'Checkbox';
  const disabled = props.disabled as boolean;
  const checked = props.checked as boolean;
  const nimName = sanitizeNimName(el.name);
  const x = el.x || 0;
  const y = el.y || 0;

  let code = '';

  // 设置位置
  code += `${indentStr}igSetCursorPos(ImVec2(x: ${x}.0f, y: ${y}.0f))\n`;

  // 设置默认值
  if (checked) {
    code += `${indentStr}state.${nimName}_checked = true\n`;
  }

  if (disabled) {
    code += `${indentStr}igBeginDisabled(true)\n`;
  }

  code += `${indentStr}discard igCheckbox("${label}##${el.id}", state.${nimName}_checked.addr)\n`;

  if (disabled) {
    code += `${indentStr}igEndDisabled()\n`;
  }

  return code;
}

// 生成单选框组件代码
export function generateRadioCode(el: DesignerElement, ctx: CodeGenerationContext): string {
  const indentStr = getIndent(ctx.indent);
  const props = el.props || {};

  const label = (props.label as string) || el.name || 'Radio';
  const x = el.x || 0;
  const y = el.y || 0;
  const disabled = props.disabled as boolean;
  const checked = props.checked as boolean;
  const nimName = sanitizeNimName(el.name);

  let code = '';

  // 设置位置
  code += `${indentStr}igSetCursorPos(ImVec2(x: ${x}.0f, y: ${y}.0f))\n`;

  // 设置默认值
  if (checked) {
    code += `${indentStr}state.${nimName}_checked = true\n`;
  }

  if (disabled) {
    code += `${indentStr}igBeginDisabled(true)\n`;
  }

  code += `${indentStr}discard igRadioButton_Bool("${label}##${el.id}", state.${nimName}_checked)\n`;

  if (disabled) {
    code += `${indentStr}igEndDisabled()\n`;
  }

  return code;
}

// 生成滑块组件代码
export function generateSliderCode(el: DesignerElement, ctx: CodeGenerationContext): string {
  const indentStr = getIndent(ctx.indent);
  const props = el.props || {};

  const min = (props.min as number) || 0;
  const max = (props.max as number) || 100;
  const step = (props.step as number) || 1;
  const defaultValue = (props.value as number) ?? min;
  const vertical = props.vertical as boolean;
  const disabled = props.disabled as boolean;
  const nimName = sanitizeNimName(el.name);
  const x = el.x || 0;
  const y = el.y || 0;

  let code = '';

  // 设置当前值（使用初始化标志确保只设置一次）
  code += `${indentStr}if not state.${nimName}_initialized:\n`
  code += `${indentStr}  state.${nimName}_value = ${defaultValue}.0f\n`
  code += `${indentStr}  state.${nimName}_initialized = true\n`

  // 禁用状态
  if (disabled) {
    code += `${indentStr}igBeginDisabled(true)\n`;
  }

  // 设置位置
  code += `${indentStr}igSetCursorPos(ImVec2(x: ${x}.0f, y: ${y}.0f))\n`;

  // 滑块（不显示标签名，只显示值）
  if (vertical) {
    code += `${indentStr}discard igVSliderFloat("##${el.id}", ImVec2(x: ${el.width || 20}.0f, y: ${el.height || 100}.0f), state.${nimName}_value.addr, ${min}.0f, ${max}.0f, "%.${step < 1 ? '2' : '0'}f", 0)\n`;
  } else {
    code += `${indentStr}igPushItemWidth(${el.width || 200}.0f)\n`;
    code += `${indentStr}discard igSliderFloat("##${el.id}", state.${nimName}_value.addr, ${min}.0f, ${max}.0f, "%.${step < 1 ? '2' : '0'}f", 0)\n`;
    code += `${indentStr}igPopItemWidth()\n`;
  }

  // 结束禁用状态
  if (disabled) {
    code += `${indentStr}igEndDisabled()\n`;
  }

  return code;
}

// 生成进度条组件代码
export function generateProgressCode(el: DesignerElement, ctx: CodeGenerationContext): string {
  const indentStr = getIndent(ctx.indent);
  const props = el.props || {};

  const value = (props.value as number) || 0;
  const status = (props.status as string) || 'normal';
  const x = el.x || 0;
  const y = el.y || 0;

  let code = '';

  // 设置位置
  code += `${indentStr}igSetCursorPos(ImVec2(x: ${x}.0f, y: ${y}.0f))\n`;

  // 根据状态设置颜色
  const colorMap: Record<string, { r: number; g: number; b: number }> = {
    normal: { r: 0.2, g: 0.6, b: 1.0 },
    success: { r: 0.2, g: 0.8, b: 0.2 },
    warning: { r: 1.0, g: 0.8, b: 0.2 },
    exception: { r: 1.0, g: 0.2, b: 0.2 },
    active: { r: 0.2, g: 0.6, b: 1.0 },
  };

  const color = colorMap[status] || colorMap.normal;
  code += `${indentStr}igPushStyleColor(ImGui_Col_PlotHistogram.cint, ImVec4(x: ${color.r.toFixed(2)}f, y: ${color.g.toFixed(2)}f, z: ${color.b.toFixed(2)}f, w: 1.0f))\n`;

  // 进度条（不显示标签名）
  const progressValue = value / 100.0;
  const barHeight = el.height || 16;
  code += `${indentStr}igProgressBar(${progressValue.toFixed(2)}f, ImVec2(x: ${el.width || 200}.0f, y: ${barHeight}.0f), "##${el.id}")\n`;

  code += `${indentStr}igPopStyleColor(1)\n`;

  return code;
}

// 生成提示框组件代码
export function generateAlertCode(el: DesignerElement, ctx: CodeGenerationContext): string {
  const indentStr = getIndent(ctx.indent);
  const props = el.props || {};

  const text = (props.text as string) || '提示信息';
  const type = (props.type as string) || 'info';
  const x = el.x || 0;
  const y = el.y || 0;

  let code = '';

  // 设置位置
  code += `${indentStr}igSetCursorPos(ImVec2(x: ${x}.0f, y: ${y}.0f))\n`;

  // 根据类型设置颜色
  const colorMap: Record<string, { r: number; g: number; b: number; bg: number }> = {
    info: { r: 0.2, g: 0.6, b: 1.0, bg: 0.1 },
    success: { r: 0.2, g: 0.8, b: 0.2, bg: 0.1 },
    warning: { r: 1.0, g: 0.8, b: 0.2, bg: 0.1 },
    error: { r: 1.0, g: 0.2, b: 0.2, bg: 0.1 },
  };
  
  const color = colorMap[type] || colorMap.info;

  code += `${indentStr}igPushStyleColor(ImGui_Col_ChildBg.cint, ImVec4(x: ${color.r.toFixed(2)}f, y: ${color.g.toFixed(2)}f, z: ${color.b.toFixed(2)}f, w: ${color.bg.toFixed(2)}f))\n`;
  code += `${indentStr}igPushStyleColor(ImGui_Col_Text.cint, ImVec4(x: ${color.r.toFixed(2)}f, y: ${color.g.toFixed(2)}f, z: ${color.b.toFixed(2)}f, w: 1.0f))\n`;
  code += `${indentStr}igBeginChild_Str("alert_${el.id}", ImVec2(x: ${el.width || 300}.0f, y: ${el.height || 40}.0f), true, 0)\n`;
  code += `${indentStr}  igText("${text}")\n`;
  code += `${indentStr}igEndChild()\n`;
  code += `${indentStr}igPopStyleColor(2)\n`;
  
  return code;
}

// 生成图片组件代码
export function generateImageCode(el: DesignerElement, ctx: CodeGenerationContext): string {
  const indentStr = getIndent(ctx.indent);
  const props = el.props || {};

  const src = (props.src as string) || '';
  const alt = (props.alt as string) || '';
  const x = el.x || 0;
  const y = el.y || 0;

  let code = '';

  // 设置位置
  code += `${indentStr}igSetCursorPos(ImVec2(x: ${x}.0f, y: ${y}.0f))\n`;

  if (src) {
    // 使用 Image 控件显示图片
    const nimName = sanitizeNimName(el.name);
    code += `${indentStr}# Load and display image: ${src}\n`;
    code += `${indentStr}if state.${nimName}_texture != 0:\n`;
    code += `${indentStr}  igImage(cast[ImTextureID](state.${nimName}_texture), ImVec2(x: ${el.width || 200}.0f, y: ${el.height || 150}.0f))\n`;
  } else {
    // 占位符
    code += `${indentStr}igBeginChild_Str("img_placeholder_${el.id}", ImVec2(x: ${el.width || 200}.0f, y: ${el.height || 150}.0f), true, 0)\n`;
    code += `${indentStr}  igText("[图片]${alt ? '\\n' + alt : ''}")\n`;
    code += `${indentStr}igEndChild()\n`;
  }

  return code;
}

// 生成开关组件代码
export function generateToggleCode(el: DesignerElement, ctx: CodeGenerationContext): string {
  const indentStr = getIndent(ctx.indent);
  const props = el.props || {};

  const disabled = props.disabled as boolean;
  const checked = props.checked as boolean;
  const checkedChildren = (props.checkedChildren as string) || '';
  const unCheckedChildren = (props.unCheckedChildren as string) || '';
  const nimName = sanitizeNimName(el.name);
  const x = el.x || 0;
  const y = el.y || 0;

  let code = '';

  // 设置位置
  code += `${indentStr}igSetCursorPos(ImVec2(x: ${x}.0f, y: ${y}.0f))\n`;

  // 设置默认值
  if (checked) {
    code += `${indentStr}state.${nimName}_checked = true\n`;
  }

  if (disabled) {
    code += `${indentStr}igBeginDisabled(true)\n`;
  }

  // 使用 Checkbox 作为 Toggle
  const label = checkedChildren || unCheckedChildren || el.name || 'Toggle';
  code += `${indentStr}discard igCheckbox("${label}##${el.id}", state.${nimName}_checked.addr)\n`;

  if (disabled) {
    code += `${indentStr}igEndDisabled()\n`;
  }

  return code;
}

// 生成默认组件代码（通用）
export function generateDefaultCode(el: DesignerElement, ctx: CodeGenerationContext): string {
  const indentStr = getIndent(ctx.indent);
  return `${indentStr}igText("[${el.type}] ${el.name}")\n`;
}

// 主生成函数
export function generateComponentCode(el: DesignerElement, ctx: CodeGenerationContext): string {
  switch (el.type) {
    case 'button':
      return generateButtonCode(el, ctx);
    case 'input':
      return generateInputCode(el, ctx);
    case 'text':
      return generateTextCode(el, ctx);
    case 'checkbox':
      return generateCheckboxCode(el, ctx);
    case 'radio':
      return generateRadioCode(el, ctx);
    case 'slider':
      return generateSliderCode(el, ctx);
    case 'progress':
      return generateProgressCode(el, ctx);
    case 'alert':
      return generateAlertCode(el, ctx);
    case 'image':
      return generateImageCode(el, ctx);
    case 'toggle':
      return generateToggleCode(el, ctx);
    default:
      const definition = componentRegistry.get(el.type);
      if (definition) {
        return generateCustomComponentCode(el, ctx, definition);
      }
      return generateDefaultCode(el, ctx);
  }
}

function generateCustomComponentCode(
  el: DesignerElement,
  ctx: CodeGenerationContext,
  definition: { baseComponent?: string; codeTemplate?: string }
): string {
  const indentStr = getIndent(ctx.indent);
  
  if (definition.codeTemplate) {
    return processCodeTemplate(el, ctx, definition.codeTemplate);
  }
  
  if (definition.baseComponent) {
    switch (definition.baseComponent) {
      case 'button':
        return generateButtonCode(el, ctx);
      case 'input':
        return generateInputCode(el, ctx);
      case 'text':
        return generateTextCode(el, ctx);
      case 'checkbox':
        return generateCheckboxCode(el, ctx);
      case 'radio':
        return generateRadioCode(el, ctx);
      case 'slider':
        return generateSliderCode(el, ctx);
      case 'progress':
        return generateProgressCode(el, ctx);
      case 'alert':
        return generateAlertCode(el, ctx);
      case 'image':
        return generateImageCode(el, ctx);
      case 'toggle':
        return generateToggleCode(el, ctx);
      default:
        return generateDefaultCode(el, ctx);
    }
  }
  
  return `${indentStr}igText("[自定义组件] ${el.name || el.id}")\n`;
}

function processCodeTemplate(
  el: DesignerElement,
  ctx: CodeGenerationContext,
  template: string
): string {
  const indentStr = getIndent(ctx.indent);
  const props = el.props || {};
  
  let code = template;
  
  code = code.replace(/\{\{id\}\}/g, el.id);
  code = code.replace(/\{\{name\}\}/g, el.name || el.id);
  code = code.replace(/\{\{x\}\}/g, String(el.x || 0));
  code = code.replace(/\{\{y\}\}/g, String(el.y || 0));
  code = code.replace(/\{\{width\}\}/g, String(el.width || 100));
  code = code.replace(/\{\{height\}\}/g, String(el.height || 36));
  code = code.replace(/\{\{statePrefix\}\}/g, ctx.statePrefix);
  
  code = code.replace(/\{\{props\.(\w+)\}\}/g, (_, key) => {
    const value = props[key];
    if (value === undefined) return '';
    if (typeof value === 'string') return value;
    return String(value);
  });
  
  const lines = code.split('\n');
  return lines.map(line => indentStr + line).join('\n') + '\n';
}
