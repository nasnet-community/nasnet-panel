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
export function mergeSchemas<
  T extends ZodRawShape,
  U extends ZodRawShape
>(base: ZodObject<T>, extension: ZodObject<U>): ZodObject<T & U> {
  return base.merge(extension);
}

/**
 * Picks specific fields from a Zod object schema.
 *
 * @param schema - Zod object schema
 * @param keys - Fields to pick
 * @returns Schema with only picked fields
 */
export function pickFields<
  T extends ZodRawShape,
  K extends keyof T
>(schema: ZodObject<T>, keys: K[]): ZodObject<Pick<T, K>> {
  const mask = keys.reduce(
    (acc, key) => ({ ...acc, [key]: true }),
    {} as { [P in K]: true }
  );
  return schema.pick(mask);
}

/**
 * Omits specific fields from a Zod object schema.
 *
 * @param schema - Zod object schema
 * @param keys - Fields to omit
 * @returns Schema without omitted fields
 */
export function omitFields<
  T extends ZodRawShape,
  K extends keyof T
>(schema: ZodObject<T>, keys: K[]): ZodObject<Omit<T, K>> {
  const mask = keys.reduce(
    (acc, key) => ({ ...acc, [key]: true }),
    {} as { [P in K]: true }
  );
  return schema.omit(mask);
}

/**
 * Creates a Zod schema for an optional string that can be empty.
 * Transforms empty strings to undefined.
 *
 * @returns Zod schema for optional string
 */
export function optionalString(): z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined> {
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
export function requiredString(
  message = 'This field is required'
): z.ZodString {
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
 *
 * @param condition - Function that returns true if the field is required
 * @param requiredSchema - Schema to use when condition is true
 * @param optionalSchema - Schema to use when condition is false
 * @returns Union schema
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
