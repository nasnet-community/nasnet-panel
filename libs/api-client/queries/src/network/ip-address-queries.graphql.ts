import { gql } from '@apollo/client';

/**
 * GraphQL documents for IP address management
 * NAS-6.2: IP Address Management
 */

// =============================================================================
// Queries
// =============================================================================

/**
 * Get list of IP addresses with optional interface filtering
 */
export const GET_IP_ADDRESSES = gql`
  query GetIpAddresses($routerId: ID!, $interfaceId: ID) {
    ipAddresses(routerId: $routerId, interfaceId: $interfaceId) {
      id
      address
      network
      broadcast
      interface {
        id
        name
        type
      }
      disabled
      dynamic
      invalid
      comment
    }
  }
`;

/**
 * Get detailed information for a single IP address
 */
export const GET_IP_ADDRESS = gql`
  query GetIpAddress($routerId: ID!, $id: ID!) {
    ipAddress(routerId: $routerId, id: $id) {
      id
      address
      network
      broadcast
      interface {
        id
        name
        type
      }
      disabled
      dynamic
      invalid
      comment
    }
  }
`;

/**
 * Check if an IP address would conflict with existing addresses
 */
export const CHECK_IP_CONFLICT = gql`
  query CheckIpConflict($routerId: ID!, $address: String!, $interfaceId: ID, $excludeId: ID) {
    checkIpConflict(
      routerId: $routerId
      address: $address
      interfaceId: $interfaceId
      excludeId: $excludeId
    ) {
      hasConflict
      conflictType
      conflictingAddress {
        id
        address
        interface {
          id
          name
        }
      }
      message
    }
  }
`;

/**
 * Get dependencies for an IP address (DHCP servers, routes, NAT/firewall rules)
 */
export const GET_IP_ADDRESS_DEPENDENCIES = gql`
  query GetIpAddressDependencies($routerId: ID!, $id: ID!) {
    ipAddressDependencies(routerId: $routerId, id: $id) {
      canDelete
      dhcpServers {
        id
        name
        network
      }
      routes {
        id
        destination
        gateway
      }
      natRules {
        id
        chain
        action
      }
      firewallRules {
        id
        chain
        action
      }
      warningMessage
    }
  }
`;

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new IP address on an interface
 */
export const CREATE_IP_ADDRESS = gql`
  mutation CreateIpAddress($routerId: ID!, $input: IpAddressInput!) {
    createIpAddress(routerId: $routerId, input: $input) {
      ipAddress {
        id
        address
        network
        broadcast
        interface {
          id
          name
          type
        }
        disabled
        dynamic
        invalid
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
 * Update an existing IP address
 */
export const UPDATE_IP_ADDRESS = gql`
  mutation UpdateIpAddress($routerId: ID!, $id: ID!, $input: IpAddressInput!) {
    updateIpAddress(routerId: $routerId, id: $id, input: $input) {
      ipAddress {
        id
        address
        network
        broadcast
        interface {
          id
          name
          type
        }
        disabled
        dynamic
        invalid
        comment
      }
      errors {
        code
        message
        field
      }
      validationWarnings {
        field
        message
        severity
      }
      impactAnalysis {
        affectedResources
        severity
        description
      }
    }
  }
`;

/**
 * Delete an IP address
 */
export const DELETE_IP_ADDRESS = gql`
  mutation DeleteIpAddress($routerId: ID!, $id: ID!) {
    deleteIpAddress(routerId: $routerId, id: $id) {
      success
      deletedId
      errors {
        code
        message
        field
      }
      dependencies {
        canDelete
        dhcpServers {
          id
          name
          network
        }
        routes {
          id
          destination
          gateway
        }
        natRules {
          id
          chain
          action
        }
        firewallRules {
          id
          chain
          action
        }
        warningMessage
      }
    }
  }
`;

// =============================================================================
// Subscriptions
// =============================================================================

/**
 * Subscribe to IP address changes for real-time updates
 */
export const IP_ADDRESS_CHANGED = gql`
  subscription IpAddressChanged($routerId: ID!) {
    ipAddressChanged(routerId: $routerId) {
      ipAddressId
      address
      interface {
        id
        name
      }
      changeType
      timestamp
    }
  }
`;
