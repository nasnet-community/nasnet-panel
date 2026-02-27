# Routing — TanStack Router

NasNetConnect uses **TanStack Router v1** with file-based routing. Route files live in `apps/connect/src/routes/` and the router tree is auto-generated into `apps/connect/src/routeTree.gen.ts` by the Vite plugin at build time.

## Setup

### Router Initialization (`main.tsx`)

```tsx
// apps/connect/src/main.tsx
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

const router = createRouter({ routeTree });

// Type registration — gives full type-safety to useParams, useSearch, etc.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

The `RouterProvider` is mounted at the very top level before the `Providers` stack. The `Providers` are applied inside the root route component (`__root.tsx`) rather than here, so providers have access to route context.

### Vite Plugin

```ts
// apps/connect/vite.config.ts
TanStackRouterVite({ routeFileIgnorePattern: '\\.stories\\.' }),
```

The `routeFileIgnorePattern` excludes Storybook story files (`.stories.tsx`) from the generated route tree. This is important because story files live alongside route files in the same directories.

## File-Based Routing Convention

| File path | Route path |
|-----------|-----------|
| `routes/index.tsx` | `/` |
| `routes/home.tsx` | `/home` |
| `routes/dashboard.tsx` | `/dashboard` |
| `routes/dashboard.network.tsx` | `/dashboard/network` (flat file = nested path) |
| `routes/router/$id/route.tsx` | `/router/$id` (layout route) |
| `routes/router/$id/firewall.tsx` | `/router/$id/firewall` |
| `routes/router/$id/firewall/logs.tsx` | `/router/$id/firewall/logs` |

**Naming rules:**
- `$param` in a directory name becomes a dynamic path segment
- `.` in a file name creates a nested path without a nested directory (flat file nesting)
- `route.tsx` at a directory level creates a layout route (renders `<Outlet>` for children)
- `index.tsx` at a directory level creates the default child route

## Root Route (`__root.tsx`)

The root route wraps every page in the application shell:

```tsx
// apps/connect/src/routes/__root.tsx

function RootComponent() {
  return (
    <Providers>       {/* 8-layer provider stack */}
      <RootInner />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </Providers>
  );
}

function RootInner() {
  // Global hooks — run on every page:
  useConnectionToast();      // connection state → toast notifications
  useConnectionHeartbeat();  // periodic ping to backend
  useDefaultCommands();      // registers Cmd+K palette commands
  useGlobalShortcuts();      // keyboard shortcuts (Cmd+K, ?)
  useAlertNotifications();   // real-time alert subscription → toast + sound

  return (
    <ResponsiveShell
      header={<AppHeader />}
      sidebar={<AppSidebar />}
      banner={<ConnectionBanner />}
    >
      <main id="main-content">
        <Outlet />   {/* active route renders here */}
      </main>
      <Toaster />
      <CommandPalette />
      <ShortcutsOverlay />
      <SearchFAB />          {/* mobile only */}
    </ResponsiveShell>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RootErrorComponent,
  notFoundComponent: NotFoundComponent,
});
```

The root route also defines:
- `errorComponent` — renders a styled error card with stack trace in dev
- `notFoundComponent` — 404 page with a home link

## Complete Route Tree

### Top-Level Routes

| File | Path | Component |
|------|------|-----------|
| `routes/index.tsx` | `/` | `RouterDiscoveryPage` |
| `routes/home.tsx` | `/home` | Home page |
| `routes/routers.tsx` | `/routers` | Router list |
| `routes/discover.tsx` | `/discover` | Network scanner |
| `routes/wifi.tsx` | `/wifi` | WiFi overview |
| `routes/network.tsx` | `/network` | Network section layout |
| `routes/dashboard.tsx` | `/dashboard` | Dashboard layout |
| `routes/settings.tsx` | `/settings` | Settings layout |

### Dashboard Sub-Routes (flat file nesting)

| File | Path | Component |
|------|------|-----------|
| `routes/dashboard.network.tsx` | `/dashboard/network` | Network dashboard |
| `routes/dashboard.routes.tsx` | `/dashboard/routes` | Routes overview |
| `routes/dashboard.dns-lookup.tsx` | `/dashboard/dns-lookup` | DNS lookup tool |
| `routes/dashboard.troubleshoot.tsx` | `/dashboard/troubleshoot` | Troubleshooting |

### Settings Sub-Routes

| File | Path | Component |
|------|------|-----------|
| `routes/settings/notifications.tsx` | `/settings/notifications` | Notification settings |
| `routes/settings/notifications/webhooks.tsx` | `/settings/notifications/webhooks` | Webhook channels |

### Network Sub-Routes

| File | Path | Component |
|------|------|-----------|
| `routes/network/dhcp/index.tsx` | `/network/dhcp/` | DHCP index |
| `routes/network/dhcp/leases.tsx` | `/network/dhcp/leases` | All DHCP leases |
| `routes/network/dhcp/new.tsx` | `/network/dhcp/new` | Create DHCP server |
| `routes/network/dhcp/$serverId.tsx` | `/network/dhcp/:serverId` | DHCP server detail |
| `routes/network/dns/diagnostics.tsx` | `/network/dns/diagnostics` | DNS diagnostics |

### Router Panel — Layout Route

`routes/router/$id/route.tsx` is a **layout route** for `/router/:id`. It renders `RouterPanel` as a wrapper and `<Outlet>` for the active tab. All router-panel sub-routes share this shell.

```tsx
// routes/router/$id/route.tsx
export const Route = createFileRoute('/router/$id')({
  component: RouterPanelLayout,
});

