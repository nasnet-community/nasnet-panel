# Layouts

The layouts library (`libs/ui/layouts/src/`) provides the structural scaffolding for the entire
application. It exports layout shell components, navigation bars, and content containers that are
composed by the app layer in `apps/connect/`.

**Import alias:** `@nasnet/ui/layouts`

## Layout Hierarchy

```
ResponsiveShell (auto-selects shell based on platform)
├── Mobile (<640px)
│   └── MobileAppShell
│       ├── StatusLayout (optional status banner)
│       ├── MobileHeader
│       ├── <main> (scrollable content)
│       └── BottomNavigation (fixed bottom tabs)
└── Tablet/Desktop (640px+)
    └── AppShell
        ├── <header> (sticky top bar)
        ├── Banner slot (optional ConnectionBanner)
        ├── <aside> (CollapsibleSidebar)
        └── <main id="main-content"> (scrollable content)
```

Inside `<main>`, page-level layouts are handled by:

```
PageContainer (page wrapper with title/actions/breadcrumbs)
└── SidebarLayout (optional secondary sidebar split)
    └── CardLayout (card grid containers)
```

## ResponsiveShell

**Source:** `libs/ui/layouts/src/responsive-shell/ResponsiveShell.tsx`

The top-level layout wrapper. Automatically selects between `MobileAppShell` and `AppShell` based on
the current viewport platform. This is where the Headless + Platform Presenters architecture is
applied at the layout level.

```tsx
import { ResponsiveShell } from '@nasnet/ui/layouts';

// Basic usage
<ResponsiveShell
  sidebar={<NavigationSidebar />}
  header={<AppHeader />}
  mobileNavigationProps={{ activeId: 'dashboard', items: navItems }}
>
  <PageContent />
</ResponsiveShell>;

// With controlled sidebar state (wired to Zustand store)
function AppLayout({ children }) {
  const { desktopCollapsed, toggle } = useSidebarStore();
  return (
    <ResponsiveShell
      sidebar={<NavigationSidebar />}
      sidebarCollapsed={desktopCollapsed}
      onSidebarToggle={toggle}
      header={<AppHeader />}
    >
      {children}
    </ResponsiveShell>
  );
}
```

### Props

| Prop                    | Type                                | Default  | Description                                  |
| ----------------------- | ----------------------------------- | -------- | -------------------------------------------- |
| `children`              | `ReactNode`                         | required | Main page content                            |
| `sidebar`               | `ReactNode`                         | —        | Sidebar content (tablet/desktop only)        |
| `header`                | `ReactNode`                         | —        | Header for tablet/desktop                    |
| `banner`                | `ReactNode`                         | —        | Banner below header (e.g., ConnectionBanner) |
| `footer`                | `ReactNode`                         | —        | Footer content                               |
| `mobileHeaderProps`     | `MobileHeaderProps`                 | —        | Header config for mobile                     |
| `mobileNavigationProps` | `BottomNavigationProps`             | —        | Bottom nav config for mobile                 |
| `statusBannerProps`     | `StatusLayoutProps & { content }`   | —        | Status banner for mobile                     |
| `forcePlatform`         | `'mobile' \| 'tablet' \| 'desktop'` | —        | Override platform detection                  |
| `sidebarCollapsed`      | `boolean`                           | `false`  | Sidebar collapse state (desktop)             |
| `onSidebarToggle`       | `() => void`                        | —        | Sidebar toggle callback                      |

### Platform Behavior

| Platform            | Layout                           | Sidebar                     |
| ------------------- | -------------------------------- | --------------------------- |
| Mobile (`<640px`)   | `MobileAppShell` with bottom nav | Hidden                      |
| Tablet (640-1024px) | `AppShell` with sidebar          | Always expanded             |
| Desktop (`>1024px`) | `AppShell` with sidebar          | Respects `sidebarCollapsed` |

The keyboard shortcut `Cmd+B` / `Ctrl+B` toggles the sidebar on tablet/desktop when
`onSidebarToggle` is provided.

## AppShell

**Source:** `libs/ui/layouts/src/app-shell/app-shell.tsx`

Desktop/tablet layout shell with sticky header, collapsible sidebar, and scrollable main content.

```tsx
import { AppShell } from '@nasnet/ui/layouts';

<AppShell
  header={<AppHeader user={user} />}
  sidebar={<Navigation />}
  footer={<AppFooter />}
  banner={isOffline && <OfflineBanner />}
  sidebarCollapsed={collapsed}
>
  <PageContent />
</AppShell>;
```

