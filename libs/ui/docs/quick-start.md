---
sidebar_position: 2
title: Quick Start
---

# Quick Start Guide

This guide walks through everything you need to start building features with the NasNetConnect UI
library. It covers the package map, dependency rules with explicit examples, building your first
composed component, running Storybook, and a glossary of key terms.

---

## Package Map

| Package | Import alias | Storybook port | What it gives you |
|---------|-------------|---------------|-------------------|
| `libs/ui/primitives` | `@nasnet/ui/primitives` | **4400** | Atomic building blocks: Button, Card, Input, Select, Dialog, Table, Skeleton, Toast, Badge, Form, Icon, and more (~40 exports) |
| `libs/ui/patterns` | `@nasnet/ui/patterns` | **4401** | Composed, platform-aware components: StatusBadge, DataTable, StatusIndicator, ConnectionIndicator, ServiceCard, ResourceUsageBar, ValidationProgress, and 50+ more |
| `libs/ui/layouts` | `@nasnet/ui/layouts` | (via ui-patterns port) | Application shell and page structure: AppShell, PageContainer, ResponsiveShell, SidebarLayout, BottomNavigation, MobileAppShell, CardLayout |
| `libs/ui/tokens` | `@nasnet/ui/tokens` | — | Design token TypeScript exports (animation, transitions). CSS variables via `@nasnet/ui/tokens/variables.css` |
| `libs/ui/utils` | `@nasnet/ui/utils` | — | `cn()` — the class-name merger used throughout all components |

---

## Dependency Rules

The three-layer architecture has strict one-way dependency rules. These are enforced at CI time by
the ESLint rule `@nx/enforce-module-boundaries`.

### Allowed Imports

```tsx
// Layer 1 (primitives) → tokens only
import '@nasnet/ui/tokens/variables.css';             // OK: primitives consumes token CSS vars

// Layer 2 (patterns) → primitives and tokens
import { Button, Card } from '@nasnet/ui/primitives'; // OK: patterns build on primitives
import { transitions } from '@nasnet/ui/tokens';      // OK: patterns consume animation tokens
import { cn } from '@nasnet/ui/utils';                // OK: utility available everywhere

// Layer 3 (features) → any layer below
import { Button } from '@nasnet/ui/primitives';        // OK: features use primitives
import { StatusBadge } from '@nasnet/ui/patterns';     // OK: features use patterns
import { PageContainer } from '@nasnet/ui/layouts';    // OK: features use layouts

// apps/ → any layer
import { ResponsiveShell } from '@nasnet/ui/layouts';  // OK: app entry points use layouts
```

### Forbidden Imports

```tsx
// FORBIDDEN: primitives cannot import from patterns (upward dependency)
import { StatusBadge } from '@nasnet/ui/patterns';
// ^ ERROR in libs/ui/primitives — patterns are a higher layer

// FORBIDDEN: primitives cannot import from layouts (upward dependency)
import { PageContainer } from '@nasnet/ui/layouts';
// ^ ERROR in libs/ui/primitives

// FORBIDDEN: patterns cannot import from features (upward dependency)
import { VPNConnectionCard } from '@nasnet/features/vpn';
// ^ ERROR in libs/ui/patterns

// FORBIDDEN: feature A cannot import from feature B
import { useAlerts } from '@nasnet/features/alerts';
// ^ ERROR in libs/features/dashboard — cross-feature import
```

### Quick Rule of Thumb

> Dependencies only flow **downward**: `features → patterns → primitives → tokens`.
> Nothing in `libs/ui/` may import from `libs/features/` or `apps/`.

---

## Your First Component

The example below builds a router status card that is realistic but self-contained. It shows how
to compose primitives, a pattern component, a layout wrapper, and the `cn()` utility.

### Step 1 — Set up the layout shell

```tsx
// apps/connect/src/app/pages/example/RouterStatusExample.tsx
import { PageContainer, ResponsiveShell } from '@nasnet/ui/layouts';
```

`PageContainer` accepts `title`, `description`, and an optional `actions` slot. `ResponsiveShell`
auto-switches between `MobileAppShell` (with bottom navigation) and `AppShell` (with fixed
sidebar) based on the current platform.

### Step 2 — Import primitives

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/primitives'; // cn is also available via @nasnet/ui/utils
```

### Step 3 — Import a pattern component

`StatusBadge` lives in `@nasnet/ui/patterns`. It renders differently on mobile vs desktop
automatically — you do not pass a platform prop; the headless `usePlatform` hook handles it.

```tsx
import { StatusBadge } from '@nasnet/ui/patterns';
import type { StatusBadgeProps } from '@nasnet/ui/patterns';
```

### Step 4 — Compose the component

```tsx
// apps/connect/src/app/pages/example/RouterStatusCard.tsx

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  cn,
} from '@nasnet/ui/primitives';
import { StatusBadge } from '@nasnet/ui/patterns';
import { PageContainer } from '@nasnet/ui/layouts';

