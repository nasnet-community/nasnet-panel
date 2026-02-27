/**
 * VirtualInterfaceBridge Mobile Presenter
 *
 * Mobile-optimized presenter for VirtualInterfaceBridge pattern.
 * Optimized for touch interaction with 44px minimum targets.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { memo } from 'react';
import { RefreshCw, Network, AlertCircle } from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
} from '@nasnet/ui/primitives';

import { useVirtualInterfaceBridge } from './useVirtualInterfaceBridge';

import type { VirtualInterfaceBridgeProps } from './types';

/**
 * Mobile presenter for VirtualInterfaceBridge
 *
 * Features:
 * - Large touch targets (44px minimum)
 * - Vertical stack layout
 * - Full-width badges
 * - Touch-friendly spacing
 */
const VirtualInterfaceBridgeMobileComponent = memo(function VirtualInterfaceBridgeMobile(
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
      className={`touch-manipulation ${className || ''}`}
      role="region"
      aria-label="Virtual Interface Bridge Status"
    >
      <CardHeader className="pb-3">
        <div className="flex min-h-[44px] items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Network
              className="h-4 w-4"
              aria-hidden="true"
            />
            Network Bridge
            {serviceName && (
              <span className="text-muted-foreground text-sm font-normal">({serviceName})</span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="min-h-[44px] min-w-[44px]"
            aria-label="Refresh bridge status"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status badges - full width on mobile */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground min-w-[80px] text-sm">Status:</span>
            <Badge
              variant={statusColor}
              className="min-h-[32px] flex-1 justify-center"
            >
              {statusLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground min-w-[80px] text-sm">Gateway:</span>
            <Badge
              variant={gatewayBadgeVariant}
              className="min-h-[32px] flex-1 justify-center"
            >
              {gatewayBadgeText}
            </Badge>
          </div>
        </div>

        {/* Interface details */}
        {hasInterface && interfaceData && (
          <div className="space-y-3 border-t pt-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground text-sm">Interface:</span>
                <code className="bg-muted rounded px-2 py-1 font-mono text-sm">
                  {interfaceData.name}
                </code>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-muted-foreground text-sm">IP Address:</span>
                <code className="bg-muted rounded px-2 py-1 font-mono text-sm">
                  {interfaceData.ipAddress}
                </code>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-muted-foreground text-sm">VLAN ID:</span>
                <span className="text-sm font-medium">{interfaceData.vlanId}</span>
              </div>

              {interfaceData.tunName && (
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground text-sm">Tunnel:</span>
                  <code className="bg-muted rounded px-2 py-1 font-mono text-sm">
                    {interfaceData.tunName}
                  </code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Errors */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-inside list-disc space-y-1 text-sm">
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
            <AlertDescription className="text-sm">
              Failed to fetch bridge status: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Custom content */}
        {children}

        {/* Loading state */}
        {loading && !hasInterface && (
          <div className="py-4 text-center">
            <div className="text-muted-foreground inline-flex items-center gap-2 text-sm">
              <RefreshCw
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Loading bridge status...
            </div>
          </div>
        )}

        {/* Pending state */}
        {!loading && !hasInterface && !hasErrors && (
          <div className="py-4 text-center">
            <p className="text-muted-foreground text-sm">Virtual interface is being created...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

VirtualInterfaceBridgeMobileComponent.displayName = 'VirtualInterfaceBridgeMobile';

export { VirtualInterfaceBridgeMobileComponent as VirtualInterfaceBridgeMobile };
