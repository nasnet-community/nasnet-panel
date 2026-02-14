/**
 * VirtualInterfaceBridge Mobile Presenter
 *
 * Mobile-optimized presenter for VirtualInterfaceBridge pattern.
 * Optimized for touch interaction with 44px minimum targets.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';
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
export function VirtualInterfaceBridgeMobile(
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
        <div className="flex items-center justify-between min-h-[44px]">
          <CardTitle className="text-base flex items-center gap-2">
            <Network className="h-4 w-4" aria-hidden="true" />
            Network Bridge
            {serviceName && (
              <span className="text-sm text-muted-foreground font-normal">
                ({serviceName})
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="min-w-[44px] min-h-[44px]"
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
            <span className="text-sm text-muted-foreground min-w-[80px]">
              Status:
            </span>
            <Badge
              variant={statusColor}
              className="flex-1 justify-center min-h-[32px]"
            >
              {statusLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground min-w-[80px]">
              Gateway:
            </span>
            <Badge
              variant={gatewayBadgeVariant}
              className="flex-1 justify-center min-h-[32px]"
            >
              {gatewayBadgeText}
            </Badge>
          </div>
        </div>

        {/* Interface details */}
        {hasInterface && interfaceData && (
          <div className="space-y-3 pt-3 border-t">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">
                  Interface:
                </span>
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {interfaceData.name}
                </code>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">
                  IP Address:
                </span>
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {interfaceData.ipAddress}
                </code>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">VLAN ID:</span>
                <span className="text-sm font-medium">
                  {interfaceData.vlanId}
                </span>
              </div>

              {interfaceData.tunName && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">
                    Tunnel:
                  </span>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
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
              <ul className="list-disc list-inside space-y-1 text-sm">
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
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading bridge status...
            </div>
          </div>
        )}

        {/* Pending state */}
        {!loading && !hasInterface && !hasErrors && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Virtual interface is being created...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

VirtualInterfaceBridgeMobile.displayName = 'VirtualInterfaceBridgeMobile';
