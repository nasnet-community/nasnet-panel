/**
 * @nasnet/state/machines
 *
 * XState machines for complex multi-step workflows.
 *
 * State Management Decision Tree:
 * - Data from router/backend → Apollo Client (GraphQL)
 * - Complex multi-step workflows → XState (this package)
 * - Form state → React Hook Form
 * - Global UI state → Zustand
 *
 * Machines Available:
 * - Wizard Machine: Multi-step wizard flows with validation
 * - Config Pipeline Machine: Safety-first configuration changes
 * - VPN Connection Machine: VPN lifecycle management
 * - Change Set Machine: Atomic multi-resource operations with rollback
 *
 * @see NAS-4.6: Implement Complex Flows with XState
 * @see ADR-002: State Management Strategy
 */

// ===== Types =====
export type {
  // Wizard types
  WizardContext,
  WizardEvent,
  WizardConfig,

  // Config pipeline types
  ValidationError,
  ConfigDiff,
  ConfigPipelineContext,
  ConfigPipelineEvent,
  ConfigPipelineServices,

  // VPN connection types
  ConnectionMetrics,
  VPNConnectionContext,
  VPNConnectionEvent,

  // Persistence types
  PersistedMachineState,
  SessionRecoveryOptions,

  // Actor/Process types
  ProcessStatus,
  ConcurrentProcess,
} from './types';

// ===== Persistence Utilities =====
export {
  STORAGE_KEY_PREFIX,
  SESSION_TIMEOUT_MS,
  persistMachineState,
  restoreMachineState,
  clearMachineState,
  hasSavedSession,
  getSessionAge,
  clearAllMachineStates,
  cleanupStaleSessions,
  getSavedMachineIds,
  formatSessionAge,
  createSessionRecoveryOptions,
} from './persistence';

// ===== Wizard Machine =====
export {
  createWizardMachine,
  createWizardMachineV2,
} from './wizardMachine';

// ===== Config Pipeline Machine =====
export {
  createConfigPipelineMachine,
  createSimpleConfigPipelineMachine,
  isPipelineFinal,
  isPipelineCancellable,
  isPipelineProcessing,
  getPipelineStateDescription,
} from './configPipelineMachine';
export type {
  ConfigPipelineConfig,
  ConfigPipelineState,
} from './configPipelineMachine';

// ===== VPN Connection Machine =====
export {
  createVPNConnectionMachine,
  useVPNConnection,
} from './vpnConnectionMachine';
export type {
  VPNConnectionServices,
  UseVPNConnectionReturn,
} from './vpnConnectionMachine';

// ===== React Hooks =====
export {
  useWizard,
  useWizardSession,
} from './hooks/useWizard';
export type {
  UseWizardReturn,
  UseWizardOptions,
} from './hooks/useWizard';

export {
  useConfigPipeline,
  useQuickConfigPipeline,
} from './hooks/useConfigPipeline';
export type {
  UseConfigPipelineReturn,
  UseConfigPipelineOptions,
} from './hooks/useConfigPipeline';

// ===== Resource Lifecycle Machine =====
export {
  createResourceLifecycleMachine,
  isResourcePending,
  isResourceActive,
  isResourceEditable,
  isResourceAppliable,
  isResourceTerminal,
  getResourceStateDisplayInfo,
} from './resourceLifecycleMachine';
export type {
  ResourceLifecycleContext,
  ResourceLifecycleEvent,
  ResourceLifecycleConfig,
  ResourceLifecycleStateValue,
} from './resourceLifecycleMachine';

export {
  useResourceLifecycle,
  useResourceLifecycleWithApollo,
} from './hooks/useResourceLifecycle';
export type {
  UseResourceLifecycleOptions,
  UseResourceLifecycleResult,
} from './hooks/useResourceLifecycle';

// ===== Change Set Machine =====
export {
  createChangeSetMachine,
  isChangeSetProcessing,
  isChangeSetFinal,
  isChangeSetCancellable,
  getChangeSetMachineStateDescription,
} from './changeSetMachine';
export type {
  ChangeSetMachineContext,
  ChangeSetMachineEvent,
  ChangeSetProgressEvent,
  ChangeSetMachineConfig,
  ChangeSetMachineStateValue,
} from './changeSetMachine';
