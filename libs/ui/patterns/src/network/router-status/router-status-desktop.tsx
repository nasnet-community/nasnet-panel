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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
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
export function RouterStatusDesktop({ state, className }: RouterStatusPresenterProps) {
  const { data, loading, error, isOnline, statusLabel, lastSeenRelative } = state;

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

  const showReconnecting = data.status === 'CONNECTING' && data.reconnectAttempt > 0;

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Status Section */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Status Indicator */}
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full shrink-0',
                STATUS_BG_COLORS[data.status]
              )}
            >
              {data.status === 'CONNECTING' ? (
                <RefreshCw
                  className={cn('h-5 w-5 animate-spin', STATUS_TEXT_COLORS[data.status])}
                  aria-hidden="true"
                />
              ) : data.status === 'DISCONNECTED' || data.status === 'ERROR' ? (
                <WifiOff
                  className={cn('h-5 w-5', STATUS_TEXT_COLORS[data.status])}
                  aria-hidden="true"
                />
              ) : (
                <Wifi
                  className={cn('h-5 w-5', STATUS_TEXT_COLORS[data.status])}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Status Text */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <StatusIndicator status={data.status} size="sm" />
                <span className={cn('text-sm font-medium', STATUS_TEXT_COLORS[data.status])}>
                  {statusLabel}
                </span>

                {/* Reconnect Attempts */}
                {showReconnecting && (
                  <span className="text-xs text-muted-foreground">
                    (Attempt {data.reconnectAttempt} of {data.maxReconnectAttempts})
                  </span>
                )}
              </div>

              {/* Secondary Info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {/* Protocol */}
                {isOnline && data.protocol && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        {PROTOCOL_LABELS[data.protocol] || data.protocol}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Connection protocol: {PROTOCOL_LABELS[data.protocol] || data.protocol}</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Latency */}
                {isOnline && data.latencyMs !== null && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            'font-mono cursor-help',
                            data.latencyMs < 100
                              ? 'text-semantic-success'
                              : data.latencyMs < 300
                                ? 'text-semantic-warning'
                                : 'text-semantic-error'
                          )}
                        >
                          {data.latencyMs}ms
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Latency:{' '}
                          {data.latencyMs < 100
                            ? 'Excellent'
                            : data.latencyMs < 300
                              ? 'Good'
                              : 'Poor'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}

                {/* Last Connected */}
                {!isOnline && lastSeenRelative && (
                  <span>Last connected: {lastSeenRelative}</span>
                )}
              </div>
            </div>
          </div>

          {/* Router Info */}
          {isOnline && (data.model || data.version) && (
            <div className="hidden lg:flex flex-col items-end text-right text-xs text-muted-foreground">
              {data.model && <span className="font-medium">{data.model}</span>}
              {data.version && <span>RouterOS {data.version}</span>}
              {data.uptime && <span className="text-muted-foreground/70">Uptime: {data.uptime}</span>}
            </div>
          )}

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
