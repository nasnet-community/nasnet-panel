/**
 * WAN Interface Management API Queries and Mutations
 * NAS-6.8: WAN Link Configuration
 *
 * @module @nasnet/api-client/queries/wan
 */

// GraphQL documents
export {
  // Fragments
  WAN_INTERFACE_FIELDS,
  DHCP_CLIENT_FIELDS,
  PPPOE_CLIENT_FIELDS,
  STATIC_IP_CONFIG_FIELDS,
  LTE_MODEM_FIELDS,

  // Queries
  GET_WAN_INTERFACES,
  GET_WAN_INTERFACE,
  GET_WAN_CONNECTION_HISTORY,

  // Mutations
  CONFIGURE_DHCP_WAN,
  CONFIGURE_PPPOE_WAN,
  CONFIGURE_STATIC_WAN,
  CONFIGURE_LTE_WAN,
  CONFIGURE_WAN_HEALTH_CHECK,
  DELETE_WAN_CONFIGURATION,

  // Subscriptions
  WAN_STATUS_CHANGED,
  WAN_HEALTH_CHANGED,
} from './wan-queries.graphql';

// Mutation hooks
export {
  useConfigureDhcpWAN,
  useConfigurePppoeWAN,
  useConfigureStaticWAN,
  useConfigureLteWAN,
  useConfigureWANHealthCheck,
  useDeleteWANConfiguration,
} from './useWANMutations';
