/**
 * TanStack Query hook for fetching wireless registration table (connected clients)
 * Provides data about devices connected to wireless interfaces
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { WirelessClient } from '@nasnet/core/types';
/**
 * Extended query keys for wireless clients
 */
export declare const wirelessClientKeys: {
  readonly clients: (routerIp: string) => readonly ['wireless', 'clients', string];
  readonly all: readonly ['wireless'];
  readonly interfaces: (routerIp: string) => readonly ['wireless', 'interfaces', string];
  readonly interface: (
    routerIp: string,
    id: string
  ) => readonly ['wireless', 'interfaces', string, string];
};
export declare function useWirelessClients(
  routerIp: string
): UseQueryResult<WirelessClient[], Error>;
//# sourceMappingURL=useWirelessClients.d.ts.map
