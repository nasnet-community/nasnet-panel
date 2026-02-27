/**
 * TanStack Query mutation hook for updating wireless interface settings
 * Handles comprehensive wireless configuration updates
 * Uses rosproxy backend for RouterOS API communication
 */
import type { ChannelWidth, WirelessSecurityOption } from '@nasnet/core/types';
/**
 * Request payload for updating wireless settings
 */
export interface UpdateWirelessSettingsRequest {
  /** Router IP address */
  routerIp: string;
  /** Interface ID (e.g., "*1") */
  interfaceId: string;
  /** Interface name (e.g., "wlan1") for display purposes */
  interfaceName: string;
  /** Security profile ID */
  securityProfileId: string;
  /** New SSID (optional - only if changing) */
  ssid?: string;
  /** New password (optional - only if changing) */
  password?: string;
  /** Hide SSID from broadcast */
  hideSsid?: boolean;
  /** Channel number or 'auto' */
  channel?: string;
  /** Channel width (20MHz, 40MHz, 80MHz, 160MHz) */
  channelWidth?: ChannelWidth;
  /** TX Power in dBm */
  txPower?: number;
  /** Security mode (wpa2-psk, wpa3-psk, etc.) */
  securityMode?: WirelessSecurityOption;
  /** Country code for regulatory compliance */
  countryCode?: string;
}
/**
 * React Query mutation hook for updating wireless settings
 *
 * Features:
 * - Updates SSID, password, channel, width, TX power, hide SSID, security mode, country
 * - Invalidates cached data on success
 * - Toast notifications for success/error
 * - Error transformation for user-friendly messages
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * function WirelessSettingsForm({ interface }) {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const updateMutation = useUpdateWirelessSettings();
 *
 *   const handleSubmit = (data) => {
 *     updateMutation.mutate({
 *       routerIp: routerIp || '',
 *       interfaceId: interface.id,
 *       interfaceName: interface.name,
 *       securityProfileId: interface.securityProfile,
 *       ssid: data.ssid,
 *       password: data.password,
 *       channel: data.channel,
 *       channelWidth: data.channelWidth,
 *       txPower: data.txPower,
 *       hideSsid: data.hideSsid,
 *       securityMode: data.securityMode,
 *       countryCode: data.countryCode,
 *     });
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       ...form fields...
 *     </form>
 *   );
 * }
 * ```
 */
export declare function useUpdateWirelessSettings(): import('@tanstack/react-query').UseMutationResult<
  void,
  Error,
  UpdateWirelessSettingsRequest,
  unknown
>;
//# sourceMappingURL=useUpdateWirelessSettings.d.ts.map
