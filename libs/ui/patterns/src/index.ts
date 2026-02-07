// UI Patterns Library - Composed UI patterns for NasNetConnect
// Higher-level components built on top of primitives

// FormField - Label, description, and error handling for form inputs
export { FormField } from './form-field';
export * from './file-upload-zone';
export type { FormFieldProps } from './form-field';

// RHF Form Components - React Hook Form integrated form components
export {
  RHFFormField,
  FormFieldError,
  FormFieldDescription,
  FormSubmitButton,
  FormArrayField,
} from './rhf-form-field';
export type {
  RHFFormFieldProps,
  FieldMode,
  FormFieldErrorProps,
  FormFieldDescriptionProps,
  FormSubmitButtonProps,
  FormArrayFieldProps,
} from './rhf-form-field';

// Validation Progress - 7-stage validation pipeline UI
export {
  ValidationProgress,
  ValidationStage,
  useValidationProgress,
} from './validation-progress';
export type {
  ValidationProgressProps,
  ValidationStageProps,
  ValidationStageName,
  ValidationStageStatus,
  ValidationError,
  ValidationWarning,
  ValidationStageResult,
  StageMeta,
  ValidationResult,
} from './validation-progress';

// Cross-Resource Validation - Conflict display and resolution
export {
  ConflictCard,
  ConflictList,
  CONFLICT_TYPE_LABELS,
  CONFLICT_TYPE_ICONS,
} from './cross-resource-validation';
export type {
  ConflictCardProps,
  ConflictListProps,
  ConflictType,
  ConflictSeverity,
  ConflictResource,
  ConflictResolution,
  ResourceConflict,
} from './cross-resource-validation';

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

// LanguageSwitcher - Language selection dropdown (NAS-4.22)
export { LanguageSwitcher } from './language-switcher';
export type { LanguageSwitcherProps } from './language-switcher';

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

// ConnectionIndicator - Connection status indicator with platform presenters (NAS-4.9)
export {
  ConnectionIndicator,
  ConnectionIndicatorMobile,
  ConnectionIndicatorDesktop,
  useConnectionIndicator,
} from './connection-indicator';
export type {
  ConnectionIndicatorProps,
  ConnectionIndicatorState,
  StatusColor,
} from './connection-indicator';

// ConnectionQualityBadge - Latency and quality indicator (NAS-4.9)
export { ConnectionQualityBadge, useConnectionQuality } from './connection-quality-badge';
export type { ConnectionQualityBadgeProps, QualityLevel } from './connection-quality-badge';

// ReconnectingOverlay - Full-screen reconnection overlay (NAS-4.9)
export { ReconnectingOverlay, useReconnectingState } from './reconnecting-overlay';
export type { ReconnectingOverlayProps } from './reconnecting-overlay';

// OfflineIndicator - Network offline banner (NAS-4.9)
export { OfflineIndicator, OfflineIndicatorCompact, useNetworkStatus } from './offline-indicator';
export type { OfflineIndicatorProps, OfflineIndicatorCompactProps } from './offline-indicator';

// SessionExpiringDialog - Session expiry warning modal (NAS-4.9)
export { SessionExpiringDialog, useSessionExpiring } from './session-expiring-dialog';
export type { SessionExpiringDialogProps } from './session-expiring-dialog';

// AuthProvider - Authentication context provider (NAS-4.9)
export {
  AuthProvider,
  RequireAuth,
  useAuth,
  useAuthOptional,
} from './auth-provider';
export type {
  AuthContextValue,
  AuthProviderProps,
  RequireAuthProps,
  User as AuthUser,
} from './auth-provider';

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

// LogSearch - Text search with match highlighting (Epic 0.8)
export { LogSearch } from './log-search';
export type { LogSearchProps } from './log-search';

// LogControls - Pause/Resume & Export controls (Epic 0.8)
export { LogControls } from './log-controls';
export type { LogControlsProps } from './log-controls';

// LogStats - Statistics summary for logs (Epic 0.8)
export { LogStats } from './log-stats';
export type { LogStatsProps } from './log-stats';

// LogDetailPanel - Detailed log entry view (Epic 0.8)
export { LogDetailPanel } from './log-detail-panel';
export type { LogDetailPanelProps } from './log-detail-panel';

// LogGroup - Log correlation/grouping (Epic 0.8)
export { LogGroup, LogGroupList } from './log-group';
export type { LogGroupData, LogGroupProps, LogGroupListProps } from './log-group';

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

// ============================================================================
// Universal State v2 Resource Components
// ============================================================================

// ResourceLifecycleBadge - Lifecycle state badge with icons
export { ResourceLifecycleBadge, lifecycleBadgeVariants } from './resource-lifecycle-badge';
export type { ResourceLifecycleBadgeProps } from './resource-lifecycle-badge';

