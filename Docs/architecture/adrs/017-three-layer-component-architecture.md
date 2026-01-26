# ADR-017: Three-Layer Component Architecture

**Date:** 2026-01-20  
**Status:** Accepted  
**Deciders:** Technical Architect, BMad, UX Designer  
**Category:** Architecture / Frontend / Design System  
**Source Session:** brainstorming-session-component-library-2026-01-03.md  
**Related ADRs:** ADR-001 (shadcn/ui), ADR-018 (Headless + Presenters)

---

## Context

NasNetConnect features 120+ native features across 14 categories plus dynamic marketplace features. The UI must be:

1. **Consistent:** Same UX patterns across all features
2. **Accessible:** WCAG AAA compliance required
3. **Responsive:** Optimal UX for Mobile, Tablet, Desktop (different paradigms)
4. **Maintainable:** Easy to update patterns without touching all features
5. **Extensible:** Marketplace features can use or override native components

**Component Library Challenges:**
- **Feature Explosion:** 120+ features will create hundreds of components
- **Copy-Paste Hell:** Without patterns, each feature implements its own card/form/table
- **Inconsistency:** Different features use different UX patterns
- **Accessibility Gaps:** Hard to guarantee WCAG AAA without structure
- **Responsive Complexity:** Every component must handle Mobile/Tablet/Desktop

**Problem:**
How to organize components to ensure consistency, accessibility, and maintainability while supporting rapid feature development?

---

## Decision

Adopt a **Three-Layer Component Architecture** with strict dependency rules:

### Layer 1: PRIMITIVES (shadcn/ui + Radix UI)

**Purpose:** Foundational accessible components  
**Source:** Copy-pasted from shadcn/ui into codebase  
**Ownership:** Code-owned (we control updates)  
**Location:** `libs/ui/primitives/src/`

**Components (~20):**
- Button, Input, Select, Checkbox, Radio, Switch
- Card, Dialog, Modal, Sheet, Toast, Alert
- Tabs, Accordion, Collapsible
- Dropdown Menu, Context Menu, Command
- Progress, Slider, Badge, Avatar

**Characteristics:**
- **Accessible:** WCAG AAA via Radix UI primitives
- **Unstyled:** Styled with Tailwind (customizable)
- **Composable:** Compound components (e.g., Dialog.Header, Dialog.Content)
- **Zero Business Logic:** Pure presentation

### Layer 2: PATTERNS (Custom Mid-Level Components)

**Purpose:** Reusable UX patterns used across features  
**Source:** Custom-built, application-specific  
**Location:** `libs/ui/patterns/src/`

**56 Pattern Components:**

**Common Patterns (~30):**
- ResourceCard, StatusBadge, MetricDisplay
- DataTable, Chart, LogViewer, Timeline
- FormBuilder, WizardStep, ConfigurationPreview
- Sidebar, TabBar, Breadcrumb, CommandPalette
- Alert, ConfirmDialog, ProgressTracker, EmptyState

**Domain Patterns (~26):**
- VPNProviderSelector, NetworkTopology, InterfaceStatusGrid
- FirewallRuleTable, AddressListEditor
- TrafficChart, BandwidthGraph, UptimeIndicator
- WiFiSignalStrength, ClientList
- BackupManager, LogExporter

**Characteristics:**
- **Headless Logic:** Behavior separated from presentation (see ADR-018)
- **Platform Presenters:** Mobile/Tablet/Desktop variants
- **Consistent API:** TypeScript generics for resource types
- **Storybook Documented:** Every pattern has stories

### Layer 3: DOMAIN (Feature-Specific Components)

**Purpose:** Feature-specific business logic and specialized UI  
**Source:** Feature development teams  
**Location:** `libs/features/{feature}/src/components/`

**Examples:**
- `libs/features/vpn/src/components/WireGuardPeerEditor.tsx`
- `libs/features/firewall/src/components/RuleChainDiagram.tsx`
- `libs/features/wifi/src/components/WiFiHeatmap.tsx`

**Characteristics:**
- **Feature-Specific:** Not reused across features
- **Composes Patterns:** Built using Layer 2 patterns
- **Business Logic:** Feature domain knowledge embedded

