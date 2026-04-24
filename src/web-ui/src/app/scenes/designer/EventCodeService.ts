import { DesignerElement, ElementEvents } from './DesignerScene';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { globalAPI } from '@/infrastructure/api/service-api/GlobalAPI';

export const EVENT_CHINESE_NAMES: Record<string, string> = {
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

export const EVENT_LABELS: Record<string, string> = {
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

export interface EventFunctionInfo {
  elementName: string;
  eventType: string;
  functionName: string;
  line?: number;
}

export interface GeneratedEventResult {
  success: boolean;
  functionName: string;
  line?: number;
  error?: string;
}

export interface JumpToEventOptions {
  filePath: string;
  functionName: string;
  line?: number;
}

export type JumpToCodeCallback = (options: JumpToEventOptions) => void;

class EventCodeService {
  private generatedEvents: Map<string, Set<string>> = new Map();
  private jumpToCodeCallback: JumpToCodeCallback | null = null;
  
  setJumpToCodeCallback(callback: JumpToCodeCallback): void {
    this.jumpToCodeCallback = callback;
  }
  
  generateEventFunctionName(elementName: string, eventType: string): string {
    const chineseEventName = EVENT_CHINESE_NAMES[eventType] || eventType.replace('on', '');
    return `${elementName}_${chineseEventName}`;
  }
  
  generateEventFunctionCode(elementName: string, eventType: string): string {
    const functionName = this.generateEventFunctionName(elementName, eventType);
    const eventLabel = EVENT_LABELS[eventType] || eventType;
    return `过程 ${functionName}*() =
  打印 "${elementName} ${eventLabel}"
`;
  }
  
  markEventAsGenerated(filePath: string, functionName: string): void {
    if (!this.generatedEvents.has(filePath)) {
      this.generatedEvents.set(filePath, new Set());
    }
    this.generatedEvents.get(filePath)!.add(functionName);
  }
  
  isEventGenerated(filePath: string, functionName: string): boolean {
    const fileEvents = this.generatedEvents.get(filePath);
    return fileEvents ? fileEvents.has(functionName) : false;
  }
  
  clearGeneratedEvents(filePath: string): void {
    this.generatedEvents.delete(filePath);
  }
  
  jumpToCode(options: JumpToEventOptions): void {
    if (this.jumpToCodeCallback) {
      this.jumpToCodeCallback(options);
    }
  }
  
  async generateEventInLogicFile(
    elementName: string,
    eventType: string,
    windowName: string
  ): Promise<GeneratedEventResult> {
    try {
      const workspacePath = await globalAPI.getCurrentWorkspacePath();
      if (!workspacePath) {
        return { success: false, functionName: '', error: '无法获取工作目录' };
      }

      const functionName = this.generateEventFunctionName(elementName, eventType);
      const logicFileName = `交互_${windowName}.灵`;
      const logicFilePath = `${workspacePath}/${logicFileName}`;

      let content = '';
      let isNewFile = false;
      
      try {
        const fileData = await readFile(logicFilePath);
        content = new TextDecoder().decode(fileData);
      } catch {
        isNewFile = true;
        content = `导入 界面_${windowName}

变量

过程 初始化*() =
  打印 "${windowName} 初始化"

过程 更新*() =
  忽略

过程 关闭*() =
  打印 "${windowName} 关闭"
`;
      }

      if (content.includes(`过程 ${functionName}`)) {
        const lines = content.split('\n');
        const lineIndex = lines.findIndex(line => line.includes(`过程 ${functionName}`));
        return { 
          success: true, 
          functionName, 
          line: lineIndex + 1 
        };
      }

      const eventCode = this.generateEventFunctionCode(elementName, eventType);
      const newContent = content + '\n' + eventCode;
      
      const encoder = new TextEncoder();
      await writeFile(logicFilePath, encoder.encode(newContent));

      const lines = newContent.split('\n');
      const lineIndex = lines.findIndex(line => line.includes(`过程 ${functionName}`));
      
      this.markEventAsGenerated(logicFilePath, functionName);
      
      return { 
        success: true, 
        functionName, 
        line: lineIndex + 1 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, functionName: '', error: errorMessage };
    }
  }
  
  collectEventsFromElements(elements: DesignerElement[]): Map<string, ElementEvents> {
    const events = new Map<string, ElementEvents>();
    
    const traverse = (els: DesignerElement[]) => {
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
    };
    
    traverse(elements);
    return events;
  }
  
  getAllEventFunctions(elements: DesignerElement[]): EventFunctionInfo[] {
    const functions: EventFunctionInfo[] = [];
    const events = this.collectEventsFromElements(elements);
    
    for (const [id, elementEvents] of events) {
      const element = this.findElementById(elements, id);
      if (!element) continue;
      
      const elementName = element.name || element.id;
      
      for (const eventType of Object.keys(elementEvents)) {
        const functionName = this.generateEventFunctionName(elementName, eventType);
        functions.push({
          elementName,
          eventType,
          functionName,
        });
      }
    }
    
    return functions;
  }
  
  private findElementById(elements: DesignerElement[], id: string): DesignerElement | null {
    for (const el of elements) {
      if (el.id === id) return el;
      if (el.children) {
        const found = this.findElementById(el.children, id);
        if (found) return found;
      }
    }
    return null;
  }
}

export const eventCodeService = new EventCodeService();
