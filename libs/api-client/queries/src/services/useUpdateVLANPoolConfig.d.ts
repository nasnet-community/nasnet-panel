import type { VLANPoolStatus } from './useVLANPoolStatus';
/**
 * Input for updating VLAN pool configuration
 */
export interface UpdateVLANPoolConfigInput {
  poolStart: number;
  poolEnd: number;
}
/**
 * Hook to update VLAN pool configuration
 *
 * Changes the allocatable VLAN range. The new configuration is persisted to
 * GlobalSettings and will be used for all future allocations.
 *
 * Validation:
 * - poolStart must be >= 1 (minimum valid VLAN ID)
 * - poolEnd must be <= 4094 (maximum valid VLAN ID per IEEE 802.1Q)
 * - poolStart must be <= poolEnd
 * - No existing allocations can fall outside the new range
 *
 * @returns Mutation function, loading state, error, and updated pool status
 *
 * @example
 * ```tsx
 * const { updatePoolConfig, loading, poolStatus, error } = useUpdateVLANPoolConfig();
 *
 * const handleSubmit = async (values: { poolStart: number; poolEnd: number }) => {
 *   try {
 *     await updatePoolConfig(values);
 *     console.log('Pool config updated:', poolStatus);
 *   } catch (error) {
 *     console.error('Update failed:', error);
 *   }
 * };
 * ```
 */
export declare function useUpdateVLANPoolConfig(): {
  updatePoolConfig: (input: UpdateVLANPoolConfigInput) => Promise<VLANPoolStatus>;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  poolStatus: VLANPoolStatus | undefined;
};
//# sourceMappingURL=useUpdateVLANPoolConfig.d.ts.map
