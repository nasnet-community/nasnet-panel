/**
 * TanStack Query mutation hook for terminating a connection
 * NAS-7.4: Connection Tracking - Mutation Layer
 * Uses rosproxy backend for RouterOS API communication
 *
 * Endpoint: DELETE /rest/ip/firewall/connection/{id}
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import { firewallConnectionKeys } from './queryKeys';

// ============================================================================
// API Functions
// ============================================================================

/**
 * Variables for kill connection mutation
 */
export interface KillConnectionVariables {
  /**
   * Target router IP address
   */
  routerIp: string;

  /**
   * Connection ID to terminate (from connection.id)
   */
  connectionId: string;
}

/**
 * Terminates an active connection in the connection tracking table
 * Endpoint: POST /rest/ip/firewall/connection/remove
 *
 * @param variables - Router IP and connection ID
 * @returns Promise that resolves when connection is terminated
 */
async function killConnection(variables: KillConnectionVariables): Promise<void> {
  const { routerIp, connectionId } = variables;

  // RouterOS REST API uses POST to /rest/ip/firewall/connection/remove
  // with the connection ID in the request body
  const result = await makeRouterOSRequest<void>(routerIp, 'ip/firewall/connection/remove', {
    method: 'POST',
    body: {
      '.id': connectionId,
    },
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to terminate connection');
  }
}

// ============================================================================
// React Query Hooks
// ============================================================================

export interface UseKillConnectionOptions {
  /**
   * Target router IP address
   */
  routerIp: string;

  /**
   * Callback fired on successful termination
   */
  onSuccess?: () => void;

  /**
   * Callback fired on error
   */
  onError?: (error: Error) => void;
}

/**
 * React Query mutation hook for terminating an active connection
 *
 * Removes a connection from the connection tracking table, effectively
 * terminating the connection. Use with caution as this can disrupt
 * active network traffic.
 *
 * @param options - Hook configuration options
 * @returns Mutation result with killConnection function
 *
 * @example
 * ```tsx
 * function ConnectionRow({ connection }: { connection: Connection }) {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const { mutate: killConnection, isPending } = useKillConnection({
 *     routerIp: routerIp || '',
 *     onSuccess: () => toast.success('Connection terminated'),
 *     onError: (error) => toast.error(`Failed: ${error.message}`),
 *   });
 *
 *   return (
 *     <TableRow>
 *       <TableCell>{connection.srcAddress}:{connection.srcPort}</TableCell>
 *       <TableCell>{connection.dstAddress}:{connection.dstPort}</TableCell>
 *       <TableCell>
 *         <Button
 *           onClick={() => killConnection({ connectionId: connection.id })}
 *           disabled={isPending}
 *           variant="destructive"
 *           size="sm"
 *         >
 *           {isPending ? 'Terminating...' : 'Kill'}
 *         </Button>
 *       </TableCell>
 *     </TableRow>
 *   );
 * }
 * ```
 */
export function useKillConnection({
  routerIp,
  onSuccess,
  onError,
}: UseKillConnectionOptions): UseMutationResult<
  void,
  Error,
  Pick<KillConnectionVariables, 'connectionId'>,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: Pick<KillConnectionVariables, 'connectionId'>) =>
      killConnection({ routerIp, ...variables }),

    onSuccess: () => {
      // Invalidate connections list to trigger refetch
      queryClient.invalidateQueries({
        queryKey: firewallConnectionKeys.all(routerIp),
      });

      onSuccess?.();
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });
}
