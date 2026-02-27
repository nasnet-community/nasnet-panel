/**
 * GraphQL documents for WAN interface management
 * NAS-6.8: WAN Link Configuration
 */
/**
 * WAN Interface Core Fields Fragment
 */
export declare const WAN_INTERFACE_FIELDS: import('graphql').DocumentNode;
/**
 * DHCP Client Fields Fragment
 */
export declare const DHCP_CLIENT_FIELDS: import('graphql').DocumentNode;
/**
 * PPPoE Client Fields Fragment
 */
export declare const PPPOE_CLIENT_FIELDS: import('graphql').DocumentNode;
/**
 * Static IP Config Fields Fragment
 */
export declare const STATIC_IP_CONFIG_FIELDS: import('graphql').DocumentNode;
/**
 * LTE Modem Fields Fragment
 */
export declare const LTE_MODEM_FIELDS: import('graphql').DocumentNode;
/**
 * Get list of WAN interfaces for a router
 */
export declare const GET_WAN_INTERFACES: import('graphql').DocumentNode;
/**
 * Get detailed information for a single WAN interface
 */
export declare const GET_WAN_INTERFACE: import('graphql').DocumentNode;
/**
 * Get connection history for a WAN interface
 */
export declare const GET_WAN_CONNECTION_HISTORY: import('graphql').DocumentNode;
/**
 * Configure DHCP client on a WAN interface
 */
export declare const CONFIGURE_DHCP_WAN: import('graphql').DocumentNode;
/**
 * Configure PPPoE client on a WAN interface
 */
export declare const CONFIGURE_PPPOE_WAN: import('graphql').DocumentNode;
/**
 * Configure static IP on a WAN interface
 */
export declare const CONFIGURE_STATIC_WAN: import('graphql').DocumentNode;
/**
 * Configure LTE modem
 */
export declare const CONFIGURE_LTE_WAN: import('graphql').DocumentNode;
/**
 * Configure health check for a WAN interface
 */
export declare const CONFIGURE_WAN_HEALTH_CHECK: import('graphql').DocumentNode;
/**
 * Delete WAN configuration (revert to unconfigured)
 */
export declare const DELETE_WAN_CONFIGURATION: import('graphql').DocumentNode;
/**
 * Subscribe to WAN status changes
 */
export declare const WAN_STATUS_CHANGED: import('graphql').DocumentNode;
/**
 * Subscribe to WAN health status changes
 */
export declare const WAN_HEALTH_CHANGED: import('graphql').DocumentNode;
//# sourceMappingURL=wan-queries.graphql.d.ts.map
