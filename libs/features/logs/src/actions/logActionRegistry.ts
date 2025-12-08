/**
 * Log action registry - defines available actions per topic
 * Epic 0.8: System Logs - Custom Log Actions
 */

import type { LogTopic } from '@nasnet/core/types';

/**
 * Action type definition
 */
export interface LogAction {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  description?: string;
  /**
   * Handler receives the log message for context extraction
   */
  handler: 'navigate' | 'dialog' | 'api';
  /**
   * Target path or dialog ID
   */
  target?: string;
  /**
   * Extract data from log message
   */
  extractPattern?: RegExp;
}

/**
 * Topic-specific actions
 */
export const logActionsByTopic: Record<LogTopic, LogAction[]> = {
  firewall: [
    {
      id: 'view-rule',
      label: 'View Firewall Rule',
      icon: 'Shield',
      description: 'Open the related firewall rule',
      handler: 'navigate',
      target: '/router/:id/firewall',
    },
    {
      id: 'add-to-whitelist',
      label: 'Add IP to Whitelist',
      icon: 'Plus',
      description: 'Add the source IP to whitelist',
      handler: 'dialog',
      target: 'add-whitelist-dialog',
      extractPattern: /from\s+([\d.]+)/i,
    },
    {
      id: 'block-ip',
      label: 'Block IP Address',
      icon: 'Ban',
      description: 'Block this IP address',
      handler: 'dialog',
      target: 'block-ip-dialog',
      extractPattern: /from\s+([\d.]+)/i,
    },
  ],
  dhcp: [
    {
      id: 'view-lease',
      label: 'View DHCP Lease',
      icon: 'Network',
      description: 'View the DHCP lease details',
      handler: 'navigate',
      target: '/router/:id/network?tab=dhcp',
    },
    {
      id: 'make-static',
      label: 'Make Lease Static',
      icon: 'Lock',
      description: 'Convert to static lease',
      handler: 'api',
      extractPattern: /([\d.]+)\s+assigned/i,
    },
  ],
  wireless: [
    {
      id: 'view-client',
      label: 'View Wireless Client',
      icon: 'Wifi',
      description: 'View client details',
      handler: 'navigate',
      target: '/router/:id/wifi',
    },
    {
      id: 'disconnect-client',
      label: 'Disconnect Client',
      icon: 'WifiOff',
      description: 'Disconnect this wireless client',
      handler: 'api',
      extractPattern: /([0-9A-Fa-f:]{17})/i, // MAC address
    },
  ],
  interface: [
    {
      id: 'go-to-interface',
      label: 'View Interface',
      icon: 'Cable',
      description: 'Open interface configuration',
      handler: 'navigate',
      target: '/router/:id/network',
    },
  ],
  vpn: [
    {
      id: 'view-vpn',
      label: 'View VPN Connection',
      icon: 'Shield',
      description: 'Open VPN tab',
      handler: 'navigate',
      target: '/router/:id/vpn',
    },
  ],
  dns: [
    {
      id: 'view-dns',
      label: 'View DNS Settings',
      icon: 'Globe',
      description: 'Open DNS configuration',
      handler: 'navigate',
      target: '/router/:id/network?tab=dns',
    },
  ],
  route: [
    {
      id: 'view-routes',
      label: 'View Routing Table',
      icon: 'Route',
      description: 'Open routing configuration',
      handler: 'navigate',
      target: '/router/:id/firewall?tab=routing',
    },
  ],
  ppp: [
    {
      id: 'view-ppp',
      label: 'View PPP Connection',
      icon: 'Plug',
      description: 'Open PPP interface',
      handler: 'navigate',
      target: '/router/:id/network',
    },
  ],
  script: [
    {
      id: 'view-scripts',
      label: 'View Scripts',
      icon: 'Code',
      description: 'Open system scripts',
      handler: 'navigate',
      target: '/router/:id/overview',
    },
  ],
  system: [],
  critical: [],
  info: [],
  warning: [],
  error: [],
};

/**
 * Common actions available for all log entries
 */
export const commonLogActions: LogAction[] = [
  {
    id: 'copy',
    label: 'Copy Log Entry',
    icon: 'Copy',
    description: 'Copy this log entry to clipboard',
    handler: 'dialog',
    target: 'copy',
  },
  {
    id: 'bookmark',
    label: 'Bookmark',
    icon: 'Pin',
    description: 'Bookmark this log entry',
    handler: 'dialog',
    target: 'bookmark',
  },
  {
    id: 'view-details',
    label: 'View Details',
    icon: 'ExternalLink',
    description: 'Open log entry details',
    handler: 'dialog',
    target: 'details',
  },
];

/**
 * Get available actions for a log entry
 */
export function getActionsForTopic(topic: LogTopic): LogAction[] {
  const topicActions = logActionsByTopic[topic] || [];
  return [...topicActions, ...commonLogActions];
}

/**
 * Extract data from log message using action pattern
 */
export function extractDataFromMessage(
  message: string,
  action: LogAction
): string | null {
  if (!action.extractPattern) return null;

  const match = message.match(action.extractPattern);
  return match ? match[1] : null;
}







