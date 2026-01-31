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
      preset: 'client',
      plugins: ['typescript-operations', 'typescript-react-apollo'],
      presetConfig: {
        gqlTagName: 'gql',
      },
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

    // Zod validation schemas generated from @validate directives
    './libs/api-client/generated/validation.ts': {
      plugins: ['typescript-validation-schema'],
      config: {
        // Use Zod as the validation library
        schema: 'zod',
        // Import path for Zod
        importFrom: 'zod',
        // Use custom directive for validation
        directives: {
          validate: {
            min: ['min', '$1'],
            max: ['max', '$1'],
            minLength: ['min', '$1'],
            maxLength: ['max', '$1'],
            pattern: ['regex', 'new RegExp($1)'],
            format: {
              EMAIL: 'email',
              URL: 'url',
              UUID: 'uuid',
              IPV4: ['regex', '/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/'],
              IPV6: ['regex', '/^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/'],
              MAC: ['regex', '/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/'],
              CIDR: ['regex', '/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\/(?:3[0-2]|[12]?[0-9])$/'],
              HOSTNAME: ['regex', '/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/'],
              FQDN: ['regex', '/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}$/'],
            },
          },
        },
        // Skip generating schema for types without @validate
        withObjectType: false,
        // Generate input types validation
        enumsAsTypes: true,
      },
    },

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
