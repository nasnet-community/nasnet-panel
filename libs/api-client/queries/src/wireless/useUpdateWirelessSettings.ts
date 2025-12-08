/**
 * TanStack Query mutation hook for updating wireless interface settings
 * Handles comprehensive wireless configuration updates
 * Uses rosproxy backend for RouterOS API communication
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import { wirelessKeys } from './useWirelessInterfaces';
import { toast } from '@nasnet/ui/primitives';
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

  // Basic settings
  /** New SSID (optional - only if changing) */
  ssid?: string;
  /** New password (optional - only if changing) */
  password?: string;
  /** Hide SSID from broadcast */
  hideSsid?: boolean;

  // Radio settings
  /** Channel number or 'auto' */
  channel?: string;
  /** Channel width (20MHz, 40MHz, 80MHz, 160MHz) */
  channelWidth?: ChannelWidth;
  /** TX Power in dBm */
  txPower?: number;

  // Security settings
  /** Security mode (wpa2-psk, wpa3-psk, etc.) */
  securityMode?: WirelessSecurityOption;

  // Regional settings
  /** Country code for regulatory compliance */
  countryCode?: string;
}

/**
 * Maps user-friendly security mode to RouterOS authentication types
 */
function getAuthenticationTypes(mode: WirelessSecurityOption): string[] {
  switch (mode) {
    case 'wpa2-psk':
      return ['wpa2-psk'];
    case 'wpa3-psk':
      return ['wpa3-psk'];
    case 'wpa2-wpa3-psk':
      return ['wpa2-psk', 'wpa3-psk'];
    case 'none':
    default:
      return [];
  }
}

/**
 * Update wireless interface configuration
 * Makes multiple API calls based on which settings are being changed
 */
async function updateWirelessSettings(
  request: UpdateWirelessSettingsRequest
): Promise<void> {
  const {
    routerIp,
    interfaceId,
    securityProfileId,
    ssid,
    password,
    hideSsid,
    channel,
    channelWidth,
    txPower,
    securityMode,
    countryCode,
  } = request;

  // Build interface update payload (settings on the interface itself)
  const interfaceUpdates: Record<string, unknown> = {
    '.id': interfaceId,
  };

  if (ssid !== undefined) {
    interfaceUpdates['ssid'] = ssid;
  }

  if (hideSsid !== undefined) {
    interfaceUpdates['hide-ssid'] = hideSsid;
  }

  if (channel !== undefined) {
    interfaceUpdates['channel'] = channel;
  }

  if (channelWidth !== undefined) {
    // RouterOS uses format like "20mhz", "40mhz", etc.
    interfaceUpdates['channel-width'] = channelWidth.toLowerCase();
  }

  if (txPower !== undefined) {
    interfaceUpdates['tx-power'] = txPower;
  }

  if (countryCode !== undefined) {
    interfaceUpdates['country'] = countryCode;
  }

  // Only make interface API call if there are updates beyond the ID
  if (Object.keys(interfaceUpdates).length > 1) {
    const result = await makeRouterOSRequest<void>(
      routerIp,
      'interface/wifi/set',
      {
        method: 'POST',
        body: interfaceUpdates,
      }
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to update interface settings');
    }
  }

  // Build security profile update payload
  const securityUpdates: Record<string, unknown> = {
    '.id': securityProfileId,
  };

  if (password !== undefined && password.length > 0) {
    securityUpdates['passphrase'] = password;
  }

  if (securityMode !== undefined) {
    if (securityMode === 'none') {
      // Open network - disable authentication
      securityUpdates['authentication-types'] = '';
    } else {
      // Set authentication types based on mode
      const authTypes = getAuthenticationTypes(securityMode);
      securityUpdates['authentication-types'] = authTypes.join(',');
    }
  }

  // Only make security API call if there are updates beyond the ID
  if (Object.keys(securityUpdates).length > 1) {
    const result = await makeRouterOSRequest<void>(
      routerIp,
      'interface/wifi/security/set',
      {
        method: 'POST',
        body: securityUpdates,
      }
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to update security settings');
    }
  }
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
export function useUpdateWirelessSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWirelessSettings,

    // On success: invalidate queries and show success toast
    onSuccess: (_, variables) => {
      const { routerIp, interfaceName } = variables;

      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: wirelessKeys.interfaces(routerIp),
      });

      // Also invalidate the specific interface detail
      queryClient.invalidateQueries({
        queryKey: wirelessKeys.interface(routerIp, interfaceName),
      });

      // Show success toast
      toast({
        title: 'Settings saved',
        description: `${interfaceName} has been updated successfully`,
      });
    },

    // On error: show error toast with user-friendly message
    onError: (error, variables) => {
      const { interfaceName } = variables;

      // Transform error message for user
      const userMessage = getErrorMessage(error);

      // Show error toast
      toast({
        variant: 'destructive',
        title: `Failed to update ${interfaceName}`,
        description: userMessage,
      });
    },
  });
}

/**
 * Transform API error to user-friendly message
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('ssid')) {
      return 'Invalid SSID format. Please check your network name.';
    }
    if (error.message.includes('password') || error.message.includes('key') || error.message.includes('passphrase')) {
      return 'Invalid password. WPA2/WPA3 requires at least 8 characters.';
    }
    if (error.message.includes('permission') || error.message.includes('auth')) {
      return 'Permission denied. Please check your credentials.';
    }
    if (error.message.includes('channel')) {
      return 'Invalid channel selection for this region or band.';
    }
    if (error.message.includes('power') || error.message.includes('tx-power')) {
      return 'Invalid TX power setting. Check regulatory limits for your region.';
    }
    if (error.message.includes('country')) {
      return 'Invalid country code. Please select a valid region.';
    }

    // Return original message if no pattern matches
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
