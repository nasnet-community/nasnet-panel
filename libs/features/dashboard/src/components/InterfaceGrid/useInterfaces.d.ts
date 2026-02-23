/**
 * useInterfaces Hook
 *
 * Fetches and subscribes to interface data with hybrid real-time strategy.
 * Uses GraphQL subscription as primary source, polling as fallback.
 */
import type { InterfaceGridData } from './types';
interface UseInterfacesProps {
    /** Device ID to fetch interfaces for */
    deviceId: string;
}
interface UseInterfacesReturn {
    /** Sorted array of interface data */
    interfaces: InterfaceGridData[];
    /** Whether data is loading (only true on initial load) */
    isLoading: boolean;
    /** Error object if query or subscription failed */
    error: Error | null;
    /** Function to manually refetch data */
    refetch: () => Promise<void>;
}
/**
 * Hook to fetch and subscribe to interface data.
 * Uses GraphQL subscription as primary, polling as fallback.
 *
 * @description
 * Provides hybrid real-time strategy:
 * - Primary: WebSocket subscription for instant updates
 * - Fallback: 2s polling if subscription unavailable
 * - Automatically switches between sources
 * - Cleans up subscriptions on unmount
 *
 * @example
 * function InterfaceList({ deviceId }: { deviceId: string }) {
 *   const { interfaces, isLoading, error, refetch } = useInterfaces({ deviceId });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Error message={error.message} onRetry={refetch} />;
 *
 *   return interfaces.map(iface => <InterfaceCard key={iface.id} data={iface} />);
 * }
 */
export declare function useInterfaces({ deviceId, }: UseInterfacesProps): UseInterfacesReturn;
export {};
//# sourceMappingURL=useInterfaces.d.ts.map