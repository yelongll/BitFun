import React, { useState, useMemo, useEffect } from 'react';
import {
  Square,
  Layout,
  Grid3X3,
  Move,
  Columns,
  Rows,
  SidebarOpen,
  PanelBottom,
  RectangleHorizontal,
  TextCursorInput,
  Type,
  List,
  CheckSquare,
  CircleDot,
  ToggleLeft,
  SlidersHorizontal,
  Calendar,
  Clock,
  FileText,
  Palette,
  Hash,
  Search,
  Key,
  ThumbsUp,
  Plus,
  Link,
  Image,
  Video,
  Music,
  Component,
  Minus,
  User,
  Badge,
  Globe,
  Code,
  Loader,
  Table,
  BarChart3,
  GitBranch,
  Timer,
  FileCheck,
  AlertCircle,
  MessageSquare,
  Maximize,
  Info,
  Bell,
  CheckCircle,
  Menu,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  FormInput,
  ImagePlus,
  Play,
  LayoutGrid,
  Settings,
} from 'lucide-react';
import { componentRegistry, builtInComponents, loadCustomComponents, CustomComponentManagerPanel } from './registry';
import type { ComponentDefinition } from './registry';

const ICON_MAP: Record<string, React.ReactNode> = {
  'square': <Square size={16} />,
  'layout': <Layout size={16} />,
  'grid-3x3': <Grid3X3 size={16} />,
  'move': <Move size={16} />,
  'columns': <Columns size={16} />,
  'rows': <Rows size={16} />,
  'sidebar-open': <SidebarOpen size={16} />,
  'panel-bottom': <PanelBottom size={16} />,
  'rectangle-horizontal': <RectangleHorizontal size={16} />,
  'text-cursor-input': <TextCursorInput size={16} />,
  'type': <Type size={16} />,
  'list': <List size={16} />,
  'check-square': <CheckSquare size={16} />,
  'circle-dot': <CircleDot size={16} />,
  'toggle-left': <ToggleLeft size={16} />,
  'sliders-horizontal': <SlidersHorizontal size={16} />,
  'calendar': <Calendar size={16} />,
  'clock': <Clock size={16} />,
  'file-text': <FileText size={16} />,
  'palette': <Palette size={16} />,
  'hash': <Hash size={16} />,
  'search': <Search size={16} />,
  'key': <Key size={16} />,
  'thumbs-up': <ThumbsUp size={16} />,
  'plus': <Plus size={16} />,
  'link': <Link size={16} />,
  'image': <Image size={16} />,
  'video': <Video size={16} />,
  'music': <Music size={16} />,
  'component': <Component size={16} />,
  'minus': <Minus size={16} />,
  'user': <User size={16} />,
  'badge': <Badge size={16} />,
  'globe': <Globe size={16} />,
  'code': <Code size={16} />,
  'loader': <Loader size={16} />,
  'table': <Table size={16} />,
  'bar-chart-3': <BarChart3 size={16} />,
  'git-branch': <GitBranch size={16} />,
  'timer': <Timer size={16} />,
  'file-check': <FileCheck size={16} />,
  'alert-circle': <AlertCircle size={16} />,
  'message-square': <MessageSquare size={16} />,
  'maximize': <Maximize size={16} />,
  'info': <Info size={16} />,
  'bell': <Bell size={16} />,
  'check-circle': <CheckCircle size={16} />,
  'menu': <Menu size={16} />,
  'arrow-right': <ArrowRight size={16} />,
  'chevron-down': <ChevronDown size={16} />,
  'chevron-up': <ChevronUp size={16} />,
  'chevron-right': <ChevronRight size={16} />,
  'x': <X size={16} />,
  'form-input': <FormInput size={16} />,
  'image-plus': <ImagePlus size={16} />,
  'play': <Play size={16} />,
  'layout-grid': <LayoutGrid size={16} />,
};

export interface DesignerComponent {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: string;
  defaultProps: Record<string, unknown>;
  defaultSize: { width: number; height: number };
}

export function getIcon(iconName: string): React.ReactNode {
  return ICON_MAP[iconName] || <Square size={16} />;
}

function toDesignerComponent(def: ComponentDefinition): DesignerComponent {
  return {
    id: def.id,
    name: def.name,
    icon: getIcon(def.icon),
    category: def.category,
    defaultProps: def.defaultProps,
    defaultSize: def.defaultSize,
  };
}

export type ComponentViewMode = 'grid' | 'list' | 'icon';

