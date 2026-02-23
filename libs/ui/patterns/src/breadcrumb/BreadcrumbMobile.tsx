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
      className={cn('flex items-center', className)}
    >
      <ol className="flex items-center gap-inlineGap text-sm">
        {visibleSegments.map((segment, index) => (
          <React.Fragment key={segment.key}>
            {/* Ellipsis for collapsed items */}
            {index === 1 && shouldCollapse && hiddenCount > 0 && (
              <>
                <Icon
                  icon={SeparatorIcon}
                  className="mx-0.5 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <li>
                  <button
                    onClick={() => setExpanded(true)}
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={t('breadcrumb.showMore', { count: hiddenCount })}
                    aria-expanded={expanded}
                  >
                    <Icon
                      icon={MoreHorizontal}
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              </>
            )}

            {/* Separator */}
            {index > 0 && !(index === 1 && shouldCollapse) && (
              <Icon
                icon={SeparatorIcon}
                className="mx-0.5 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            )}

            {/* Segment */}
            <li className="flex items-center">
              {segment.isCurrent ? (
                // Current page (not clickable)
                <span
                  aria-current="page"
                  className="truncate font-medium text-foreground"
                >
                  {segment.label}
                </span>
              ) : (
                // Clickable link with 44px touch target
                <Link
                  to={segment.path}
                  className="flex h-11 items-center rounded-lg px-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {showHomeIcon && index === 0 ? (
                    <>
                      <Icon
                        icon={Home}
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                      <span className="sr-only">{segment.label}</span>
                    </>
                  ) : (
                    <span className="truncate">{segment.label}</span>
                  )}
                </Link>
              )}
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
              className="absolute bottom-0 left-0 right-0 rounded-t-xl bg-card p-component-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                {t('breadcrumb.navigationPath')}
              </h3>
              <ol className="space-y-1">
                {segments.map((segment, index) => (
                  <li key={segment.key}>
                    {segment.isCurrent ? (
                      <span
                        aria-current="page"
                        className="flex h-11 items-center rounded-lg bg-accent px-3 font-medium"
                      >
                        {segment.label}
                      </span>
                    ) : (
                      <Link
                        to={segment.path}
                        onClick={() => setExpanded(false)}
                        className="flex h-11 items-center rounded-lg px-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {showHomeIcon && index === 0 ? (
                          <span className="flex items-center gap-2">
                            <Icon
                              icon={Home}
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            {segment.label}
                          </span>
                        ) : (
                          segment.label
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
              <button
                onClick={() => setExpanded(false)}
                className="mt-4 w-full rounded-lg bg-muted py-3 font-medium transition-colors hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring"
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
