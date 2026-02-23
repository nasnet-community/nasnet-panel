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
 * Severity configuration with icons, colors, and labels.
 * Maps LogSeverity enum values to Lucide icons, semantic color tokens, and labels.
 * Uses Tailwind semantic tokens (text-warning, text-error) NOT primitives.
 *
 * @see DESIGN_TOKENS.md for semantic color documentation
 */
export const SEVERITY_CONFIG: Record<
  LogSeverity,
  {
    /** Lucide icon component for this severity level */
    icon: LucideIcon;
    /** Tailwind semantic color class for icon */
    colorClass: string;
    /** Tailwind semantic background class */
    bgClass: string;
    /** UI label for this severity */
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
 * Topic labels for UI display.
 * Maps LogTopic enum values to user-friendly display names for the filter UI.
 * Used in RecentLogs dashboard widget and log filtering components.
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
 * Topic icons from Lucide.
 * Maps LogTopic values to icon components for filter UI and log entries.
 * Uses fallback 'default' icon for unmapped topics.
 *
 * Note: Icons are PascalCase components without "Icon" suffix (lucide-react convention).
 * Render via `<Icon component={TOPIC_ICONS[topic]} />` pattern.
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
 * Topics available in the filter dropdown.
 * Excludes severity-like topics (critical, info, warning, error) to avoid confusion with SEVERITY_CONFIG.
 * Ordered by importance for typical networking use cases.
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
 * Maximum number of visible logs displayed in the RecentLogs dashboard widget.
 * Older logs are hidden in a scrollable region when count exceeds this value.
 */
export const MAX_VISIBLE_LOGS = 10;

/**
 * Fallback polling interval (in milliseconds) when real-time GraphQL subscriptions are unavailable.
 * Used as a safe default for server-side degradation (5 seconds).
 */
export const POLLING_INTERVAL_MS = 5000;
