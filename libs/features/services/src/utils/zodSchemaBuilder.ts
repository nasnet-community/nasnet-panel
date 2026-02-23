import { z } from 'zod';
import type { ConfigSchema, ConfigSchemaField } from '@nasnet/api-client/generated';

/**
 * Builds a Zod schema from a backend ConfigSchema for dynamic form validation
 *
 * Converts backend ConfigSchema (with ConfigFieldType enum) into a Zod validation schema
 * for use with React Hook Form. Error messages are localized via i18n.
 *
 * This utility handles all standard field types: TEXT, PASSWORD, EMAIL, URL, NUMBER,
 * TOGGLE, SELECT, MULTI_SELECT, TEXT_ARRAY, IP, PORT, and PATH. Each field type
 * receives appropriate validation rules (length, range, format, options).
 *
 * @param configSchema - The configuration schema from the backend
 * @returns A Zod object schema for validation
 *
 * @example
 * ```tsx
 * function ConfigureService() {
 *   const { t } = useTranslation();
 *   const schema = useServiceConfigSchema('tor');
 *   const zodSchema = buildZodSchema(schema);
 *
 *   const form = useForm({
 *     resolver: zodResolver(zodSchema),
 *     defaultValues: schema.fields.reduce((acc, field) => ({
 *       ...acc,
 *       [field.name]: field.defaultValue
 *     }), {})
 *   });
 *
 *   return <form><RHFFormField form={form} {...field} /></form>;
 * }
 * ```
 *
 * @see useServiceConfigSchema - Hook to fetch schema from backend
 * @see evaluateCondition - For field visibility conditions
 */
export function buildZodSchema(configSchema: ConfigSchema): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of configSchema.fields) {
    let fieldSchema = buildFieldSchema(field);

    // Apply required/optional
    if (!field.required) {
      fieldSchema = fieldSchema.optional();
    }

    shape[field.name] = fieldSchema;
  }

  return z.object(shape);
}

/**
 * Builds a Zod schema for a single configuration field
 */
function buildFieldSchema(field: ConfigSchemaField): z.ZodTypeAny {
  switch (field.type as string) {
    case 'TEXT':
      return buildTextSchema(field);

    case 'TEXT_AREA':
      return buildTextSchema(field);

    case 'PASSWORD':
      return buildPasswordSchema(field);

    case 'EMAIL':
      return buildEmailSchema(field);

    case 'URL':
      return buildUrlSchema(field);

    case 'NUMBER':
      return buildNumberSchema(field);

    case 'TOGGLE':
      return z.boolean();

    case 'SELECT':
      return buildSelectSchema(field);

    case 'MULTI_SELECT':
      return buildMultiSelectSchema(field);

    case 'TEXT_ARRAY':
      return buildTextArraySchema(field);

    case 'IP':
      return buildIpAddressSchema(field);

    case 'PORT':
      return buildPortSchema(field);

    case 'PATH':
      return buildFilePathSchema(field);

    default:
      // Fallback to string for unknown types
      return z.string();
  }
}

/**
 * Build schema for TEXT and TEXT_AREA fields
 */
function buildTextSchema(field: ConfigSchemaField): z.ZodString {
  let schema = z.string();
  const pattern = (field as any).pattern as string | undefined;

  if (pattern) {
    schema = schema.regex(
      new RegExp(pattern),
      field.description
        ? `${field.description} (invalid format)`
        : 'Invalid format'
    );
  }

  if (field.min !== null && field.min !== undefined) {
    schema = schema.min(
      field.min as number,
      `Minimum length is ${field.min} characters`
    );
  }

  if (field.max !== null && field.max !== undefined) {
    schema = schema.max(
      field.max as number,
      `Maximum length is ${field.max} characters`
    );
  }

  return schema;
}

/**
 * Build schema for PASSWORD fields
 */
function buildPasswordSchema(field: ConfigSchemaField): z.ZodString {
  let schema = z.string();
  const pattern = (field as any).pattern as string | undefined;

  const minLength = (field.min as number) || 8;
  schema = schema.min(minLength, `Password must be at least ${minLength} characters`);

  if (field.max !== null && field.max !== undefined) {
    schema = schema.max(
      field.max as number,
      `Password must be at most ${field.max} characters`
    );
  }

  if (pattern) {
    schema = schema.regex(
      new RegExp(pattern),
      'Password does not meet complexity requirements'
    );
  }

  return schema;
}

/**
 * Build schema for EMAIL fields
 */
function buildEmailSchema(field: ConfigSchemaField): z.ZodString {
  return z.string().email('Invalid email address');
}

/**
 * Build schema for URL fields
 */
function buildUrlSchema(field: ConfigSchemaField): z.ZodString {
  return z.string().url('Invalid URL format');
}

/**
 * Build schema for NUMBER fields
 */
function buildNumberSchema(field: ConfigSchemaField): z.ZodNumber {
  let schema = z.number();

  if (field.min !== null && field.min !== undefined) {
    schema = schema.min(
      field.min as number,
      `Minimum value is ${field.min}`
    );
  }

  if (field.max !== null && field.max !== undefined) {
    schema = schema.max(
      field.max as number,
      `Maximum value is ${field.max}`
    );
  }

  return schema;
}

/**
 * Build schema for SELECT fields
 */