// ResourceHealthIndicator - Runtime health status indicator
export {
  ResourceHealthIndicator,
  ResourceHealthBadge,
  ResourceHealthDot,
  healthDotVariants,
  healthLabelVariants,
} from './resource-health-indicator';
export type { ResourceHealthIndicatorProps } from './resource-health-indicator';

// ResourceProvider - Context provider for resource data
export {
  ResourceProvider,
  useResourceContext,
  useOptionalResourceContext,
  ResourceLoading,
  ResourceError,
  ResourceLoaded,
  ResourceState,
} from './resource-provider';
export type { ResourceContextValue, ResourceProviderProps } from './resource-provider';

// ============================================================================
// Performance Optimization Utilities
// ============================================================================

// Virtualization - High-performance list and table rendering
export {
  // Components
  VirtualizedList,
  VirtualizedTable,
  // Hooks
  useVirtualList,
  useScrollRestoration,
  // Utilities
  createTextColumn,
  createSelectionColumn,
  // Constants
  VIRTUALIZATION_THRESHOLD,
  TABLE_VIRTUALIZATION_THRESHOLD,
  DEFAULT_OVERSCAN,
  ROW_HEIGHTS,
  TABLE_ROW_HEIGHTS,
} from './virtualization';
export type {
  VirtualizedListProps,
  VirtualizedListItemProps,
  VirtualizedTableProps,
  TypedColumnDef,
  UseVirtualListOptions,
  UseVirtualListReturn,
} from './virtualization';

// Suspense / Lazy Loading - Code splitting utilities
export {
  LazyBoundary,
  SkeletonLoader,
  withLazyBoundary,
  preloadComponent,
  createLazyWithPreload,
} from './suspense';
export type {
  LazyBoundaryProps,
  SkeletonLoaderProps,
  WithLazyBoundaryOptions,
} from './suspense';

// Hooks - Memoization and stable callback utilities
export {
  // Memoization
  useMemoizedFilter,
  useMemoizedSort,
  useMemoizedFilterSort,
  useMemoizedMap,
  useMemoizedFind,
  useMemoizedGroupBy,
  useMemoizedReduce,
  useMemoizedUnique,
  // Stable callbacks
  useStableCallback,
  useStableEventHandler,
  useStableCallbackWithDeps,
  useDebouncedCallback,
  useThrottledCallback,
} from './hooks';

// Common Layer 2 Pattern Components
export * from './common';
export * from './domain';

// StaleIndicator - Indicator for stale data that needs refresh
export * from './stale-indicator';

// ============================================================================
// Loading States & Skeleton UI (NAS-4.16)
// ============================================================================

// Loading patterns - Overlay, spinner, progress, stale data indicators
export * from './loading';

// ============================================================================
// Navigation & Command Palette (NAS-4.10)
// ============================================================================

// Command Palette - Global search and command execution
export * from './command-palette';

// Shortcuts Overlay - Keyboard shortcuts help modal
export * from './shortcuts-overlay';

// Breadcrumb - Navigation path display
export * from './breadcrumb';

// ============================================================================
// Animation System (NAS-4.18)
// ============================================================================

// Motion - Animation provider, presets, and components
// Note: Also available via '@nasnet/ui/patterns/motion' for tree-shaking
export * from './motion';

// ============================================================================
// Error Handling (NAS-4.15)
// ============================================================================

// Error Boundaries - Hierarchical error handling system
export * from './error-boundary';

// Error Card - Inline error display with retry
export * from './error-card';

// Error Page - Full-page error display
export * from './error-page';

// Network Error - Network/connectivity error display
export * from './network-error';

// ============================================================================
// Drift Detection & Resolution (NAS-4.13)
// ============================================================================

// Drift Resolution - Diff viewer and resolution modal
export * from './drift-resolution';

// ============================================================================
// Change Set Components (NAS-4.14)
// ============================================================================

// Change Set Summary - Overview of change set with operation counts
export * from './change-set-summary';

// Change Set Item Card - Individual item display with expand/collapse
export * from './change-set-item-card';

// Apply Progress - Progress visualization during change set application
export * from './apply-progress';

// ============================================================================
// Accessibility (a11y) (NAS-4.17)
// ============================================================================

// Skip Links - Keyboard navigation for screen readers
export * from './skip-links';

// Live Region - ARIA live regions for dynamic announcements
export * from './live-region';

// Focus Management - Focus restoration for modals/dialogs
export {
  useFocusRestore,
  useFocusManagement,
} from './hooks/use-focus-restore';
export type {
  UseFocusRestoreReturn,
  UseFocusRestoreOptions,
  UseFocusManagementOptions,
  UseFocusManagementReturn,
} from './hooks/use-focus-restore';

