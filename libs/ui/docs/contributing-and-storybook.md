---
sidebar_position: 13
title: Contributing & Storybook
---

# Contributing & Storybook Guide

This guide covers adding new UI components, writing Storybook stories, and the PR review process.
Every component must follow the **three-layer architecture** and **Headless + Platform Presenters**
pattern for consistency and maintainability.

## Overview

The NasNetConnect UI library is built on principles of:

- **Reusability**: Components are shared across all features
- **Responsive Design**: Automatic platform detection (Mobile/Tablet/Desktop)
- **Accessibility**: WCAG AAA compliance by default
- **Performance**: Memoization, lazy loading, and virtualization when needed
- **Developer Experience**: Clear patterns, comprehensive tests, documented stories

All new components should be added to either:

- **`libs/ui/primitives`** — Atomic building blocks (Button, Card, Input, Dialog, etc.)
- **`libs/ui/patterns`** — Composite reusable components (StatusBadge, DataTable, ResourceCard,
  etc.)

Never add business logic to components. Use the **headless hook pattern** to separate logic from
rendering.

---

## New Component Checklist

Follow these steps to create a production-ready component:

### Step 1: Create the Headless Hook

Create a file `use{ComponentName}.ts` containing all business logic, state management, and event
handling. This hook should have no rendering code.

```typescript
// useResourceCard.ts
import { useMemo, useCallback } from 'react';

export interface UseResourceCardProps<T extends Resource> {
  resource: T;
  actions?: Action[];
  expanded?: boolean;
  onToggle?: () => void;
}

export interface UseResourceCardReturn {
  status: Status;
  isOnline: boolean;
  statusColor: string;
  primaryAction: Action | undefined;
  secondaryActions: Action[];
  handleToggle: () => void;
  handlePrimaryAction: () => void;
}

export function useResourceCard<T extends Resource>(
  props: UseResourceCardProps<T>
): UseResourceCardReturn {
  const { resource, actions = [], expanded = false, onToggle } = props;

  const status = useMemo(() => resource.runtime?.status || 'unknown', [resource.runtime?.status]);

  const isOnline = useMemo(() => status === 'online' || status === 'connected', [status]);

  const handleToggle = useCallback(() => {
    onToggle?.();
  }, [onToggle]);

  return {
    status,
    isOnline,
    statusColor: getStatusColor(status),
    primaryAction: actions[0],
    secondaryActions: useMemo(() => actions.slice(1), [actions]),
    handleToggle,
    handlePrimaryAction: useCallback(() => {
      actions[0]?.onClick?.();
    }, [actions]),
  };
}
```

**Key principles:**

- Use `useMemo` for derived state (status color, computed values)
- Use `useCallback` for event handlers (ensures stable references)
- Export both the hook function and its types
- Keep hook pure (no side effects except state/memos)

### Step 2: Create Mobile Presenter

Create `{ComponentName}.Mobile.tsx` with touch-optimized layout.

```typescript
// ResourceCard.Mobile.tsx
import { Card, Badge, Button } from '@nasnet/ui/primitives';
import { useResourceCard, type UseResourceCardProps } from './useResourceCard';

export function ResourceCardMobile<T extends Resource>(
  props: UseResourceCardProps<T>
) {
  const { status, primaryAction, handlePrimaryAction } = useResourceCard(props);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between min-h-[44px]">
        <div className="flex items-center gap-3">
          <Badge variant={getStatusVariant(status)}>{status}</Badge>
          <span className="font-medium">{props.resource.name}</span>
        </div>
        {primaryAction && (
          <Button
            size="lg"
            className="min-w-[44px] min-h-[44px]"
            onClick={handlePrimaryAction}
          >
            {primaryAction.label}
          </Button>
        )}
      </div>
    </Card>
  );
}
```

**Mobile design principles:**

- Minimum 44px touch targets
- Single-column, stacked layout
- Bottom sheets for actions
- Generous padding (16px+)
- Larger typography for readability

### Step 3: Create Desktop Presenter

Create `{ComponentName}.Desktop.tsx` with dense, information-rich layout.

