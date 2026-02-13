/**
 * FirewallLogViewer Pattern Component
 *
 * Export barrel for firewall log viewer hook and components.
 *
 * @module @nasnet/ui/patterns/firewall-log-viewer
 */

// Headless hook
export { useFirewallLogViewer } from './use-firewall-log-viewer';
export type {
  UseFirewallLogViewerOptions,
  UseFirewallLogViewerReturn,
  FirewallLogViewerState,
  SortField,
  SortOrder,
  RefreshInterval,
} from './use-firewall-log-viewer';

// Component (Note: Desktop and Mobile presenters still need implementation)
export { FirewallLogViewer } from './FirewallLogViewer';
export type {
  FirewallLogViewerProps,
  FirewallLogViewerPresenterProps,
} from './FirewallLogViewer.types';
export { getActionColorClasses, ACTION_COLORS } from './FirewallLogViewer.types';
