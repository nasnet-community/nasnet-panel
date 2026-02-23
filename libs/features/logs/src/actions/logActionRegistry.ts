/**
 * Log action registry - defines available actions per topic
 * Epic 0.8: System Logs - Custom Log Actions
 */

import type { LogTopic } from '@nasnet/core/types';

/**
 * Action type definition for log entry context actions
 */
export interface LogAction {
  /** Unique action identifier */
  id: string;
  /** Display label for the action button */
  label: string;
  /** Lucide icon name (e.g., 'Shield', 'Plus', 'Ban') */
  icon: string;
  /** Optional description shown in tooltips */
  description?: string;
  /**
   * Handler type: determines how action is executed.
   * - 'navigate': Opens a route
   * - 'dialog': Opens a dialog/modal
   * - 'api': Makes an API call
   */
  handler: 'navigate' | 'dialog' | 'api';
  /**
   * Target path (for navigate) or dialog ID (for dialog handler)
   */
  target?: string;
  /**
   * Regular expression to extract data from log message.
   * First capture group is returned as extracted value.
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
 * @description Get all available actions for a given log topic,
 * including both topic-specific actions and common actions.
 * @param topic - The log topic (e.g., 'firewall', 'dhcp', 'vpn')
 * @returns Array of LogAction objects available for this topic
 * @example
 * const actions = getActionsForTopic('firewall');
 * // Returns: [view-rule, add-to-whitelist, block-ip, copy, bookmark, view-details]
 */
export function getActionsForTopic(topic: LogTopic): LogAction[] {
  const topicActions = logActionsByTopic[topic] || [];
  return [...topicActions, ...commonLogActions];
}

/**
 * @description Extract contextual data from a log message using the action's
 * regex pattern. Returns the first capture group from the pattern match.
 * @param message - The log message text to extract data from
 * @param action - The LogAction containing the extractPattern regex
 * @returns The extracted value (first capture group) or null if no match
 * @example
 * const action = logActionsByTopic.firewall[1]; // 'add-to-whitelist'
 * const ip = extractDataFromMessage('Blocked from 192.168.1.5', action);
 * // Returns: '192.168.1.5'
 */
export function extractDataFromMessage(
  message: string,
  action: LogAction
): string | null {
  if (!action.extractPattern) return null;

  const match = message.match(action.extractPattern);
  return match ? match[1] : null;
}



























