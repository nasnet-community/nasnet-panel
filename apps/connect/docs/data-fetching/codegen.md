# GraphQL Code Generation

The project uses `@graphql-codegen/cli` to generate TypeScript types, Apollo React hooks, and a
fragment matcher from the GraphQL schema. Generated files are never edited by hand.

## What Gets Generated

| Output file                                     | Plugin(s)                                          | Content                                                  |
| ----------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| `libs/api-client/generated/types.ts`            | `typescript`                                       | All schema types as TypeScript `type` aliases            |
| `libs/api-client/generated/operations.ts`       | `typescript-operations`, `typescript-react-apollo` | Typed hooks for every query/mutation/subscription        |
| `libs/api-client/generated/schema.graphql`      | `schema-ast`                                       | Full schema AST (used by IDEs and tooling)               |
| `libs/api-client/generated/fragment-matcher.ts` | `fragment-matcher`                                 | `possibleTypes` result for Apollo cache union resolution |

## Configuration

File: `codegen.ts` (root of the monorepo)

### Schema source

```typescript
schema: './schema/**/*.graphql';
```

The schema is split across many files in `schema/`. Codegen reads all of them.

### Document sources (operations)

```typescript
documents: [
  'apps/connect/src/**/*.graphql',
  'apps/connect/src/**/*.tsx',
  'libs/**/*.graphql',
  'libs/**/*.tsx',
  '!libs/api-client/generated/**/*', // Exclude generated output
  '!libs/core-ui-qwik/**/*',
  '!libs/star-setup/**/*',
  '!libs/**/*.stories.tsx',
];
```

Codegen scans both `.graphql` files and `.tsx` files for `gql` tagged template literals.

### Type generation options

```typescript
// types.ts config
declarationKind: 'type',    // 'type' not 'interface' for better tree-shaking
immutableTypes: true,        // All fields are readonly
enumsAsConst: true,          // Enums as const objects
skipTypename: true,           // No __typename in generated types
maybeValue: 'T | null | undefined',

// Custom scalar mappings
scalars: {
  DateTime: 'string',
  IPv4: 'string',
  IPv6: 'string',
  MAC: 'string',
  CIDR: 'string',
  Port: 'number',
  PortRange: 'string',
  Duration: 'string',
  Bandwidth: 'string',
  Size: 'string',
}
```

### Hook generation options

```typescript
// operations.ts config
withHooks: true,              // Generate useXxx hooks
withHOC: false,               // No higher-order components
withComponent: false,         // No render prop components
apolloClientVersion: 3,
documentMode: 'documentNode', // Export DocumentNode objects
dedupeFragments: true,
```

## Running Codegen

```bash
# Full codegen (TypeScript + Go)
npm run codegen

# TypeScript only (types, hooks)
npm run codegen:ts

# Go only (ent ORM + gqlgen resolvers)
npm run codegen:go

# Verify generated code is in sync with schema
npm run codegen:check
```

Prettier is run automatically after generation via the `hooks.afterAllFileWrite` option.

## Generated Hook Naming Convention

Codegen derives hook names from the GraphQL operation name:

| Operation                      | Generated hook                   |
| ------------------------------ | -------------------------------- |
| `query GetRouters`             | `useGetRoutersQuery`             |
| `mutation CreateResource`      | `useCreateResourceMutation`      |
| `subscription OnServiceStatus` | `useOnServiceStatusSubscription` |

The custom hooks in `libs/api-client/queries/src/` often wrap these generated hooks to add type
safety, default variables, or convenience patterns.

## Fragment Matcher

The `fragment-matcher.ts` output provides `possibleTypes` for the Apollo cache. This lets Apollo
correctly normalise union and interface types (e.g., the `Resource` interface implemented by
`WireGuardClient`, `LANNetwork`, `WANLink`, etc.).

It is imported in `apollo-client.ts`:

```typescript
import { possibleTypesResult } from '@nasnet/api-client/generated';

const cache = new InMemoryCache({
  possibleTypes: possibleTypesResult.possibleTypes,
  // ...
});
```

**Important**: After any schema change that adds or modifies union/interface types, regenerate this
file or Apollo will silently fail to normalise cache entries correctly.

## After Schema Changes

Whenever `.graphql` files in `schema/` are modified:

1. Run `npm run codegen:ts` to regenerate TypeScript types and hooks
2. If ent entities changed, run `npm run codegen:ent`
3. If resolver signatures changed, run `npm run codegen:gqlgen`
4. Run `npm run codegen:check` in CI to verify generated files are up to date

The CI pipeline runs `codegen:check` to block merges if generated files are stale.

## Import Path

Generated files are exposed under the `@nasnet/api-client/generated` alias:

```typescript
import type { Router, Resource, WireGuardClient } from '@nasnet/api-client/generated';
import { useGetRoutersQuery } from '@nasnet/api-client/generated';
import { possibleTypesResult } from '@nasnet/api-client/generated';
```
