import React, { useState } from 'react';
import {
  MousePointer2,
  Palette,
  Layout,
  SlidersHorizontal,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Group,
  Layers,
  Square,
  Image as ImageIcon,
  Zap,
  Code,
} from 'lucide-react';
import { open as dialogOpen } from '@tauri-apps/plugin-dialog';
import { componentRegistry } from './registry';
import { getIcon } from './DesignerComponentBox';
import { DynamicPropertyPanel } from './DynamicPropertyPanel';
import { eventCodeService } from './EventCodeService';
import { editorJumpService } from '@/shared/services/EditorJumpService';
import { globalAPI } from '@/infrastructure/api/service-api/GlobalAPI';

export interface ImGuiWindowProps {
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

export interface DesignerElement {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: Record<string, unknown>;
  title?: string;
  description?: string;
  className?: string;
  dataAttributes?: Record<string, string>;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  tabIndex?: number;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    opacity?: number;
    boxShadow?: string;
    fontSize?: number;
    fontWeight?: string | number;
    textAlign?: 'left' | 'center' | 'right';
    zIndex?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    marginTop?: number;
    marginRight?: number;
    marginBottom?: number;
    marginLeft?: number;
    borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
    borderTopWidth?: number;
    borderRightWidth?: number;
    borderBottomWidth?: number;
    borderLeftWidth?: number;
    borderTopColor?: string;
    borderRightColor?: string;
    borderBottomColor?: string;
    borderLeftColor?: string;
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderBottomLeftRadius?: number;
    borderBottomRightRadius?: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    display?: string;
    position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
    overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto';
    overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto';
    fontFamily?: string;
    lineHeight?: number | string;
    letterSpacing?: number;
    textDecoration?: 'none' | 'underline' | 'line-through' | 'overline';
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    cursor?: string;
    transition?: string;
    transform?: string;
  };
  events?: {
    onClick?: string;
    onDoubleClick?: string;
    onMouseEnter?: string;
    onMouseLeave?: string;
    onFocus?: string;
    onBlur?: string;
    onKeyDown?: string;
    onKeyUp?: string;
    onChange?: string;
  };
  locked?: boolean;
  hidden?: boolean;
  groupId?: string;
  // ImGui Window Properties
  imguiWindowProps?: ImGuiWindowProps;
}

export interface CanvasSettings {
  imguiWindowProps?: ImGuiWindowProps;
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  className?: string;
  width: number;
  height: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  backgroundColor: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  boxShadow?: string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  ariaLabel?: string;
  ariaDescribedBy?: string;
  windowIcon?: string;
  events?: ElementEvents;
}

interface DesignerPropertiesPanelProps {
  isCanvasSelected: boolean;
  canvasSettings: CanvasSettings;
  setCanvasSettings: React.Dispatch<React.SetStateAction<CanvasSettings>>;
  selectedElement: DesignerElement | null;
  selectedIds: Set<string>;
  updateElement: (id: string, updates: Partial<DesignerElement>) => void;
  deleteElements: (ids: string[]) => void;
  duplicateElements: (ids: string[]) => void;
  groupElements: (ids: string[]) => void;
  elements: DesignerElement[];
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  draggedLayerId: string | null;
  handleLayerDragStart: (e: React.DragEvent, id: string) => void;
  handleLayerDragOver: (e: React.DragEvent, id: string) => void;
  handleLayerDragEnd: () => void;
  t: (key: string) => string;
  filePath?: string;
  windowName?: string;
}

