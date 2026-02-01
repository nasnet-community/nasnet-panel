/**
 * BreadcrumbDesktop Component
 * Desktop presenter for breadcrumbs (full path)
 *
 * Features:
 * - Full path display
 * - Clickable segments
 * - RTL support
 * - ARIA-compliant
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';

import { ChevronRight, ChevronLeft, Home } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import { useBreadcrumb, Link } from './useBreadcrumb';

/**
 * Props for BreadcrumbDesktop
 */
export interface BreadcrumbDesktopProps {
  /** Show home icon for first segment */
  showHomeIcon?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * Desktop breadcrumb presenter
 * Shows full navigation path
 */
export function BreadcrumbDesktop({
  showHomeIcon = true,
  className,
}: BreadcrumbDesktopProps) {
  const { segments, separator, dir, hasBreadcrumbs } = useBreadcrumb();

  if (!hasBreadcrumbs) return null;

  const Separator = separator === 'ChevronLeft' ? ChevronLeft : ChevronRight;

  return (
    <nav
      aria-label="Breadcrumb"
      dir={dir}
      className={cn('flex items-center', className)}
    >
      <ol className="flex items-center gap-1 text-sm">
        {segments.map((segment, index) => (
          <li key={segment.key} className="flex items-center">
            {/* Separator (except first item) */}
            {index > 0 && (
              <Separator
                className="mx-1 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            )}

            {/* Segment */}
            {segment.isCurrent ? (
              // Current page (not clickable)
              <span
                aria-current="page"
                className="font-medium text-foreground"
              >
                {showHomeIcon && index === 0 ? (
                  <span className="flex items-center gap-1.5">
                    <Home className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">{segment.label}</span>
                  </span>
                ) : (
                  segment.label
                )}
              </span>
            ) : (
              // Clickable link
              <Link
                to={segment.path}
                className="text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-1 -mx-1"
              >
                {showHomeIcon && index === 0 ? (
                  <span className="flex items-center gap-1.5">
                    <Home className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">{segment.label}</span>
                  </span>
                ) : (
                  segment.label
                )}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
