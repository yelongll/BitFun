import { DesignerElement, ElementStyles, ElementEvents } from './DesignerScene';
import { generateComponentCode, CodeGenerationContext } from './ComponentCodeGenerator';

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

const EVENT_LABELS: Record<string, string> = {
  onClick: '单击事件',
  onDoubleClick: '双击事件',
  onMouseEnter: '鼠标进入',
  onMouseLeave: '鼠标离开',
  onFocus: '获得焦点',
  onBlur: '失去焦点',
  onChange: '值改变',
  onKeyDown: '按键按下',
  onKeyUp: '按键释放',
  onLoad: '加载事件',
  onUnload: '卸载事件',
};

export interface NimCodeGeneratorOptions {
  appName: string;
  windowWidth: number;
  windowHeight: number;
  elements: DesignerElement[];
  imguiWindowProps?: ImGuiWindowProps;
  backgroundColor?: string;
  windowIcon?: string;
  windowName?: string; // 窗口名称，用于生成文件名
  isMainWindow?: boolean; // 是否为主窗口
}

export interface GeneratedWindowCode {
  ui: string;
  logic: string;
}

export interface GeneratedProjectCode {
  main: string;
  windows: GeneratedWindowCode;
  config: string;
}

interface ImGuiWindowProps {
  // Window Flags
  noTitleBar?: boolean;
  noResize?: boolean;
  noMove?: boolean;
  noScrollbar?: boolean;
  noScrollWithMouse?: boolean;
  noCollapse?: boolean;
  alwaysAutoResize?: boolean;
  noBackground?: boolean;
  noSavedSettings?: boolean;
  noMouseInputs?: boolean;
  menuBar?: boolean;
  horizontalScrollbar?: boolean;
  noFocusOnAppearing?: boolean;
  noBringToFrontOnFocus?: boolean;
  alwaysVerticalScrollbar?: boolean;
  alwaysHorizontalScrollbar?: boolean;
  noNavInputs?: boolean;
  noNavFocus?: boolean;
  noNav?: boolean;
  noInputs?: boolean;
  unsavedDocument?: boolean;
  noDocking?: boolean;
  // Window Properties
  posX?: number;
  posY?: number;
  posCond?: 'always' | 'once' | 'firstUseEver' | 'appearing';
  pivotX?: number;
  pivotY?: number;
  sizeWidth?: number;
  sizeHeight?: number;
  sizeCond?: 'always' | 'once' | 'firstUseEver' | 'appearing';
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  contentWidth?: number;
  contentHeight?: number;
  collapsed?: boolean;
  collapsedCond?: 'always' | 'once' | 'firstUseEver' | 'appearing';
  bgAlpha?: number;
  scrollX?: number;
  scrollY?: number;
  dockId?: number;
  dockCond?: 'always' | 'once' | 'firstUseEver' | 'appearing';
  focus?: boolean;
}

function getImGuiCond(cond?: string): string {
  switch (cond) {
    case 'always': return 'ImGuiCond_Always.cint';
    case 'once': return 'ImGuiCond_Once.cint';
    case 'firstUseEver': return 'ImGuiCond_FirstUseEver.cint';
    case 'appearing': return 'ImGuiCond_Appearing.cint';
    default: return 'ImGuiCond_Always.cint';
  }
}

