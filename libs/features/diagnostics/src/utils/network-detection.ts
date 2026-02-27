// libs/features/diagnostics/src/utils/network-detection.ts
import { apolloClient } from '@nasnet/api-client/core';
import { DETECT_WAN_INTERFACE, DETECT_GATEWAY } from '@nasnet/api-client/queries';
import { DiagnosticError } from '../types/troubleshoot.types';

/**
 * @description Detect the WAN interface name by querying the default route configuration.
 * Called during the 'initializing' state to identify which interface connects to the internet.
 * Required for subsequent network diagnostics (gateway, internet, DNS checks).
 *
 * @param routerId - The router UUID to query for default route configuration
 * @returns Promise<string> the detected WAN interface name (e.g., 'ether1', 'pppoe-out')
 * @throws DiagnosticError if no default route is configured (network isolation issue)
 */
export async function detectWanInterface(routerId: string): Promise<string> {
  try {
    const { data } = await apolloClient.query({
      query: DETECT_WAN_INTERFACE,
      variables: { routerId },
      fetchPolicy: 'network-only', // Always fetch fresh data
    });

    if (!data?.detectWanInterface) {
      throw new DiagnosticError(
        'NO_DEFAULT_ROUTE',
        'No default route configured. Add a default route or DHCP client to enable internet access.'
      );
    }

    return data.detectWanInterface;
  } catch (error) {
    if (error instanceof DiagnosticError) {
      throw error;
    }
    const errorMessage =
      error instanceof Error ?
        error.message
      : 'Failed to detect WAN interface. Verify the router is reachable and has network configuration.';
    throw new DiagnosticError('DETECTION_FAILED', errorMessage);
  }
}

/**
 * @description Detect the default gateway IP address from DHCP client or static route configuration.
 * Called during the 'initializing' state to identify the upstream router/gateway.
 * Returns null gracefully if no gateway is configured (not an error).
 *
 * @param routerId - The router UUID to query for gateway configuration
 * @returns Promise<string | null> the detected gateway IP (e.g., '192.168.1.1') or null if not configured
 * @throws DiagnosticError if query fails (network/API issue), but NOT if gateway is simply missing
 */
export async function detectGateway(routerId: string): Promise<string | null> {
  try {
    const { data } = await apolloClient.query({
      query: DETECT_GATEWAY,
      variables: { routerId },
      fetchPolicy: 'network-only', // Always fetch fresh data
    });

    // Gateway may be null if no DHCP client or static route is configured
    // This is not necessarily an error - the user may need to configure it
    return data?.detectGateway || null;
  } catch (error) {
    const errorMessage =
      error instanceof Error ?
        error.message
      : 'Failed to detect gateway. Check that the router is connected and DHCP is configured.';
    throw new DiagnosticError('DETECTION_FAILED', errorMessage);
  }
}
