import * as React from "react";
/**
 * Feature categories for NasNetConnect
 * Each category has a distinct accent color for visual identification
 */
export declare const CATEGORIES: readonly ["security", "monitoring", "networking", "vpn", "wifi", "firewall", "system", "dhcp", "routing", "tunnels", "qos", "hotspot", "logging", "backup"];
export type Category = (typeof CATEGORIES)[number];
/**
 * Category metadata including colors and labels
 */
export interface CategoryMeta {
    id: Category;
    label: string;
    description: string;
    /** CSS variable name for the accent color */
    cssVar: string;
    /** Tailwind class for background color */
    bgClass: string;
    /** Tailwind class for text color */
    textClass: string;
    /** Tailwind class for border color */
    borderClass: string;
}
/**
 * Category metadata map with colors and labels
 */
export declare const CATEGORY_META: Record<Category, CategoryMeta>;
/**
 * Context value for category accent
 */
interface CategoryAccentContextValue {
    /** Currently active category */
    category: Category | null;
    /** Metadata for the current category */
    meta: CategoryMeta | null;
    /** Set the active category */
    setCategory: (category: Category | null) => void;
    /** Get metadata for a specific category */
    getCategoryMeta: (category: Category) => CategoryMeta;
    /** All available categories */
    categories: readonly Category[];
}
/**
 * CategoryAccentProvider Props
 */
export interface CategoryAccentProviderProps {
    children: React.ReactNode;
    /** Initial category to set */
    defaultCategory?: Category;
}
/**
 * CategoryAccentProvider Component
 *
 * Provides category accent context for contextual theming of feature areas.
 * Components within a category context can use the accent color for visual distinction.
 *
 * Each of the 14 categories (security, monitoring, networking, vpn, wifi, firewall, system,
 * dhcp, routing, tunnels, qos, hotspot, logging, backup) has a distinct color that can be
 * used to visually identify feature sections.
 *
 * @param {React.ReactNode} children - Child components that can access the category context
 * @param {Category} [defaultCategory] - Optional initial category to set
 *
 * @see {@link useCategoryAccent} - Hook to access the current category context
 * @see {@link getCategoryMeta} - Function to get metadata for a specific category
 * @see {@link CATEGORY_META} - Record of all category metadata
 *
 * @example Basic usage
 * ```tsx
 * <CategoryAccentProvider defaultCategory="vpn">
 *   <VPNFeature />
 * </CategoryAccentProvider>
 * ```
 *
 * @example Using the hook
 * ```tsx
 * function VPNFeature() {
 *   const { category, meta, setCategory } = useCategoryAccent();
 *   return (
 *     <div className={cn('p-4', meta?.bgClass)}>
 *       Current category: {category}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function CategoryAccentProvider({ children, defaultCategory, }: CategoryAccentProviderProps): import("react/jsx-runtime").JSX.Element;
export declare namespace CategoryAccentProvider {
    var displayName: string;
}
/**
 * useCategoryAccent Hook
 *
 * Access the current category accent context.
 * Must be used within a CategoryAccentProvider.
 *
 * @throws {Error} If used outside of CategoryAccentProvider
 * @returns {CategoryAccentContextValue} The current category context value
 *
 * @example
 * ```tsx
 * const { category, meta, setCategory } = useCategoryAccent();
 *
 * // Use meta.bgClass for styling
 * <div className={cn('p-4', meta?.bgClass)}>...</div>
 * ```
 */
export declare function useCategoryAccent(): CategoryAccentContextValue;
export declare namespace useCategoryAccent {
    var displayName: string;
}
/**
 * Get category metadata without context (for use outside provider)
 */
export declare function getCategoryMeta(category: Category): CategoryMeta;
/**
 * Check if a string is a valid category
 */
export declare function isCategory(value: string): value is Category;
export {};
//# sourceMappingURL=category-accent-provider.d.ts.map