function generateWindowFlagsCode(props?: ImGuiWindowProps): string {
  if (!props) return '0';
  
  const flagList: string[] = [];
  
  if (props.noTitleBar) flagList.push('ImGuiWindowFlags_NoTitleBar.cint');
  if (props.noResize) flagList.push('ImGuiWindowFlags_NoResize.cint');
  if (props.noMove) flagList.push('ImGuiWindowFlags_NoMove.cint');
  if (props.noScrollbar) flagList.push('ImGuiWindowFlags_NoScrollbar.cint');
  if (props.noScrollWithMouse) flagList.push('ImGuiWindowFlags_NoScrollWithMouse.cint');
  if (props.noCollapse) flagList.push('ImGuiWindowFlags_NoCollapse.cint');
  if (props.alwaysAutoResize) flagList.push('ImGuiWindowFlags_AlwaysAutoResize.cint');
  if (props.noBackground) flagList.push('ImGuiWindowFlags_NoBackground.cint');
  if (props.noSavedSettings) flagList.push('ImGuiWindowFlags_NoSavedSettings.cint');
  if (props.noMouseInputs) flagList.push('ImGuiWindowFlags_NoMouseInputs.cint');
  if (props.menuBar) flagList.push('ImGuiWindowFlags_MenuBar.cint');
  if (props.horizontalScrollbar) flagList.push('ImGuiWindowFlags_HorizontalScrollbar.cint');
  if (props.noFocusOnAppearing) flagList.push('ImGuiWindowFlags_NoFocusOnAppearing.cint');
  if (props.noBringToFrontOnFocus) flagList.push('ImGuiWindowFlags_NoBringToFrontOnFocus.cint');
  if (props.alwaysVerticalScrollbar) flagList.push('ImGuiWindowFlags_AlwaysVerticalScrollbar.cint');
  if (props.alwaysHorizontalScrollbar) flagList.push('ImGuiWindowFlags_AlwaysHorizontalScrollbar.cint');
  if (props.noNavInputs) flagList.push('ImGuiWindowFlags_NoNavInputs.cint');
  if (props.noNavFocus) flagList.push('ImGuiWindowFlags_NoNavFocus.cint');
  if (props.noNav) flagList.push('ImGuiWindowFlags_NoNav.cint');
  if (props.noInputs) flagList.push('ImGuiWindowFlags_NoInputs.cint');
  if (props.unsavedDocument) flagList.push('ImGuiWindowFlags_UnsavedDocument.cint');
  if (props.noDocking) flagList.push('ImGuiWindowFlags_NoDocking.cint');
  
  return flagList.length > 0 ? flagList.join(' or ') : '0';
}

function generateBackgroundColorCode(color?: string): string {
  if (!color || color === '#ffffff' || color === '') return '';

  let r = 1.0, g = 1.0, b = 1.0, a = 1.0;

  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16) / 255;
      g = parseInt(hex.slice(2, 4), 16) / 255;
      b = parseInt(hex.slice(4, 6), 16) / 255;
    } else if (hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16) / 255;
      g = parseInt(hex.slice(2, 4), 16) / 255;
      b = parseInt(hex.slice(4, 6), 16) / 255;
      a = parseInt(hex.slice(6, 8), 16) / 255;
    }
  }

  return `  igPushStyleColor(ImGui_Col_WindowBg.cint, ImVec4(x: ${r.toFixed(3)}f, y: ${g.toFixed(3)}f, z: ${b.toFixed(3)}f, w: ${a.toFixed(3)}f))\n`;
}

