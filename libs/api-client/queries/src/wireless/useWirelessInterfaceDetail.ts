/**
 * TanStack Query hook for fetching detailed wireless interface configuration
 * Implements FR0-15: View wireless interface configuration details
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import {
  type WirelessInterfaceDetail,
  type WirelessMode,
  type ChannelWidth,
  getFrequencyBand,
} from '@nasnet/core/types';
import { wirelessKeys } from './useWirelessInterfaces';

/**
 * RouterOS wifi interface response format
 */
interface RouterOSWifiInterface {
  '.id': string;
  name: string;
  'mac-address'?: string;
  ssid?: string;
  disabled?: boolean | string;
  running?: boolean | string;
  frequency?: string | number;
  channel?: string;
  'channel-width'?: string;
  mode?: string;
  'tx-power'?: string | number;
  'security-profile'?: string;
  configuration?: string;
  'registered-clients'?: string | number;
  country?: string;
  'signal-strength'?: string | number;
  'connected-to'?: string;
  'hide-ssid'?: boolean | string;
}

/**
 * Fetches detailed configuration for a single wireless interface via rosproxy
 * Note: RouterOS REST API does not support query parameter filtering,
 * so we fetch all interfaces and filter client-side
 * @param routerIp - Target router IP address
 * @param interfaceName - The interface name (e.g., "wifi2.4-DomesticLAN")
 * @returns Detailed wireless interface configuration
 */
async function fetchWirelessInterfaceDetail(
  routerIp: string,
  interfaceName: string
): Promise<WirelessInterfaceDetail> {
  // GET all WiFi interfaces (will use cache if available from useWirelessInterfaces)
  const result = await makeRouterOSRequest<RouterOSWifiInterface[]>(
    routerIp,
    'interface/wifi'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || `Failed to fetch interfaces`);
  }

  // Filter client-side by name (RouterOS REST API doesn't support query params)
  const iface = result.data.find(i => i.name === interfaceName);

  if (!iface) {
    throw new Error(`Interface "${interfaceName}" not found`);
  }

  // Transform RouterOS API response to our typed interface
  return {
    id: iface['.id'],
    name: iface.name,
    macAddress: iface['mac-address'] || '',
    ssid: iface.ssid || null,
    disabled: iface.disabled === 'true' || iface.disabled === true,
    running: iface.running === 'true' || iface.running === true,
    band: getFrequencyBand(parseInt(String(iface.frequency || '0'))),
    frequency: parseInt(String(iface.frequency || '0')),
    channel: iface.channel || iface['channel-width']?.split('/')[0] || 'auto',
    mode: (iface.mode as WirelessMode) || 'ap-bridge',
    txPower: parseInt(String(iface['tx-power'] || '0')),
    securityProfile: iface['security-profile'] || iface.configuration || 'default',
    connectedClients: parseInt(String(iface['registered-clients'] || '0')),
    countryCode: iface.country || undefined,
    channelWidth: parseChannelWidth(iface['channel-width']),
    signalStrength: iface['signal-strength']
      ? parseInt(String(iface['signal-strength']))
      : undefined,
    connectedTo: iface['connected-to'] || undefined,
    hideSsid: iface['hide-ssid'] === 'true' || iface['hide-ssid'] === true,
  };
}

/**
 * Parses channel width from RouterOS format to our typed format
 * @param rosChannelWidth - RouterOS channel width (e.g., "20mhz", "20/40mhz-Ce")
 */
function parseChannelWidth(rosChannelWidth?: string): ChannelWidth {
  if (!rosChannelWidth) return '20MHz';

  const width = rosChannelWidth.toLowerCase();

  if (width.includes('160')) return '160MHz';
  if (width.includes('80')) return '80MHz';
  if (width.includes('40')) return '40MHz';
  return '20MHz';
}

/**
 * Hook to fetch detailed wireless interface configuration
 *
 * @param routerIp - Target router IP address
 * @param interfaceName - The interface name (e.g., "wlan1")
 * @returns Query result with detailed interface data
 *
 * @example
 * ```tsx
 * function InterfaceDetail({ interfaceName }) {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const { data, isLoading, error } = useWirelessInterfaceDetail(routerIp || '', interfaceName);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Error />;
 *
 *   return <DetailView interface={data} />;
 * }
 * ```
 */
export function useWirelessInterfaceDetail(
  routerIp: string,
  interfaceName: string
): UseQueryResult<WirelessInterfaceDetail, Error> {
  return useQuery({
    // Share cache with useWirelessInterfaces by using the same base key
    queryKey: [...wirelessKeys.interfaces(routerIp), 'detail', interfaceName] as const,
    queryFn: () => fetchWirelessInterfaceDetail(routerIp, interfaceName),
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!routerIp && !!interfaceName, // Only fetch if both are provided
  });
}
