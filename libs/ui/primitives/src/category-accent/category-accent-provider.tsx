"use client"

import * as React from "react"
import { createContext, useContext, useMemo } from "react"

/**
 * Feature categories for NasNetConnect
 * Each category has a distinct accent color for visual identification
 */
export const CATEGORIES = [
  'security',
  'monitoring',
  'networking',
  'vpn',
  'wifi',
  'firewall',
  'system',
  'dhcp',
  'routing',
  'tunnels',
  'qos',
  'hotspot',
  'logging',
  'backup',
] as const;

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
export const CATEGORY_META: Record<Category, CategoryMeta> = {
  security: {
    id: 'security',
    label: 'Security',
    description: 'Security features and configurations',
    cssVar: '--semantic-color-category-security',
    bgClass: 'bg-category-security',
    textClass: 'text-category-security',
    borderClass: 'border-category-security',
  },
  monitoring: {
    id: 'monitoring',
    label: 'Monitoring',
    description: 'System and network monitoring',
    cssVar: '--semantic-color-category-monitoring',
    bgClass: 'bg-category-monitoring',
    textClass: 'text-category-monitoring',
    borderClass: 'border-category-monitoring',
  },
  networking: {
    id: 'networking',
    label: 'Networking',
    description: 'Network configuration and management',
    cssVar: '--semantic-color-category-networking',
    bgClass: 'bg-category-networking',
    textClass: 'text-category-networking',
    borderClass: 'border-category-networking',
  },
  vpn: {
    id: 'vpn',
    label: 'VPN',
    description: 'Virtual private network services',
    cssVar: '--semantic-color-category-vpn',
    bgClass: 'bg-category-vpn',
    textClass: 'text-category-vpn',
    borderClass: 'border-category-vpn',
  },
  wifi: {
    id: 'wifi',
    label: 'WiFi',
    description: 'Wireless network configuration',
    cssVar: '--semantic-color-category-wifi',
    bgClass: 'bg-category-wifi',
    textClass: 'text-category-wifi',
    borderClass: 'border-category-wifi',
  },
  firewall: {
    id: 'firewall',
    label: 'Firewall',
    description: 'Firewall rules and policies',
    cssVar: '--semantic-color-category-firewall',
    bgClass: 'bg-category-firewall',
    textClass: 'text-category-firewall',
    borderClass: 'border-category-firewall',
  },
  system: {
    id: 'system',
    label: 'System',
    description: 'System settings and configuration',
    cssVar: '--semantic-color-category-system',
    bgClass: 'bg-category-system',
    textClass: 'text-category-system',
    borderClass: 'border-category-system',
  },
  dhcp: {
    id: 'dhcp',
    label: 'DHCP',
    description: 'DHCP server configuration',
    cssVar: '--semantic-color-category-dhcp',
    bgClass: 'bg-category-dhcp',
    textClass: 'text-category-dhcp',
    borderClass: 'border-category-dhcp',
  },
  routing: {
    id: 'routing',
    label: 'Routing',
    description: 'Routing tables and protocols',
    cssVar: '--semantic-color-category-routing',
    bgClass: 'bg-category-routing',
    textClass: 'text-category-routing',
    borderClass: 'border-category-routing',
  },
  tunnels: {
    id: 'tunnels',
    label: 'Tunnels',
    description: 'Network tunnels and overlays',
    cssVar: '--semantic-color-category-tunnels',
    bgClass: 'bg-category-tunnels',
    textClass: 'text-category-tunnels',
    borderClass: 'border-category-tunnels',
  },
  qos: {
    id: 'qos',
    label: 'QoS',
    description: 'Quality of Service settings',
    cssVar: '--semantic-color-category-qos',
    bgClass: 'bg-category-qos',
    textClass: 'text-category-qos',
    borderClass: 'border-category-qos',
  },
  hotspot: {
    id: 'hotspot',
    label: 'Hotspot',
    description: 'Hotspot portal and authentication',
    cssVar: '--semantic-color-category-hotspot',
    bgClass: 'bg-category-hotspot',
    textClass: 'text-category-hotspot',
    borderClass: 'border-category-hotspot',
  },
  logging: {
    id: 'logging',
    label: 'Logging',
    description: 'System logs and diagnostics',
    cssVar: '--semantic-color-category-logging',
    bgClass: 'bg-category-logging',
    textClass: 'text-category-logging',
    borderClass: 'border-category-logging',
  },
  backup: {
    id: 'backup',
    label: 'Backup',
    description: 'Backup and restore operations',
    cssVar: '--semantic-color-category-backup',
    bgClass: 'bg-category-backup',
    textClass: 'text-category-backup',
    borderClass: 'border-category-backup',
  },
};

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

const CategoryAccentContext = createContext<CategoryAccentContextValue | undefined>(undefined);

/**
 * CategoryAccentProvider Props
 */
export interface CategoryAccentProviderProps {
  children: React.ReactNode;
  /** Initial category to set */
  defaultCategory?: Category;
}

/**
 * CategoryAccentProvider
 *
 * Provides category accent context for contextual theming of feature areas.
 * Components within a category context can use the accent color for visual distinction.
 *
 * Usage:
 * ```tsx
 * <CategoryAccentProvider defaultCategory="vpn">
 *   <VPNFeature />
 * </CategoryAccentProvider>
 * ```
 */
export function CategoryAccentProvider({
  children,
  defaultCategory,
}: CategoryAccentProviderProps) {
  const [category, setCategory] = React.useState<Category | null>(defaultCategory ?? null);

  const meta = useMemo(() => {
    return category ? CATEGORY_META[category] : null;
  }, [category]);

  const getCategoryMeta = React.useCallback((cat: Category): CategoryMeta => {
    return CATEGORY_META[cat];
  }, []);

  const value = useMemo<CategoryAccentContextValue>(
    () => ({
      category,
      meta,
      setCategory,
      getCategoryMeta,
      categories: CATEGORIES,
    }),
    [category, meta, getCategoryMeta]
  );

  return (
    <CategoryAccentContext.Provider value={value}>
      {children}
    </CategoryAccentContext.Provider>
  );
}

/**
 * useCategoryAccent Hook
 *
 * Access the current category accent context.
 *
 * Usage:
 * ```tsx
 * const { category, meta, setCategory } = useCategoryAccent();
 *
 * // Use meta.bgClass for styling
 * <div className={cn('p-4', meta?.bgClass)}>...</div>
 * ```
 */
export function useCategoryAccent(): CategoryAccentContextValue {
  const context = useContext(CategoryAccentContext);

  if (!context) {
    throw new Error('useCategoryAccent must be used within a CategoryAccentProvider');
  }

  return context;
}

/**
 * Get category metadata without context (for use outside provider)
 */
export function getCategoryMeta(category: Category): CategoryMeta {
  return CATEGORY_META[category];
}

/**
 * Check if a string is a valid category
 */
export function isCategory(value: string): value is Category {
  return CATEGORIES.includes(value as Category);
}
