/**
 * useBreadcrumb Hook
 * Headless hook for breadcrumb logic based on TanStack Router
 *
 * Features:
 * - Auto-generates breadcrumbs from route matches
 * - Supports route meta for custom labels
 * - Resolves dynamic params
 * - RTL language support
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */

import { useMemo } from 'react';

import { useMatches, useRouter, Link } from '@tanstack/react-router';

/**
 * Breadcrumb segment
 */
export interface BreadcrumbSegment {
  /** Unique key for the segment */
  key: string;
  /** Display label */
  label: string;
  /** Path to navigate to */
  path: string;
  /** Whether this is the current page */
  isCurrent: boolean;
}

/**
 * Hook return type
 */
export interface UseBreadcrumbReturn {
  /** Breadcrumb segments */
  segments: BreadcrumbSegment[];
  /** Text direction */
  dir: 'ltr' | 'rtl';
  /** Separator icon name */
  separator: 'ChevronRight' | 'ChevronLeft';
  /** Whether there are breadcrumbs to display */
  hasBreadcrumbs: boolean;
}

/**
 * Detect text direction from document
 */
function useDirection(): 'ltr' | 'rtl' {
  if (typeof document === 'undefined') return 'ltr';
  return (document.documentElement.dir as 'ltr' | 'rtl') || 'ltr';
}

/**
 * Generate label from route ID
 * Converts route IDs like '/router/$id/network' to 'Network'
 */
function generateLabelFromId(routeId: string): string {
  // Extract the last segment
  const segments = routeId.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  if (!lastSegment) return 'Home';

  // Handle dynamic params
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
 * Route meta with breadcrumb config
 */
interface RouteMeta {
  breadcrumb?: string | ((params: Record<string, string>) => string);
  breadcrumbKey?: string; // For future i18n support
  hideBreadcrumb?: boolean;
}

/**
 * Headless hook for breadcrumb logic
 *
 * @example
 * ```tsx
 * function Breadcrumb() {
 *   const { segments, separator, hasBreadcrumbs } = useBreadcrumb();
 *
 *   if (!hasBreadcrumbs) return null;
 *
 *   return (
 *     <nav aria-label="Breadcrumb">
 *       <ol className="flex items-center gap-2">
 *         {segments.map((segment, index) => (
 *           <li key={segment.key} className="flex items-center gap-2">
 *             {index > 0 && <ChevronRight />}
 *             {segment.isCurrent ? (
 *               <span>{segment.label}</span>
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

      // Skip index routes (they duplicate parent)
      if (match.id.endsWith('/') && i < matches.length - 1) continue;

      // Generate label
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

    // Reverse for RTL
    return dir === 'rtl' ? [...breadcrumbs].reverse() : breadcrumbs;
  }, [matches, dir]);

  return {
    segments,
    dir,
    separator: dir === 'rtl' ? 'ChevronLeft' : 'ChevronRight',
    hasBreadcrumbs: segments.length > 1, // At least 2 segments to show breadcrumbs
  };
}

/**
 * Export Link component for use in breadcrumb
 */
export { Link };
