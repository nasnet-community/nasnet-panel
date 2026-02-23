/**
 * FirewallLogViewer Pattern Component
 *
 * Main log viewer component with platform-specific presenters.
 * Auto-detects platform and renders appropriate layout.
 *
 * Integrates:
 * - useFirewallLogViewer hook (Task #5)
 * - FirewallLogFilters component (Task #7)
 * - FirewallLogStats component (Task #8)
 * - useRuleNavigation hook (Task #9)
 *
 * @module @nasnet/ui/patterns/firewall-log-viewer
 */
import type { FirewallLogViewerProps } from './FirewallLogViewer.types';
/**
 * FirewallLogViewer - Main log viewer component
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Card-based layout with bottom sheet filters
 * - Tablet/Desktop (>=640px): Split view with sidebar filters and virtualized table
 *
 * Features:
 * - Real-time log viewing with auto-refresh
 * - Filtering by time, action, IP, port, prefix
 * - Log statistics with top blocked IPs and ports
 * - Virtualized rendering for 100+ logs
 * - Clickable prefixes for rule navigation
 * - CSV export
 * - Responsive layouts optimized for each platform
 *
 * @example
 * ```tsx
 * <FirewallLogViewer
 *   routerId="router-123"
 *   onPrefixClick={(prefix, ruleId) => navigate(`/rules/${ruleId}`)}
 *   onAddToBlocklist={(ip) => addToBlocklist(ip)}
 * />
 * ```
 */
declare function FirewallLogViewerComponent(props: FirewallLogViewerProps): import("react/jsx-runtime").JSX.Element;
export declare const FirewallLogViewer: import("react").MemoExoticComponent<typeof FirewallLogViewerComponent>;
export {};
//# sourceMappingURL=FirewallLogViewer.d.ts.map