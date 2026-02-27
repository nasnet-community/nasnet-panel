/**
 * Schema Utilities
 *
 * Helper functions for working with Zod schemas.
 *
 * @module @nasnet/core/forms/schema-utils
 */

import { z, type ZodSchema, type ZodObject, type ZodRawShape } from 'zod';

/**
 * Makes all fields in a Zod object schema optional.
 *
 * @param schema - Zod object schema
 * @returns Schema with all fields optional
 *
 * @example
 * ```typescript
 * const userSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 *
 * const partialUserSchema = makePartial(userSchema);
 * // { name?: string; email?: string }
 * ```
 */
export function makePartial<T extends ZodRawShape>(
  schema: ZodObject<T>
): ZodObject<{ [K in keyof T]: z.ZodOptional<T[K]> }> {
  return schema.partial() as ZodObject<{
    [K in keyof T]: z.ZodOptional<T[K]>;
  }>;
}

/**
 * Merges two Zod object schemas.
 *
 * @param base - Base schema
 * @param extension - Schema to merge
 * @returns Merged schema
 */
export function mergeSchemas<T extends ZodRawShape, U extends ZodRawShape>(
  base: ZodObject<T>,
  extension: ZodObject<U>
): ZodObject<T & U> {
  return base.merge(extension) as unknown as ZodObject<T & U>;
}

/**
 * Picks specific fields from a Zod object schema.
 *
 * @template T - Zod raw shape type
 * @template K - Keys to pick from T
 * @param schema - Zod object schema
 * @param keys - Fields to pick
 * @returns Schema with only picked fields
 *
 * @example
 * ```typescript
 * const schema = z.object({ name: z.string(), email: z.string(), age: z.number() });
 * const picked = pickFields(schema, ['name', 'email']);
 * // Schema with only name and email fields
 * ```
 */
export function pickFields<T extends ZodRawShape, K extends keyof T>(
  schema: ZodObject<T>,
  keys: K[]
): ZodObject<Pick<T, K>> {
  const mask = keys.reduce((acc, key) => ({ ...acc, [key]: true }), {} as { [P in K]: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return schema.pick(mask as any) as unknown as ZodObject<Pick<T, K>>;
}

/**
 * Omits specific fields from a Zod object schema.
 *
 * @template T - Zod raw shape type
 * @template K - Keys to omit from T
 * @param schema - Zod object schema
 * @param keys - Fields to omit
 * @returns Schema without omitted fields
 *
 * @example
 * ```typescript
 * const schema = z.object({ name: z.string(), email: z.string(), password: z.string() });
 * const publicSchema = omitFields(schema, ['password']);
 * // Schema with only name and email fields
 * ```
 */
export function omitFields<T extends ZodRawShape, K extends keyof T>(
  schema: ZodObject<T>,
  keys: K[]
): ZodObject<Omit<T, K>> {
  const mask = keys.reduce((acc, key) => ({ ...acc, [key]: true }), {} as { [P in K]: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return schema.omit(mask as any) as unknown as ZodObject<Omit<T, K>>;
}

/**
 * Creates a Zod schema for an optional string that can be empty.
 * Transforms empty strings to undefined.
 *
 * @returns Zod schema for optional string
 */
export function optionalString(): z.ZodEffects<
  z.ZodOptional<z.ZodString>,
  string | undefined,
  string | undefined
> {
  return z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val));
}

/**
 * Creates a Zod schema for a required string that cannot be empty.
 *
 * @param message - Custom error message
 * @returns Zod schema for non-empty string
 */
export function requiredString(message = 'This field is required'): z.ZodString {
  return z.string().min(1, message);
}

/**
 * Creates a Zod schema for a number from string input.
 * Useful for form inputs that return strings.
 *
 * @param options - Options for number validation
 * @returns Zod schema that transforms string to number
 */
export function numberFromString(options?: {
  min?: number;
  max?: number;
  integer?: boolean;
  message?: string;
}): z.ZodEffects<z.ZodString, number, string> {
  let schema: z.ZodNumber = z.number();

  if (options?.integer) {
    schema = schema.int();
  }
  if (options?.min !== undefined) {
    schema = schema.min(options.min);
  }
  if (options?.max !== undefined) {
    schema = schema.max(options.max);
  }

  return z.string().transform((val, ctx) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: options?.message || 'Invalid number',
      });
      return z.NEVER;
    }
    return parsed;
  });
}

/**
 * Creates a Zod schema for a boolean from string input.
 * Accepts 'true', 'false', '1', '0'.
 *
 * @returns Zod schema that transforms string to boolean
 */
export function booleanFromString(): z.ZodEffects<z.ZodString, boolean, string> {
  return z.string().transform((val) => {
    const lower = val.toLowerCase();
    return lower === 'true' || lower === '1';
  });
}

/**
 * Creates a conditional schema that validates based on a condition.
 * Note: The condition function is provided for semantic clarity but runtime enforcement
 * requires additional validation using Zod's superRefine or refine methods.
 *
 * @template T - First schema type
 * @template U - Second schema type
 * @param condition - Function that returns true if requiredSchema should apply (informational)
 * @param requiredSchema - Schema to use when condition is true
 * @param optionalSchema - Schema to use when condition is false
 * @returns Union schema accepting either schema
 *
 * @example
 * ```typescript
 * const schema = conditionalSchema(
 *   () => true,
 *   z.string().min(1),
 *   z.string().optional()
 * );
 * ```
 */
export function conditionalSchema<T extends ZodSchema, U extends ZodSchema>(
  condition: () => boolean,
  requiredSchema: T,
  optionalSchema: U
): z.ZodUnion<[T, U]> {
  return z.union([requiredSchema, optionalSchema]);
}

/**
 * Type helper to infer the output type from a Zod schema.
 */
export type InferSchema<T extends ZodSchema> = z.infer<T>;

/**
 * Type helper to infer the input type from a Zod schema.
 */
export type InferInput<T extends ZodSchema> = z.input<T>;
