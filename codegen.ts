/**
 * GraphQL Code Generator Configuration
 *
 * This configuration generates TypeScript types, React Apollo hooks, and Zod
 * validation schemas from the GraphQL schema.
 *
 * Run: npm run codegen:ts
 *
 * @see https://the-guild.dev/graphql/codegen/docs/config-reference/config-field
 */

import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Schema source files
  schema: './schema/**/*.graphql',

  // GraphQL operations to process (queries, mutations, subscriptions)
  documents: [
    'apps/connect/src/**/*.graphql',
    'apps/connect/src/**/*.tsx',
    'libs/**/*.graphql',
    'libs/**/*.tsx',
    // Exclude generated files
    '!libs/api-client/generated/**/*',
  ],

  // Ignore validation for build performance
  ignoreNoDocuments: true,

  // Output configuration
  generates: {
    // TypeScript type definitions
    './libs/api-client/generated/types.ts': {
      plugins: ['typescript'],
      config: {
        // Use 'type' instead of 'interface' for better tree-shaking
        declarationKind: 'type',
        // Add readonly modifier to generated types
        immutableTypes: true,
        // Use enum values as const
        enumsAsConst: true,
        // Skip __typename by default
        skipTypename: true,
        // Use 'Maybe' type for nullable fields
        maybeValue: 'T | null | undefined',
        // Generate scalar type overrides
        scalars: {
          DateTime: 'string',
          JSON: 'Record<string, unknown>',
          IPv4: 'string',
          IPv6: 'string',
          MAC: 'string',
          CIDR: 'string',
          Port: 'number',
          PortRange: 'string',
          Duration: 'string',
          Bandwidth: 'string',
          Size: 'string',
        },
      },
    },

    // TypeScript operations (queries/mutations/subscriptions) with React Apollo hooks
    './libs/api-client/generated/operations.ts': {
      plugins: ['typescript-operations', 'typescript-react-apollo'],
      config: {
        // Generate React hooks for operations
        withHooks: true,
        // Don't generate HOC components
        withHOC: false,
        // Don't generate render prop components
        withComponent: false,
        // Use Apollo Client v3
        apolloClientVersion: 3,
        // Add document node export
        documentMode: 'documentNode',
        // Skip __typename
        skipTypename: true,
        // Dedup fragments
        dedupeFragments: true,
        // Use exact optional property types
        avoidOptionals: {
          field: true,
          inputValue: false,
          object: true,
          defaultValue: true,
        },
      },
    },

    // TODO: Zod validation schemas - requires @graphql-codegen/typescript-validation-schema plugin
    // Uncomment when plugin is installed:
    // './libs/api-client/generated/validation.ts': {
    //   plugins: ['typescript-validation-schema'],
    //   config: { ... }
    // },

    // GraphQL Schema AST for introspection
    './libs/api-client/generated/schema.graphql': {
      plugins: ['schema-ast'],
      config: {
        includeDirectives: true,
      },
    },

    // Fragment matcher for Apollo Client cache
    './libs/api-client/generated/fragment-matcher.ts': {
      plugins: ['fragment-matcher'],
      config: {
        apolloClientVersion: 3,
      },
    },
  },

  // Hooks for pre/post generation
  hooks: {
    afterAllFileWrite: ['prettier --write'],
  },
};

export default config;
