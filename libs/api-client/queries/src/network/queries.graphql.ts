import { gql } from '@apollo/client';

/**
 * GraphQL documents for network interface management
 * NAS-6.1: Interface List and Configuration
 */

// =============================================================================
// Queries
// =============================================================================

/**
 * Get list of interfaces with optional type filtering and pagination
 */
export const GET_INTERFACES = gql`
  query GetInterfaces($routerId: ID!, $type: InterfaceType, $pagination: PaginationInput) {
    interfaces(routerId: $routerId, type: $type, pagination: $pagination) {
      edges {
        node {
          id
          name
          type
          status
          enabled
          running
          macAddress
          mtu
          ip
          txBytes
          rxBytes
          linkSpeed
          comment
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

/**
 * Get detailed information for a single interface
 */
export const GET_INTERFACE = gql`
  query GetInterface($routerId: ID!, $id: ID!) {
    interface(routerId: $routerId, id: $id) {
      id
      name
      type
      status
      enabled
      running
      macAddress
      mtu
      comment
      ip
      txBytes
      rxBytes
      txRate
      rxRate
      linkSpeed
      linkPartner
      usedBy
    }
  }
`;

// =============================================================================
// Mutations
// =============================================================================

/**
 * Update interface settings (MTU, comment, enabled state)
 */
export const UPDATE_INTERFACE = gql`
  mutation UpdateInterface($routerId: ID!, $interfaceId: ID!, $input: UpdateInterfaceInput!) {
    updateInterface(routerId: $routerId, interfaceId: $interfaceId, input: $input) {
      interface {
        id
        name
        enabled
        running
        status
        mtu
        comment
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
 * Enable a disabled interface
 */
export const ENABLE_INTERFACE = gql`
  mutation EnableInterface($routerId: ID!, $interfaceId: ID!) {
    enableInterface(routerId: $routerId, interfaceId: $interfaceId) {
      interface {
        id
        name
        enabled
        running
        status
      }
      errors {
        code
        message
      }
    }
  }
`;

/**
 * Disable an active interface
 */
export const DISABLE_INTERFACE = gql`
  mutation DisableInterface($routerId: ID!, $interfaceId: ID!) {
    disableInterface(routerId: $routerId, interfaceId: $interfaceId) {
      interface {
        id
        name
        enabled
        running
        status
      }
      errors {
        code
        message
      }
    }
  }
`;

/**
 * Perform batch operations on multiple interfaces
 */
export const BATCH_INTERFACE_OPERATION = gql`
  mutation BatchInterfaceOperation($routerId: ID!, $input: BatchInterfaceInput!) {
    batchInterfaceOperation(routerId: $routerId, input: $input) {
      succeeded {
        id
        name
        enabled
        running
        status
      }
      failed {
        interfaceId
        interfaceName
        error
      }
      errors {
        code
        message
      }
    }
  }
`;

// =============================================================================
// Subscriptions
// =============================================================================

/**
 * Subscribe to interface status changes for real-time updates
 */
export const INTERFACE_STATUS_CHANGED = gql`
  subscription InterfaceStatusChanged($routerId: ID!, $interfaceId: ID) {
    interfaceStatusChanged(routerId: $routerId, interfaceId: $interfaceId) {
      interfaceId
      interfaceName
      status
      previousStatus
      timestamp
    }
  }
`;