---

## Dependency Rules

**Strict Hierarchy (can only depend on layers below):**

```
Layer 3: DOMAIN
    ↓ can use
Layer 2: PATTERNS
    ↓ can use
Layer 1: PRIMITIVES
    ↓ can use
External (Radix UI, Tailwind)
```

**Enforced via ESLint:**

```json
{
  "depConstraints": [
    {
      "sourceTag": "scope:features",
      "onlyDependOnLibsWithTags": ["scope:ui-patterns", "scope:ui-primitives", "scope:core"]
    },
    {
      "sourceTag": "scope:ui-patterns",
      "onlyDependOnLibsWithTags": ["scope:ui-primitives", "scope:core"]
    },
    {
      "sourceTag": "scope:ui-primitives",
      "bannedExternalImports": ["@nasnet/ui-patterns", "@nasnet/features-*"]
    }
  ]
}
```

---

## Rationale

### Why Three Layers?

**Two Layers Insufficient:**
- Primitives + Features only: No shared patterns (copy-paste hell)
- Primitives + Patterns only: No room for feature-specific components

**Three Layers Optimal:**
- **Primitives:** Foundation (accessibility, consistency)
- **Patterns:** Reusable UX patterns (reduce duplication)
- **Domain:** Feature-specific needs (flexibility)

### Why Pattern Layer Critical?

**Without Patterns Layer:**
```tsx
// Each feature implements its own card ❌
// VPN Feature
<Card className="custom-vpn-card">
  <div className="status-badge">Online</div>
  <h3>{vpn.name}</h3>
  <Button>Connect</Button>
</Card>

// Firewall Feature (different implementation!)
<Card className="fw-card">
  <Badge>{rule.chain}</Badge>
  <p>{rule.name}</p>
  <Button variant="primary">Edit</Button>
</Card>
```

**With Patterns Layer:**
```tsx
// All features use ResourceCard pattern ✅
// VPN Feature
<ResourceCard<VPNClient>
  resource={vpn}
  status={vpn.runtime?.isConnected}
  actions={[
    { label: 'Connect', onClick: handleConnect }
  ]}
/>

// Firewall Feature (same pattern!)
<ResourceCard<FirewallRule>
  resource={rule}
  status={rule.metadata?.state}
  actions={[
    { label: 'Edit', onClick: handleEdit }
  ]}
/>
```

**Benefits:**
- Consistent UX across features
- Accessibility guaranteed (pattern handles it)
- Responsive handling centralized (pattern has platform presenters)
- Update pattern once, all features benefit

### Why Code-Owned Primitives (shadcn/ui)?

**Alternatives Considered:**

| Library | Bundle Size | Customization | Accessibility | Decision |
|---------|-------------|---------------|---------------|----------|
| **Material-UI** | 300KB+ | Limited | WCAG AA | Rejected - too large |
| **Ant Design** | 400KB+ | Limited | WCAG AA | Rejected - too large |
| **Chakra UI** | ~250KB | Good | Good | Rejected - CSS-in-JS overhead |
| **shadcn/ui** | ~45KB* | Full | WCAG AAA | **SELECTED** |

*Only components used, tree-shakeable

**Why shadcn/ui:**
- Components copied into codebase (full control)
- Built on Radix UI (WCAG AAA accessible)
- Tailwind-based (no runtime CSS-in-JS)
- Small bundle (only what we use)
- Can optimize for router constraints

---

## Consequences

### Positive

- **Consistency:** All features use same UX patterns
- **Accessibility:** WCAG AAA guaranteed by pattern layer
- **Maintainability:** Update pattern once, all features benefit
- **Development Speed:** Features just compose patterns
- **Type Safety:** Generic patterns with TypeScript (`ResourceCard<T extends Resource>`)
- **Responsive Automatic:** Patterns handle Mobile/Tablet/Desktop
- **Storybook Documentation:** All patterns documented with examples
- **Testing:** Test patterns once, features inherit quality

### Negative

