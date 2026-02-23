/**
 * useFormSection Hook
 *
 * Headless hook for managing form section collapse state with localStorage persistence.
 * Supports SSR by checking for window availability.
 *
 * @module @nasnet/ui/patterns/form-section
 * @see NAS-4A.13: Build Form Section Component
 */
import type { UseFormSectionConfig, UseFormSectionReturn } from './form-section.types';
/**
 * Slugify a string for use as a storage key.
 * Converts to lowercase, replaces spaces with hyphens, removes special characters.
 */
export declare function slugify(str: string): string;
/**
 * Hook for managing form section collapse state.
 *
 * Features:
 * - Collapse/expand state management
 * - localStorage persistence across page navigations
 * - SSR safe (checks for window availability)
 *
 * @param config - Configuration object
 * @returns State and control functions
 *
 * @example
 * ```tsx
 * function MySection() {
 *   const { isExpanded, toggle, expand, collapse } = useFormSection({
 *     storageKey: 'network-settings',
 *     defaultOpen: true,
 *     collapsible: true,
 *   });
 *
 *   return (
 *     <section>
 *       <button onClick={toggle}>
 *         {isExpanded ? 'Collapse' : 'Expand'}
 *       </button>
 *       {isExpanded && <div>Content</div>}
 *     </section>
 *   );
 * }
 * ```
 */
export declare function useFormSection({ storageKey, defaultOpen, collapsible, }: UseFormSectionConfig): UseFormSectionReturn;
//# sourceMappingURL=useFormSection.d.ts.map