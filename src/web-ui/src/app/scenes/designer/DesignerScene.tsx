import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MousePointer2,
  Move,
  Square,
  Type,
  Image,
  Layout,
  Layers,
  Trash2,
  Copy,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Grid3X3,
  Component,
  ToggleLeft,
  Minus,
  CheckSquare,
  CircleDot,
  List,
  TextCursorInput,
  RectangleHorizontal,
  SlidersHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  BringToFront,
  SendToBack,
  Group,
  Ungroup,
  Palette,
  Type as TypeIcon,
  Square as BorderIcon,
  Code,
  Play,
  Save,
  FolderOpen,
  X,
  Download,
  HelpCircle,
  Move3D,
  Zap,
  Magnet,
  Table,
  Badge,
  User,
  Loader,
  AlertCircle,
  Link,
  Video,
  Music,
  Globe,
  Calendar,
  Clock,
  FileText,
  Star,
  Settings,
  Menu,
  ArrowRight,
  MoreHorizontal,
  Search,
  Hash,
  Key,
  ThumbsUp,
  Plus,
  Minus as MinusIcon,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  Bell,
  MessageSquare,
  SidebarOpen,
  PanelBottom,
  ImagePlus,
  BarChart3,
  GitBranch,
  Timer,
  FileCheck,
  Sparkles,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Columns,
  Rows,
  FormInput,
  Sun,
  Moon,
  Cloud,
  Umbrella,
  Wind,
  Flame,
  Snowflake,
  Leaf,
  Droplets,
  LayoutGrid,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  SquareEqual,
  LayoutTemplate,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { useI18n } from '@/infrastructure/i18n/hooks/useI18n';
import { open as dialogOpen, save as dialogSave } from '@tauri-apps/plugin-dialog';
import { writeFile, readFile } from '@tauri-apps/plugin-fs';
import { configManager } from '@/infrastructure/config/services/ConfigManager';
import { globalAPI } from '@/infrastructure/api/service-api/GlobalAPI';
import { fileSystemService } from '@/tools/file-system/services/FileSystemService';
import { dirnameAbsolutePath } from '@/shared/utils/pathUtils';
import DesignerComponentBox, { DesignerComponent } from './DesignerComponentBox';
import DesignerPropertiesPanel from './DesignerPropertiesPanel';
import { generateNimCode, NimCodeGeneratorOptions, getModuleName } from './NimCodeGenerator';
import { componentRegistry } from './registry/ComponentRegistry';
import './DesignerScene.scss';

