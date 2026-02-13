/**
 * FirewallLogStats Pattern Component
 *
 * Statistics panel for firewall log viewer with:
 * - Top Blocked IPs list (top 10)
 * - Top Ports list (top 10) with service name lookup
 * - Action Distribution pie chart (Recharts)
 *
 * Implements Headless + Platform Presenters pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/firewall-log-stats
 */

export { FirewallLogStats } from './FirewallLogStats';
export type { FirewallLogStatsProps } from './FirewallLogStats';
