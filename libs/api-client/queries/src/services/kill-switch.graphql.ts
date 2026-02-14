/**
 * GraphQL documents for Kill Switch (NAS-8.14)
 *
 * Queries, mutations, and subscriptions for managing kill switch functionality.
 * Kill switch blocks traffic when a service instance becomes unhealthy.
 */

import { gql } from '@apollo/client';

/**
 * Query: Get kill switch status for a device
 *
 * Returns the current kill switch configuration and state:
 * - Enabled/disabled status
 * - Current mode (block_all, allow_direct, fallback_service)
 * - Active state (whether traffic is currently being blocked)
 * - Activation history (counts, timestamps, reasons)
 *
 * @param routerID - Router ID
 * @param deviceID - Device ID to check kill switch status for
 */
export const GET_KILL_SWITCH_STATUS = gql`
  query GetKillSwitchStatus($routerID: ID!, $deviceID: String!) {
    killSwitchStatus(routerID: $routerID, deviceID: $deviceID) {
      enabled
      mode
      active
      fallbackInterfaceID
      lastActivatedAt
      lastDeactivatedAt
      lastActivationReason
      activationCount
    }
  }
`;

/**
 * Mutation: Set kill switch configuration for a device
 *
 * Configures the kill switch for a device routing. This:
 * 1. Updates the device routing record with kill switch settings
 * 2. Creates MikroTik filter rules to block traffic when service is unhealthy
 * 3. Returns the updated device routing with kill switch fields
 *
 * @param input - Kill switch configuration input
 */
export const SET_KILL_SWITCH = gql`
  mutation SetKillSwitch($input: SetKillSwitchInput!) {
    setKillSwitch(input: $input) {
      id
      deviceID
      macAddress
      deviceIP
      deviceName
      instanceID
      interfaceID
      routingMode
      routingMark
      mangleRuleID
      active
      killSwitchEnabled
      killSwitchMode
      killSwitchActive
      killSwitchActivatedAt
      killSwitchFallbackInterfaceID
      killSwitchRuleID
      createdAt
      updatedAt
    }
  }
`;

/**
 * Subscription: Real-time kill switch changes
 *
 * Subscribes to kill switch events for a router:
 * - activated: Kill switch triggered (service became unhealthy)
 * - deactivated: Kill switch released (service recovered)
 * - configured: Kill switch settings changed
 *
 * @param routerID - Router ID to subscribe to
 */
export const SUBSCRIBE_KILL_SWITCH_CHANGES = gql`
  subscription KillSwitchChanged($routerID: ID!) {
    killSwitchChanged(routerID: $routerID) {
      id
      eventType
      routerID
      timestamp
      routing {
        id
        deviceID
        macAddress
        deviceIP
        deviceName
        instanceID
        interfaceID
        routingMode
        routingMark
        mangleRuleID
        active
        killSwitchEnabled
        killSwitchMode
        killSwitchActive
        killSwitchActivatedAt
        killSwitchFallbackInterfaceID
        killSwitchRuleID
        createdAt
        updatedAt
      }
    }
  }
`;
