/**
 * Template Preview Types
 *
 * Types for the TemplatePreview pattern component.
 * Provides template variable editing and rule preview.
 */
import { z } from 'zod';
export type { FirewallTemplate, TemplateVariable, TemplateRule, TemplatePreviewResult, TemplateConflict, ImpactAnalysis, VariableType, } from '@nasnet/core/types';
import type { TemplateVariable, VariableType } from '@nasnet/core/types';
/**
 * Template variable values (key-value pairs)
 */
export type TemplateVariableValues = Record<string, string>;
/**
 * Variable validation error
 */
export interface VariableValidationError {
    variableName: string;
    message: string;
}
/**
 * Preview mode
 */
export type PreviewMode = 'variables' | 'rules' | 'conflicts' | 'impact';
/**
 * Preview tab configuration
 */
export interface PreviewTab {
    id: PreviewMode;
    label: string;
    icon?: string;
    disabled?: boolean;
}
/**
 * Validate IPv4 address format
 */
export declare function isValidIPv4(value: string): boolean;
/**
 * Validate CIDR subnet format
 */
export declare function isValidCIDR(value: string): boolean;
/**
 * Validate port number
 */
export declare function isValidPort(value: number | string): boolean;
/**
 * Validate VLAN ID
 */
export declare function isValidVLAN(value: number | string): boolean;
/**
 * Zod schema for STRING variable type
 */
export declare const StringVariableSchema: z.ZodString;
/**
 * Zod schema for INTERFACE variable type
 */
export declare const InterfaceVariableSchema: z.ZodString;
/**
 * Zod schema for SUBNET variable type
 */
export declare const SubnetVariableSchema: z.ZodEffects<z.ZodString, string, string>;
/**
 * Zod schema for IP variable type
 */
export declare const IPVariableSchema: z.ZodEffects<z.ZodString, string, string>;
/**
 * Zod schema for PORT variable type
 */
export declare const PortVariableSchema: z.ZodEffects<z.ZodString, string, string>;
/**
 * Zod schema for VLAN_ID variable type
 */
export declare const VLANVariableSchema: z.ZodEffects<z.ZodString, string, string>;
/**
 * Get Zod schema for a variable type
 */
export declare function getVariableSchema(variableType: VariableType): z.ZodSchema;
/**
 * Create a dynamic Zod schema for template variables
 */
export declare function createTemplateVariablesSchema(variables: TemplateVariable[]): z.ZodObject<Record<string, z.ZodSchema>>;
//# sourceMappingURL=template-preview.types.d.ts.map