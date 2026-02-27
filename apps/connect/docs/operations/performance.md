# Performance Guide

The `apps/connect` frontend operates under strict resource constraints driven by its deployment
environment: a single Docker container running on a MikroTik router with limited CPU, RAM, and flash
storage.

See also:

- [Build System](../architecture/build-system.md) — Vite chunk splitting configuration
- [UI System Overview](../ui-system/overview.md) — component architecture
- [Key Commands](../getting-started/key-commands.md) — build and check commands

---

## Hard Constraints

| Constraint        | Target             | Enforcer                    |
| ----------------- | ------------------ | --------------------------- |
| Docker image size | < 10 MB compressed | `npm run docker:check-size` |
| Runtime RAM       | < 50 MB            | Manual monitoring           |
| Frontend bundle   | < 3 MB gzipped     | `npm run build:check`       |
| Cold start        | < 5 s              | Manual profiling            |

The frontend bundle is embedded into the Go binary via `go:embed`. Exceeding the 3 MB bundle budget
makes it impossible to stay under the 10 MB Docker image target. These are not soft guidelines — CI
enforces the bundle limit.

---

## Bundle Size Budget

### Checking the Budget

```bash
# Build and report compressed sizes
npm run build:check
# Equivalent to:
npx nx build connect && node scripts/check-bundle-size.mjs

# Build with visual treemap (opens in browser)
npm run build:analyze
```

Vite's `reportCompressedSize: true` prints gzipped sizes for every chunk after each build. Review
this output whenever adding a new dependency.

### Adding Dependencies

Before adding a `npm install <package>`:

