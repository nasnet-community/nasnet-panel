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
        'min-h-[44px] px-component-md',
        // Layout
        'flex items-center gap-component-sm',
        // Styling based on status
        STATUS_BG_COLORS[data.status],
        'border-transparent',
        // Interactive states
        'cursor-pointer active:opacity-80 transition-opacity duration-150',
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
      <span className={cn('text-sm font-semibold', STATUS_TEXT_COLORS[data.status])}>
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

      <SheetContent side="bottom" className="rounded-t-[var(--semantic-radius-card)]">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-component-sm">
            {/* Router Icon Container */}
            <div
              className={cn(
                'flex items-center justify-center h-10 w-10 rounded-lg shrink-0',
                'bg-primary/10'
              )}
            >
              {data.status === 'CONNECTING' ? (
                <RefreshCw
                  className={cn('h-5 w-5 animate-spin', STATUS_TEXT_COLORS[data.status])}
                />
              ) : data.status === 'DISCONNECTED' || data.status === 'ERROR' ? (
                <WifiOff className={cn('h-5 w-5', STATUS_TEXT_COLORS[data.status])} />
              ) : (
                <Wifi className={cn('h-5 w-5', STATUS_TEXT_COLORS[data.status])} />
              )}
            </div>

            {/* Router Name and Status */}
            <div className="flex flex-col">
              <span className="text-base font-semibold text-foreground">
                Router
              </span>
              <span className={cn('text-xs', STATUS_TEXT_COLORS[data.status])}>
                {statusLabel}
              </span>
            </div>

            {/* Reconnect Attempts */}
            {data.status === 'CONNECTING' && data.reconnectAttempt > 0 && (
              <span className="text-xs font-normal text-muted-foreground ml-auto">
                {data.reconnectAttempt}/{data.maxReconnectAttempts}
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
        <div className="py-component-lg space-y-component-lg">
          {/* Model */}
          {data.model && (
            <div>
              <p className="text-xs text-muted-foreground">Model</p>
              <p className="text-sm text-foreground font-semibold">{data.model}</p>
            </div>
          )}

          {/* Uptime */}
          {data.uptime && (
            <div>
              <p className="text-xs text-muted-foreground">Uptime</p>
              <p className="text-sm font-mono text-foreground">{data.uptime}</p>
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
