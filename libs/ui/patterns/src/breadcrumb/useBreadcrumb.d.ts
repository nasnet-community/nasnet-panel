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
import { Link } from '@tanstack/react-router';
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
export declare function useBreadcrumb(): UseBreadcrumbReturn;
/**
 * Export Link component for use in breadcrumb
 */
export { Link };
//# sourceMappingURL=useBreadcrumb.d.ts.map