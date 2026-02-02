/**
 * Router Status Component
 *
 * Auto-detecting wrapper that selects the appropriate presenter
 * based on viewport size or explicit override.
 *
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/network/router-status
 * @see NAS-4A.22: Build Router Status Component
 * @see Docs/architecture/adrs/018-headless-platform-presenters.md
 */

import { memo, useEffect, useRef } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';
import { cn } from '@nasnet/ui/primitives';

import { RouterStatusDesktop } from './router-status-desktop';
import { RouterStatusMobile } from './router-status-mobile';
import { useRouterStatus } from './use-router-status';

import type { Platform } from '@nasnet/ui/layouts';
import type { ConnectionStatus, RouterStatusProps } from './types';

// ===== Helper Component for ARIA Live Region =====

interface LiveRegionProps {
  status: ConnectionStatus;
  statusLabel: string;
  reconnectAttempt: number;
  maxReconnectAttempts: number;
}

/**
 * ARIA live region for screen reader announcements
 */
function StatusLiveRegion({
  status,
  statusLabel,
  reconnectAttempt,
  maxReconnectAttempts,
}: LiveRegionProps) {
  const previousStatusRef = useRef<ConnectionStatus | null>(null);
  const isStatusChange = previousStatusRef.current !== null && previousStatusRef.current !== status;

  useEffect(() => {
    previousStatusRef.current = status;
  }, [status]);

  // Only announce on status changes, not initial render
  if (!isStatusChange) {
    return null;
  }

  const reconnectText =
    status === 'CONNECTING' && reconnectAttempt > 0
      ? `, attempt ${reconnectAttempt} of ${maxReconnectAttempts}`
      : '';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      Router status changed to {statusLabel}{reconnectText}
    </div>
  );
}

// ===== Main Component =====

/**
 * Determines which presenter to use based on platform and props
 */
function getPresenterType(
  platform: Platform,
  presenterOverride?: 'mobile' | 'desktop',
  compact?: boolean
): 'mobile' | 'desktop' {
  // Explicit override takes precedence
  if (presenterOverride) {
    return presenterOverride;
  }

  // Compact mode forces mobile presenter
  if (compact) {
    return 'mobile';
  }

  // Auto-detect based on platform
  return platform === 'mobile' ? 'mobile' : 'desktop';
}

/**
 * Router Status Component
 *
 * Displays real-time router connection status with platform-adaptive UI.
 * Auto-detects mobile vs desktop based on screen width.
 *
 * Features:
 * - Real-time GraphQL subscription updates
 * - Protocol and latency display
 * - Reconnection progress tracking
 * - Action menu (Refresh, Reconnect, Disconnect)
 * - ARIA live region for status change announcements
 * - Full keyboard navigation support
 * - Responsive: mobile badge vs desktop card
 *
 * @example
 * ```tsx
 * // Auto-detect platform
 * <RouterStatus routerId="router-1" />
 *
 * // Force mobile variant
 * <RouterStatus routerId="router-1" presenter="mobile" />
 *
 * // Force desktop variant
 * <RouterStatus routerId="router-1" presenter="desktop" />
 *
 * // Compact mode (always shows badge)
 * <RouterStatus routerId="router-1" compact />
 *
 * // With status change callback
 * <RouterStatus
 *   routerId="router-1"
 *   onStatusChange={(status) => console.log('Status:', status)}
 * />
 * ```
 */
function RouterStatusComponent({
  routerId,
  compact = false,
  presenter: presenterOverride,
  className,
  onStatusChange,
}: RouterStatusProps) {
  // Detect platform for responsive presenter selection
  const platform = usePlatform();

  // Get router status from headless hook
  const state = useRouterStatus({
    routerId,
    onStatusChange,
  });

  // Determine which presenter to use
  const presenterType = getPresenterType(platform, presenterOverride, compact);

  // Select the appropriate presenter
  const content =
    presenterType === 'mobile' ? (
      <RouterStatusMobile state={state} className={className} />
    ) : (
      <RouterStatusDesktop state={state} className={className} />
    );

  return (
    <div className={cn('router-status', className)}>
      {/* ARIA live region for screen reader announcements */}
      <StatusLiveRegion
        status={state.data.status}
        statusLabel={state.statusLabel}
        reconnectAttempt={state.data.reconnectAttempt}
        maxReconnectAttempts={state.data.maxReconnectAttempts}
      />

      {/* Presenter content */}
      {content}
    </div>
  );
}

// Memoize for performance optimization
export const RouterStatus = memo(RouterStatusComponent);
RouterStatus.displayName = 'RouterStatus';
