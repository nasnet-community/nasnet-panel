/**
 * useBreadcrumb Hook
 * Headless hook for breadcrumb logic based on TanStack Router
 *
 * Provides all business logic for breadcrumb navigation with zero JSX.
 * Supports:
 * - Auto-generation from route matches
 * - Custom labels via route metadata
 * - Dynamic param resolution
 * - RTL language support
 * - Separation for accessibility
 *
 * @example
 * ```tsx
 * const { segments, separator, dir, hasBreadcrumbs } = useBreadcrumb();
 * ```
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */

import { useMemo } from 'react';

import { useMatches, Link } from '@tanstack/react-router';

/**
 * Breadcrumb segment
 *
 * Represents a single item in the breadcrumb trail.
 * Used by platform presenters to render clickable or current links.
 */
export interface BreadcrumbSegment {
  /** Unique key for the segment (route ID) */
  key: string;
  /** Display label (localized or auto-generated) */
  label: string;
  /** Absolute path to navigate to */
  path: string;
  /** Whether this is the current/active page */
  isCurrent: boolean;
}

/**
 * Hook return type
 *
 * Contains all state needed for breadcrumb presenters to render
 * different platform views without duplicating logic.
 */
export interface UseBreadcrumbReturn {
  /** Array of breadcrumb segments (already ordered for display) */
  segments: BreadcrumbSegment[];
  /** Text direction for RTL languages */
  dir: 'ltr' | 'rtl';
  /** Separator icon to use based on text direction */
  separator: 'ChevronRight' | 'ChevronLeft';
  /** Whether there are enough segments to display breadcrumbs (≥2) */
  hasBreadcrumbs: boolean;
}

/**
 * Detect text direction from document
 *
 * @returns 'ltr' for left-to-right, 'rtl' for right-to-left
 */
function useDirection(): 'ltr' | 'rtl' {
  if (typeof document === 'undefined') return 'ltr';
  return (document.documentElement.dir as 'ltr' | 'rtl') || 'ltr';
}

/**
 * Generate breadcrumb label from route ID
 *
 * Auto-generates human-readable labels when route meta doesn't provide one.
 *
 * @example
 * '/router/$id/network' → 'Network'
 * '/router/$id/firewall/nat' → 'NAT'
 * '/settings' → 'Settings'
 *
 * @param routeId - The route path to generate label for
 * @returns Human-readable label for the breadcrumb
 */
function generateLabelFromId(routeId: string): string {
  // Extract the last segment
  const segments = routeId.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  if (!lastSegment) return 'Home';

  // Handle dynamic params (e.g., $id → id)
  if (lastSegment.startsWith('$')) {
    return lastSegment.slice(1).charAt(0).toUpperCase() + lastSegment.slice(2);
  }

  // Convert kebab-case or snake_case to Title Case
  return lastSegment
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Route metadata with breadcrumb configuration
 *
 * Attach to route staticData to customize breadcrumb behavior.
 *
 * @example
 * ```tsx
 * createRoute({
 *   id: '/router/$id',
 *   getParentRoute: () => routerRoute,
 *   staticData: {
 *     breadcrumb: ({ id }) => `Router ${id}`,
 *     // OR
 *     breadcrumbKey: 'router.label', // For i18n
 *   },
 * })
 * ```
 */
interface RouteMeta {
  /** Custom breadcrumb label (string or function with params) */
  breadcrumb?: string | ((params: Record<string, string>) => string);
  /** i18n key for breadcrumb label (future enhancement) */
  breadcrumbKey?: string;
  /** Hide this route from breadcrumbs */
  hideBreadcrumb?: boolean;
}

/**
 * Headless hook for breadcrumb logic
 *
 * Auto-generates breadcrumb segments from TanStack Router matches.
 * All logic lives here; presenters only handle rendering.
 *
 * @returns Breadcrumb state: segments, direction, separator, display flag
 *
 * @example
 * ```tsx
 * function Breadcrumb() {
 *   const { segments, separator, dir, hasBreadcrumbs } = useBreadcrumb();
 *
 *   if (!hasBreadcrumbs) return null;
 *
 *   return (
 *     <nav aria-label="Breadcrumb" dir={dir}>
 *       <ol className="flex items-center gap-inlineGap">
 *         {segments.map((segment, index) => (
 *           <li key={segment.key} className="flex items-center">
 *             {index > 0 && <Icon name={`lucide:${separator.toLowerCase()}`} />}
 *             {segment.isCurrent ? (
 *               <span aria-current="page">{segment.label}</span>
 *             ) : (
 *               <Link to={segment.path}>{segment.label}</Link>
 *             )}
 *           </li>
 *         ))}
 *       </ol>
 *     </nav>
 *   );
 * }
 * ```
 */
export function useBreadcrumb(): UseBreadcrumbReturn {
  const matches = useMatches();
  const dir = useDirection();

  const segments = useMemo(() => {
    const breadcrumbs: BreadcrumbSegment[] = [];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const meta = (match.staticData || {}) as RouteMeta;

      // Skip if explicitly hidden
      if (meta.hideBreadcrumb) continue;

      // Skip index routes (they duplicate parent breadcrumb)
      if (match.id.endsWith('/') && i < matches.length - 1) continue;

      // Generate label from meta or route ID
      let label: string;
      if (typeof meta.breadcrumb === 'function') {
        label = meta.breadcrumb(match.params as Record<string, string>);
      } else if (meta.breadcrumb) {
        label = meta.breadcrumb;
      } else {
        label = generateLabelFromId(match.id);
      }

      // Skip empty labels
      if (!label) continue;

      breadcrumbs.push({
        key: match.id,
        label,
        path: match.pathname,
        isCurrent: i === matches.length - 1,
      });
    }

    // Reverse entire array for RTL (first becomes last visually)
    return dir === 'rtl' ? [...breadcrumbs].reverse() : breadcrumbs;
  }, [matches, dir]);

  return {
    segments,
    dir,
    separator: dir === 'rtl' ? 'ChevronLeft' : 'ChevronRight',
    // Only show breadcrumbs if at least 2 segments (otherwise redundant)
    hasBreadcrumbs: segments.length > 1,
  };
}

/**
 * Export Link component for use in breadcrumb
 */
export { Link };
