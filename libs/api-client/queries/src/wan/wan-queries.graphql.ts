import { gql } from '@apollo/client';

/**
 * GraphQL documents for WAN interface management
 * NAS-6.8: WAN Link Configuration
 */

// =============================================================================
// Fragments
// =============================================================================

/**
 * WAN Interface Core Fields Fragment
 */
export const WAN_INTERFACE_FIELDS = gql`
  fragment WANInterfaceFields on WANInterface {
    id
    interface {
      id
      name
      type
    }
    type
    status
    publicIP
    gateway
    health {
      status
      target
      latency
      packetLoss
      lastCheckTime
    }
    isDefaultRoute
    statistics {
      rxPackets
      txPackets
      rxBytes
      txBytes
      rxDrops
      txDrops
    }
  }
`;

/**
 * DHCP Client Fields Fragment
 */
export const DHCP_CLIENT_FIELDS = gql`
  fragment DhcpClientFields on DhcpClient {
    id
    interface
    disabled
    addDefaultRoute
    usePeerDNS
    usePeerNTP
    status
    address
    dhcpServer
    gateway
    expiresAfter
    comment
  }
`;

/**
 * PPPoE Client Fields Fragment
 */
export const PPPOE_CLIENT_FIELDS = gql`
  fragment PppoeClientFields on PppoeClient {
    id
    name
    interface
    disabled
    username
    serviceName
    addDefaultRoute
    usePeerDNS
    running
    mtu
    mru
    comment
  }
`;

/**
 * Static IP Config Fields Fragment
 */
export const STATIC_IP_CONFIG_FIELDS = gql`
  fragment StaticIPConfigFields on StaticIPConfig {
    id
    interface
    address
    gateway
    primaryDNS
    secondaryDNS
    comment
  }
`;

/**
 * LTE Modem Fields Fragment
 */
export const LTE_MODEM_FIELDS = gql`
  fragment LteModemFields on LteModem {
    id
    name
    apn
    signalStrength
    running
    operator
    networkType
    pinConfigured
    comment
  }
`;

// =============================================================================
// Queries
// =============================================================================

/**
 * Get list of WAN interfaces for a router
 */
export const GET_WAN_INTERFACES = gql`
  ${WAN_INTERFACE_FIELDS}
  ${DHCP_CLIENT_FIELDS}
  ${PPPOE_CLIENT_FIELDS}
  ${STATIC_IP_CONFIG_FIELDS}
  ${LTE_MODEM_FIELDS}

  query GetWANInterfaces($routerId: ID!) {
    wanInterfaces(routerId: $routerId) {
      ...WANInterfaceFields
      dhcpClient {
        ...DhcpClientFields
      }
      pppoeClient {
        ...PppoeClientFields
      }
      staticConfig {
        ...StaticIPConfigFields
      }
      lteModem {
        ...LteModemFields
      }
    }
  }
`;

/**
 * Get detailed information for a single WAN interface
 */
export const GET_WAN_INTERFACE = gql`
  ${WAN_INTERFACE_FIELDS}
  ${DHCP_CLIENT_FIELDS}
  ${PPPOE_CLIENT_FIELDS}
  ${STATIC_IP_CONFIG_FIELDS}
  ${LTE_MODEM_FIELDS}

  query GetWANInterface($routerId: ID!, $id: ID!) {
    wanInterface(routerId: $routerId, id: $id) {
      ...WANInterfaceFields
      dhcpClient {
        ...DhcpClientFields
      }
      pppoeClient {
        ...PppoeClientFields
      }
      staticConfig {
        ...StaticIPConfigFields
      }
      lteModem {
        ...LteModemFields
      }
    }
  }
`;

/**
 * Get connection history for a WAN interface
 */
export const GET_WAN_CONNECTION_HISTORY = gql`
  query GetWANConnectionHistory(
    $routerId: ID!
    $wanInterfaceId: ID!
    $pagination: PaginationInput
  ) {
    wanConnectionHistory(
      routerId: $routerId
      wanInterfaceId: $wanInterfaceId
      pagination: $pagination
    ) {
      edges {
        node {
          id
          eventType
          timestamp
          publicIP
          gateway
          reason
          duration
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

// =============================================================================
// Mutations
// =============================================================================

/**
 * Configure DHCP client on a WAN interface
 */
export const CONFIGURE_DHCP_WAN = gql`
  ${WAN_INTERFACE_FIELDS}
  ${DHCP_CLIENT_FIELDS}

  mutation ConfigureDhcpWAN($routerId: ID!, $input: DhcpClientInput!) {
    configureDhcpWAN(routerId: $routerId, input: $input) {
      success
      wanInterface {
        ...WANInterfaceFields
        dhcpClient {
          ...DhcpClientFields
        }
      }
      errors {
        field
        message
      }
      validationWarnings {
        field
        message
      }
      previewCommands {
        path
        action
        params {
          key
          value
        }
      }
    }
  }
