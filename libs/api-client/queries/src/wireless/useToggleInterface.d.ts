/**
 * TanStack Query mutation hook for enabling/disabling wireless interfaces
 * Provides optimistic updates with rollback on error
 * Uses rosproxy backend for RouterOS API communication
 */
import type { WirelessInterface } from '@nasnet/core/types';
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
export declare function useToggleInterface(): import("@tanstack/react-query").UseMutationResult<void, Error, ToggleInterfaceRequest, {
    previousInterfaces: WirelessInterface[] | undefined;
}>;
export {};
//# sourceMappingURL=useToggleInterface.d.ts.map