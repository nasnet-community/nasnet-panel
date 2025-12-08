/**
 * VPNTypeSection Component
 * Collapsible section for grouping VPN interfaces by type
 * Story 0-4-4: Other VPN Type Viewer
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
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
}

/**
 * Collapsible section component for VPN types
 * Allows users to expand/collapse different VPN protocol groups
 *
 * @example
 * ```tsx
 * <VPNTypeSection type="L2TP" count={2} defaultExpanded={false}>
 *   <GenericVPNCard {...l2tpInterface1} />
 *   <GenericVPNCard {...l2tpInterface2} />
 * </VPNTypeSection>
 * ```
 */
export function VPNTypeSection({
  type,
  count,
  defaultExpanded = false,
  children,
  icon,
  showReadOnlyNotice = true,
}: VPNTypeSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-card-sm md:rounded-card-lg overflow-hidden shadow-sm">
      {/* Section Header */}
      <button
        onClick={handleToggle}
        className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${type} section`}
      >
        <div className="flex items-center gap-3">
          {/* Chevron Icon */}
          <ChevronDown
            className={`h-5 w-5 text-slate-600 dark:text-slate-400 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />

          {/* Optional VPN Type Icon */}
          {icon && <div className="text-slate-600 dark:text-slate-400">{icon}</div>}

          {/* Type Label */}
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{type}</h3>

          {/* Count Badge */}
          <Badge variant="secondary" className="text-xs rounded-full bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300">
            {count} {count === 1 ? 'interface' : 'interfaces'}
          </Badge>

          {/* Read-Only Notice Badge */}
          {showReadOnlyNotice && (
            <Badge variant="outline" className="text-xs text-slate-500 dark:text-slate-400 rounded-full">
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
            <div className="p-5 space-y-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
              {/* Read-Only Notice (if shown) */}
              {showReadOnlyNotice && (
                <div className="mb-4 p-4 bg-info/10 border border-info/30 rounded-card-sm">
                  <p className="text-sm text-info dark:text-sky-400">
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
