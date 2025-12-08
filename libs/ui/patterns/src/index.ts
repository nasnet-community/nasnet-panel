// UI Patterns Library - Composed UI patterns for NasNetConnect
// Higher-level components built on top of primitives

// FormField - Label, description, and error handling for form inputs
export { FormField } from './form-field';
export * from './file-upload-zone';
export type { FormFieldProps } from './form-field';

// StatusIndicator - Visual status feedback (online, offline, warning, etc.)
export { StatusIndicator, statusIndicatorVariants } from './status-indicator';
export type { StatusIndicatorProps } from './status-indicator';

// DataTable - Generic data table with column configuration
export { DataTable } from './data-table';
export type { DataTableColumn, DataTableProps } from './data-table';

// SystemInfoCard - Router system information display
export { SystemInfoCard } from './system-info-card';
export type { SystemInfoCardProps } from './system-info-card';

// ResourceGauge - Resource usage visualization
export { ResourceGauge } from './resource-gauge';
export type { ResourceGaugeProps } from './resource-gauge';

// DHCPServerCard - DHCP server configuration display
export { DHCPServerCard } from './dhcp-server-card';
export type { DHCPServerCardProps } from './dhcp-server-card';

// StatusBadge - Color-coded status badges for leases and clients
export { StatusBadge, badgeVariants } from './status-badge';
export type { StatusBadgeProps } from './status-badge';

// DHCPClientCard - DHCP client status display for WAN interfaces
export { DHCPClientCard } from './dhcp-client-card';
export type { DHCPClientCardProps } from './dhcp-client-card';

// WireGuardCard - WireGuard interface display with public key copy
export { WireGuardCard } from './wireguard-card';
export type { WireGuardCardProps } from './wireguard-card';

// ThemeToggle - Toggle between light and dark themes
export { ThemeToggle } from './theme-toggle';
export type { ThemeToggleProps } from './theme-toggle';

// HardwareCard - Routerboard hardware details with copy-to-clipboard
export { HardwareCard } from './hardware-card';
export type { HardwareCardProps } from './hardware-card';

// LastUpdated - Display last data refresh timestamp
export { LastUpdated } from './last-updated';
export type { LastUpdatedProps } from './last-updated';

// ConfirmationDialog - Reusable confirmation dialog for user actions
export { ConfirmationDialog } from './confirmation-dialog';
export type { ConfirmationDialogProps } from './confirmation-dialog';

// VPNTypeSection - Collapsible section for grouping VPN interfaces by type
export { VPNTypeSection } from './vpn-type-section';
export type { VPNTypeSectionProps } from './vpn-type-section';

// GenericVPNCard - Generic VPN interface card (L2TP, PPTP, SSTP)
export { GenericVPNCard } from './generic-vpn-card';
export type { GenericVPNCardProps } from './generic-vpn-card';

// ConnectionBanner - Warning banner for connection state (Epic 0.9)
export { ConnectionBanner } from './connection-banner';

// ConnectionIndicator - Connection status indicator dot (Epic 0.9)
export { ConnectionIndicator } from './connection-indicator';

// LogEntry - System log entry display with timestamp and topic badge (Epic 0.8)
export { LogEntry, topicBadgeVariants } from './log-entry';
export type { LogEntryProps } from './log-entry';

// LogFilters - Multi-select filters for log topics (Epic 0.8)
export { LogFilters } from './log-filters';
export type { LogFiltersProps } from './log-filters';

// SeverityBadge - Color-coded severity indicators for logs (Epic 0.8)
export { SeverityBadge } from './severity-badge';
export type { SeverityBadgeProps } from './severity-badge';

// NewEntriesIndicator - Floating indicator for new log entries (Epic 0.8)
export { NewEntriesIndicator } from './new-entries-indicator';
export type { NewEntriesIndicatorProps } from './new-entries-indicator';

// LeaseTable - DHCP lease table with sorting and filtering (Epic 0.5)
export { LeaseTable } from './lease-table';
export type { LeaseTableProps } from './lease-table';

// BackButton - Reusable back navigation button (Epic 0.9)
export { BackButton } from './back-button';
export type { BackButtonProps } from './back-button';

