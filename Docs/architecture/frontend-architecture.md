# Frontend Architecture

**Last Updated:** 2026-01-20  
**Version:** 3.0  
**Status:** Comprehensive - Three-Layer Components + Headless Presenters

---

## Table of Contents

- [Overview](#overview)
- [Architecture Principles](#architecture-principles)
- [State Management](#state-management)
- [Component Architecture](#component-architecture)
- [Responsive Strategy](#responsive-strategy)
- [GraphQL Integration](#graphql-integration)
- [Form Architecture](#form-architecture)
- [Routing & Navigation](#routing--navigation)
- [Performance Optimization](#performance-optimization)
- [Accessibility](#accessibility)
- [Internationalization](#internationalization)

---

## Overview

NasNetConnect frontend is a modern React 18 application built with **type-safety**, **accessibility**, and **multi-platform optimization** as core principles.

### Core Philosophy

1. **Complexity Absorption:** Frontend simplifies router complexity through progressive disclosure
2. **Safety-First:** Linear wizards, multi-step gates for dangerous operations
3. **Adaptive Multi-Platform:** Different paradigms for Mobile (simple) vs Desktop (power)
4. **Patterns-First:** All UI in patterns library, features consume
5. **Type-Safe Everything:** GraphQL schema → TypeScript types → Zod validation
6. **Maximum Accessibility:** WCAG AAA from day one, multi-layer defense

### Technology Stack

| Layer | Technologies | Purpose |
|-------|-------------|---------|
| **Framework** | React 18 + TypeScript 5 | Modern hooks, concurrent rendering, strict types |
| **Build** | Vite 5 | Fast HMR (<50ms), optimized bundles |
| **GraphQL** | Apollo Client + graphql-codegen | Normalized cache, subscriptions, type generation |
| **State** | Apollo + Zustand + XState | Server + UI + Complex flows |
| **Components** | shadcn/ui + Radix UI | Accessible primitives, code-owned |
| **Styling** | Tailwind CSS (200+ tokens) | Utility-first, three-tier token system |
| **Forms** | React Hook Form + Zod | Minimal re-renders, schema-driven validation |
| **Routing** | TanStack Router | Type-safe routes, code-splitting |
| **Animation** | Framer Motion | Physics-based, gestures, platform-aware timing |
| **i18n** | react-i18next | 10 languages, RTL support, namespace splitting |

---

## Architecture Principles

### 20 Fundamental Truths (from Frontend Brainstorming Session)

**THE CORE PURPOSE:**
1. Frontend ABSORBS complexity (progressive disclosure)
2. Frontend is SIMPLIFICATION layer (intent → complex configs invisible)
3. Bundle flexibility <3MB gzipped (optimize for UX, not bytes)

**THE USER EXPERIENCE:**
4. Two Flows × Two Modes (Setup Wizard + Dashboard, each with Easy/Advanced)
5. Hybrid real-time (Live for critical status/VPN, poll for non-critical)
6. Graceful degradation (View cached data offline, disable mutations)

**STATE & VALIDATION:**
7. Hybrid validation (Zod validates instantly, API validates on save)
8. Cached with disabled mutations (Show last-known state, block changes offline)

**COMPONENT ARCHITECTURE:**
9. Patterns-first philosophy (All UI in `ui/patterns/`, features consume)
10. Comprehensive design system (Full tokens, Storybook, Chromatic)
11. Hybrid navigation (Sidebar + tabs, separate routes for deep dives)

**CONFIGURATION PIPELINE:**
12. Linear safety wizard (Step-by-step, XState-governed, no skipping)
13. Hybrid diff visualization (Change list simple, visual diagram complex)
14. Multi-step dangerous gates (Acknowledge → Review → Countdown confirm)

**FEATURE MARKETPLACE:**
15. App Store + Curated bundles (Browse/search + "Privacy Bundle")
16. Feature-specific dashboards (VPN features in VPN Dashboard)
17. Hybrid status visibility (Summary bar + badges + crash notifications)

**PLATFORM & QUALITY:**
18. Adaptive responsive (Mobile simple vs Desktop power)
19. WCAG AAA accessibility (Maximum compliance including cognitive)
20. Hybrid error handling (Inline forms, toasts API, pages fatal)

---

## State Management

### Four-Layer State Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND STATE ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LAYER 1: SERVER STATE (Apollo Client)                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Purpose: All data from router/backend                  ││
│  │  Storage: Normalized cache (automatic deduplication)    ││
│  │  Updates: GraphQL Subscriptions (auto-update UI)        ││
│  │  Optimistic: Instant feedback, auto-rollback on error   ││
│  │  Persistence: Optional (apollo3-cache-persist)          ││
│  │  Example: Routers, Resources, Features, Users           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  LAYER 2: UI STATE (Zustand)                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Purpose: Global UI preferences and session state       ││
│  │  Storage: In-memory + localStorage persistence          ││
│  │  Updates: Direct mutations (set, toggle)                ││
│  │  DevTools: Zustand DevTools integration                 ││
│  │  Example: Theme, sidebar state, active filters, modals  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  LAYER 3: COMPLEX FLOWS (XState)                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Purpose: Multi-step workflows with guards              ││
│  │  Storage: State machines with actor model               ││
│  │  Updates: Event-driven transitions                      ││
│  │  Visualization: Stately tools for diagram              ││
│  │  Example: VPN connection, safety pipeline, wizard       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  LAYER 4: FORM STATE (React Hook Form)                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Purpose: Form-specific state and validation           ││
│  │  Storage: Uncontrolled inputs (minimal re-renders)      ││
│  │  Validation: Zod schemas (auto-generated from GraphQL)  ││
│  │  Example: Edit VPN form, Create firewall rule          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Decision Tree:**
```
Is it data from router/backend?
├─ Yes → Apollo Client (GraphQL queries/subscriptions)
│
└─ No → Is it complex multi-step workflow?
    ├─ Yes → XState (state machines)
    │
    └─ No → Is it form-specific?
        ├─ Yes → React Hook Form
        │
        └─ No → Zustand (global UI state)
```

---

## Component Architecture

### Three-Layer Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│           THREE-LAYER COMPONENT ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LAYER 1: PRIMITIVES (shadcn/ui + Radix)                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Location: libs/ui/primitives/src/                      ││
│  │  Count: ~20 components                                   ││
│  │  Source: Copy-pasted from shadcn/ui (code-owned)        ││
│  │  Examples: Button, Input, Card, Dialog, Table           ││
│  │  Characteristics:                                        ││
│  │  • WCAG AAA accessible (via Radix)                      ││
│  │  • Styled with Tailwind                                  ││
│  │  • Compound components                                   ││
│  │  • Zero business logic                                   ││
│  └─────────────────────────────────────────────────────────┘│
│                          ↓ used by                           │
│                                                              │
│  LAYER 2: PATTERNS (Custom Reusable)                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Location: libs/ui/patterns/src/                        ││
│  │  Count: 56 components (30 common + 26 domain)           ││
│  │  Examples: ResourceCard, DataTable, WizardStep          ││
│  │  Characteristics:                                        ││
│  │  • Headless logic + Platform presenters                 ││
│  │  • TypeScript generics for resource types               ││
│  │  • Storybook documented                                  ││
│  │  • Automatic responsive (Mobile/Tablet/Desktop)         ││
│  └─────────────────────────────────────────────────────────┘│
│                          ↓ used by                           │
│                                                              │
│  LAYER 3: DOMAIN (Feature-Specific)                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Location: libs/features/{feature}/src/components/      ││
│  │  Examples: WireGuardPeerEditor, FirewallChainDiagram    ││
│  │  Characteristics:                                        ││
│  │  • Feature-specific business logic                      ││
│  │  • Composes Layer 2 patterns                            ││
│  │  • Not reused across features                           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Dependency Rule:** Can only depend on layers below (Layer 3 → Layer 2 → Layer 1)

### 56 Pattern Components Catalog

**Common Patterns (30):**
- **Forms (6):** ResourceForm, WizardStep, FieldGroup, ConfigPreview, BulkEditForm, ImportExportForm
- **Displays (7):** ResourceCard, StatusBadge, MetricDisplay, InfoPanel, ConnectionIndicator, HealthScore, DependencyGraph
- **Data (6):** DataTable, Chart, LogViewer, Timeline, StatisticsPanel, ComparisonView
- **Navigation (5):** Sidebar, TabBar, Breadcrumb, CommandPalette, QuickActions
- **Feedback (6):** Alert, ConfirmDialog, ProgressTracker, Toast, LoadingState, EmptyState

**Domain Patterns (26):**
- **Networking (10):** VPNProviderSelector, NetworkTopology, InterfaceStatus, WANLinkCard, etc.
- **Security (8):** FirewallRuleTable, NATRuleEditor, AddressListManager, etc.
- **Monitoring (8):** TrafficChart, BandwidthGraph, UptimeIndicator, etc.

**All patterns implement Headless + Platform Presenters** (see ADR-018)

---

## Responsive Strategy

### Platform Presenters Pattern

**Three Device Classes with Different Paradigms:**

| Device | Breakpoint | Paradigm | Navigation | Layout |
|--------|-----------|----------|------------|--------|
| **Mobile** | <640px | Consumer-grade simplicity | Bottom tab bar | Single column, cards, bottom sheets |
| **Tablet** | 640-1024px | Hybrid (collapsible) | Collapsible sidebar | Two-column, mixed patterns |
| **Desktop** | >1024px | Pro-grade density | Fixed sidebar | Multi-column, data tables, hover states |

**Implementation:**

```tsx
// Pattern component separates logic from presentation
export function useResourceCard<T extends Resource>(props) {
  // Headless logic (shared across all presenters)
  const status = props.resource.runtime?.status || 'unknown';
  const isOnline = status === 'online';
  
  return { status, isOnline, /* ... */ };
}

// Platform-specific presenters
export function ResourceCardMobile<T>(props) {
  const state = useResourceCard(props);
  return (/* Mobile-optimized UI: large buttons, bottom sheet actions */);
}

export function ResourceCardDesktop<T>(props) {
  const state = useResourceCard(props);
  return (/* Desktop-optimized UI: dropdown menu, compact, detailed */);
}

// Auto-detection wrapper
export function ResourceCard<T>(props) {
  const platform = usePlatform();  // Detects viewport
  return platform === 'mobile' 
    ? <ResourceCardMobile {...props} />
    : <ResourceCardDesktop {...props} />;
}
```

**Features don't think about responsive - patterns handle it automatically.**

---

## GraphQL Integration

### Apollo Client Configuration

```typescript
// libs/core/api-client/src/apollo-client.ts
import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = new HttpLink({
  uri: '/graphql',
  credentials: 'include',  // Send cookies
});

const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:8080/query',
  connectionParams: () => ({
    // Auth token sent with connection_init
    authToken: getAuthToken(),
  }),
}));

// Split based on operation type
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,     // Subscriptions via WebSocket
  httpLink,   // Queries/Mutations via HTTP
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Resource: {
        keyFields: ['uuid'],  // Cache by UUID
        fields: {
          runtime: {
            merge: true,  // Merge runtime updates
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
```

### Subscription Integration

```tsx
// Auto-update UI via subscriptions
export function VPNStatusMonitor({ uuid }: { uuid: string }) {
  const { data } = useSubscription(RESOURCE_UPDATED_SUBSCRIPTION, {
    variables: { resourceId: uuid },
  });
  
  // Apollo cache automatically updates all components querying this resource
  // No manual state management needed!
  
  return null;  // Silent subscription, cache updates trigger re-renders
}

// Component using the data
export function VPNCard({ uuid }: { uuid: string }) {
  // This query auto-updates when subscription receives new data
  const { data } = useQuery(GET_VPN_QUERY, {
    variables: { uuid },
  });
  
  return (
    <ResourceCard
      resource={data?.resource}
      status={data?.resource.runtime?.isConnected}
    />
  );
}
```

---

## Form Architecture

### Schema-Driven Forms with Zod

**Generated from GraphQL Schema:**

```typescript
// Auto-generated by graphql-codegen from @validate directives
export const wireGuardClientSchema = z.object({
  name: z.string().min(1).max(100),
  privateKey: z.string().regex(/^[A-Za-z0-9+/]{43}=$/),
  listenPort: z.number().int().min(1).max(65535),
  peers: z.array(wireGuardPeerSchema).min(1).max(100),
});

export type WireGuardClientInput = z.infer<typeof wireGuardClientSchema>;
```

**Form Implementation:**

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function WireGuardForm({ onSubmit }: Props) {
  const form = useForm<WireGuardClientInput>({
    resolver: zodResolver(wireGuardClientSchema),  // Auto-generated Zod
    defaultValues: {
      listenPort: 51820,  // Smart defaults
    },
  });
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <Input {...field} />
        )}
      />
      {/* Zod validation errors appear automatically */}
    </form>
  );
}
```

### Risk-Based Validation Strategy

| Risk Level | Validation Layers | Example |
|------------|------------------|---------|
| **Low** | Zod only (client-side) | WiFi password length |
| **Medium** | Zod + Backend API | Firewall rule syntax |
| **High** | Zod + Backend + Dry-Run + Preview + Confirm | WAN link changes, VPN deletion |

**High-Risk Flow:**

```
User edits WAN configuration
         ↓
Zod validates instantly (client)
         ↓
Backend validates (GraphQL mutation)
         ↓
Backend dry-run on router (no apply)
         ↓
Show diff preview to user
         ↓
User confirms
         ↓
Backend applies (transactional)
         ↓
Backend confirms from router
         ↓
State updated, UI refreshes
```

---

## Routing & Navigation

### Type-Safe Routing with TanStack Router

```typescript
// routes/dashboard.tsx
import { createRoute } from '@tanstack/react-router';

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
  loader: async () => ({
    // Pre-fetch dashboard data
    data: await apolloClient.query({ query: GET_DASHBOARD_DATA }),
  }),
});

// routes/vpn/$uuid.tsx
export const vpnDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/vpn/$uuid',
  component: VPNDetail,
  validateSearch: z.object({
    tab: z.enum(['config', 'runtime', 'telemetry']).optional(),
  }),  // Type-safe search params!
});

// Usage with full type safety
navigate({
  to: '/vpn/$uuid',
  params: { uuid: 'vpn-123' },
  search: { tab: 'config' },  // TypeScript validates this!
});
```

### Navigation Patterns

**Mobile (<640px):**
```tsx
<BottomNavigation>
  <NavItem icon={Home} label="Dashboard" to="/dashboard" />
  <NavItem icon={Network} label="Network" to="/network" />
  <NavItem icon={Shield} label="Security" to="/security" />
  <NavItem icon={Wifi} label="WiFi" to="/wifi" />
  <NavItem icon={Settings} label="Settings" to="/settings" />
</BottomNavigation>
```

**Desktop (>1024px):**
```tsx
<Sidebar>
  <SidebarSection title="Overview">
    <SidebarItem icon={Home} label="Dashboard" to="/dashboard" />
  </SidebarSection>
  <SidebarSection title="Network">
    <SidebarItem icon={Network} label="Interfaces" to="/interfaces" />
    <SidebarItem icon={Globe} label="WAN" to="/wan" />
    <SidebarItem icon={Lan} label="LAN" to="/lan" />
  </SidebarSection>
  {/* ... */}
</Sidebar>
```

---

## Performance Optimization

### Bundle Optimization Strategies

| Strategy | Implementation | Savings |
|----------|----------------|---------|
| **Code-Splitting** | Route-based + feature-based lazy loading | ~40-60% initial bundle |
| **Tree-Shaking** | Vite + ES modules, import only what's used | ~60% smaller libraries |
| **Tailwind Purge** | Remove unused CSS classes | ~95% CSS removed |
| **Dynamic Imports** | Lazy load heavy components (Chart, NetworkTopology) | ~100-200KB deferred |
| **Platform Presenters** | Lazy load tablet/desktop on mobile | ~30% unused code not shipped |

**Bundle Analysis:**

```bash
# Analyze bundle composition
npm run build
npx vite-bundle-visualizer

# Output shows:
# - React + ReactDOM: ~45KB
# - Apollo Client: ~30.7KB
# - Application code: ~80KB
# - Lazy chunks: ~30KB each (loaded on demand)
```

### Apollo Client Optimization

```typescript
// Optimistic updates for instant feedback
const [updateResource] = useMutation(UPDATE_RESOURCE, {
  optimisticResponse: (vars) => ({
    __typename: 'Mutation',
    updateResource: {
      __typename: 'Resource',
      uuid: vars.uuid,
      configuration: vars.configuration,
      // Optimistic UI updates immediately, reverts on error
    },
  }),
});

// Prefetching on hover
<Link 
  to="/vpn/$uuid" 
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ['vpn', uuid],
      queryFn: () => getVPN(uuid),
    });
  }}
