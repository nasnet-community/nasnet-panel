import { gql } from '@apollo/client';

/**
 * GraphQL documents for bridge configuration management
 * NAS-6.6: Bridge Configuration
 */

// =============================================================================
// Queries
// =============================================================================

/**
 * Get list of bridges on a router
 */
export const GET_BRIDGES = gql`
  query GetBridges($routerId: ID!) {
    bridges(routerId: $routerId) {
      uuid
      name
      comment
      disabled
      running
      macAddress
      mtu
      protocol
      priority
      vlanFiltering
      pvid
    }
  }
`;

/**
 * Get detailed information for a single bridge including ports and VLANs
 */
export const GET_BRIDGE = gql`
  query GetBridge($uuid: ID!) {
    bridge(uuid: $uuid) {
      uuid
      name
      comment
      disabled
      running
      macAddress
      mtu
      protocol
      priority
      vlanFiltering
      pvid
      ports {
        uuid
        pvid
        frameTypes
        ingressFiltering
        taggedVlans
        untaggedVlans
        role
        state
        pathCost
        edge
      }
      vlans {
        uuid
        vlanId
      }
      stpStatus {
        rootBridge
        rootBridgeId
        rootPort
        rootPathCost
        topologyChangeCount
        lastTopologyChange
      }
    }
  }
`;

/**
 * Get bridge ports for a specific bridge
 */
export const GET_BRIDGE_PORTS = gql`
  query GetBridgePorts($bridgeId: ID!) {
    bridgePorts(bridgeId: $bridgeId) {
      uuid
      pvid
      frameTypes
      ingressFiltering
      taggedVlans
      untaggedVlans
      role
      state
      pathCost
      edge
    }
  }
`;

/**
 * Get bridge VLANs for a specific bridge
 */
export const GET_BRIDGE_VLANS = gql`
  query GetBridgeVlans($bridgeId: ID!) {
    bridgeVlans(bridgeId: $bridgeId) {
      uuid
      vlanId
    }
  }
`;

/**
 * Get interfaces available to add to a bridge (not in any bridge)
 */
export const GET_AVAILABLE_INTERFACES = gql`
  query GetAvailableInterfacesForBridge($routerId: ID!) {
    availableInterfacesForBridge(routerId: $routerId) {
      uuid
      name
      type
      macAddress
    }
  }
`;

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new bridge
 */
export const CREATE_BRIDGE = gql`
  mutation CreateBridge($routerId: ID!, $input: CreateBridgeInput!) {
    createBridge(routerId: $routerId, input: $input) {
      success
      bridge {
        uuid
        name
        comment
        disabled
        running
        macAddress
        mtu
        protocol
        priority
        vlanFiltering
        pvid
      }
      errors {
        code
        message
        field
      }
      previousState
      operationId
    }
  }
`;

/**
 * Update an existing bridge
 */
export const UPDATE_BRIDGE = gql`
  mutation UpdateBridge($uuid: ID!, $input: UpdateBridgeInput!) {
    updateBridge(uuid: $uuid, input: $input) {
      success
      bridge {
        uuid
        name
        comment
        disabled
        running
        macAddress
        mtu
        protocol
        priority
        vlanFiltering
        pvid
      }
      errors {
        code
        message
        field
      }
      previousState
      operationId
    }
  }
`;

/**
 * Delete a bridge
 */
export const DELETE_BRIDGE = gql`
  mutation DeleteBridge($uuid: ID!) {
    deleteBridge(uuid: $uuid) {
      success
      errors {
        code
        message
        field
      }
      operationId
    }
  }
`;

/**
 * Undo a bridge operation (within 10-second window)
 */
export const UNDO_BRIDGE_OPERATION = gql`
  mutation UndoBridgeOperation($operationId: ID!) {
    undoBridgeOperation(operationId: $operationId) {
      success
      bridge {
        uuid
        name
        comment
        disabled
        running
        macAddress
        mtu
        protocol
        priority
        vlanFiltering
        pvid
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
 * Add a port to a bridge
 */
export const ADD_BRIDGE_PORT = gql`
  mutation AddBridgePort($bridgeId: ID!, $input: AddBridgePortInput!) {
    addBridgePort(bridgeId: $bridgeId, input: $input) {
      success
      port {
        uuid
        pvid
        frameTypes
        ingressFiltering
        taggedVlans
        untaggedVlans
        role
        state
        pathCost
        edge
      }
      errors {
        code
        message
        field
      }
      previousState
      operationId
    }
  }
`;

/**
 * Update bridge port settings
 */
export const UPDATE_BRIDGE_PORT = gql`
  mutation UpdateBridgePort($portId: ID!, $input: UpdateBridgePortInput!) {
    updateBridgePort(portId: $portId, input: $input) {
      success
      port {
        uuid
        pvid
        frameTypes
        ingressFiltering
        taggedVlans
        untaggedVlans
        role
        state
        pathCost
        edge
      }
      errors {
        code
        message
        field
      }
      previousState
      operationId
    }
  }
`;

/**
 * Remove a port from a bridge
 */
export const REMOVE_BRIDGE_PORT = gql`
  mutation RemoveBridgePort($portId: ID!) {
    removeBridgePort(portId: $portId) {
      success
      errors {
        code
        message
        field
      }
      operationId
    }
  }
`;

/**
 * Create a bridge VLAN entry
 */
export const CREATE_BRIDGE_VLAN = gql`
  mutation CreateBridgeVlan($bridgeId: ID!, $input: CreateBridgeVlanInput!) {
    createBridgeVlan(bridgeId: $bridgeId, input: $input) {
      success
      vlan {
        uuid
        vlanId
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
 * Delete a bridge VLAN entry
 */
export const DELETE_BRIDGE_VLAN = gql`
  mutation DeleteBridgeVlan($uuid: ID!) {
    deleteBridgeVlan(uuid: $uuid) {
      success
      errors {
        code
        message
        field
      }
    }
  }
`;

// =============================================================================
// Subscriptions
// =============================================================================

/**
 * Subscribe to STP status changes for a bridge
 */
export const BRIDGE_STP_STATUS_CHANGED = gql`
  subscription BridgeStpStatusChanged($bridgeId: ID!) {
    bridgeStpStatusChanged(bridgeId: $bridgeId) {
      rootBridge
      rootBridgeId
      rootPort
      rootPathCost
      topologyChangeCount
      lastTopologyChange
    }
  }
`;

/**
 * Subscribe to bridge port changes
 */
export const BRIDGE_PORTS_CHANGED = gql`
  subscription BridgePortsChanged($bridgeId: ID!) {
    bridgePortsChanged(bridgeId: $bridgeId) {
      uuid
      pvid
      frameTypes
      ingressFiltering
      taggedVlans
      untaggedVlans
      role
      state
      pathCost
      edge
    }
  }
`;