function generateWindowPropertiesCode(props?: ImGuiWindowProps): string {
  if (!props) return '';

  let code = '';
  
  // Position
  if (props.posX !== undefined || props.posY !== undefined) {
    const x = props.posX ?? 0;
    const y = props.posY ?? 0;
    const cond = getImGuiCond(props.posCond);
    const pivotX = props.pivotX ?? 0;
    const pivotY = props.pivotY ?? 0;
    code += `  igSetNextWindowPos(ImVec2(x: ${x}.0f, y: ${y}.0f), ${cond}, ImVec2(x: ${pivotX}.0f, y: ${pivotY}.0f))\n`;
  }
  
  // Size
  if (props.sizeWidth !== undefined || props.sizeHeight !== undefined) {
    const w = props.sizeWidth ?? 800;
    const h = props.sizeHeight ?? 600;
    const cond = getImGuiCond(props.sizeCond);
    code += `  igSetNextWindowSize(ImVec2(x: ${w}.0f, y: ${h}.0f), ${cond})\n`;
  }
  
  // Size Constraints (only if has valid min/max values)
  if ((props.minWidth !== undefined && props.minWidth > 0) || 
      (props.minHeight !== undefined && props.minHeight > 0) || 
      (props.maxWidth !== undefined && props.maxWidth > 0) || 
      (props.maxHeight !== undefined && props.maxHeight > 0)) {
    const minW = props.minWidth ?? 0;
    const minH = props.minHeight ?? 0;
    const maxW = props.maxWidth ?? 10000;
    const maxH = props.maxHeight ?? 10000;
    code += `  igSetNextWindowSizeConstraints(ImVec2(x: ${minW}.0f, y: ${minH}.0f), ImVec2(x: ${maxW}.0f, y: ${maxH}.0f), nil, nil)\n`;
  }

  // Content Size (only if positive values)
  if ((props.contentWidth !== undefined && props.contentWidth > 0) || 
      (props.contentHeight !== undefined && props.contentHeight > 0)) {
    const cw = props.contentWidth ?? 0;
    const ch = props.contentHeight ?? 0;
    code += `  igSetNextWindowContentSize(ImVec2(x: ${cw}.0f, y: ${ch}.0f))\n`;
  }
  
  // Collapsed (only if explicitly enabled)
  if (props.collapsed === true) {
    const cond = getImGuiCond(props.collapsedCond);
    code += `  igSetNextWindowCollapsed(true, ${cond})\n`;
  }
  
  // Background Alpha (only if not default 1.0)
  if (props.bgAlpha !== undefined && props.bgAlpha >= 0 && props.bgAlpha < 1.0) {
    code += `  igSetNextWindowBgAlpha(${props.bgAlpha}f)\n`;
  }

  // Scroll (only if non-zero)
  if ((props.scrollX !== undefined && props.scrollX !== 0) || (props.scrollY !== undefined && props.scrollY !== 0)) {
    const sx = props.scrollX ?? 0;
    const sy = props.scrollY ?? 0;
    code += `  igSetNextWindowScroll(ImVec2(x: ${sx}.0f, y: ${sy}.0f))\n`;
  }

  // Dock ID (only if positive)
  if (props.dockId !== undefined && props.dockId > 0) {
    const cond = getImGuiCond(props.dockCond);
    code += `  igSetNextWindowDockID(${props.dockId}.ImGuiID, ${cond})\n`;
  }

  // Focus (only if true)
  if (props.focus === true) {
    code += `  igSetNextWindowFocus()\n`;
  }
  
  return code;
}

export interface GeneratedNimCode {
  main: string;
  ui: string;
  logic: string;
  config: string;
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

export function getModuleName(windowName: string): string {
  return sanitizeNimName(windowName);
}

function colorToNimArray(color: string | undefined): string {
  if (!color) return '[0.9f, 0.9f, 0.9f, 1.0f]';
  
  let r = 0.9, g = 0.9, b = 0.9, a = 1.0;
  
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16) / 255;
      g = parseInt(hex.slice(2, 4), 16) / 255;
      b = parseInt(hex.slice(4, 6), 16) / 255;
    } else if (hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16) / 255;
      g = parseInt(hex.slice(2, 4), 16) / 255;
      b = parseInt(hex.slice(4, 6), 16) / 255;
      a = parseInt(hex.slice(6, 8), 16) / 255;
    }
  } else if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      r = parseInt(match[1]) / 255;
      g = parseInt(match[2]) / 255;
      b = parseInt(match[3]) / 255;
      a = match[4] ? parseFloat(match[4]) : 1.0;
    }
  }
  
  return `[${r.toFixed(3)}f, ${g.toFixed(3)}f, ${b.toFixed(3)}f, ${a.toFixed(3)}f]`;
}

