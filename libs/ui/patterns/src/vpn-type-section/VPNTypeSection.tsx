/**
 * VPNTypeSection Component
 * Collapsible section for grouping VPN interfaces by type
 * Story 0-4-4: Other VPN Type Viewer
 *
 * @example
 * ```tsx
 * <VPNTypeSection type="L2TP" count={2} defaultExpanded={false}>
 *   <GenericVPNCard {...l2tpInterface1} />
 *   <GenericVPNCard {...l2tpInterface2} />
 * </VPNTypeSection>
 * ```
 */

import React, { memo, forwardRef, useState, useCallback } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { cn } from '@nasnet/ui/utils';
import { Badge, Button } from '@nasnet/ui/primitives';

export interface VPNTypeSectionProps {
  /** VPN type label (e.g., "L2TP", "PPTP", "SSTP") */
  type: string;
  /** Number of interfaces of this type */
  count: number;
  /** Whether section is expanded by default */
  defaultExpanded?: boolean;
  /** Section children (VPN cards) */
  children: React.ReactNode;
  /** Optional icon component for the VPN type */
  icon?: React.ReactNode;
  /** Whether to show read-only notice */
  showReadOnlyNotice?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Collapsible section component for VPN types
 * Allows users to expand/collapse different VPN protocol groups
 */
function VPNTypeSectionComponent({
  type,
  count,
  defaultExpanded = false,
  children,
  icon,
  showReadOnlyNotice = true,
  className = '',
}: VPNTypeSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div
      className={cn(
        'border-border overflow-hidden rounded-[var(--semantic-radius-card)] border shadow-[var(--semantic-shadow-card)]',
        className
      )}
    >
      {/* Section Header */}
      <button
        onClick={handleToggle}
        className={cn(
          'px-component-lg py-component-md flex w-full items-center justify-between',
          'bg-muted hover:bg-muted transition-colors duration-150',
          'text-left'
        )}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${type} section`}
      >
        <div className="flex items-center gap-3">
          {/* Chevron Icon */}
          <ChevronDown
            className={cn(
              'text-muted-foreground h-5 w-5 transition-transform duration-300',
              isExpanded && 'rotate-180'
            )}
          />

          {/* Optional VPN Type Icon */}
          {icon && <div className="text-muted-foreground">{icon}</div>}

          {/* Type Label */}
          <h3 className="text-foreground text-base font-semibold">{type}</h3>

          {/* Count Badge */}
          <Badge
            variant="secondary"
            className="rounded-full text-xs"
          >
            {count} {count === 1 ? 'interface' : 'interfaces'}
          </Badge>

          {/* Read-Only Notice Badge */}
          {showReadOnlyNotice && (
            <Badge
              variant="outline"
              className="rounded-full text-xs"
            >
              Read-only
            </Badge>
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-component-lg space-y-component-md bg-background border-border border-t">
              {/* Read-Only Notice (if shown) */}
              {showReadOnlyNotice && (
                <div className="mb-component-md p-component-md bg-info-light/50 dark:bg-info/10 border-l-info rounded-[var(--semantic-radius-input)] border border-l-4">
                  <p className="text-info-dark dark:text-info text-sm">
                    <span className="font-semibold">Read-only view.</span> Editing {type} interfaces
                    will be available in a future update.
                  </p>
                </div>
              )}

              {/* Children (VPN Cards) */}
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const VPNTypeSection = memo(
  forwardRef<HTMLDivElement, VPNTypeSectionProps>((props, ref) => (
    <VPNTypeSectionComponent {...props} />
  ))
);

VPNTypeSection.displayName = 'VPNTypeSection';