// Motion Presets - Reduced motion support (also exported from common)
export {
  ANIMATION_DURATIONS,
  REDUCED_MOTION_DURATIONS,
  EASING,
  getTransition,
  getFadeVariants,
  getScaleVariants,
  getSlideVariants,
  getStaggerConfig,
  getHoverAnimation,
  getTapAnimation,
  getPulseVariants,
  getSkeletonVariants,
  getPageTransitionVariants,
  getModalVariants,
  getBackdropVariants,
  getDrawerVariants,
  getCollapseVariants,
  getToastVariants,
} from './common/motion-presets';

// ============================================================================
// Toast/Notification System (NAS-4.19)
// ============================================================================

// ToastProvider - Sonner-based toast provider with notification store integration
export * from './toast-provider';

// ============================================================================
// Undo/Redo History (NAS-4.24)
// ============================================================================

// HistoryPanel - Undo/redo history display with platform presenters
export * from './history-panel';

// ============================================================================
// Sortable / Drag & Drop System (NAS-4.21)
// ============================================================================

// SortableList - Drag and drop reorderable lists
// Note: Also available via '@nasnet/ui/patterns/sortable' for tree-shaking
export * from './sortable';

// ============================================================================
// Clipboard Integration (NAS-4.23)
// ============================================================================

// CopyButton - Button for copying values to clipboard
export { CopyButton } from './copy-button';
export type { CopyButtonProps, CopyButtonVariant } from './copy-button';

// CopyableValue - Inline value display with copy functionality
export { CopyableValue } from './copyable-value';
export type { CopyableValueProps, CopyableValueType } from './copyable-value';

// CodeBlockCopy - Code/config block with copy button
export { CodeBlockCopy } from './code-block-copy';
export type { CodeBlockCopyProps, CodeBlockLanguage } from './code-block-copy';

// PastePreviewModal - Preview modal for paste import validation
export { PastePreviewModal } from './paste-preview-modal';
export type { PastePreviewModalProps } from './paste-preview-modal';

// Clipboard Hooks - Exported from hooks/index.ts
// - useClipboard: Basic clipboard copy with visual feedback
// - useBulkCopy: Multi-item copy with format selection (CSV, JSON, text)
// - usePasteImport: Paste detection and validation for imports

// ============================================================================
// Form Section Component (NAS-4A.13)
// ============================================================================

// FormSection - Consistent form section wrapper with collapsibility
export {
  FormSection,
  FormSectionHeader,
  FormSectionErrors,
  useFormSection,
  slugify,
} from './form-section';
export type {
  FormSectionProps,
  FormSectionHeaderProps,
  FormSectionErrorsProps,
  UseFormSectionConfig,
  UseFormSectionReturn,
} from './form-section';

// ============================================================================
// Safety Confirmation (NAS-4A.11)
// ============================================================================

// SafetyConfirmation - Multi-step confirmation for dangerous operations
// Implements type-to-confirm + countdown timer pattern
export * from './feedback/safety-confirmation';

// ============================================================================
// Network Input Components (NAS-4A.5+)
// ============================================================================

// IP Address Input - Segmented input with auto-advance, validation, type classification
export * from './network-inputs';

// ============================================================================
// Stepper System (NAS-4A.14)
// ============================================================================

// Headless stepper hook, context, and ARIA helpers
// Provides all business logic for step navigation, validation, and state management
// Consumed by stepper UI variants (Vertical, Horizontal, Content, Mini)
export * from './stepper';

// ============================================================================
// Confidence Indicator (NAS-4A.10)
// ============================================================================

// ConfidenceIndicator - Visual confidence level display for auto-detected values
export {
  ConfidenceIndicator,
  ConfidenceIndicatorMobile,
  ConfidenceIndicatorMobileCompact,
  ConfidenceIndicatorDesktop,
  ConfidenceIndicatorDesktopExtended,
  ConfidenceIndicatorBase,
  ConfidenceIndicatorDot,
  ConfidenceLevelLabel,
  ConfidenceTooltipContent,
  ConfidenceTooltipCompact,
  ConfidenceTooltipFull,
  useConfidenceIndicator,
  confidenceIndicatorVariants,
  CONFIDENCE_THRESHOLDS,
  LEVEL_COLORS,
  LEVEL_ICONS,
  LEVEL_LABELS,
} from './confidence-indicator';
export type {
  ConfidenceLevel,
  ConfidenceIndicatorSize,
  ConfidenceIndicatorVariant,
  ConfidenceIndicatorProps,
  ConfidenceIndicatorPresenterProps,
  UseConfidenceIndicatorConfig,
  UseConfidenceIndicatorReturn,
} from './confidence-indicator';

