import { gql } from '@apollo/client';

/**
 * GraphQL documents for VLAN Auto-Allocation & Pool Management
 * Story NAS-8.18: Virtual Interface Factory VLAN management
 */

// =============================================================================
// Queries
// =============================================================================

/**
 * List all VLAN allocations with optional filtering
 */
export const GET_VLAN_ALLOCATIONS = gql`
  query GetVLANAllocations($routerID: String, $status: VLANAllocationStatus) {
    vlanAllocations(routerID: $routerID, status: $status) {
      id
      routerID
      vlanID
      instanceID
      serviceType
      subnet
      status
      allocatedAt
      releasedAt
      router {
        id
        address
        name
      }
      serviceInstance {
        id
        featureID
        instanceName
        status
      }
    }
  }
`;

/**
 * Get VLAN pool status for a router
 */
export const GET_VLAN_POOL_STATUS = gql`
  query GetVLANPoolStatus($routerID: String!) {
    vlanPoolStatus(routerID: $routerID) {
      routerID
      totalVLANs
      allocatedVLANs
      availableVLANs
      utilization
      shouldWarn
      poolStart
      poolEnd
    }
  }
`;

/**
 * Detect orphaned VLAN allocations for a router (diagnostic query)
 */
export const DETECT_ORPHANED_VLANS = gql`
  query DetectOrphanedVLANs($routerID: String!) {
    detectOrphanedVLANs(routerID: $routerID) {
      id
      routerID
      vlanID
      instanceID
      serviceType
      subnet
      status
      allocatedAt
      releasedAt
    }
  }
`;

// =============================================================================
// Mutations
// =============================================================================

/**
 * Clean up orphaned VLAN allocations for a router
 */
export const CLEANUP_ORPHANED_VLANS = gql`
  mutation CleanupOrphanedVLANs($routerID: String!) {
    cleanupOrphanedVLANs(routerID: $routerID)
  }
`;

/**
 * Update VLAN pool configuration
 */
export const UPDATE_VLAN_POOL_CONFIG = gql`
  mutation UpdateVLANPoolConfig($poolStart: Int!, $poolEnd: Int!) {
    updateVLANPoolConfig(poolStart: $poolStart, poolEnd: $poolEnd) {
      routerID
      totalVLANs
      allocatedVLANs
      availableVLANs
      utilization
      shouldWarn
      poolStart
      poolEnd
    }
  }
`;
