/**
 * TanStack Query mutation hook for enabling/disabling wireless interfaces
 * Provides optimistic updates with rollback on error
 * Uses rosproxy backend for RouterOS API communication
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { WirelessInterface } from '@nasnet/core/types';
import { wirelessKeys } from './useWirelessInterfaces';
import { toast } from '@nasnet/ui/primitives';

/**
 * Request payload for toggling interface state
 */
interface ToggleInterfaceRequest {
  /** Router IP address */
  routerIp: string;
  /** Interface ID (e.g., "*1") */
  id: string;
  /** Interface name (e.g., "wlan1") for display purposes */
  name: string;
  /** New disabled state */
  disabled: boolean;
}

/**
 * Toggle wireless interface enabled/disabled state
 * Calls RouterOS REST API via rosproxy to update the interface
 */
async function toggleInterface({
  routerIp,
  id,
  disabled,
}: ToggleInterfaceRequest): Promise<void> {
  const result = await makeRouterOSRequest<void>(
    routerIp,
    'interface/wifi/set',
    {
      method: 'POST',
      body: {
        '.id': id,
        disabled: disabled ? 'yes' : 'no',
      },
    }
  );

  if (!result.success) {
    throw new Error(result.error || 'Failed to toggle interface');
  }
}

/**
 * React Query mutation hook for toggling wireless interface state
 *
 * Features:
 * - Optimistic UI updates for immediate feedback
 * - Automatic rollback on error
 * - Cache invalidation on success
 * - Toast notifications for success/error
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * function InterfaceToggle({ interface }) {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const toggleMutation = useToggleInterface();
 *
 *   const handleToggle = () => {
 *     toggleMutation.mutate({
 *       routerIp: routerIp || '',
 *       id: interface.id,
 *       name: interface.name,
 *       disabled: !interface.disabled,
 *     });
 *   };
 *
 *   return (
 *     <Switch
 *       checked={!interface.disabled}
 *       onCheckedChange={handleToggle}
 *       disabled={toggleMutation.isPending}
 *     />
 *   );
 * }
 * ```
 */
export function useToggleInterface() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleInterface,

    // Optimistic update: immediately update the UI before API call completes
    onMutate: async (variables: ToggleInterfaceRequest) => {
      const { routerIp, id, disabled } = variables;

      // Cancel outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: wirelessKeys.interfaces(routerIp),
      });

      // Snapshot the previous value for rollback
      const previousInterfaces = queryClient.getQueryData<WirelessInterface[]>(
        wirelessKeys.interfaces(routerIp)
      );

      // Optimistically update the interface list
      if (previousInterfaces) {
        queryClient.setQueryData<WirelessInterface[]>(
          wirelessKeys.interfaces(routerIp),
          previousInterfaces.map((iface) =>
            iface.id === id
              ? { ...iface, disabled, running: !disabled }
              : iface
          )
        );
      }

      // Return context with snapshot for rollback
      return { previousInterfaces };
    },

    // On success: invalidate queries and show success toast
    onSuccess: (_, variables) => {
      const { routerIp, name, disabled } = variables;
      const action = disabled ? 'disabled' : 'enabled';

      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: wirelessKeys.interfaces(routerIp),
      });

      // Show success toast
      toast({
        title: `${name} ${action}`,
        description: `Wireless interface has been ${action}`,
      });
    },

    // On error: rollback optimistic update and show error toast
    onError: (error, variables, context) => {
      const { routerIp, name } = variables;

      // Rollback to previous state
      if (context?.previousInterfaces) {
        queryClient.setQueryData<WirelessInterface[]>(
          wirelessKeys.interfaces(routerIp),
          context.previousInterfaces
        );
      }

      // Show error toast
      toast({
        variant: 'destructive',
        title: `Failed to toggle ${name}`,
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred. Please try again.',
      });
    },
  });
}