function buildSelectSchema(field: ConfigSchemaField): z.ZodEnum<any> {
  if (!field.options || field.options.length === 0) {
    throw new Error(`SELECT field "${field.name}" must have options`);
  }

  // Extract values from options (handles both string[] and {value, label}[] formats)
  const values = field.options.map((opt: any) =>
    typeof opt === 'string' ? opt : opt.value
  );

  return z.enum(values as [string, ...string[]]);
}

/**
 * Build schema for MULTI_SELECT fields
 */
function buildMultiSelectSchema(field: ConfigSchemaField): z.ZodArray<any> {
  if (!field.options || field.options.length === 0) {
    throw new Error(`MULTI_SELECT field "${field.name}" must have options`);
  }

  const values = field.options.map((opt: any) =>
    typeof opt === 'string' ? opt : opt.value
  );

  const enumSchema = z.enum(values as [string, ...string[]]);
  let arraySchema = z.array(enumSchema);

  if (field.min !== null && field.min !== undefined) {
    arraySchema = arraySchema.min(
      field.min as number,
      `Select at least ${field.min} option${field.min === 1 ? '' : 's'}`
    );
  }

  if (field.max !== null && field.max !== undefined) {
    arraySchema = arraySchema.max(
      field.max as number,
      `Select at most ${field.max} option${field.max === 1 ? '' : 's'}`
    );
  }

  return arraySchema;
}

/**
 * Build schema for TEXT_ARRAY fields
 */
function buildTextArraySchema(field: ConfigSchemaField): z.ZodArray<any> {
  let itemSchema = z.string();
  const pattern = (field as any).pattern as string | undefined;

  if (pattern) {
    itemSchema = itemSchema.regex(
      new RegExp(pattern),
      'Invalid format for array item'
    );
  }

  let arraySchema = z.array(itemSchema);

  if (field.min !== null && field.min !== undefined) {
    arraySchema = arraySchema.min(
      field.min as number,
      `Must have at least ${field.min} item${field.min === 1 ? '' : 's'}`
    );
  }

  if (field.max !== null && field.max !== undefined) {
    arraySchema = arraySchema.max(
      field.max as number,
      `Must have at most ${field.max} item${field.max === 1 ? '' : 's'}`
    );
  }

  return arraySchema;
}

/**
 * Build schema for IP_ADDRESS fields
 */
function buildIpAddressSchema(field: ConfigSchemaField): z.ZodString {
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return z.string().regex(ipv4Regex, 'Invalid IP address format');
}

/**
 * Build schema for PORT fields
 */
function buildPortSchema(field: ConfigSchemaField): z.ZodNumber {
  return z.number().int().min(1, 'Port must be >= 1').max(65535, 'Port must be <= 65535');
}

/**
 * Build schema for FILE_PATH fields
 */
function buildFilePathSchema(field: ConfigSchemaField): z.ZodString {
  let schema = z.string();
  const pattern = (field as any).pattern as string | undefined;

  if (pattern) {
    schema = schema.regex(new RegExp(pattern), 'Invalid file path format');
  }

  return schema;
}

/**
 * Evaluates a conditional visibility expression (showIf field)
 *
 * The showIf expression is a simple condition like "field === 'value'" or "field !== 'value'"
 *
 * @param condition - The showIf condition string
 * @param formValues - Current form values
 * @returns True if the field should be shown
 *
 * @example
 * ```tsx
 * // Field definition: { name: 'port', showIf: 'enableCustomPort === true' }
 * const shouldShow = evaluateCondition('enableCustomPort === true', { enableCustomPort: true });
 * // shouldShow = true
 * ```
 */
export function evaluateCondition(
  condition: string | undefined,
  formValues: Record<string, any>
): boolean {
  if (!condition) {
    return true;
  }

  try {
    // Parse simple conditions: "fieldName === 'value'" or "fieldName !== 'value'"
    const equalityMatch = condition.match(/^(\w+)\s*===\s*(.+)$/);
    const inequalityMatch = condition.match(/^(\w+)\s*!==\s*(.+)$/);

    if (equalityMatch) {
      const [, fieldName, rawValue] = equalityMatch;
      const expectedValue = parseConditionValue(rawValue);
      return formValues[fieldName] === expectedValue;
    }

    if (inequalityMatch) {
      const [, fieldName, rawValue] = inequalityMatch;
      const expectedValue = parseConditionValue(rawValue);
      return formValues[fieldName] !== expectedValue;
    }

    // Fallback: simple boolean check (e.g., "enableFeature")
    return Boolean(formValues[condition]);
  } catch (error) {
    console.warn(`Failed to evaluate condition: ${condition}`, error);
    return true; // Show field by default on error
  }
}

/**
 * Parses a value from a condition expression
 *
 * Converts string representations (e.g., "true", "42", "'value'") into JavaScript values.
 * Used by evaluateCondition to parse the right-hand side of showIf conditions.
 *
 * @param rawValue - Raw string value from condition (e.g., "true", "42", "'myValue'")
 * @returns Parsed JavaScript value (boolean, number, or string)
 *
 * @internal - Not part of public API
 */
function parseConditionValue(rawValue: string): any {
  const trimmed = rawValue.trim();

  // Boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Number
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  // String (remove quotes)
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}
