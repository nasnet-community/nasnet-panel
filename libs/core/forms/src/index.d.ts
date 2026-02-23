/**
 * NasNetConnect Forms Library
 *
 * Schema-driven forms with React Hook Form + Zod integration.
 * Provides validation pipeline, network validators, and form utilities.
 *
 * @module @nasnet/core/forms
 */
export { NasFormProvider, useNasFormContext } from './NasFormProvider';
export { useZodForm } from './useZodForm';
export type { UseZodFormOptions } from './useZodForm';
export { useValidationPipeline } from './useValidationPipeline';
export { useAsyncValidation } from './useAsyncValidation';
export { useFormPersistence } from './useFormPersistence';
export type { UseFormPersistenceOptions, UseFormPersistenceResult, } from './useFormPersistence';
export { useFormResourceSync } from './useFormResourceSync';
export type { UseFormResourceSyncOptions, FormResourceState, FormResourceActions, UseFormResourceSyncReturn, } from './useFormResourceSync';
export { useWizardPersistence } from './useWizardPersistence';
export type { WizardPersistedState, UseWizardPersistenceOptions, UseWizardPersistenceReturn, } from './useWizardPersistence';
export { mapBackendErrorsToForm, clearServerErrors, toFormError, groupErrorsByField, combineFieldErrors, } from './mapBackendErrors';
export { VALIDATION_CONFIGS, STAGE_LABELS, STAGE_DESCRIPTIONS, getValidationConfig, shouldRunStage, getOrderedStages, } from './validation-strategy';
export { ValidationPipeline, mapToFormErrors, createValidationPipeline, VALIDATION_STAGES, RISK_LEVEL_STAGES, } from './validation-pipeline';
export type { ValidationPipelineOptions, ValidationRequest, ValidationResponse, } from './validation-pipeline';
export { networkValidators, ipv4, ipv6, ipAddress, mac, cidr, cidr6, port, portString, portRange, multiPort, vlanId, vlanIdString, wgKey, hostname, domain, interfaceName, comment, duration, bandwidth, subnetMask, ipWithPort, ipRange, privateIp, publicIp, multicastIp, loopbackIp, } from './network-validators';
export { ipToLong, longToIp, isInSubnet, getNetworkAddress, getBroadcastAddress, getSubnetMask, cidrToSubnetMask, subnetMaskToCidr, getUsableHostCount, getTotalAddressCount, getFirstUsableHost, getLastUsableHost, getSubnetInfo, doSubnetsOverlap, isPrivateIp, isLoopbackIp, isMulticastIp, isLinkLocalIp, isPublicIp, classifyIp, hasDomesticLink, getAvailableBaseNetworks, getForeignNetworkNames, getDomesticNetworkNames, getVPNClientNetworks, generateNetworks, } from './network-utils';
export type { WANLinkType, BaseNetworks, VPNClientNetworks, Networks, WANConfig, WANLinkGroup, WANLinks, VPNClientConfig, VPNClient, SubnetInfo, } from './network-utils';
export { makePartial, mergeSchemas, pickFields, omitFields, optionalString, requiredString, numberFromString, booleanFromString, conditionalSchema, } from './schema-utils';
export type { InferSchema, InferInput } from './schema-utils';
export { createZodErrorMap, setGlobalErrorMap, formatValidationError, DEFAULT_ERROR_MESSAGES, } from './error-messages';
export type { TranslateFunction } from './error-messages';
export type { ValidationStrategy, FieldMode, ValidationStage, ValidationStageStatus, ValidationStageResult, ValidationError, ValidationWarning, ResourceConflict, ConflictType, ValidationResult, ValidationConfig, NasFormProviderProps, UseValidationPipelineOptions, ValidationPipelineResult, UseAsyncValidationOptions, AsyncValidationResult, } from './types';
export { useFormContext, useWatch, useFieldArray, Controller, FormProvider, } from 'react-hook-form';
export type { UseFormReturn, FieldPath, FieldValues, UseFormProps, UseFormSetError, UseFormClearErrors, ControllerProps, UseFieldArrayReturn, } from 'react-hook-form';
export { zodResolver } from '@hookform/resolvers/zod';
export { z } from 'zod';
export type { ZodSchema, ZodObject, ZodError, ZodIssue } from 'zod';
//# sourceMappingURL=index.d.ts.map