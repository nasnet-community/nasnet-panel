# Storybook Guide

NasNetConnect runs three independent Storybook instances, one per library tier. All use **Storybook 10.2.7** (ESM-only) with the `@storybook/react-vite` framework.

See also:
- [UI System Overview](../ui-system/overview.md) — three-layer component architecture
- [Key Commands](../getting-started/key-commands.md) — all Storybook commands

---

## Storybook Instances

| Instance | Port | Covers | Config Location |
|----------|------|--------|-----------------|
| `ui-primitives` | 4400 | shadcn/Radix wrapper components | `libs/ui/primitives/.storybook/` |
| `ui-patterns` | 4401 | Pattern components + feature components + app routes | `libs/ui/patterns/.storybook/` |
| `connect` | 4402 | App-level skeletons, route-level stories | `apps/connect/.storybook/` |

### Running Storybook

```bash
# Primitives library (port 4400)
npx nx run ui-primitives:storybook

# Patterns library (port 4401) — includes feature and app stories
npx nx run ui-patterns:storybook

# connect app (port 4402) — skeleton and route stories
npx nx run connect:storybook

# Build static Storybook for all instances
npx nx run-many -t build-storybook
# equivalent to:
npm run check:storybook

# Health check
npx storybook doctor
```

---

## Configuration

### Framework

All three Storybook instances use `@storybook/react-vite`, which delegates to the project's own Vite for bundling. This means stories see the same Vite plugins, path aliases, and optimisations as the production app.

### Addons

Both the primitives and patterns Storybook instances include:
- `@storybook/addon-a11y` — accessibility checks (WCAG AAA contrast rule enabled)
- `@storybook/addon-docs` — MDX documentation and auto-generated API tables

```ts
// libs/ui/primitives/.storybook/main.ts (same pattern for all three)
addons: [
  getAbsolutePath('@storybook/addon-a11y'),
  getAbsolutePath('@storybook/addon-docs'),
],
```

### Path Aliases

The `viteFinal` hook in each `main.ts` mirrors the path aliases from `apps/connect/vite.config.ts`. All 18 `@nasnet/*` aliases are resolved so stories can import from any library:

```ts
// apps/connect/.storybook/main.ts (abbreviated)
viteFinal: async (config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...config.resolve?.alias,
      '@': resolve(__dirname, '../src'),
      '@nasnet/ui/primitives': resolve(root, 'libs/ui/primitives/src'),
      '@nasnet/ui/patterns':   resolve(root, 'libs/ui/patterns/src'),
      '@nasnet/api-client/queries': resolve(root, 'libs/api-client/queries/src'),
      // ... all other aliases
    },
  },
}),
```

### Story Discovery

**`ui-primitives`** (`libs/ui/primitives/.storybook/main.ts`):
```ts
stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
```

**`ui-patterns`** (`libs/ui/patterns/.storybook/main.ts`) — includes feature and app stories:
```ts
stories: [
  '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  '../../../features/*/src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  '../../layouts/src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  '../../../../apps/connect/src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
],
```

**`connect`** (`apps/connect/.storybook/main.ts`):
```ts
stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
```

Story files co-located with routes (e.g., `src/routes/router/$id/dhcp.stories.tsx`) are excluded from the TanStack Router route tree via `routeFileIgnorePattern: '\\.stories\\.'` in `vite.config.ts`.

---

## Preview Configuration

### Global Decorators (`apps/connect/.storybook/preview.tsx`)

Every story in the `connect` Storybook is wrapped in this provider stack:

```tsx
decorators: [
  (Story, context) => {
    const isDark = context.globals.theme === 'dark';
    return (
      <MockApolloProvider>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <PlatformProvider>
              <AnimationProvider>
                <ToastProvider>
                  <div className={isDark ? 'dark' : ''} data-theme={isDark ? 'dark' : 'light'}>
                    <div className="p-4 min-h-screen bg-background text-foreground">
                      <Story />
                    </div>
                  </div>
                </ToastProvider>
              </AnimationProvider>
            </PlatformProvider>
          </I18nProvider>
        </QueryClientProvider>
      </MockApolloProvider>
    );
  },
],
```

This means stories automatically get:
- A `MockApolloProvider` with zero retries (for predictable mock data)
- A `QueryClientProvider` (TanStack Query, also zero retries)
- i18n context (`I18nProvider`)
- Platform detection (`PlatformProvider`)
- Animation context
- Toast notifications

The `ui-primitives` decorator is simpler — it only wraps in the dark/light theme div, since primitives have no Apollo or routing dependencies.

### Theme Switcher

A global **Theme** toolbar button (sun/moon) is registered in all three instances:

```ts
globalTypes: {
  theme: {
    name: 'Theme',
    defaultValue: 'light',
    toolbar: {
      icon: 'circlehollow',
      items: [
        { value: 'light', icon: 'sun', title: 'Light' },
        { value: 'dark', icon: 'moon', title: 'Dark' },
      ],
    },
  },
},
```

Switching theme applies/removes the `.dark` class, activating Tailwind dark-mode CSS variables. Background defaults to `light` (`#F1F5F9`).

