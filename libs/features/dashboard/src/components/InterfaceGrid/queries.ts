/**
 * Interface Grid GraphQL Queries and Subscriptions
 *
 * This module defines GraphQL operations for fetching and subscribing
 * to interface data from the router.
 */

import { gql } from '@apollo/client';

/**
 * GraphQL fragment for interface fields.
 *
 * @description
 * Shared field selection for Interface type. Ensures consistency
 * across queries and subscriptions. Includes real-time status,
 * traffic metrics, and hardware information.
 *
 * Fields included:
 * - Basic: id, name, type, comment
 * - Status: status, running, lastSeen
 * - Network: ip, mac, mtu
 * - Traffic: txRate, rxRate, linkSpeed
 * - Relations: usedBy, linkPartner
 */
export const INTERFACE_FIELDS = gql`
  fragment InterfaceFields on Interface {
    id
    name
    type
    status
    ip
    mac
    mtu
    running
    txRate
    rxRate
    linkSpeed
    comment
    lastSeen
    usedBy
    linkPartner
  }
`;

/**
 * GraphQL query to fetch all interfaces for a device.
 *
 * @description
 * Retrieves the complete interface list from the device.
 * Used as fallback when subscription is not available or for initial load.
 * Cached by Apollo Client (stableTime: 10s per architecture).
 *
 * Variables: deviceId (ID!) - UUID of the target device
 */
export const GET_INTERFACES = gql`
  query GetInterfaces($deviceId: ID!) {
    device(id: $deviceId) {
      id
      interfaces {
        ...InterfaceFields
      }
    }
  }
  ${INTERFACE_FIELDS}
`;

/**
 * GraphQL subscription for real-time interface status updates.
 *
 * @description
 * WebSocket subscription for live interface changes.
 * Returns the full list of interfaces on each update.
 * Priority: NORMAL (within 5 seconds) per GraphQL architecture.
 *
 * Variables: deviceId (ID!) - UUID of the target device
 * Update frequency: On any interface status/traffic change
 */
export const INTERFACE_STATUS_SUBSCRIPTION = gql`
  subscription OnInterfaceStatusChanged($deviceId: ID!) {
    interfaceStatusChanged(deviceId: $deviceId) {
      ...InterfaceFields
    }
  }
  ${INTERFACE_FIELDS}
`;
