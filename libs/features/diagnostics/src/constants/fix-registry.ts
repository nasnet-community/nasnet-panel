// libs/features/diagnostics/src/constants/fix-registry.ts
import type { FixSuggestion, DiagnosticResult } from '../types/troubleshoot.types';

/**
 * @description Registry of all known diagnostic issues and their corresponding fix suggestions.
 * Maps issue codes to fix metadata including automated commands, manual steps, and confidence levels.
 * Used by the troubleshooting machine to suggest and apply fixes based on diagnostic results.
 *
 * Organization:
 * - WAN_* issues: Physical/interface-level connectivity problems
 * - GATEWAY_* issues: Upstream router/gateway connectivity problems
 * - INTERNET_* issues: ISP-level connectivity problems (often require manual ISP intervention)
 * - DNS_* issues: Domain name resolution problems (often fixable by changing DNS servers)
 * - NAT_* issues: Network Address Translation configuration problems
 */
export const FIX_REGISTRY: Record<string, FixSuggestion> = {
  // === WAN Interface Issues ===
  WAN_LINK_DOWN: {
    issueCode: 'WAN_LINK_DOWN',
    title: 'Check Physical Connection',
    description: 'The cable to your internet provider appears disconnected.',
    command: null,
    confidence: null,
    requiresConfirmation: false,
    isManualFix: true,
    manualSteps: [
      'Check that the ethernet cable is securely plugged into the WAN port',
      'Try a different ethernet cable if available',
      'Check if the modem/ONT has power and link lights',
      'Restart your modem/ONT by unplugging for 30 seconds',
    ],
  },
  WAN_DISABLED: {
    issueCode: 'WAN_DISABLED',
    title: 'Enable WAN Interface',
    description:
      'Your WAN interface is disabled. This will enable it to restore internet connectivity.',
    command: '/interface/enable [find where default-name~"ether1" or comment~"WAN"]',
    confidence: 'high',
    requiresConfirmation: true,
    rollbackCommand: '/interface/disable [find where default-name~"ether1" or comment~"WAN"]',
    isManualFix: false,
  },

  // === Gateway Issues ===
  GATEWAY_UNREACHABLE: {
    issueCode: 'GATEWAY_UNREACHABLE',
    title: 'Renew Internet Connection',
    description:
      "Your connection to your internet provider may have expired. We'll request a new one.",
    command: '/ip/dhcp-client/renew [find]',
    confidence: 'high',
    requiresConfirmation: true,
    rollbackCommand: null,
    isManualFix: false,
  },
  GATEWAY_TIMEOUT: {
    issueCode: 'GATEWAY_TIMEOUT',
    title: 'Restart Network Connection',
    description: 'Your gateway is responding slowly. Restarting the connection may help.',
    command: '/ip/dhcp-client/release [find]; :delay 2s; /ip/dhcp-client/renew [find]',
    confidence: 'medium',
    requiresConfirmation: true,
    rollbackCommand: null,
    isManualFix: false,
  },

  // === Internet Connectivity Issues ===
  NO_INTERNET: {
    issueCode: 'NO_INTERNET',
    title: 'Contact Your Internet Provider',
    description:
      'Cannot reach the internet. This appears to be an issue with your internet service provider.',
    command: null,
    confidence: null,
    requiresConfirmation: false,
    isManualFix: true,
    manualSteps: [
      'Check if there are known outages in your area',
      'Contact your ISP support line',
      'Ask your ISP to check your connection remotely',
    ],
  },
  INTERNET_TIMEOUT: {
    issueCode: 'INTERNET_TIMEOUT',
    title: 'Check for Network Congestion',
    description: 'Internet connection is very slow. This may be temporary congestion.',
    command: null,
    confidence: null,
    requiresConfirmation: false,
    isManualFix: true,
    manualSteps: [
      'Wait a few minutes and try again',
      'Check if other devices have the same issue',
      'Restart your modem/ONT',
      'Contact your ISP if the problem persists',
    ],
  },

  // === DNS Issues ===
  DNS_FAILED: {
    issueCode: 'DNS_FAILED',
    title: 'Switch to Cloudflare DNS',
    description:
      'Your current DNS server is not responding. This will switch to Cloudflare DNS (1.1.1.1) which is fast and reliable.',
    command: '/ip/dns/set servers=1.1.1.1,1.0.0.1 allow-remote-requests=yes',
    confidence: 'high',
    requiresConfirmation: true,
    rollbackCommand: null, // Dynamically stored before applying
    isManualFix: false,
  },
  DNS_TIMEOUT: {
    issueCode: 'DNS_TIMEOUT',
    title: 'Add Backup DNS Server',
    description: 'DNS responses are slow. Adding a backup DNS server may improve reliability.',
    command: '/ip/dns/set servers=1.1.1.1,8.8.8.8,8.8.4.4',
    confidence: 'medium',
    requiresConfirmation: true,
    rollbackCommand: null, // Dynamically stored before applying
    isManualFix: false,
  },

  // === NAT Issues ===
  NAT_MISSING: {
    issueCode: 'NAT_MISSING',
    title: 'Add NAT Rule',
    description:
      'Network Address Translation (NAT) is not configured. This allows your devices to share the internet connection.',
    command:
      '/ip/firewall/nat/add chain=srcnat out-interface=[/ip/route/get [find dst-address=0.0.0.0/0] gateway-interface] action=masquerade comment="NasNet Auto-Created"',
    confidence: 'high',
    requiresConfirmation: true,
    rollbackCommand: '/ip/firewall/nat/remove [find comment="NasNet Auto-Created"]',
    isManualFix: false,
  },
  NAT_DISABLED: {
    issueCode: 'NAT_DISABLED',
    title: 'Enable NAT Rule',
    description:
      'Your NAT rule exists but is disabled. Enabling it will restore internet for your devices.',
    command: '/ip/firewall/nat/enable [find chain=srcnat action=masquerade]',
    confidence: 'high',
    requiresConfirmation: true,
    rollbackCommand: '/ip/firewall/nat/disable [find chain=srcnat action=masquerade]',
    isManualFix: false,
  },
};

/**
 * @description Look up the appropriate fix suggestion for a diagnostic result.
 * Maps the issue code from the result to the corresponding fix in FIX_REGISTRY.
 * Returns undefined if no fix is available for the detected issue.
 *
 * @param stepId - The diagnostic step ID (unused but kept for compatibility)
 * @param result - The diagnostic result containing the issue code to look up
 * @returns FixSuggestion object or undefined if issue code not found in registry
 */
export function getFix(stepId: string, result: DiagnosticResult): FixSuggestion | undefined {
  const issueCode = result.issueCode;
  if (!issueCode) return undefined;
  return FIX_REGISTRY[issueCode];
}

/**
 * @description Capture the current DNS server configuration before applying a DNS fix.
 * Enables rollback if the DNS change causes problems by storing the old configuration
 * as a RouterOS command that can be re-executed.
 *
 * @param routerId - The router UUID
 * @param executeCommand - Function to execute RouterOS commands on the router
 * @returns Promise<string | null> RouterOS command to restore old DNS config (e.g., "/ip/dns/set servers=..."), or null if capture fails
 */
export async function storeDnsConfigForRollback(
  routerId: string,
  executeCommand: (routerId: string, command: string) => Promise<unknown>
): Promise<string | null> {
  try {
    const currentDns = (await executeCommand(routerId, '/ip/dns/print')) as { servers?: string };
    if (currentDns?.servers) {
      return `/ip/dns/set servers=${currentDns.servers}`;
    }
    return null;
  } catch (error) {
    console.warn('Failed to capture DNS config for rollback:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}