function getWidgetType(type: string): string {
  const typeMap: Record<string, string> = {
    'button': 'Button',
    'text': 'Text',
    'input': 'InputText',
    'checkbox': 'Checkbox',
    'slider': 'SliderFloat',
    'colorpicker': 'ColorEdit4',
    'combo': 'Combo',
    'image': 'Image',
    'container': 'ChildWindow',
    'navbar': 'MenuBar',
    'card': 'ChildWindow',
    'progress': 'ProgressBar',
    'toggle': 'Checkbox',
    'radio': 'RadioButton',
    'textarea': 'InputTextMultiline',
    'date': 'Datepicker',
    'time': 'Timepicker',
    'file': 'FilePicker',
    'table': 'Table',
    'chart': 'Plot',
    'divider': 'Separator',
    'spacer': 'Dummy',
    'icon': 'Image',
    'avatar': 'Image',
    'badge': 'Text',
    'tooltip': 'Tooltip',
    'dropdown': 'Combo',
    'list': 'ListBox',
    'tabs': 'TabBar',
    'tree': 'TreeNode',
    'menu': 'Menu',
    'dialog': 'Popup',
    'sidebar': 'ChildWindow',
    'footer': 'ChildWindow',
    'header': 'ChildWindow',
    'panel': 'ChildWindow',
  };
  return typeMap[type] || 'Button';
}

function collectEvents(elements: DesignerElement[]): Map<string, ElementEvents> {
  const events = new Map<string, ElementEvents>();
  
  function traverse(els: DesignerElement[]) {
    for (const el of els) {
      if (el.events) {
        const validEvents: ElementEvents = {};
        let hasValidEvents = false;
        
        for (const [key, value] of Object.entries(el.events)) {
          if (value && typeof value === 'string' && value.trim()) {
            validEvents[key as keyof ElementEvents] = value;
            hasValidEvents = true;
          }
        }
        
        if (hasValidEvents) {
          events.set(el.id, validEvents);
        }
      }
      if (el.children) {
        traverse(el.children);
      }
    }
  }
  
  traverse(elements);
  return events;
}

function collectStateVariables(elements: DesignerElement[]): { name: string; type: string; defaultValue: string }[] {
  const states: { name: string; type: string; defaultValue: string }[] = [];
  
  function traverse(els: DesignerElement[]) {
    for (const el of els) {
      const nimName = sanitizeNimName(el.name || el.id);
      
      switch (el.type) {
        case 'input':
        case 'textarea':
          states.push({
            name: `${nimName}_text`,
            type: 'string',
            defaultValue: `"${(el.props.text as string) || ''}"`
          });
          break;
        case 'checkbox':
        case 'radio':
        case 'toggle':
          states.push({
            name: `${nimName}_checked`,
            type: '逻辑型',
            defaultValue: String((el.props.checked as boolean) || false)
          });
          break;
        case 'slider':
          states.push({
            name: `${nimName}_value`,
            type: 'float32',
            defaultValue: `${(el.props.value as number) || 50}.0f`
          });
          states.push({
            name: `${nimName}_initialized`,
            type: '逻辑型',
            defaultValue: '假'
          });
          break;
        case 'colorpicker':
          states.push({
            name: `${nimName}_color`,
            type: 'array[4, float32]',
            defaultValue: colorToNimArray(el.props.color as string)
          });
          break;
        case 'combo':
        case 'dropdown':
          states.push({
            name: `${nimName}_index`,
            type: 'int32',
            defaultValue: String((el.props.selectedIndex as number) || 0)
          });
          break;
        case 'progress':
          states.push({
            name: `${nimName}_progress`,
            type: 'float32',
            defaultValue: `${(el.props.value as number) || 0}.0f`
          });
          break;
      }
      
      if (el.children) {
        traverse(el.children);
      }
    }
  }
  
  traverse(elements);
  return states;
}

function generateLogicCode(options: NimCodeGeneratorOptions): string {
  const { appName, elements, windowName } = options;
  const events = collectEvents(elements);
  const states = collectStateVariables(elements);
  const moduleName = sanitizeNimName(windowName || appName);
  
   let code = `导入 界面_${moduleName}\n\n`;
  
  if (states.length > 0) {
    code += `# ========== 全局变量（用户状态） ==========\n`;
    code += `变量\n`;
    for (const state of states) {
      code += `  ${state.name}*: ${state.type} = ${state.defaultValue}\n`;
    }
    code += `\n`;
  }
  

  code += `过程 初始化*() =\n`;
  code += `  打印 "${appName} 初始化"\n\n`;
  code += `过程 更新*() =\n`;
  code += `  忽略\n\n`;
  code += `过程 关闭*() =\n`;
  code += `  打印 "${appName} 关闭"\n\n`;
  
  for (const [id, elementEvents] of events) {
    const element = findElementById(elements, id);
    if (!element) continue;
    
    const elementName = element.name || element.id;
    
    for (const [eventType, eventHandler] of Object.entries(elementEvents)) {
      if (!eventHandler) continue;
      
      const chineseEventName = EVENT_CHINESE_NAMES[eventType] || eventType.replace('on', '');
      const procName = `${elementName}_${chineseEventName}`;
      code += `过程 ${procName}*() =\n`;
      code += `  打印 "${elementName} ${EVENT_LABELS[eventType] || eventType}"\n\n`;
    }
  }
  
  return code;
}

