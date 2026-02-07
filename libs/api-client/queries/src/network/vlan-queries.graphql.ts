import { gql } from '@apollo/client';

/**
 * GraphQL queries, mutations, and subscriptions for VLAN management (NAS-6.7)
 * Following NasNetConnect's GraphQL patterns
 */

// ===========================================================================
// Queries
// ===========================================================================

/**
 * Query to fetch all VLANs for a router with optional filtering
 */
export const GET_VLANS = gql`
  query GetVlans($routerId: ID!, $filter: VlanFilter) {
    vlans(routerId: $routerId, filter: $filter) {
      id
      name
      vlanId
      interface {
        id
        name
        type
      }
      mtu
      comment
      disabled
      running
    }
  }
`;

/**
 * Query to fetch a single VLAN by ID
 */
export const GET_VLAN = gql`
  query GetVlan($routerId: ID!, $id: ID!) {
    vlan(routerId: $routerId, id: $id) {
      id
      name
      vlanId
      interface {
        id
        name
        type
      }
      mtu
      comment
      disabled
      running
    }
  }
`;

/**
 * Query to check if a VLAN ID is available on a specific parent interface
 * Used during form validation to prevent duplicate VLAN IDs
 */
export const CHECK_VLAN_ID_AVAILABLE = gql`
  query CheckVlanIdAvailable(
    $routerId: ID!
    $vlanId: Int!
    $parentInterfaceId: ID!
    $excludeId: ID
  ) {
    checkVlanIdAvailable(
      routerId: $routerId
      vlanId: $vlanId
      parentInterfaceId: $parentInterfaceId
      excludeId: $excludeId
    )
  }
`;

// ===========================================================================
// Mutations
// ===========================================================================

/**
 * Mutation to create a new VLAN interface
 */
export const CREATE_VLAN = gql`
  mutation CreateVlan($routerId: ID!, $input: VlanInput!) {
    createVlan(routerId: $routerId, input: $input) {
      vlan {
        id
        name
        vlanId
        interface {
          id
          name
          type
        }
        mtu
        comment
        disabled
        running
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

/**
 * Mutation to update an existing VLAN interface
 */
export const UPDATE_VLAN = gql`
  mutation UpdateVlan($routerId: ID!, $id: ID!, $input: VlanInput!) {
    updateVlan(routerId: $routerId, id: $id, input: $input) {
      vlan {
        id
        name
        vlanId
        interface {
          id
          name
          type
        }
        mtu
        comment
        disabled
        running
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

/**
 * Mutation to delete a VLAN interface
 */
export const DELETE_VLAN = gql`
  mutation DeleteVlan($routerId: ID!, $id: ID!) {
    deleteVlan(routerId: $routerId, id: $id) {
      success
      deletedId
      errors {
        code
        message
        field
      }
    }
  }
`;

/**
 * Mutation to configure a bridge port for VLAN access or trunk mode
 */
export const CONFIGURE_VLAN_PORT = gql`
  mutation ConfigureVlanPort($routerId: ID!, $portId: ID!, $config: VlanPortConfig!) {
    configureVlanPort(routerId: $routerId, portId: $portId, config: $config) {
      success
      message
      errors {
        code
        message
        field
      }
    }
  }
`;

// ===========================================================================
// Subscriptions
// ===========================================================================

/**
 * Subscription for real-time VLAN change events
 * Notifies when VLANs are created, updated, or deleted
 */
export const VLAN_CHANGED = gql`
  subscription VlanChanged($routerId: ID!) {
    vlanChanged(routerId: $routerId) {
      vlan {
        id
        name
        vlanId
        interface {
          id
          name
          type
        }
        mtu
        comment
        disabled
        running
      }
      changeType
      timestamp
    }
  }
`;
