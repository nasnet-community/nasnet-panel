import { memo } from 'react';

import { cn } from '@nasnet/ui/primitives';

import { ResourceHealthBadge } from '../resource-health-indicator';
import { useServiceHealthBadge } from './useServiceHealthBadge';

import type { ServiceHealthBadgeProps } from './ServiceHealthBadge';

/**
 * Desktop presenter for service health badge
 *
 * Shows full badge with health indicator, metrics, and status text.
 * Provides detailed health information for power users.
 */
function ServiceHealthBadgeDesktopComponent({
  health,
  loading,
  animate,
  className,
}: ServiceHealthBadgeProps) {
  const {
    healthState,
    showWarning,
    latencyColor,
    formattedUptime,
    formattedLastHealthy,
    hasFailures,
    isProcessAlive,
    isConnected,
    raw,
  } = useServiceHealthBadge(health);

  if (loading) {
    return (
      <ResourceHealthBadge
        health="UNKNOWN"
        label="Checking..."
        animate
        className={className}
      />
    );
  }

  // Determine label based on health state
  const getLabel = () => {
    if (!health) return 'Unknown';

    switch (healthState) {
      case 'HEALTHY':
        return 'Healthy';
      case 'FAILED':
        return hasFailures
          ? `Unhealthy (${raw?.consecutiveFails ?? 0} failures)`
          : 'Unhealthy';
      case 'DEGRADED':
        return 'Checking...';
      case 'UNKNOWN':
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Primary health badge */}
      <ResourceHealthBadge
        health={healthState}
        label={getLabel()}
        animate={animate}
      />

      {/* Metrics (show only if healthy or degraded) */}
      {health && healthState !== 'UNKNOWN' && (
        <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
          {/* Process Status */}
          <div className="flex items-center gap-1">
            <span className="font-medium">Process:</span>
            <span className={isProcessAlive ? 'text-success' : 'text-error'}>
              {isProcessAlive ? 'Alive' : 'Down'}
            </span>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-1">
            <span className="font-medium">Connection:</span>
            <span className={isConnected ? 'text-success' : 'text-error'}>
              {raw?.connectionStatus}
            </span>
          </div>

          {/* Latency */}
          {raw?.latencyMs != null && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Latency:</span>
              <span className={`text-${latencyColor}`}>
                {raw?.latencyMs}ms
              </span>
            </div>
          )}

          {/* Uptime */}
          {health.uptimeSeconds != null && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Uptime:</span>
              <span>{formattedUptime}</span>
            </div>
          )}

          {/* Last Healthy */}
          {health.lastHealthy && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Last Healthy:</span>
              <span>{formattedLastHealthy}</span>
            </div>
          )}
        </div>
      )}

      {/* Warning for consecutive failures */}
      {showWarning && (raw?.consecutiveFails ?? 0) > 0 && healthState !== 'FAILED' && (
        <div className="text-xs text-warning">
          ⚠️ {raw?.consecutiveFails} consecutive failures detected
        </div>
      )}
    </div>
  );
}

// Wrap with memo for performance optimization
export const ServiceHealthBadgeDesktop = memo(ServiceHealthBadgeDesktopComponent);

// Set display name for React DevTools
ServiceHealthBadgeDesktop.displayName = 'ServiceHealthBadgeDesktop';
