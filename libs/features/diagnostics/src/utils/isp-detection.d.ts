import type { ISPInfo } from '../types/troubleshoot.types';
/**
 * @description Detect Internet Service Provider (ISP) name and support contact info from a WAN IP address.
 * Uses the free ip-api.com service (45 req/min limit) to perform geolocation and ISP lookup.
 * Falls back gracefully if detection fails or IP is invalid.
 *
 * @param wanIp - The public IP address to look up (IPv4 or IPv6)
 * @returns Promise<ISPInfo> object with ISP name, support phone, support URL, and detection success flag
 */
export declare function detectISP(wanIp: string): Promise<ISPInfo>;
/**
 * @description Retrieve the WAN IP address from the router using DHCP client or interface fallback.
 * Tries DHCP client first, then falls back to the WAN interface's first configured address.
 * Required to pass WAN IP to detectISP() for ISP lookup.
 *
 * @param routerId - The router UUID to query
 * @param executeCommand - Function to execute RouterOS commands on the router
 * @param detectWanInterface - Function to detect the WAN interface name
 * @returns Promise<string | null> the extracted WAN IP (e.g., '203.0.113.42') or null if no IP found
 */
export declare function getWanIpForISPDetection(routerId: string, executeCommand: (routerId: string, command: string) => Promise<unknown>, detectWanInterface: (routerId: string) => Promise<string>): Promise<string | null>;
//# sourceMappingURL=isp-detection.d.ts.map