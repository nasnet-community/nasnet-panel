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
        'px-component-md min-h-[44px]',
        // Layout
        'gap-component-sm flex items-center',
        // Styling based on status
        STATUS_BG_COLORS[data.status],
        'border-transparent',
        // Interactive states
        'cursor-pointer transition-opacity duration-150 active:opacity-80',
        className
      )}
    >
      {/* Status Icon/Indicator */}
      {data.status === 'CONNECTING' ?
        <RefreshCw
          className={cn('h-4 w-4 shrink-0 animate-spin', STATUS_TEXT_COLORS[data.status])}
          aria-hidden="true"
        />
      : <StatusIndicator
          status={data.status}
          size="sm"
        />
      }

      {/* Status Text */}
      <span className={cn('text-sm font-semibold', STATUS_TEXT_COLORS[data.status])}>
        {data.status === 'CONNECTING' && data.reconnectAttempt > 0 ?
          `${data.reconnectAttempt}/${data.maxReconnectAttempts}`
        : statusLabel}
      </span>
    </Badge>
  );

  return (
    <Sheet
      open={isSheetOpen}
      onOpenChange={setIsSheetOpen}
    >
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`Router status: ${statusLabel}. Tap for details.`}
          className="focus:ring-primary rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          {badgeContent}
        </button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="rounded-t-[var(--semantic-radius-card)]"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="gap-component-sm flex items-center">
            {/* Router Icon Container */}
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                'bg-primary/10'
              )}
            >
              {data.status === 'CONNECTING' ?
                <RefreshCw
                  className={cn('h-5 w-5 animate-spin', STATUS_TEXT_COLORS[data.status])}
                />
              : data.status === 'DISCONNECTED' || data.status === 'ERROR' ?
                <WifiOff className={cn('h-5 w-5', STATUS_TEXT_COLORS[data.status])} />
              : <Wifi className={cn('h-5 w-5', STATUS_TEXT_COLORS[data.status])} />}
            </div>

            {/* Router Name and Status */}
            <div className="flex flex-col">
              <span className="text-foreground text-base font-semibold">Router</span>
              <span className={cn('text-xs', STATUS_TEXT_COLORS[data.status])}>{statusLabel}</span>
            </div>

            {/* Reconnect Attempts */}
            {data.status === 'CONNECTING' && data.reconnectAttempt > 0 && (
              <span className="text-muted-foreground ml-auto text-xs font-normal">
                {data.reconnectAttempt}/{data.maxReconnectAttempts}
              </span>
            )}
          </SheetTitle>

          {error && (
            <SheetDescription className="text-semantic-error">{error.message}</SheetDescription>
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
              <p className="text-muted-foreground text-xs">Model</p>
              <p className="text-foreground text-sm font-semibold">{data.model}</p>
            </div>
          )}

          {/* Uptime */}
          {data.uptime && (
            <div>
              <p className="text-muted-foreground text-xs">Uptime</p>
              <p className="text-foreground font-mono text-sm">{data.uptime}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <SheetFooter className="flex-col gap-2 sm:flex-col">
          {/* Primary Action */}
          {isOnline ?
            <Button
              variant="destructive"
              className="min-h-[44px] w-full"
              onClick={() => {
                state.disconnect();
                setIsSheetOpen(false);
              }}
            >
              <Unplug className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          : data.status === 'CONNECTING' ?
            <Button
              variant="outline"
              className="min-h-[44px] w-full"
              onClick={() => {
                state.cancelReconnect();
                setIsSheetOpen(false);
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Reconnection
            </Button>
          : <Button
              className="min-h-[44px] w-full"
              onClick={() => {
                state.reconnect();
                setIsSheetOpen(false);
              }}
            >
              <Wifi className="mr-2 h-4 w-4" />
              Reconnect
            </Button>
          }

          {/* Secondary Action */}
          <Button
            variant="outline"
            className="min-h-[44px] w-full"
            onClick={() => {
              state.refresh();
              setIsSheetOpen(false);
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Status
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