const DesignerPropertiesPanel: React.FC<DesignerPropertiesPanelProps> = ({
  isCanvasSelected,
  canvasSettings,
  setCanvasSettings,
  selectedElement,
  selectedIds,
  updateElement,
  deleteElements,
  duplicateElements,
  groupElements,
  elements,
  setSelectedIds,
  draggedLayerId,
  handleLayerDragStart,
  handleLayerDragOver,
  handleLayerDragEnd,
  t,
  filePath,
  windowName,
}) => {
  const [activeTab, setActiveTab] = useState<'style' | 'layout' | 'advanced' | 'events'>('style');
  const [canvasActiveTab, setCanvasActiveTab] = useState<'style' | 'layout' | 'advanced' | 'events'>('layout');

  const handleGenerateEvent = async (eventType: string) => {
    if (!selectedElement?.name || !filePath || !windowName) return;
    
    const result = await eventCodeService.generateEventInLogicFile(
      selectedElement.name,
      eventType,
      windowName
    );
    
    if (result.success) {
      updateElement(selectedElement.id, {
        events: { ...selectedElement.events, [eventType]: result.functionName }
      });
      
      const workspacePath = await globalAPI.getCurrentWorkspacePath();
      if (workspacePath && result.line) {
        const logicFilePath = `${workspacePath}/交互_${windowName}.灵`;
        await editorJumpService.jumpToFile(logicFilePath, result.line);
      }
    }
  };

  return (
    <div className="designer-panel designer-panel--right">
      <div className="designer-panel__header">
        <MousePointer2 size={14} />
        <span>{t('designer.properties') || '属性'}</span>
      </div>
      <div className="designer-panel__content">
        {isCanvasSelected ? (
          <div className="designer-properties">
            <div className="designer-properties__tabs">
              <button
                className={`designer-properties__tab ${canvasActiveTab === 'style' ? 'is-active' : ''}`}
                onClick={() => setCanvasActiveTab('style')}
              >
                <Palette size={14} />
                样式
              </button>
              <button
                className={`designer-properties__tab ${canvasActiveTab === 'layout' ? 'is-active' : ''}`}
                onClick={() => setCanvasActiveTab('layout')}
              >
                <Layout size={14} />
                布局
              </button>
              <button
                className={`designer-properties__tab ${canvasActiveTab === 'advanced' ? 'is-active' : ''}`}
                onClick={() => setCanvasActiveTab('advanced')}
              >
                <SlidersHorizontal size={14} />
                高级
              </button>
              <button
                className={`designer-properties__tab ${canvasActiveTab === 'events' ? 'is-active' : ''}`}
                onClick={() => setCanvasActiveTab('events')}
              >
                <Zap size={14} />
                事件
              </button>
            </div>

            {canvasActiveTab === 'style' && (
              <div className="designer-properties__section">
                <div className="designer-properties__row">
                  <label>背景色</label>
                  <div className="designer-properties__color-input">
                    <input
                      type="color"
                      value={canvasSettings.backgroundColor}
                      onChange={(e) => setCanvasSettings({ ...canvasSettings, backgroundColor: e.target.value })}
                    />
                    <input
                      type="text"
                      value={canvasSettings.backgroundColor}
                      onChange={(e) => setCanvasSettings({ ...canvasSettings, backgroundColor: e.target.value })}
                      placeholder="透明"
                    />
                  </div>
                </div>
                <div className="designer-properties__row">
                  <label>边框颜色</label>
                  <div className="designer-properties__color-input">
                    <input
                      type="color"
                      value={canvasSettings.borderColor || '#cccccc'}
                      onChange={(e) => setCanvasSettings({ ...canvasSettings, borderColor: e.target.value })}
                    />
                    <input
                      type="text"
                      value={canvasSettings.borderColor || ''}
                      onChange={(e) => setCanvasSettings({ ...canvasSettings, borderColor: e.target.value })}
                      placeholder="无"
                    />
                  </div>
                </div>
                <div className="designer-properties__row">
                  <label>边框宽度</label>
                  <input
                    type="number"
                    value={canvasSettings.borderWidth || 0}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, borderWidth: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>圆角</label>
                  <input
                    type="number"
                    value={canvasSettings.borderRadius || 0}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, borderRadius: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>透明度</label>
                  <input
                    type="range"
                    value={(canvasSettings.opacity ?? 1) * 100}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, opacity: parseInt(e.target.value) / 100 })}
                    min="0"
                    max="100"
                  />
                  <span>{Math.round((canvasSettings.opacity ?? 1) * 100)}%</span>
                </div>
                <div className="designer-properties__row">
                  <label>阴影</label>
                  <input
                    type="text"
                    value={canvasSettings.boxShadow || ''}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, boxShadow: e.target.value })}
                    placeholder="如: 0 2px 4px rgba(0,0,0,0.1)"
                  />
                </div>
              </div>
            )}

            {canvasActiveTab === 'layout' && (
              <div className="designer-properties__section">
                <div className="designer-properties__section-title">基本信息</div>
                <div className="designer-properties__row">
                  <label>ID</label>
                  <input
                    type="text"
                    value={canvasSettings.id || 'canvas-main'}
                    readOnly
                    className="designer-properties__input--readonly"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>名称</label>
                  <input
                    type="text"
                    value={canvasSettings.name || ''}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, name: e.target.value })}
                    placeholder="画布名称"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>标题</label>
                  <input
                    type="text"
                    value={canvasSettings.title || ''}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, title: e.target.value })}
                    placeholder="鼠标悬停提示"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>描述</label>
                  <textarea
                    value={canvasSettings.description || ''}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, description: e.target.value })}
                    placeholder="画布描述"
                    rows={2}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>类名</label>
                  <input
                    type="text"
                    value={canvasSettings.className || ''}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, className: e.target.value })}
                    placeholder="CSS类名"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>窗口图标</label>
                  <div className="designer-properties__file-input">
                    <input
                      type="text"
                      value={canvasSettings.windowIcon || ''}
                      onChange={(e) => setCanvasSettings({ ...canvasSettings, windowIcon: e.target.value })}
                      placeholder="图标路径 (如: icon.png)"
                      style={{ flex: 1 }}
                    />
                    <button
                      onClick={async () => {
                        const selected = await dialogOpen({
                          multiple: false,
                          filters: [{
                            name: 'Images',
                            extensions: ['png', 'jpg', 'jpeg', 'ico', 'bmp']
                          }]
                        });
                        if (selected && typeof selected === 'string') {
                          setCanvasSettings({ ...canvasSettings, windowIcon: selected });
                        }
                      }}
                      title="选择图标文件"
                    >
                      <ImageIcon size={16} />
                    </button>
                  </div>
                </div>

                <div className="designer-properties__section-title">尺寸</div>
                <div className="designer-properties__row designer-properties__row--inline">
                  <label>宽</label>
                  <input
                    type="number"
                    value={canvasSettings.width}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, width: parseInt(e.target.value) || 800 })}
                  />
                  <label>高</label>
                  <input
                    type="number"
                    value={canvasSettings.height}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, height: parseInt(e.target.value) || 600 })}
                  />
                </div>
                <div className="designer-properties__row designer-properties__row--inline">
                  <label>最小宽</label>
                  <input
                    type="number"
                    value={canvasSettings.minWidth || ''}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, minWidth: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="自动"
                  />
                  <label>最大宽</label>
                  <input
                    type="number"
                    value={canvasSettings.maxWidth || ''}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, maxWidth: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="自动"
                  />
                </div>
                <div className="designer-properties__row designer-properties__row--inline">
                  <label>最小高</label>
                  <input
                    type="number"
                    value={canvasSettings.minHeight || ''}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, minHeight: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="自动"
                  />
                  <label>最大高</label>
                  <input
                    type="number"
                    value={canvasSettings.maxHeight || ''}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, maxHeight: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="自动"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>预设尺寸</label>
                  <select
                    onChange={(e) => {
                      const presets: Record<string, { width: number; height: number }> = {
                        'desktop': { width: 1920, height: 1080 },
                        'laptop': { width: 1366, height: 768 },
                        'tablet': { width: 768, height: 1024 },
                        'mobile': { width: 375, height: 667 },
                        'poster': { width: 1080, height: 1920 },
                        'banner': { width: 1200, height: 300 },
                        'vb6': { width: 480, height: 360 },
                      };
                      const preset = presets[e.target.value];
                      if (preset) {
                        setCanvasSettings({ ...canvasSettings, ...preset });
                      }
                    }}
                  >
                    <option value="">选择预设...</option>
                    <option value="vb6">小窗口 (480×360)</option>
                    <option value="desktop">桌面 (1920×1080)</option>
                    <option value="laptop">笔记本 (1366×768)</option>
                    <option value="tablet">平板 (768×1024)</option>
                    <option value="mobile">手机 (375×667)</option>
                    <option value="poster">海报 (1080×1920)</option>
                    <option value="banner">横幅 (1200×300)</option>
                  </select>
                </div>
                <div className="designer-properties__section-title">窗口位置</div>
                <div className="designer-properties__row designer-properties__row--inline">
                  <label>X</label>
                  <input
                    type="number"
                    value={canvasSettings.imguiWindowProps?.posX ?? ''}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, posX: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    placeholder="默认"
                  />
                  <label>Y</label>
                  <input
                    type="number"
                    value={canvasSettings.imguiWindowProps?.posY ?? ''}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, posY: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    placeholder="默认"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>位置条件</label>
                  <select
                    value={canvasSettings.imguiWindowProps?.posCond || 'always'}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, posCond: e.target.value as 'always' | 'once' | 'firstUseEver' | 'appearing' }
                    })}
                  >
                    <option value="always">总是</option>
                    <option value="once">一次</option>
                    <option value="firstUseEver">首次使用</option>
                    <option value="appearing">出现时</option>
                  </select>
                </div>
                <div className="designer-properties__row">
                  <label>轴心X</label>
                  <input
                    type="range"
                    value={(canvasSettings.imguiWindowProps?.pivotX ?? 0) * 100}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, pivotX: parseInt(e.target.value) / 100 }
                    })}
                    min="0"
                    max="100"
                  />
                  <span>{(canvasSettings.imguiWindowProps?.pivotX ?? 0).toFixed(1)}</span>
                </div>
                <div className="designer-properties__row">
                  <label>轴心Y</label>
                  <input
                    type="range"
                    value={(canvasSettings.imguiWindowProps?.pivotY ?? 0) * 100}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, pivotY: parseInt(e.target.value) / 100 }
                    })}
                    min="0"
                    max="100"
                  />
                  <span>{(canvasSettings.imguiWindowProps?.pivotY ?? 0).toFixed(1)}</span>
                </div>
                
                <div className="designer-properties__section-title">窗口大小</div>
                <div className="designer-properties__row designer-properties__row--inline">
                  <label>宽</label>
                  <input
                    type="number"
                    value={canvasSettings.imguiWindowProps?.sizeWidth ?? ''}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, sizeWidth: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    placeholder="默认"
                  />
                  <label>高</label>
                  <input
                    type="number"
                    value={canvasSettings.imguiWindowProps?.sizeHeight ?? ''}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, sizeHeight: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    placeholder="默认"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>大小条件</label>
                  <select
                    value={canvasSettings.imguiWindowProps?.sizeCond || 'always'}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, sizeCond: e.target.value as 'always' | 'once' | 'firstUseEver' | 'appearing' }
                    })}
                  >
                    <option value="always">总是</option>
                    <option value="once">一次</option>
                    <option value="firstUseEver">首次使用</option>
                    <option value="appearing">出现时</option>
                  </select>
                </div>
                
                <div className="designer-properties__section-title">大小限制</div>
                <div className="designer-properties__row designer-properties__row--inline">
                  <label>最小宽</label>
                  <input
                    type="number"
                    value={canvasSettings.imguiWindowProps?.minWidth ?? ''}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, minWidth: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    placeholder="0"
                    min="0"
                  />
                  <label>最小高</label>
                  <input
                    type="number"
                    value={canvasSettings.imguiWindowProps?.minHeight ?? ''}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, minHeight: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="designer-properties__row designer-properties__row--inline">
                  <label>最大宽</label>
                  <input
                    type="number"
                    value={canvasSettings.imguiWindowProps?.maxWidth ?? ''}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, maxWidth: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    placeholder="无限制"
                    min="0"
                  />
                  <label>最大高</label>
                  <input
                    type="number"
                    value={canvasSettings.imguiWindowProps?.maxHeight ?? ''}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, maxHeight: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    placeholder="无限制"
                    min="0"
                  />
                </div>
                
                <div className="designer-properties__section-title">内容大小</div>
                <div className="designer-properties__row designer-properties__row--inline">
                  <label>宽</label>
                  <input
                    type="number"
                    value={canvasSettings.imguiWindowProps?.contentWidth ?? ''}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, contentWidth: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    placeholder="自动"
                  />
                  <label>高</label>
                  <input
                    type="number"
                    value={canvasSettings.imguiWindowProps?.contentHeight ?? ''}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, contentHeight: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    placeholder="自动"
                  />
                </div>
                
                <div className="designer-properties__section-title">内边距</div>
                <div className="designer-properties__row designer-properties__row--inline">
                  <label>上</label>
                  <input
                    type="number"
                    value={canvasSettings.paddingTop || 0}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, paddingTop: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                  <label>右</label>
                  <input
                    type="number"
                    value={canvasSettings.paddingRight || 0}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, paddingRight: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="designer-properties__row designer-properties__row--inline">
                  <label>下</label>
                  <input
                    type="number"
                    value={canvasSettings.paddingBottom || 0}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, paddingBottom: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                  <label>左</label>
                  <input
                    type="number"
                    value={canvasSettings.paddingLeft || 0}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, paddingLeft: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>
            )}

            {canvasActiveTab === 'advanced' && (
              <div className="designer-properties__section">
                <div className="designer-properties__section-title">窗口标志</div>
                <div className="designer-properties__row">
                  <label>无标题栏</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.noTitleBar || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, noTitleBar: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>不可调整大小</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.noResize || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, noResize: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>不可移动</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.noMove || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, noMove: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>无滚动条</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.noScrollbar || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, noScrollbar: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>鼠标不滚动</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.noScrollWithMouse || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, noScrollWithMouse: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>不可折叠</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.noCollapse || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, noCollapse: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>自动调整大小</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.alwaysAutoResize || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, alwaysAutoResize: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>无背景</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.noBackground || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, noBackground: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>不保存设置</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.noSavedSettings || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, noSavedSettings: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>无鼠标输入</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.noMouseInputs || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, noMouseInputs: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>菜单栏</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.menuBar || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, menuBar: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>水平滚动条</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.horizontalScrollbar || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, horizontalScrollbar: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>出现时无焦点</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.noFocusOnAppearing || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, noFocusOnAppearing: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>不置顶</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.noBringToFrontOnFocus || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, noBringToFrontOnFocus: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>总是垂直滚动</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.alwaysVerticalScrollbar || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, alwaysVerticalScrollbar: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>总是水平滚动</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.alwaysHorizontalScrollbar || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, alwaysHorizontalScrollbar: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>无导航输入</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.noNavInputs || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, noNavInputs: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>无导航焦点</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.noNavFocus || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, noNavFocus: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>无导航</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.noNav || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, noNav: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>无输入</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.noInputs || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, noInputs: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>未保存文档</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.unsavedDocument || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, unsavedDocument: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>无停靠</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.noDocking || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, noDocking: e.target.checked }
                    })}
                  />
                </div>
                
                <div className="designer-properties__section-title">窗口状态</div>
                <div className="designer-properties__row">
                  <label>折叠</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.collapsed || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, collapsed: e.target.checked }
                    })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>折叠条件</label>
                  <select
                    value={canvasSettings.imguiWindowProps?.collapsedCond || 'always'}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, collapsedCond: e.target.value as 'always' | 'once' | 'firstUseEver' | 'appearing' }
                    })}
                  >
                    <option value="always">总是</option>
                    <option value="once">一次</option>
                    <option value="firstUseEver">首次使用</option>
                    <option value="appearing">出现时</option>
                  </select>
                </div>
                <div className="designer-properties__row">
                  <label>滚动X</label>
                  <input
                    type="range"
                    value={canvasSettings.imguiWindowProps?.scrollX ?? 0}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, scrollX: parseInt(e.target.value) }
                    })}
                    min="0"
                    max="1000"
                  />
                  <span>{canvasSettings.imguiWindowProps?.scrollX ?? 0}</span>
                </div>
                <div className="designer-properties__row">
                  <label>滚动Y</label>
                  <input
                    type="range"
                    value={canvasSettings.imguiWindowProps?.scrollY ?? 0}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, scrollY: parseInt(e.target.value) }
                    })}
                    min="0"
                    max="1000"
                  />
                  <span>{canvasSettings.imguiWindowProps?.scrollY ?? 0}</span>
                </div>
                <div className="designer-properties__row">
                  <label>停靠ID</label>
                  <input
                    type="number"
                    value={canvasSettings.imguiWindowProps?.dockId ?? ''}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, dockId: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    placeholder="无"
                    min="0"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>停靠条件</label>
                  <select
                    value={canvasSettings.imguiWindowProps?.dockCond || 'always'}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, dockCond: e.target.value as 'always' | 'once' | 'firstUseEver' | 'appearing' }
                    })}
                  >
                    <option value="always">总是</option>
                    <option value="once">一次</option>
                    <option value="firstUseEver">首次使用</option>
                    <option value="appearing">出现时</option>
                  </select>
                </div>
                <div className="designer-properties__row">
                  <label>设置焦点</label>
                  <input
                    type="checkbox"
                    checked={canvasSettings.imguiWindowProps?.focus || false}
                    onChange={(e) => setCanvasSettings({ 
                      ...canvasSettings, 
                      imguiWindowProps: { ...canvasSettings.imguiWindowProps, focus: e.target.checked }
                    })}
                  />
                </div>
                
                <div className="designer-properties__section-title">溢出</div>
                <div className="designer-properties__row">
                  <label>溢出处理</label>
                  <select
                    value={canvasSettings.overflow || 'visible'}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, overflow: e.target.value as 'visible' | 'hidden' | 'scroll' | 'auto' })}
                  >
                    <option value="visible">可见</option>
                    <option value="hidden">隐藏</option>
                    <option value="scroll">滚动</option>
                    <option value="auto">自动</option>
                  </select>
                </div>
                
                <div className="designer-properties__section-title">无障碍</div>
                <div className="designer-properties__row">
                  <label>ARIA标签</label>
                  <input
                    type="text"
                    value={canvasSettings.ariaLabel || ''}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, ariaLabel: e.target.value })}
                    placeholder="屏幕阅读器标签"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>ARIA描述</label>
                  <input
                    type="text"
                    value={canvasSettings.ariaDescribedBy || ''}
                    onChange={(e) => setCanvasSettings({ ...canvasSettings, ariaDescribedBy: e.target.value })}
                    placeholder="描述元素ID"
                  />
                </div>
              </div>
            )}

            {canvasActiveTab === 'events' && (
              <div className="designer-properties__section">
                <div className="designer-properties__section-title">窗口事件</div>
                <div className="designer-properties__row">
                  <label>加载事件</label>
                  <div className="designer-properties__event-input">
                    <input
                      type="text"
                      value={canvasSettings.events?.onLoad || ''}
                      onChange={(e) => setCanvasSettings({ 
                        ...canvasSettings, 
                        events: { ...canvasSettings.events, onLoad: e.target.value } 
                      })}
                      placeholder="窗口加载时执行"
                      className="designer-properties__input"
                    />
                    {canvasSettings.name && filePath && windowName && (
                      <button
                        className="designer-properties__event-btn"
                        onClick={async () => {
                          if (!canvasSettings.name || !filePath || !windowName) return;
                          const result = await eventCodeService.generateEventInLogicFile(
                            canvasSettings.name,
                            'onLoad',
                            windowName
                          );
                          if (result.success) {
                            setCanvasSettings({ 
                              ...canvasSettings, 
                              events: { ...canvasSettings.events, onLoad: result.functionName } 
                            });
                            const workspacePath = await globalAPI.getCurrentWorkspacePath();
                            if (workspacePath && result.line) {
                              const logicFilePath = `${workspacePath}/交互_${windowName}.灵`;
                              await editorJumpService.jumpToFile(logicFilePath, result.line);
                            }
                          }
                        }}
                        title="生成事件处理函数"
                      >
                        <Code size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="designer-properties__row">
                  <label>卸载事件</label>
                  <div className="designer-properties__event-input">
                    <input
                      type="text"
                      value={canvasSettings.events?.onUnload || ''}
                      onChange={(e) => setCanvasSettings({ 
                        ...canvasSettings, 
                        events: { ...canvasSettings.events, onUnload: e.target.value } 
                      })}
                      placeholder="窗口卸载时执行"
                      className="designer-properties__input"
                    />
                    {canvasSettings.name && filePath && windowName && (
                      <button
                        className="designer-properties__event-btn"
                        onClick={async () => {
                          if (!canvasSettings.name || !filePath || !windowName) return;
                          const result = await eventCodeService.generateEventInLogicFile(
                            canvasSettings.name,
                            'onUnload',
                            windowName
                          );
                          if (result.success) {
                            setCanvasSettings({ 
                              ...canvasSettings, 
                              events: { ...canvasSettings.events, onUnload: result.functionName } 
                            });
                            const workspacePath = await globalAPI.getCurrentWorkspacePath();
                            if (workspacePath && result.line) {
                              const logicFilePath = `${workspacePath}/交互_${windowName}.灵`;
                              await editorJumpService.jumpToFile(logicFilePath, result.line);
                            }
                          }
                        }}
                        title="生成事件处理函数"
                      >
                        <Code size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="designer-properties__section">
                <div className="designer-properties__section-title">事件</div>
                <div className="designer-properties__row">
                  <label>点击事件</label>
                  <div className="designer-properties__event-input">
                    <input
                      type="text"
                      value={selectedElement.events?.onClick || ''}
                      onChange={(e) => updateElement(selectedElement.id, {
                        events: { ...selectedElement.events, onClick: e.target.value }
                      })}
                      placeholder="点击事件处理"
                      className="designer-properties__input"
                    />
                    {selectedElement.name && filePath && windowName && (
                      <button
                        className="designer-properties__event-btn"
                        onClick={() => handleGenerateEvent('onClick')}
                        title="生成事件处理函数"
                      >
                        <Code size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="designer-properties__row">
                  <label>双击事件</label>
                  <div className="designer-properties__event-input">
                    <input
                      type="text"
                      value={selectedElement.events?.onDoubleClick || ''}
                      onChange={(e) => updateElement(selectedElement.id, {
                        events: { ...selectedElement.events, onDoubleClick: e.target.value }
                      })}
                      placeholder="双击事件处理"
                      className="designer-properties__input"
                    />
                    {selectedElement.name && filePath && windowName && (
                      <button
                        className="designer-properties__event-btn"
                        onClick={() => handleGenerateEvent('onDoubleClick')}
                        title="生成事件处理函数"
                      >
                        <Code size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="designer-properties__row">
                  <label>鼠标进入</label>
                  <div className="designer-properties__event-input">
                    <input
                      type="text"
                      value={selectedElement.events?.onMouseEnter || ''}
                      onChange={(e) => updateElement(selectedElement.id, {
                        events: { ...selectedElement.events, onMouseEnter: e.target.value }
                      })}
                      placeholder="鼠标进入事件"
                      className="designer-properties__input"
                    />
                    {selectedElement.name && filePath && windowName && (
                      <button
                        className="designer-properties__event-btn"
                        onClick={() => handleGenerateEvent('onMouseEnter')}
                        title="生成事件处理函数"
                      >
                        <Code size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="designer-properties__row">
                  <label>鼠标离开</label>
                  <div className="designer-properties__event-input">
                    <input
                      type="text"
                      value={selectedElement.events?.onMouseLeave || ''}
                      onChange={(e) => updateElement(selectedElement.id, {
                        events: { ...selectedElement.events, onMouseLeave: e.target.value }
                      })}
                      placeholder="鼠标离开事件"
                      className="designer-properties__input"
                    />
                    {selectedElement.name && filePath && windowName && (
                      <button
                        className="designer-properties__event-btn"
                        onClick={() => handleGenerateEvent('onMouseLeave')}
                        title="生成事件处理函数"
                      >
                        <Code size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="designer-properties__row">
                  <label>值变化</label>
                  <div className="designer-properties__event-input">
                    <input
                      type="text"
                      value={selectedElement.events?.onChange || ''}
                      onChange={(e) => updateElement(selectedElement.id, {
                        events: { ...selectedElement.events, onChange: e.target.value }
                      })}
                      placeholder="值变化事件"
                      className="designer-properties__input"
                    />
                    {selectedElement.name && filePath && windowName && (
                      <button
                        className="designer-properties__event-btn"
                        onClick={() => handleGenerateEvent('onChange')}
                        title="生成事件处理函数"
                      >
                        <Code size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="designer-properties__row">
                  <label>获得焦点</label>
                  <div className="designer-properties__event-input">
                    <input
                      type="text"
                      value={selectedElement.events?.onFocus || ''}
                      onChange={(e) => updateElement(selectedElement.id, {
                        events: { ...selectedElement.events, onFocus: e.target.value }
                      })}
                      placeholder="获得焦点事件"
                      className="designer-properties__input"
                    />
                    {selectedElement.name && filePath && windowName && (
                      <button
                        className="designer-properties__event-btn"
                        onClick={() => handleGenerateEvent('onFocus')}
                        title="生成事件处理函数"
                      >
                        <Code size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="designer-properties__row">
                  <label>失去焦点</label>
                  <div className="designer-properties__event-input">
                    <input
                      type="text"
                      value={selectedElement.events?.onBlur || ''}
                      onChange={(e) => updateElement(selectedElement.id, {
                        events: { ...selectedElement.events, onBlur: e.target.value }
                      })}
                      placeholder="失去焦点事件"
                      className="designer-properties__input"
                    />
                    {selectedElement.name && filePath && windowName && (
                      <button
                        className="designer-properties__event-btn"
                        onClick={() => handleGenerateEvent('onBlur')}
                        title="生成事件处理函数"
                      >
                        <Code size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : selectedIds.size > 1 ? (
          <div className="designer-properties">
            <div className="designer-properties__multi-select">
              <span>已选择 {selectedIds.size} 个元素</span>
              <div className="designer-properties__actions">
                <button
                  className="designer-properties__action-btn"
                  onClick={() => groupElements(Array.from(selectedIds))}
                >
                  <Group size={14} />
                  组合
                </button>
                <button
                  className="designer-properties__action-btn designer-properties__action-btn--danger"
                  onClick={() => deleteElements(Array.from(selectedIds))}
                >
                  <Trash2 size={14} />
                  全部删除
                </button>
              </div>
            </div>
          </div>
        ) : selectedElement ? (
          componentRegistry.has(selectedElement.type) ? (
            <DynamicPropertyPanel
              element={selectedElement}
              updateElement={updateElement}
              t={t}
              filePath={filePath}
              windowName={windowName}
            />
          ) : (
            <div className="designer-properties">
              <div className="designer-properties__tabs">
                <button
                  className={`designer-properties__tab ${activeTab === 'style' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('style')}
                >
                  <Palette size={14} />
                  样式
                </button>
                <button
                  className={`designer-properties__tab ${activeTab === 'layout' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('layout')}
                >
                  <Layout size={14} />
                  布局
                </button>
                <button
                  className={`designer-properties__tab ${activeTab === 'advanced' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('advanced')}
                >
                  <SlidersHorizontal size={14} />
                  高级
                </button>
                <button
                  className={`designer-properties__tab ${activeTab === 'events' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('events')}
                >
                  <Zap size={14} />
                  事件
                </button>
              </div>

              {activeTab === 'style' && (
                <div className="designer-properties__section">
                  <div className="designer-properties__row">
                    <label>背景色</label>
                    <div className="designer-properties__color-input">
                      <input
                        type="color"
                        value={selectedElement.styles?.backgroundColor || '#ffffff'}
                        onChange={(e) => updateElement(selectedElement.id, {
                          styles: { ...selectedElement.styles, backgroundColor: e.target.value }
                        })}
                      />
                      <input
                        type="text"
                        value={selectedElement.styles?.backgroundColor || ''}
                        onChange={(e) => updateElement(selectedElement.id, {
                          styles: { ...selectedElement.styles, backgroundColor: e.target.value }
                        })}
                        placeholder="透明"
                      />
                    </div>
                  </div>
                  <div className="designer-properties__row">
                    <label>文字颜色</label>
                    <div className="designer-properties__color-input">
                      <input
                        type="color"
                        value={selectedElement.styles?.textColor || '#000000'}
                        onChange={(e) => updateElement(selectedElement.id, {
                          styles: { ...selectedElement.styles, textColor: e.target.value }
                        })}
                      />
                      <input
                        type="text"
                        value={selectedElement.styles?.textColor || ''}
                        onChange={(e) => updateElement(selectedElement.id, {
                          styles: { ...selectedElement.styles, textColor: e.target.value }
                        })}
                        placeholder="继承"
                      />
                    </div>
                  </div>
                  <div className="designer-properties__row">
                    <label>边框颜色</label>
                    <div className="designer-properties__color-input">
                      <input
                        type="color"
                        value={selectedElement.styles?.borderColor || '#cccccc'}
                        onChange={(e) => updateElement(selectedElement.id, {
                          styles: { ...selectedElement.styles, borderColor: e.target.value }
                        })}
                      />
                      <input
                        type="text"
                        value={selectedElement.styles?.borderColor || ''}
                        onChange={(e) => updateElement(selectedElement.id, {
                          styles: { ...selectedElement.styles, borderColor: e.target.value }
                        })}
                        placeholder="无"
                      />
                    </div>
                  </div>
                <div className="designer-properties__row">
                  <label>边框宽度</label>
                  <input
                    type="number"
                    value={selectedElement.styles?.borderWidth || 0}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, borderWidth: parseInt(e.target.value) || 0 }
                    })}
                    min="0"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>圆角</label>
                  <input
                    type="number"
                    value={selectedElement.styles?.borderRadius || 0}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, borderRadius: parseInt(e.target.value) || 0 }
                    })}
                    min="0"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>透明度</label>
                  <input
                    type="range"
                    value={(selectedElement.styles?.opacity ?? 1) * 100}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, opacity: parseInt(e.target.value) / 100 }
                    })}
                    min="0"
                    max="100"
                  />
                  <span>{Math.round((selectedElement.styles?.opacity ?? 1) * 100)}%</span>
                </div>
                <div className="designer-properties__row">
                  <label>阴影</label>
                  <input
                    type="text"
                    value={selectedElement.styles?.boxShadow || ''}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, boxShadow: e.target.value }
                    })}
                    placeholder="如: 0 2px 4px rgba(0,0,0,0.1)"
                  />
                </div>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="designer-properties__section">
                <div className="designer-properties__section-title">基本信息</div>
                <div className="designer-properties__row">
                  <label>名称</label>
                  <input
                    type="text"
                    value={selectedElement.name}
                    onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>ID</label>
                  <input
                    type="text"
                    value={selectedElement.id}
                    readOnly
                    className="designer-properties__input--readonly"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>类型</label>
                  <span className="designer-properties__value">{componentRegistry.get(selectedElement.type)?.name || selectedElement.type}</span>
                </div>
                <div className="designer-properties__row">
                  <label>标题</label>
                  <input
                    type="text"
                    value={selectedElement.title || ''}
                    onChange={(e) => updateElement(selectedElement.id, { title: e.target.value })}
                    placeholder="鼠标悬停提示"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>描述</label>
                  <textarea
                    value={selectedElement.description || ''}
                    onChange={(e) => updateElement(selectedElement.id, { description: e.target.value })}
                    placeholder="元素描述"
                    rows={2}
                  />
                </div>
                <div className="designer-properties__row">
                  <label>类名</label>
                  <input
                    type="text"
                    value={selectedElement.className || ''}
                    onChange={(e) => updateElement(selectedElement.id, { className: e.target.value })}
                    placeholder="CSS类名，多个用空格分隔"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>Tab索引</label>
                  <input
                    type="number"
                    value={selectedElement.tabIndex ?? ''}
                    onChange={(e) => updateElement(selectedElement.id, { tabIndex: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="键盘导航顺序"
                  />
                </div>
                
                <div className="designer-properties__section-title">无障碍</div>
                <div className="designer-properties__row">
                  <label>ARIA标签</label>
                  <input
                    type="text"
                    value={selectedElement.ariaLabel || ''}
                    onChange={(e) => updateElement(selectedElement.id, { ariaLabel: e.target.value })}
                    placeholder="屏幕阅读器标签"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>ARIA描述</label>
                  <input
                    type="text"
                    value={selectedElement.ariaDescribedBy || ''}
                    onChange={(e) => updateElement(selectedElement.id, { ariaDescribedBy: e.target.value })}
                    placeholder="描述元素ID"
                  />
                </div>
                
                {selectedElement.props && Object.keys(selectedElement.props).length > 0 && (
                  <>
                    <div className="designer-properties__section-title">属性</div>
                    {selectedElement.props.text !== undefined && (
                      <div className="designer-properties__row">
                        <label>文本</label>
                        <input
                          type="text"
                          value={selectedElement.props.text as string || ''}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, text: e.target.value }
                          })}
                        />
                      </div>
                    )}
                    {selectedElement.props.placeholder !== undefined && (
                      <div className="designer-properties__row">
                        <label>占位符</label>
                        <input
                          type="text"
                          value={selectedElement.props.placeholder as string || ''}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, placeholder: e.target.value }
                          })}
                        />
                      </div>
                    )}
                    {selectedElement.props.label !== undefined && (
                      <div className="designer-properties__row">
                        <label>标签</label>
                        <input
                          type="text"
                          value={selectedElement.props.label as string || ''}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, label: e.target.value }
                          })}
                        />
                      </div>
                    )}
                    {selectedElement.props.href !== undefined && (
                      <div className="designer-properties__row">
                        <label>链接地址</label>
                        <input
                          type="text"
                          value={selectedElement.props.href as string || ''}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, href: e.target.value }
                          })}
                          placeholder="https://..."
                        />
                      </div>
                    )}
                    {selectedElement.props.value !== undefined && (
                      <div className="designer-properties__row">
                        <label>值</label>
                        <input
                          type="number"
                          value={selectedElement.props.value as number || 0}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, value: parseInt(e.target.value) || 0 }
                          })}
                        />
                      </div>
                    )}
                    {selectedElement.props.min !== undefined && (
                      <div className="designer-properties__row">
                        <label>最小值</label>
                        <input
                          type="number"
                          value={selectedElement.props.min as number || 0}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, min: parseInt(e.target.value) || 0 }
                          })}
                        />
                      </div>
                    )}
                    {selectedElement.props.max !== undefined && (
                      <div className="designer-properties__row">
                        <label>最大值</label>
                        <input
                          type="number"
                          value={selectedElement.props.max as number || 100}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, max: parseInt(e.target.value) || 100 }
                          })}
                        />
                      </div>
                    )}
                    {selectedElement.props.title !== undefined && (
                      <div className="designer-properties__row">
                        <label>标题</label>
                        <input
                          type="text"
                          value={selectedElement.props.title as string || ''}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, title: e.target.value }
                          })}
                        />
                      </div>
                    )}
                    {selectedElement.props.content !== undefined && (
                      <div className="designer-properties__row">
                        <label>内容</label>
                        <textarea
                          value={selectedElement.props.content as string || ''}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, content: e.target.value }
                          })}
                          rows={3}
                        />
                      </div>
                    )}
                    {selectedElement.props.type !== undefined && (
                      <div className="designer-properties__row">
                        <label>类型</label>
                        <select
                          value={selectedElement.props.type as string || ''}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, type: e.target.value }
                          })}
                        >
                          {selectedElement.type === 'alert' && (
                            <>
                              <option value="info">信息</option>
                              <option value="success">成功</option>
                              <option value="warning">警告</option>
                              <option value="error">错误</option>
                            </>
                          )}
                          {selectedElement.type === 'result' && (
                            <>
                              <option value="success">成功</option>
                              <option value="error">错误</option>
                              <option value="warning">警告</option>
                              <option value="info">信息</option>
                            </>
                          )}
                          {selectedElement.type === 'chart' && (
                            <>
                              <option value="bar">柱状图</option>
                              <option value="line">折线图</option>
                              <option value="pie">饼图</option>
                              <option value="area">面积图</option>
                            </>
                          )}
                        </select>
                      </div>
                    )}
                    {selectedElement.props.code !== undefined && (
                      <div className="designer-properties__row">
                        <label>代码</label>
                        <textarea
                          value={selectedElement.props.code as string || ''}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, code: e.target.value }
                          })}
                          rows={5}
                          style={{ fontFamily: 'monospace' }}
                        />
                      </div>
                    )}
                    {selectedElement.props.fontSize !== undefined && (
                      <div className="designer-properties__row">
                        <label>字体大小</label>
                        <input
                          type="number"
                          value={selectedElement.props.fontSize as number || 14}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, fontSize: parseInt(e.target.value) || 14 }
                          })}
                          min="8"
                        />
                      </div>
                    )}
                    {selectedElement.props.columns !== undefined && (
                      <div className="designer-properties__row">
                        <label>列数</label>
                        <input
                          type="number"
                          value={selectedElement.props.columns as number || 2}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, columns: parseInt(e.target.value) || 2 }
                          })}
                          min="1"
                          max="12"
                        />
                      </div>
                    )}
                    {selectedElement.props.rows !== undefined && (
                      <div className="designer-properties__row">
                        <label>行数</label>
                        <input
                          type="number"
                          value={selectedElement.props.rows as number || 2}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, rows: parseInt(e.target.value) || 2 }
                          })}
                          min="1"
                        />
                      </div>
                    )}
                    {selectedElement.props.current !== undefined && (
                      <div className="designer-properties__row">
                        <label>当前步骤</label>
                        <input
                          type="number"
                          value={selectedElement.props.current as number || 1}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, current: parseInt(e.target.value) || 1 }
                          })}
                          min="1"
                        />
                      </div>
                    )}
                    {selectedElement.props.total !== undefined && (
                      <div className="designer-properties__row">
                        <label>总数</label>
                        <input
                          type="number"
                          value={selectedElement.props.total as number || 3}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, total: parseInt(e.target.value) || 3 }
                          })}
                          min="1"
                        />
                      </div>
                    )}
                    {selectedElement.props.display !== undefined && (
                      <div className="designer-properties__row">
                        <label>布局模式</label>
                        <select
                          value={selectedElement.props.display as string || 'block'}
                          onChange={(e) => updateElement(selectedElement.id, {
                            props: { ...selectedElement.props, display: e.target.value }
                          })}
                        >
                          {selectedElement.type === 'flex' && (
                            <>
                              <option value="flex">弹性布局</option>
                            </>
                          )}
                          {selectedElement.type === 'grid' && (
                            <>
                              <option value="grid">网格布局</option>
                            </>
                          )}
                        </select>
                      </div>
                    )}
                  </>
                )}
                
                <div className="designer-properties__section-title">位置</div>
                <div className="designer-properties__row designer-properties__row--inline">
                  <label>X</label>
                  <input
                    type="number"
                    value={selectedElement.x}
                    onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                  />
                  <label>Y</label>
                  <input
                    type="number"
                    value={selectedElement.y}
                    onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="designer-properties__section-title">尺寸</div>
                <div className="designer-properties__row designer-properties__row--inline">
                  <label>宽</label>
                  <input
                    type="number"
                    value={selectedElement.width}
                    onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 0 })}
                  />
                  <label>高</label>
                  <input
                    type="number"
                    value={selectedElement.height}
                    onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="designer-properties__section-title">层级</div>
                <div className="designer-properties__row">
                  <label>Z-Index</label>
                  <input
                    type="number"
                    value={selectedElement.styles?.zIndex || 0}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, zIndex: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="designer-properties__section">
                <div className="designer-properties__section-title">字体</div>
                <div className="designer-properties__row">
                  <label>字体大小</label>
                  <input
                    type="number"
                    value={selectedElement.styles?.fontSize || 14}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, fontSize: parseInt(e.target.value) || 14 }
                    })}
                    min="8"
                  />
                </div>
                <div className="designer-properties__row">
                  <label>字体粗细</label>
                  <select
                    value={selectedElement.styles?.fontWeight || 'normal'}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, fontWeight: e.target.value }
                    })}
                  >
                    <option value="normal">正常</option>
                    <option value="bold">粗体</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                    <option value="300">300</option>
                    <option value="400">400</option>
                    <option value="500">500</option>
                    <option value="600">600</option>
                    <option value="700">700</option>
                    <option value="800">800</option>
                    <option value="900">900</option>
                  </select>
                </div>
                <div className="designer-properties__row">
                  <label>文本对齐</label>
                  <select
                    value={selectedElement.styles?.textAlign || 'left'}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, textAlign: e.target.value as 'left' | 'center' | 'right' }
                    })}
                  >
                    <option value="left">左对齐</option>
                    <option value="center">居中</option>
                    <option value="right">右对齐</option>
                  </select>
                </div>
                <div className="designer-properties__section-title">阴影</div>
                <div className="designer-properties__row">
                  <label>阴影</label>
                  <input
                    type="text"
                    value={selectedElement.styles?.boxShadow || ''}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, boxShadow: e.target.value }
                    })}
                    placeholder="如: 0 2px 4px rgba(0,0,0,0.1)"
                  />
                </div>
                <div className="designer-properties__section-title">内边距</div>
                <div className="designer-properties__row designer-properties__row--inline">
                  <label>上</label>
                  <input
                    type="number"
                    value={selectedElement.styles?.paddingTop || 0}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, paddingTop: parseInt(e.target.value) || 0 }
                    })}
                    min="0"
                  />
                  <label>右</label>
                  <input
                    type="number"
                    value={selectedElement.styles?.paddingRight || 0}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, paddingRight: parseInt(e.target.value) || 0 }
                    })}
                    min="0"
                  />
                </div>
                <div className="designer-properties__row designer-properties__row--inline">
                  <label>下</label>
                  <input
                    type="number"
                    value={selectedElement.styles?.paddingBottom || 0}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, paddingBottom: parseInt(e.target.value) || 0 }
                    })}
                    min="0"
                  />
                  <label>左</label>
                  <input
                    type="number"
                    value={selectedElement.styles?.paddingLeft || 0}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, paddingLeft: parseInt(e.target.value) || 0 }
                    })}
                    min="0"
                  />
                </div>
                <div className="designer-properties__section-title">外边距</div>
                <div className="designer-properties__row designer-properties__row--inline">
                  <label>上</label>
                  <input
                    type="number"
                    value={selectedElement.styles?.marginTop || 0}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, marginTop: parseInt(e.target.value) || 0 }
                    })}
                  />
                  <label>右</label>
                  <input
                    type="number"
                    value={selectedElement.styles?.marginRight || 0}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, marginRight: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="designer-properties__row designer-properties__row--inline">
                  <label>下</label>
                  <input
                    type="number"
                    value={selectedElement.styles?.marginBottom || 0}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, marginBottom: parseInt(e.target.value) || 0 }
                    })}
                  />
                  <label>左</label>
                  <input
                    type="number"
                    value={selectedElement.styles?.marginLeft || 0}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, marginLeft: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="designer-properties__section-title">操作</div>
                <div className="designer-properties__actions">
                  <button
                    className="designer-properties__action-btn"
                    onClick={() => updateElement(selectedElement.id, { locked: !selectedElement.locked })}
                  >
                    {selectedElement.locked ? <Lock size={14} /> : <Unlock size={14} />}
                    {selectedElement.locked ? '解锁' : '锁定'}
                  </button>
                  <button
                    className="designer-properties__action-btn"
                    onClick={() => updateElement(selectedElement.id, { hidden: !selectedElement.hidden })}
                  >
                    {selectedElement.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                    {selectedElement.hidden ? '显示' : '隐藏'}
                  </button>
                  <button
                    className="designer-properties__action-btn"
                    onClick={() => duplicateElements([selectedElement.id])}
                  >
                    <Copy size={14} />
                    复制
                  </button>
                  <button
                    className="designer-properties__action-btn designer-properties__action-btn--danger"
                    onClick={() => deleteElements([selectedElement.id])}
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="designer-properties__empty">
          <MousePointer2 size={24} />
          <p>{t('designer.selectElement') || '选择元素以编辑属性'}</p>
        </div>
      )}
      </div>

      <div className="designer-panel__header designer-panel__header--layers">
        <Layers size={14} />
        <span>{t('designer.layers') || '控件层次'}</span>
      </div>
      <div className="designer-panel__content designer-panel__content--layers">
        {elements.length === 0 ? (
          <div className="designer-layers__empty">
            {t('designer.noElements') || '暂无元素'}
          </div>
        ) : (
          <div className="designer-layers">
            {elements.map(element => (
              <div
                key={element.id}
                className={`designer-layer ${selectedIds.has(element.id) ? 'is-selected' : ''} ${element.locked ? 'is-locked' : ''} ${element.hidden ? 'is-hidden' : ''} ${draggedLayerId === element.id ? 'is-dragging' : ''}`}
                onClick={() => setSelectedIds(new Set([element.id]))}
                draggable
                onDragStart={(e) => handleLayerDragStart(e, element.id)}
                onDragOver={(e) => handleLayerDragOver(e, element.id)}
                onDragEnd={handleLayerDragEnd}
              >
                <span className="designer-layer__icon">
                  {getIcon(componentRegistry.get(element.type)?.icon || 'square')}
                </span>
                <span className="designer-layer__name">{element.name}</span>
                <div className="designer-layer__actions">
                  {element.locked && <Lock size={12} />}
                  {element.hidden && <EyeOff size={12} />}
                </div>
              </div>
            )).reverse()}
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignerPropertiesPanel;
import './DesignerPropertiesPanel.scss';

