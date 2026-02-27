/**
 * VirtualInterfaceBridge Desktop Presenter
 *
 * Desktop-optimized presenter for VirtualInterfaceBridge pattern.
 * Optimized for mouse interaction with hover states and compact layout.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { memo } from 'react';
import { RefreshCw, Network, AlertCircle, Info } from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@nasnet/ui/primitives';

import { useVirtualInterfaceBridge } from './useVirtualInterfaceBridge';

import type { VirtualInterfaceBridgeProps } from './types';

/**
 * Desktop presenter for VirtualInterfaceBridge
 *
 * Features:
 * - Compact horizontal layout
 * - Dense information display
 * - Hover tooltips for additional context
 * - Inline status indicators
 */
const VirtualInterfaceBridgeDesktopComponent = memo(function VirtualInterfaceBridgeDesktop(
  props: VirtualInterfaceBridgeProps
) {
  const { serviceName, className, children } = props;
  const {
    interface: bridgeStatus,
    isReady,
    loading,
    error,
    statusColor,
    statusLabel,
    gatewayBadgeText,
    gatewayBadgeVariant,
    hasInterface,
    hasErrors,
    errors,
    handleRefresh,
  } = useVirtualInterfaceBridge(props);

  const interfaceData = bridgeStatus?.interface;

  return (
    <Card
      className={`hover:bg-muted/50 transition-colors ${className || ''}`}
      role="region"
      aria-label="Virtual Interface Bridge Status"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Network
              className="h-4 w-4"
              aria-hidden="true"
            />
            Network Bridge
            {serviceName && (
              <span className="text-muted-foreground text-sm font-normal">({serviceName})</span>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info
                    className="text-muted-foreground h-3.5 w-3.5 cursor-help"
                    aria-label="Bridge information"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Virtual interface bridge provides network isolation and gateway routing for this
                    service instance.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh bridge status"
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status row - horizontal compact layout */}
        <div className="flex items-center gap-4">
          {/* Status with dot indicator */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <span
                    className={`relative flex h-3 w-3 shrink-0 ${isReady ? 'opacity-100' : 'opacity-50'} `}
                  >
                    <span
                      className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                        statusColor === 'success' ? 'bg-green-400'
                        : statusColor === 'error' ? 'bg-red-400'
                        : 'bg-yellow-400'
                      } `}
                      aria-hidden="true"
                    />
                    <span
                      className={`relative inline-flex h-3 w-3 rounded-full ${
                        statusColor === 'success' ? 'bg-green-500'
                        : statusColor === 'error' ? 'bg-red-500'
                        : 'bg-yellow-500'
                      } `}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-sm font-medium">{statusLabel}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {isReady ? 'Bridge is ready for traffic' : 'Bridge is being initialized'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Gateway badge */}
          <Badge
            variant={gatewayBadgeVariant}
            className="shrink-0"
          >
            {gatewayBadgeText}
          </Badge>

          {/* Interface details - inline */}
          {hasInterface && interfaceData && (
            <>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Interface:</span>
                <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                  {interfaceData.name}
                </code>
              </div>

              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">IP:</span>
                <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                  {interfaceData.ipAddress}
                </code>
              </div>

              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">VLAN:</span>
                <span className="text-xs font-medium">{interfaceData.vlanId}</span>
              </div>

              {interfaceData.tunName && (
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground">Tunnel:</span>
                  <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                    {interfaceData.tunName}
                  </code>
                </div>
              )}
            </>
          )}
        </div>

        {/* Errors */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-inside list-disc space-y-0.5 text-xs">
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* API Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Failed to fetch bridge status: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Custom content */}
        {children && <div className="border-t pt-2">{children}</div>}

        {/* Loading state */}
        {loading && !hasInterface && (
          <div className="text-muted-foreground flex items-center gap-2 py-2 text-xs">
            <RefreshCw
              className="h-3.5 w-3.5 animate-spin"
              aria-hidden="true"
            />
            Loading bridge status...
          </div>
        )}

        {/* Pending state */}
        {!loading && !hasInterface && !hasErrors && (
          <div className="text-muted-foreground py-2 text-xs">
            Virtual interface is being created...
          </div>
        )}
      </CardContent>
    </Card>
  );
});

VirtualInterfaceBridgeDesktopComponent.displayName = 'VirtualInterfaceBridgeDesktop';

export { VirtualInterfaceBridgeDesktopComponent as VirtualInterfaceBridgeDesktop };
