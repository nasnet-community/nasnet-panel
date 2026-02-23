/**
 * useServiceTemplateCard Hook
 *
 * Headless hook containing all business logic for ServiceTemplateCard.
 * Platform presenters consume this hook for shared state and behavior.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { useMemo, useCallback } from 'react';

import { SCOPE_COLORS } from './types';

import type {
  ServiceTemplateCardProps,
  TemplateAction,
  TemplateScope,
  TemplateCategory,
} from './types';

/**
 * Return type for useServiceTemplateCard hook
 */
export interface UseServiceTemplateCardReturn {
  // Template data
  templateId: string;
  name: string;
  description: string;
  category: TemplateCategory;
  scope: TemplateScope;
  icon: React.ReactNode | string | undefined;
  verified: boolean;

  // Scope styling
  scopeColors: { bg: string; text: string; label: string };

  // Category styling
  categoryColor: string;

  // Metadata (formatted)
  serviceCount: number;
  variableCount: number;
  formattedVariableCount: string;
  author: string | undefined;
  downloads: number | undefined;
  formattedDownloads: string | undefined;
  rating: number | undefined;
  updatedAt: string | undefined;
  version: string | undefined;
  sizeEstimate: string | undefined;

  // Actions
  primaryAction: TemplateAction | undefined;
  secondaryActions: TemplateAction[];
  hasActions: boolean;

  // Flags
  showMetadata: boolean;
  hasMetadata: boolean;

  // Event handlers (stable references)
  handleClick: () => void;
  handlePrimaryAction: () => void;
}

/**
 * Get color class for template category
 * Uses semantic color tokens from design system
 */
function getCategoryColor(category: TemplateCategory): string {
  switch (category) {
    case 'privacy':
      return 'text-category-vpn';
    case 'proxy':
      return 'text-category-networking';
    case 'dns':
      return 'text-category-monitoring';
    case 'security':
      return 'text-category-security';
    case 'monitoring':
      return 'text-category-firewall';
    case 'general':
    default:
      return 'text-muted-foreground';
  }
}

/**
 * Format download count to human-readable string
 */
function formatDownloads(downloads: number): string {
  if (downloads >= 1000000) {
    return `${(downloads / 1000000).toFixed(1)}M`;
  }
  if (downloads >= 1000) {
    return `${(downloads / 1000).toFixed(1)}K`;
  }
  return downloads.toString();
}

/**
 * Format date to relative time string
 */
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

/**
 * Format size estimate to human-readable string
 */
function formatSize(mb: number): string {
  if (mb < 1) {
    return `${(mb * 1024).toFixed(0)} KB`;
  }
  return `${mb.toFixed(1)} MB`;
}

/**
 * Headless hook for ServiceTemplateCard pattern
 *
 * Contains all business logic, state management, and computed values.
 * Event handlers are memoized for stable references.
 *
 * @example
 * ```tsx
 * function ServiceTemplateCardMobile(props: ServiceTemplateCardProps) {
 *   const {
 *     name,
 *     scopeColors,
 *     primaryAction,
 *     handlePrimaryAction,
 *   } = useServiceTemplateCard(props);
 *
 *   return (
 *     <Card>
 *       <h3>{name}</h3>
 *       <Badge className={scopeColors.bg}>{scopeColors.label}</Badge>
 *       {primaryAction && (
 *         <Button onClick={handlePrimaryAction}>{primaryAction.label}</Button>
 *       )}
 *     </Card>
 *   );
 * }
 * ```
 */
export function useServiceTemplateCard(
  props: ServiceTemplateCardProps
): UseServiceTemplateCardReturn {
  const {
    template,
    actions = [],
    onClick,
    showMetadata = true,
  } = props;

  // Extract template data
  const templateId = template.id;
  const name = template.name;
  const description = template.description || '';
  const category = template.category;
  const scope = template.scope;
  const icon = template.icon;
  const verified = template.verified || false;

  // Scope styling (memoized)
  const scopeColors = useMemo(() => SCOPE_COLORS[scope], [scope]);

  // Category styling (memoized)
  const categoryColor = useMemo(() => getCategoryColor(category), [category]);

  // Metadata (formatted)
  const serviceCount = template.metadata.serviceCount;
  const variableCount = template.metadata.variableCount || 0;
  const formattedVariableCount = useMemo(
    () => (variableCount === 0 ? 'No variables' : `${variableCount} variables`),
    [variableCount]
  );

  const author = template.metadata.author;
  const downloads = template.metadata.downloads;
  const formattedDownloads = useMemo(
    () => (downloads !== undefined ? formatDownloads(downloads) : undefined),
    [downloads]
  );

  const rating = template.metadata.rating;
  const updatedAt = useMemo(
    () =>
      template.metadata.updatedAt
        ? formatRelativeTime(template.metadata.updatedAt)
        : undefined,
    [template.metadata.updatedAt]
  );

  const version = template.metadata.version;
  const sizeEstimate = useMemo(
    () =>
      template.metadata.sizeEstimate !== undefined
        ? formatSize(template.metadata.sizeEstimate)
        : undefined,
    [template.metadata.sizeEstimate]
  );

  // Actions (memoized)
  const primaryAction = actions[0];
  const secondaryActions = useMemo(() => actions.slice(1), [actions]);
  const hasActions = actions.length > 0;

  // Flags
  const hasMetadata = useMemo(
    () =>
      showMetadata &&
      (!!author || downloads !== undefined || rating !== undefined),
    [showMetadata, author, downloads, rating]
  );

  // Event handlers with stable references
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const handlePrimaryAction = useCallback(() => {
    if (primaryAction && !primaryAction.disabled && !primaryAction.loading) {
      primaryAction.onClick();
    }
  }, [primaryAction]);

  return {
    // Template data
    templateId,
    name,
    description,
    category,
    scope,
    icon,
    verified,

    // Scope styling
    scopeColors,

    // Category styling
    categoryColor,

    // Metadata
    serviceCount,
    variableCount,
    formattedVariableCount,
    author,
    downloads,
    formattedDownloads,
    rating,
    updatedAt,
    version,
    sizeEstimate,

    // Actions
    primaryAction,
    secondaryActions,
    hasActions,

    // Flags
    showMetadata,
    hasMetadata,

    // Event handlers
    handleClick,
    handlePrimaryAction,
  };
}
