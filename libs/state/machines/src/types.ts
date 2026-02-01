/**
 * Shared types for XState machines
 *
 * @see NAS-4.6: Implement Complex Flows with XState
 */

// ===== Wizard Machine Types =====

/**
 * Generic wizard context type
 * @template TData - Type of wizard data collected across steps
 */
export interface WizardContext<TData = Record<string, unknown>> {
  /**
   * Current step number (1-indexed)
   */
  currentStep: number;

  /**
   * Total number of steps in the wizard
   */
  totalSteps: number;

  /**
   * Collected wizard data (partial until completion)
   */
  data: Partial<TData>;

  /**
   * Validation errors by field name
   */
  errors: Record<string, string>;

  /**
   * Unique session ID for persistence
   */
  sessionId: string;

  /**
   * Whether the wizard can skip to arbitrary steps
   * (e.g., when all previous steps are valid)
   */
  canSkip?: boolean;
}

/**
 * Wizard machine events
 * @template TData - Type of wizard data
 */
export type WizardEvent<TData = Record<string, unknown>> =
  | { type: 'NEXT'; data?: Partial<TData> }
  | { type: 'BACK' }
  | { type: 'GOTO'; step: number }
  | { type: 'VALIDATE' }
  | { type: 'SUBMIT' }
  | { type: 'CANCEL' }
  | { type: 'RESTORE'; savedContext: WizardContext<TData> }
  | { type: 'SET_DATA'; data: Partial<TData> }
  | { type: 'CLEAR_ERRORS' };

/**
 * Wizard configuration for creating wizard machines
 * @template TData - Type of wizard data
 */
export interface WizardConfig<TData = Record<string, unknown>> {
  /**
   * Unique machine ID
   */
  id: string;

  /**
   * Total number of steps
   */
  totalSteps: number;

  /**
   * Step validation function
   * @param step - Step number to validate
   * @param data - Current wizard data
   * @returns Object with `valid` boolean and optional `errors` record
   */
  validateStep: (
    step: number,
    data: Partial<TData>
  ) => Promise<{ valid: boolean; errors?: Record<string, string> }>;

  /**
   * Submit handler called when wizard completes
   * @param data - Complete wizard data
   */
  onSubmit: (data: TData) => Promise<void>;

  /**
   * Initial data for the wizard (optional)
   */
  initialData?: Partial<TData>;

  /**
   * Whether to persist wizard state to localStorage
   * @default true
   */
  persist?: boolean;
}

// ===== Config Pipeline Machine Types =====

/**
 * Validation error from validation pipeline
 */
export interface ValidationError {
  /**
   * Field or path that failed validation
   */
  field: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Error severity
   */
  severity: 'error' | 'warning';

  /**
   * Optional error code for programmatic handling
   */
  code?: string;
}

/**
 * Configuration diff for preview
 */
export interface ConfigDiff {
  /**
   * Added configuration entries
   */
  added: Array<{ path: string; value: unknown }>;

  /**
   * Removed configuration entries
   */
  removed: Array<{ path: string; value: unknown }>;

  /**
   * Modified configuration entries
   */
  modified: Array<{
    path: string;
    oldValue: unknown;
    newValue: unknown;
  }>;

  /**
   * Whether the change is considered high-risk
   */
  isHighRisk: boolean;

  /**
   * Risk explanation if high-risk
   */
  riskExplanation?: string;
}

/**
 * Config pipeline context
 */
export interface ConfigPipelineContext<TConfig = unknown> {
  /**
   * Resource ID being configured
   */
  resourceId: string | null;

  /**
   * Original configuration before changes
   */
  originalConfig: TConfig | null;

  /**
   * Pending configuration changes
   */
  pendingConfig: TConfig | null;

  /**
   * Validation errors from validation stage
   */
  validationErrors: ValidationError[];

  /**
   * Configuration diff for preview
   */
  diff: ConfigDiff | null;

  /**
   * Data needed for rollback if apply fails
   */
  rollbackData: TConfig | null;

  /**
   * Timestamp when apply started (for timeout)
   */
  applyStartedAt: number | null;

  /**
   * Error message if in error state
   */
  errorMessage: string | null;
}

/**
 * Config pipeline events
 */
