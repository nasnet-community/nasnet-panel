# 19. Developer Experience Patterns

## Devcontainer-First Environment

```
┌─────────────────────────────────────────────────────┐
│              DEVELOPMENT ENVIRONMENT                 │
├─────────────────────────────────────────────────────┤
│  PRIMARY: Devcontainer (VS Code/GitHub Codespaces)  │
│  ├─ Node.js (correct version via .nvmrc)            │
│  ├─ Go (correct version via .go-version)            │
│  ├─ Docker-in-Docker (for building router images)   │
│  ├─ All VS Code extensions pre-configured           │
│  └─ Pre-built Nx cache for faster first run         │
│                                                      │
│  SECONDARY: Native (Linux/macOS/Windows WSL2)       │
│  └─ Same tooling works in both environments         │
└─────────────────────────────────────────────────────┘
```

## Type Safety Codegen Pipeline

```
GraphQL Schema (source of truth)
       ↓
   ┌───┴───┐
   ↓       ↓
gqlgen   graphql-codegen
   ↓       ↓
Go structs  TS types

Design Tokens Flow:
Tokens Studio (design)
       ↓
Style Dictionary (build)
       ↓
   ┌───┴───┐
   ↓       ↓
CSS vars  TS constants
```

## Unified Development Commands

```bash
# Single mental model for all developers
npm run dev      # Starts Vite + Go/Air + MSW in parallel
npm run test     # Runs Vitest in watch mode with Nx affected
npm run clean    # Clear Nx cache, node_modules, Go builds (escape hatch)
npm run generate # Unified code generation wrapper
```

## Failure Mode Defense

Every workflow failure has a clear recovery path:

| Failure | Recovery Command |
|---------|------------------|
| Hot reload stops working | `npm run clean` + restart |
| GraphQL codegen produces invalid types | Local schema file as source of truth |
| Nx cache returns stale results | `nx reset` |
| Go backend crashes on startup | Check startup health check output |
| Tests pass locally, fail in CI | Devcontainer matches CI environment |

---
