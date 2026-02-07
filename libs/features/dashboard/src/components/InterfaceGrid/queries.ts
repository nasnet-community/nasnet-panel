/**
 * Interface Grid GraphQL Queries and Subscriptions
 *
 * This module defines GraphQL operations for fetching and subscribing
 * to interface data from the router.
 */

import { gql } from '@apollo/client';

/**
 * Fragment for interface fields to ensure consistency.
 * Includes all fields needed for dashboard display.
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
 * Query to fetch all interfaces for a device.
 * Used as fallback when subscription is not available or for initial load.
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
 * Subscription for real-time interface status updates.
 * Returns the full list of interfaces on each update.
 * Priority: NORMAL (within 5 seconds) per GraphQL architecture decisions.
 */
export const INTERFACE_STATUS_SUBSCRIPTION = gql`
  subscription OnInterfaceStatusChanged($deviceId: ID!) {
    interfaceStatusChanged(deviceId: $deviceId) {
      ...InterfaceFields
    }
  }
  ${INTERFACE_FIELDS}
`;
