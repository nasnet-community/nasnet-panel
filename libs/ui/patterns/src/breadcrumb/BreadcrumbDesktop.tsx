/**
 * BreadcrumbDesktop Component
 * Desktop presenter for breadcrumbs (full path)
 *
 * Features:
 * - Full path display with 32–38px click targets
 * - All navigation items visible (no collapse needed)
 * - RTL support
 * - ARIA-compliant
 * - Keyboard navigation
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';

import { Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, Icon } from '@nasnet/ui/primitives';

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
const BreadcrumbDesktop = React.memo(function BreadcrumbDesktop({
  showHomeIcon = true,
  className,
}: BreadcrumbDesktopProps) {
  const { segments, separator, dir, hasBreadcrumbs } = useBreadcrumb();

  if (!hasBreadcrumbs) return null;

  const SeparatorIcon = separator === 'ChevronLeft' ? ChevronLeft : ChevronRight;

  return (
    <nav
      aria-label="Breadcrumb"
      dir={dir}
      className={cn('text-muted-foreground flex items-center gap-1.5 text-sm', className)}
    >
      <ol className="flex items-center gap-1.5">
        {segments.map((segment, index) => (
          <li
            key={segment.key}
            className="flex items-center"
          >
            {/* Separator (except first item) */}
            {index > 0 && (
              <Icon
                icon={SeparatorIcon}
                className="text-muted-foreground/50 h-4 w-4"
                aria-hidden="true"
              />
            )}

            {/* Segment */}
            {
              segment.isCurrent ?
                // Current page (not clickable)
                <span
                  aria-current="page"
                  className="text-foreground font-medium"
                >
                  {showHomeIcon && index === 0 ?
                    <span className="flex items-center gap-1.5">
                      <Icon
                        icon={Home}
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                      <span className="sr-only">{segment.label}</span>
                    </span>
                  : segment.label}
                </span>
                // Clickable link
              : <Link
                  to={segment.path}
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex cursor-pointer items-center rounded-sm px-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                >
                  {showHomeIcon && index === 0 ?
                    <span className="flex items-center gap-1.5">
                      <Icon
                        icon={Home}
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                      <span className="sr-only">{segment.label}</span>
                    </span>
                  : segment.label}
                </Link>

            }
          </li>
        ))}
      </ol>
    </nav>
  );
});

BreadcrumbDesktop.displayName = 'BreadcrumbDesktop';

export { BreadcrumbDesktop };