function RouterPanelLayout() {
  const { id } = Route.useParams();
  return (
    <RouterPanel routerId={id}>
      <Outlet />
    </RouterPanel>
  );
}
```

### Router Panel — Tab Routes

| File | Path | Tab |
|------|------|-----|
| `routes/router/$id/index.tsx` | `/router/:id/` | Overview |
| `routes/router/$id/network.tsx` | `/router/:id/network` | Network |
| `routes/router/$id/dhcp.tsx` | `/router/:id/dhcp` | DHCP |
| `routes/router/$id/dns.tsx` | `/router/:id/dns` | DNS |
| `routes/router/$id/firewall.tsx` | `/router/:id/firewall` | Firewall layout |
| `routes/router/$id/logs.tsx` | `/router/:id/logs` | Logs |
| `routes/router/$id/plugins.tsx` | `/router/:id/plugins` | Plugin Store |
| `routes/router/$id/routing.tsx` | `/router/:id/routing` | Routing |
| `routes/router/$id/vlans.tsx` | `/router/:id/vlans` | VLANs |

### Router Panel — VPN Sub-Routes

| File | Path | Component |
|------|------|-----------|
| `routes/router/$id/vpn/index.tsx` | `/router/:id/vpn/` | VPN dashboard |
| `routes/router/$id/vpn/clients.tsx` | `/router/:id/vpn/clients` | VPN clients |
| `routes/router/$id/vpn/servers.tsx` | `/router/:id/vpn/servers` | VPN servers |

### Router Panel — WiFi Sub-Routes

| File | Path | Component |
|------|------|-----------|
| `routes/router/$id/wifi/index.tsx` | `/router/:id/wifi/` | WiFi overview |
| `routes/router/$id/wifi/$interfaceName.tsx` | `/router/:id/wifi/:interfaceName` | WiFi interface detail |

### Router Panel — Services Sub-Routes

| File | Path | Component |
|------|------|-----------|
| `routes/router/$id/services/index.tsx` | `/router/:id/services/` | Services marketplace |
| `routes/router/$id/services/templates.tsx` | `/router/:id/services/templates` | Service templates |
| `routes/router/$id/services/$instanceId.tsx` | `/router/:id/services/:instanceId` | Service instance |

### Router Panel — Firewall Sub-Routes

The firewall route (`routes/router/$id/firewall.tsx`) is itself a layout route. Its sub-routes are the individual firewall sections:

| File | Path | Section |
|------|------|---------|
| `routes/router/$id/firewall/address-lists.tsx` | `/router/:id/firewall/address-lists` | Address lists |
| `routes/router/$id/firewall/connections.tsx` | `/router/:id/firewall/connections` | Active connections |
| `routes/router/$id/firewall/logs.tsx` | `/router/:id/firewall/logs` | Firewall logs |
| `routes/router/$id/firewall/mangle.tsx` | `/router/:id/firewall/mangle` | Mangle rules |
| `routes/router/$id/firewall/port-knocking.tsx` | `/router/:id/firewall/port-knocking` | Port knocking |
| `routes/router/$id/firewall/rate-limiting.tsx` | `/router/:id/firewall/rate-limiting` | Rate limiting |
| `routes/router/$id/firewall/raw.tsx` | `/router/:id/firewall/raw` | Raw rules |
| `routes/router/$id/firewall/service-ports.tsx` | `/router/:id/firewall/service-ports` | Service ports |
| `routes/router/$id/firewall/templates.tsx` | `/router/:id/firewall/templates` | Firewall templates |

**Total routes: 47**

## Lazy Loading Strategy

Heavy tab components are code-split to keep the initial bundle small. The `createLazyWithPreload` utility from `@nasnet/ui/patterns` creates a lazy component with an imperative preload function.

```ts
// apps/connect/src/app/routes/router-panel/tabs/lazy.ts

export const [LazyFirewallTab, preloadFirewallTab] = createLazyWithPreload(
  () => import('./FirewallTab').then((m) => ({ default: m.FirewallTab }))
);
```

Route files use `LazyBoundary` (from `@nasnet/ui/patterns`) as the Suspense wrapper with a typed skeleton fallback:

```tsx
// routes/router/$id/firewall.tsx
export const Route = createFileRoute('/router/$id/firewall')({
  component: () => (
    <LazyBoundary fallback={<FirewallTabSkeleton />}>
      <LazyFirewallTab />
    </LazyBoundary>
  ),
});
```

### Lazy-Loaded Tab Chunks

| Tab | Estimated Chunk |
|-----|----------------|
| FirewallTab | ~50KB |
| VPNTab | ~45KB |
| LogsTab | ~40KB |
| DHCPTab | ~35KB |
| DnsTab | ~30KB |
| PluginStoreTab | ~30KB |
| NetworkTab | ~25KB |

### Eager-Loaded Tabs

`OverviewTab` and `WiFiTab` are loaded eagerly because they are the most common entry points and are relatively lightweight.

### Preload on Enter

When a user navigates into the router panel, all heavy tabs are preloaded in the background via `requestIdleCallback` (with a 3-second timeout fallback):

```ts
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

Individual tabs can also be preloaded on hover by calling the preload function in `onMouseEnter`.

## Route Guards / Auth Protection

Route-level authentication is enforced via the Apollo Client auth link (in `libs/api-client/core/src`), which intercepts 401 responses and triggers a logout. There are no explicit `beforeLoad` guards in the route definitions at this time; protected routes rely on the backend returning 401/403 for unauthenticated requests, which the error link handles by redirecting to the login flow.

## Type Safety

Because the router instance is registered via the module augmentation in `main.tsx`:

```ts
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

All `useParams()`, `useSearch()`, `Link`, and `navigate()` calls are fully type-safe. TypeScript will catch incorrect route paths and missing params at compile time.

## Related Documents

- [Architecture Overview](./overview.md)
- [Provider Stack](./provider-stack.md)
- [Build System](./build-system.md)