interface DesignerComponentBoxProps {
  onDragStart: (e: React.DragEvent, component: DesignerComponent) => void;
}

const DesignerComponentBox: React.FC<DesignerComponentBoxProps> = ({ onDragStart }) => {
  const [componentViewMode, setComponentViewMode] = useState<ComponentViewMode>('grid');
  const [componentSearchTerm, setComponentSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['layout', 'input', 'basic', 'data', 'feedback', 'navigation', 'form', 'media', 'custom'])
  );
  const [components, setComponents] = useState<DesignerComponent[]>([]);
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    componentRegistry.registerMany(builtInComponents);
    loadCustomComponents();
    
    const updateComponents = () => {
      const allDefs = componentRegistry.getAll();
      setComponents(allDefs.map(toDesignerComponent));
    };
    
    updateComponents();
    
    return componentRegistry.subscribe(updateComponents);
  }, []);

  const categories = useMemo(() => {
    return componentRegistry.getCategories();
  }, [components]);

  const groupedComponents = useMemo(() => {
    return components.reduce((acc, comp) => {
      if (!acc[comp.category]) acc[comp.category] = [];
      acc[comp.category].push(comp);
      return acc;
    }, {} as Record<string, DesignerComponent[]>);
  }, [components]);

  const filteredComponents = useMemo(() => {
    if (componentSearchTerm.trim() === '') {
      return groupedComponents;
    }
    return Object.entries(groupedComponents).reduce((acc, [category, comps]) => {
      const filtered = comps.filter(comp =>
        comp.name.toLowerCase().includes(componentSearchTerm.toLowerCase()) ||
        comp.id.toLowerCase().includes(componentSearchTerm.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    }, {} as Record<string, DesignerComponent[]>);
  }, [componentSearchTerm, groupedComponents]);

  const getCategoryLabel = (categoryId: string): string => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || categoryId;
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="designer-panel designer-panel--left">
      <div className="designer-panel__header">
        <span className="designer-panel__title">控件箱</span>
        <div className="designer-panel__header-actions">
          <button
            className="designer-panel__view-btn"
            onClick={() => setShowManager(true)}
            title="管理自定义组件"
          >
            <Settings size={14} />
          </button>
          <button
            className={`designer-panel__view-btn ${componentViewMode === 'grid' ? 'is-active' : ''}`}
            onClick={() => setComponentViewMode('grid')}
            title="网格视图"
          >
            <Grid3X3 size={14} />
          </button>
          <button
            className={`designer-panel__view-btn ${componentViewMode === 'list' ? 'is-active' : ''}`}
            onClick={() => setComponentViewMode('list')}
            title="列表视图"
          >
            <List size={14} />
          </button>
          <button
            className={`designer-panel__view-btn ${componentViewMode === 'icon' ? 'is-active' : ''}`}
            onClick={() => setComponentViewMode('icon')}
            title="图标视图"
          >
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>
      <div className="designer-panel__search">
        <Search size={14} />
        <input
          type="text"
          placeholder="搜索控件..."
          value={componentSearchTerm}
          onChange={(e) => setComponentSearchTerm(e.target.value)}
        />
        {componentSearchTerm && (
          <button
            className="designer-panel__search-clear"
            onClick={() => setComponentSearchTerm('')}
          >
            <X size={12} />
          </button>
        )}
      </div>
      <div className="designer-panel__content">
        {Object.entries(filteredComponents).length === 0 ? (
          <div className="designer-panel__empty">未找到匹配的控件</div>
        ) : (
          Object.entries(filteredComponents).map(([category, comps]) => (
            <div key={category} className="designer-component-group">
              <div
                className="designer-component-group__header"
                onClick={() => toggleCategory(category)}
              >
                {expandedCategories.has(category) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>{getCategoryLabel(category)}</span>
              </div>
              {expandedCategories.has(category) && (
                <div className={`designer-component-group__items designer-component-group__items--${componentViewMode}`}>
                  {comps.map(comp => (
                    <div
                      key={comp.id}
                      className={`designer-component-item designer-component-item--${componentViewMode}`}
                      draggable
                      onDragStart={(e) => onDragStart(e, comp)}
                      title={comp.name}
                    >
                      {comp.icon}
                      <span>{comp.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <CustomComponentManagerPanel 
        isOpen={showManager} 
        onClose={() => setShowManager(false)} 
      />
    </div>
  );
};

export default DesignerComponentBox;
import './DesignerComponentBox.scss';
