# GraphQL Code Generation

This document describes the GraphQL schema-first development approach and code generation pipeline for NasNetConnect.

## Overview

NasNetConnect uses a **schema-first** approach where the GraphQL schema (`schema/*.graphql`) is the single source of truth for all API contracts. Code generation automatically produces:

- **TypeScript**: Types, React Apollo hooks, and Zod validation schemas
- **Go**: Structs, resolver interfaces, and validators via gqlgen

This ensures TypeScript and Go types are always in sync, eliminating manual type maintenance and reducing integration bugs.

## Schema Files

```
schema/
├── schema.graphql     # Main schema (types, queries, mutations, subscriptions)
├── directives.graphql # Custom directive definitions
└── scalars.graphql    # Custom scalar type definitions
```

### Custom Directives

| Directive | Purpose | Example |
|-----------|---------|---------|
| `@validate` | Input validation (generates Zod schemas) | `username: String! @validate(minLength: 3, maxLength: 32)` |
| `@mikrotik` | MikroTik RouterOS API mapping | `name: String! @mikrotik(path: "/interface", field: "name")` |
| `@openwrt` | OpenWrt ubus call mapping | `status: String! @openwrt(ubus: "network.interface")` |
| `@vyos` | VyOS configuration path mapping | `address: String! @vyos(path: "interfaces ethernet eth0")` |
| `@capability` | Feature gating based on router capabilities | `wifiWave2: Boolean @capability(requires: ["wifi-wave2"])` |
| `@realtime` | Real-time subscription hints | `traffic: TrafficEvent! @realtime(interval: 1000)` |
| `@cache` | Caching hints for clients | `version: String! @cache(maxAge: 3600)` |

### Custom Scalars

| Scalar | Description | Go Type | Example |
|--------|-------------|---------|---------|
| `DateTime` | ISO 8601 datetime | `time.Time` | `"2024-01-15T10:30:00Z"` |
| `JSON` | Arbitrary JSON data | `map[string]any` | `{"key": "value"}` |
| `IPv4` | IPv4 address | `model.IPv4` | `"192.168.1.1"` |
| `IPv6` | IPv6 address | `model.IPv6` | `"2001:db8::1"` |
| `MAC` | MAC address | `model.MAC` | `"00:1A:2B:3C:4D:5E"` |
| `CIDR` | CIDR notation | `model.CIDR` | `"192.168.1.0/24"` |
| `Port` | TCP/UDP port (1-65535) | `model.Port` | `8080` |
| `PortRange` | Port or range | `model.PortRange` | `"80-443"` |
| `Duration` | RouterOS duration | `model.Duration` | `"1d2h3m4s"` |
| `Bandwidth` | Bandwidth with unit | `model.Bandwidth` | `"10M"` |
| `Size` | Byte size with unit | `model.Size` | `"1G"` |

## Running Code Generation

### Full Generation (Recommended)

```bash
npm run codegen
```

This runs both TypeScript and Go code generation.

### TypeScript Only

```bash
npm run codegen:ts
```

Generates files in `libs/api-client/generated/`:
- `types.ts` - TypeScript type definitions
- `operations.ts` - Query/mutation hooks for Apollo Client
- `validation.ts` - Zod schemas from `@validate` directives
- `schema.graphql` - Compiled schema for introspection
- `fragment-matcher.ts` - Apollo Client cache configuration

### Go Only

```bash
npm run codegen:go
```

Generates files in `apps/backend/graph/`:
- `generated.go` - GraphQL server runtime
- `model/models_gen.go` - Generated structs
- `resolver/*.resolvers.go` - Resolver stubs

### Check Sync Status

```bash
npm run codegen:check
```

Runs codegen and checks if generated files are in sync with the schema. Used in CI to fail builds with stale generated code.

## Pre-commit Hook

When you modify files in `schema/`, the pre-commit hook automatically:
1. Runs `npm run codegen:ts`
2. Stages the generated files in `libs/api-client/generated/`

This ensures generated code is always committed with schema changes.

## CI Validation

The `pr-check.yml` workflow includes a `codegen-check` job that:
1. Runs TypeScript code generation
2. Fails if generated files differ from committed files
3. Provides clear error messages about which files are out of sync