```typescript
// ResourceCard.Desktop.tsx
import { Card, Badge, Button, DropdownMenu } from '@nasnet/ui/primitives';
import { useResourceCard, type UseResourceCardProps } from './useResourceCard';

export function ResourceCardDesktop<T extends Resource>(
  props: UseResourceCardProps<T>
) {
  const { status, primaryAction, secondaryActions, handlePrimaryAction } =
    useResourceCard(props);

  return (
    <Card className="p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <Badge variant={getStatusVariant(status)}>{status}</Badge>
          <div className="min-w-0">
            <h3 className="font-medium truncate">{props.resource.name}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {props.resource.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {primaryAction && (
            <Button size="sm" onClick={handlePrimaryAction}>
              {primaryAction.label}
            </Button>
          )}
          {secondaryActions.length > 0 && (
            <DropdownMenu>{/* Secondary actions */}</DropdownMenu>
          )}
        </div>
      </div>
    </Card>
  );
}
```

**Desktop design principles:**

- Maximize information density
- Hover states for interactions
- Dropdown menus for secondary actions
- Multi-column layouts
- Compact spacing (8-12px)

### Step 4: Create Auto-Detect Wrapper

Create `{ComponentName}.tsx` that uses `usePlatform()` to route to the correct presenter.

```typescript
// ResourceCard.tsx
import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { ResourceCardMobile } from './ResourceCard.Mobile';
import { ResourceCardDesktop } from './ResourceCard.Desktop';
import type { UseResourceCardProps } from './useResourceCard';

export interface ResourceCardProps<T extends Resource>
  extends UseResourceCardProps<T> {}

function ResourceCardComponent<T extends Resource>(
  props: ResourceCardProps<T>
) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <ResourceCardMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <ResourceCardDesktop {...props} />;
  }
}

export const ResourceCard = memo(ResourceCardComponent) as typeof ResourceCardComponent;
ResourceCard.displayName = 'ResourceCard';
```

**Wrapper principles:**

- Wrap with `React.memo()` for performance
- Set `displayName` for debugging
- Keep wrapper logic minimal (just platform routing)

### Step 5: Create Barrel Exports

Create `index.ts` exporting all public APIs.

```typescript
// index.ts
export { ResourceCard } from './ResourceCard';
export type { ResourceCardProps } from './ResourceCard';

export { ResourceCardMobile } from './ResourceCard.Mobile';
export { ResourceCardDesktop } from './ResourceCard.Desktop';

export { useResourceCard } from './useResourceCard';
export type { UseResourceCardProps, UseResourceCardReturn } from './useResourceCard';
```

### Step 6: Write Unit Tests

Create `{ComponentName}.test.tsx` with 3 test suites:

```typescript
// ResourceCard.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ResourceCard } from './ResourceCard';
import { useResourceCard } from './useResourceCard';

expect.extend(toHaveNoViolations);

describe('useResourceCard', () => {
  it('returns correct status for online resource', () => {
    const { result } = renderHook(() =>
      useResourceCard({
        resource: { runtime: { status: 'online' } },
      })
    );

    expect(result.current.isOnline).toBe(true);
  });
});

describe('ResourceCard', () => {
  it('renders resource name', () => {
    render(
      <ResourceCard
        resource={{ name: 'Test Resource', runtime: { status: 'online' } }}
      />
    );

    expect(screen.getByText('Test Resource')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ResourceCard
        resource={{ name: 'Test', runtime: { status: 'online' } }}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**Test coverage targets:**

- Hook logic (status calculations, handlers)
- Component rendering (props → output)
- Accessibility (axe-core violations)
- Responsive behavior (platform detection)

### Step 7: Write Storybook Stories

Create `{ComponentName}.stories.tsx` with comprehensive variants. See "Storybook Guide" section
below for detailed patterns.

### Step 8: Update Barrel Exports

Add the component to `libs/ui/patterns/src/index.ts` (or primitives equivalent) so it's exported
from the package.

```typescript
// libs/ui/patterns/src/index.ts
export { ResourceCard } from './common/resource-card';
export type { ResourceCardProps } from './common/resource-card';
```

### Step 9: Update Documentation

Add a row to the pattern catalog in `libs/ui/docs/patterns-status-and-data.md`:

| Pattern      | Description                                      | Mobile     | Desktop     | Status |
| ------------ | ------------------------------------------------ | ---------- | ----------- | ------ |
| ResourceCard | Generic resource display with status and actions | Card-based | Dense table | Stable |

---

## File & Folder Structure

### Directory Organization

```
libs/ui/patterns/src/common/{pattern-name}/
├── use{PatternName}.ts       # Headless hook (business logic only)
├── {PatternName}.tsx         # Auto-detect wrapper component
├── {PatternName}.Mobile.tsx  # Mobile presenter
├── {PatternName}.Desktop.tsx # Desktop presenter
├── {PatternName}.test.tsx    # Unit + a11y tests
├── {PatternName}.stories.tsx # Storybook stories
├── types.ts                  # TypeScript types (if complex)
└── index.ts                  # Barrel exports
```

### Naming Conventions

| Type             | Convention                  | Example                                      |
| ---------------- | --------------------------- | -------------------------------------------- |
| Components       | PascalCase                  | `ResourceCard.tsx`, `DataTable.tsx`          |
| Hooks            | camelCase with `use` prefix | `useResourceCard.ts`, `useDataTable.ts`      |
| Folders          | kebab-case                  | `resource-card/`, `data-table/`              |
| Types/Interfaces | PascalCase                  | `ResourceCardProps`, `UseResourceCardReturn` |

### File Size Limits

- **Component files**: 300-500 lines maximum
- **Hook files**: 300-400 lines maximum
- **Test files**: 800 lines maximum
- **Story files**: No strict limit, but organize large stories into multiple exports

### Folder Size Limits

- **Maximum 10 files per folder**
- **When exceeding 10 files**, create logical subfolders:

```typescript
// Bad - 12 component files in one folder
features/dashboard/
├── Component1.tsx through Component12.tsx  // Too many!

