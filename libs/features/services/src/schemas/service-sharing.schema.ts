/**
 * Service Sharing Validation Schemas
 *
 * @description
 * Zod schemas for service export/import validation. Provides client-side
 * validation for all service sharing operations including export configuration,
 * import package structure, and redacted field value entry. All schemas follow
 * WCAG AAA accessibility and professional error messaging standards.
 *
 * @module @nasnet/features/services/schemas
 */

import { z } from 'zod';

// ============================================
// EXPORT SCHEMAS
// ============================================

/**
 * Schema for service export configuration
 *
 * @example
 * ```ts
 * const exportConfig = exportServiceSchema.parse({
 *   routerID: 'router-1',
 *   instanceID: 'instance-123',
 *   redactSecrets: true,
 *   includeRoutingRules: true,
 * });
 * ```
 */
export const exportServiceSchema = z.object({
  routerID: z.string().min(1, 'Router ID is required'),
  instanceID: z.string().min(1, 'Instance ID is required'),
  redactSecrets: z.boolean().default(true),
  includeRoutingRules: z.boolean().default(false),
});

export type ExportServiceFormData = z.infer<typeof exportServiceSchema>;

/**
 * Schema for QR code generation configuration
 *
 * @example
 * ```ts
 * const qrConfig = generateQRSchema.parse({
 *   routerID: 'router-1',
 *   instanceID: 'instance-123',
 *   redactSecrets: true,
 *   includeRoutingRules: false,
 *   imageSize: 512,
 * });
 * ```
 */
export const generateQRSchema = z.object({
  routerID: z.string().min(1, 'Router ID is required'),
  instanceID: z.string().min(1, 'Instance ID is required'),
  redactSecrets: z.boolean().default(true),
  includeRoutingRules: z.boolean().default(false),
  imageSize: z.number().int().min(128).max(1024).optional().default(256),
});

export type GenerateQRFormData = z.infer<typeof generateQRSchema>;

// ============================================
// IMPORT SCHEMAS
// ============================================

/**
 * Schema for validating imported service package structure
 * Validates the JSON structure before sending to backend
 */
export const importPackageSchema = z.object({
  version: z.literal('1.0'),
  exportedAt: z.string().datetime(),
  exportedBy: z.string().min(1),
  sourceRouter: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  service: z.object({
    featureID: z.string().min(1, 'Feature ID is required'),
    instanceName: z.string().min(1, 'Instance name is required'),
    config: z.record(z.unknown()),
    ports: z.array(z.number().int()).optional(),
    vlanID: z.number().int().optional(),
    bindIP: z.string().optional(),
  }),
  routingRules: z
    .array(
      z.object({
        deviceMAC: z.string(),
        deviceName: z.string().optional(),
        mode: z.enum(['direct', 'through_service', 'blocked']),
      })
    )
    .optional(),
  redactedFields: z.array(z.string()).optional(),
});

export type ImportPackageData = z.infer<typeof importPackageSchema>;

/**
 * Schema for import service configuration input
 *
 * @example
 * ```ts
 * const importConfig = importServiceSchema.parse({
 *   routerID: 'router-1',
 *   package: importedJSON,
 *   dryRun: true,
 * });
 * ```
 */
export const importServiceSchema = z.object({
  routerID: z.string().min(1, 'Router ID is required'),
  package: importPackageSchema,
  dryRun: z.boolean().default(true),
  conflictResolution: z.enum(['skip', 'rename', 'replace']).optional(),
  deviceFilter: z.array(z.string()).optional(),
  redactedFieldValues: z.record(z.string()).optional(),
});

export type ImportServiceFormData = z.infer<typeof importServiceSchema>;

/**
 * Schema for redacted field values
 * Used when user provides values for redacted secrets
 *
 * @example
 * ```ts
 * const redactedValues = redactedFieldValuesSchema.parse({
 *   password: 'new-password',
 *   apiKey: 'new-api-key',
 * });
 * ```
 */
export const redactedFieldValuesSchema = z.record(z.string().min(1, 'Field value cannot be empty'));

export type RedactedFieldValuesData = z.infer<typeof redactedFieldValuesSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validates if a string is valid JSON
 * @param value - String to validate
 * @returns true if valid JSON
 */
export function isValidJSON(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a JSON string matches the import package schema
 * @param jsonString - JSON string to validate
 * @returns Validation result with parsed data or errors
 */
export function validateImportPackageJSON(jsonString: string): {
  valid: boolean;
  data?: ImportPackageData;
  errors?: z.ZodError;
} {
  if (!isValidJSON(jsonString)) {
    return {
      valid: false,
      errors: new z.ZodError([
        {
          code: 'custom',
          path: ['package'],
          message: 'Invalid JSON format',
        },
      ]),
    };
  }

  try {
    const parsed = JSON.parse(jsonString);
    const data = importPackageSchema.parse(parsed);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error };
    }
    return {
      valid: false,
      errors: new z.ZodError([
        {
          code: 'custom',
          path: ['package'],
          message: 'Failed to validate package structure',
        },
      ]),
    };
  }
}

// ============================================
// EXPORTS
// ============================================

export { z as zodValidator };
