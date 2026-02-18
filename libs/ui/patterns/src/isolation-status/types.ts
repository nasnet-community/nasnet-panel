/**
 * Isolation Status Types
 *
 * Type definitions for the IsolationStatus component and its hooks.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/isolation-status
 */

import type { IsolationStatus as GraphQLIsolationStatus, IsolationViolation, ResourceLimits, SetResourceLimitsInput } from '@nasnet/api-client/generated';

/**
 * Isolation health classification (UI-friendly version)
 */
export type IsolationHealth = 'healthy' | 'warning' | 'critical' | 'unknown';

/**
 * Size variants for the isolation status component
 */
export type IsolationStatusSize = 'sm' | 'md' | 'lg';

/**
 * Variant for platform-specific or forced rendering
 */
export type IsolationStatusVariant = 'auto' | 'mobile' | 'desktop';

/**
 * Configuration for the useIsolationStatus hook
 */
export interface UseIsolationStatusConfig {
  /**
   * Isolation data from GraphQL (IsolationStatus type)
   */
  isolation: GraphQLIsolationStatus | null | undefined;

  /**
   * Service instance ID
   */
  instanceId: string;

  /**
   * Router ID
   */
  routerId: string;

  /**
   * Callback when isolation health changes
   */
  onHealthChange?: (health: IsolationHealth) => void;

  /**
   * Whether to show resource limits
   * @default true
   */
  showResourceLimits?: boolean;

  /**
   * Whether to allow editing resource limits
   * @default false
   */
  allowEdit?: boolean;
}

/**
 * Computed violation with UI metadata
 */
export interface ViolationDisplay {
  /**
   * Original violation data
   */
  violation: IsolationViolation;

  /**
   * Semantic color for the severity
   */
  color: 'destructive' | 'warning' | 'muted';

  /**
   * Icon name for the violation layer
   */
  icon: string;

  /**
   * Short description of the layer
   */
  layerLabel: string;
}

/**
 * Return value from the useIsolationStatus hook
 */
export interface UseIsolationStatusReturn {
  /**
   * Overall isolation health
   */
  health: IsolationHealth;

  /**
   * Semantic color name for styling (success, destructive, warning, muted)
   */
  color: 'success' | 'destructive' | 'warning' | 'muted';

  /**
   * Icon component name from lucide-react
   */
  iconName: 'ShieldCheck' | 'ShieldAlert' | 'ShieldX' | 'ShieldQuestion';

  /**
   * Formatted timestamp (e.g., "Checked 2 minutes ago")
   */
  timestamp: string | null;

  /**
   * List of violations with display metadata
   */
  violations: ViolationDisplay[];

  /**
   * Current resource limits
   */
  resourceLimits: ResourceLimits | null;

  /**
   * Whether resource limit editing is in progress
   */
  isSaving: boolean;

  /**
   * Handler for saving resource limits
   */
  handleSaveLimits: (limits: SetResourceLimitsInput) => Promise<void>;

  /**
   * Handler for refreshing isolation status
   */
  handleRefresh: () => Promise<void>;

  /**
   * Accessible ARIA label describing the isolation state
   */
  ariaLabel: string;

  /**
   * Human-readable label for the health status
   */
  healthLabel: string;

  /**
   * Whether to show resource limits section
   */
  showResourceLimits: boolean;

  /**
   * Whether resource limits can be edited
   */
  allowEdit: boolean;

  /**
   * Total violation count
   */
  violationCount: number;

  /**
   * Critical violation count
   */
  criticalCount: number;

  /**
   * Warning violation count
   */
  warningCount: number;
}

/**
 * Props for the IsolationStatus component
 */
export interface IsolationStatusProps extends UseIsolationStatusConfig {
  /**
   * Size of the component
   * @default 'md'
   */
  size?: IsolationStatusSize;

  /**
   * Force a specific variant (overrides auto-detection)
   * @default 'auto'
   */
  variant?: IsolationStatusVariant;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Optional ID for the component (used for aria-describedby)
   */
  id?: string;
}

/**
 * Props for platform-specific presenter components
 */
export interface IsolationStatusPresenterProps {
  /**
   * Computed state from the headless hook
   */
  state: UseIsolationStatusReturn;

  /**
   * Size of the component
   */
  size: IsolationStatusSize;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Optional ID for the component
   */
  id?: string;
}
