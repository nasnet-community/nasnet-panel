/**
 * FirewallLogViewer Types
 *
 * TypeScript interfaces for the firewall log viewer pattern component.
 *
 * @module @nasnet/ui/patterns/firewall-log-viewer
 */

import type { FirewallLogEntry } from '@nasnet/core/types';
import type { UseFirewallLogViewerReturn } from './use-firewall-log-viewer';

/**
 * Props for FirewallLogViewer component
 */
export interface FirewallLogViewerProps {
  /**
   * Router ID to fetch logs for
   */
  routerId: string;

  /**
   * Callback when log prefix is clicked for navigation
   */
  onPrefixClick?: (prefix: string, ruleId?: string) => void;

  /**
   * Callback when "Add to Blocklist" is clicked (from stats)
   */
  onAddToBlocklist?: (ip: string) => void;

  /**
   * Container className
   */
  className?: string;
}

/**
 * Props for platform-specific presenters
 */
export interface FirewallLogViewerPresenterProps extends FirewallLogViewerProps {
  /**
   * Viewer state and actions from headless hook
   */
  viewer: UseFirewallLogViewerReturn;

  /**
   * Available log prefixes for filter autocomplete
   */
  availablePrefixes: string[];
}

/**
 * Action color mappings using semantic tokens
 */
export const ACTION_COLORS = {
  accept: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
  },
  drop: {
    bg: 'bg-error/10',
    text: 'text-error',
    border: 'border-error/20',
  },
  reject: {
    bg: 'bg-error/10',
    text: 'text-error',
    border: 'border-error/20',
  },
  unknown: {
    bg: 'bg-muted/50',
    text: 'text-muted-foreground',
    border: 'border-muted',
  },
} as const;

/**
 * Helper to get action color classes
 */
export function getActionColorClasses(action: string) {
  return ACTION_COLORS[action as keyof typeof ACTION_COLORS] || ACTION_COLORS.unknown;
}