function findElementById(elements: DesignerElement[], id: string): DesignerElement | null {
  for (const el of elements) {
    if (el.id === id) return el;
    if (el.children) {
      const found = findElementById(el.children, id);
      if (found) return found;
    }
  }
  return null;
}

function generateUICode(options: NimCodeGeneratorOptions): string {
  const { appName, elements, windowWidth, windowHeight, windowName } = options;
  const events = collectEvents(elements);
  const states = collectStateVariables(elements);
  const moduleName = sanitizeNimName(windowName || appName);
  
  let code = `# ========================================\n`;
  code += `# 空灵语言 UI 模块自动生成\n`;
  code += `# 请勿手动修改此文件\n`;
  code += `# 文件: 界面_${moduleName}.灵\n`;
  code += `# 生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
  code += `# ========================================\n\n`;
  
  code += `import nimgl/nimgl/[opengl, glfw]\n`;
  code += `import imguin/[cimgui, glfw_opengl, simple]\n`;
  if (options.windowIcon) {
    code += `import utils/opengl/loadImage\n`;
  }
  code += `export cimgui, simple\n\n`;
  
  code += `type\n`;
  code += `  ${moduleName}_State* = object\n`;
  for (const state of states) {
    code += `    ${state.name}*: ${state.type}\n`;
  }
  code += `\n`;
  
  code += `proc init${moduleName}*(): ${moduleName}_State =\n`;
  code += `  result = ${moduleName}_State(\n`;
  for (const state of states) {
    code += `    ${state.name}: ${state.defaultValue},\n`;
  }
  code += `  )\n\n`;
  
  code += `type\n`;
  code += `  WindowConfig* = object\n`;
  code += `    width*: int32\n`;
  code += `    height*: int32\n`;
  code += `    title*: string\n\n`;
  
  code += `proc initWindow*(config: WindowConfig): GLFWWindow =\n`;
  code += `  glfwWindowHint(GLFWContextVersionMajor, 3)\n`;
  code += `  glfwWindowHint(GLFWContextVersionMinor, 3)\n`;
  code += `  glfwWindowHint(GLFWOpenglForwardCompat, GLFW_TRUE)\n`;
  code += `  glfwWindowHint(GLFWOpenglProfile, GLFW_OPENGL_CORE_PROFILE)\n\n`;
  code += `  result = glfwCreateWindow(config.width, config.height, config.title)\n`;
  if (options.windowIcon) {
    // Escape backslashes for Nim string literal
    const escapedIconPath = options.windowIcon.replace(/\\/g, '\\\\');
    code += `\n  # Set window icon\n`;
    code += `  LoadTileBarIcon(cast[GLFWwindow](result), r"${escapedIconPath}")\n`;
    code += `\n`;
  }
  code += `  result.makeContextCurrent()\n`;
  code += `  glfwSwapInterval(1)\n`;
  code += `  doAssert glInit()\n\n`;
  
  code += `proc initImGui*(window: GLFWWindow) =\n`;
  code += `  discard igCreateContext(nil)\n`;
  code += `  let pio = igGetIO()\n`;
  code += `  discard ImGui_ImplGlfw_InitForOpenGL(cast[ptr GLFWwindow](window), true)\n`;
  code += `  discard ImGui_ImplOpenGL3_Init("#version 330")\n`;
  code += `  igStyleColorsLight(nil)\n\n`;
  
  code += `proc newFrame*() =\n`;
  code += `  ImGui_ImplOpenGL3_NewFrame()\n`;
  code += `  ImGui_ImplGlfw_NewFrame()\n`;
  code += `  igNewFrameAuto()\n\n`;
  
  code += `proc render*(window: GLFWWindow) =\n`;
  code += `  igRender()\n`;
  code += `  glClearColor(0.95f, 0.95f, 0.95f, 1.0f)\n`;
  code += `  glClear(GL_COLOR_BUFFER_BIT)\n`;
  code += `  ImGui_ImplOpenGL3_RenderDrawData(igGetDrawData())\n`;
  code += `  window.swapBuffers()\n\n`;
  
  code += `proc shutdown*(window: GLFWWindow) =\n`;
  code += `  ImGui_ImplOpenGL3_Shutdown()\n`;
  code += `  ImGui_ImplGlfw_Shutdown()\n`;
  code += `  igDestroyContext(igGetCurrentContext())\n`;
  code += `  window.destroyWindow()\n`;
  code += `  glfwTerminate()\n\n`;
  
  if (events.size > 0) {
    code += `type\n`;
    code += `  ${moduleName}_Callbacks* = object\n`;
    for (const [id, elementEvents] of events) {
      const element = findElementById(elements, id);
      if (!element) continue;
      const elementName = element.name || element.id;
      for (const eventType of Object.keys(elementEvents)) {
        if (!elementEvents[eventType as keyof ElementEvents]) continue;
        const chineseEventName = EVENT_CHINESE_NAMES[eventType] || eventType.replace('on', '');
        code += `    ${elementName}_${chineseEventName}*: proc()\n`;
      }
    }
    code += `\n`;
  }
  
  const windowFlagsCode = generateWindowFlagsCode(options.imguiWindowProps);
  const windowPropertiesCode = generateWindowPropertiesCode(options.imguiWindowProps);
  const backgroundColorCode = generateBackgroundColorCode(options.backgroundColor);

  code += `proc render${moduleName}Panel*(state: var ${moduleName}_State`;
  if (events.size > 0) {
    code += `, callbacks: ${moduleName}_Callbacks`;
  }
  code += `, windowSize: ImVec2) =\n`;
  code += `  # Main window content - no nested window\n`;
  code += windowPropertiesCode;
  // Only set position and size if not already set in windowPropertiesCode
  if (!options.imguiWindowProps?.posX && !options.imguiWindowProps?.posY) {
    code += `  igSetNextWindowPos(ImVec2(x: 0.0f, y: 0.0f), ImGuiCond_Always.cint, ImVec2(x: 0.0f, y: 0.0f))\n`;
  }
  if (!options.imguiWindowProps?.sizeWidth && !options.imguiWindowProps?.sizeHeight) {
    code += `  igSetNextWindowSize(windowSize, ImGuiCond_Always.cint)\n`;
  }
  code += backgroundColorCode;
  code += `  igBegin("${appName}", nil, ${windowFlagsCode})\n\n`;

  code += generateWidgetCode(elements, 1);

  code += `  igEnd()\n`;
  if (backgroundColorCode) {
    code += `  igPopStyleColor(1)\n`;
  }
  code += `\n`;

  return code;
}

