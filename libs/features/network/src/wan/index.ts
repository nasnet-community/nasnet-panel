/**
 * WAN Feature Module - Public API
 *
 * Barrel export for all WAN-related components, hooks, and types.
 * Story: NAS-6.8 - Implement WAN Link Configuration
 */

// Pages
export { WANManagementPage } from './pages/WANManagementPage';

// Components - Overview
export { WANOverviewList } from './components/wan-overview/WANOverviewList';
export { WANCard, WANCardCompact } from './components/wan-card/WANCard';

// Components - Configuration Forms
export { DhcpClientForm } from './components/wan-configuration/DhcpClientForm';
export { PppoeWizard } from './components/wan-configuration/PppoeWizard';
export { StaticIPForm } from './components/wan-configuration/StaticIPForm';
export { HealthCheckForm } from './components/wan-configuration/HealthCheckForm';
export { LteModemForm } from './components/wan-configuration/LteModemForm';

// Components - Connection History
export { ConnectionHistoryTable } from './components/wan-history/ConnectionHistoryTable';
export {
  ConnectionEventCard,
  ConnectionEventCardCompact,
} from './components/wan-history/ConnectionEventCard';

// Hooks
export {
  useWANStatusSubscription,
  useWANHealthSubscription,
  useWANSubscription,
  getHealthStatusColor,
  getConnectionStatusColor,
} from './hooks/useWANSubscription';

export {
  useConnectionHistory,
  generateMockConnectionHistory,
  type UseConnectionHistoryOptions,
  type ConnectionHistoryResult,
} from './hooks/useConnectionHistory';

// Types
export type {
  WANInterfaceData,
  WANConnectionType,
  WANStatus,
  WANHealthStatus,
  DhcpClientData,
  PppoeClientData,
  StaticIPConfigData,
  LteModemData,
  ConnectionEventData,
} from './types/wan.types';

// Schemas
export {
  dhcpClientSchema,
  dhcpClientDefaultValues,
  type DhcpClientFormValues,
} from './schemas/dhcp-client.schema';

export {
  pppoeInterfaceStepSchema,
  pppoeCredentialsStepSchema,
  pppoeOptionsStepSchema,
  pppoeClientSchema,
  MTU_PRESETS,
  type PppoeInterfaceStepFormValues,
  type PppoeCredentialsStepFormValues,
  type PppoeOptionsStepFormValues,
  type PppoeClientFormValues,
} from './schemas/pppoe-client.schema';

export {
  staticIPSchema,
  staticIPDefaultValues,
  DNS_PRESETS,
  SUBNET_PRESETS,
  type StaticIPFormValues,
} from './schemas/static-ip.schema';

export {
  healthCheckSchema,
  healthCheckDefaultValues,
  HEALTH_CHECK_TARGETS,
  INTERVAL_PRESETS,
  validateTimeoutInterval,
  type HealthCheckFormValues,
} from './schemas/health-check.schema';

export {
  lteModemSchema,
  lteModemDefaultValues,
  APN_PRESETS,
  SIGNAL_STRENGTH_RANGES,
  LTE_NETWORK_MODES,
  getSignalStrength,
  validateAPN,
  validatePIN,
  type LteModemFormValues,
} from './schemas/lte-modem.schema';
