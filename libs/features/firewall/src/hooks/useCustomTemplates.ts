/**
 * Custom Templates IndexedDB Hook
 * NAS-7.6: Firewall Templates Feature
 *
 * @description
 * Provides CRUD operations for custom firewall templates stored in IndexedDB.
 * Uses localforage for IndexedDB abstraction with class-based wrapper pattern.
 */

import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';
import type { FirewallTemplate } from '../schemas/templateSchemas';

// =============================================================================
// IndexedDB Store Configuration
// =============================================================================

const STORE_NAME = 'nnc-custom-firewall-templates';
const STORE_VERSION = 1;

/**
 * Custom templates store using localforage
 */
class CustomTemplatesStore {
  private store: LocalForage;
  private initialized: boolean = false;

  constructor() {
    this.store = localforage.createInstance({
      name: 'NasNetConnect',
      storeName: STORE_NAME,
      version: STORE_VERSION,
      description: 'Custom firewall templates created by users',
    });
  }

  /**
   * Initialize the store (creates DB if needed)
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Test if store is accessible
      await this.store.ready();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize custom templates store:', error);
      throw new Error('IndexedDB initialization failed');
    }
  }

  /**
   * Get all custom templates
   */
  async getAll(): Promise<FirewallTemplate[]> {
    await this.init();

    try {
      const templates: FirewallTemplate[] = [];
      await this.store.iterate<FirewallTemplate, void>((value) => {
        templates.push(value);
      });

      // Sort by name
      return templates.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Failed to load custom templates:', error);
      return [];
    }
  }

  /**
   * Get a specific template by ID
   */
  async getById(id: string): Promise<FirewallTemplate | null> {
    await this.init();

    try {
      const template = await this.store.getItem<FirewallTemplate>(id);
      return template;
    } catch (error) {
      console.error(`Failed to load template ${id}:`, error);
      return null;
    }
  }

  /**
   * Save a custom template (create or update)
   */
  async save(template: FirewallTemplate): Promise<void> {
    await this.init();

    try {
      // Ensure it's marked as custom
      const customTemplate: FirewallTemplate = {
        ...template,
        isBuiltIn: false,
        updatedAt: new Date(),
        createdAt: template.createdAt || new Date(),
      };

      await this.store.setItem(template.id, customTemplate);
    } catch (error) {
      console.error(`Failed to save template ${template.id}:`, error);
      throw new Error('Failed to save custom template');
    }
  }

  /**
   * Remove a custom template
   */
  async remove(id: string): Promise<void> {
    await this.init();

    try {
      await this.store.removeItem(id);
    } catch (error) {
      console.error(`Failed to remove template ${id}:`, error);
      throw new Error('Failed to remove custom template');
    }
  }

  /**
   * Remove all custom templates
   */
  async clear(): Promise<void> {
    await this.init();

    try {
      await this.store.clear();
    } catch (error) {
      console.error('Failed to clear custom templates:', error);
      throw new Error('Failed to clear custom templates');
    }
  }

  /**
   * Check if a template exists
   */
  async exists(id: string): Promise<boolean> {
    await this.init();

    try {
      const template = await this.store.getItem(id);
      return template !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get count of custom templates
   */
  async count(): Promise<number> {
    await this.init();

    try {
      return await this.store.length();
    } catch (error) {
      console.error('Failed to get template count:', error);
      return 0;
    }
  }

  /**
   * Export all templates as JSON
   */
  async export(): Promise<string> {
    const templates = await this.getAll();
    return JSON.stringify(templates, null, 2);
  }

  /**
   * Import templates from JSON
   * Returns count of imported templates
   */
  async import(json: string): Promise<number> {
    try {
      const templates = JSON.parse(json) as FirewallTemplate[];

      if (!Array.isArray(templates)) {
        throw new Error('Invalid template data format');
      }

      let imported = 0;
      for (const template of templates) {
        try {
          await this.save(template);
          imported++;
        } catch (error) {
          console.error(`Failed to import template ${template.id}:`, error);
        }
      }

      return imported;
    } catch (error) {
      console.error('Failed to import templates:', error);
      throw new Error('Failed to import templates');
    }
  }
}

// Singleton instance
const customTemplatesStore = new CustomTemplatesStore();

// =============================================================================
// React Hook
// =============================================================================

/**
 * Hook result interface
 */
export interface UseCustomTemplatesResult {
  templates: FirewallTemplate[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
  save: (template: FirewallTemplate) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  exists: (id: string) => Promise<boolean>;
  count: number;
  exportTemplates: () => Promise<string>;
  importTemplates: (json: string) => Promise<number>;
}

/**
 * Hook to manage custom firewall templates in IndexedDB
 *
 * @returns Custom templates state and operations
 *
 * @example
 * ```tsx
 * function TemplatesManager() {
 *   const {
 *     templates,
 *     loading,
 *     save,
 *     remove,
 *     reload,
 *   } = useCustomTemplates();
 *
 *   const handleSave = async (template: FirewallTemplate) => {
 *     await save(template);
 *     await reload();
 *   };
 *
 *   if (loading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       {templates.map(template => (
 *         <TemplateCard key={template.id} template={template} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCustomTemplates(): UseCustomTemplatesResult {
  const [templates, setTemplates] = useState<FirewallTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState(0);

  /**
   * Load templates from IndexedDB
   */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const loaded = await customTemplatesStore.getAll();
      setTemplates(loaded);
      setCount(loaded.length);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load templates');
      setError(error);
      setTemplates([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reload templates (public method)
   */
  const reload = useCallback(async () => {
    await load();
  }, [load]);

  /**
   * Save a template
   */
  const save = useCallback(
    async (template: FirewallTemplate) => {
      try {
        await customTemplatesStore.save(template);
        await load(); // Reload to get updated list
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to save template');
        setError(error);
        throw error;
      }
    },
    [load]
  );

  /**
   * Remove a template
   */
  const remove = useCallback(
    async (id: string) => {
      try {
        await customTemplatesStore.remove(id);
        await load(); // Reload to get updated list
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to remove template');
        setError(error);
        throw error;
      }
    },
    [load]
  );

  /**
   * Clear all templates
   */
  const clear = useCallback(async () => {
    try {
      await customTemplatesStore.clear();
      await load(); // Reload to get empty list
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to clear templates');
      setError(error);
      throw error;
    }
  }, [load]);

  /**
   * Check if template exists
   */
  const exists = useCallback(async (id: string): Promise<boolean> => {
    return customTemplatesStore.exists(id);
  }, []);

  /**
   * Export templates as JSON
   */
  const exportTemplates = useCallback(async (): Promise<string> => {
    return customTemplatesStore.export();
  }, []);

  /**
   * Import templates from JSON
   */
  const importTemplates = useCallback(
    async (json: string): Promise<number> => {
      const imported = await customTemplatesStore.import(json);
      await load(); // Reload to show imported templates
      return imported;
    },
    [load]
  );

  // Load templates on mount
  useEffect(() => {
    load();
  }, [load]);

  return {
    templates,
    loading,
    error,
    reload,
    save,
    remove,
    clear,
    exists,
    count,
    exportTemplates,
    importTemplates,
  };
}

// Export store for direct access if needed
export { customTemplatesStore };