### Viewport Presets

All three Storybook instances define the same three platform viewports:

| Preset | Width × Height | Use |
|--------|---------------|-----|
| `mobile` | 375 × 667 | iPhone SE / consumer mobile |
| `tablet` | 768 × 1024 | iPad / hybrid layout |
| `desktop` | 1280 × 800 | Pro desktop view |

These map directly to the three platform breakpoints (`<640px`, `640-1024px`, `>1024px`) used by Platform Presenters.

### Accessibility Checks

`@storybook/addon-a11y` is configured with the enhanced colour-contrast rule:

```ts
a11y: {
  config: {
    rules: [
      { id: 'color-contrast-enhanced', enabled: true }, // WCAG AAA 7:1
    ],
  },
},
```

The accessibility panel appears below each story. Red failures are blocking — fix them before merging.

---

## Writing Stories (CSF3 Format)

All stories use **Component Story Format 3 (CSF3)**. This is the standard format used throughout the codebase.

### Minimal Story

```tsx
// libs/ui/patterns/src/status-badge/StatusBadge.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from './StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'Patterns/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Online: Story = {
  args: {
    status: 'online',
    label: 'Connected',
  },
};

export const Offline: Story = {
  args: {
    status: 'offline',
    label: 'Disconnected',
  },
};
```

### Story with Viewport Variants

For platform-aware components, add explicit viewport stories:

```tsx
export const Default: Story = {
  args: { items: mockItems },
};

export const Mobile: Story = {
  args: { items: mockItems },
  parameters: {
    viewport: { defaultViewport: 'mobile' },
  },
};

export const Tablet: Story = {
  args: { items: mockItems },
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};

export const Desktop: Story = {
  args: { items: mockItems },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
```

### Story with Documentation

```tsx
const meta: Meta<typeof DHCPPoolCard> = {
  title: 'App/Router/DHCP/DHCPPoolCard',
  component: DHCPPoolCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Displays a single DHCP pool with address range and lease count.',
      },
    },
  },
};

export const WithLeases: Story = {
  args: { pool: mockPool },
  parameters: {
    docs: {
      description: {
        story: 'Shows the pool card when active leases are present.',
      },
    },
  },
};
```

### Route-Level Story (Skeleton)

Route files with lazy-loaded tabs co-locate a story for the skeleton loading state:

```tsx
// apps/connect/src/routes/router/$id/dhcp.stories.tsx
import { Skeleton } from '@nasnet/ui/primitives';
import type { Meta, StoryObj } from '@storybook/react';

function DHCPTabSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

const meta: Meta<typeof DHCPTabSkeleton> = {
  title: 'App/Router/DHCPTab',
  component: DHCPTabSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'DHCP tab with lazy loading and skeleton fallback for optimal bundle size.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DHCPTabSkeleton>;

export const Loading: Story = { render: () => <DHCPTabSkeleton /> };
export const LoadingMobile: Story = {
  render: () => <DHCPTabSkeleton />,
  parameters: { viewport: { defaultViewport: 'mobile' } },
};
```

### Story Naming Conventions

| Pattern | Example Title |
|---------|--------------|
| Primitives | `'Primitives/Button'` |
| Pattern components | `'Patterns/DataTable'` |
| App-level components | `'App/AppHeader'` |
| Router panel tabs | `'App/Router/FirewallTab'` |
| Feature components | `'Features/Alerts/AlertList'` |
| Skeletons | `'App/Skeletons/DashboardSkeleton'` |

---

## Story File Location Conventions

Stories are co-located with the component they document:

```
libs/ui/patterns/src/status-badge/
├── StatusBadge.tsx
├── StatusBadge.mobile.tsx
├── StatusBadge.desktop.tsx
├── StatusBadge.stories.tsx    ← co-located story
└── index.ts

apps/connect/src/routes/router/$id/
├── dhcp.tsx                   ← route
├── dhcp.stories.tsx           ← route story (skeleton)
└── ...
```

The `ui-patterns` Storybook scans `../../../../apps/connect/src/**/*.stories.*` so all app stories are visible in the patterns Storybook (port 4401) alongside pattern library stories.

---

## Building Static Storybook

```bash
# Build all Storybook instances
npx nx run-many -t build-storybook

# Build a specific instance
npx nx run connect:build-storybook
npx nx run ui-patterns:build-storybook
npx nx run ui-primitives:build-storybook
```

Output goes to `dist/storybook/{connect,ui-patterns,ui-primitives}/`. Static Storybooks are deployed for PR review via Chromatic (see `chromatic` in `package.json` devDependencies).

---

## Interaction Tests

Storybook interaction tests (using `@storybook/test`) can be added to any story to verify behaviour:

```tsx
import { expect, userEvent, within } from '@storybook/test';

export const SubmitsForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('IP Address');
    await userEvent.type(input, '192.168.1.1');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(canvas.getByText('Saved')).toBeVisible();
  },
};
```

Run interaction tests via the Storybook UI or `npx nx run connect:test-storybook`.