// Good - organized subfolders
features/dashboard/
├── index.ts
├── DashboardPage.tsx
├── components/         // Subfolder for widgets
│   ├── StatsWidget.tsx
│   ├── ChartWidget.tsx
│   └── AlertWidget.tsx
├── hooks/              // Subfolder for hooks
│   ├── useDashboardData.ts
│   └── useRefreshInterval.ts
└── types.ts
```

---

## Storybook Guide

### Story File Structure

Every story file must follow the **Storybook 10.2.7 ESM format**:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { ResourceCard } from './ResourceCard';

// 1. Define metadata
const meta: Meta<typeof ResourceCard> = {
  title: 'Patterns/Common/ResourceCard', // Determines sidebar path
  component: ResourceCard,
  tags: ['autodocs'], // Enable automatic docs
  parameters: {
    layout: 'padded', // Storybook canvas padding
    docs: {
      description: {
        component: 'Shows resource status and actions...',
      },
    },
  },
  argTypes: {
    // Storybook controls
    resource: { control: 'object' },
    actions: { control: 'object' },
    expanded: { control: 'boolean' },
  },
};

export default meta;

// 2. Define story type
type Story = StoryObj<typeof ResourceCard>;

// 3. Create stories
export const Online: Story = {
  args: {
    resource: { name: 'WireGuard VPN', runtime: { status: 'online' } },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a resource in online/connected state.',
      },
    },
  },
};

export const Offline: Story = {
  args: {
    resource: { name: 'OpenVPN', runtime: { status: 'offline' } },
  },
};

// 4. Platform-responsive stories
export const MobileVariant: Story = {
  args: Online.args,
  parameters: {
    viewport: {
      name: 'Mobile (375px)',
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile-optimized layout with 44px touch targets.',
      },
    },
  },
};

export const TabletVariant: Story = {
  args: Online.args,
  parameters: {
    viewport: {
      name: 'Tablet (768px)',
      defaultViewport: 'tablet',
    },
  },
};

// 5. Interactive stories with play functions
export const Interactive: Story = {
  args: { resource: { name: 'Test', runtime: { status: 'online' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /toggle/i });
    await userEvent.click(button);
  },
};
```

### Viewport Presets

Use Storybook's viewport system to test responsive behavior:

```typescript
parameters: {
  viewport: {
    defaultViewport: 'mobile1',  // Mobile: 375px
  },
}

// Built-in presets:
'mobile1'       // 375x667 (iPhone)
'tablet'        // 768x1024
'desktop'       // 1024x768+ (default)
```

### Story Best Practices

**1. Descriptive Names**

```typescript
// Good
export const OnlineWithActions: Story = {
  /* ... */
};

// Bad
export const Test1: Story = {
  /* ... */
};
```

**2. Use `fn()` for Mock Actions**

```typescript
import { fn } from 'storybook/test';

const meta: Meta = {
  argTypes: {
    onDelete: { action: 'deleted' },
  },
};

export const WithActions: Story = {
  args: {
    onDelete: fn().mockName('onDelete'),
  },
};
```