// StatusCard - Hero dashboard component showing overall network health
export { StatusCard } from './status-card';
export type { StatusCardProps, StatusMetric, NetworkStatus } from './status-card';

// QuickActionButton - Grid buttons for common actions
export { QuickActionButton } from './quick-action-button';
export type { QuickActionButtonProps } from './quick-action-button';

// VPNCardEnhanced - Quick VPN toggle with status display
export { VPNCardEnhanced } from './vpn-card-enhanced';
export type { VPNCardEnhancedProps, VPNProfile, VPNStatus } from './vpn-card-enhanced';

// SafetyFeedback - Displays feedback for safety pipeline operations
export * from './safety-feedback';

// EmptyState - Consistent empty state pattern
export * from './empty-state';

// PluginCard - Advanced plugin display with status, stats, and logs
export { PluginCard } from './plugin-card';
export type { 
  PluginCardProps, 
  Plugin, 
  PluginStatus, 
  PluginStats, 
  PluginLog 
} from './plugin-card';

// VPN Dashboard Components
export { 
  ProtocolIcon, 
  ProtocolIconBadge,
  getProtocolLabel,
  getProtocolColorClass,
  getProtocolBgClass,
} from './protocol-icon';
export type { ProtocolIconProps, ProtocolIconBadgeProps } from './protocol-icon';

export { VPNProtocolStatsCard } from './vpn-protocol-stats-card';
export type { VPNProtocolStatsCardProps } from './vpn-protocol-stats-card';

export { VPNStatusHero } from './vpn-status-hero';
export type { VPNStatusHeroProps, VPNHealthStatus } from './vpn-status-hero';

export { VPNIssueAlert, VPNIssuesList } from './vpn-issue-alert';
export type { VPNIssueAlertProps, VPNIssuesListProps } from './vpn-issue-alert';

export { VPNNavigationCard } from './vpn-navigation-card';
export type { VPNNavigationCardProps } from './vpn-navigation-card';

export { VPNServerCard } from './vpn-server-card';
export type { VPNServerCardProps } from './vpn-server-card';

export { VPNClientCard } from './vpn-client-card';
export type { VPNClientCardProps } from './vpn-client-card';

// QuickActionsCard - 2x2 action grid for dashboard
export { QuickActionsCard } from './quick-actions-card';
export type { QuickActionsCardProps, QuickAction } from './quick-actions-card';

// DHCPSummaryCard - Compact DHCP summary for overview
export { DHCPSummaryCard } from './dhcp-summary-card';
export type { DHCPSummaryCardProps } from './dhcp-summary-card';

// TrafficChart - Network traffic visualization
export { TrafficChart } from './traffic-chart';
export type { TrafficChartProps, TrafficDataPoint } from './traffic-chart';

// VPNClientsSummary - VPN client summary with expandable list
export { VPNClientsSummary } from './vpn-clients-summary';
export type { VPNClientsSummaryProps, ConnectedVPNClient } from './vpn-clients-summary';

// StatusPills - Horizontal scrollable status indicators
export { StatusPills } from './status-pills';
export type { StatusPillsProps, StatusPill, StatusPillVariant } from './status-pills';

// LogSearch - Text search for filtering logs (Epic 0.8)
export { LogSearch, HighlightedText } from './log-search';
export type { LogSearchProps, HighlightedTextProps } from './log-search';

// LogControls - Pause/resume and export controls (Epic 0.8)
export { LogControls, logExport } from './log-controls';
export type { LogControlsProps } from './log-controls';

// LogStats - Statistics summary for logs (Epic 0.8)
export { LogStats } from './log-stats';
export type { LogStatsProps } from './log-stats';

// LogDetailPanel - Side panel for log entry details (Epic 0.8)
export { LogDetailPanel } from './log-detail-panel';
export type { LogDetailPanelProps } from './log-detail-panel';

// LogGroup - Grouped/correlated log entries (Epic 0.8)
export { LogGroup, LogGroupList } from './log-group';
export type { LogGroupProps, LogGroupData, LogGroupListProps } from './log-group';
