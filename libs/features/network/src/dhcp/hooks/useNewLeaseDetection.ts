/**
 * useNewLeaseDetection Hook
 * Tracks new DHCP leases and provides auto-fading "New" badge indicator
 *
 * Story: NAS-6.11 - DHCP Lease Management
 *
 * @module libs/features/network/src/dhcp/hooks/useNewLeaseDetection
 */

import { useEffect, useRef, useState } from 'react';
import type { DHCPLease } from '@nasnet/core/types';

/**
 * Return type for new lease detection hook
 */
export interface UseNewLeaseDetectionReturn {
  /** Set of lease IDs that are newly detected (auto-fades after 5s) */
  newLeaseIds: Set<string>;
}

/**
 * Hook to detect and track new DHCP leases with auto-fade functionality
 *
 * Features:
 * - Detects new leases by comparing previous vs current lease IDs
 * - Auto-fades "New" badge after 5 seconds
 * - Uses useRef to track previous state without causing re-renders
 * - Handles lease ID changes gracefully (additions/removals)
 *
 * Usage:
 * ```tsx
 * const { newLeaseIds } = useNewLeaseDetection(leases);
 * const isNew = newLeaseIds.has(lease.id);
 * ```
 *
 * @param leases - Array of DHCP leases to monitor
 * @returns Object containing Set of new lease IDs
 *
 * @example
 * ```tsx
 * function LeaseTable({ leases }: { leases: DHCPLease[] }) {
 *   const { newLeaseIds } = useNewLeaseDetection(leases);
 *
 *   return (
 *     <table>
 *       {leases.map(lease => (
 *         <tr key={lease.id}>
 *           <td>{lease.address}</td>
 *           {newLeaseIds.has(lease.id) && (
 *             <Badge variant="info" className="animate-pulse">New</Badge>
 *           )}
 *         </tr>
 *       ))}
 *     </table>
 *   );
 * }
 * ```
 */
export function useNewLeaseDetection(
  leases: DHCPLease[]
): UseNewLeaseDetectionReturn {
  // Track previous lease IDs without triggering re-renders
  const prevLeaseIdsRef = useRef<Set<string>>(new Set());

  // State for new lease IDs (triggers re-render for UI updates)
  const [newLeaseIds, setNewLeaseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Extract current lease IDs
    const currentIds = new Set(leases.map((lease) => lease.id));

    // Detect new IDs (present in current but not in previous)
    const newIds = new Set<string>();
    currentIds.forEach((id) => {
      if (!prevLeaseIdsRef.current.has(id)) {
        newIds.add(id);
      }
    });

    // If new leases detected, add to state and schedule auto-fade
    if (newIds.size > 0) {
      setNewLeaseIds((prev) => {
        const updated = new Set(prev);
        newIds.forEach((id) => updated.add(id));
        return updated;
      });

      // Auto-fade: Remove "New" badge after 5 seconds
      const fadeTimeout = setTimeout(() => {
        setNewLeaseIds((prev) => {
          const updated = new Set(prev);
          newIds.forEach((id) => updated.delete(id));
          return updated;
        });
      }, 5000);

      // Cleanup timeout on unmount or next effect run
      return () => clearTimeout(fadeTimeout);
    }

    // Update ref for next comparison
    prevLeaseIdsRef.current = currentIds;
  }, [leases]);

  return { newLeaseIds };
}
