/**
 * TanStack Query hook for fetching wireless registration table (connected clients)
 * Provides data about devices connected to wireless interfaces
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { WirelessClient } from '@nasnet/core/types';
import { wirelessKeys } from './useWirelessInterfaces';

/**
 * Extended query keys for wireless clients
 */
export const wirelessClientKeys = {
  ...wirelessKeys,
  clients: (routerIp: string) => [...wirelessKeys.all, 'clients', routerIp] as const,
} as const;

interface RouterOSWirelessClientResponse {
  '.id'?: string;
  'mac-address'?: string;
  interface?: string;
  signal?: string;
  'tx-rate'?: string;
  'rx-rate'?: string;
  uptime?: string;
  'last-activity'?: string;
  bytes?: string;
  packets?: string;
}

function parseRate(rateStr: string | undefined): number {
  if (!rateStr) return 0;
  const match = rateStr.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseBytes(bytesStr: string | undefined): { rx: number; tx: number } {
  if (!bytesStr) return { rx: 0, tx: 0 };
  const parts = bytesStr.split(',');
  return {
    rx: parseInt(parts[0] || '0', 10),
    tx: parseInt(parts[1] || '0', 10),
  };
}

function parsePackets(packetsStr: string | undefined): { rx: number; tx: number } {
  if (!packetsStr) return { rx: 0, tx: 0 };
  const parts = packetsStr.split(',');
  return {
    rx: parseInt(parts[0] || '0', 10),
    tx: parseInt(parts[1] || '0', 10),
  };
}

async function fetchWirelessClients(routerIp: string): Promise<WirelessClient[]> {
  const result = await makeRouterOSRequest<RouterOSWirelessClientResponse[]>(
    routerIp,
    'interface/wifi/registration-table'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch wireless clients');
  }

  return result.data.map((client) => {
    const bytes = parseBytes(client.bytes);
    const packets = parsePackets(client.packets);

    return {
      id: client['.id'] || '',
      macAddress: client['mac-address'] || '',
      interface: client.interface || '',
      signalStrength: parseInt(client.signal || '-100', 10),
      txRate: parseRate(client['tx-rate']),
      rxRate: parseRate(client['rx-rate']),
      uptime: client.uptime || '0s',
      lastActivity: client['last-activity'] || '0s',
      rxBytes: bytes.rx,
      txBytes: bytes.tx,
      rxPackets: packets.rx,
      txPackets: packets.tx,
    };
  });
}

export function useWirelessClients(
  routerIp: string
): UseQueryResult<WirelessClient[], Error> {
  return useQuery({
    queryKey: wirelessClientKeys.clients(routerIp),
    queryFn: () => fetchWirelessClients(routerIp),
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!routerIp,
  });
}