- **Abstraction Overhead:** Three layers more complex than flat structure
- **Pattern Design Effort:** Must design patterns carefully for reuse
- **Learning Curve:** Team must understand layer boundaries
- **Potential Over-Abstraction:** Risk of patterns too generic (lose flexibility)

### Mitigations

- **Pattern Review:** Weekly pattern review to catch over-abstraction
- **Escape Hatch:** Domain layer can create custom components when pattern doesn't fit
- **Documentation:** Clear guidelines on when to use patterns vs custom
- **Examples:** Every pattern has multiple usage examples in Storybook

**Pattern Decision Tree:**

```
Need a component?
├─ Does it exist in Layer 1 (Primitives)? ─Yes─> Use it
│   └─ No
│       ↓
├─ Does it exist in Layer 2 (Patterns)? ─Yes─> Use it
│   └─ No
│       ↓
├─ Will it be reused across 2+ features? ─Yes─> Add to Layer 2
│   └─ No
│       ↓
└─ Build in Layer 3 (Domain-specific)
```

---

## Pattern Examples

### ResourceCard Pattern

```tsx
// libs/ui/patterns/src/resource-card/

// Headless logic
export function useResourceCard<T extends Resource>(props: ResourceCardProps<T>) {
  const { resource, actions } = props;
  
  const status = resource.runtime?.status || 'unknown';
  const isOnline = status === 'online' || status === 'connected';
  
  return {
    status,
    isOnline,
    statusColor: getStatusColor(status),
    primaryAction: actions?.[0],
    secondaryActions: actions?.slice(1),
  };
}

// Platform presenters
export function ResourceCardMobile<T extends Resource>(props: ResourceCardProps<T>) {
  const state = useResourceCard(props);
  
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3>{props.resource.configuration.name}</h3>
        <StatusBadge status={state.status} color={state.statusColor} />
      </div>
      <div className="mt-2 space-y-2">
        {state.primaryAction && (
          <Button fullWidth onClick={state.primaryAction.onClick}>
            {state.primaryAction.label}
          </Button>
        )}
      </div>
    </Card>
  );
}

export function ResourceCardDesktop<T extends Resource>(props: ResourceCardProps<T>) {
  const state = useResourceCard(props);
  
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3>{props.resource.configuration.name}</h3>
          <StatusBadge status={state.status} color={state.statusColor} />
          <p className="text-sm text-muted">{props.resource.metadata.description}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {state.secondaryActions?.map(action => (
              <DropdownMenuItem key={action.label} onClick={action.onClick}>
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}

// Auto-detect platform
export function ResourceCard<T extends Resource>(props: ResourceCardProps<T>) {
  const platform = usePlatform();  // mobile | tablet | desktop
  
  switch (platform) {
    case 'mobile':
      return <ResourceCardMobile {...props} />;
    case 'desktop':
      return <ResourceCardDesktop {...props} />;
    default:
      return <ResourceCardDesktop {...props} />;
  }
}
```

### Usage in Features

```tsx
// VPN Feature
import { ResourceCard } from '@nasnet/ui-patterns';

function VPNList({ vpns }: { vpns: VPNClient[] }) {
  return vpns.map(vpn => (
    <ResourceCard<VPNClient>
      key={vpn.uuid}
      resource={vpn}
      actions={[
        { label: vpn.runtime?.isConnected ? 'Disconnect' : 'Connect', onClick: () => toggle(vpn) },
        { label: 'Edit', onClick: () => edit(vpn) },
        { label: 'Delete', onClick: () => remove(vpn) },
      ]}
    />
  ));
}
```

---

## Review Date

Review after Phase 1 completion (3 months):
- Assess if 56 patterns sufficient or too many
- Check for patterns that should be split or merged
- Evaluate if domain layer creating too many custom components (pattern gaps?)
- Measure pattern reuse across features
- Consider if layer boundaries too strict or too loose

---

## References

- Brainstorming Session: `Docs/brainstorming-sessions/brainstorming-session-component-library-2026-01-03.md`
- Design System: `Docs/design/ux-design/`
- ADR-001: Component Library (shadcn/ui selection)
- ADR-018: Headless + Platform Presenters

---
