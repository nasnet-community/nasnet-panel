// libs/features/diagnostics/src/utils/isp-detection.ts
import type { ISPInfo } from '../types/troubleshoot.types';

/**
 * @description Detect Internet Service Provider (ISP) name and support contact info from a WAN IP address.
 * Uses the free ip-api.com service (45 req/min limit) to perform geolocation and ISP lookup.
 * Falls back gracefully if detection fails or IP is invalid.
 *
 * @param wanIp - The public IP address to look up (IPv4 or IPv6)
 * @returns Promise<ISPInfo> object with ISP name, support phone, support URL, and detection success flag
 */
export async function detectISP(wanIp: string): Promise<ISPInfo> {
  try {
    // Use ip-api.com for ISP detection (free tier: 45 requests/minute)
    // Falls back gracefully if service is unavailable or rate-limited
    const response = await fetch(`http://ip-api.com/json/${wanIp}?fields=isp,org`);

    if (!response.ok) {
      console.warn(
        `ISP lookup failed: HTTP ${response.status}. Service may be rate-limited or unavailable.`
      );
      return { name: null, supportPhone: null, supportUrl: null, detected: false };
    }

    const data = await response.json();
    const ispName = data.isp || data.org || null;

    // Map common ISPs to support info (expand as needed)
    const supportInfo = ISP_SUPPORT_DATABASE[normalizeISPName(ispName)] || {};

    return {
      name: ispName,
      supportPhone: supportInfo.phone || null,
      supportUrl: supportInfo.url || null,
      detected: !!ispName,
    };
  } catch (error) {
    console.warn('ISP detection failed:', error);
    return { name: null, supportPhone: null, supportUrl: null, detected: false };
  }
}

/**
 * @description Normalize ISP names by lowercasing, removing special chars, and stripping corporate suffixes.
 * Enables fuzzy matching against the ISP_SUPPORT_DATABASE.
 *
 * @param name - The raw ISP name from ip-api.com (e.g., "Comcast Inc")
 * @returns Normalized name for lookup (e.g., "comcast")
 */
function normalizeISPName(name: string | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/communications?|telecom|corp|inc|llc|ltd/g, '');
}

/**
 * @description Known ISP support information (contact phone and support website).
 * Covers major US ISPs; expand as needed for international coverage.
 * Normalized ISP names from ip-api.com are matched against this database.
 */
const ISP_SUPPORT_DATABASE: Record<string, { phone?: string; url?: string }> = {
  spectrum: { phone: '1-833-267-6094', url: 'https://www.spectrum.com/contact-us' },
  comcast: { phone: '1-800-934-6489', url: 'https://www.xfinity.com/support' },
  xfinity: { phone: '1-800-934-6489', url: 'https://www.xfinity.com/support' },
  att: { phone: '1-800-288-2020', url: 'https://www.att.com/support/' },
  verizon: { phone: '1-800-837-4966', url: 'https://www.verizon.com/support/' },
  coxcommunications: {
    phone: '1-800-234-3993',
    url: 'https://www.cox.com/residential/support.html',
  },
  centurylink: { phone: '1-800-244-1111', url: 'https://www.centurylink.com/home/help.html' },
  frontier: { phone: '1-800-921-8101', url: 'https://frontier.com/helpcenter' },
  optimum: { phone: '1-866-200-7273', url: 'https://www.optimum.net/support/' },
};

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
export async function getWanIpForISPDetection(
  routerId: string,
  executeCommand: (routerId: string, command: string) => Promise<unknown>,
  detectWanInterface: (routerId: string) => Promise<string>
): Promise<string | null> {
  try {
    // Try DHCP client first (most common for internet connectivity)
    const dhcpClients = (await executeCommand(
      routerId,
      '/ip/dhcp-client/print where status=bound'
    )) as Array<{ address?: string }>;
    if (dhcpClients[0]?.address) {
      // Extract IP from CIDR notation (e.g., "192.168.1.100/24" -> "192.168.1.100")
      return dhcpClients[0].address.split('/')[0];
    }

    // Fallback to first address on WAN interface (for static IP scenarios)
    const wanInterface = await detectWanInterface(routerId);
    const addresses = (await executeCommand(
      routerId,
      `/ip/address/print where interface=${wanInterface}`
    )) as Array<{ address?: string }>;
    if (addresses[0]?.address) {
      return addresses[0].address.split('/')[0];
    }

    // No IP address found on WAN interface
    return null;
  } catch (error) {
    console.warn(
      'Failed to retrieve WAN IP for ISP detection:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return null;
  }
}