export type ConfigPipelineEvent<TConfig = unknown> =
  | { type: 'EDIT'; config: TConfig }
  | { type: 'VALIDATE' }
  | { type: 'CONFIRM' }
  | { type: 'ACKNOWLEDGED' }
  | { type: 'CANCEL' }
  | { type: 'RETRY' }
  | { type: 'RESET' }
  | { type: 'FORCE_ROLLBACK' };

/**
 * Config pipeline services (for machine invocation)
 */
export interface ConfigPipelineServices<TConfig = unknown> {
  /**
   * Run validation pipeline
   * @returns Validation result with errors and diff
   */
  runValidationPipeline: (config: TConfig) => Promise<{
    errors: ValidationError[];
    diff: ConfigDiff;
  }>;

  /**
   * Apply configuration to router
   * @returns Rollback data for recovery
   */
  applyConfig: (params: {
    resourceId: string;
    config: TConfig;
  }) => Promise<{ rollbackData: TConfig }>;

  /**
   * Verify configuration was applied successfully
   */
  verifyApplied: (resourceId: string) => Promise<void>;

  /**
   * Execute rollback to previous configuration
   */
  executeRollback: (rollbackData: TConfig) => Promise<void>;
}

// ===== VPN Connection Machine Types =====

/**
 * VPN connection metrics
 */
export interface ConnectionMetrics {
  /**
   * Upload speed in bytes per second
   */
  uploadSpeed: number;

  /**
   * Download speed in bytes per second
   */
  downloadSpeed: number;

  /**
   * Total bytes uploaded
   */
  bytesUploaded: number;

  /**
   * Total bytes downloaded
   */
  bytesDownloaded: number;

  /**
   * Connection latency in milliseconds
   */
  latencyMs: number;

  /**
   * Connection uptime in seconds
   */
  uptimeSeconds: number;

  /**
   * Server location (if applicable)
   */
  serverLocation?: string;
}

/**
 * VPN connection context
 */
export interface VPNConnectionContext {
  /**
   * Connection ID (if connected)
   */
  connectionId: string | null;

  /**
   * VPN provider name
   */
  provider: string | null;

  /**
   * Server address
   */
  serverAddress: string | null;

  /**
   * Real-time connection metrics
   */
  metrics: ConnectionMetrics | null;

  /**
   * Error message if in error state
   */
  error: string | null;

  /**
   * Reconnection attempt count
   */
  reconnectAttempts: number;

  /**
   * Maximum reconnection attempts before giving up
   */
  maxReconnectAttempts: number;
}

/**
 * VPN connection events
 */
export type VPNConnectionEvent =
  | { type: 'CONNECT'; serverAddress: string; provider: string }
  | { type: 'DISCONNECT' }
  | { type: 'METRICS_UPDATE'; metrics: ConnectionMetrics }
  | { type: 'CONNECTION_LOST' }
  | { type: 'RETRY' }
  | { type: 'DISMISS' };

// ===== Persistence Types =====

/**
 * Persisted machine state
 */
export interface PersistedMachineState<TContext = unknown> {
  /**
   * Current state value
   */
  state: string;

  /**
   * Machine context
   */
  context: TContext;

  /**
   * Timestamp when state was saved
   */
  timestamp: number;

  /**
   * Machine ID for identification
   */
  machineId: string;
}

/**
 * Session recovery options
 */
export interface SessionRecoveryOptions {
  /**
   * Maximum age of session before it's considered stale (in ms)
   * @default 86400000 (24 hours)
   */
  maxAge?: number;

  /**
   * Whether to prompt user before restoring
   * @default true
   */
  promptBeforeRestore?: boolean;

  /**
   * Callback when session is restored
   */
  onRestore?: () => void;

  /**
   * Callback when session is discarded
   */
  onDiscard?: () => void;
}

// ===== Actor/Process Types =====

/**
 * Concurrent process status
 */
export type ProcessStatus = 'pending' | 'running' | 'success' | 'error' | 'cancelled';

/**
 * Concurrent process for actor model
 */
export interface ConcurrentProcess {
  /**
   * Unique process ID
   */
  id: string;

  /**
   * Process name for display
   */
  name: string;

  /**
   * Current status
   */
  status: ProcessStatus;

  /**
   * Progress percentage (0-100)
   */
  progress: number;

  /**
   * Error message if failed
   */
  error?: string;

  /**
   * Result data if successful
   */
  result?: unknown;
}
