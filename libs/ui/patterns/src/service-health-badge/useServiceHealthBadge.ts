import { useMemo } from 'react';

import type {
  ServiceInstanceHealth,
  InstanceHealthState,
  HealthConnectionState,
} from '@nasnet/api-client/generated/types';
import type { RuntimeState } from '@nasnet/core/types';

/**
 * Maps GraphQL InstanceHealthState to UI RuntimeState
 */
export function mapHealthStateToRuntimeState(state: InstanceHealthState): RuntimeState['health'] {
  switch (state) {
    case 'HEALTHY':
      return 'HEALTHY';
    case 'UNHEALTHY':
      return 'FAILED';
    case 'CHECKING':
      return 'DEGRADED';
    case 'UNKNOWN':
    default:
      return 'UNKNOWN';
  }
}

/**
 * Gets latency color based on value
 */
export function getLatencyColor(latencyMs?: number | null): 'success' | 'warning' | 'error' {
  if (!latencyMs) return 'success';

  if (latencyMs < 100) return 'success';
  if (latencyMs < 500) return 'warning';
  return 'error';
}

/**
 * Formats uptime duration for display
 */
export function formatUptime(uptimeSeconds?: number | null): string {
  if (!uptimeSeconds) return 'Unknown';

  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

/**
 * Formats last healthy timestamp for display
 */
export function formatLastHealthy(lastHealthy?: Date | string | null): string {
  if (!lastHealthy) return 'Never';

  const date = typeof lastHealthy === 'string' ? new Date(lastHealthy) : lastHealthy;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Headless hook for service health badge logic
 *
 * Maps GraphQL health data to UI-friendly format and provides
 * computed values for display.
 *
 * @param health - Health status from GraphQL
 * @returns Computed UI state
 */
export function useServiceHealthBadge(health?: ServiceInstanceHealth | null) {
  return useMemo(() => {
    if (!health) {
      return {
        healthState: 'UNKNOWN' as RuntimeState['health'],
        showWarning: false,
        latencyColor: 'success' as const,
        formattedUptime: 'Unknown',
        formattedLastHealthy: 'Never',
        hasFailures: false,
        isProcessAlive: false,
        isConnected: false,
      };
    }

    const healthState = mapHealthStateToRuntimeState(health.status);
    const showWarning = health.consecutiveFails > 0;
    const latencyColor = getLatencyColor(health.latencyMs);
    const formattedUptime = formatUptime(health.uptimeSeconds);
    const formattedLastHealthy = formatLastHealthy(health.lastHealthy);
    const hasFailures = health.consecutiveFails > 0;
    const isProcessAlive = health.processAlive;
    const isConnected = health.connectionStatus === 'CONNECTED';

    return {
      healthState,
      showWarning,
      latencyColor,
      formattedUptime,
      formattedLastHealthy,
      hasFailures,
      isProcessAlive,
      isConnected,
      // Raw values for advanced usage
      raw: {
        status: health.status,
        latencyMs: health.latencyMs,
        consecutiveFails: health.consecutiveFails,
        connectionStatus: health.connectionStatus,
      },
    };
  }, [health]);
}
