/**
 * useBulkOperations Hook
 * Provides bulk DHCP lease operations (make static, delete) with partial failure handling
 *
 * Story: NAS-6.11 - DHCP Lease Management
 *
 * @module libs/features/network/src/dhcp/hooks/useBulkOperations
 */

import { useMakeLeaseStatic, useDeleteLease } from '@nasnet/api-client/queries';
import type { DHCPLease } from '@nasnet/core/types';
import { useDHCPUIStore } from '@nasnet/state/stores';
import { toast } from '@nasnet/ui/primitives';

/**
 * Result of bulk operation execution
 */
export interface BulkOperationResult {
  /** Number of successful operations */
  succeeded: number;
  /** Number of failed operations */
  failed: number;
  /** Total operations attempted */
  total: number;
}

/**
 * Return type for bulk operations hook
 */
export interface UseBulkOperationsReturn {
  /** Convert multiple leases to static bindings */
  makeAllStatic: (leaseIds: string[], leases: DHCPLease[]) => Promise<BulkOperationResult>;

  /** Delete multiple leases */
  deleteMultiple: (leaseIds: string[]) => Promise<BulkOperationResult>;

  /** Whether bulk make static operation is in progress */
  isMakingStatic: boolean;

  /** Whether bulk delete operation is in progress */
  isDeleting: boolean;
}

/**
 * Hook for bulk DHCP lease operations
 * @description Executes parallel mutations with partial failure handling, showing detailed toast feedback
 *
 * Features:
 * - Uses Promise.allSettled() for parallel execution with partial failure handling
 * - Displays detailed toast notifications (success count, failure count)
 * - Auto-clears selection after operations complete
 * - Tracks loading state for each operation type
 * - Loops existing single-item mutations (no new backend endpoints required)
 *
 * Pattern:
 * - Executes all mutations in parallel using Promise.allSettled()
 * - Counts fulfilled vs rejected promises
 * - Shows appropriate toast based on results (all success, partial failure, all failure)
 * - Clears selection state from store after completion
 *
 * @param routerIp - Target router IP address
 * @returns Bulk operation functions and loading states
 *
 * @example
 * ```tsx
 * function LeaseTable({ routerIp, leases }: Props) {
 *   const { selectedLeases } = useDHCPUIStore();
 *   const { makeAllStatic, deleteMultiple, isMakingStatic } = useBulkOperations(routerIp);
 *
 *   const handleBulkMakeStatic = async () => {
 *     const result = await makeAllStatic(selectedLeases, leases);
 *     console.log(`${result.succeeded} succeeded, ${result.failed} failed`);
 *   };
 *
 *   return (
 *     <Button onClick={handleBulkMakeStatic} loading={isMakingStatic}>
 *       Make Static ({selectedLeases.length})
 *     </Button>
 *   );
 * }
 * ```
 */
export function useBulkOperations(routerIp: string): UseBulkOperationsReturn {
  const makeStaticMutation = useMakeLeaseStatic(routerIp);
  const deleteMutation = useDeleteLease(routerIp);
  const { clearLeaseSelection } = useDHCPUIStore();

  /**
   * Convert multiple leases to static bindings
   *
   * @param leaseIds - Array of lease IDs to convert
   * @param leases - Full array of leases (to lookup lease details)
   * @returns Result with success/failure counts
   */
  const makeAllStatic = async (
    leaseIds: string[],
    leases: DHCPLease[]
  ): Promise<BulkOperationResult> => {
    // Execute all mutations in parallel
    const results = await Promise.allSettled(
      leaseIds.map((id) => {
        const lease = leases.find((l) => l.id === id);
        if (!lease) {
          return Promise.reject(new Error(`Lease ${id} not found`));
        }

        return makeStaticMutation.mutateAsync({
          leaseId: id,
          address: lease.address,
          macAddress: lease.macAddress,
          hostname: lease.hostname,
        });
      })
    );

    // Count successes and failures
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    const total = leaseIds.length;

    // Display appropriate toast notification with actionable messages
    if (failed === 0) {
      // All succeeded
      toast({
        title: 'Leases converted to static',
        description: `Successfully converted ${succeeded} lease${succeeded !== 1 ? 's' : ''} to static bindings. They will persist across DHCP server restarts.`,
      });
    } else if (succeeded === 0) {
      // All failed
      toast({
        variant: 'destructive',
        title: 'Failed to convert leases to static',
        description: `All ${failed} operation${failed !== 1 ? 's' : ''} failed. Verify leases exist and router is accessible, then retry.`,
      });
    } else {
      // Partial failure
      toast({
        variant: 'warning',
        title: 'Partial failure',
        description: `${succeeded} succeeded, ${failed} failed. Retry failed leases or check router connectivity.`,
      });
    }

    // Clear selection after operation completes
    clearLeaseSelection();

    return { succeeded, failed, total };
  };

  /**
   * Delete multiple leases
   *
   * @param leaseIds - Array of lease IDs to delete
   * @returns Result with success/failure counts
   */
  const deleteMultiple = async (leaseIds: string[]): Promise<BulkOperationResult> => {
    // Execute all mutations in parallel
    const results = await Promise.allSettled(leaseIds.map((id) => deleteMutation.mutateAsync(id)));

    // Count successes and failures
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    const total = leaseIds.length;

    // Display appropriate toast notification with actionable messages
    if (failed === 0) {
      // All succeeded
      toast({
        title: 'Leases deleted',
        description: `Successfully deleted ${succeeded} lease${succeeded !== 1 ? 's' : ''}. Use Undo if deleted by mistake (10s window).`,
      });
    } else if (succeeded === 0) {
      // All failed
      toast({
        variant: 'destructive',
        title: 'Failed to delete leases',
        description: `All ${failed} operation${failed !== 1 ? 's' : ''} failed. Verify leases are not in use and retry.`,
      });
    } else {
      // Partial failure
      toast({
        variant: 'warning',
        title: 'Partial failure',
        description: `${succeeded} deleted, ${failed} failed. Retry remaining leases or verify router connectivity.`,
      });
    }

    // Clear selection after operation completes
    clearLeaseSelection();

    return { succeeded, failed, total };
  };

  return {
    makeAllStatic,
    deleteMultiple,
    isMakingStatic: makeStaticMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
