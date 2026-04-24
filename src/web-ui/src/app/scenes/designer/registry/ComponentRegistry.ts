import type { ComponentDefinition, ComponentCategory, PropertyConfig, EventConfig } from './types';
import { COMMON_STYLE_PROPERTIES, COMMON_LAYOUT_PROPERTIES, COMMON_EVENT_PROPERTIES, DEFAULT_EVENTS, DEFAULT_CATEGORIES } from './types';

class ComponentRegistry {
  private components = new Map<string, ComponentDefinition>();
  private categories = new Map<string, ComponentCategory>();
  private listeners = new Set<() => void>();

  constructor() {
    DEFAULT_CATEGORIES.forEach(cat => this.categories.set(cat.id, cat));
  }

  register(definition: ComponentDefinition): void {
    const fullDefinition = this.applyDefaults(definition);
    this.components.set(definition.id, fullDefinition);
    this.notifyListeners();
  }

  registerMany(definitions: ComponentDefinition[]): void {
    definitions.forEach(def => {
      const fullDefinition = this.applyDefaults(def);
      this.components.set(def.id, fullDefinition);
    });
    this.notifyListeners();
  }

  unregister(id: string): boolean {
    const result = this.components.delete(id);
    if (result) {
      this.notifyListeners();
    }
    return result;
  }

  get(id: string): ComponentDefinition | undefined {
    return this.components.get(id);
  }

  has(id: string): boolean {
    return this.components.has(id);
  }

  getAll(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  getByCategory(category: string): ComponentDefinition[] {
    return this.getAll().filter(c => c.category === category);
  }

  getCategories(): ComponentCategory[] {
    return Array.from(this.categories.values()).sort((a, b) => a.order - b.order);
  }

  addCategory(category: ComponentCategory): void {
    this.categories.set(category.id, category);
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  private applyDefaults(definition: ComponentDefinition): ComponentDefinition {
    const properties = [
      ...definition.properties,
      ...COMMON_LAYOUT_PROPERTIES,
      ...COMMON_STYLE_PROPERTIES,
    ];

    const events = definition.events || DEFAULT_EVENTS;
    
    const hasEventProperties = definition.properties.some(p => p.type === 'event');
    if (!hasEventProperties) {
      properties.push(...COMMON_EVENT_PROPERTIES);
    }

    const tabs = definition.tabs || [
      { id: 'basic', label: '基础', propertyKeys: definition.properties.map(p => p.key) },
      { id: 'layout', label: '布局', propertyKeys: COMMON_LAYOUT_PROPERTIES.map(p => p.key) },
      { id: 'style', label: '样式', propertyKeys: COMMON_STYLE_PROPERTIES.map(p => p.key) },
      { id: 'events', label: '事件', propertyKeys: events.map(e => `events.${e.type}`) },
    ];

    return {
      ...definition,
      properties,
      events,
      tabs,
    };
  }

  exportConfig(id: string): string | null {
    const def = this.components.get(id);
    if (!def) return null;
    return JSON.stringify(def, null, 2);
  }

  importConfig(json: string): boolean {
    try {
      const definition = JSON.parse(json) as ComponentDefinition;
      if (!definition.id || !definition.name) {
        console.error('Invalid component definition: missing id or name');
        return false;
      }
      this.register(definition);
      return true;
    } catch (error) {
      console.error('Failed to import component:', error);
      return false;
    }
  }

  clear(): void {
    this.components.clear();
    this.notifyListeners();
  }
}

export const componentRegistry = new ComponentRegistry();

export { ComponentRegistry };
