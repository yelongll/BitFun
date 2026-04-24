import { componentRegistry } from './ComponentRegistry';
import type { ComponentDefinition } from './types';

const CUSTOM_COMPONENTS_KEY = 'designer_custom_components';

export function loadCustomComponents(): ComponentDefinition[] {
  try {
    const stored = localStorage.getItem(CUSTOM_COMPONENTS_KEY);
    if (stored) {
      const components = JSON.parse(stored) as ComponentDefinition[];
      components.forEach(comp => {
        if (comp.category === 'custom' || !comp.category) {
          comp.category = 'custom';
        }
        componentRegistry.register(comp);
      });
      return components;
    }
  } catch (error) {
    console.error('Failed to load custom components:', error);
  }
  return [];
}

export function saveCustomComponent(definition: ComponentDefinition): boolean {
  try {
    const stored = localStorage.getItem(CUSTOM_COMPONENTS_KEY);
    const components: ComponentDefinition[] = stored ? JSON.parse(stored) : [];
    
    const existingIndex = components.findIndex(c => c.id === definition.id);
    if (existingIndex >= 0) {
      components[existingIndex] = definition;
    } else {
      components.push(definition);
    }
    
    localStorage.setItem(CUSTOM_COMPONENTS_KEY, JSON.stringify(components));
    
    if (definition.category === 'custom' || !definition.category) {
      definition.category = 'custom';
    }
    componentRegistry.register(definition);
    
    return true;
  } catch (error) {
    console.error('Failed to save custom component:', error);
    return false;
  }
}

export function deleteCustomComponent(id: string): boolean {
  try {
    const stored = localStorage.getItem(CUSTOM_COMPONENTS_KEY);
    if (!stored) return false;
    
    const components = JSON.parse(stored) as ComponentDefinition[];
    const filtered = components.filter(c => c.id !== id);
    
    localStorage.setItem(CUSTOM_COMPONENTS_KEY, JSON.stringify(filtered));
    componentRegistry.unregister(id);
    
    return true;
  } catch (error) {
    console.error('Failed to delete custom component:', error);
    return false;
  }
}

export function getCustomComponents(): ComponentDefinition[] {
  try {
    const stored = localStorage.getItem(CUSTOM_COMPONENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get custom components:', error);
    return [];
  }
}

export function importComponentFromJson(json: string): boolean {
  try {
    const definition = JSON.parse(json) as ComponentDefinition;
    
    if (!definition.id || !definition.name) {
      throw new Error('Invalid component definition: missing id or name');
    }
    
    if (!definition.defaultSize) {
      definition.defaultSize = { width: 100, height: 36 };
    }
    
    if (!definition.defaultProps) {
      definition.defaultProps = {};
    }
    
    return saveCustomComponent(definition);
  } catch (error) {
    console.error('Failed to import component:', error);
    return false;
  }
}

export function exportComponentToJson(id: string): string | null {
  return componentRegistry.exportConfig(id);
}