## Adding New Types

### 1. Define the Type in Schema

```graphql
# schema/schema.graphql

"""
A firewall rule definition
"""
type FirewallRule implements Node {
  id: ID!
  chain: String! @mikrotik(path: "/ip/firewall/filter", field: "chain")
  action: FirewallAction! @mikrotik(path: "/ip/firewall/filter", field: "action")
  srcAddress: CIDR @mikrotik(path: "/ip/firewall/filter", field: "src-address")
  dstPort: PortRange @mikrotik(path: "/ip/firewall/filter", field: "dst-port")
  comment: String @mikrotik(path: "/ip/firewall/filter", field: "comment")
  enabled: Boolean! @mikrotik(path: "/ip/firewall/filter", field: "disabled")
}

enum FirewallAction {
  ACCEPT
  DROP
  REJECT
  JUMP
  LOG
}

input CreateFirewallRuleInput {
  chain: String! @validate(minLength: 1, maxLength: 64)
  action: FirewallAction!
  srcAddress: CIDR
  dstPort: PortRange
  comment: String @validate(maxLength: 255)
}
```

### 2. Run Code Generation

```bash
npm run codegen
```

### 3. Implement Resolver (Go)

The generated resolver stub will be in `apps/backend/graph/resolver/`. Implement the business logic:

```go
// apps/backend/graph/resolver/firewall.resolvers.go

func (r *queryResolver) FirewallRule(ctx context.Context, routerID string, id string) (*model.FirewallRule, error) {
    // Implementation using RouterOS API
    return r.FirewallService.GetRule(ctx, routerID, id)
}
```

### 4. Use in Frontend

```tsx
// apps/connect/src/features/firewall/components/RulesList.tsx
import { useFirewallRulesQuery } from '@nasnet/api-client/generated';

function RulesList({ routerId }: { routerId: string }) {
  const { data, loading, error } = useFirewallRulesQuery({
    variables: { routerId },
  });

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <ul>
      {data?.firewallRules.edges.map(({ node }) => (
        <li key={node.id}>{node.chain}: {node.action}</li>
      ))}
    </ul>
  );
}
```

## Validation with Zod

The `@validate` directive generates Zod schemas automatically:

```graphql
input UserInput {
  username: String! @validate(minLength: 3, maxLength: 32, pattern: "^[a-z0-9_]+$")
  email: String! @validate(format: EMAIL)
  age: Int @validate(min: 0, max: 150)
}
```

Generated Zod schema:

```typescript
// libs/api-client/generated/validation.ts
export const UserInputSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-z0-9_]+$/),
  email: z.string().email(),
  age: z.number().min(0).max(150).optional(),
});
```

Use in forms:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserInputSchema } from '@nasnet/api-client/generated';

function UserForm() {
  const form = useForm({
    resolver: zodResolver(UserInputSchema),
  });
  // ...
}
```

## Troubleshooting

### "Generated code is out of sync"

Run `npm run codegen` and commit the generated files:

```bash
npm run codegen
git add libs/api-client/generated/ apps/backend/graph/
git commit -m "chore: regenerate GraphQL code"
```

### "Schema has validation errors"

Check for:
- Missing type definitions
- Circular references
- Invalid directive usage
- Duplicate field names

Run the schema linter:

```bash
npx graphql-codegen --config codegen.ts --check
```

### "gqlgen: unknown type"

Ensure custom scalars are defined in both:
- `schema/scalars.graphql` (GraphQL definition)
- `apps/backend/gqlgen.yml` (Go type mapping)
- `apps/backend/graph/model/scalars.go` (Go implementation)

### Pre-commit hook fails

If the pre-commit hook fails during codegen:
1. Check for syntax errors in schema files
2. Ensure all npm dependencies are installed
3. Run `npm run codegen` manually to see detailed errors

## References

- [graphql-codegen Documentation](https://the-guild.dev/graphql/codegen)
- [gqlgen Documentation](https://gqlgen.com/)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [Zod Documentation](https://zod.dev/)
- [ADR-011: Unified GraphQL Architecture](../architecture/adrs/011-unified-graphql-architecture.md)
