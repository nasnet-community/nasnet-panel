/**
 * WAN Interface Management API Queries and Mutations
 * NAS-6.8: WAN Link Configuration
 *
 * @module @nasnet/api-client/queries/wan
 */
export {
  WAN_INTERFACE_FIELDS,
  DHCP_CLIENT_FIELDS,
  PPPOE_CLIENT_FIELDS,
  STATIC_IP_CONFIG_FIELDS,
  LTE_MODEM_FIELDS,
  GET_WAN_INTERFACES,
  GET_WAN_INTERFACE,
  GET_WAN_CONNECTION_HISTORY,
  CONFIGURE_DHCP_WAN,
  CONFIGURE_PPPOE_WAN,
  CONFIGURE_STATIC_WAN,
  CONFIGURE_LTE_WAN,
  CONFIGURE_WAN_HEALTH_CHECK,
  DELETE_WAN_CONFIGURATION,
  WAN_STATUS_CHANGED,
  WAN_HEALTH_CHANGED,
} from './wan-queries.graphql';
export {
  useConfigureDhcpWAN,
  useConfigurePppoeWAN,
  useConfigureStaticWAN,
  useConfigureLteWAN,
  useConfigureWANHealthCheck,
  useDeleteWANConfiguration,
} from './useWANMutations';
//# sourceMappingURL=index.d.ts.map
