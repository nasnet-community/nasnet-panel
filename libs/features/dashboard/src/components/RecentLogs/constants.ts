/**
 * Constants for RecentLogs dashboard widget
 * Severity configuration, topic labels, and icons
 * Story NAS-5.6: Recent Logs with Filtering
 */

import {
  Info,
  AlertTriangle,
  XCircle,
  AlertOctagon,
  Server,
  Shield,
  Network,
  Cable,
  Wifi,
  Route,
  Globe,
  FileText,
  Code,
  Siren,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';

import type { LogSeverity, LogTopic } from '@nasnet/core/types';

/**
 * Severity configuration with icons, colors, and labels
 * Uses Tailwind semantic tokens (text-warning, text-error) NOT primitives
 */
export const SEVERITY_CONFIG: Record<
  LogSeverity,
  {
    icon: LucideIcon;
    colorClass: string;
    bgClass: string;
    label: string;
  }
> = {
  debug: {
    icon: Info,
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
    label: 'Debug',
  },
  info: {
    icon: Info,
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
    label: 'Info',
  },
  warning: {
    icon: AlertTriangle,
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10',
    label: 'Warning',
  },
  error: {
    icon: XCircle,
    colorClass: 'text-error',
    bgClass: 'bg-error/10',
    label: 'Error',
  },
  critical: {
    icon: AlertOctagon,
    colorClass: 'text-error animate-pulse',
    bgClass: 'bg-error/20',
    label: 'Critical',
  },
};

/**
 * Topic labels for UI display
 * Maps LogTopic enum values to user-friendly names
 */
export const TOPIC_LABELS: Record<LogTopic, string> = {
  system: 'System',
  firewall: 'Firewall',
  wireless: 'Wireless',
  dhcp: 'DHCP',
  dns: 'DNS',
  ppp: 'PPP',
  vpn: 'VPN',
  interface: 'Interface',
  route: 'Route',
  script: 'Script',
  critical: 'Critical',
  info: 'Info',
  warning: 'Warning',
  error: 'Error',
};

/**
 * Topic icons from Lucide
 * Maps LogTopic values to icon components
 * Note: Uses PascalCase without "Icon" suffix (lucide-react convention)
 */
export const TOPIC_ICONS: Partial<Record<LogTopic, LucideIcon>> & {
  default: LucideIcon;
} = {
  system: Server,
  firewall: Shield,
  dhcp: Network,
  interface: Cable,
  wireless: Wifi,
  route: Route,
  dns: Globe,
  vpn: Shield,
  ppp: Cable,
  script: Code,
  critical: Siren,
  error: AlertCircle,
  default: FileText,
};

/**
 * Topics available in the filter dropdown
 * Excludes severity-like topics (critical, info, warning, error) from filter UI
 */
export const ALL_FILTER_TOPICS: LogTopic[] = [
  'system',
  'firewall',
  'wireless',
  'dhcp',
  'dns',
  'ppp',
  'vpn',
  'interface',
  'route',
  'script',
];

/**
 * Maximum number of visible logs in dashboard widget
 */
export const MAX_VISIBLE_LOGS = 10;

/**
 * Polling interval when real-time subscription is not active (5 seconds)
 */
export const POLLING_INTERVAL_MS = 5000;
