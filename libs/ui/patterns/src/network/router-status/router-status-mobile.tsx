/**
 * Router Status Mobile Presenter
 *
 * Compact badge design for mobile screens.
 * Expands to bottom sheet with full details on tap.
 *
 * @module @nasnet/ui/patterns/network/router-status
 * @see NAS-4A.22: Build Router Status Component
 * @see ADR-018: Headless + Platform Presenters
 */

import { useState } from 'react';

import { RefreshCw, Unplug, Wifi, WifiOff, X } from 'lucide-react';

import {
  Badge,
  Button,
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
} from '@nasnet/ui/primitives';

import { STATUS_BG_COLORS, STATUS_TEXT_COLORS, StatusIndicator } from './status-indicator';

import type { RouterStatusPresenterProps } from './types';

// ===== Protocol Labels =====

const PROTOCOL_LABELS = {
  REST_API: 'REST API',
  SSH: 'SSH',
  TELNET: 'Telnet',
};

// ===== Component =====

/**
 * Mobile presenter for Router Status component.
 *
 * Compact badge that expands to bottom sheet:
 * - Badge shows status indicator + text
 * - Bottom sheet shows full details + actions
 * - 44px minimum touch targets
 *
 * @example
 * ```tsx
 * const state = useRouterStatus({ routerId: 'router-1' });
 * <RouterStatusMobile state={state} />
 * ```
 */
export function RouterStatusMobile({ state, className }: RouterStatusPresenterProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { data, loading, error, isOnline, statusLabel, lastSeenRelative } = state;

  // Loading state
  if (loading) {
    return <Skeleton className={cn('h-8 w-24 rounded-full', className)} />;
  }

  // Compact badge trigger
  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        // Touch target
        'min-h-[44px] min-w-[44px] px-3 py-2',
        // Layout
        'flex items-center gap-2',
        // Styling based on status
        STATUS_BG_COLORS[data.status],
        'border-transparent',
        // Interactive states
        'cursor-pointer active:opacity-80 transition-opacity',
        className
      )}
    >
      {/* Status Icon/Indicator */}
      {data.status === 'CONNECTING' ? (
        <RefreshCw
          className={cn('h-4 w-4 animate-spin shrink-0', STATUS_TEXT_COLORS[data.status])}
          aria-hidden="true"
        />
      ) : (
        <StatusIndicator status={data.status} size="sm" />
      )}

      {/* Status Text */}
      <span className={cn('text-sm font-medium', STATUS_TEXT_COLORS[data.status])}>
        {data.status === 'CONNECTING' && data.reconnectAttempt > 0
          ? `${data.reconnectAttempt}/${data.maxReconnectAttempts}`
          : statusLabel}
      </span>
    </Badge>
  );

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`Router status: ${statusLabel}. Tap for details.`}
          className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
        >
          {badgeContent}
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            {/* Status Icon */}
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full',
                STATUS_BG_COLORS[data.status]
              )}
            >
              {data.status === 'CONNECTING' ? (
                <RefreshCw
                  className={cn('h-4 w-4 animate-spin', STATUS_TEXT_COLORS[data.status])}
                />
              ) : data.status === 'DISCONNECTED' || data.status === 'ERROR' ? (
                <WifiOff className={cn('h-4 w-4', STATUS_TEXT_COLORS[data.status])} />
              ) : (
                <Wifi className={cn('h-4 w-4', STATUS_TEXT_COLORS[data.status])} />
              )}
            </div>

            {/* Status Label */}
            <span className={STATUS_TEXT_COLORS[data.status]}>{statusLabel}</span>

            {/* Reconnect Attempts */}
            {data.status === 'CONNECTING' && data.reconnectAttempt > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                (Attempt {data.reconnectAttempt} of {data.maxReconnectAttempts})
              </span>
            )}
          </SheetTitle>

          {error && (
            <SheetDescription className="text-semantic-error">
              {error.message}
            </SheetDescription>
          )}

          {!isOnline && lastSeenRelative && (
            <SheetDescription>Last connected: {lastSeenRelative}</SheetDescription>
          )}
        </SheetHeader>

        {/* Details Section */}
        <div className="py-6 space-y-4">
          {/* Protocol & Latency Row */}
          {isOnline && (data.protocol || data.latencyMs !== null) && (
            <div className="flex justify-between items-center">
              {data.protocol && (
                <div>
                  <p className="text-xs text-muted-foreground">Protocol</p>
                  <p className="text-sm font-medium">
                    {PROTOCOL_LABELS[data.protocol] || data.protocol}
                  </p>
                </div>
              )}
              {data.latencyMs !== null && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Latency</p>
                  <p
                    className={cn(
                      'text-sm font-mono font-medium',
                      data.latencyMs < 100
                        ? 'text-semantic-success'
                        : data.latencyMs < 300
                          ? 'text-semantic-warning'
                          : 'text-semantic-error'
                    )}
                  >
                    {data.latencyMs}ms
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Router Info Row */}
          {isOnline && (data.model || data.version) && (
            <div className="flex justify-between items-center">
              {data.model && (
                <div>
                  <p className="text-xs text-muted-foreground">Model</p>
                  <p className="text-sm font-medium">{data.model}</p>
                </div>
              )}
              {data.version && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">RouterOS</p>
                  <p className="text-sm font-medium">{data.version}</p>
                </div>
              )}
            </div>
          )}

          {/* Uptime Row */}
          {isOnline && data.uptime && (
            <div>
              <p className="text-xs text-muted-foreground">Uptime</p>
              <p className="text-sm font-medium">{data.uptime}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <SheetFooter className="flex-col gap-2 sm:flex-col">
          {/* Primary Action */}
          {isOnline ? (
            <Button
              variant="destructive"
              className="w-full min-h-[44px]"
              onClick={() => {
                state.disconnect();
                setIsSheetOpen(false);
              }}
            >
              <Unplug className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          ) : data.status === 'CONNECTING' ? (
            <Button
              variant="outline"
              className="w-full min-h-[44px]"
              onClick={() => {
                state.cancelReconnect();
                setIsSheetOpen(false);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Reconnection
            </Button>
          ) : (
            <Button
              className="w-full min-h-[44px]"
              onClick={() => {
                state.reconnect();
                setIsSheetOpen(false);
              }}
            >
              <Wifi className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
          )}

          {/* Secondary Action */}
          <Button
            variant="outline"
            className="w-full min-h-[44px]"
            onClick={() => {
              state.refresh();
              setIsSheetOpen(false);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
