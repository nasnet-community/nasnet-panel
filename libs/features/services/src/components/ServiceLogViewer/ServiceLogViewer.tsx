/**
 * ServiceLogViewer Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @see NAS-8.12: Service Logs & Diagnostics
 *
 * @example
 * ```tsx
 * <ServiceLogViewer
 *   routerId="router-1"
 *   instanceId="instance-123"
 *   maxHistoricalLines={100}
 *   autoScroll={true}
 *   onEntryClick={(entry) => console.log(entry)}
 * />
 * ```
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { ServiceLogViewerDesktop } from './ServiceLogViewerDesktop';
import { ServiceLogViewerMobile } from './ServiceLogViewerMobile';

import type { ServiceLogViewerProps } from './useServiceLogViewer';

/**
 * ServiceLogViewer - Displays service logs with filtering and search
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Touch-optimized with bottom sheets and 44px targets
 * - Tablet/Desktop (≥640px): Virtual scrolling with dense layout
 *
 * Features:
 * - 1000-line ring buffer (oldest entries discarded)
 * - Real-time log streaming
 * - Level filtering (DEBUG, INFO, WARN, ERROR)
 * - Text search across messages
 * - Auto-scroll to bottom
 * - Copy to clipboard
 * - JetBrains Mono font for readability
 */
function ServiceLogViewerComponent(props: ServiceLogViewerProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <ServiceLogViewerMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <ServiceLogViewerDesktop {...props} />;
  }
}

// Wrap with memo for performance optimization
export const ServiceLogViewer = memo(ServiceLogViewerComponent);

// Set display name for React DevTools
ServiceLogViewer.displayName = 'ServiceLogViewer';