interface RouterStatusCardProps {
  routerName: string;
  ipAddress: string;
  isOnline: boolean;
  onConfigure: () => void;
}

export function RouterStatusCard({
  routerName,
  ipAddress,
  isOnline,
  onConfigure,
}: RouterStatusCardProps) {
  return (
    <Card className={cn('border', isOnline ? 'border-green-500/30' : 'border-red-500/30')}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{routerName}</CardTitle>
        {/* StatusBadge renders a compact dot on mobile, a labeled badge on desktop */}
        <StatusBadge status={isOnline ? 'online' : 'offline'} />
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="font-mono text-xs text-muted-foreground">{ipAddress}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onConfigure}
          className="w-full"
        >
          Configure
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Step 5 — Wrap in a page layout

```tsx
// apps/connect/src/app/pages/example/RouterStatusPage.tsx

import { PageContainer, ResponsiveShell } from '@nasnet/ui/layouts';
import { RouterStatusCard } from './RouterStatusCard';

export function RouterStatusPage() {
  return (
    <ResponsiveShell>
      <PageContainer
        title="Routers"
        description="Manage your connected MikroTik routers"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RouterStatusCard
            routerName="Office-Gateway"
            ipAddress="192.168.88.1"
            isOnline={true}
            onConfigure={() => console.log('configure')}
          />
        </div>
      </PageContainer>
    </ResponsiveShell>
  );
}
```

### What happens at each breakpoint

| Breakpoint | `ResponsiveShell` renders | `StatusBadge` renders |
|------------|--------------------------|----------------------|
| Mobile `<640px` | `MobileAppShell` with `BottomNavigation` | Compact colored dot |
| Tablet `640–1024px` | `AppShell` with collapsible sidebar | Labeled badge (medium) |
| Desktop `>1024px` | `AppShell` with fixed full sidebar | Labeled badge (full density) |

---

## Tokens — The Right Way to Style

Always reach for semantic tokens (Tier 2) rather than primitive Tailwind color utilities.

```tsx
// CORRECT — semantic tokens
<Button className="bg-primary text-primary-foreground">Connect</Button>
<div className="text-destructive">Connection failed</div>
<span className="text-muted-foreground">Last seen 2 min ago</span>

// INCORRECT — primitive colors bypass the token system
<Button className="bg-amber-500">Connect</Button>   // bypasses bg-primary
<div className="text-red-500">Failed</div>           // bypasses text-destructive
```

To get CSS custom properties on the page, import the variables stylesheet once at your app entry
point:

```tsx
// apps/connect/src/main.tsx
import '@nasnet/ui/tokens/variables.css';
```

To use TypeScript animation tokens in Framer Motion:

```tsx
import { transitions, durations, springs } from '@nasnet/ui/tokens';
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={transitions.enter}
/>
```

---

## Storybook Setup

### Running Storybook locally

```bash
# Primitives library (Button, Card, Input, etc.) — http://localhost:4400
npx nx run ui-primitives:storybook

# Patterns library (StatusBadge, DataTable, ServiceCard, etc.) — http://localhost:4401
npx nx run ui-patterns:storybook
```

### Build static Storybooks

```bash
# Build all Storybooks for deployment or review
npx nx run-many -t build-storybook

# Build a single library
npx nx run ui-primitives:build-storybook
npx nx run ui-patterns:build-storybook
```

### Version and compatibility note

NasNetConnect uses **Storybook 10.2.7** which is ESM-only. Story files must use `.stories.tsx`
extension. The `default export` must be a `Meta<typeof Component>` object. Use `fn()` from
`@storybook/test` (not `jest.fn()`) for action handlers.

```tsx
// libs/ui/patterns/src/status-badge/StatusBadge.stories.tsx (example pattern)
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { StatusBadge } from './status-badge';

const meta: Meta<typeof StatusBadge> = {
  title: 'Patterns/StatusBadge',
  component: StatusBadge,
};
export default meta;

type Story = StoryObj<typeof StatusBadge>;

export const Online: Story = {
  args: { status: 'online' },
};

export const Offline: Story = {
  args: { status: 'offline' },
};
```

### Storybook health check

```bash
npx storybook doctor
```

---

## Glossary

### Platform Presenter

A React component that renders the same data in a platform-optimized way. Every pattern component
in `@nasnet/ui/patterns` has up to three presenters:

- `ComponentName.Mobile.tsx` — touch-first, large tap targets (44 px), bottom-sheet interactions
- `ComponentName.Tablet.tsx` — hybrid layout, collapsible panels
- `ComponentName.Desktop.tsx` — dense tables, hover states, keyboard shortcuts

The root `ComponentName.tsx` file calls `usePlatform()` and delegates to the right presenter.
You never need to choose a presenter manually; just render `<ComponentName />`.

Example from `@nasnet/ui/patterns`:

```tsx
// connection-indicator/index.ts exports all three:
export {
  ConnectionIndicator,          // auto-selects presenter
  ConnectionIndicatorMobile,    // use when you need to force mobile layout
  ConnectionIndicatorDesktop,   // use when you need to force desktop layout
  useConnectionIndicator,       // headless hook — logic without rendering
} from './connection-indicator';
```

### Headless Hook

A custom React hook (`useComponentName`) that owns all business logic, state, and event handlers
for a pattern component, with no JSX. The three platform presenters each call this hook and
destructure what they need. This means the logic is tested once and the rendering is tested per
platform.

```tsx
// Pattern: logic in hook, presentation in presenter
const { status, latencyMs, handleReconnect } = useConnectionIndicator(props);
// Mobile presenter uses status + handleReconnect with large tap targets
// Desktop presenter uses all three with dense inline layout
```

### Token Tier (Primitive / Semantic / Component)

The design token system has three layers:

| Tier | Count | Example | When to use |
|------|-------|---------|-------------|
| **Primitive** (Tier 1) | ~80 | `var(--color-amber-500)` | Never in component code — internal to token system |
| **Semantic** (Tier 2) | ~70 | `var(--color-primary)`, `bg-destructive` | Always — the correct tier for component styling |
| **Component** (Tier 3) | ~50 | `var(--button-primary-bg)` | Use when a pre-built component token exists |

Tier 2 and Tier 3 tokens are available as Tailwind utility classes via the Tailwind config.
Tier 1 raw values should never appear directly in component code.

### Category Accent

One of 14 named color accents that visually identify a feature category throughout the UI.
Managed by `CategoryAccentProvider` and `useCategoryAccent` from `@nasnet/ui/primitives`.

```tsx
import {
  CategoryAccentProvider,
  useCategoryAccent,
  CATEGORIES,
} from '@nasnet/ui/primitives';
import type { Category } from '@nasnet/ui/primitives';

// Wrap a feature section
<CategoryAccentProvider category="security">
  <FeatureContent />
</CategoryAccentProvider>

// Consume the accent inside
const { color, icon, label } = useCategoryAccent();
```

The 14 categories are: Security, Monitoring, Networking, VPN, WiFi, Firewall, System, DHCP,
Routing, Tunnels, QoS, Hotspot, Logging, Backup.

### ChangeSet

The unit of work flowing through the Apply-Confirm-Merge pipeline. A ChangeSet is a batch of
router configuration commands that has been validated, conflict-checked, impact-analyzed, and
previewed before application. It travels through these states:

```
Draft → Validated → Previewed → Applied → Confirmed
                                         ↘ Rolled back (within 10-second undo window)
```

UI components for ChangeSet management are in `@nasnet/ui/patterns`:
`ValidationProgress`, `ConflictCard`, `ConflictList`.

### VIF (Virtual Interface Factory)

The mechanism by which network service instances (Tor, sing-box, Xray, MTProxy, Psiphon,
AdGuard Home) appear as native MikroTik interfaces on the router (e.g., `nnc-tor-usa`). Once a
service is installed, devices can be routed through it using standard interface routing without any
manual VLAN or firewall configuration.

Pattern components that expose VIF concepts: `ServiceCard`, `ServiceHealthBadge`,
`DeviceRoutingMatrix`, `KillSwitchToggle` (all from `@nasnet/ui/patterns`).

### Apply-Confirm-Merge

The three-phase configuration commit flow:

1. **Apply** — Changes are sent to the router. A 10-second undo window is started.
2. **Confirm** — User (or auto-timeout) acknowledges the changes are correct.
3. **Merge** — The pending ChangeSet is committed to the canonical state in the database.

If the undo window elapses without confirmation, an automatic rollback is executed. This flow is
governed by XState in the frontend and the ChangeSet service in the backend.

---

## Next Steps

| Goal | Document |
|------|---------|
| Browse all 40 primitive components | `02-primitives.md` _(coming)_ |
| Understand all 56 pattern components | `03-patterns.md` _(coming)_ |
| Build a full page with shell layouts | `04-layouts.md` _(coming)_ |
| Use animation and design tokens in depth | `05-tokens.md` _(coming)_ |
| Implement a new pattern from scratch | `06-platform-presenters.md` _(coming)_ |
| Build forms with RHFFormField + Zod | `07-forms.md` _(coming)_ |
| Ensure WCAG AAA compliance | `08-accessibility.md` _(coming)_ |
| Add a component to the library | `09-contributing.md` _(coming)_ |
| Authoritative design system reference | See `Docs/design/README.md` |
| Complete token reference | See `Docs/design/DESIGN_TOKENS.md` |
| Platform presenter deep-dive | See `Docs/design/PLATFORM_PRESENTER_GUIDE.md` |
| 56 pattern component catalog | See `Docs/design/ux-design/6-component-library.md` |
