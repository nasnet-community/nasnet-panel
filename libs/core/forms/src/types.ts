/**
 * Form State Types for NasNetConnect
 *
 * Defines the types used throughout the form system including
 * validation strategies, pipeline stages, and error handling.
 *
 * @module @nasnet/core/forms/types
 */

import type { ZodSchema, z } from 'zod';

/**
 * Risk-based validation strategy.
 *
 * Determines the depth and rigor of validation applied to form data:
 * - `low`: Client-side Zod only (WiFi password, display name)
 * - `medium`: Zod + Backend API (firewall rules, DHCP settings)
 * - `high`: Zod + Backend + Dry-Run + Preview + Confirm (WAN changes, VPN deletion)
 *
 * @see ValidationConfig
 * @see ValidationResult
 */
export type ValidationStrategy = 'low' | 'medium' | 'high';

/**
 * Form field modes for different interaction states.
 *
 * - `editable`: User can modify the field value
 * - `readonly`: Field is displayed but not editable
 * - `hidden`: Field is not displayed to user
 * - `computed`: Value is automatically calculated from other fields
 *
 * @see DynamicFieldProps
 */
export type FieldMode = 'editable' | 'readonly' | 'hidden' | 'computed';

/**
 * 7-Stage validation pipeline stages.
 *
 * Represents the ordered sequence of validation checks executed on form data:
 * - `schema`: Zod schema validation
 * - `syntax`: Syntax and format validation
 * - `cross-resource`: Conflicts with other resources (IPs, ports, names)
 * - `dependencies`: Field dependency validation
 * - `network`: Network connectivity and availability checks
 * - `platform`: Platform-specific rules (RouterOS version, capabilities)
 * - `dry-run`: Actual backend dry-run execution
 *
 * @see ValidationStageResult
 * @see ValidationPipelineResult
 */
export type ValidationStage =
  | 'schema'
  | 'syntax'
  | 'cross-resource'
  | 'dependencies'
  | 'network'
  | 'platform'
  | 'dry-run';

/**
 * Status of a validation stage.
 *
 * Indicates the current state of a validation stage:
 * - `pending`: Stage has not been executed yet
 * - `running`: Stage is currently being executed
 * - `passed`: Stage completed successfully
 * - `failed`: Stage completed with errors
 * - `skipped`: Stage was skipped based on validation strategy
 *
 * @see ValidationStageResult
 */
export type ValidationStageStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

/**
 * Result of a single validation stage.
 *
 * Contains all information about the execution and outcome of a validation stage,
 * including errors, warnings, and performance metrics.
 *
 * @see ValidationStage
 * @see ValidationError
 * @see ValidationWarning
 */
export interface ValidationStageResult {
  /** The validation stage this result belongs to */
  stage: ValidationStage;

  /** Current status of the stage */
  status: ValidationStageStatus;

  /** Blocking errors that occurred during this stage */
  readonly errors: readonly ValidationError[];

  /** Non-blocking warnings from this stage */
  readonly warnings: readonly ValidationWarning[];

  /** Duration of stage execution in milliseconds */
  durationMs?: number;
}

/**
 * Validation error from any stage.
 */
export interface ValidationError {
  code: string;
  message: string;
  fieldPath?: string;
  resourceUuid?: string;
  suggestedFix?: string;
}

/**
 * Validation warning (non-blocking).
 */
export interface ValidationWarning {
  code: string;
  message: string;
  fieldPath?: string;
}

/**
 * Cross-resource conflict.
 */
export interface ResourceConflict {
  type: ConflictType;
  fieldPath: string;
  conflictingResourceUuid: string;
  conflictingResourceName: string;
  currentValue: string;
  conflictingValue: string;
  suggestedFix?: string;
}

/**
 * Type of resource conflict.
 */
export type ConflictType = 'ip' | 'port' | 'vlan' | 'name' | 'other';

/**
 * Complete validation result from the pipeline.
 */
export interface ValidationResult {
  isValid: boolean;
  stages: ValidationStageResult[];
  errors: ValidationError[];
  conflicts: ResourceConflict[];
}

/**
 * Configuration for risk-based validation.
 */
export interface ValidationConfig {
  stages: ValidationStage[];
  clientOnly: boolean;
  requiresConfirmation: boolean;
  confirmationSteps?: ('preview' | 'countdown')[];
}

/**
 * Props for the NasFormProvider component.
 */
export interface NasFormProviderProps<T extends ZodSchema> {
  schema: T;
  defaultValues?: Partial<z.infer<T>>;
  onSubmit: (data: z.infer<T>) => void | Promise<void>;
  onValidationChange?: (result: ValidationResult | null) => void;
  validationStrategy?: ValidationStrategy;
  resourceUuid?: string;
  children: React.ReactNode;
}

/**
 * Options for the useZodForm hook.
 */
export interface UseZodFormOptions<T extends ZodSchema> {
  schema: T;
  defaultValues?: Partial<z.infer<T>>;
  mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'all';
}

/**
 * Options for the useValidationPipeline hook.
 */
export interface UseValidationPipelineOptions<T extends ZodSchema> {
  schema: T;
  strategy: ValidationStrategy;
  resourceUuid?: string;
  enabled?: boolean;
}

/**
 * Return type of useValidationPipeline hook.
 */
export interface ValidationPipelineResult {
  currentStage: number;
  stages: ValidationStageResult[];
  isValid: boolean;
  isValidating: boolean;
  errors: ValidationError[];
  conflicts: ResourceConflict[];
  validate: (data: unknown) => Promise<{ isValid: boolean; errors: ValidationError[] }>;
  reset: () => void;
}

/**
 * Options for the useAsyncValidation hook.
 *
 * Configures asynchronous field validation with debouncing support.
 * Combines synchronous Zod validation with async server-side validation.
 *
 * @template T - Zod schema type for field validation
 *
 * @property schema - Zod schema used for synchronous validation before async validation
 * @property validateFn - Async function that validates the field value and returns error message or null
 * @property debounceMs - Milliseconds to debounce async validation calls (default: 300)
 *
 * @example
 * ```tsx
 * const options: UseAsyncValidationOptions<typeof emailSchema> = {
 *   schema: z.string().email(),
 *   validateFn: async (email) => {
 *     const exists = await checkEmailExists(email);
 *     return exists ? 'Email already registered' : null;
 *   },
 *   debounceMs: 500,
 * };
 * ```
 */
export interface UseAsyncValidationOptions<T extends ZodSchema> {
  schema: T;
  validateFn: (value: unknown) => Promise<string | null>;
  debounceMs?: number;
}

/**
 * Return type of useAsyncValidation hook.
 */
export interface AsyncValidationResult {
  isValidating: boolean;
  error: string | null;
  validate: (value: unknown) => void;
  cancel: () => void;
}

/**
 * Options for the useFormPersistence hook.
 */
export interface UseFormPersistenceOptions {
  storageKey: string;
  storage?: Storage;
  debounceMs?: number;
}

/**
 * Options for the useFormResourceSync hook.
 */
export interface UseFormResourceSyncOptions {
  resourceUuid: string;
  syncOnChange?: boolean;
}
