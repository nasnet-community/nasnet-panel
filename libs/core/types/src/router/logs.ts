/**
 * System Log Entry Types
 *
 * Defines types for RouterOS system logs including log entries,
 * topics (facilities), and severity levels.
 */

/**
 * Log topic/facility categories from RouterOS
 *
 * @remarks
 * Represents system-level categories for log organization
 * (system, firewall, wireless, dhcp, dns, ppp, vpn, interface, route, script, critical, info, warning, error)
 *
 * @example
 * const topic: LogTopic = 'firewall';
 */
export type LogTopic =
  | 'system'
  | 'firewall'
  | 'wireless'
  | 'dhcp'
  | 'dns'
  | 'ppp'
  | 'vpn'
  | 'interface'
  | 'route'
  | 'script'
  | 'critical'
  | 'info'
  | 'warning'
  | 'error';

/**
 * Log severity levels
 *
 * @remarks
 * Ordered by severity: debug (lowest) → critical (highest)
 *
 * @example
 * const severity: LogSeverity = 'error';
 */
export type LogSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

/**
 * System log entry
 */
export interface LogEntry {
  /**
   * Unique identifier from RouterOS (.id)
   */
  id: string;

  /**
   * Timestamp when the log entry was created
   */
  timestamp: Date;

  /**
   * Topic/facility category
   */
  topic: LogTopic;

  /**
   * Severity level
   */
  severity: LogSeverity;

  /**
   * Log message content
   */
  message: string;
}

/**
 * Filter criteria for logs
 */
export interface LogFilters {
  /**
   * Selected topics (empty = all topics)
   */
  topics: LogTopic[];

  /**
   * Selected severities (empty = all severities)
   */
  severities: LogSeverity[];
}
