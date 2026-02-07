// libs/features/diagnostics/src/utils/isp-detection.ts
import type { ISPInfo } from '../types/troubleshoot.types';

/**
 * Detect ISP from WAN IP address using ip-api.com (free, no key required)
 * Falls back to generic message if detection fails
 */
export async function detectISP(wanIp: string): Promise<ISPInfo> {
  try {
    // Use ip-api.com for ISP detection (free tier: 45 requests/minute)
    const response = await fetch(`http://ip-api.com/json/${wanIp}?fields=isp,org`);

    if (!response.ok) {
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

function normalizeISPName(name: string | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/communications?|telecom|corp|inc|llc|ltd/g, '');
}

// Known ISP support information (US-centric, expand as needed)
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
 * Get WAN IP from router to use for ISP detection
 */
export async function getWanIpForISPDetection(
  routerId: string,
  executeCommand: (routerId: string, command: string) => Promise<unknown>,
  detectWanInterface: (routerId: string) => Promise<string>
): Promise<string | null> {
  try {
    // Try DHCP client first
    const dhcpClients = (await executeCommand(
      routerId,
      '/ip/dhcp-client/print where status=bound'
    )) as Array<{ address?: string }>;
    if (dhcpClients[0]?.address) {
      // Extract IP from CIDR notation (e.g., "192.168.1.100/24" -> "192.168.1.100")
      return dhcpClients[0].address.split('/')[0];
    }

    // Fallback to first address on WAN interface
    const wanInterface = await detectWanInterface(routerId);
    const addresses = (await executeCommand(
      routerId,
      `/ip/address/print where interface=${wanInterface}`
    )) as Array<{ address?: string }>;
    if (addresses[0]?.address) {
      return addresses[0].address.split('/')[0];
    }

    return null;
  } catch {
    return null;
  }
}