**3. Include Platform Variants**

```typescript
// Create Desktop, Mobile, Tablet versions for each major story
export const Default: Story = {
  /* desktop */
};
export const DefaultMobile: Story = { args: Default.args, parameters: { viewport: 'mobile1' } };
export const DefaultTablet: Story = { args: Default.args, parameters: { viewport: 'tablet' } };
```

**4. Document Expected Behavior**

```typescript
export const WithError: Story = {
  args: { error: new Error('Failed to load') },
  parameters: {
    docs: {
      description: {
        story: 'Shows error state with retry button and detailed error message.',
      },
    },
  },
};
```

### Storybook Configuration

Storybook is configured in two files:

**`libs/ui/patterns/.storybook/main.ts`** (for patterns):

- Includes 18 monorepo path aliases for imports
- Loads stories from patterns, features, layouts, and connect
- Configured for Vite + React

**`libs/ui/primitives/.storybook/main.ts`** (for primitives):

- Simpler config (only primitives stories)
- Same basic setup

Key aliases configured:

```typescript
'@nasnet/ui/patterns'
'@nasnet/ui/primitives'
'@nasnet/ui/layouts'
'@nasnet/core/types'
'@nasnet/core/utils'
'@nasnet/features/*'
'@nasnet/api-client/*'
'@nasnet/state/stores'
'@': join(__dirname, '../../../../apps/connect/src')
```

### Running Storybook

```bash
# Primitives library (port 4400)
npx nx run ui-primitives:storybook

# Patterns library (port 4401)
npx nx run ui-patterns:storybook

# Build static Storybook
npx nx run ui-patterns:build-storybook

# Build all Storybooks
npx run-many -t build-storybook
```

---

## Accessibility Checklist

Every component must meet **WCAG AAA** standards. Use this 7-point checklist:

- [ ] **7:1 Contrast Ratio** — Text must have 7:1 contrast against background (WCAG AAA)

  - Use `contrast-checker.io` to verify
  - Applies to normal text, buttons, badges, etc.

- [ ] **44px Touch Targets** — Interactive elements (buttons, links, inputs) must be 44x44px minimum
      on mobile

  - Use Tailwind: `min-w-[44px] min-h-[44px]`
  - Desktop can use smaller (32px)

- [ ] **Keyboard Navigation** — All interactive elements must be reachable via Tab/Shift+Tab

  - Test: open DevTools, press Tab repeatedly
  - No keyboard traps
  - Focus must be visible

- [ ] **Screen Reader Support** — ARIA labels for buttons, inputs, and custom controls

  - Buttons: `aria-label="Action name"`
  - Inputs: `<label htmlFor="input-id">`
  - Custom roles: `role="button"` (if not using `<button>`)
  - Regions: `<nav>`, `<main>`, `<aside>` semantic HTML

- [ ] **Focus Indicators** — 3px visible ring around focused elements

  - Tailwind: `focus:ring-2 focus:ring-primary`
  - Never remove default outline without replacement

- [ ] **Reduced Motion Support** — Respect `prefers-reduced-motion` media query

  - Disable animations for users with motion sensitivity
  - Tailwind: `motion-safe:animate-pulse` (animation only if safe)

- [ ] **Semantic HTML** — Use proper HTML elements (not divs everywhere)
  - `<button>` for buttons (not `<div onClick>`)
  - `<a>` for links
  - `<input>`, `<select>`, `<textarea>` for form fields
  - Heading hierarchy: `<h1>` → `<h2>` → `<h3>` (no skipping levels)

**Automated Testing:**

```bash
# Test in Storybook (a11y addon)
npx nx run ui-patterns:storybook
# Open story, click "Accessibility" tab → "Violations" shows failing checks

# Or test programmatically in tests
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<ResourceCard {...props} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Performance Guidelines

### When to Use `React.memo()`

Wrap components with `React.memo()` if they:

- Receive complex props (objects, arrays)
- Are expensive to render
- Re-render frequently due to parent updates

```typescript
export const ResourceCard = memo(ResourceCardComponent);
ResourceCard.displayName = 'ResourceCard';
```

### When to Use `useCallback()` / `useMemo()`

**`useCallback`**: Event handlers to prevent child re-renders

```typescript
const handleDelete = useCallback(() => {
  onDelete(resource.id);
}, [onDelete, resource.id]);
```

**`useMemo`**: Expensive computations or derived state

```typescript
const statusColor = useMemo(() => {
  // Expensive computation or object creation
  return getStatusColorFromStatus(status);
}, [status]);
```

### Lazy Loading

For heavy components (charts, large tables), use `React.lazy()`:

```typescript
const HeavyChart = lazy(() => import('./HeavyChart'));

