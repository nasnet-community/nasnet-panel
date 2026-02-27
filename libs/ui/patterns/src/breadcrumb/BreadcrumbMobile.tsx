/**
 * BreadcrumbMobile Component
 * Mobile presenter for breadcrumbs (collapsed with ellipsis)
 *
 * Features:
 * - Collapsed path with ellipsis
 * - Shows only first and last segments
 * - 44x44px minimum touch targets
 * - RTL support
 * - Bottom sheet expansion
 * - Screen reader friendly
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';
import { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Home, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn, Icon } from '@nasnet/ui/primitives';

import { useBreadcrumb, Link } from './useBreadcrumb';

/**
 * Props for BreadcrumbMobile
 */
export interface BreadcrumbMobileProps {
  /** Show home icon for first segment */
  showHomeIcon?: boolean;
  /** Maximum segments to show before collapsing */
  maxVisible?: number;
  /** Optional className */
  className?: string;
}

/**
 * Mobile breadcrumb presenter
 * Shows collapsed path with option to expand
 */
const BreadcrumbMobile = React.memo(function BreadcrumbMobile({
  showHomeIcon = true,
  maxVisible = 2,
  className,
}: BreadcrumbMobileProps) {
  const { segments, separator, dir, hasBreadcrumbs } = useBreadcrumb();
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation('common');

  if (!hasBreadcrumbs) return null;

  const SeparatorIcon = separator === 'ChevronLeft' ? ChevronLeft : ChevronRight;
  const shouldCollapse = segments.length > maxVisible && !expanded;

  // Get visible segments
  let visibleSegments = segments;
  let hiddenCount = 0;

  if (shouldCollapse) {
    // Show first and last segments, hide middle
    visibleSegments = [segments[0], segments[segments.length - 1]];
    hiddenCount = segments.length - 2;
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
            {/* Back button for collapsed mobile view */}
            {index === 0 && shouldCollapse && hiddenCount > 0 && (
              <button
                onClick={() => setExpanded(true)}
                className="hover:bg-muted focus-visible:ring-ring flex h-11 w-11 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                aria-label={t('breadcrumb.showMore', { count: hiddenCount })}
                aria-expanded={expanded}
              >
                <Icon
                  icon={ChevronLeft}
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </button>
            )}

            {/* Separator */}
            {index > 0 && !(index === 0 && shouldCollapse) && (
              <Icon
                icon={SeparatorIcon}
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
                    {segment.label}
                  </span>
                  // Clickable link with 44px touch target
                : <Link
                    to={segment.path}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex h-11 cursor-pointer items-center rounded-lg px-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                  >
                    {showHomeIcon && index === 0 ?
                      <>
                        <Icon
                          icon={Home}
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                        <span className="sr-only">{segment.label}</span>
                      </>
                    : <span className="max-w-[120px] truncate">{segment.label}</span>}
                  </Link>

              }
            </li>
          </React.Fragment>
        ))}
      </ol>

      {/* Expanded view bottom sheet */}
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
              className="bg-card p-component-md absolute bottom-0 left-0 right-0 rounded-t-xl shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold">
                {t('breadcrumb.navigationPath')}
              </h3>
              <ol className="space-y-0">
                {segments.map((segment, index) => (
                  <li key={segment.key}>
                    {segment.isCurrent ?
                      <span
                        aria-current="page"
                        className="bg-accent text-accent-foreground flex h-11 items-center rounded-lg px-3 font-medium"
                      >
                        {segment.label}
                      </span>
                    : <Link
                        to={segment.path}
                        onClick={() => setExpanded(false)}
                        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex h-11 cursor-pointer items-center rounded-lg px-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                      >
                        {showHomeIcon && index === 0 ?
                          <span className="flex items-center gap-2">
                            <Icon
                              icon={Home}
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
                className="bg-muted hover:bg-muted/80 focus-visible:ring-ring mt-4 w-full rounded-lg py-3 font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
              >
                {t('actions.close')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
});

BreadcrumbMobile.displayName = 'BreadcrumbMobile';

export { BreadcrumbMobile };
