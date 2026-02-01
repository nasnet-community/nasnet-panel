/**
 * GraphQL Generated Code
 *
 * This module exports all generated types, operations, and validation schemas.
 * Do not edit these files manually - run `npm run codegen` to regenerate.
 *
 * @packageDocumentation
 */

// Re-export all generated types
export * from './types';

// Re-export all operations and hooks
export * from './operations';

// Re-export fragment matcher for Apollo Client cache (possibleTypes)
export { default as possibleTypesResult } from './fragment-matcher';
export type { PossibleTypesResultData } from './fragment-matcher';

// Zod validation schemas
// Note: Until full codegen with @graphql-codegen/typescript-validation-schema is integrated,
// schemas are manually defined using network validators from @nasnet/core/forms
export * from './schemas';
