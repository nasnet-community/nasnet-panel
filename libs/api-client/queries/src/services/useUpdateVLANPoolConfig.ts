import { useMutation } from '@apollo/client';
import { UPDATE_VLAN_POOL_CONFIG, GET_VLAN_POOL_STATUS } from './vlan.graphql';
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
export function useUpdateVLANPoolConfig() {
  const [updateMutation, { data, loading, error }] = useMutation(UPDATE_VLAN_POOL_CONFIG, {
    // Refetch pool status after update to ensure consistency
    refetchQueries: [GET_VLAN_POOL_STATUS],
    // Wait for refetch to complete before resolving
    awaitRefetchQueries: true,
  });

  /**
   * Execute pool config update
   * @param input - Pool configuration (poolStart and poolEnd)
   * @returns Promise resolving to the updated pool status
   */
  const updatePoolConfig = async (input: UpdateVLANPoolConfigInput): Promise<VLANPoolStatus> => {
    const result = await updateMutation({ variables: input });
    if (!result.data?.updateVLANPoolConfig) {
      throw new Error('Failed to update VLAN pool configuration');
    }
    return result.data.updateVLANPoolConfig;
  };

  const poolStatus = data?.updateVLANPoolConfig as VLANPoolStatus | undefined;

  return {
    updatePoolConfig,
    loading,
    error,
    poolStatus,
  };
}
