/**
 * Router Status Desktop Presenter
 *
 * Information-dense card layout for desktop/tablet screens.
 * Shows full status details, protocol info, and action menu.
 *
 * @module @nasnet/ui/patterns/network/router-status
 * @see NAS-4A.22: Build Router Status Component
 * @see ADR-018: Headless + Platform Presenters
 */

import { MoreVertical, RefreshCw, Unplug, Wifi, WifiOff, X } from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Skeleton,
} from '@nasnet/ui/primitives';

import { STATUS_TEXT_COLORS, StatusIndicator } from './status-indicator';

import type { RouterStatusPresenterProps } from './types';

// ===== Component =====

import { memo } from 'react';

/**
 * Desktop presenter for Router Status component.
 *
 * Card layout with:
 * - Status indicator with label
 * - Protocol and latency details
 * - Router model and version
 * - Action dropdown menu (Refresh, Reconnect, Disconnect)
 *
 * @example
 * ```tsx
 * const state = useRouterStatus({ routerId: 'router-1' });
 * <RouterStatusDesktop state={state} />
 * ```
 */
function RouterStatusDesktopComponent({ state, className }: RouterStatusPresenterProps) {
  const { data, loading, error, isOnline } = state;

  // Loading state
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('w-full border-semantic-error/50', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIndicator status="ERROR" size="md" />
              <div>
                <p className="text-sm font-medium text-semantic-error">Connection Error</p>
                <p className="text-xs text-muted-foreground">{error.message}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => state.reconnect()}
              className="text-semantic-error hover:text-semantic-error"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-component-md lg:p-component-lg">
        <div className="flex items-center justify-between gap-component-lg">
          {/* Status Section */}
          <div className="flex items-center gap-component-lg min-w-0">
            {/* Router Icon Container */}
            <div
              className={cn(
                'flex items-center justify-center h-12 w-12 rounded-lg shrink-0',
                'bg-primary/10'
              )}
            >
              {data.status === 'CONNECTING' ? (
                <RefreshCw
                  className={cn('h-6 w-6 animate-spin', STATUS_TEXT_COLORS[data.status])}
                  aria-hidden="true"
                />
              ) : data.status === 'DISCONNECTED' || data.status === 'ERROR' ? (
                <WifiOff
                  className={cn('h-6 w-6', STATUS_TEXT_COLORS[data.status])}
                  aria-hidden="true"
                />
              ) : (
                <Wifi
                  className={cn('h-6 w-6', STATUS_TEXT_COLORS[data.status])}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Status Text */}
            <div className="min-w-0">
              <h3 className={cn('text-lg font-semibold text-foreground')}>
                Router
              </h3>

              {/* Router Model */}
              {data.model && (
                <p className="text-sm text-muted-foreground">
                  {data.model}
                </p>
              )}

              {/* Uptime */}
              {data.uptime && (
                <p className="font-mono text-sm text-muted-foreground">
                  Uptime: {data.uptime}
                </p>
              )}

              {/* Status Badge */}
              <StatusIndicator status={data.status} size="sm" />
            </div>
          </div>

          {/* Action Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Router status actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => state.refresh()}
                className="cursor-pointer"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </DropdownMenuItem>

              {!isOnline && (
                <DropdownMenuItem
                  onClick={() => state.reconnect()}
                  className="cursor-pointer"
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  Reconnect
                </DropdownMenuItem>
              )}

              {data.status === 'CONNECTING' && (
                <DropdownMenuItem
                  onClick={() => state.cancelReconnect()}
                  className="cursor-pointer"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Reconnect
                </DropdownMenuItem>
              )}

              {isOnline && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => state.disconnect()}
                    className="cursor-pointer text-semantic-error focus:text-semantic-error"
                  >
                    <Unplug className="h-4 w-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Memoized RouterStatusDesktop component
 */
export const RouterStatusDesktop = memo(RouterStatusDesktopComponent);
RouterStatusDesktop.displayName = 'RouterStatusDesktop';
