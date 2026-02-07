// libs/features/diagnostics/src/utils/network-detection.ts
import { apolloClient } from '@nasnet/api-client/core';
import { DETECT_WAN_INTERFACE, DETECT_GATEWAY } from '@nasnet/api-client/queries';
import { DiagnosticError } from '../types/troubleshoot.types';

/**
 * Get WAN interface name from default route via GraphQL query
 * This is called in the 'initializing' state of the machine
 *
 * @param routerId - The router to query
 * @returns The detected WAN interface name (e.g., 'ether1')
 * @throws DiagnosticError if no default route is configured
 */
export async function detectWanInterface(routerId: string): Promise<string> {
  try {
    const { data } = await apolloClient.query({
      query: DETECT_WAN_INTERFACE,
      variables: { routerId },
      fetchPolicy: 'network-only', // Always fetch fresh data
    });

    if (!data?.detectWanInterface) {
      throw new DiagnosticError('NO_DEFAULT_ROUTE', 'No default route configured');
    }

    return data.detectWanInterface;
  } catch (error) {
    if (error instanceof DiagnosticError) {
      throw error;
    }
    throw new DiagnosticError(
      'DETECTION_FAILED',
      error instanceof Error ? error.message : 'Failed to detect WAN interface'
    );
  }
}

/**
 * Get default gateway IP from DHCP client or static route via GraphQL query
 * This is called in the 'initializing' state of the machine
 *
 * @param routerId - The router to query
 * @returns The detected gateway IP address or null if none found
 * @throws DiagnosticError if detection fails (but not if no gateway is found)
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
    throw new DiagnosticError(
      'DETECTION_FAILED',
      error instanceof Error ? error.message : 'Failed to detect gateway'
    );
  }
}
