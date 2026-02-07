/**
 * RouteForm Component Types
 * NAS-6.5: Static Route Management
 */

import type { RouteFormData } from './route-form.schema';

/**
 * Gateway reachability check result
 */
export interface ReachabilityInfo {
  checking: boolean;
  reachable: boolean | null;
  latency?: number;
  interface?: string;
  message?: string;
}

/**
 * Interface option for selector
 */
export interface InterfaceOption {
  id: string;
  name: string;
  type?: string;
  disabled?: boolean;
}

/**
 * Form mode: create new or edit existing
 */
export type FormMode = 'create' | 'edit';

/**
 * Props for RouteForm component (both Desktop and Mobile)
 */
export interface RouteFormProps {
  /** Form mode */
  mode: FormMode;
  /** Initial values (for edit mode) */
  initialValues?: Partial<RouteFormData>;
  /** Router ID for reachability checking */
  routerId: string;
  /** Available interfaces for selection */
  interfaces: InterfaceOption[];
  /** Available routing tables */
  availableTables?: string[];
  /** Loading state during form submission */
  loading?: boolean;
  /** Callback when form is submitted */
  onSubmit: (data: RouteFormData) => Promise<void> | void;
  /** Callback to cancel/close form */
  onCancel?: () => void;
}
