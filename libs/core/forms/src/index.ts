/**
 * NasNetConnect Forms Library
 *
 * Schema-driven forms with React Hook Form + Zod integration.
 * Provides validation pipeline, network validators, and form utilities.
 *
 * @module @nasnet/core/forms
 */

// Core Components
export { NasFormProvider, useNasFormContext } from './NasFormProvider';

// Core Hooks
export { useZodForm } from './useZodForm';
export type { UseZodFormOptions } from './useZodForm';

export { useValidationPipeline } from './useValidationPipeline';

export { useAsyncValidation } from './useAsyncValidation';

export { useFormPersistence } from './useFormPersistence';
export type {
  UseFormPersistenceOptions,
  UseFormPersistenceResult,
} from './useFormPersistence';

export { useFormResourceSync } from './useFormResourceSync';
export type {
  FormResourceState,
  FormResourceActions,
  UseFormResourceSyncReturn,
} from './useFormResourceSync';

export { useWizardPersistence } from './useWizardPersistence';
export type {
  WizardPersistedState,
  UseWizardPersistenceOptions,
  UseWizardPersistenceReturn,
} from './useWizardPersistence';

// Backend Error Mapping
export {
  mapBackendErrorsToForm,
  clearServerErrors,
  toFormError,
  groupErrorsByField,
  combineFieldErrors,
} from './mapBackendErrors';

// Validation Strategy
export {
  VALIDATION_CONFIGS,
  STAGE_LABELS,
  STAGE_DESCRIPTIONS,
  getValidationConfig,
  shouldRunStage,
  getOrderedStages,
} from './validation-strategy';

// Advanced Validation Pipeline
export {
  ValidationPipeline,
  mapToFormErrors,
  createValidationPipeline,
  VALIDATION_STAGES,
  RISK_LEVEL_STAGES,
} from './validation-pipeline';
export type {
  ValidationPipelineOptions,
  ValidationRequest,
  ValidationResponse,
} from './validation-pipeline';

// Network Validators
export {
  networkValidators,
  ipv4,
  ipv6,
  ipAddress,
  mac,
  cidr,
  cidr6,
  port,
  portString,
  portRange,
  multiPort,
  vlanId,
  vlanIdString,
  wgKey,
  hostname,
  domain,
  interfaceName,
  comment,
  duration,
  bandwidth,
  // Extended validators (NAS-4A.3)
  subnetMask,
  ipWithPort,
  ipRange,
  privateIp,
  publicIp,
  multicastIp,
  loopbackIp,
} from './network-validators';

// Network Utilities (NAS-4A.3)
export {
  // IP manipulation functions
  ipToLong,
  longToIp,
  isInSubnet,
  getNetworkAddress,
  getBroadcastAddress,
  getSubnetMask,
  cidrToSubnetMask,
  subnetMaskToCidr,
  getUsableHostCount,
  getTotalAddressCount,
  getFirstUsableHost,
  getLastUsableHost,
  getSubnetInfo,
  doSubnetsOverlap,
  // IP classification functions
  isPrivateIp,
  isLoopbackIp,
  isMulticastIp,
  isLinkLocalIp,
  isPublicIp,
  classifyIp,
  // Network generation functions
  hasDomesticLink,
  getAvailableBaseNetworks,
  getForeignNetworkNames,
  getDomesticNetworkNames,
  getVPNClientNetworks,
  generateNetworks,
} from './network-utils';

// Network Utility Types (NAS-4A.3)
export type {
  WANLinkType,
  BaseNetworks,
  VPNClientNetworks,
  Networks,
  WANConfig,
  WANLinkGroup,
  WANLinks,
  VPNClientConfig,
  VPNClient,
  SubnetInfo,
} from './network-utils';

// Schema Utilities
export {
  makePartial,
  mergeSchemas,
  pickFields,
  omitFields,
  optionalString,
  requiredString,
  numberFromString,
  booleanFromString,
  conditionalSchema,
} from './schema-utils';
export type { InferSchema, InferInput } from './schema-utils';

// Error Messages with i18n
export {
  createZodErrorMap,
  setGlobalErrorMap,
  formatValidationError,
  DEFAULT_ERROR_MESSAGES,
} from './error-messages';
export type { TranslateFunction } from './error-messages';

// Types
export type {
  ValidationStrategy,
  FieldMode,
  ValidationStage,
  ValidationStageStatus,
  ValidationStageResult,
  ValidationError,
  ValidationWarning,
  ResourceConflict,
  ConflictType,
  ValidationResult,
  ValidationConfig,
  NasFormProviderProps,
  UseValidationPipelineOptions,
  ValidationPipelineResult,
  UseAsyncValidationOptions,
  AsyncValidationResult,
  UseFormResourceSyncOptions,
} from './types';

// Re-export commonly used React Hook Form utilities
export {
  useFormContext,
  useWatch,
  useFieldArray,
  Controller,
  FormProvider,
} from 'react-hook-form';
export type {
  UseFormReturn,
  FieldPath,
  FieldValues,
  UseFormProps,
  UseFormSetError,
  UseFormClearErrors,
  ControllerProps,
  UseFieldArrayReturn,
} from 'react-hook-form';

// Re-export Zod resolver
export { zodResolver } from '@hookform/resolvers/zod';

// Re-export Zod for convenience
export { z } from 'zod';
export type { ZodSchema, ZodObject, ZodError, ZodIssue } from 'zod';
