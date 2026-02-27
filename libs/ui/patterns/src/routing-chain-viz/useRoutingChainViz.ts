import { useMemo } from 'react';
import type { RoutingChainData, ChainHopData, HopHealth, UseRoutingChainVizReturn } from './types';

function getHopHealth(hop: ChainHopData): HopHealth {
  if (!hop.healthy) return 'unhealthy';
  if (hop.latencyMs !== null && hop.latencyMs > 200) return 'degraded';
  if (hop.latencyMs !== null && hop.latencyMs >= 0) return 'healthy';
  return 'unknown';
}

function getOverallHealth(hops: ChainHopData[]): HopHealth {
  if (hops.length === 0) return 'unknown';
  if (hops.some((h) => !h.healthy)) return 'unhealthy';
  if (hops.some((h) => h.latencyMs !== null && h.latencyMs > 200)) return 'degraded';
  return 'healthy';
}

function formatLatency(ms: number | null): string {
  if (ms === null) return 'N/A';
  if (ms < 0) return 'Unreachable';
  if (ms < 1) return '<1ms';
  return `${Math.round(ms)}ms`;
}

const KILL_SWITCH_LABELS: Record<string, string> = {
  BLOCK_ALL: 'Block All Traffic',
  FALLBACK_SERVICE: 'Fallback to Next Service',
  ALLOW_DIRECT: 'Allow Direct Connection',
};

export function useRoutingChainViz(chain: RoutingChainData | null): UseRoutingChainVizReturn {
  return useMemo(() => {
    if (!chain) {
      return {
        chain: null,
        hops: [],
        totalHops: 0,
        healthyHops: 0,
        unhealthyHops: 0,
        overallHealth: 'unknown' as HopHealth,
        totalLatency: 'N/A',
        deviceLabel: 'Unknown Device',
        killSwitchLabel: '',
        ariaLabel: 'No routing chain data',
        isActive: false,
      };
    }

    const hops = [...chain.hops].sort((a, b) => a.order - b.order);
    const healthyHops = hops.filter((h) => h.healthy).length;
    const unhealthyHops = hops.length - healthyHops;
    const overallHealth = getOverallHealth(hops);
    const totalLatency = formatLatency(chain.totalLatencyMs);

    const deviceLabel =
      chain.deviceName ||
      chain.deviceIp ||
      chain.deviceMac ||
      `Device ${chain.deviceId.slice(0, 8)}`;

    const killSwitchLabel =
      chain.killSwitchEnabled ?
        `Kill Switch: ${KILL_SWITCH_LABELS[chain.killSwitchMode] || chain.killSwitchMode}`
      : 'Kill Switch: Disabled';

    const hopNames = hops.map((h) => h.serviceName).join(' → ');
    const ariaLabel =
      `Routing chain for ${deviceLabel}: ${hopNames || 'no hops'}. ` +
      `${healthyHops} of ${hops.length} hops healthy. Total latency: ${totalLatency}. ` +
      `${killSwitchLabel}`;

    return {
      chain,
      hops,
      totalHops: hops.length,
      healthyHops,
      unhealthyHops,
      overallHealth,
      totalLatency,
      deviceLabel,
      killSwitchLabel,
      ariaLabel,
      isActive: chain.active,
    };
  }, [chain]);
}