interface DesignerElement {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: Record<string, unknown>;
  children?: DesignerElement[];
  locked?: boolean;
  hidden?: boolean;
  groupId?: string;
  styles?: ElementStyles;
  events?: ElementEvents;
  title?: string;
  description?: string;
  className?: string;
  dataAttributes?: Record<string, string>;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  tabIndex?: number;
  // ImGui Window Properties
  imguiWindowProps?: ImGuiWindowProps;
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

interface ElementStyles {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
  opacity?: number;
  boxShadow?: string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  textAlign?: 'left' | 'center' | 'right';
  zIndex?: number;
}

export interface ElementEvents {
  onLoad?: string;
  onUnload?: string;
  onClick?: string;
  onDoubleClick?: string;
  onMouseEnter?: string;
  onMouseLeave?: string;
  onFocus?: string;
  onBlur?: string;
  onChange?: string;
  onKeyDown?: string;
  onKeyUp?: string;
}

interface ResizeState {
  isResizing: boolean;
  direction: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startElementX: number;
  startElementY: number;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  elementId: string | null;
}

interface DesignerSceneProps {
  filePath?: string;
}

const DesignerScene: React.FC<DesignerSceneProps> = ({ filePath }) => {
  const { t } = useI18n('common');
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const pendingCanvasSizeRef = useRef<{ width: number; height: number } | null>(null);
  const selectionBoxRef = useRef<{
    isSelecting: boolean;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const justFinishedSelectionRef = useRef(false);
  const dragStartPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const isLoadingRef = useRef(true); // 标记是否正在加载，加载时不触发自动保存
  const hasLoadedRef = useRef(false); // 标记是否已完成首次加载
  const isActiveRef = useRef(false); // 标记设计器是否处于活动状态
  const isSavingRef = useRef(false); // 标记是否正在保存，避免文件监听触发重新加载
  const lastSaveTimeRef = useRef(0); // 记录最后保存时间，用于忽略保存后的文件变化事件
  const currentFilePathRef = useRef<string>(''); // 跟踪当前文件路径，避免闭包问题
  const currentElementsRef = useRef<DesignerElement[]>([]); // 跟踪当前元素，避免闭包问题
  const currentGroupsRef = useRef<Map<string, string[]>>(new Map()); // 跟踪当前分组
  const currentCanvasSettingsRef = useRef<any>({}); // 跟踪当前画布设置
  
  const [elements, setElements] = useState<DesignerElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(10);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<DesignerElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draggedComponent, setDraggedComponent] = useState<DesignerComponent | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, elementId: null });
  const [groups, setGroups] = useState<Map<string, string[]>>(new Map());
  const [previewMode, setPreviewMode] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    isSelecting: boolean;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [canvasSettings, setCanvasSettings] = useState({
    id: 'canvas-main',
    width: 480,
    height: 360,
    minWidth: undefined as number | undefined,
    maxWidth: undefined as number | undefined,
    minHeight: undefined as number | undefined,
    maxHeight: undefined as number | undefined,
    backgroundColor: '#ffffff',
    name: '窗口1',
    title: '',
    description: '',
    className: '',
    borderColor: '',
    borderWidth: 0,
    borderRadius: 0,
    opacity: 1,
    x: 0,
    y: 0,
    fontSize: 14,
    fontWeight: 'normal',
    boxShadow: '',
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    overflow: 'visible' as 'visible' | 'hidden' | 'scroll' | 'auto',
    ariaLabel: '',
    ariaDescribedBy: '',
    imguiWindowProps: {
      noCollapse: true,
      noTitleBar: true,
    } as ImGuiWindowProps,
    windowIcon: '',
  });
  const [isCanvasSelected, setIsCanvasSelected] = useState(true);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isDraggingPreview, setIsDraggingPreview] = useState(false);
  const [previewDragStart, setPreviewDragStart] = useState({ x: 0, y: 0 });
  const [canvasResizeState, setCanvasResizeState] = useState<{
    direction: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const [alignmentLines, setAlignmentLines] = useState<{
    horizontal: number[];
    vertical: number[];
  }>({ horizontal: [], vertical: [] });
  const [alignmentLinesEnabled, setAlignmentLinesEnabled] = useState(true);
  const [alignmentThreshold, setAlignmentThreshold] = useState(5);
  const [alignmentLineColor, setAlignmentLineColor] = useState('#3b82f6');
  const [alignmentLineStyle, setAlignmentLineStyle] = useState<'solid' | 'dashed'>('dashed');
  const [layoutSpacing, setLayoutSpacing] = useState(10);
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem('designer-leftPanelWidth');
    return saved ? parseInt(saved, 10) : 240;
  });
  const [rightPanelWidth, setRightPanelWidth] = useState(() => {
    const saved = localStorage.getItem('designer-rightPanelWidth');
    return saved ? parseInt(saved, 10) : 270;
  });
  const [isResizingPanel, setIsResizingPanel] = useState<'left' | 'right' | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  useEffect(() => {
    localStorage.setItem('designer-leftPanelWidth', String(leftPanelWidth));
  }, [leftPanelWidth]);

  useEffect(() => {
    localStorage.setItem('designer-rightPanelWidth', String(rightPanelWidth));
  }, [rightPanelWidth]);

  const selectedElement = selectedIds.size === 1 ? elements.find(el => el.id === Array.from(selectedIds)[0]) : null;
  const selectedElements = elements.filter(el => selectedIds.has(el.id));

  const saveHistory = useCallback((newElements: DesignerElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newElements)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  }, [history, historyIndex]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.designer-toolbar__dropdown')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadDesignerConfig = async () => {
      try {
        const config = await configManager.getConfig<{ 
          alignmentLines?: boolean; 
          alignmentThreshold?: number;
          alignmentLineColor?: string;
          alignmentLineStyle?: 'solid' | 'dashed';
          showGrid?: boolean; 
          snapToGrid?: boolean; 
          gridSize?: number;
          layoutSpacing?: number;
        }>('designer');
        if (config) {
          if (config.alignmentLines !== undefined) {
            setAlignmentLinesEnabled(config.alignmentLines);
          }
          if (config.alignmentThreshold !== undefined) {
            setAlignmentThreshold(config.alignmentThreshold);
          }
          if (config.alignmentLineColor !== undefined) {
            setAlignmentLineColor(config.alignmentLineColor);
          }
          if (config.alignmentLineStyle !== undefined) {
            setAlignmentLineStyle(config.alignmentLineStyle);
          }
          if (config.showGrid !== undefined) {
            setShowGrid(config.showGrid);
          }
          if (config.snapToGrid !== undefined) {
            setSnapToGrid(config.snapToGrid);
          }
          if (config.gridSize !== undefined) {
            setGridSize(config.gridSize);
          }
          if (config.layoutSpacing !== undefined) {
            setLayoutSpacing(config.layoutSpacing);
          }
        }
      } catch (error) {
        console.error('Failed to load designer config:', error);
      }
    };
    loadDesignerConfig();

    const unsubscribe = configManager.onConfigChange((path, oldValue, newValue) => {
      if (path === 'designer') {
        const config = newValue as { 
          alignmentLines?: boolean; 
          alignmentThreshold?: number;
          alignmentLineColor?: string;
          alignmentLineStyle?: 'solid' | 'dashed';
          showGrid?: boolean; 
          snapToGrid?: boolean; 
          gridSize?: number;
          layoutSpacing?: number;
        };
        if (config) {
          if (config.alignmentLines !== undefined) {
            setAlignmentLinesEnabled(config.alignmentLines);
          }
          if (config.alignmentThreshold !== undefined) {
            setAlignmentThreshold(config.alignmentThreshold);
          }
          if (config.alignmentLineColor !== undefined) {
            setAlignmentLineColor(config.alignmentLineColor);
          }
          if (config.alignmentLineStyle !== undefined) {
            setAlignmentLineStyle(config.alignmentLineStyle);
          }
          if (config.showGrid !== undefined) {
            setShowGrid(config.showGrid);
          }
          if (config.snapToGrid !== undefined) {
            setSnapToGrid(config.snapToGrid);
          }
          if (config.gridSize !== undefined) {
            setGridSize(config.gridSize);
          }
          if (config.layoutSpacing !== undefined) {
            setLayoutSpacing(config.layoutSpacing);
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 当 filePath prop 变化时自动加载设计文件，并监听文件变化
  useEffect(() => {
    if (!filePath) return;

    // 更新当前文件路径 ref
    currentFilePathRef.current = filePath;

    // 切换文件时重置加载状态
    isLoadingRef.current = true;
    hasLoadedRef.current = false;

    const normalizedFilePath = filePath.replace(/\\/g, '/');
    const dirPath = dirnameAbsolutePath(filePath);

    // 加载设计文件
    const loadDesignFromPath = async (preserveSelection = false) => {
      try {
        isLoadingRef.current = true;
        const fileData = await readFile(filePath);
        const decoder = new TextDecoder();
        const json = decoder.decode(fileData);
        const design = JSON.parse(json);
        
        if (design.elements) {
          setElements(design.elements);
          if (design.groups) {
            setGroups(new Map(design.groups));
          }
          if (design.canvasSettings) {
            setCanvasSettings(design.canvasSettings);
          }
          saveHistory(design.elements);
          
          if (preserveSelection) {
            setSelectedIds(prevIds => {
              const newIds = new Set<string>();
              const elementIds = new Set(design.elements.map((e: DesignerElement) => e.id));
              prevIds.forEach(id => {
                if (elementIds.has(id)) {
                  newIds.add(id);
                }
              });
              return newIds;
            });
          } else {
            setSelectedIds(new Set());
          }
        }
        setTimeout(() => {
          isLoadingRef.current = false;
          hasLoadedRef.current = true;
        }, 100);
      } catch (error) {
        console.error('加载设计文件失败:', error);
        isLoadingRef.current = false;
        hasLoadedRef.current = true;
      }
    };
    loadDesignFromPath();

    // 监听文件变化
    if (!dirPath) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const unwatch = fileSystemService.watchFileChanges(dirPath, (event) => {
      const eventPath = event.path.replace(/\\/g, '/');
      
      if (eventPath !== normalizedFilePath) {
        return;
      }
      if (event.type !== 'modified') {
        return;
      }
      
      if (isSavingRef.current) {
        return;
      }
      
      const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
      if (timeSinceLastSave < 1000) {
        return;
      }

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        loadDesignFromPath(true);
      }, 300);
    });

    return () => {
      unwatch();
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [filePath]);

  // 同步状态到 ref，避免闭包问题
  useEffect(() => {
    currentElementsRef.current = elements;
  }, [elements]);

  useEffect(() => {
    currentGroupsRef.current = groups;
  }, [groups]);

  useEffect(() => {
    currentCanvasSettingsRef.current = canvasSettings;
  }, [canvasSettings]);

  // 自动保存：当设计发生变化时自动保存布局文件和代码文件
  useEffect(() => {
    if (!filePath) return;
    if (!hasLoadedRef.current) return;
    if (isLoadingRef.current) return;

    let saveTimer: ReturnType<typeof setTimeout> | null = null;

    saveTimer = setTimeout(async () => {
      if (isLoadingRef.current) return;
      
      const currentFilePath = currentFilePathRef.current;
      const currentElements = currentElementsRef.current;
      const currentGroups = currentGroupsRef.current;
      const currentCanvasSettings = currentCanvasSettingsRef.current;
      
      if (currentFilePath !== filePath) {
        return;
      }
      
      try {
        isSavingRef.current = true;
        lastSaveTimeRef.current = Date.now();
        
        const workspacePath = await globalAPI.getCurrentWorkspacePath();
        if (!workspacePath) {
          isSavingRef.current = false;
          return;
        }

        const normalizedWorkspacePath = workspacePath.replace(/\\/g, '/');
        const designFilePath = currentFilePath;
        
        const design = {
          elements: currentElements,
          groups: Array.from(currentGroups.entries()),
          canvasSettings: currentCanvasSettings,
          version: '1.0',
        };
        const json = JSON.stringify(design, null, 2);
        const encoder = new TextEncoder();
        await writeFile(designFilePath, encoder.encode(json));

        const designFileName = currentFilePath.split(/[/\\]/).pop() || '窗口';
        const fileBaseName = designFileName.replace(/\.设计$/, '');
        const windowName = currentCanvasSettings.name || fileBaseName;
        const moduleName = getModuleName(windowName);
        
        const options: NimCodeGeneratorOptions = {
          appName: windowName,
          windowWidth: currentCanvasSettings.width || 800,
          windowHeight: currentCanvasSettings.height || 600,
          elements: currentElements,
          imguiWindowProps: currentCanvasSettings.imguiWindowProps,
          backgroundColor: currentCanvasSettings.backgroundColor,
          windowIcon: currentCanvasSettings.windowIcon,
          windowName: windowName,
          isMainWindow: true,
        };
        
        const generatedCode = generateNimCode(options);
        const targetDir = normalizedWorkspacePath;
        
        const uiPath = `${targetDir}/界面_${moduleName}.灵`;
        const logicPath = `${targetDir}/交互_${moduleName}.灵`;
        
        await writeFile(uiPath, encoder.encode(generatedCode.ui));
        
        try {
          await readFile(logicPath);
        } catch {
          await writeFile(logicPath, encoder.encode(generatedCode.logic));
        }
        
        const mainPath = `${targetDir}/主入口.灵`;
        const configPath = `${targetDir}/kl.cfg`;
        
        await writeFile(mainPath, encoder.encode(generatedCode.main));
        
        try {
          await readFile(configPath);
        } catch {
          await writeFile(configPath, encoder.encode(generatedCode.config));
        }
        
        lastSaveTimeRef.current = Date.now();
        setTimeout(() => {
          isSavingRef.current = false;
        }, 1000);
      } catch (error) {
        console.error('[自动保存] 保存失败:', error);
        isSavingRef.current = false;
      }
    }, 500); // 500ms 防抖

    return () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
    };
  }, [filePath, elements, groups, canvasSettings]);

  const toggleShowGrid = useCallback(async () => {
    const newValue = !showGrid;
    setShowGrid(newValue);
    try {
      const currentConfig = await configManager.getConfig<{ showGrid?: boolean; snapToGrid?: boolean; gridSize?: number; alignmentLines?: boolean }>('designer') || {};
      await configManager.set('designer', { ...currentConfig, showGrid: newValue });
    } catch (error) {
      console.error('Failed to save grid config:', error);
    }
  }, [showGrid]);

  const toggleSnapToGrid = useCallback(async () => {
    const newValue = !snapToGrid;
    setSnapToGrid(newValue);
    try {
      const currentConfig = await configManager.getConfig<{ showGrid?: boolean; snapToGrid?: boolean; gridSize?: number; alignmentLines?: boolean }>('designer') || {};
      await configManager.set('designer', { ...currentConfig, snapToGrid: newValue });
    } catch (error) {
      console.error('Failed to save snap to grid config:', error);
    }
  }, [snapToGrid]);

  const snapToGridValue = useCallback((value: number): number => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  const calculateAlignmentLines = useCallback((draggedElement: DesignerElement | null) => {
    if (!alignmentLinesEnabled) {
      setAlignmentLines({ horizontal: [], vertical: [] });
      return;
    }
    
    if (!draggedElement) {
      setAlignmentLines({ horizontal: [], vertical: [] });
      return;
    }

    const THRESHOLD = alignmentThreshold;
    const horizontalLines: number[] = [];
    const verticalLines: number[] = [];

    const draggedLeft = draggedElement.x;
    const draggedRight = draggedElement.x + draggedElement.width;
    const draggedTop = draggedElement.y;
    const draggedBottom = draggedElement.y + draggedElement.height;
    const draggedCenterX = draggedElement.x + draggedElement.width / 2;
    const draggedCenterY = draggedElement.y + draggedElement.height / 2;

    elements.forEach(el => {
      if (selectedIds.has(el.id)) return;

      const elLeft = el.x;
      const elRight = el.x + el.width;
      const elTop = el.y;
      const elBottom = el.y + el.height;
      const elCenterX = el.x + el.width / 2;
      const elCenterY = el.y + el.height / 2;

      if (Math.abs(draggedLeft - elLeft) < THRESHOLD) verticalLines.push(elLeft);
      if (Math.abs(draggedRight - elRight) < THRESHOLD) verticalLines.push(elRight);
      if (Math.abs(draggedLeft - elRight) < THRESHOLD) verticalLines.push(elRight);
      if (Math.abs(draggedRight - elLeft) < THRESHOLD) verticalLines.push(elLeft);
      if (Math.abs(draggedCenterX - elCenterX) < THRESHOLD) verticalLines.push(elCenterX);

      if (Math.abs(draggedTop - elTop) < THRESHOLD) horizontalLines.push(elTop);
      if (Math.abs(draggedBottom - elBottom) < THRESHOLD) horizontalLines.push(elBottom);
      if (Math.abs(draggedTop - elBottom) < THRESHOLD) horizontalLines.push(elBottom);
      if (Math.abs(draggedBottom - elTop) < THRESHOLD) horizontalLines.push(elTop);
      if (Math.abs(draggedCenterY - elCenterY) < THRESHOLD) horizontalLines.push(elCenterY);
    });

    if (Math.abs(draggedLeft) < THRESHOLD) verticalLines.push(0);
    if (Math.abs(draggedRight - canvasSettings.width) < THRESHOLD) verticalLines.push(canvasSettings.width);
    if (Math.abs(draggedCenterX - canvasSettings.width / 2) < THRESHOLD) verticalLines.push(canvasSettings.width / 2);

    if (Math.abs(draggedTop) < THRESHOLD) horizontalLines.push(0);
    if (Math.abs(draggedBottom - canvasSettings.height) < THRESHOLD) horizontalLines.push(canvasSettings.height);
    if (Math.abs(draggedCenterY - canvasSettings.height / 2) < THRESHOLD) horizontalLines.push(canvasSettings.height / 2);

    setAlignmentLines({ horizontal: horizontalLines, vertical: verticalLines });
  }, [elements, selectedIds, canvasSettings.width, canvasSettings.height, alignmentLinesEnabled, alignmentThreshold]);

  const generateId = () => `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addElement = useCallback((component: DesignerComponent, x: number, y: number) => {
    const newElement: DesignerElement = {
      id: generateId(),
      type: component.id,
      name: `${component.name}${elements.filter(e => e.type === component.id).length + 1}`,
      x,
      y,
      width: component.defaultSize.width,
      height: component.defaultSize.height,
      props: { ...component.defaultProps },
      styles: {},
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedIds(new Set([newElement.id]));
    saveHistory(newElements);
  }, [elements, saveHistory]);

  const updateElement = useCallback((id: string, updates: Partial<DesignerElement>) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    setElements(newElements);
    saveHistory(newElements);
  }, [elements, saveHistory]);

  const updateElements = useCallback((ids: string[], updates: Partial<DesignerElement>) => {
    const newElements = elements.map(el => 
      ids.includes(el.id) ? { ...el, ...updates } : el
    );
    setElements(newElements);
    saveHistory(newElements);
  }, [elements, saveHistory]);

  const constrainElementsToCanvas = useCallback((newWidth: number, newHeight: number) => {
    const needsUpdate = elements.some(el => 
      el.x + el.width > newWidth || el.y + el.height > newHeight || el.x < 0 || el.y < 0
    );
    if (needsUpdate) {
      const newElements = elements.map(el => {
        const maxX = newWidth - el.width;
        const maxY = newHeight - el.height;
        const newX = Math.max(0, Math.min(maxX, el.x));
        const newY = Math.max(0, Math.min(maxY, el.y));
        return { ...el, x: newX, y: newY };
      });
      setElements(newElements);
      saveHistory(newElements);
    }
  }, [elements, saveHistory]);

  const deleteElements = useCallback((ids: string[]) => {
    const newElements = elements.filter(el => !ids.includes(el.id));
    setElements(newElements);
    setSelectedIds(new Set());
    saveHistory(newElements);
  }, [elements, saveHistory]);

  const duplicateElements = useCallback((ids: string[]) => {
    const newElements: DesignerElement[] = [];
    ids.forEach(id => {
      const element = elements.find(el => el.id === id);
      if (element) {
        newElements.push({
          ...element,
          id: generateId(),
          name: `${element.name} 副本`,
          x: element.x + 20,
          y: element.y + 20,
        });
      }
    });
    const allNewElements = [...elements, ...newElements];
    setElements(allNewElements);
    setSelectedIds(new Set(newElements.map(el => el.id)));
    saveHistory(allNewElements);
  }, [elements, saveHistory]);

  const bringToFront = useCallback((ids: string[]) => {
    const selectedElements = elements.filter(el => ids.includes(el.id));
    const otherElements = elements.filter(el => !ids.includes(el.id));
    const newElements = [...otherElements, ...selectedElements];
    setElements(newElements);
    saveHistory(newElements);
  }, [elements, saveHistory]);

  const sendToBack = useCallback((ids: string[]) => {
    const selectedElements = elements.filter(el => ids.includes(el.id));
    const otherElements = elements.filter(el => !ids.includes(el.id));
    const newElements = [...selectedElements, ...otherElements];
    setElements(newElements);
    saveHistory(newElements);
  }, [elements, saveHistory]);

  const alignElements = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedElements.length < 2) return;
    
    const minX = Math.min(...selectedElements.map(el => el.x));
    const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
    const minY = Math.min(...selectedElements.map(el => el.y));
    const maxY = Math.max(...selectedElements.map(el => el.y + el.height));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const updates: { id: string; x?: number; y?: number }[] = [];
    
    selectedElements.forEach(el => {
      switch (alignment) {
        case 'left':
          updates.push({ id: el.id, x: minX });
          break;
        case 'center':
          updates.push({ id: el.id, x: centerX - el.width / 2 });
          break;
        case 'right':
          updates.push({ id: el.id, x: maxX - el.width });
          break;
        case 'top':
          updates.push({ id: el.id, y: minY });
          break;
        case 'middle':
          updates.push({ id: el.id, y: centerY - el.height / 2 });
          break;
        case 'bottom':
          updates.push({ id: el.id, y: maxY - el.height });
          break;
      }
    });

    const newElements = elements.map(el => {
      const update = updates.find(u => u.id === el.id);
      return update ? { ...el, ...update } : el;
    });
    setElements(newElements);
    saveHistory(newElements);
  }, [selectedElements, elements, saveHistory]);

  const distributeElements = useCallback((direction: 'horizontal' | 'vertical') => {
    if (selectedElements.length < 3) return;
    
    const sorted = [...selectedElements].sort((a, b) => 
      direction === 'horizontal' ? a.x - b.x : a.y - b.y
    );
    
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    if (direction === 'horizontal') {
      const totalWidth = sorted.reduce((sum, el) => sum + el.width, 0);
      const totalSpace = (last.x + last.width) - first.x - totalWidth;
      const spacing = totalSpace / (sorted.length - 1);
      
      let currentX = first.x;
      const updates: { id: string; x: number }[] = [];
      
      sorted.forEach((el, index) => {
        if (index === 0) {
          updates.push({ id: el.id, x: currentX });
        } else if (index === sorted.length - 1) {
          updates.push({ id: el.id, x: last.x });
        } else {
          currentX += sorted[index - 1].width + spacing;
          updates.push({ id: el.id, x: currentX });
        }
      });
      
      const newElements = elements.map(el => {
        const update = updates.find(u => u.id === el.id);
        return update ? { ...el, x: update.x } : el;
      });
      setElements(newElements);
      saveHistory(newElements);
    } else {
      const totalHeight = sorted.reduce((sum, el) => sum + el.height, 0);
      const totalSpace = (last.y + last.height) - first.y - totalHeight;
      const spacing = totalSpace / (sorted.length - 1);
      
      let currentY = first.y;
      const updates: { id: string; y: number }[] = [];
      
      sorted.forEach((el, index) => {
        if (index === 0) {
          updates.push({ id: el.id, y: currentY });
        } else if (index === sorted.length - 1) {
          updates.push({ id: el.id, y: last.y });
        } else {
          currentY += sorted[index - 1].height + spacing;
          updates.push({ id: el.id, y: currentY });
        }
      });
      
      const newElements = elements.map(el => {
        const update = updates.find(u => u.id === el.id);
        return update ? { ...el, y: update.y } : el;
      });
      setElements(newElements);
      saveHistory(newElements);
    }
  }, [selectedElements, elements, saveHistory]);

  const makeEqualWidth = useCallback(() => {
    if (selectedElements.length < 2) return;
    
    const maxWidth = Math.max(...selectedElements.map(el => el.width));
    
    const newElements = elements.map(el => 
      selectedIds.has(el.id) ? { ...el, width: maxWidth } : el
    );
    setElements(newElements);
    saveHistory(newElements);
  }, [selectedElements, elements, selectedIds, saveHistory]);

  const makeEqualHeight = useCallback(() => {
    if (selectedElements.length < 2) return;
    
    const maxHeight = Math.max(...selectedElements.map(el => el.height));
    
    const newElements = elements.map(el => 
      selectedIds.has(el.id) ? { ...el, height: maxHeight } : el
    );
    setElements(newElements);
    saveHistory(newElements);
  }, [selectedElements, elements, selectedIds, saveHistory]);

  const makeEqualSize = useCallback(() => {
    if (selectedElements.length < 2) return;
    
    const maxWidth = Math.max(...selectedElements.map(el => el.width));
    const maxHeight = Math.max(...selectedElements.map(el => el.height));
    
    const newElements = elements.map(el => 
      selectedIds.has(el.id) ? { ...el, width: maxWidth, height: maxHeight } : el
    );
    setElements(newElements);
    saveHistory(newElements);
  }, [selectedElements, elements, selectedIds, saveHistory]);

  const autoLayout = useCallback((type: 'grid' | 'horizontal' | 'vertical') => {
    if (selectedElements.length < 2) return;
    
    const PADDING = layoutSpacing;
    const sorted = [...selectedElements].sort((a, b) => {
      if (type === 'vertical') return a.y - b.y;
      if (type === 'horizontal') return a.x - b.x;
      return (a.y * 1000 + a.x) - (b.y * 1000 + b.x);
    });
    
    const updates: { id: string; x: number; y: number }[] = [];
    
    if (type === 'horizontal') {
      let currentX = 0;
      sorted.forEach(el => {
        updates.push({ id: el.id, x: currentX, y: 0 });
        currentX += el.width + PADDING;
      });
    } else if (type === 'vertical') {
      let currentY = 0;
      sorted.forEach(el => {
        updates.push({ id: el.id, x: 0, y: currentY });
        currentY += el.height + PADDING;
      });
    } else {
      const cols = Math.ceil(Math.sqrt(sorted.length));
      
      let currentX = 0;
      let currentY = 0;
      let rowMaxHeight = 0;
      
      sorted.forEach((el, index) => {
        const col = index % cols;
        
        if (col === 0 && index > 0) {
          currentX = 0;
          currentY += rowMaxHeight + PADDING;
          rowMaxHeight = 0;
        }
        
        updates.push({ id: el.id, x: currentX, y: currentY });
        
        currentX += el.width + PADDING;
        if (el.height > rowMaxHeight) {
          rowMaxHeight = el.height;
        }
      });
    }
    
    const constrainedUpdates = updates.map(update => {
      const el = sorted.find(e => e.id === update.id);
      if (!el) return update;
      
      const newX = Math.max(0, Math.min(update.x, canvasSettings.width - el.width));
      const newY = Math.max(0, Math.min(update.y, canvasSettings.height - el.height));
      
      return { id: update.id, x: newX, y: newY };
    });
    
    const newElements = elements.map(el => {
      const update = constrainedUpdates.find(u => u.id === el.id);
      return update ? { ...el, x: update.x, y: update.y } : el;
    });
    setElements(newElements);
    saveHistory(newElements);
  }, [selectedElements, elements, saveHistory, canvasSettings.width, canvasSettings.height, layoutSpacing]);

  const flipElements = useCallback((direction: 'horizontal' | 'vertical') => {
    if (selectedElements.length < 1) return;
    
    const minX = Math.min(...selectedElements.map(el => el.x));
    const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
    const minY = Math.min(...selectedElements.map(el => el.y));
    const maxY = Math.max(...selectedElements.map(el => el.y + el.height));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const updates: { id: string; x?: number; y?: number }[] = [];
    
    selectedElements.forEach(el => {
      if (direction === 'horizontal') {
        const newX = centerX - (el.x + el.width / 2 - centerX) - el.width / 2;
        updates.push({ id: el.id, x: newX });
      } else {
        const newY = centerY - (el.y + el.height / 2 - centerY) - el.height / 2;
        updates.push({ id: el.id, y: newY });
      }
    });
    
    const newElements = elements.map(el => {
      const update = updates.find(u => u.id === el.id);
      return update ? { ...el, ...update } : el;
    });
    setElements(newElements);
    saveHistory(newElements);
  }, [selectedElements, elements, saveHistory]);

  const matchCanvasWidth = useCallback(() => {
    if (selectedElements.length < 1) return;
    
    const newElements = elements.map(el => 
      selectedIds.has(el.id) ? { ...el, width: canvasSettings.width, x: 0 } : el
    );
    setElements(newElements);
    saveHistory(newElements);
  }, [selectedElements, elements, selectedIds, canvasSettings.width, saveHistory]);

  const matchCanvasHeight = useCallback(() => {
    if (selectedElements.length < 1) return;
    
    const newElements = elements.map(el => 
      selectedIds.has(el.id) ? { ...el, height: canvasSettings.height, y: 0 } : el
    );
    setElements(newElements);
    saveHistory(newElements);
  }, [selectedElements, elements, selectedIds, canvasSettings.height, saveHistory]);

  const matchCanvasSize = useCallback(() => {
    if (selectedElements.length < 1) return;
    
    const newElements = elements.map(el => 
      selectedIds.has(el.id) ? { ...el, width: canvasSettings.width, height: canvasSettings.height, x: 0, y: 0 } : el
    );
    setElements(newElements);
    saveHistory(newElements);
  }, [selectedElements, elements, selectedIds, canvasSettings.width, canvasSettings.height, saveHistory]);

  const resetSize = useCallback(() => {
    if (selectedElements.length < 1) return;
    
    const DEFAULT_SIZES: Record<string, { width: number; height: number }> = {
      '按钮': { width: 80, height: 32 },
      '标签': { width: 60, height: 24 },
      '文本框': { width: 200, height: 32 },
      '复选框': { width: 100, height: 24 },
      '单选按钮': { width: 100, height: 24 },
      '下拉框': { width: 150, height: 32 },
      '列表框': { width: 150, height: 120 },
      '图片框': { width: 100, height: 100 },
      '面板': { width: 200, height: 150 },
      '分组框': { width: 200, height: 150 },
      '开关': { width: 50, height: 24 },
      '滑块': { width: 150, height: 24 },
      '进度条': { width: 150, height: 24 },
      '日期选择': { width: 150, height: 32 },
      '时间选择': { width: 150, height: 32 },
      '颜色选择': { width: 100, height: 32 },
      '数字输入': { width: 100, height: 32 },
      '文本区域': { width: 200, height: 100 },
      '链接': { width: 80, height: 24 },
      '图标': { width: 32, height: 32 },
      '头像': { width: 40, height: 40 },
      '徽章': { width: 60, height: 24 },
      '标签页': { width: 300, height: 200 },
      '卡片': { width: 250, height: 150 },
      '表格': { width: 400, height: 200 },
      '树形控件': { width: 200, height: 200 },
      '菜单': { width: 200, height: 40 },
      '步骤条': { width: 300, height: 60 },
      '面包屑': { width: 200, height: 32 },
      '分页': { width: 300, height: 32 },
      '日历': { width: 280, height: 280 },
      '时间轴': { width: 200, height: 200 },
      '轮播图': { width: 400, height: 200 },
      '图表': { width: 400, height: 300 },
      '导航栏': { width: 480, height: 32 },
      '侧边栏': { width: 200, height: 300 },
      '页脚': { width: 480, height: 60 },
      '加载动画': { width: 40, height: 40 },
      '提示框': { width: 200, height: 80 },
      '警告框': { width: 200, height: 80 },
      '对话框': { width: 300, height: 200 },
      '抽屉': { width: 300, height: 400 },
      '弹出框': { width: 200, height: 100 },
      '工具提示': { width: 100, height: 32 },
      '气泡卡片': { width: 200, height: 100 },
      '空状态': { width: 200, height: 150 },
      '结果页': { width: 300, height: 200 },
      '描述列表': { width: 300, height: 100 },
      '统计数值': { width: 120, height: 60 },
      '评论': { width: 300, height: 80 },
      '时间选择器': { width: 150, height: 32 },
      '上传': { width: 100, height: 100 },
      '评分': { width: 150, height: 24 },
      '穿梭框': { width: 400, height: 200 },
      '级联选择': { width: 200, height: 32 },
      '提及': { width: 200, height: 32 },
    };
    
    const newElements = elements.map(el => {
      if (!selectedIds.has(el.id)) return el;
      const defaultSize = DEFAULT_SIZES[el.type] || { width: 100, height: 100 };
      return { ...el, width: defaultSize.width, height: defaultSize.height };
    });
    setElements(newElements);
    saveHistory(newElements);
  }, [selectedElements, elements, selectedIds, saveHistory]);

  const groupElements = useCallback((ids: string[]) => {
    if (ids.length < 2) return;
    const groupId = `group_${generateId()}`;
    const newGroups = new Map(groups);
    newGroups.set(groupId, ids);
    setGroups(newGroups);
    
    const newElements = elements.map(el => 
      ids.includes(el.id) ? { ...el, groupId } : el
    );
    setElements(newElements);
    saveHistory(newElements);
  }, [elements, groups, saveHistory]);

  const ungroupElements = useCallback((ids: string[]) => {
    const newGroups = new Map(groups);
    ids.forEach(id => {
      const element = elements.find(el => el.id === id);
      if (element?.groupId) {
        newGroups.delete(element.groupId);
      }
    });
    setGroups(newGroups);
    
    const newElements = elements.map(el => 
      ids.includes(el.id) ? { ...el, groupId: undefined } : el
    );
    setElements(newElements);
    saveHistory(newElements);
  }, [elements, groups, saveHistory]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (justFinishedSelectionRef.current) {
      justFinishedSelectionRef.current = false;
      return;
    }
    if (e.target === canvasRef.current) {
      setSelectedIds(new Set());
      setIsCanvasSelected(true);
    }
    setContextMenu({ visible: false, x: 0, y: 0, elementId: null });
  };

  const handleCanvasMouseDownForSelection = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    const target = e.target as HTMLElement;
    const isOnElement = target.closest('.designer-element') !== null;
    const isOnResizeHandle = target.closest('.designer-canvas__resize') !== null;
    
    if (isOnElement || isOnResizeHandle) return;
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    const x = (e.clientX - canvasRect.left - canvasPan.x) / zoom;
    const y = (e.clientY - canvasRect.top - canvasPan.y) / zoom;
    
    const newBox = {
      isSelecting: true,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    };
    selectionBoxRef.current = newBox;
    setSelectionBox(newBox);
    setSelectedIds(new Set());
    setIsCanvasSelected(false);
  };

  const handleCanvasResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    setCanvasResizeState({
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: canvasSettings.width,
      startHeight: canvasSettings.height,
    });
  };

  const handlePreviewDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingPreview(true);
    setPreviewDragStart({ x: e.clientX - previewPosition.x, y: e.clientY - previewPosition.y });
  };

  const closePreview = () => {
    setPreviewMode(false);
    setPreviewPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (!isDraggingPreview) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPreviewPosition({
        x: e.clientX - previewDragStart.x,
        y: e.clientY - previewDragStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsDraggingPreview(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPreview, previewDragStart]);

  const handleElementClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setIsCanvasSelected(false);
    if (e.shiftKey) {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedIds(newSelected);
    } else {
      setSelectedIds(new Set([id]));
    }
  };

  const handleElementMouseDown = (e: React.MouseEvent, element: DesignerElement) => {
    if (element.locked) return;
    e.stopPropagation();
    
    if (!selectedIds.has(element.id)) {
      if (e.shiftKey) {
        setSelectedIds(new Set([...selectedIds, element.id]));
      } else {
        setSelectedIds(new Set([element.id]));
      }
    }
    
    const currentSelectedIds = selectedIds.has(element.id) ? selectedIds : new Set([element.id]);
    
    const startPositions = new Map<string, { x: number; y: number }>();
    elements.forEach(el => {
      if (currentSelectedIds.has(el.id)) {
        startPositions.set(el.id, { x: el.x, y: el.y });
      }
    });
    dragStartPositionsRef.current = startPositions;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, element: DesignerElement, direction: string) => {
    if (element.locked) return;
    e.stopPropagation();
    e.preventDefault();
    
    setResizeState({
      isResizing: true,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: element.width,
      startHeight: element.height,
      startElementX: element.x,
      startElementY: element.y,
    });
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (selectionBoxRef.current?.isSelecting && canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - canvasRect.left - canvasPan.x) / zoom;
        const y = (e.clientY - canvasRect.top - canvasPan.y) / zoom;
        
        const newBox = {
          ...selectionBoxRef.current,
          endX: x,
          endY: y,
        };
        selectionBoxRef.current = newBox;
        setSelectionBox(newBox);
      }
    };

    const handleGlobalMouseUp = () => {
      if (selectionBoxRef.current?.isSelecting) {
        const box = selectionBoxRef.current;
        const minX = Math.min(box.startX, box.endX);
        const maxX = Math.max(box.startX, box.endX);
        const minY = Math.min(box.startY, box.endY);
        const maxY = Math.max(box.startY, box.endY);
        
        const width = maxX - minX;
        const height = maxY - minY;
        const wasRealSelection = width > 5 || height > 5;
        
        if (wasRealSelection) {
          const selectedElements = elements.filter(el => {
            const elRight = el.x + el.width;
            const elBottom = el.y + el.height;
            return el.x < maxX && elRight > minX && el.y < maxY && elBottom > minY;
          });
          
          if (selectedElements.length > 0) {
            setSelectedIds(new Set(selectedElements.map(el => el.id)));
          }
          justFinishedSelectionRef.current = true;
        }
        
        selectionBoxRef.current = null;
        setSelectionBox(null);
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [elements, zoom, canvasPan]);

  useEffect(() => {
    if (!canvasResizeState && !resizeState && !isDragging && !isPanning) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (canvasResizeState) {
        const deltaX = (e.clientX - canvasResizeState.startX) / zoom;
        const deltaY = (e.clientY - canvasResizeState.startY) / zoom;
        
        let newWidth = canvasResizeState.startWidth;
        let newHeight = canvasResizeState.startHeight;
        
        if (canvasResizeState.direction.includes('e')) {
          newWidth = Math.max(200, canvasResizeState.startWidth + deltaX);
        }
        if (canvasResizeState.direction.includes('w')) {
          newWidth = Math.max(200, canvasResizeState.startWidth - deltaX);
        }
        if (canvasResizeState.direction.includes('s')) {
          newHeight = Math.max(200, canvasResizeState.startHeight + deltaY);
        }
        if (canvasResizeState.direction.includes('n')) {
          newHeight = Math.max(200, canvasResizeState.startHeight - deltaY);
        }
        
        const roundedWidth = snapToGridValue(newWidth);
        const roundedHeight = snapToGridValue(newHeight);
        pendingCanvasSizeRef.current = { width: roundedWidth, height: roundedHeight };
        
        setCanvasSettings(prev => ({
          ...prev,
          width: roundedWidth,
          height: roundedHeight,
        }));
        return;
      }

      if (resizeState && selectedElement) {
        const deltaX = (e.clientX - resizeState.startX) / zoom;
        const deltaY = (e.clientY - resizeState.startY) / zoom;
        
        let newWidth = resizeState.startWidth;
        let newHeight = resizeState.startHeight;
        let newX = resizeState.startElementX;
        let newY = resizeState.startElementY;
        
        if (resizeState.direction.includes('e')) {
          newWidth = Math.max(20, Math.min(canvasSettings.width - newX, resizeState.startWidth + deltaX));
        }
        if (resizeState.direction.includes('w')) {
          newWidth = Math.max(20, Math.min(resizeState.startWidth + resizeState.startElementX, resizeState.startWidth - deltaX));
          newX = Math.max(0, resizeState.startElementX + (resizeState.startWidth - newWidth));
        }
        if (resizeState.direction.includes('s')) {
          newHeight = Math.max(20, Math.min(canvasSettings.height - newY, resizeState.startHeight + deltaY));
        }
        if (resizeState.direction.includes('n')) {
          newHeight = Math.max(20, Math.min(resizeState.startHeight + resizeState.startElementY, resizeState.startHeight - deltaY));
          newY = Math.max(0, resizeState.startElementY + (resizeState.startHeight - newHeight));
        }
        
        updateElement(selectedElement.id, { 
          width: snapToGridValue(newWidth), 
          height: snapToGridValue(newHeight),
          x: snapToGridValue(newX),
          y: snapToGridValue(newY),
        });
        return;
      }

      if (isPanning) {
        setCanvasPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
        return;
      }

      if (isDragging && selectedIds.size > 0 && canvasRef.current && dragStartPositionsRef.current.size > 0) {
        const deltaX = (e.clientX - dragOffset.x) / zoom;
        const deltaY = (e.clientY - dragOffset.y) / zoom;
        
        const newPositions = new Map<string, { x: number; y: number }>();
        dragStartPositionsRef.current.forEach((pos, id) => {
          let newX = pos.x + deltaX;
          let newY = pos.y + deltaY;
          
          const el = elements.find(e => e.id === id);
          if (el) {
            const maxX = canvasSettings.width - el.width;
            const maxY = canvasSettings.height - el.height;
            newX = Math.max(0, Math.min(maxX, newX));
            newY = Math.max(0, Math.min(maxY, newY));
          }
          
          newPositions.set(id, { x: snapToGridValue(newX), y: snapToGridValue(newY) });
        });
        
        setElements(prev => {
          const newElements = prev.map(el => {
            const newPos = newPositions.get(el.id);
            if (newPos) {
              return { ...el, x: newPos.x, y: newPos.y };
            }
            return el;
          });
          
          const firstSelectedId = Array.from(selectedIds)[0];
          const draggedElement = newElements.find(el => el.id === firstSelectedId);
          if (draggedElement) {
            calculateAlignmentLines(draggedElement);
          }
          
          return newElements;
        });
      }
    };

    const handleGlobalMouseUp = () => {
      if (canvasResizeState && pendingCanvasSizeRef.current) {
        constrainElementsToCanvas(pendingCanvasSizeRef.current.width, pendingCanvasSizeRef.current.height);
        pendingCanvasSizeRef.current = null;
      }
      if (isDragging && dragStartPositionsRef.current.size > 0) {
        saveHistory(elements);
      }
      dragStartPositionsRef.current = new Map();
      setIsDragging(false);
      setResizeState(null);
      setIsPanning(false);
      setCanvasResizeState(null);
      setAlignmentLines({ horizontal: [], vertical: [] });
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [canvasResizeState, resizeState, isDragging, isPanning, zoom, selectedElement, updateElement, canvasSettings, panStart, selectedIds, dragOffset, elements, canvasRef, constrainElementsToCanvas, snapToGridValue, canvasPan, saveHistory, calculateAlignmentLines]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasPan.x, y: e.clientY - canvasPan.y });
    }
  };

  const handleContextMenu = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      elementId,
    });
    if (!selectedIds.has(elementId)) {
      setSelectedIds(new Set([elementId]));
    }
  };

  const handleDragStart = (e: React.DragEvent, component: DesignerComponent) => {
    setDraggedComponent(component);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedComponent || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - canvasRect.left - canvasPan.x) / zoom - draggedComponent.defaultSize.width / 2;
    const y = (e.clientY - canvasRect.top - canvasPan.y) / zoom - draggedComponent.defaultSize.height / 2;
    addElement(draggedComponent, snapToGridValue(x), snapToGridValue(y));
    setDraggedComponent(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const toggleLayer = (id: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedLayers(newExpanded);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 只有活动的设计器才响应键盘事件
      if (!isActiveRef.current) return;
      
      // 如果焦点在输入框或文本区域，不处理
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          deleteElements(Array.from(selectedIds));
        }
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        }
        if (e.key === 'c' && selectedIds.size > 0) {
          e.preventDefault();
          duplicateElements(Array.from(selectedIds));
        }
        if (e.key === 'a') {
          e.preventDefault();
          setSelectedIds(new Set(elements.map(el => el.id)));
        }
        if (e.key === 'g') {
          e.preventDefault();
          if (e.shiftKey) {
            ungroupElements(Array.from(selectedIds));
          } else {
            groupElements(Array.from(selectedIds));
          }
        }
      }
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setContextMenu({ visible: false, x: 0, y: 0, elementId: null });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deleteElements, duplicateElements, undo, redo, elements, groupElements, ungroupElements]);

  // 跟踪设计器活动状态
  useEffect(() => {
    const handleCanvasClick = () => {
      // 设置当前设计器为活动状态
      isActiveRef.current = true;
      // 设置全局活动设计器 ID
      (window as any).__activeDesigner__ = filePath;
    };

    const handleGlobalClick = (e: MouseEvent) => {
      // 检查点击是否在当前设计器内
      const isInsideCanvas = canvasWrapperRef.current?.contains(e.target as Node);
      if (isInsideCanvas) {
        isActiveRef.current = true;
        (window as any).__activeDesigner__ = filePath;
      } else if ((window as any).__activeDesigner__ !== filePath) {
        // 如果点击在其他地方，且当前设计器不是活动设计器，则设置为非活动
        isActiveRef.current = false;
      }
    };

    const canvasWrapper = canvasWrapperRef.current;
    canvasWrapper?.addEventListener('click', handleCanvasClick);
    window.addEventListener('click', handleGlobalClick);

    return () => {
      canvasWrapper?.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [filePath]);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ visible: false, x: 0, y: 0, elementId: null });
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const generateElementCSS = (element: DesignerElement): string => {
    const styles = element.styles || {};
    const css: string[] = [];
    
    if (styles.backgroundColor) css.push(`  background-color: ${styles.backgroundColor};`);
    if (styles.borderColor) css.push(`  border-color: ${styles.borderColor};`);
    if (styles.borderWidth) css.push(`  border-width: ${styles.borderWidth}px; border-style: solid;`);
    if (styles.borderRadius) css.push(`  border-radius: ${styles.borderRadius}px;`);
    if (styles.textColor) css.push(`  color: ${styles.textColor};`);
    if (styles.fontSize) css.push(`  font-size: ${styles.fontSize}px;`);
    if (styles.fontWeight) css.push(`  font-weight: ${styles.fontWeight};`);
    if (styles.opacity !== undefined) css.push(`  opacity: ${styles.opacity};`);
    if (styles.boxShadow) css.push(`  box-shadow: ${styles.boxShadow};`);
    if (styles.paddingTop || styles.paddingRight || styles.paddingBottom || styles.paddingLeft) {
      css.push(`  padding: ${styles.paddingTop || 0}px ${styles.paddingRight || 0}px ${styles.paddingBottom || 0}px ${styles.paddingLeft || 0}px;`);
    }
    if (styles.marginTop || styles.marginRight || styles.marginBottom || styles.marginLeft) {
      css.push(`  margin: ${styles.marginTop || 0}px ${styles.marginRight || 0}px ${styles.marginBottom || 0}px ${styles.marginLeft || 0}px;`);
    }
    if (styles.textAlign) css.push(`  text-align: ${styles.textAlign};`);
    
    return css.join('\n');
  };

  const generateHTML = (): string => {

    const canvasBorder = canvasSettings.borderWidth && canvasSettings.borderWidth > 0 
      ? `border: ${canvasSettings.borderWidth}px solid ${canvasSettings.borderColor || '#cccccc'};` 
      : '';
    const canvasRadius = canvasSettings.borderRadius ? `border-radius: ${canvasSettings.borderRadius}px;` : '';
    const canvasOpacity = canvasSettings.opacity !== undefined && canvasSettings.opacity < 1 ? `opacity: ${canvasSettings.opacity};` : '';
    const canvasShadow = canvasSettings.boxShadow ? `box-shadow: ${canvasSettings.boxShadow};` : '';
    const canvasPadding = (canvasSettings.paddingTop || canvasSettings.paddingRight || canvasSettings.paddingBottom || canvasSettings.paddingLeft)
      ? `padding: ${canvasSettings.paddingTop || 0}px ${canvasSettings.paddingRight || 0}px ${canvasSettings.paddingBottom || 0}px ${canvasSettings.paddingLeft || 0}px;`
      : '';

    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${canvasSettings.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { 
      position: relative; 
      width: ${canvasSettings.width}px; 
      height: ${canvasSettings.height}px; 
      background-color: ${canvasSettings.backgroundColor};
      ${canvasBorder}
      ${canvasRadius}
      ${canvasOpacity}
      ${canvasShadow}
      ${canvasPadding}
    }
`;
    
    elements.forEach(el => {
      const css = generateElementCSS(el);
      if (css) {
        html += `\n    .${el.type}-${el.id.slice(-6)} {\n      position: absolute;\n      left: ${el.x}px;\n      top: ${el.y}px;\n      width: ${el.width}px;\n      height: ${el.height}px;\n${css}\n    }\n`;
      }
    });
    
    html += `  </style>
</head>
<body>
  <div class="container">
`;
    
    elements.forEach(el => {
      const className = `${el.type}-${el.id.slice(-6)}`;
      const eventAttrs = '';
      
      switch (el.type) {
        case 'text':
          html += `    <span class="${className}"${eventAttrs}>${el.props.text || '文本'}</span>\n`;
          break;
        case 'heading':
          html += `    <h2 class="${className}"${eventAttrs}>${el.props.text || '标题'}</h2>\n`;
          break;
        case 'paragraph':
          html += `    <p class="${className}"${eventAttrs}>${el.props.text || '段落'}</p>\n`;
          break;
        case 'button':
          html += `    <button class="${className}"${eventAttrs}>${el.props.text || '按钮'}</button>\n`;
          break;
        case 'input':
          html += `    <input type="text" class="${className}" placeholder="${el.props.placeholder || ''}"${eventAttrs} />\n`;
          break;
        case 'textarea':
          html += `    <textarea class="${className}" placeholder="${el.props.placeholder || ''}"${eventAttrs}></textarea>\n`;
          break;
        case 'checkbox':
          html += `    <label class="${className}"${eventAttrs}><input type="checkbox" /> ${el.props.label || '复选框'}</label>\n`;
          break;
        case 'radio':
          html += `    <label class="${className}"${eventAttrs}><input type="radio" /> ${el.props.label || '单选框'}</label>\n`;
          break;
        case 'image':
          html += `    <img class="${className}" src="placeholder.jpg" alt="图片"${eventAttrs} />\n`;
          break;
        case 'divider':
          html += `    <hr class="${className}" />\n`;
          break;
        default:
          html += `    <div class="${className}"${eventAttrs}></div>\n`;
      }
    });
    
    html += `  </div>
</body>
</html>`;
    
    return html;
  };

  const generateReact = (): string => {

    let code = `import React from 'react';
import styled from 'styled-components';

`;
    
    elements.forEach(el => {
      const css = generateElementCSS(el);
      const componentName = el.type.charAt(0).toUpperCase() + el.type.slice(1) + el.id.slice(-6).toUpperCase();
      code += `const ${componentName} = styled.div\`
  position: absolute;
  left: ${el.x}px;
  top: ${el.y}px;
  width: ${el.width}px;
  height: ${el.height}px;
${css}
\`;

`;
    });
    
    code += `const Container = styled.div\`
  position: relative;
  width: ${canvasSettings.width}px;
  height: ${canvasSettings.height}px;
  background-color: ${canvasSettings.backgroundColor};
${canvasSettings.borderWidth && canvasSettings.borderWidth > 0 ? `  border: ${canvasSettings.borderWidth}px solid ${canvasSettings.borderColor || '#cccccc'};\n` : ''}${canvasSettings.borderRadius ? `  border-radius: ${canvasSettings.borderRadius}px;\n` : ''}${canvasSettings.opacity !== undefined && canvasSettings.opacity < 1 ? `  opacity: ${canvasSettings.opacity};\n` : ''}${canvasSettings.boxShadow ? `  box-shadow: ${canvasSettings.boxShadow};\n` : ''}${(canvasSettings.paddingTop || canvasSettings.paddingRight || canvasSettings.paddingBottom || canvasSettings.paddingLeft) ? `  padding: ${canvasSettings.paddingTop || 0}px ${canvasSettings.paddingRight || 0}px ${canvasSettings.paddingBottom || 0}px ${canvasSettings.paddingLeft || 0}px;\n` : ''}\`;

const ${canvasSettings.name.replace(/\s+/g, '')}: React.FC = () => {
  return (
    <Container>
`;
    
    elements.forEach(el => {
      const componentName = el.type.charAt(0).toUpperCase() + el.type.slice(1) + el.id.slice(-6).toUpperCase();
      const eventProps = '';
      
      switch (el.type) {
        case 'text':
          code += `      <${componentName}${eventProps}>${el.props.text || '文本'}</${componentName}>\n`;
          break;
        case 'heading':
          code += `      <${componentName} as="h2"${eventProps}>${el.props.text || '标题'}</${componentName}>\n`;
          break;
        case 'paragraph':
          code += `      <${componentName} as="p"${eventProps}>${el.props.text || '段落'}</${componentName}>\n`;
          break;
        case 'button':
          code += `      <${componentName} as="button"${eventProps}>${el.props.text || '按钮'}</${componentName}>\n`;
          break;
        case 'input':
          code += `      <${componentName} as="input" type="text" placeholder="${el.props.placeholder || ''}"${eventProps} />\n`;
          break;
        default:
          code += `      <${componentName}${eventProps} />\n`;
      }
    });
    
    code += `    </Container>
  );
};

export default ${canvasSettings.name.replace(/\s+/g, '')};`;
    
    return code;
  };

  const generateCSS = (): string => {
    let css = `/* ${canvasSettings.name} - 设计器导出 CSS */

.container {
  position: relative;
  width: ${canvasSettings.width}px;
  height: ${canvasSettings.height}px;
  background-color: ${canvasSettings.backgroundColor};
}

`;
    
    elements.forEach(el => {
      const elCss = generateElementCSS(el);
      css += `.${el.type}-${el.id.slice(-6)} {\n  position: absolute;\n  left: ${el.x}px;\n  top: ${el.y}px;\n  width: ${el.width}px;\n  height: ${el.height}px;\n${elCss}\n}\n\n`;
    });
    
    return css;
  };

  const handleExport = () => {
    let code = '';
    let filename = '';
    let type = '';
    const name = canvasSettings.name.replace(/\s+/g, '');
    
    switch (exportFormat) {
      case 'html':
        code = generateHTML();
        filename = `${name}.html`;
        type = 'text/html';
        break;
      case 'react':
        code = generateReact();
        filename = `${name}.tsx`;
        type = 'text/typescript';
        break;
      case 'css':
        code = generateCSS();
        filename = `${name}.css`;
        type = 'text/css';
        break;
    }
    
    const blob = new Blob([code], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveDesign = async () => {
    try {
      const workspacePath = await globalAPI.getCurrentWorkspacePath();
      if (!workspacePath) {
        alert('未找到当前工作目录，请先打开一个工作空间');
        return;
      }

      const normalizedWorkspacePath = workspacePath.replace(/\\/g, '/');
      const fileName = `${canvasSettings.name || 'design'}.设计`;
      const filePath = `${normalizedWorkspacePath}/${fileName}`;
      
      const design = {
        elements,
        groups: Array.from(groups.entries()),
        canvasSettings,
        version: '1.0',
      };
      const json = JSON.stringify(design, null, 2);
      const encoder = new TextEncoder();
      const data = encoder.encode(json);
      await writeFile(filePath, data);
      
      alert(`设计已保存到: ${filePath}`);
    } catch (error) {
      console.error('保存设计失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert('保存设计失败: ' + errorMessage);
    }
  };

  const handleLoadDesign = async () => {
    try {
      const filePath = await dialogOpen({
        multiple: false,
        filters: [
          { name: '设计文件', extensions: ['设计'] },
        ],
      });
      
      if (filePath && typeof filePath === 'string') {
        const fileData = await readFile(filePath);
        const decoder = new TextDecoder();
        const json = decoder.decode(fileData);
        const design = JSON.parse(json);
        
        if (design.elements) {
          setElements(design.elements);
          if (design.groups) {
            setGroups(new Map(design.groups));
          }
          if (design.canvasSettings) {
            setCanvasSettings(design.canvasSettings);
          }
          saveHistory(design.elements);
          setSelectedIds(new Set());
          setIsCanvasSelected(true);
        }
      }
    } catch (error) {
      console.error('加载设计失败:', error);
      alert('无法加载设计文件，请确保文件格式正确');
    }
  };

  const handleLayerDragStart = (e: React.DragEvent, elementId: string) => {
    setDraggedLayerId(elementId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLayerDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedLayerId || draggedLayerId === targetId) return;
    
    const draggedIndex = elements.findIndex(el => el.id === draggedLayerId);
    const targetIndex = elements.findIndex(el => el.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newElements = [...elements];
    const [draggedElement] = newElements.splice(draggedIndex, 1);
    newElements.splice(targetIndex, 0, draggedElement);
    
    setElements(newElements);
  };

  const handleLayerDragEnd = () => {
    if (draggedLayerId) {
      saveHistory(elements);
      setDraggedLayerId(null);
    }
  };

  const handleExportNimCode = async () => {
    try {
      const workspacePath = await globalAPI.getCurrentWorkspacePath();
      if (!workspacePath) {
        alert('未找到当前工作目录，请先打开一个工作空间');
        return;
      }

      // 从设计文件名提取窗口名称
      const designFileName = filePath?.split(/[/\\]/).pop() || '窗口';
      const fileBaseName = designFileName.replace(/\.设计$/, '');
      const windowName = canvasSettings.name || fileBaseName;
      const moduleName = getModuleName(windowName);

      const options: NimCodeGeneratorOptions = {
        appName: windowName,
        windowWidth: canvasSettings.width || 800,
        windowHeight: canvasSettings.height || 600,
        elements,
        imguiWindowProps: canvasSettings.imguiWindowProps,
        backgroundColor: canvasSettings.backgroundColor,
        windowIcon: canvasSettings.windowIcon,
        windowName: windowName,
        isMainWindow: true,
      };
      
      const generatedCode = generateNimCode(options);
      
      const normalizedWorkspacePath = workspacePath.replace(/\\/g, '/');
      const targetDir = normalizedWorkspacePath;
      
      const encoder = new TextEncoder();
      
      const uiPath = `${targetDir}/界面_${moduleName}.灵`;
      const logicPath = `${targetDir}/交互_${moduleName}.灵`;
      
      await writeFile(uiPath, encoder.encode(generatedCode.ui));
      
      try {
        await readFile(logicPath);
      } catch {
        await writeFile(logicPath, encoder.encode(generatedCode.logic));
      }
      
      const mainPath = `${targetDir}/主入口.灵`;
      const configPath = `${targetDir}/kl.cfg`;
      
      await writeFile(mainPath, encoder.encode(generatedCode.main));
      
      try {
        await readFile(configPath);
      } catch {
        await writeFile(configPath, encoder.encode(generatedCode.config));
      }
      
      alert(`代码已生成到: ${targetDir}/\n\n文件列表:\n- 界面_${moduleName}.灵\n- 交互_${moduleName}.灵`);
    } catch (error) {
      console.error('导出代码失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert('导出代码失败: ' + errorMessage);
    }
  };

  const handlePanelResizeStart = (panel: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingPanel(panel);
    setResizeStartX(e.clientX);
    setResizeStartWidth(panel === 'left' ? leftPanelWidth : rightPanelWidth);
  };

  useEffect(() => {
    if (!isResizingPanel) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaX = e.clientX - resizeStartX;
      
      if (isResizingPanel === 'left') {
        const newWidth = Math.max(180, Math.min(400, resizeStartWidth + deltaX));
        setLeftPanelWidth(newWidth);
      } else if (isResizingPanel === 'right') {
        const newWidth = Math.max(200, Math.min(450, resizeStartWidth - deltaX));
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingPanel(null);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingPanel, resizeStartX, resizeStartWidth]);

  const getElementStyle = (element: DesignerElement): React.CSSProperties => {
    const styles = element.styles || {};
    
    const borderWidth = styles.borderWidth !== undefined ? styles.borderWidth : 1;
    const borderColor = styles.borderColor || 'var(--color-border-default)';
    const borderRadius = styles.borderRadius !== undefined ? styles.borderRadius : 4;
    const backgroundColor = styles.backgroundColor || (element.type === 'navbar' ? '#3c3c3c' : 'var(--color-bg-primary)');
    
    return {
      backgroundColor: backgroundColor,
      border: element.type === 'navbar' ? 'none' : (borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none'),
      borderRadius: element.type === 'navbar' ? 0 : borderRadius,
      color: styles.textColor,
      fontSize: styles.fontSize ? `${styles.fontSize}px` : undefined,
      fontWeight: styles.fontWeight as React.CSSProperties['fontWeight'],
      opacity: styles.opacity,
      boxShadow: styles.boxShadow,
      padding: styles.paddingTop !== undefined ? `${styles.paddingTop}px ${styles.paddingRight || 0}px ${styles.paddingBottom || 0}px ${styles.paddingLeft || 0}px` : undefined,
      margin: styles.marginTop !== undefined ? `${styles.marginTop}px ${styles.marginRight || 0}px ${styles.marginBottom || 0}px ${styles.marginLeft || 0}px` : undefined,
      textAlign: styles.textAlign,
      zIndex: styles.zIndex,
    };
  };

  return (
    <div className="designer-scene">
      <div className="designer-toolbar">
        <div className="designer-toolbar__group">
          <button className="designer-toolbar__btn" onClick={undo} disabled={historyIndex <= 0} title="撤销 (Ctrl+Z)">
            <Undo2 size={16} />
          </button>
          <button className="designer-toolbar__btn" onClick={redo} disabled={historyIndex >= history.length - 1} title="重做 (Ctrl+Shift+Z)">
            <Redo2 size={16} />
          </button>
        </div>
        <div className="designer-toolbar__divider" />
        <div className="designer-toolbar__group">
          <button className="designer-toolbar__btn" onClick={() => selectedIds.size > 0 && deleteElements(Array.from(selectedIds))} disabled={selectedIds.size === 0} title="删除">
            <Trash2 size={16} />
          </button>
          <button className="designer-toolbar__btn" onClick={() => selectedIds.size > 0 && duplicateElements(Array.from(selectedIds))} disabled={selectedIds.size === 0} title="复制 (Ctrl+C)">
            <Copy size={16} />
          </button>
        </div>
        <div className="designer-toolbar__divider" />
        <div className="designer-toolbar__group">
          <button className="designer-toolbar__btn" onClick={() => bringToFront(Array.from(selectedIds))} disabled={selectedIds.size === 0} title="置于顶层">
            <BringToFront size={16} />
          </button>
          <button className="designer-toolbar__btn" onClick={() => sendToBack(Array.from(selectedIds))} disabled={selectedIds.size === 0} title="置于底层">
            <SendToBack size={16} />
          </button>
        </div>
        <div className="designer-toolbar__divider" />
        <div className="designer-toolbar__dropdown">
          <button 
            className="designer-toolbar__dropdown-trigger" 
            onClick={() => setActiveDropdown(activeDropdown === 'align' ? null : 'align')}
            disabled={selectedIds.size < 2}
          >
            <AlignCenter size={16} />
            <ChevronDown size={12} />
          </button>
          {activeDropdown === 'align' && (
            <div className="designer-toolbar__dropdown-menu">
              <div className="designer-toolbar__dropdown-label">水平对齐</div>
              <button className="designer-toolbar__dropdown-item" onClick={() => { alignElements('left'); setActiveDropdown(null); }} disabled={selectedIds.size < 2}>
                <AlignLeft size={16} /> 左对齐
              </button>
              <button className="designer-toolbar__dropdown-item" onClick={() => { alignElements('center'); setActiveDropdown(null); }} disabled={selectedIds.size < 2}>
                <AlignCenter size={16} /> 水平居中
              </button>
              <button className="designer-toolbar__dropdown-item" onClick={() => { alignElements('right'); setActiveDropdown(null); }} disabled={selectedIds.size < 2}>
                <AlignRight size={16} /> 右对齐
              </button>
              <div className="designer-toolbar__dropdown-divider" />
              <div className="designer-toolbar__dropdown-label">垂直对齐</div>
              <button className="designer-toolbar__dropdown-item" onClick={() => { alignElements('top'); setActiveDropdown(null); }} disabled={selectedIds.size < 2}>
                <AlignStartVertical size={16} /> 顶部对齐
              </button>
              <button className="designer-toolbar__dropdown-item" onClick={() => { alignElements('middle'); setActiveDropdown(null); }} disabled={selectedIds.size < 2}>
                <AlignCenterVertical size={16} /> 垂直居中
              </button>
              <button className="designer-toolbar__dropdown-item" onClick={() => { alignElements('bottom'); setActiveDropdown(null); }} disabled={selectedIds.size < 2}>
                <AlignEndVertical size={16} /> 底部对齐
              </button>
              <div className="designer-toolbar__dropdown-divider" />
              <div className="designer-toolbar__dropdown-label">分布</div>
              <button className="designer-toolbar__dropdown-item" onClick={() => { distributeElements('horizontal'); setActiveDropdown(null); }} disabled={selectedIds.size < 3}>
                <AlignHorizontalSpaceAround size={16} /> 水平均匀分布
              </button>
              <button className="designer-toolbar__dropdown-item" onClick={() => { distributeElements('vertical'); setActiveDropdown(null); }} disabled={selectedIds.size < 3}>
                <AlignVerticalSpaceAround size={16} /> 垂直均匀分布
              </button>
            </div>
          )}
        </div>
        <div className="designer-toolbar__dropdown">
          <button 
            className="designer-toolbar__dropdown-trigger" 
            onClick={() => setActiveDropdown(activeDropdown === 'size' ? null : 'size')}
            disabled={selectedIds.size < 1}
          >
            <SquareEqual size={16} />
            <ChevronDown size={12} />
          </button>
          {activeDropdown === 'size' && (
            <div className="designer-toolbar__dropdown-menu">
              <div className="designer-toolbar__dropdown-label">等尺寸</div>
              <button className="designer-toolbar__dropdown-item" onClick={() => { makeEqualWidth(); setActiveDropdown(null); }} disabled={selectedIds.size < 2}>
                <SquareEqual size={16} /> 等宽
              </button>
              <button className="designer-toolbar__dropdown-item" onClick={() => { makeEqualHeight(); setActiveDropdown(null); }} disabled={selectedIds.size < 2}>
                <SquareEqual size={16} style={{ transform: 'rotate(90deg)' }} /> 等高
              </button>
              <button className="designer-toolbar__dropdown-item" onClick={() => { makeEqualSize(); setActiveDropdown(null); }} disabled={selectedIds.size < 2}>
                <Square size={16} /> 等大小
              </button>
              <div className="designer-toolbar__dropdown-divider" />
              <div className="designer-toolbar__dropdown-label">匹配画布</div>
              <button className="designer-toolbar__dropdown-item" onClick={() => { matchCanvasWidth(); setActiveDropdown(null); }} disabled={selectedIds.size < 1}>
                <Maximize2 size={16} style={{ transform: 'rotate(90deg)' }} /> 匹配画布宽度
              </button>
              <button className="designer-toolbar__dropdown-item" onClick={() => { matchCanvasHeight(); setActiveDropdown(null); }} disabled={selectedIds.size < 1}>
                <Maximize2 size={16} /> 匹配画布高度
              </button>
              <button className="designer-toolbar__dropdown-item" onClick={() => { matchCanvasSize(); setActiveDropdown(null); }} disabled={selectedIds.size < 1}>
                <Maximize size={16} /> 匹配画布大小
              </button>
              <div className="designer-toolbar__dropdown-divider" />
              <button className="designer-toolbar__dropdown-item" onClick={() => { resetSize(); setActiveDropdown(null); }} disabled={selectedIds.size < 1}>
                <RotateCcw size={16} /> 重置尺寸
              </button>
            </div>
          )}
        </div>
        <div className="designer-toolbar__dropdown">
          <button 
            className="designer-toolbar__dropdown-trigger" 
            onClick={() => setActiveDropdown(activeDropdown === 'layout' ? null : 'layout')}
            disabled={selectedIds.size < 1}
          >
            <LayoutTemplate size={16} />
            <ChevronDown size={12} />
          </button>
          {activeDropdown === 'layout' && (
            <div className="designer-toolbar__dropdown-menu">
              <div className="designer-toolbar__dropdown-label">自动布局</div>
              <button className="designer-toolbar__dropdown-item" onClick={() => { autoLayout('grid'); setActiveDropdown(null); }} disabled={selectedIds.size < 2}>
                <LayoutTemplate size={16} /> 网格布局
              </button>
              <button className="designer-toolbar__dropdown-item" onClick={() => { autoLayout('horizontal'); setActiveDropdown(null); }} disabled={selectedIds.size < 2}>
                <Rows size={16} /> 水平排列
              </button>
              <button className="designer-toolbar__dropdown-item" onClick={() => { autoLayout('vertical'); setActiveDropdown(null); }} disabled={selectedIds.size < 2}>
                <Columns size={16} /> 垂直排列
              </button>
              <div className="designer-toolbar__dropdown-divider" />
              <div className="designer-toolbar__dropdown-label">翻转</div>
              <button className="designer-toolbar__dropdown-item" onClick={() => { flipElements('horizontal'); setActiveDropdown(null); }} disabled={selectedIds.size < 1}>
                <FlipHorizontal size={16} /> 水平翻转
              </button>
              <button className="designer-toolbar__dropdown-item" onClick={() => { flipElements('vertical'); setActiveDropdown(null); }} disabled={selectedIds.size < 1}>
                <FlipVertical size={16} /> 垂直翻转
              </button>
            </div>
          )}
        </div>
        <div className="designer-toolbar__divider" />
        <div className="designer-toolbar__group">
          <button className="designer-toolbar__btn" onClick={() => groupElements(Array.from(selectedIds))} disabled={selectedIds.size < 2} title="组合 (Ctrl+G)">
            <Group size={16} />
          </button>
          <button className="designer-toolbar__btn" onClick={() => ungroupElements(Array.from(selectedIds))} disabled={selectedIds.size === 0} title="取消组合 (Ctrl+Shift+G)">
            <Ungroup size={16} />
          </button>
        </div>
        <div className="designer-toolbar__divider" />
        <div className="designer-toolbar__group">
          <button className={`designer-toolbar__btn ${showGrid ? 'is-active' : ''}`} onClick={toggleShowGrid} title="显示网格">
            <Grid3X3 size={16} />
          </button>
          <button className={`designer-toolbar__btn ${snapToGrid ? 'is-active' : ''}`} onClick={toggleSnapToGrid} title="吸附到网格">
            <Magnet size={16} />
          </button>
        </div>
        <div className="designer-toolbar__divider" />
        <div className="designer-toolbar__group">
          <button className="designer-toolbar__btn" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} title="缩小">
            <ZoomOut size={16} />
          </button>
          <span className="designer-toolbar__zoom">{Math.round(zoom * 100)}%</span>
          <button className="designer-toolbar__btn" onClick={() => setZoom(Math.min(2, zoom + 0.25))} title="放大">
            <ZoomIn size={16} />
          </button>
          <button className="designer-toolbar__btn" onClick={() => setZoom(1)} title="重置缩放">
            <Maximize size={16} />
          </button>
        </div>
        <div className="designer-toolbar__divider" />
        <div className="designer-toolbar__group">
          <button className="designer-toolbar__btn" onClick={handleSaveDesign} title="保存设计">
            <Save size={16} />
          </button>
          <button className="designer-toolbar__btn" onClick={handleLoadDesign} title="加载设计">
            <FolderOpen size={16} />
          </button>
        </div>
        <div className="designer-toolbar__divider" />
        <div className="designer-toolbar__group">
          <button className={`designer-toolbar__btn ${previewMode ? 'is-active' : ''}`} onClick={() => setPreviewMode(!previewMode)} title="预览模式">
            <Play size={16} />
          </button>
          <button className="designer-toolbar__btn" onClick={handleExportNimCode} title="导出 Nim 代码">
            <Code size={16} />
          </button>
          <button className="designer-toolbar__btn" onClick={() => setShowHelpModal(true)} title="快捷键帮助">
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      <div className="designer-main">
        <div style={{ width: leftPanelWidth, flexShrink: 0 }}>
          <DesignerComponentBox onDragStart={handleDragStart} />
        </div>
        <div 
          className={`designer-panel-resizer ${isResizingPanel === 'left' ? 'is-active' : ''}`}
          onMouseDown={handlePanelResizeStart('left')}
        />
        <div 
          className="designer-canvas-wrapper" 
          ref={canvasWrapperRef}
        >
          <div 
            className={`designer-canvas-container ${isCanvasSelected ? 'is-selected' : ''}`}
            style={{ 
              transform: `scale(${zoom}) translate(${canvasPan.x / zoom}px, ${canvasPan.y / zoom}px)`,
              transformOrigin: 'top left',
            }}
          >
            <div className="designer-canvas__titlebar">
              <span className="designer-canvas__title">{canvasSettings.name}</span>
              <span className="designer-canvas__size">{canvasSettings.width} × {canvasSettings.height}</span>
            </div>
            <div
              ref={canvasRef}
              className={`designer-canvas ${showGrid ? 'designer-canvas--grid' : ''} ${canvasSettings.className || ''}`}
              onClick={handleCanvasClick}
              onMouseDown={(e) => {
                handleCanvasMouseDown(e);
                handleCanvasMouseDownForSelection(e);
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onContextMenu={(e) => e.preventDefault()}
              title={canvasSettings.title}
              aria-label={canvasSettings.ariaLabel}
              aria-describedby={canvasSettings.ariaDescribedBy}
              data-description={canvasSettings.description}
              style={{ 
                width: canvasSettings.width,
                height: canvasSettings.height,
                minWidth: canvasSettings.minWidth,
                maxWidth: canvasSettings.maxWidth,
                minHeight: canvasSettings.minHeight,
                maxHeight: canvasSettings.maxHeight,
                backgroundColor: canvasSettings.backgroundColor,
                borderColor: canvasSettings.borderColor || undefined,
                borderWidth: canvasSettings.borderWidth || 0,
                borderStyle: canvasSettings.borderWidth && canvasSettings.borderWidth > 0 ? 'solid' : 'none',
                borderRadius: canvasSettings.borderRadius || 0,
                opacity: canvasSettings.opacity ?? 1,
                boxShadow: canvasSettings.boxShadow || undefined,
                padding: `${canvasSettings.paddingTop || 0}px ${canvasSettings.paddingRight || 0}px ${canvasSettings.paddingBottom || 0}px ${canvasSettings.paddingLeft || 0}px`,
                overflow: canvasSettings.overflow,
                '--grid-size': `${gridSize}px`,
              } as React.CSSProperties}
            >
            {elements.map(element => (
              <div
                key={element.id}
                className={`designer-element ${selectedIds.has(element.id) ? 'is-selected' : ''} ${element.locked ? 'is-locked' : ''} ${element.hidden ? 'is-hidden' : ''} ${element.className || ''}`}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  ...getElementStyle(element),
                }}
                title={element.title}
                aria-label={element.ariaLabel}
                aria-describedby={element.ariaDescribedBy}
                tabIndex={element.tabIndex}
                data-description={element.description}
                onClick={(e) => handleElementClick(e, element.id)}
                onMouseDown={(e) => handleElementMouseDown(e, element)}
                onContextMenu={(e) => handleContextMenu(e, element.id)}
              >
                <div className="designer-element__content">
                  {element.type === 'text' && <span>{String(element.props.text || '文本')}</span>}
                  {element.type === 'heading' && <h2>{String(element.props.text || '标题')}</h2>}
                  {element.type === 'paragraph' && <p>{String(element.props.text || '段落文本...')}</p>}
                  {element.type === 'button' && <button className="designer-element__preview-btn">{String(element.props.text || '按钮')}</button>}
                  {element.type === 'input' && <input className="designer-element__preview-input" placeholder={String(element.props.placeholder || '')} readOnly />}
                  {element.type === 'textarea' && <textarea className="designer-element__preview-textarea" placeholder={String(element.props.placeholder || '')} readOnly />}
                  {element.type === 'checkbox' && <label className="designer-element__preview-checkbox"><input type="checkbox" readOnly /> {String(element.props.label || '复选框')}</label>}
                  {element.type === 'radio' && <label className="designer-element__preview-radio"><input type="radio" readOnly /> {String(element.props.label || '单选框')}</label>}
                  {element.type === 'toggle' && <div className="designer-element__preview-toggle" />}
                  {element.type === 'slider' && <input type="range" className="designer-element__preview-slider" readOnly />}
                  {element.type === 'select' && <select className="designer-element__preview-select"><option>选择...</option></select>}
                  {element.type === 'container' && <div className="designer-element__preview-container" />}
                  {element.type === 'box' && <div className="designer-element__preview-box" />}
                  {element.type === 'flex' && <div className="designer-element__preview-flex" />}
                  {element.type === 'grid' && <div className="designer-element__preview-grid" />}
                  {element.type === 'spacer' && <div className="designer-element__preview-spacer" />}
                  {element.type === 'image' && <div className="designer-element__preview-image"><Image size={24} /></div>}
                  {element.type === 'video' && <div className="designer-element__preview-video"><Play size={24} /></div>}
                  {element.type === 'audio' && <div className="designer-element__preview-audio"><Music size={16} /></div>}
                  {element.type === 'icon' && <div className="designer-element__preview-icon"><Component size={16} /></div>}
                  {element.type === 'divider' && <div className="designer-element__preview-divider" />}
                  {element.type === 'card' && <div className="designer-element__preview-card" />}
                  {element.type === 'link' && <a href="#" className="designer-element__preview-link">{String(element.props.text || '链接')}</a>}
                  {element.type === 'avatar' && <div className="designer-element__preview-avatar"><User size={20} /></div>}
                  {element.type === 'badge' && <span className="designer-element__preview-badge">{String(element.props.text || '新')}</span>}
                  {element.type === 'tag' && <span className="designer-element__preview-tag">{String(element.props.text || '标签')}</span>}
                  {element.type === 'iframe' && <div className="designer-element__preview-iframe"><Globe size={24} /></div>}
                  {element.type === 'table' && <div className="designer-element__preview-table"><Table size={24} /></div>}
                  {element.type === 'list' && <div className="designer-element__preview-list"><List size={24} /></div>}
                  {element.type === 'progress' && <div className="designer-element__preview-progress"><div style={{ width: `${Number(element.props.value) || 50}%` }} /></div>}
                  {element.type === 'spinner' && <div className="designer-element__preview-spinner"><Loader size={20} /></div>}
                  {element.type === 'alert' && <div className="designer-element__preview-alert"><AlertCircle size={16} /> {String(element.props.text || '提示信息')}</div>}
                  {element.type === 'navbar' && (
                    <div className="designer-element__preview-navbar">
                      <span className="navbar-item">文件</span>
                      <span className="navbar-item">编辑</span>
                    </div>
                  )}
                  {element.type === 'tabs' && <div className="designer-element__preview-tabs"><span className="is-active">标签1</span><span>标签2</span></div>}
                  {element.type === 'breadcrumb' && <div className="designer-element__preview-breadcrumb">首页 / 列表 / 详情</div>}
                  {element.type === 'menu' && <div className="designer-element__preview-menu"><div>菜单项 1</div><div>菜单项 2</div></div>}
                  {element.type === 'datepicker' && <input type="date" className="designer-element__preview-input" readOnly />}
                  {element.type === 'timepicker' && <input type="time" className="designer-element__preview-input" readOnly />}
                  {element.type === 'fileupload' && <div className="designer-element__preview-fileupload"><FileText size={24} /><span>点击上传</span></div>}
                  {element.type === 'colorpicker' && <div className="designer-element__preview-colorpicker"><div /></div>}
                  {element.type === 'columns' && <div className="designer-element__preview-columns"><div /><div /></div>}
                  {element.type === 'rows' && <div className="designer-element__preview-rows"><div /><div /></div>}
                  {element.type === 'sidebar' && <div className="designer-element__preview-sidebar"><Menu size={16} /></div>}
                  {element.type === 'footer' && <div className="designer-element__preview-footer"><span>页脚内容</span></div>}
                  {element.type === 'number' && <input type="number" className="designer-element__preview-input" placeholder="0" readOnly />}
                  {element.type === 'search' && <div className="designer-element__preview-search"><Search size={16} /><input placeholder="搜索..." readOnly /></div>}
                  {element.type === 'password' && <input type="password" className="designer-element__preview-input" placeholder="••••••" readOnly />}
                  {element.type === 'rating' && <div className="designer-element__preview-rating"><Star size={16} /><Star size={16} /><Star size={16} /><Star size={16} /><Star size={16} /></div>}
                  {element.type === 'stepper' && <div className="designer-element__preview-stepper"><button>-</button><span>0</span><button>+</button></div>}
                  {element.type === 'range' && <div className="designer-element__preview-range"><input type="range" /><input type="range" /></div>}
                  {element.type === 'code' && <pre className="designer-element__preview-code">{String(element.props.code || 'console.log("Hello");')}</pre>}
                  {element.type === 'quote' && <blockquote className="designer-element__preview-quote">{String(element.props.text || '这是一段引用文本...')}</blockquote>}
                  {element.type === 'skeleton' && <div className="designer-element__preview-skeleton"><div /><div /><div /></div>}
                  {element.type === 'chart' && <div className="designer-element__preview-chart"><BarChart3 size={32} /></div>}
                  {element.type === 'tree' && (
                    <div className="designer-element__preview-tree">
                      <div className="tree-item">
                        <ChevronRight size={12} />
                        <span className="is-selected">项目 1</span>
                      </div>
                      <div className="tree-children">
                        <div className="tree-item">
                          <ChevronRight size={12} />
                          <span>子项目 1</span>
                        </div>
                        <div className="tree-children">
                          <div className="tree-item">
                            <span className="tree-leaf" />
                            <span>子项目 2</span>
                          </div>
                        </div>
                      </div>
                      <div className="tree-item">
                        <ChevronRight size={12} />
                        <span>项目 2</span>
                      </div>
                    </div>
                  )}
                  {element.type === 'timeline' && <div className="designer-element__preview-timeline"><div><span />步骤 1</div><div><span />步骤 2</div></div>}
                  {element.type === 'pagination' && <div className="designer-element__preview-pagination"><span>&lt;</span><span className="is-active">1</span><span>2</span><span>3</span><span>&gt;</span></div>}
                  {element.type === 'statistic' && <div className="designer-element__preview-statistic"><div className="value">{String(element.props.value || '1024')}</div><div className="label">{String(element.props.label || '总数')}</div></div>}
                  {element.type === 'calendar' && (
                    <div className="designer-element__preview-calendar">
                      <div className="header">2024年1月</div>
                      <div className="weekdays"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
                      <div className="days">
                        {[...Array(31)].map((_, i) => <span key={i} className={i === 14 ? 'is-today' : ''}>{i + 1}</span>)}
                      </div>
                    </div>
                  )}
                  {element.type === 'toast' && <div className="designer-element__preview-toast"><CheckCircle size={16} /> {String(element.props.text || '操作成功')}</div>}
                  {element.type === 'modal' && <div className="designer-element__preview-modal"><div className="modal-header">{String(element.props.title || '标题')}</div><div className="modal-content">{String(element.props.content || '内容')}</div></div>}
                  {element.type === 'drawer' && <div className="designer-element__preview-drawer"><div className="drawer-header">抽屉</div><div className="drawer-content">内容</div></div>}
                  {element.type === 'popover' && <div className="designer-element__preview-popover"><div className="popover-content">{String(element.props.content || '提示内容')}</div></div>}
                  {element.type === 'tooltip' && <div className="designer-element__preview-tooltip">{String(element.props.text || '提示文字')}</div>}
                  {element.type === 'notification' && <div className="designer-element__preview-notification"><Bell size={16} /><div><div className="title">{String(element.props.title || '通知标题')}</div><div className="content">{String(element.props.content || '通知内容')}</div></div></div>}
                  {element.type === 'result' && <div className="designer-element__preview-result"><CheckCircle size={48} /><div className="title">{String(element.props.title || '操作成功')}</div></div>}
                  {element.type === 'dropdown' && <div className="designer-element__preview-dropdown"><span>下拉菜单</span><ChevronDown size={14} /></div>}
                  {element.type === 'steps' && (
                    <div className="designer-element__preview-steps">
                      <div className="step-item is-active">
                        <span className="step-number">1</span>
                        <span className="step-text">步骤1</span>
                      </div>
                      <div className="step-line" />
                      <div className="step-item">
                        <span className="step-number">2</span>
                        <span className="step-text">步骤2</span>
                      </div>
                      <div className="step-line" />
                      <div className="step-item">
                        <span className="step-number">3</span>
                        <span className="step-text">步骤3</span>
                      </div>
                    </div>
                  )}
                  {element.type === 'backtop' && <div className="designer-element__preview-backtop"><ChevronUp size={16} /></div>}
                  {element.type === 'anchor' && <div className="designer-element__preview-anchor"><div className="is-active">锚点 1</div><div>锚点 2</div><div>锚点 3</div></div>}
                  {element.type === 'form' && <div className="designer-element__preview-form"><div className="form-item"><label>标签</label><input /></div><div className="form-item"><label>标签</label><input /></div></div>}
                  {element.type === 'formitem' && <div className="designer-element__preview-formitem"><label>{String(element.props.label || '标签')}</label><input /></div>}
                  {element.type === 'buttongroup' && <div className="designer-element__preview-buttongroup"><button>按钮1</button><button>按钮2</button></div>}
                  {element.type === 'inputgroup' && <div className="designer-element__preview-inputgroup"><span>前缀</span><input /><span>后缀</span></div>}
                  {element.type === 'carousel' && <div className="designer-element__preview-carousel"><ImagePlus size={24} /></div>}
                  {element.type === 'gallery' && <div className="designer-element__preview-gallery"><Image size={24} /></div>}
                  {element.type === 'player' && <div className="designer-element__preview-player"><Play size={32} /></div>}
                  {!['text', 'heading', 'paragraph', 'button', 'input', 'textarea', 'checkbox', 'radio', 'toggle', 'slider', 'select', 'container', 'box', 'flex', 'grid', 'spacer', 'image', 'video', 'audio', 'icon', 'divider', 'card', 'link', 'avatar', 'badge', 'tag', 'iframe', 'table', 'list', 'progress', 'spinner', 'alert', 'navbar', 'tabs', 'breadcrumb', 'menu', 'datepicker', 'timepicker', 'fileupload', 'colorpicker', 'columns', 'rows', 'sidebar', 'footer', 'number', 'search', 'password', 'rating', 'stepper', 'range', 'code', 'quote', 'skeleton', 'chart', 'tree', 'timeline', 'pagination', 'statistic', 'calendar', 'toast', 'modal', 'drawer', 'popover', 'tooltip', 'notification', 'result', 'dropdown', 'steps', 'backtop', 'anchor', 'form', 'formitem', 'buttongroup', 'inputgroup', 'carousel', 'gallery', 'player'].includes(element.type) && (
                    <div className="designer-element__preview-custom">
                      <Component size={16} />
                      <span>{element.name || element.type}</span>
                    </div>
                  )}
                </div>
                {element.locked && (
                  <div className="designer-element__lock-icon">
                    <Lock size={16} />
                  </div>
                )}
                {selectedIds.has(element.id) && !element.locked && (
                  <>
                    <div className="designer-element__resize designer-element__resize--nw" onMouseDown={(e) => handleResizeMouseDown(e, element, 'nw')} />
                    <div className="designer-element__resize designer-element__resize--ne" onMouseDown={(e) => handleResizeMouseDown(e, element, 'ne')} />
                    <div className="designer-element__resize designer-element__resize--sw" onMouseDown={(e) => handleResizeMouseDown(e, element, 'sw')} />
                    <div className="designer-element__resize designer-element__resize--se" onMouseDown={(e) => handleResizeMouseDown(e, element, 'se')} />
                    <div className="designer-element__resize designer-element__resize--n" onMouseDown={(e) => handleResizeMouseDown(e, element, 'n')} />
                    <div className="designer-element__resize designer-element__resize--s" onMouseDown={(e) => handleResizeMouseDown(e, element, 's')} />
                    <div className="designer-element__resize designer-element__resize--w" onMouseDown={(e) => handleResizeMouseDown(e, element, 'w')} />
                    <div className="designer-element__resize designer-element__resize--e" onMouseDown={(e) => handleResizeMouseDown(e, element, 'e')} />
                  </>
                )}
              </div>
            ))}
            {isCanvasSelected && (
              <>
                <div className="designer-canvas__resize designer-canvas__resize--nw" onMouseDown={(e) => handleCanvasResizeMouseDown(e, 'nw')} />
                <div className="designer-canvas__resize designer-canvas__resize--ne" onMouseDown={(e) => handleCanvasResizeMouseDown(e, 'ne')} />
                <div className="designer-canvas__resize designer-canvas__resize--sw" onMouseDown={(e) => handleCanvasResizeMouseDown(e, 'sw')} />
                <div className="designer-canvas__resize designer-canvas__resize--se" onMouseDown={(e) => handleCanvasResizeMouseDown(e, 'se')} />
                <div className="designer-canvas__resize designer-canvas__resize--n" onMouseDown={(e) => handleCanvasResizeMouseDown(e, 'n')} />
                <div className="designer-canvas__resize designer-canvas__resize--s" onMouseDown={(e) => handleCanvasResizeMouseDown(e, 's')} />
                <div className="designer-canvas__resize designer-canvas__resize--w" onMouseDown={(e) => handleCanvasResizeMouseDown(e, 'w')} />
                <div className="designer-canvas__resize designer-canvas__resize--e" onMouseDown={(e) => handleCanvasResizeMouseDown(e, 'e')} />
              </>
            )}
            {selectionBox?.isSelecting && (
              <div 
                className="designer-selection-box"
                style={{
                  left: Math.min(selectionBox.startX, selectionBox.endX),
                  top: Math.min(selectionBox.startY, selectionBox.endY),
                  width: Math.abs(selectionBox.endX - selectionBox.startX),
                  height: Math.abs(selectionBox.endY - selectionBox.startY),
                }}
              />
            )}
            {alignmentLines.horizontal.length > 0 && alignmentLines.horizontal.map((y, index) => (
              <div
                key={`h-${index}`}
                className="designer-alignment-line designer-alignment-line--horizontal"
                style={{ 
                  top: y,
                  '--alignment-line-color': alignmentLineColor,
                  borderTopStyle: alignmentLineStyle,
                } as React.CSSProperties}
              />
            ))}
            {alignmentLines.vertical.length > 0 && alignmentLines.vertical.map((x, index) => (
              <div
                key={`v-${index}`}
                className="designer-alignment-line designer-alignment-line--vertical"
                style={{ 
                  left: x,
                  '--alignment-line-color': alignmentLineColor,
                  borderLeftStyle: alignmentLineStyle,
                } as React.CSSProperties}
              />
            ))}
            </div>
          </div>
        </div>

        <div 
          className={`designer-panel-resizer designer-panel-resizer--right ${isResizingPanel === 'right' ? 'is-active' : ''}`}
          onMouseDown={handlePanelResizeStart('right')}
        />
        <div style={{ width: rightPanelWidth, flexShrink: 0 }}>
          <DesignerPropertiesPanel
            isCanvasSelected={isCanvasSelected}
            canvasSettings={canvasSettings}
            setCanvasSettings={setCanvasSettings}
            selectedElement={selectedElement}
            selectedIds={selectedIds}
            updateElement={updateElement}
            deleteElements={deleteElements}
            duplicateElements={duplicateElements}
            groupElements={groupElements}
            elements={elements}
            setSelectedIds={setSelectedIds}
            draggedLayerId={draggedLayerId}
            handleLayerDragStart={handleLayerDragStart}
            handleLayerDragOver={handleLayerDragOver}
            handleLayerDragEnd={handleLayerDragEnd}
            t={t}
            filePath={filePath}
            windowName={canvasSettings.name}
          />
        </div>
      </div>

      {contextMenu.visible && createPortal(
        <div 
          className="designer-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="designer-context-menu__item" onClick={() => { duplicateElements(Array.from(selectedIds)); setContextMenu({ visible: false, x: 0, y: 0, elementId: null }); }}>
            <Copy size={14} />
            <span>复制</span>
            <span className="designer-context-menu__shortcut">Ctrl+C</span>
          </div>
          <div className="designer-context-menu__divider" />
          <div className="designer-context-menu__item" onClick={() => { bringToFront(Array.from(selectedIds)); setContextMenu({ visible: false, x: 0, y: 0, elementId: null }); }}>
            <BringToFront size={14} />
            <span>置于顶层</span>
          </div>
          <div className="designer-context-menu__item" onClick={() => { sendToBack(Array.from(selectedIds)); setContextMenu({ visible: false, x: 0, y: 0, elementId: null }); }}>
            <SendToBack size={14} />
            <span>置于底层</span>
          </div>
          <div className="designer-context-menu__divider" />
          {selectedIds.size > 1 && (
            <div className="designer-context-menu__item" onClick={() => { groupElements(Array.from(selectedIds)); setContextMenu({ visible: false, x: 0, y: 0, elementId: null }); }}>
              <Group size={14} />
              <span>组合</span>
              <span className="designer-context-menu__shortcut">Ctrl+G</span>
            </div>
          )}
          {selectedElement?.groupId && (
            <div className="designer-context-menu__item" onClick={() => { ungroupElements(Array.from(selectedIds)); setContextMenu({ visible: false, x: 0, y: 0, elementId: null }); }}>
              <Ungroup size={14} />
              <span>取消组合</span>
              <span className="designer-context-menu__shortcut">Ctrl+Shift+G</span>
            </div>
          )}
          <div className="designer-context-menu__divider" />
          {selectedElement && (
            <>
              <div className="designer-context-menu__item" onClick={() => { updateElement(selectedElement.id, { locked: !selectedElement.locked }); setContextMenu({ visible: false, x: 0, y: 0, elementId: null }); }}>
                {selectedElement.locked ? <Unlock size={14} /> : <Lock size={14} />}
                <span>{selectedElement.locked ? '解锁' : '锁定'}</span>
              </div>
              <div className="designer-context-menu__item" onClick={() => { updateElement(selectedElement.id, { hidden: !selectedElement.hidden }); setContextMenu({ visible: false, x: 0, y: 0, elementId: null }); }}>
                {selectedElement.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>{selectedElement.hidden ? '显示' : '隐藏'}</span>
              </div>
            </>
          )}
          <div className="designer-context-menu__divider" />
          <div className="designer-context-menu__item designer-context-menu__item--danger" onClick={() => { deleteElements(Array.from(selectedIds)); setContextMenu({ visible: false, x: 0, y: 0, elementId: null }); }}>
            <Trash2 size={14} />
            <span>删除</span>
            <span className="designer-context-menu__shortcut">Del</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DesignerScene;
