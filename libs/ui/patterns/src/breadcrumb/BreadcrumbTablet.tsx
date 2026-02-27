/**
 * BreadcrumbTablet Component
 * Tablet presenter for breadcrumbs (balanced view)
 *
 * Features:
 * - Balanced path display with selective collapsing
 * - 38–44px touch targets
 * - RTL support
 * - ARIA-compliant
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';
import { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Home, MoreHorizontal } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import { useBreadcrumb, Link } from './useBreadcrumb';

/**
 * Props for BreadcrumbTablet
 */
export interface BreadcrumbTabletProps {
  /** Show home icon for first segment */
  showHomeIcon?: boolean;
  /** Maximum segments to show before collapsing */
  maxVisible?: number;
  /** Optional className */
  className?: string;
}

/**
 * Tablet breadcrumb presenter
 * Shows balanced path with selective item collapsing
 */
const BreadcrumbTablet = React.memo(function BreadcrumbTablet({
  showHomeIcon = true,
  maxVisible = 3,
  className,
}: BreadcrumbTabletProps) {
  const { segments, separator, dir, hasBreadcrumbs } = useBreadcrumb();
  const [expanded, setExpanded] = useState(false);

  if (!hasBreadcrumbs) return null;

  const Separator = separator === 'ChevronLeft' ? ChevronLeft : ChevronRight;
  const shouldCollapse = segments.length > maxVisible && !expanded;

  // Get visible segments
  let visibleSegments = segments;
  let hiddenCount = 0;

  if (shouldCollapse) {
    // Show first, last, and one before last
    const lastIdx = segments.length - 1;
    visibleSegments = [segments[0], segments[lastIdx - 1], segments[lastIdx]];
    hiddenCount = segments.length - 3;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      dir={dir}
      className={cn('text-muted-foreground flex items-center gap-1.5 text-sm', className)}
    >
      <ol className="flex items-center gap-1.5">
        {visibleSegments.map((segment, index) => (
          <React.Fragment key={segment.key}>
            {/* Ellipsis for collapsed items */}
            {index === 1 && shouldCollapse && hiddenCount > 0 && (
              <>
                <Separator
                  className="text-muted-foreground/50 h-4 w-4"
                  aria-hidden="true"
                />
                <li>
                  <button
                    onClick={() => setExpanded(true)}
                    className="text-muted-foreground hover:bg-muted focus-visible:ring-ring flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                    aria-label={`Show ${hiddenCount} more items`}
                  >
                    <MoreHorizontal
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              </>
            )}

            {/* Separator */}
            {index > 0 && !(index === 1 && shouldCollapse) && (
              <Separator
                className="text-muted-foreground/50 h-4 w-4"
                aria-hidden="true"
              />
            )}

            {/* Segment */}
            <li className="flex min-h-[44px] items-center">
              {
                segment.isCurrent ?
                  // Current page (not clickable)
                  <span
                    aria-current="page"
                    className="text-foreground max-w-[120px] truncate font-medium"
                  >
                    {showHomeIcon && index === 0 ?
                      <span className="flex items-center gap-1.5">
                        <Home
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                        <span className="sr-only">{segment.label}</span>
                      </span>
                    : segment.label}
                  </span>
                  // Clickable link with touch target
                : <Link
                    to={segment.path}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex h-9 cursor-pointer items-center rounded-md px-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                  >
                    {showHomeIcon && index === 0 ?
                      <span className="flex items-center gap-1.5">
                        <Home
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                        <span className="sr-only">{segment.label}</span>
                      </span>
                    : <span className="max-w-[120px] truncate">{segment.label}</span>}
                  </Link>

              }
            </li>
          </React.Fragment>
        ))}
      </ol>

      {/* Expanded view overlay */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-card absolute left-1/2 top-1/2 max-h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-lg p-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold">Navigation Path</h3>
              <ol className="max-h-80 space-y-0 overflow-y-auto">
                {segments.map((segment, index) => (
                  <li key={segment.key}>
                    {segment.isCurrent ?
                      <span
                        aria-current="page"
                        className="bg-accent text-accent-foreground flex h-10 items-center rounded-md px-3 font-medium"
                      >
                        {segment.label}
                      </span>
                    : <Link
                        to={segment.path}
                        onClick={() => setExpanded(false)}
                        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex h-10 cursor-pointer items-center rounded-md px-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                      >
                        {showHomeIcon && index === 0 ?
                          <span className="flex items-center gap-2">
                            <Home
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            {segment.label}
                          </span>
                        : segment.label}
                      </Link>
                    }
                  </li>
                ))}
              </ol>
              <button
                onClick={() => setExpanded(false)}
                className="bg-muted hover:bg-muted/80 focus-visible:ring-ring mt-4 w-full rounded-md py-2.5 font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
});

BreadcrumbTablet.displayName = 'BreadcrumbTablet';

export { BreadcrumbTablet };