export function Page() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HeavyChart />
    </Suspense>
  );
}
```

### Bundle Size Awareness

The entire frontend bundle must be **`<3MB` gzipped**. Monitor bundle size:

```bash
npm run build:check    # Builds and reports bundle size
```

Guidelines:

- Don't add large dependencies without justification
- Use tree-shaking compatible imports (`import { X } from 'lib'` not `import * as all from 'lib'`)
- Lazy load feature-heavy components
- Avoid duplicating utility functions (use shared libs)

---

## PR Review Checklist

Reviewers should verify:

### Architecture & Design

- [ ] Follows 3-layer architecture (Primitives → Patterns → Domain)
- [ ] Has mobile + desktop presenters (if pattern component)
- [ ] Headless hook separates logic from rendering
- [ ] No upward dependency violations (e.g., patterns importing from features)
- [ ] Design tokens used (not raw hex values like `#f3a629`)

### Implementation Quality

- [ ] File size ≤500 lines (test files ≤800)
- [ ] Max 10 files per folder (subfolders created if needed)
- [ ] Clear naming (PascalCase components, camelCase hooks)
- [ ] Proper barrel exports in `index.ts`
- [ ] TypeScript types exported alongside components

### Storybook & Documentation

- [ ] Story file exists with `Meta` type and `StoryObj`
- [ ] Stories cover major variants (Empty, Loaded, Error, Loading)
- [ ] Platform variants for responsive stories (Mobile/Tablet/Desktop)
- [ ] Descriptive story names (not `Test1`, `Test2`)
- [ ] `tags: ['autodocs']` included for auto-documentation
- [ ] Component description in Meta.parameters.docs

### Accessibility (WCAG AAA)

- [ ] 7:1 contrast ratio verified (use contrast checker)
- [ ] Touch targets 44px minimum on mobile
- [ ] Full keyboard navigation (Tab/Shift+Tab)
- [ ] ARIA labels on buttons/inputs
- [ ] Focus indicators visible (ring-2 or equivalent)
- [ ] Semantic HTML (button, input, nav, etc.)
- [ ] `axe` or `jest-axe` tests passing

### Testing

- [ ] Unit tests for hooks and components
- [ ] Accessibility tests passing (`toHaveNoViolations`)
- [ ] Mock data realistic and properly typed
- [ ] Error states tested
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

### Performance

- [ ] `React.memo()` used when appropriate
- [ ] `useCallback` for event handlers
- [ ] `useMemo` for expensive computations
- [ ] No unnecessary re-renders
- [ ] Bundle size impact assessed

### Documentation & Clarity

- [ ] Code comments explain non-obvious logic
- [ ] Stories explain visual variants
- [ ] Parameter descriptions in argTypes
- [ ] Updated `libs/ui/docs/patterns-status-and-data.md` (if new pattern)

---

## Cross-References

- **Architecture:** See `Docs/architecture/adrs/018-headless-platform-presenters.md`
- **Component Catalog:** See `libs/ui/docs/patterns-status-and-data.md`
- **Design System:** See `Docs/design/DESIGN_TOKENS.md`
- **Responsive Design:** See `Docs/design/PLATFORM_PRESENTER_GUIDE.md`
- **Accessibility:** See `Docs/design/ux-design/8-responsive-design-accessibility.md`
- **Testing Strategy:** See `Docs/architecture/implementation-patterns/testing-strategy-patterns.md`
- **Existing Patterns Guide:** See `libs/ui/patterns/PATTERNS.md`

---

## Common Patterns Reference

See `libs/ui/patterns/src/` for 50+ implemented patterns:

**Common Patterns** (~30):

- StatusBadge, DataTable, ResourceCard, EmptyState, LoadingSkeleton
- ConfirmDialog, FormField, Toast, MetricDisplay, ConnectionIndicator

**Domain Patterns** (~26):

- VPN, Firewall, Network, Wireless, Services patterns
- Located in `libs/ui/patterns/src/domain/`

Use existing patterns as templates when building new components.
