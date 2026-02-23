/**
 * @fileoverview Core utilities library
 *
 * Provides utility functions and helpers for:
 * - Network validation and manipulation (IPv4, CIDR, MAC addresses)
 * - Data formatting (dates, sizes, bandwidth, durations)
 * - Status calculation and theming
 * - Runtime validation schemas (Zod)
 * - React hooks and profiling tools
 * - Log export utilities
 * - Graph utilities for dependency resolution
 * - Device and firewall utilities
 * - MAC vendor lookup
 *
 * @example
 * ```typescript
 * import {
 *   formatBytes,
 *   isValidIPv4,
 *   calculateStatus,
 *   ipAddressSchema,
 *   ProfilerWrapper,
 * } from '@nasnet/core/utils';
 * ```
 */

// Network utilities
export {
  isValidIPv4,
  isValidSubnet,
  ipToNumber,
  numberToIP,
  parseCIDR,
  compareIPv4,
  isValidMACAddress,
  isIPInSubnet,
  getHostCount,
  getFirstHost,
  getLastHost,
  getPrefixMask,
  getMaskPrefix,
  isValidMask,
  getSubnetInfo,
} from './network/ip';

// Validation schemas
export {
  ipAddressSchema,
  cidrSchema,
  portSchema,
  macAddressSchema,
  routerConnectionConfigSchema,
  wanConfigSchema,
  lanConfigSchema,
  vpnConfigSchema,
  firewallRuleSchema,
  routerStatusRequestSchema,
  routerStatusResponseSchema,
  appConfigSchema,
  userPreferencesSchema,
} from './validation/index';

// Formatters (includes formatMACAddress)
export {
  formatDate,
  formatDateTime,
  formatDuration,
  formatUptime,
  parseRouterOSUptime,
  formatBytes,
  formatPercent,
  formatNumber,
  formatBandwidth,
  formatMAC,
  truncateText,
  formatBoolean,
  formatLeaseTime,
  formatExpirationTime,
  formatMACAddress,
  formatPublicKey,
  formatLastHandshake,
  formatTimestamp,
} from './formatters/index';

// Status Calculators
export { calculateStatus, getStatusColor } from './status/calculateStatus';

// React Hooks
export { useRelativeTime } from './hooks/useRelativeTime';
export { useAutoScroll } from './hooks/useAutoScroll';
export { useReducedMotion } from './hooks/useReducedMotion';

// Log Export Utilities
export {
  logsToCSV,
  logsToJSON,
  downloadFile,
  exportLogsToCSV,
  exportLogsToJSON,
} from './log-export';

// Graph Utilities (Dependency Resolution)
export type {
  DependencyNode,
  TopologicalSortResult,
  CycleDetectionResult,
  DependencyAnalysis,
  DependencyValidationResult,
} from './graph/dependency-graph';
export {
  topologicalSort,
  reverseOrder,
  detectCycles,
  analyzeDependencies,
  getParallelApplicableNodes,
  validateDependencyGraph,
  buildDependencyGraph,
  computeApplyOrder,
} from './graph/dependency-graph';

// Device Utilities
export * from './device/deviceTypeDetection';

// MAC Vendor Lookup
export { lookupVendor, isValidMac, formatMac } from './mac-vendor/macVendorLookup';
export { OUI_DATABASE } from './mac-vendor/oui-database';

// Firewall Utilities
export {
  parseFirewallLogMessage,
  inferActionFromPrefix,
  isValidParsedLog,
} from './firewall/parse-firewall-log';
