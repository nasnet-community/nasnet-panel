/**
 * Connection Indicator Component
 *
 * Displays router connection status with platform-adaptive presentation.
 * Follows the Headless + Platform Presenter pattern (ADR-018).
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 * @see Docs/architecture/adrs/018-headless-platform-presenters.md
 */

import { memo } from 'react';

import { Circle, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import {
  useConnectionIndicator,
  type ConnectionIndicatorState,
  type StatusColor,
} from './useConnectionIndicator';

// ===== Color Mappings =====

/**
 * Tailwind color classes for status colors
 */
const STATUS_COLOR_CLASSES: Record<StatusColor, { dot: string; text: string; bg: string }> = {
  green: {
    dot: 'bg-success',
    text: 'text-success',
    bg: 'bg-success/10',
  },
  amber: {
    dot: 'bg-warning',
    text: 'text-warning',
    bg: 'bg-warning/10',
  },
  red: {
    dot: 'bg-error',
    text: 'text-error',
    bg: 'bg-error/10',
  },
  gray: {
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
    bg: 'bg-muted',
  },
};

/**
 * Latency quality color classes
 */
const LATENCY_QUALITY_CLASSES = {
  good: 'text-success',
  moderate: 'text-warning',
  poor: 'text-error',
};

// ===== Mobile Presenter =====

/**
 * Mobile presenter for connection indicator.
 * Compact design optimized for small screens and touch interaction.
 */
const ConnectionIndicatorMobile = memo(function ConnectionIndicatorMobile({
  state,
}: {
  state: ConnectionIndicatorState;
}) {
  const colors = STATUS_COLOR_CLASSES[state.statusColor];

  return (
    <button
      type="button"
      className={cn(
        'gap-component-sm px-component-sm py-component-sm flex items-center rounded-[var(--semantic-radius-badge)]',
        'min-h-[44px]', // Touch target
        'transition-colors duration-150',
        colors.bg,
        state.showManualRetry && 'cursor-pointer active:opacity-80'
      )}
      onClick={state.showManualRetry ? state.onRetry : undefined}
      disabled={!state.showManualRetry}
      aria-label={`Connection status: ${state.statusLabel}${state.showManualRetry ? '. Tap to retry.' : ''}`}
    >
      {state.isReconnecting ?
        <Loader2 className={cn('h-4 w-4 animate-spin', colors.text)} />
      : state.wsStatus === 'disconnected' ?
        <WifiOff className={cn('h-4 w-4', colors.text)} />
      : <Wifi className={cn('h-4 w-4', colors.text)} />}

      {state.showManualRetry && <RefreshCw className={cn('h-3 w-3', colors.text)} />}
    </button>
  );
});

ConnectionIndicatorMobile.displayName = 'ConnectionIndicatorMobile';

// ===== Desktop Presenter =====

/**
 * Desktop presenter for connection indicator.
 * Information-dense design with latency and protocol details.
 */
const ConnectionIndicatorDesktop = memo(function ConnectionIndicatorDesktop({
  state,
}: {
  state: ConnectionIndicatorState;
}) {
  const colors = STATUS_COLOR_CLASSES[state.statusColor];

  // Build tooltip content
  const tooltipLines: string[] = [state.statusLabel];

  if (state.activeRouterId) {
    tooltipLines.push(`Router: ${state.activeRouterId}`);
  }

  if (state.protocol) {
    tooltipLines.push(`Protocol: ${state.protocol.toUpperCase()}`);
  }

  if (state.latencyMs !== null) {
    tooltipLines.push(`Latency: ${state.latencyMs}ms`);
  }

  if (state.isReconnecting) {
    tooltipLines.push(`Reconnecting... (${state.reconnectAttempts}/${state.maxReconnectAttempts})`);
  }

  if (state.lastConnectedText) {
    tooltipLines.push(state.lastConnectedText);
  }

  if (state.showManualRetry) {
    tooltipLines.push('Click to retry connection');
  }

  const tooltipContent = tooltipLines.join('\n');

  return (
    <div
      className={cn(
        'gap-component-sm px-component-sm py-component-sm flex items-center rounded-[var(--semantic-radius-input)]',
        'transition-colors duration-150',
        state.showManualRetry && 'hover:bg-muted cursor-pointer'
      )}
      role="button"
      tabIndex={state.showManualRetry ? 0 : -1}
      onClick={state.showManualRetry ? state.onRetry : undefined}
      onKeyDown={(e) => {
        if (state.showManualRetry && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          state.onRetry();
        }
      }}
      title={tooltipContent}
      aria-label={`Connection status: ${state.statusLabel}`}
    >
      {/* Status Indicator */}
      <div className="gap-component-sm flex items-center">
        {state.isReconnecting ?
          <Loader2 className={cn('h-4 w-4 animate-spin', colors.text)} />
        : <Circle
            className={cn(
              'h-2.5 w-2.5 transition-colors',
              colors.dot,
              state.wsStatus === 'connected' && 'animate-pulse'
            )}
            fill="currentColor"
            aria-hidden="true"
          />
        }

        <span className={cn('text-sm font-medium', colors.text)}>{state.statusLabel}</span>
      </div>

      {/* Latency Display (when connected) */}
      {state.wsStatus === 'connected' && state.latencyMs !== null && (
        <span
          className={cn(
            'font-mono text-sm',
            state.latencyQuality && LATENCY_QUALITY_CLASSES[state.latencyQuality]
          )}
        >
          {state.latencyMs}ms
        </span>
      )}

      {/* Reconnect Attempts (when reconnecting) */}
      {state.isReconnecting && (
        <span className="text-muted-foreground text-sm">
          {state.reconnectAttempts}/{state.maxReconnectAttempts}
        </span>
      )}

      {/* Retry Button (when max attempts reached) */}
      {state.showManualRetry && <RefreshCw className={cn('h-4 w-4', colors.text)} />}
    </div>
  );
});

ConnectionIndicatorDesktop.displayName = 'ConnectionIndicatorDesktop';

// ===== Main Component =====

export interface ConnectionIndicatorProps {
  /**
   * Force a specific variant (overrides auto-detection)
   */
  variant?: 'mobile' | 'desktop';

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Connection Indicator Component
 *
 * Shows current connection status with platform-adaptive UI.
 * Auto-detects mobile vs desktop based on screen width.
 *
 * Features:
 * - Real-time WebSocket status
 * - Latency display (desktop)
 * - Reconnection progress
 * - Manual retry when max attempts reached
 * - ARIA live region for status changes
 *
 * @example
 * ```tsx
 * // Auto-detect platform
 * <ConnectionIndicator />
 *
 * // Force mobile variant
 * <ConnectionIndicator variant="mobile" />
 *
 * // Force desktop variant
 * <ConnectionIndicator variant="desktop" />
 * ```
 */
export const ConnectionIndicator = memo(function ConnectionIndicator({
  variant,
  className,
}: ConnectionIndicatorProps) {
  const state = useConnectionIndicator();

  // Determine which presenter to use
  // Using CSS media query approach for SSR compatibility
  const content =
    variant === 'mobile' ? <ConnectionIndicatorMobile state={state} />
    : variant === 'desktop' ? <ConnectionIndicatorDesktop state={state} />
    : <>
        {/* Mobile: shown on small screens */}
        <div className="sm:hidden">
          <ConnectionIndicatorMobile state={state} />
        </div>
        {/* Desktop: shown on larger screens */}
        <div className="hidden sm:block">
          <ConnectionIndicatorDesktop state={state} />
        </div>
      </>;

  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {content}

      {/* Screen reader announcement */}
      <span className="sr-only">
        {state.statusLabel}
        {state.isReconnecting &&
          `, attempt ${state.reconnectAttempts} of ${state.maxReconnectAttempts}`}
        {state.showManualRetry && ', manual retry available'}
      </span>
    </div>
  );
});

// ===== Exports =====

export { ConnectionIndicatorMobile, ConnectionIndicatorDesktop };
