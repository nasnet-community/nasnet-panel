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

import { memo, useMemo, Suspense, lazy } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';
import { Card, CardContent } from '@nasnet/ui/primitives';

import { useFirewallLogViewer } from './use-firewall-log-viewer';

import type { FirewallLogViewerProps } from './FirewallLogViewer.types';

// Lazy load platform presenters for better performance
const FirewallLogViewerDesktop = lazy(() =>
  import('./FirewallLogViewerDesktop').then((m) => ({
    default: m.FirewallLogViewerDesktop,
  }))
);
const FirewallLogViewerMobile = lazy(() =>
  import('./FirewallLogViewerMobile').then((m) => ({
    default: m.FirewallLogViewerMobile,
  }))
);

// Loading skeleton for async presenters
function LoadingSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="bg-muted h-12 rounded" />
          <div className="bg-muted h-64 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

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
function FirewallLogViewerComponent(props: FirewallLogViewerProps) {
  const { routerId } = props;
  const platform = usePlatform();

  // Initialize headless hook
  const viewer = useFirewallLogViewer({
    routerId,
    debounceDelay: 300,
  });

  // Extract available prefixes from logs for filter autocomplete
  const availablePrefixes = useMemo(() => {
    const prefixes = new Set<string>();
    viewer.logs.forEach((log) => {
      if (log.parsed.prefix) {
        prefixes.add(log.parsed.prefix);
      }
    });
    return Array.from(prefixes).sort();
  }, [viewer.logs]);

  // Platform-specific presenter props
  const presenterProps = {
    ...props,
    viewer,
    availablePrefixes,
  };

  // Render platform-specific presenter
  switch (platform) {
    case 'mobile':
      return <FirewallLogViewerMobile {...presenterProps} />;
    case 'tablet':
    case 'desktop':
    default:
      return <FirewallLogViewerDesktop {...presenterProps} />;
  }
}

// Wrap with memo for performance optimization
export const FirewallLogViewer = memo(FirewallLogViewerComponent);

// Set display name for React DevTools
FirewallLogViewer.displayName = 'FirewallLogViewer';