### HTML Structure

```html
<div class="bg-background flex min-h-screen flex-col">
  <header
    class="bg-card sticky top-0 z-40 border-b"
    style="height: var(--nav-height)"
  >
    <!-- header content -->
  </header>
  <!-- banner renders here (optional) -->
  <div class="flex flex-1">
    <aside
      class="bg-card hidden border-r lg:block"
      style="width: 256px | 64px"
    >
      <!-- sidebar content -->
    </aside>
    <main
      id="main-content"
      class="bg-background flex-1 overflow-y-auto"
      role="main"
    >
      <!-- page content -->
    </main>
  </div>
  <footer class="bg-card border-t">
    <!-- footer content -->
  </footer>
</div>
```

The sidebar is hidden below `lg` breakpoint (1024px) via `hidden lg:block`. Its width animates
between `w-64` (256px, expanded) and `w-16` (64px, collapsed) with `transition-all duration-300`.

## MobileAppShell

**Source:** `libs/ui/layouts/src/mobile-app-shell/mobile-app-shell.tsx`

Mobile-first layout shell with status banner, compact header, scrollable content, and fixed bottom
navigation.

```tsx
import { MobileAppShell } from '@nasnet/ui/layouts';

<MobileAppShell
  header={{ title: 'Dashboard', greeting: true }}
  navigation={{ activeId: 'home', items: navItems }}
  statusBanner={{ status: 'warning', content: <ConnectionBanner /> }}
>
  <RouterDashboard />
</MobileAppShell>;
```

### HTML Structure

```html
<div class="bg-background flex min-h-screen flex-col">
  <!-- StatusLayout (optional top alert) -->
  <!-- MobileHeader -->
  <div class="flex flex-1 overflow-hidden">
    <!-- aside: optional desktop sidebar (hidden on mobile) -->
    <main
      id="main-content"
      class="bg-background flex-1 overflow-y-auto pb-16"
    >
      <!-- pb-16 reserves space for bottom nav bar -->
      <!-- page content -->
    </main>
  </div>
  <!-- BottomNavigation (fixed bottom) -->
</div>
```

The `pb-16` (64px) bottom padding on `<main>` reserves space for the `BottomNavigation`. The
`sm:pb-0` class removes this padding on tablet where bottom nav is hidden.

## CollapsibleSidebar

**Source:** `libs/ui/layouts/src/sidebar/CollapsibleSidebar.tsx`

Sidebar wrapper with expand/collapse animation. State is managed externally (Zustand store) and
passed via props.

```tsx
import { CollapsibleSidebar, CollapsibleSidebarProvider } from '@nasnet/ui/layouts';

function AppSidebar() {
  const { desktopCollapsed, toggle } = useSidebarStore();

  return (
    <CollapsibleSidebar
      isCollapsed={desktopCollapsed}
      onToggle={toggle}
      togglePosition="bottom"
    >
      <CollapsibleSidebarProvider
        isCollapsed={desktopCollapsed}
        toggle={toggle}
      >
        <NavigationMenu />
      </CollapsibleSidebarProvider>
    </CollapsibleSidebar>
  );
}
```

### Width Constants

```ts
SIDEBAR_WIDTHS.COLLAPSED = 64; // 64px — icon-only
SIDEBAR_WIDTHS.EXPANDED = 256; // 256px — full navigation
```

### Child Component Adaptation

Use `CollapsibleSidebarContext` to hide labels when collapsed:

```tsx
function NavItem({ icon, label }) {
  const { isCollapsed } = useCollapsibleSidebarContext();
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      {icon}
      {!isCollapsed && <span className="text-sm">{label}</span>}
    </div>
  );
}
```

### Reduced Motion

Sidebar transition duration respects `prefers-reduced-motion`:

```ts
transitionDuration: prefersReducedMotion ? '0ms' : `${ANIMATION_DURATIONS.SIDEBAR}ms`;
```

## BottomNavigation

**Source:** `libs/ui/layouts/src/bottom-navigation/BottomNavigation.tsx`

Fixed bottom tab bar for mobile navigation. Contains 3-5 tab items with icons and optional labels.

