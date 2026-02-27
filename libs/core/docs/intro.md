---
sidebar_position: 1
title: Introduction
---

# Core Library: Shared Foundation

The **`@nasnet/core`** library is the shared foundation for the NasNetConnect frontend. It provides type-safe constants, shared TypeScript interfaces, utility functions, and React form/validation infrastructure used by all features.

## Library Structure

```
libs/core/
├── types/          # TypeScript interfaces (zero dependencies)
│   └── src/
│       ├── firewall/        # FilterRule, MangleRule, NATRule, etc.
│       ├── resource/        # Resource model, layers, composites
│       ├── api/             # Backend API types
│       ├── config/          # Configuration types
│       └── ...
│
├── utils/          # Pure utility functions (minimal dependencies)
│   └── src/
│       ├── validation/      # IP, CIDR, network validators
│       ├── device/          # Browser/OS detection utilities
│       ├── firewall/        # Firewall utility functions
│       ├── network/         # IP/MAC/VLAN utilities
│       ├── formatters/      # Data formatting (bytes, duration, IP)
│       ├── mac-vendor/      # MAC address vendor lookup
│       ├── status/          # Status aggregation logic
│       ├── graph/           # GraphQL utilities
│       ├── hooks/           # React hooks
│       └── ...
│
├── constants/      # Static application constants
│   └── src/
│       ├── routes.ts        # Navigation routes (ROUTES object)
│       ├── api-endpoints.ts # API endpoints (API_ENDPOINTS object)
│       ├── socket-events.ts # WebSocket events (EMIT/ON)
│       └── well-known-ports.ts  # Service port database
│
├── forms/          # React Hook Form integration
│   └── src/
│       ├── NasFormProvider.tsx      # Form context provider
│       ├── useZodForm.ts            # Form hook with Zod
│       ├── useValidationPipeline.ts # Multi-stage validation
│       ├── useFormPersistence.ts    # Auto-save to localStorage
│       ├── useFormResourceSync.ts   # Sync with resource updates
│       ├── network-validators.ts    # Network-specific validators
│       ├── network-utils.ts         # Network form utilities
│       ├── schema-utils.ts          # Zod schema builders
│       └── error-messages.ts        # Backend error mapping
│
└── i18n/           # Internationalization (i18next)
    └── src/
        ├── I18nProvider.tsx         # i18next provider
        ├── DirectionProvider.tsx    # RTL/LTR support
        ├── i18n.ts                  # i18next config
        ├── hooks/                   # i18n hooks
        └── locales/                 # Translations (.json)
```

## Dependency Rules (Strict)

The core library enforces strict dependency boundaries:

```
┌─────────────────────────────────┐
│  apps/connect (React App)       │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│  libs/features/* (Features)     │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│  libs/ui/* (Primitives/Patterns)│
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│  libs/core/* (Types/Utils)      │ ◄─ CANNOT DEPEND ON ANYTHING ABOVE
└─────────────────────────────────┘
```

**Rules:**
- ✅ **Core CAN** depend on: External libraries (Zod, i18next, TypeScript)
- ❌ **Core CANNOT** depend on: apps/, features/, ui/ libraries
- ✅ **All other libraries CAN** import from core
- ✅ **React dependencies** allowed only in forms/ and i18n/

Why? Core types and utilities should be reusable by:
- The Go backend (type definitions)
- CLI tools and build scripts
- Testing utilities
- Code generators

## Import Aliases (Configured)

All aliases are defined in `apps/connect/vite.config.ts`:

```typescript
// Import alias → File path mapping
{
  '@nasnet/core/types': 'libs/core/types/src',
  '@nasnet/core/utils': 'libs/core/utils/src',
  '@nasnet/core/constants': 'libs/core/constants/src',
  '@nasnet/core/forms': 'libs/core/forms/src',
  '@nasnet/core/i18n': 'libs/core/i18n/src',
}
```

**Usage:**
```typescript
import type { FilterRule } from '@nasnet/core/types';
import { validateIPv4, formatBytes } from '@nasnet/core/utils';
import { ROUTES, API_ENDPOINTS } from '@nasnet/core/constants';
import { useZodForm } from '@nasnet/core/forms';
import { useTranslation } from '@nasnet/core/i18n';
```

## Sub-Library Overview

### types/ — Type Definitions

Pure TypeScript interfaces with **zero dependencies**. These define the data model across the application.