// ============================================================================
// Help System (NAS-4A.12)
// ============================================================================

// FieldHelp - Contextual help with Simple/Technical mode toggle
// Headless hook + Platform Presenters pattern (Popover for desktop, Sheet for mobile)
export * from './help';

// ============================================================================
// Config Preview (NAS-4A.21)
// ============================================================================

// ConfigPreview - RouterOS config preview with syntax highlighting and diff view
// Headless hook + Platform Presenters pattern (Card for desktop, simplified for mobile)
export * from './config-preview';

// ============================================================================
// Device Discovery Card (NAS-4A.20)
// ============================================================================

// DeviceCard - Discovered network device display with type detection and actions
// Headless hook + Platform Presenters pattern (Dropdown for desktop, Sheet for mobile)
export {
  DeviceCard,
  DeviceCardDesktop,
  DeviceCardMobile,
  DeviceCardCompact,
  DeviceCardBase,
  useDeviceCard,
  useDeviceStatusSubscription,
  withDeviceStatusSubscription,
  DEVICE_ICON_MAP,
  CONNECTION_ICON_MAP,
  DEVICE_TYPE_LABELS,
  CONNECTION_TYPE_LABELS,
  CONFIDENCE_THRESHOLD,
  formatMacAddress,
  DEVICE_STATUS_SUBSCRIPTION,
  statusDotVariants,
  statusBadgeVariants,
  connectionBadgeVariants,
  cardVariants,
} from './network/device-card';
export type {
  DeviceType,
  ConnectionType,
  DeviceStatus,
  DiscoveredDevice,
  DeviceCardProps,
  UseDeviceCardConfig,
  UseDeviceCardReturn,
  DeviceCardPresenterProps,
  DeviceCardBaseProps,
  DeviceStatusUpdate,
  UseDeviceStatusSubscriptionConfig,
  UseDeviceStatusSubscriptionReturn,
} from './network/device-card';

// ============================================================================
// Router Status (NAS-4A.22)
// ============================================================================

// RouterStatus - Real-time router connection status display
// Headless hook + Platform Presenters pattern (Card for desktop, Badge + Sheet for mobile)
export {
  RouterStatus,
  RouterStatusDesktop,
  RouterStatusMobile,
  STATUS_TEXT_COLORS,
  STATUS_BG_COLORS,
  useRouterStatus,
  useRouterStatusSubscription,
  ROUTER_STATUS_CHANGED_SUBSCRIPTION,
  STATUS_LABELS,
  DEFAULT_MAX_RECONNECT_ATTEMPTS,
} from './network/router-status';
export type {
  ConnectionStatus,
  ConnectionProtocol,
  RouterStatusProps,
  RouterStatusData,
  UseRouterStatusReturn,
  UseRouterStatusConfig,
  RouterStatusPresenterProps,
  StatusIndicatorProps,
  StatusIndicatorSize,
  RouterStatusEvent,
  SubscriptionRouter,
  UseRouterStatusSubscriptionReturn,
} from './network/router-status';

// ============================================================================
// Network Topology Visualization (NAS-4A.19)
// ============================================================================

// NetworkTopology - Simple SVG network diagram visualization
// Headless hook + Platform Presenters pattern (SVG for desktop, Card list for mobile)
export {
  NetworkTopology,
  NetworkTopologyDesktop,
  NetworkTopologyMobile,
  useNetworkTopology,
  ConnectionPath,
  ConnectionPathStatic,
  TopologyTooltip,
  TopologyTooltipContent,
  RouterIcon,
  WanIcon,
  LanIcon,
  DeviceIcon,
} from './network-topology';
export type {
  NetworkTopologyProps,
  ExtendedNetworkTopologyProps,
  NetworkTopologyDesktopProps,
  NetworkTopologyMobileProps,
  UseNetworkTopologyResult,
  UseNetworkTopologyOptions,
  ConnectionPathProps,
  TopologyTooltipProps,
  RouterIconProps,
  WanIconProps,
  LanIconProps,
  DeviceIconProps,
  DeviceType as TopologyDeviceType,
  RouterInfo,
  WanInterface,
  LanNetwork,
  Device as TopologyDevice,
  TopologyNode,
  TopologyConnection,
  ConnectionPathData,
  TooltipContent as TopologyTooltipContent,
  LayoutConfig,
  NodePosition,
  ContainerDimensions,
} from './network-topology';

// Device List Item - Connected device list item for DHCP leases
export { DeviceListItem } from './device-list-item';
export type {
  DeviceListItemProps,
  DeviceListItemPresenterProps,
  UseDeviceListItemConfig,
  UseDeviceListItemReturn,
} from './device-list-item';
