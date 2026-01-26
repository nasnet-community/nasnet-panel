# ADR 002: State Management Strategy - Multi-Library Approach

**Status:** Accepted  
**Date:** 2025-12-03  
**Deciders:** Architecture Team  
**Epic Context:** Epic 0.0 - Project Foundation  
**Related Stories:** 0-0-3 (Create Core Shared Libraries)

## Context

NasNetConnect needs to manage multiple types of state:
- **Server State:** Router data fetched via RouterOS REST API (system info, interfaces, logs, etc.)
- **Client State:** UI state (theme, selected router, active tab, etc.)
- **Complex Workflows:** Multi-step processes (VPN connection safety pipeline in Phase 1)

Traditional approaches use a single state management library for everything. However, different state types have different requirements:
- Server state needs caching, background refetching, optimistic updates
- Client state needs persistence, simple updates, DevTools integration
- Complex workflows need state machine modeling with guards and transitions

## Decision

Use a **multi-library state management approach**, choosing the right tool for each state type:

1. **TanStack Query (React Query)** - Server state management
2. **Zustand** - Client/UI state management
3. **XState** - Complex workflow state machines (Phase 1+)

## Rationale

### Apollo Client for Server State

**Why not use Zustand/Redux for server data?**
- Server state is fundamentally different from client state
- Requires automatic background refetching  
- Needs cache invalidation strategies
- Benefits from optimistic updates and rollback
- Handles loading/error states automatically
- GraphQL subscriptions need normalized cache for automatic UI updates

**Apollo Client advantages:**
- **Normalized cache** - Automatic UI updates when data changes via subscriptions/mutations
- GraphQL-native with full subscription support
- Automatic cache updates across all components
- Optimistic updates with automatic rollback
- Excellent DevTools for debugging queries and cache
- Production-proven at scale (GitHub, Shopify, Airbnb)
- Bundle size (~31KB) acceptable for normalized caching benefits

### Zustand for Client State

**Why not use Redux/Context?**
- Redux is overkill for simple UI state
- Context causes re-renders across the tree
- Need something lightweight for <10MB constraint

**Zustand advantages:**
- Minimal bundle size (~3KB gzipped)
- Simple, intuitive API
- No boilerplate (no actions, reducers, providers)
- Supports persistence middleware (localStorage)
- DevTools integration available
- Selector-based re-renders (avoid Context re-render issues)

### XState for Complex Workflows

**Why not use boolean flags or useReducer?**
- VPN safety pipeline has 8+ states with complex transitions
- Need to model guard conditions (connectivity check before apply)
- Impossible states should be impossible to represent
- Visualization of state machines helps team understanding

**XState advantages:**
- Explicit state modeling prevents invalid states
- Visual diagrams of workflows (via Stately tools)
- Guards prevent invalid transitions
- Actor model for concurrent processes
- Type-safe state and events (TypeScript)

## Implementation

### TanStack Query Usage

```typescript
// libs/core/api-client/src/queries/useSystemResources.ts
export function useSystemResources(routerId: string) {
  return useQuery({
    queryKey: ['system', 'resources', routerId],
    queryFn: () => apiClient.getSystemResources(routerId),
    refetchInterval: 5000, // Auto-refresh every 5s
    staleTime: 3000,
  });
}
```

Used for:
- System resource monitoring (CPU, memory, disk)
- Interface statistics
- DHCP leases
- System logs
- All RouterOS data fetching

### Zustand Usage

```typescript
// libs/core/stores/src/theme/themeStore.ts
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'nasnet-theme' }
  )
);
```

Used for:
- Theme preference (dark/light/system)
- Selected router ID
- Active navigation tab
- UI modal state
- User preferences

### XState Usage (Phase 1)

```typescript
// libs/features/vpn/src/machines/vpnConnectionMachine.ts
export const vpnConnectionMachine = createMachine({
  id: 'vpnConnection',
  initial: 'idle',
  states: {
    idle: { on: { START: 'validating' } },
    validating: {
      invoke: {
        src: 'validateConfig',
        onDone: 'applying',
        onError: 'error',
      },
    },
    applying: { /* ... */ },
    monitoring: { /* ... */ },
    rollback: { /* ... */ },
  },
});
```

Used for:
- VPN connection safety pipeline (Phase 1)
- Multi-step configuration wizards
- Any workflow with complex state transitions

## Consequences

### Positive

- **Right Tool for Right Job:** Each library optimized for its use case
- **Small Bundle:** ~20KB total vs 50KB+ for Redux Toolkit alone
- **Better DX:** Simpler code, less boilerplate than single-library approach
- **Type Safety:** All three libraries have excellent TypeScript support
- **DevTools:** Each library has debugging tools

### Negative

- **Multiple Libraries:** Team must learn three different APIs
- **Complexity:** More moving pieces than single state solution
- **Bundle Size:** Three libraries vs one (mitigated by small sizes)
- **Consistency:** Need guidelines on when to use which library

### Mitigations

- Created state management decision tree in architecture docs
- Code examples for each library in respective library folders
- Linter rules to prevent mixing (e.g., don't put server data in Zustand)
- Team training documentation

## State Management Decision Tree

```
Is it data from the router (server)?
├─ Yes → Use TanStack Query
└─ No → Is it a complex multi-step workflow?
    ├─ Yes → Use XState
    └─ No → Use Zustand
```

## Alternatives Considered

### Redux Toolkit
- **Rejected:** Overkill for our needs, larger bundle size
- More boilerplate than Zustand for simple UI state
- No built-in server state handling (would need RTK Query)
- Still larger combined size than our three-library approach

### TanStack Query (for server state)
- **Considered:** Lightweight alternative to Apollo Client (~13KB vs ~31KB)
- **Rejected for NasNetConnect:** Need normalized cache for real-time updates
- Would work well for simpler apps without complex relationship graphs
- Apollo's normalized cache is critical for GraphQL subscriptions and automatic UI updates

### Jotai/Recoil (atomic state)
- **Rejected:** Less mature than Zustand
- Atomic model not needed for our use cases
- Zustand's store model clearer for our team

### Single Library Approach (All in Redux/Zustand)
- **Rejected:** Server state caching would be manual
- No automatic refetching or background updates
- Would need to build cache invalidation ourselves
- Higher maintenance burden

## Performance Metrics

After Epic 0.2 implementation:
- Initial bundle includes TanStack Query: +13KB
- Zustand overhead: +3KB
- XState deferred to Phase 1 (code-split)
- Total state management overhead: ~16KB (acceptable for <10MB target)

## Review Date

Will review after Epic 0.10 (Phase 0 completion):
- Assess if three libraries justified the complexity
- Measure actual bundle size impact
- Evaluate developer satisfaction
- Consider consolidation if pattern emerges

## References

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [XState Docs](https://xstate.js.org/)
- Architecture Doc: `architecture/technology-stack-details.md`
- State Management Guide: `libs/core/stores/README.md`

