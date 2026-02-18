// libs/features/diagnostics/src/index.ts

// Components
export * from './components/TroubleshootWizard';
export * from './components/TracerouteTool';
export * from './components/DnsLookupTool';
export * from './components/PingTool';
export * from './components/DeviceScan';
// export * from './components/RouteLookupTool'; // TODO: Component not implemented yet

// Hooks
export * from './hooks';

// GraphQL Operations
export {
  RUN_TRACEROUTE,
  CANCEL_TRACEROUTE,
  TRACEROUTE_PROGRESS_SUBSCRIPTION,
  HOP_PROBE_FRAGMENT,
  TRACEROUTE_HOP_FRAGMENT,
  TRACEROUTE_RESULT_FRAGMENT,
} from './graphql/traceroute.graphql';

// Types
export type {
  DiagnosticStep,
  DiagnosticResult,
  DiagnosticSummary,
  AppliedFix,
  FixSuggestion,
  ISPInfo,
  TroubleshootContext,
  TroubleshootEvent,
} from './types/troubleshoot.types';

// Constants
export { FIX_REGISTRY, getFix } from './constants/fix-registry';

// Utilities
export { detectWanInterface, detectGateway } from './utils/network-detection';
export { detectISP, getWanIpForISPDetection } from './utils/isp-detection';

// Messages
export { TROUBLESHOOT_MESSAGES } from './i18n/troubleshoot-messages';
