/**
 * @description Detect the WAN interface name by querying the default route configuration.
 * Called during the 'initializing' state to identify which interface connects to the internet.
 * Required for subsequent network diagnostics (gateway, internet, DNS checks).
 *
 * @param routerId - The router UUID to query for default route configuration
 * @returns Promise<string> the detected WAN interface name (e.g., 'ether1', 'pppoe-out')
 * @throws DiagnosticError if no default route is configured (network isolation issue)
 */
export declare function detectWanInterface(routerId: string): Promise<string>;
/**
 * @description Detect the default gateway IP address from DHCP client or static route configuration.
 * Called during the 'initializing' state to identify the upstream router/gateway.
 * Returns null gracefully if no gateway is configured (not an error).
 *
 * @param routerId - The router UUID to query for gateway configuration
 * @returns Promise<string | null> the detected gateway IP (e.g., '192.168.1.1') or null if not configured
 * @throws DiagnosticError if query fails (network/API issue), but NOT if gateway is simply missing
 */
export declare function detectGateway(routerId: string): Promise<string | null>;
//# sourceMappingURL=network-detection.d.ts.map