function generateWidgetCodeWithOffset(elements: DesignerElement[], indent: number, offsetX: number, offsetY: number): string {
  let code = '';
  const indentStr = '  '.repeat(indent);
  
  for (const el of elements) {
    if (el.hidden) continue;
    
    const nimName = sanitizeNimName(el.name || el.id);
    const x = (el.x || 0) + offsetX;
    const y = (el.y || 0) + offsetY;
    const width = el.width || 100;
    const height = el.height || 30;

    // Set cursor position for absolute positioning
    code += `${indentStr}igSetCursorPos(ImVec2(x: ${x}.0f, y: ${y}.0f))\n`;

    // 使用新的组件代码生成器
    const ctx: CodeGenerationContext = {
      indent,
      statePrefix: 'state',
    };
    code += generateComponentCode(el, ctx);

    code += `\n`;
  }
  
  return code;
}

function generateWidgetCode(elements: DesignerElement[], indent: number): string {
  // Call the offset version with zero offset
  return generateWidgetCodeWithOffset(elements, indent, 0, 0);
}

function generateMainCode(options: NimCodeGeneratorOptions): string {
  const { appName, windowWidth, windowHeight, elements, windowName, isMainWindow } = options;
  const events = collectEvents(elements);
  const moduleName = sanitizeNimName(windowName || appName);
  
  let code = `# ========================================\n`;
  code += `# 空灵语言 UI 模块自动生成\n`;
  code += `# 请勿手动修改此文件\n`;
  code += `# 文件: 主入口.灵\n`;
  code += `# 生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
  code += `# ========================================\n\n`;
  
  code += `import nimgl/nimgl/glfw\n`;
  code += `import 界面_${moduleName}, 交互_${moduleName}\n\n`;
  
  code += `proc main() =\n`;
  code += `  doAssert glfwInit()\n\n`;
  code += `  let window = initWindow(WindowConfig(width: ${windowWidth}, height: ${windowHeight}, title: "${appName}"))\n`;
  code += `  initImGui(window)\n\n`;
  code += `  var state = init${moduleName}()\n`;
  code += `  交互_${moduleName}.初始化()\n\n`;
  
  if (events.size > 0) {
    code += `  let callbacks = ${moduleName}_Callbacks(\n`;
    let first = true;
    for (const [id, elementEvents] of events) {
      const element = findElementById(options.elements, id);
      if (!element) continue;
      const elementName = element.name || element.id;
      for (const eventType of Object.keys(elementEvents)) {
        if (!elementEvents[eventType as keyof ElementEvents]) continue;
        const chineseEventName = EVENT_CHINESE_NAMES[eventType] || eventType.replace('on', '');
        if (!first) code += `,\n`;
        code += `    ${elementName}_${chineseEventName}: 交互_${moduleName}.${elementName}_${chineseEventName}`;
        first = false;
      }
    }
    code += `\n  )\n\n`;
  }
  
  code += `  var windowSize = ImVec2(x: ${windowWidth}.0f, y: ${windowHeight}.0f)\n\n`;
  code += `  while not window.windowShouldClose:\n`;
  code += `    glfwPollEvents()\n`;
  code += `    # Update window size to match GLFW window\n`;
  code += `    var w, h: int32\n`;
  code += `    getWindowSize(window, w.addr, h.addr)\n`;
  code += `    windowSize = ImVec2(x: w.float32, y: h.float32)\n\n`;
  code += `    newFrame()\n\n`;
  code += `    交互_${moduleName}.更新()\n\n`;

  if (events.size > 0) {
    code += `    render${moduleName}Panel(state, callbacks, windowSize)\n`;
  } else {
    code += `    render${moduleName}Panel(state, windowSize)\n`;
  }
  code += `\n`;
  code += `    render(window)\n\n`;
  code += `  交互_${moduleName}.关闭()\n`;
  code += `  shutdown(window)\n\n`;
  code += `when isMainModule:\n`;
  code += `  main()\n`;
  
  return code;
}

function generateConfigCode(options: NimCodeGeneratorOptions): string {
  let code = `# ========================================\n`;
  code += `# 空灵语言 UI 模块自动生成\n`;
  code += `# 请勿手动修改此文件\n`;
  code += `# 文件: kl.cfg\n`;
  code += `# 生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
  code += `# ========================================\n\n`;
  code += `define:glfwStaticLib\n\napp:gui\n`;
  return code;
}

export function generateNimCode(options: NimCodeGeneratorOptions): GeneratedNimCode {
  return {
    main: generateMainCode(options),
    ui: generateUICode(options),
    logic: generateLogicCode(options),
    config: generateConfigCode(options),
  };
}

export function generateWindowCode(options: NimCodeGeneratorOptions): GeneratedWindowCode {
  return {
    ui: generateUICode(options),
    logic: generateLogicCode(options),
  };
}
