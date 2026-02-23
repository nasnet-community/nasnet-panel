/**
 * TemplateFilters Component
 *
 * @description Filter controls for template browsing with search, category, scope, and sort options.
 *
 * Features:
 * - Debounced search input
 * - Category dropdown (6 categories)
 * - Scope dropdown (3 scopes)
 * - Sort options (name, updated, category, service count)
 * - Built-in/Custom toggles
 * - Reset button when filters active
 *
 * @example
 * ```tsx
 * <TemplateFilters
 *   filters={{
 *     searchQuery: '',
 *     category: null,
 *     scope: null,
 *     sortBy: 'name',
 *     showBuiltIn: true,
 *     showCustom: true,
 *   }}
 *   onFiltersChange={(updates) => setFilters(prev => ({ ...prev, ...updates }))}
 *   onReset={() => setFilters(defaultFilters)}
 *   hasActiveFilters={false}
 * />
 * ```
 */
import React from 'react';
import type { TemplateFiltersProps } from './types';
declare function TemplateFiltersComponent({ filters, onFiltersChange, onReset, hasActiveFilters, className, }: TemplateFiltersProps): import("react/jsx-runtime").JSX.Element;
/**
 * TemplateFilters - Filter controls for template browser
 */
export declare const TemplateFilters: React.MemoExoticComponent<typeof TemplateFiltersComponent>;
export {};
//# sourceMappingURL=TemplateFilters.d.ts.map