>
  View VPN
</Link>
```

---

## Accessibility

### WCAG AAA Multi-Layer Defense

**Four Defensive Layers (Impossible to Accidentally Break):**

1. **Layer 1: Primitives Enforce**
   - Radix UI components handle ARIA, keyboard navigation, focus management
   - Automatic compliance for Button, Dialog, Select, etc.

2. **Layer 2: Patterns Validate**
   - All patterns include accessibility checks
   - axe-core tests in component test suites
   - Storybook Accessibility addon shows violations

3. **Layer 3: A11yProvider Wraps**
   - Global accessibility provider monitors violations
   - Development mode shows a11y errors in console
   - Skip links, focus indicators, ARIA live regions

4. **Layer 4: CI Testing Catches**
   - Pa11y scans all pages in CI pipeline
   - axe-core runs in Playwright E2E tests
   - Blocking gate on violations

**Accessibility Requirements:**
- ✅ 7:1 contrast ratio (AAA)
- ✅ 44px touch targets (Mobile)
- ✅ Full keyboard navigation
- ✅ Screen reader support
- ✅ Focus indicators visible
- ✅ Semantic HTML
- ✅ ARIA labels where needed
- ✅ Skip links for navigation
- ✅ Reduced motion support

---

## Internationalization

### Multi-Language Support

**10 Languages with RTL:**
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Russian (ru)
- Turkish (tr)
- Persian (fa) - RTL
- Arabic (ar) - RTL
- Chinese Simplified (zh-CN)
- Japanese (ja)

**Implementation:**

```tsx
// Namespace per feature
export const useTranslation = () => {
  return i18n.useTranslation(['common', 'vpn', 'firewall']);
};

// Usage
const { t } = useTranslation();

<h1>{t('vpn:title')}</h1>
<p>{t('vpn:description', { count: vpns.length })}</p>
```

**RTL Support:**

```tsx
// Automatic RTL layout
<html dir={isRTL ? 'rtl' : 'ltr'}>
  {/* Tailwind automatically handles RTL with rtl: prefix */}
  <Button className="ml-2 rtl:mr-2 rtl:ml-0">
    {t('common:save')}
  </Button>
</html>
```

---

## Related Documents

- [Component Architecture](./novel-pattern-designs.md#4-headless--platform-presenters-ui-pattern) - Detailed pattern explanation
- [Design System](../design/) - Complete UX specifications
- [API Contracts](./api-contracts.md) - GraphQL schema and patterns
- [Technology Stack](./technology-stack-details.md) - Frontend technologies
- [ADR-001](./adrs/001-component-library-choice.md) - shadcn/ui selection
- [ADR-002](./adrs/002-state-management-approach.md) - Multi-library state
- [ADR-017](./adrs/017-three-layer-component-architecture.md) - Component layers
- [ADR-018](./adrs/018-headless-platform-presenters.md) - Responsive pattern

---