**Key Categories:**
- **Firewall** (`firewall/`) - FilterRule, MangleRule, NATRule, RawRule, PortKnock, RateLimit
- **Resource** (`resource/`) - Universal State v2 (8-layer resource model)
- **API** (`api/`) - Backend request/response types
- **Config** (`config/`) - Configuration schemas
- **Network** - Interface, routing, VLAN, tunnel types
- **DHCP** - Pool, lease, fingerprint types

**No React** - types/ can be used in:
- Go type stubs (code generation)
- CLI tools
- Testing utilities

### utils/ — Utility Functions

Pure functions with **minimal external dependencies**. Organized by domain:

- `validation/` - IP, CIDR, port validators (used in forms)
- `device/` - Browser/OS detection
- `firewall/` - Rule builders, CIDR operations
- `network/` - IP/MAC/VLAN utilities
- `formatters/` - Human-readable formatting
- `hooks/` - React hooks (useQuery, useLocalStorage, etc.)

**Most are pure functions** - can be tested without React Context.

### constants/ — Static Constants

Organized by domain (routes, API, socket events, ports):

- `routes.ts` - ROUTES object (navigation)
- `api-endpoints.ts` - API_ENDPOINTS object
- `socket-events.ts` - SOCKET_EVENTS_EMIT, SOCKET_EVENTS_ON
- `well-known-ports.ts` - Port database + lookup functions

See [constants.md](./sub-libraries/constants.md) for complete reference.

### forms/ — React Hook Form Integration

Builds on top of React Hook Form + Zod for:
- Multi-stage validation pipelines
- Form state persistence
- Resource synchronization
- Network-specific validators
- Backend error mapping

**Requires React** - forms/ context and hooks.

### i18n/ — Internationalization

i18next setup with:
- Language detection
- RTL/LTR support
- Translation providers
- Locale files (.json)

**Requires React** - i18n/ providers and hooks.

## Package Configuration (Nx)

Each sub-library is a **Nx library** with:

**SourceRoot:** `libs/core/{name}/src`

**Targets (in project.json):**
- `lint` - ESLint
- `typecheck` - TypeScript checking

**TypeScript Configuration:**
```json
{
  "compilerOptions": {
    "strict": true,
    "module": "esnext",
    "target": "es2020"
  }
}
```

**No build step** - Nx handles bundling via apps/ build.

## How to Add New Exports

### Adding to Existing Sub-Library

1. **Create the file** in `libs/core/{name}/src/{module}.ts`:
   ```typescript
   // libs/core/types/src/my-feature.ts
   export interface MyType {
     id: string;
     name: string;
   }
   ```

2. **Export from sub-library index** in `libs/core/{name}/src/index.ts`:
   ```typescript
   export type { MyType } from './my-feature';
   ```

3. **Verify alias works** - import should auto-resolve:
   ```typescript
   import type { MyType } from '@nasnet/core/types';
   ```

4. **Update documentation** - Add to [README.md](./README.md) and respective sub-library doc

### Adding a New Sub-Library (Advanced)

1. **Create directory structure:**
   ```bash
   mkdir -p libs/core/newlib/src
   ```

2. **Create package.json:**
   ```json
   {
     "name": "@nasnet/core-newlib",
     "version": "0.0.1"
   }
   ```

3. **Create project.json** - Copy from existing sub-library

4. **Create src/index.ts** - Main export file

5. **Add to vite.config.ts** alias (if not automatic)

6. **Add to documentation** - Update README.md

## Testing Conventions

### Test Files Location
- Collocated with source: `module.test.ts` or `module.spec.ts`
- Shared fixtures in `__tests__/` folder

### Testing Frameworks
- **Unit tests:** Vitest (4x faster than Jest)
- **Type tests:** TypeScript strict mode
- **Coverage:** Aim for 80%+ coverage

### Example Test
```typescript
// libs/core/utils/src/validation/ipv4.test.ts
import { describe, it, expect } from 'vitest';
import { validateIPv4 } from './ipv4';

describe('validateIPv4', () => {
  it('validates correct IPv4', () => {
    expect(validateIPv4('192.168.1.1')).toBe(true);
  });

  it('rejects invalid IPv4', () => {
    expect(validateIPv4('999.999.999.999')).toBe(false);
  });
});
```

Run tests:
```bash
npm run test                    # All tests
npx nx test @nasnet/core-types # Single sub-library
```

## Relationship to Backend (Go)

TypeScript types mirror **Go structs** for consistency:

**Backend (Go):**
```go
type FilterRule struct {
  ID       string `db:"id"`
  Chain    string `db:"chain"`
  Action   string `db:"action"`
  Protocol string `db:"protocol"`
}
```

**Frontend (TypeScript):**
```typescript
export interface FilterRule {
  id: string;
  chain: string;
  action: string;
  protocol: string;
}
```

**Connection:** GraphQL schema bridges both (see `schema/` directory).

Code generation creates:
- Go → GraphQL types
- GraphQL → TypeScript types

See Docs/architecture/data-architecture.md for Universal State v2 (8-layer model).

## Key Design Decisions

### No React in Core Types/Utils/Constants

Keeps these modules tree-shakeable and reusable:
- ✅ Can be used in Node.js scripts
- ✅ Can be imported by Go code generators
- ✅ Zero runtime dependencies (types/)
- ✅ Minimal external dependencies (utils/)

### Zod for All Validation

All form validation uses **Zod schemas**:
```typescript
const schema = z.object({
  port: z.number().min(1).max(65535),
  address: z.string().ip('v4'),
});
```

**Benefits:**
- Type-safe runtime validation
- Automatic TypeScript inference
- Composable validators
- Custom error messages
- Works in server + client

### Universal State v2 (8-Layer Model)

Resources follow a sophisticated model defined in types/:

1. **Primitive** - Basic scalars
2. **Aggregate** - Business entities
3. **Composite** - Related entities
4. **Query** - GraphQL queries
5. **Cache** - Apollo Client cache
6. **Local** - localStorage/IndexedDB
7. **Sync** - Conflict resolution
8. **UI** - Component state

See `Docs/architecture/data-architecture.md` for details.

## Architectural Boundaries

`libs/core` is deliberately **headless** — it contains no platform-specific UI logic, no visual components, and no rendering. Understanding what lives in core vs. what lives elsewhere is critical:

| Concern | Where It Lives | NOT in libs/core |
|---------|---------------|------------------|
| Platform detection (`usePlatform`) | `libs/ui/patterns` | Core has no knowledge of mobile/tablet/desktop |
| State machines (XState) | `libs/state/machines` | Core provides types consumed by machines |
| GraphQL hooks (Apollo) | `libs/api-client/queries` | Core provides types, api-client provides hooks |
| Visual components | `libs/ui/primitives`, `libs/ui/patterns` | Core has zero UI components |
| Auth token handling | `libs/api-client/core` (Apollo links) | Core has no auth state |
| Router communication | `apps/backend` (Go proxy) | Core is frontend-only |
| Storybook stories | `libs/ui/*/stories` | Core has no visual components to story |

**Why this matters:**
- Core can be used in non-React contexts (CLI tools, code generators, test utilities)
- Core types and utils are tree-shakeable with zero UI framework dependencies
- Only `libs/core/forms` and `libs/core/i18n` have React dependencies (by design)
- This separation enables sharing types with the Go backend via code generation

**Boundary violations to avoid:**
- Never import from `@nasnet/ui/*` in core (upward dependency)
- Never import from `@nasnet/features/*` in core (upward dependency)
- Never import from `@nasnet/api-client` in core (peer dependency)
- Never add platform-specific logic (window size, touch detection) to core

## Related Documentation

### Sub-Library References
- [README.md](./README.md) - Master index with architecture diagram
- [constants.md](./sub-libraries/constants.md) - Routes, endpoints, socket events, ports
- [types.md](./sub-libraries/types.md) - Complete type reference
- [utils.md](./sub-libraries/utils.md) - Utility functions
- [forms.md](./sub-libraries/forms.md) - React Hook Form
- [i18n.md](./sub-libraries/i18n.md) - Internationalization

### Cross-Cutting Guides
- [error-handling-patterns.md](./guides/error-handling-patterns.md) - Error types, backend mapping, i18n messages
- [graphql-integration-guide.md](./guides/graphql-integration-guide.md) - Type flow, codegen, Apollo patterns
- [testing-patterns.md](./guides/testing-patterns.md) - Vitest setup, hook testing, mock strategies
- [state-machines-guide.md](./guides/state-machines-guide.md) - XState machines for complex workflows
- [accessibility-patterns.md](./guides/accessibility-patterns.md) - A11yProvider, WCAG AAA compliance
- [performance-patterns.md](./guides/performance-patterns.md) - Auto-scroll, caching, bundle size
- [security-patterns.md](./guides/security-patterns.md) - Input validation, error safety

### System Architecture
- System-wide architecture (see Docs/architecture/index.md)