```tsx
import { BottomNavigation, type NavItem } from '@nasnet/ui/layouts';

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard />, href: '/dashboard' },
  { id: 'network', label: 'Network', icon: <Network />, href: '/network' },
  { id: 'vpn', label: 'VPN', icon: <Shield />, href: '/vpn' },
  { id: 'settings', label: 'Settings', icon: <Settings />, href: '/settings' },
];

<BottomNavigation
  activeId="dashboard"
  items={navItems}
/>;
```

The bar is fixed to the bottom of the screen (`fixed bottom-0`) with safe area inset support for
notched devices. All tab items have a minimum 44px touch target.

## MobileHeader

**Source:** `libs/ui/layouts/src/mobile-header/mobile-header.tsx`

Compact header for mobile layouts. Shows a greeting (e.g., "Good morning") and page title, with
optional action buttons.

```tsx
import { MobileHeader } from '@nasnet/ui/layouts';

<MobileHeader
  title="VPN"
  greeting={true}
  subtitle="3 active connections"
  actions={<NotificationBell />}
/>;
```

## PageContainer

**Source:** `libs/ui/layouts/src/page-container/page-container.tsx`

Responsive content wrapper for individual pages. Provides max-width constraint, horizontal padding
adapted per platform, and an optional title/actions header row.

```tsx
import { PageContainer } from '@nasnet/ui/layouts';

<PageContainer
  title="Firewall Rules"
  description="Manage inbound and outbound traffic rules"
  breadcrumbs={<Breadcrumb items={crumbs} />}
  actions={<Button>Add Rule</Button>}
  maxWidth="xl"
>
  <RulesList />
</PageContainer>;
```

### Responsive Padding

```css
px-page-mobile    /* mobile: 16px */
md:px-page-tablet /* tablet: 24px */
lg:px-page-desktop /* desktop: 32px */
```

### maxWidth Options

| Value  | Class              | Breakpoint    |
| ------ | ------------------ | ------------- |
| `sm`   | `max-w-screen-sm`  | 640px         |
| `md`   | `max-w-screen-md`  | 768px         |
| `lg`   | `max-w-screen-lg`  | 1024px        |
| `xl`   | `max-w-screen-xl`  | 1280px        |
| `2xl`  | `max-w-screen-2xl` | 1536px        |
| `full` | `max-w-full`       | No constraint |

## SidebarLayout

**Source:** `libs/ui/layouts/src/sidebar-layout/sidebar-layout.tsx`

Two-column layout for pages that need a secondary filter/detail sidebar alongside main content.
Stacks vertically on mobile, side-by-side on tablet/desktop.

```tsx
import { SidebarLayout } from '@nasnet/ui/layouts';

<SidebarLayout
  sidebar={<FilterPanel />}
  sidebarPosition="left"
  sidebarWidth="20rem"
  gap="md"
>
  <ResourceList />
</SidebarLayout>;
```

Use this for pages with detail panels or secondary navigation, not for the app-level navigation
sidebar (use `ResponsiveShell` for that).

## CardLayout

**Source:** `libs/ui/layouts/src/card-layout/card-layout.tsx`

Grid container for card-based content pages (dashboards, plugin stores, etc.).

```tsx
import { CardLayout } from '@nasnet/ui/layouts';

<CardLayout
  columns={{ mobile: 1, tablet: 2, desktop: 3 }}
  gap="md"
>
  {items.map((item) => (
    <ServiceCard
      key={item.id}
      item={item}
    />
  ))}
</CardLayout>;
```

## StatusLayout

**Source:** `libs/ui/layouts/src/status-layout/`

Top-of-screen status banner area for connection alerts, offline warnings, and system notices. Used
as the `statusBanner` prop on `MobileAppShell`.

```tsx
import { StatusLayout } from '@nasnet/ui/layouts';

<StatusLayout status="warning">
  <span>Router connection degraded — 450ms latency</span>
</StatusLayout>;
```

## Usage in apps/connect

The `apps/connect` application wires these layout components in `apps/connect/src/routes/__root.tsx`
and `apps/connect/src/app/`. The `ResponsiveShell` receives:

- `sidebar`: The `AppSidebar` component (from `apps/connect/src/app/components/AppSidebar.tsx`)
- `header`: The `AppHeader` component (from `apps/connect/src/app/components/AppHeader.tsx`)
- `sidebarCollapsed` / `onSidebarToggle`: Wired to the Zustand sidebar store
- `mobileNavigationProps`: Tab items for the bottom navigation bar
- `banner`: `ConnectionBanner` shown when the selected router is offline or degraded
