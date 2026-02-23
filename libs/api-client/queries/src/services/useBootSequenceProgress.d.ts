/**
 * Boot sequence progress state
 */
export interface BootSequenceProgress {
    inProgress: boolean;
    currentLayer?: number;
    totalLayers?: number;
    startedInstances: string[];
    failedInstances: string[];
    remainingInstances: string[];
}
/**
 * Boot sequence event types
 */
export type BootSequenceEventType = 'BOOT_SEQUENCE_STARTED' | 'LAYER_STARTED' | 'INSTANCE_STARTED' | 'INSTANCE_FAILED' | 'LAYER_COMPLETED' | 'BOOT_SEQUENCE_COMPLETED' | 'BOOT_SEQUENCE_FAILED';
/**
 * Boot sequence event from subscription
 */
export interface BootSequenceEvent {
    id: string;
    type: BootSequenceEventType;
    timestamp: string;
    layer?: number;
    instanceIds: string[];
    successCount?: number;
    failureCount?: number;
    errorMessage?: string;
}
/**
 * Hook to track boot sequence progress
 *
 * Provides real-time updates via GraphQL subscription for boot sequence events.
 * Tracks progress through dependency layers during system startup.
 *
 * @returns Boot sequence progress data, loading state, error, and latest event
 *
 * @example
 * ```tsx
 * // Monitor boot sequence progress
 * const { progress, latestEvent, loading, error } = useBootSequenceProgress();
 *
 * if (progress?.inProgress) {
 *   console.log(`Boot sequence: Layer ${progress.currentLayer}/${progress.totalLayers}`);
 *   console.log(`Started: ${progress.startedInstances.length}`);
 *   console.log(`Failed: ${progress.failedInstances.length}`);
 *   console.log(`Remaining: ${progress.remainingInstances.length}`);
 * }
 *
 * // Handle latest event
 * useEffect(() => {
 *   if (latestEvent?.type === 'INSTANCE_FAILED') {
 *     toast.error(`Instance failed: ${latestEvent.errorMessage}`);
 *   }
 * }, [latestEvent]);
 * ```
 */
export declare function useBootSequenceProgress(): {
    progress: BootSequenceProgress | undefined;
    latestEvent: BootSequenceEvent | null;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
//# sourceMappingURL=useBootSequenceProgress.d.ts.map