1. Check the package size on [bundlephobia.com](https://bundlephobia.com)
2. Consider whether the functionality already exists in a library already in the bundle
3. Prefer smaller alternatives (e.g., `date-fns` functions over full `moment.js`)
4. If the package is only needed on one page, use dynamic `import()` to keep it out of the initial
   bundle

---

## Manual Chunk Splitting

Vite's `manualChunks` in `apps/connect/vite.config.ts` splits vendor code into stable named chunks.
Stable chunk names maximise browser cache hit rates — when app code changes, vendor chunks remain
cached.

```ts
// apps/connect/vite.config.ts
rollupOptions: {
  output: {
    manualChunks: {
      'vendor-react':     ['react', 'react-dom', 'scheduler'],
      'vendor-router':    ['@tanstack/react-router'],
      'vendor-graphql':   ['@apollo/client', 'graphql'],
      'vendor-state':     ['zustand', 'xstate', '@xstate/react'],
      'vendor-animation': ['framer-motion'],
      'vendor-ui': [
        '@radix-ui/react-dialog',
        '@radix-ui/react-tabs',
        '@radix-ui/react-toast',
        '@radix-ui/react-switch',
        '@radix-ui/react-select',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-popover',
      ],
      'vendor-table': ['@tanstack/react-table', '@tanstack/react-virtual'],
      'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
      'vendor-i18n':  ['i18next', 'react-i18next', 'i18next-http-backend', 'i18next-browser-languagedetector'],
    },
  },
},
```

**Strategy:**

- `vendor-react` loads first and never changes — always cached after first visit
- Heavy libraries like `framer-motion` are isolated so they are not invalidated when app code
  changes
- `vendor-table` and `vendor-forms` are only needed on specific pages — they benefit from lazy
  loading too

When adding a substantial new library, add it to an appropriate manual chunk (or create a new one)
rather than letting it land in the catch-all app chunk.

---

## Route-Based Lazy Loading

Heavy tabs and pages are code-split at the route level using TanStack Router's file-based routing
combined with `createLazyWithPreload`.

### Pattern

```ts
// apps/connect/src/app/routes/router-panel/tabs/lazy.ts
import { createLazyWithPreload } from '@nasnet/ui/patterns';

export const [LazyFirewallTab, preloadFirewallTab] = createLazyWithPreload(() =>
  import('./FirewallTab').then((m) => ({ default: m.FirewallTab }))
);
```

```tsx
// apps/connect/src/routes/router/$id/firewall.tsx
import { LazyBoundary } from '@nasnet/ui/patterns';
import { LazyFirewallTab } from '@/app/routes/router-panel/tabs/lazy';

export const Route = createFileRoute('/router/$id/firewall')({
  component: () => (
    <LazyBoundary fallback={<FirewallTabSkeleton />}>
      <LazyFirewallTab />
    </LazyBoundary>
  ),
});
```

### Currently Lazy-Loaded Tabs

| Tab            | Estimated Chunk | Reason                             |
| -------------- | --------------- | ---------------------------------- |
| FirewallTab    | ~50 KB          | Large rule tables with filtering   |
| VPNTab         | ~45 KB          | Protocol-specific form variants    |
| LogsTab        | ~40 KB          | Virtualization + log processing    |
| DHCPTab        | ~35 KB          | Lease table + pool management      |
| DnsTab         | ~30 KB          | Server list + static entries table |
| PluginStoreTab | ~30 KB          | Plugin marketplace UI              |
| NetworkTab     | ~25 KB          | Medium complexity                  |

**Eagerly loaded** (lightweight, most-visited):

- `OverviewTab` — entry point for every router panel visit
- `WiFiTab` — simple interface list

### Preloading on Hover

`createLazyWithPreload` returns a `[LazyComponent, preloadFn]` pair. The preload function can be
called in `onMouseEnter` on navigation links so the chunk is already in-flight before the user
clicks:

```tsx
<NavLink
  to="/router/$id/firewall"
  onMouseEnter={preloadFirewallTab}
>
  Firewall
</NavLink>
```

### Background Preload on Router Panel Entry

When the user navigates into any router panel, all heavy tabs are preloaded in the background using
`requestIdleCallback`:

```ts
// apps/connect/src/app/routes/router-panel/tabs/lazy.ts
export function preloadAllHeavyTabs(): void {
  const preload = () => {
    preloadFirewallTab();
    preloadLogsTab();
    preloadDHCPTab();
    preloadDnsTab();
    preloadVPNTab();
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(preload, { timeout: 3000 });
  } else {
    setTimeout(preload, 1000);
  }
}
```

This ensures subsequent tab switches feel instant even on slow connections.

### Skeleton Fallbacks

Every lazy route provides an accurate skeleton component as the `LazyBoundary` fallback. Skeletons
mirror the real layout (header, grid structure, table placeholders) to minimise layout shift. See
the [Storybook Guide](./storybook.md) for conventions on documenting skeletons.

---

## Virtualization for Large Lists

The project uses **TanStack Virtual** (`@tanstack/react-virtual`) for rendering large data sets. It
is exposed via two pattern components in `libs/ui/patterns/src/virtualization/`:

### `VirtualizedList`

```tsx
import { VirtualizedList } from '@nasnet/ui/patterns';

<VirtualizedList
  items={firewallRules} // array of any type
  estimateSize={48} // estimated row height in px
  height="600px" // container height (required)
  renderItem={({ item, virtualItem, measureRef }) => (
    <FirewallRuleRow
      key={virtualItem.key}
      rule={item}
      ref={measureRef} // enables variable-height measurement
    />
  )}
/>;
```

**Automatic threshold:** Virtualization is enabled when `items.length > 20` (the
`VIRTUALIZATION_THRESHOLD` constant). Below this threshold the component renders all items normally,
avoiding the overhead of virtualization for small lists.

**Features:**

- Variable-height items via `measureElement` ref
- Scroll position restoration on navigation
- Keyboard navigation (arrow keys, Home/End, PageUp/Down)
- Platform-aware minimum row height (44 px on mobile for touch targets)
- WCAG AAA accessible (full keyboard + ARIA `listbox`/`option` roles)

### `VirtualizedTable`

Similar API to `VirtualizedList` but renders as a table with sticky headers. Used in the Logs tab
and ARP table.

### When to Use Virtualization

| List size    | Approach                                    |
| ------------ | ------------------------------------------- |
| < 20 items   | Render directly — no virtualization         |
| 20–200 items | Use `VirtualizedList` or `VirtualizedTable` |
| > 200 items  | Use virtualization; consider pagination too |

---

## Memoization Patterns

### `React.memo`

`React.memo` is used on inner virtualized row components and on list items that receive stable
props:

```tsx
// libs/ui/patterns/src/virtualization/VirtualizedList.tsx
export const VirtualizedList = React.memo(VirtualizedListInner) as VirtualizedListComponent;
```

Apply `React.memo` when:

- The component re-renders frequently (e.g., inside a virtualized list)
- Props are simple and stable (primitives, stable object references)

Avoid `React.memo` on components that always receive new prop objects on each parent render — it
adds comparison overhead without benefit.

### `useCallback` and `useMemo`

Use `useCallback` for event handlers passed as props to memoized children:

```tsx
const handleRuleDelete = useCallback(
  (ruleId: string) => deleteRule({ variables: { id: ruleId } }),
  [deleteRule]
);
```

Use `useMemo` for expensive derived data, not for simple object creation:

```tsx
// Good — expensive computation
const sortedRules = useMemo(() => [...rules].sort((a, b) => a.priority - b.priority), [rules]);

// Bad — not expensive, memo adds overhead for no gain
const style = useMemo(() => ({ color: 'red' }), []);
// Just write:
const style = { color: 'red' };
```

---

## Apollo Client Cache Optimisation

The Apollo `InMemoryCache` is configured with type policies in `libs/api-client/core/src/`. Key
practices:

### Field Key Arguments

Specify `keyArgs` to prevent cache collisions between queries with different variables:

```ts
typePolicies: {
  Query: {
    fields: {
      firewallRules: {
        keyArgs: ['routerId', 'chain'],  // separate cache entry per routerId+chain
      },
    },
  },
},
```

### Cache Reads over Network Requests

Prefer `cache-first` fetch policy (Apollo's default) for stable data. Use `network-only` only for
data that must always be fresh (e.g., live traffic counters).

```ts
useQuery(GET_INTERFACES, {
  variables: { routerId },
  fetchPolicy: 'cache-and-network', // show cached immediately, update in background
});
```

### Avoiding Over-Fetching

Use fragments to request only the fields a component needs. The codegen pipeline generates typed
fragment hooks alongside operation hooks:

```graphql
fragment InterfaceListItem on Interface {
  id
  name
  status
  type
}
```

---

## WebSocket Connection Management

GraphQL subscriptions use `graphql-ws` over WebSocket. Key points for performance:

- Only one WebSocket connection is maintained per router session (multiplexed subscriptions)
- Subscriptions are cleaned up automatically when the subscribing component unmounts
- Reconnect logic is handled by the Apollo link in `libs/api-client/core/src/`
- Avoid subscribing to high-frequency events (e.g., raw traffic counters every 100 ms) — use polling
  intervals of at least 5 s for live metrics

---

## Image and Asset Optimisation

The app uses very few raster images (most UI is CSS + SVG icons from `lucide-react`). When raster
images are needed:

- Use WebP format
- Specify explicit `width` and `height` attributes to avoid layout shift
- Use the `loading="lazy"` attribute for below-the-fold images

SVG icons from `lucide-react` are tree-shaken — import only the icons you use:

```ts
// Good — tree-shaken
import { Shield, Wifi, Router } from 'lucide-react';

// Bad — imports the entire library
import * as Icons from 'lucide-react';
```

---

## Production Build Settings

The following production-specific settings are active in `apps/connect/vite.config.ts` when
`mode === 'production'`:

| Setting                  | Value      | Effect                                               |
| ------------------------ | ---------- | ---------------------------------------------------- |
| `minify`                 | `'terser'` | Aggressive minification                              |
| `compress.drop_console`  | `true`     | Removes all `console.log` calls                      |
| `compress.drop_debugger` | `true`     | Removes `debugger` statements                        |
| `sourcemap`              | `false`    | No source maps in production bundle                  |
| `designTokensHMR`        | disabled   | Token watcher not loaded                             |
| `vite-plugin-checker`    | disabled   | TypeScript checking omitted (CI runs tsc separately) |

---

## Measuring Performance

### Bundle Analysis

```bash
npm run build:analyze
# Opens a visual treemap of the bundle in the browser
```

Look for:

- Unexpectedly large chunks
- Duplicate modules across chunks
- Libraries that should be in manual chunks but are not

### Runtime Performance

Use the browser Performance tab (Chrome DevTools) to record a trace:

1. Open DevTools → Performance
2. Click Record
3. Perform the action you want to measure (e.g., navigate to the Firewall tab)
4. Stop recording
5. Look for long tasks (> 50 ms) in the flame chart

For component-level profiling, use the React DevTools Profiler tab:

1. Open React DevTools → Profiler
2. Click Record
3. Interact with the UI
4. Stop — examine which components re-rendered and why

### Core Web Vitals Targets

| Metric                                | Target   |
| ------------------------------------- | -------- |
| LCP (Largest Contentful Paint)        | < 2.5 s  |
| FID / INP (Interaction to Next Paint) | < 200 ms |
| CLS (Cumulative Layout Shift)         | < 0.1    |

Skeleton loading states (accurate layout placeholders) directly reduce CLS. Always provide skeletons
for lazy-loaded routes and data-fetching components.