`;

/**
 * Configure PPPoE client on a WAN interface
 */
export const CONFIGURE_PPPOE_WAN = gql`
  ${WAN_INTERFACE_FIELDS}
  ${PPPOE_CLIENT_FIELDS}

  mutation ConfigurePppoeWAN($routerId: ID!, $input: PppoeClientInput!) {
    configurePppoeWAN(routerId: $routerId, input: $input) {
      success
      wanInterface {
        ...WANInterfaceFields
        pppoeClient {
          ...PppoeClientFields
        }
      }
      errors {
        field
        message
      }
      validationWarnings {
        field
        message
      }
      previewCommands {
        path
        action
        params {
          key
          value
        }
      }
    }
  }
`;

/**
 * Configure static IP on a WAN interface
 */
export const CONFIGURE_STATIC_WAN = gql`
  ${WAN_INTERFACE_FIELDS}
  ${STATIC_IP_CONFIG_FIELDS}

  mutation ConfigureStaticWAN($routerId: ID!, $input: StaticIPInput!) {
    configureStaticWAN(routerId: $routerId, input: $input) {
      success
      wanInterface {
        ...WANInterfaceFields
        staticConfig {
          ...StaticIPConfigFields
        }
      }
      errors {
        field
        message
      }
      validationWarnings {
        field
        message
      }
      previewCommands {
        path
        action
        params {
          key
          value
        }
      }
    }
  }
`;

/**
 * Configure LTE modem
 */
export const CONFIGURE_LTE_WAN = gql`
  ${WAN_INTERFACE_FIELDS}
  ${LTE_MODEM_FIELDS}

  mutation ConfigureLteWAN($routerId: ID!, $input: LteModemInput!) {
    configureLteWAN(routerId: $routerId, input: $input) {
      success
      wanInterface {
        ...WANInterfaceFields
        lteModem {
          ...LteModemFields
        }
      }
      errors {
        field
        message
      }
      validationWarnings {
        field
        message
      }
      previewCommands {
        path
        action
        params {
          key
          value
        }
      }
    }
  }
`;

/**
 * Configure health check for a WAN interface
 */
export const CONFIGURE_WAN_HEALTH_CHECK = gql`
  mutation ConfigureWANHealthCheck(
    $routerId: ID!
    $wanInterfaceId: ID!
    $input: WANHealthCheckInput!
  ) {
    configureWANHealthCheck(
      routerId: $routerId
      wanInterfaceId: $wanInterfaceId
      input: $input
    ) {
      success
      wanInterface {
        id
        health {
          status
          target
          latency
          packetLoss
          enabled
          interval
          lastCheckTime
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

/**
 * Delete WAN configuration (revert to unconfigured)
 */
export const DELETE_WAN_CONFIGURATION = gql`
  mutation DeleteWANConfiguration($routerId: ID!, $wanInterfaceId: ID!) {
    deleteWANConfiguration(routerId: $routerId, wanInterfaceId: $wanInterfaceId) {
      success
      message
      deletedId
    }
  }
`;

// =============================================================================
// Subscriptions
// =============================================================================

/**
 * Subscribe to WAN status changes
 */
export const WAN_STATUS_CHANGED = gql`
  ${WAN_INTERFACE_FIELDS}

  subscription WANStatusChanged($routerId: ID!, $wanInterfaceId: ID) {
    wanStatusChanged(routerId: $routerId, wanInterfaceId: $wanInterfaceId) {
      ...WANInterfaceFields
    }
  }
`;

/**
 * Subscribe to WAN health status changes
 */
export const WAN_HEALTH_CHANGED = gql`
  subscription WANHealthChanged($routerId: ID!, $wanInterfaceId: ID!) {
    wanHealthChanged(routerId: $routerId, wanInterfaceId: $wanInterfaceId) {
      status
      target
      latency
      packetLoss
      lastCheckTime
      consecutiveFailures
      consecutiveSuccesses
    }
  }
`;
