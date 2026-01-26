# 18. Testing Strategy Patterns

## Testing Trophy Shape

```
                    E2E Tests                         ← Few, focused on critical paths
              (Playwright + CHR Docker)
─────────────────────────────────────────────────────
              Integration Tests                       ← Primary layer
         (RTL + MSW + Testify + Ginkgo)
─────────────────────────────────────────────────────
                  Unit Tests                          ← Supporting layer
              (Vitest + go testing)
─────────────────────────────────────────────────────
                 Static Analysis                      ← Foundation
           (TypeScript + ESLint + go vet)
```

## Three-Tier Router Testing

```
TIER 1: Unit/Integration (Developer machine, CI)
┌─────────────────────────────────────────────────────┐
│  Mock Router Responses (MSW / custom Go mock)       │
│  • Fast (milliseconds)                               │
│  • Deterministic                                     │
│  • Covers all protocols via recorded responses       │
└─────────────────────────────────────────────────────┘

TIER 2: E2E (CI, Pre-release)
┌─────────────────────────────────────────────────────┐
│  RouterOS CHR in Docker                              │
│  • Real RouterOS behavior                            │
│  • Predictable starting state (fresh each run)      │
│  • Tests all protocols against real implementation  │
└─────────────────────────────────────────────────────┘

TIER 3: Hardware Validation (Manual, Release)
┌─────────────────────────────────────────────────────┐
│  Physical MikroTik devices (hAP, RB4011, CCR)       │
│  • Real hardware quirks                              │
│  • Different RouterOS versions                       │
│  • Manual smoke tests before major releases          │
└─────────────────────────────────────────────────────┘
```

## Schema-First Mock Synchronization

Generate MSW handlers from GraphQL schema to prevent drift between tests and reality.

```typescript
// Generate MSW handlers from schema
import { buildSchema } from 'graphql';
import { createMockHandlers } from '@nasnet/test-utils';

const schema = buildSchema(schemaString);
const handlers = createMockHandlers(schema, {
  Query: {
    interfaces: () => mockInterfaces,
    resources: ({ routerId }) => mockResources[routerId],
  },
  Mutation: {
    updateResource: ({ input }) => ({ ...input, id: '1' }),
  },
});

// MSW server setup
const server = setupServer(...handlers);
```

## Flaky Test Handling Strategy

```
┌─────────────────────────────────────────────────────┐
│                FLAKY TEST HANDLING FLOW              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. RETRY (First Defense)                           │
│     • Max 3 retries for E2E tests                   │
│     • Max 2 retries for integration tests           │
│     • No retries for unit tests (fail fast)         │
│                                                      │
│  2. QUARANTINE (Isolation)                          │
│     • Tests failing >3 times in 7 days → quarantine │
│     • Quarantined tests run but don't block CI      │
│     • Dashboard tracks quarantine reasons            │
│                                                      │
│  3. FAIL FAST (Severity-based)                      │
│     • Critical path failures → immediate stop        │
│     • Security test failures → immediate stop        │
│     • Non-critical → continue, report at end         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## CI/CD Quality Gates

| Gate | Threshold | Mode | Action on Fail |
|------|-----------|------|----------------|
| Unit Tests | Pass | Blocking | Fail PR |
| Integration Tests | Pass | Blocking | Fail PR |
| E2E Tests | Pass | Warning | Report, don't block |
| Line Coverage | 80% | Warning | Report trend |
| Branch Coverage | 75% | Warning | Report trend |
| Mutation Score | Baseline | Warning | Track improvement |
| Accessibility | No violations | Blocking | Fail PR |
| Security (High) | 0 issues | Blocking | Fail PR |
| Security (Med/Low) | Report | Warning | Human review |
| Visual Regression | No changes | Warning | Human approval |
| Bundle Size | Budget | Warning | Report trend |

---
