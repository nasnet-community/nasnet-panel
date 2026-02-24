/**
 * Custom Templates IndexedDB Hook
 * NAS-7.6: Firewall Templates Feature
 *
 * @description
 * Provides CRUD operations for custom firewall templates stored in IndexedDB.
 * Uses localforage for IndexedDB abstraction with class-based wrapper pattern.
 */
import type { FirewallTemplate } from '../schemas/templateSchemas';
/**
 * Custom templates store using localforage
 */
declare class CustomTemplatesStore {
    private store;
    private initialized;
    constructor();
    /**
     * Initialize the store (creates DB if needed)
     */
    init(): Promise<void>;
    /**
     * Get all custom templates
     */
    getAll(): Promise<FirewallTemplate[]>;
    /**
     * Get a specific template by ID
     */
    getById(id: string): Promise<FirewallTemplate | null>;
    /**
     * Save a custom template (create or update)
     */
    save(template: FirewallTemplate): Promise<void>;
    /**
     * Remove a custom template
     */
    remove(id: string): Promise<void>;
    /**
     * Remove all custom templates
     */
    clear(): Promise<void>;
    /**
     * Check if a template exists
     */
    exists(id: string): Promise<boolean>;
    /**
     * Get count of custom templates
     */
    count(): Promise<number>;
    /**
     * Export all templates as JSON
     */
    export(): Promise<string>;
    /**
     * Import templates from JSON
     * Returns count of imported templates
     */
    import(json: string): Promise<number>;
}
declare const customTemplatesStore: CustomTemplatesStore;
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
export declare function useCustomTemplates(): UseCustomTemplatesResult;
export { customTemplatesStore };
//# sourceMappingURL=useCustomTemplates.d.ts.map