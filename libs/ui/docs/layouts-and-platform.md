# Layouts & Platform Detection (Layer 2)

**Package:** `@nasnet/ui/layouts` **Source:** `libs/ui/layouts/src/` **ADR Reference:** ADR-018
(Headless + Platform Presenters)

This document covers the layout shell components and the platform detection system that drives them.
Every layout in NasNetConnect is platform-aware — the same tree automatically renders different
shells, spacing, and navigation depending on whether the viewport is mobile, tablet, or desktop.

---

## Platform Detection Architecture

The platform detection pipeline has three stages:

```
ResizeObserver (document.documentElement)
  └─ useBreakpoint()          → 'xs' | 'sm' | 'md' | 'lg' | 'xl'
       └─ usePlatform()       → 'mobile' | 'tablet' | 'desktop'
            └─ ResponsiveShell → MobileAppShell | AppShell
```

**Stage 1 — ResizeObserver:** `useBreakpoint` attaches a `ResizeObserver` to
`document.documentElement`. This is more efficient than `window.resize` because ResizeObserver fires
synchronously with layout and does not trigger on scroll. Updates are debounced (100ms by default)
to prevent excessive re-renders.

**Stage 2 — Breakpoint to Platform mapping:** `usePlatform` calls `useBreakpoint` and maps the
result to one of three platform identifiers using a pure switch statement. The mapping is:

| Breakpoint | Width range | Platform  |
| ---------- | ----------- | --------- |
| `xs`       | < 640px     | `mobile`  |
| `sm`       | 640–767px   | `tablet`  |
| `md`       | 768–1023px  | `tablet`  |
| `lg`       | 1024–1279px | `desktop` |
| `xl`       | 1280px+     | `desktop` |

**Stage 3 — Shell selection:** `ResponsiveShell` calls `usePlatform` and renders `MobileAppShell`
for mobile or `AppShell` for tablet and desktop. Platform state is passed as props at the app layer
via the Zustand sidebar store — `@nasnet/ui/layouts` does not import from `@nasnet/state/stores`
directly (library dependency rules).

**SSR behavior:** Both `useBreakpoint` and `useViewportWidth` default to `1024px` (desktop) when
`window` is undefined, ensuring correct server-side rendering without layout shift.

---

## Breakpoints

### `BREAKPOINTS` constant

Defined in `libs/ui/layouts/src/responsive-shell/useBreakpoint.ts`:

```typescript
import { BREAKPOINTS } from '@nasnet/ui/layouts';

export const BREAKPOINTS = {
  /** Mobile to tablet transition */
  SM: 640,
  /** Optional intermediate breakpoint */
  MD: 768,
  /** Tablet to desktop transition */
  LG: 1024,
  /** Large desktop */
  XL: 1280,
} as const;
```

These values are aligned with Tailwind CSS screen breakpoints and the design token system.

### `PLATFORM_THRESHOLDS` constant

Defined in `libs/ui/layouts/src/responsive-shell/usePlatform.ts`:

```typescript
import { PLATFORM_THRESHOLDS } from '@nasnet/ui/layouts';

export const PLATFORM_THRESHOLDS = {
  /** Mobile to tablet transition — equals BREAKPOINTS.SM (640px) */
  MOBILE_MAX: BREAKPOINTS.SM,
  /** Tablet to desktop transition — equals BREAKPOINTS.LG (1024px) */
  TABLET_MAX: BREAKPOINTS.LG,
} as const;
```

Use `PLATFORM_THRESHOLDS` when you want to express intent ("I need the tablet cutoff") rather than a
raw pixel value.

### `Breakpoint` type

```typescript
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
```

### `Platform` type

```typescript
export type Platform = 'mobile' | 'tablet' | 'desktop';
```

---

## Platform Hooks

All hooks are exported from `@nasnet/ui/layouts`. They are all React hooks and must follow the rules
of hooks.

### `useBreakpoint`

```typescript
function useBreakpoint(debounceMs?: number): Breakpoint;
```

Returns the current viewport breakpoint identifier. Uses `ResizeObserver` and is debounced. Defaults
to `'lg'` during SSR.

```typescript
import { useBreakpoint } from '@nasnet/ui/layouts';

function MyComponent() {
  const breakpoint = useBreakpoint();
  // breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'

  if (breakpoint === 'xs' || breakpoint === 'sm') {
    // Mobile-specific logic
  }
}
```

---

### `usePlatform`

```typescript
function usePlatform(debounceMs?: number): Platform;
```

The primary hook for implementing platform-specific presenters. Returns the current platform based
on the breakpoint-to-platform mapping described above.

```typescript
import { usePlatform } from '@nasnet/ui/layouts';

// In a pattern component (Layer 2)
export function ResourceCard<T>(props: ResourceCardProps<T>) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <ResourceCardMobile {...props} />;
    case 'tablet':
      return <ResourceCardTablet {...props} />;
    case 'desktop':
      return <ResourceCardDesktop {...props} />;
  }
}
```

---

### `usePlatformWithBreakpoint`

```typescript
function usePlatformWithBreakpoint(debounceMs?: number): {
  platform: Platform;
  breakpoint: Breakpoint;
};
```

Returns both the coarse-grained platform and the fine-grained breakpoint. Use when you need both,
e.g., to adjust column counts within a platform tier.

```typescript
import { usePlatformWithBreakpoint } from '@nasnet/ui/layouts';

function ColumnGrid() {
  const { platform, breakpoint } = usePlatformWithBreakpoint();

  if (platform === 'tablet' && breakpoint === 'md') {
    // Show 2-column layout on medium tablets
  }
}
```

---

### `useIsMobile`

```typescript
function useIsMobile(debounceMs?: number): boolean;
```

Returns `true` when the current platform is `'mobile'` (viewport < 640px).

```typescript
import { useIsMobile } from '@nasnet/ui/layouts';

const isMobile = useIsMobile();
if (isMobile) {
  // Show bottom sheet instead of dropdown
}
```

---

### `useIsTablet`

```typescript
function useIsTablet(debounceMs?: number): boolean;
```

Returns `true` when the current platform is `'tablet'` (viewport 640–1023px).

---

### `useIsDesktop`

```typescript
function useIsDesktop(debounceMs?: number): boolean;
```

Returns `true` when the current platform is `'desktop'` (viewport >= 1024px).

---

### `useIsTouchPlatform`

```typescript
function useIsTouchPlatform(debounceMs?: number): boolean;
```

Returns `true` for mobile and tablet — any platform where touch-first interaction is expected. Use
this to enable swipe gestures, increase touch target sizes, or swap drag-drop for tap-select.

```typescript
import { useIsTouchPlatform } from '@nasnet/ui/layouts';

const isTouchPlatform = useIsTouchPlatform();
// true for mobile (<640px) and tablet (640-1024px)
// false for desktop (>1024px)
```

---

### `usePlatformConfig<T>`

```typescript
function usePlatformConfig<T>(config: Record<Platform, T>): T;
```

Returns the configuration object for the current platform. Eliminates conditional rendering for
data-only platform differences.

```typescript
import { usePlatformConfig } from '@nasnet/ui/layouts';

function InterfaceGrid() {
  const layout = usePlatformConfig({
    mobile:  { columns: 1, gap: 'sm' as const },
    tablet:  { columns: 2, gap: 'md' as const },
    desktop: { columns: 3, gap: 'lg' as const },
  });

  return (
    <CardLayout columns={layout.columns} gap={layout.gap}>
      {items}
    </CardLayout>
  );
}
```

---

### `useViewportWidth`

```typescript
function useViewportWidth(debounceMs?: number): number;
```

Returns the current viewport width as a raw pixel number. Use for math-based responsive logic where
named breakpoints are not sufficient.

```typescript
import { useViewportWidth } from '@nasnet/ui/layouts';

const width = useViewportWidth();
// width: 1280 (or SSR default: 1024)
```

---

### `detectPlatform` (utility, not a hook)

```typescript
function detectPlatform(width: number): Platform;
```

Pure function to convert a pixel width to a platform identifier. Does not require React. Useful for
SSR pre-calculation or non-component code.

```typescript
import { detectPlatform } from '@nasnet/ui/layouts';

detectPlatform(375); // 'mobile'
detectPlatform(768); // 'tablet'
detectPlatform(1440); // 'desktop'
```

---

### `isBreakpointAtLeast` (utility)

```typescript
function isBreakpointAtLeast(current: Breakpoint, target: Breakpoint): boolean;
```

Returns `true` if `current` is the same size or larger than `target`. The ordering is
`xs < sm < md < lg < xl`.

```typescript
import { useBreakpoint, isBreakpointAtLeast } from '@nasnet/ui/layouts';

const breakpoint = useBreakpoint();
const isAtLeastTablet = isBreakpointAtLeast(breakpoint, 'sm'); // true for sm, md, lg, xl
```

---

### `isBreakpointAtMost` (utility)

```typescript
function isBreakpointAtMost(current: Breakpoint, target: Breakpoint): boolean;
```

Returns `true` if `current` is the same size or smaller than `target`.

```typescript
import { useBreakpoint, isBreakpointAtMost } from '@nasnet/ui/layouts';

const breakpoint = useBreakpoint();
const isSmallScreen = isBreakpointAtMost(breakpoint, 'sm'); // true for xs, sm
```

---

## PlatformProvider

The `PlatformProvider` exposes a React context that stores the current platform with override
support. It is optional — every hook falls back to direct detection if no provider is present. The
provider is useful when you need consistent platform state across a large subtree, need to test
platform-specific layouts in isolation, or need the `PlatformDebugger` development tool.

### `PlatformProvider`

```typescript
interface PlatformProviderProps {
  children: React.ReactNode;
  /** Force a specific platform for testing/debugging */
  initialPlatform?: Platform;
  /** Debounce delay for platform detection. Default: 100 */
  debounceMs?: number;
}

function PlatformProvider(props: PlatformProviderProps): JSX.Element;
```

```typescript
import { PlatformProvider } from '@nasnet/ui/layouts';

// Standard usage — auto-detects platform
<PlatformProvider>
  <App />
</PlatformProvider>

// Force mobile for visual testing
<PlatformProvider initialPlatform="mobile">
  <App />
</PlatformProvider>
```

### `PlatformContextValue`

```typescript
interface PlatformContextValue {
  platform: Platform;
  isOverridden: boolean;
  setOverride: (platform: Platform | null) => void;
  clearOverride: () => void;
}
```

### `usePlatformContext`

```typescript
function usePlatformContext(): PlatformContextValue;
```

Reads the context value. Throws if used outside a `PlatformProvider`. Use `usePlatformFromContext`
for components that may be mounted both inside and outside a provider.

### `usePlatformFromContext`

```typescript
function usePlatformFromContext(): Platform;
```

Reads platform from context if available, falls back to direct `usePlatform` detection otherwise.
Safe to use anywhere.

### `PlatformSwitch`

Renders one of three slots depending on the current platform. Uses `usePlatformFromContext`
internally.

```typescript
interface PlatformSwitchProps {
  mobile?: React.ReactNode;
  tablet?: React.ReactNode;
  desktop?: React.ReactNode;
  /** Fallback rendered when a slot is not provided */
  fallback?: React.ReactNode;
}

function PlatformSwitch(props: PlatformSwitchProps): JSX.Element;
```

```typescript
import { PlatformSwitch } from '@nasnet/ui/layouts';

<PlatformSwitch
  mobile={<MobileView />}
  tablet={<TabletView />}
  desktop={<DesktopView />}
/>
```

### `PlatformDebugger`

Renders a small floating badge (bottom-right) showing the current platform name and three buttons to
force override. Only renders when `process.env.NODE_ENV === 'development'`. Uses semantic color
tokens: green for mobile, amber for tablet, blue for desktop, orange for override indicator.

```typescript
import { PlatformProvider, PlatformDebugger } from '@nasnet/ui/layouts';

// In development layout
<PlatformProvider>
  <App />
  <PlatformDebugger />
</PlatformProvider>
```

---

## Layout Shell Components

Import all layout components from `@nasnet/ui/layouts`.

### `ResponsiveShell`

**File:** `libs/ui/layouts/src/responsive-shell/ResponsiveShell.tsx`

The top-level layout wrapper. Automatically selects `MobileAppShell` or `AppShell` based on the
current platform. This is the only shell you should render at the root of the application.

**Platform behavior:**

| Platform            | Shell rendered   | Sidebar behavior                               |
| ------------------- | ---------------- | ---------------------------------------------- |
| Mobile (`<640px`)   | `MobileAppShell` | Hidden (bottom tabs instead)                   |
| Tablet (640–1023px) | `AppShell`       | Always expanded, ignores `sidebarCollapsed`    |
| Desktop (`>1024px`) | `AppShell`       | Respects `sidebarCollapsed` from Zustand store |

**Keyboard shortcut:** `Ctrl+B` / `Cmd+B` calls `onSidebarToggle`. The shortcut is registered on
`window.keydown` and is automatically removed when the component unmounts. The shortcut is silently
ignored on mobile.

```typescript
interface ResponsiveShellProps {
  children: React.ReactNode;
  /** Sidebar content for tablet/desktop */
  sidebar?: React.ReactNode;
  /** Header content for desktop/tablet */
  header?: React.ReactNode;
  /** Optional footer */
  footer?: React.ReactNode;
  /** Banner slot (e.g. ConnectionBanner) — rendered below header */
  banner?: React.ReactNode;
  /** Mobile header props — only used on mobile */
  mobileHeaderProps?: MobileAppShellProps['header'];
  /** Mobile bottom nav props — only used on mobile */
  mobileNavigationProps?: MobileAppShellProps['navigation'];
  /** Status banner for mobile */
  statusBannerProps?: MobileAppShellProps['statusBanner'];
  /** Force a specific platform (for testing/preview) */
  forcePlatform?: Platform;
  /** Whether desktop sidebar is collapsed — connect to Zustand store */
  sidebarCollapsed?: boolean;
  /** Called when sidebar collapse state should change */
  onSidebarToggle?: () => void;
  className?: string;
}
```

```typescript
import { ResponsiveShell } from '@nasnet/ui/layouts';

<ResponsiveShell
  header={<AppHeader />}
  banner={<ConnectionBanner />}
  sidebar={<AppSidebar />}
  sidebarCollapsed={desktopCollapsed}
  onSidebarToggle={toggle}
  mobileNavigationProps={{ activeId: 'home', items: navItems }}
>
  <PageContent />
</ResponsiveShell>
```

**Note:** `ResponsiveShell` is wrapped in `React.memo` and `React.forwardRef`. The ref is forwarded
to the root `<div>` on tablet/desktop or to `MobileAppShell`'s root on mobile.

---

### `AppShell`

**File:** `libs/ui/layouts/src/app-shell/app-shell.tsx`

Desktop/tablet application frame. Provides a sticky header, a collapsible sidebar (`hidden` below
`lg`, visible on `lg+`), a scrollable main content area, an optional banner slot, and an optional
footer.

```typescript
interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;
  /** Default: 'left' */
  sidebarPosition?: 'left' | 'right';
  /** Controls sidebar width: true → w-16, false → w-64 */
  sidebarCollapsed?: boolean;
  /** Banner rendered between header and content */
  banner?: React.ReactNode;
  className?: string;
}
```

```typescript
import { AppShell } from '@nasnet/ui/layouts';

<AppShell
  header={<AppHeader user={user} />}
  sidebar={<Navigation />}
  sidebarCollapsed={false}
  banner={offline && <OfflineBanner />}
>
  <PageContent />
</AppShell>
```

The sidebar is rendered inside an `<aside>` with `transition-all duration-300 ease-in-out` and
`hidden lg:block`. Below `lg`, the sidebar does not appear — use `MobileAppShell` with
`BottomNavigation` for mobile and tablet navigation instead, which is what `ResponsiveShell` does
automatically.

---

### `MobileAppShell`

**File:** `libs/ui/layouts/src/mobile-app-shell/mobile-app-shell.tsx`

Mobile-first application frame. Combines `StatusLayout` (optional top banner), `MobileHeader`
(optional sticky header), a `<main>` content area with bottom-padding (`pb-16`) to avoid overlap
with the `BottomNavigation`, and `BottomNavigation` (optional bottom tab bar).

```typescript
interface MobileAppShellProps {
  children: React.ReactNode;
  /** Header configuration */
  header?: MobileHeaderProps;
  /** Bottom navigation configuration */
  navigation?: BottomNavigationProps;
  /** Status banner */
  statusBanner?: StatusLayoutProps & { content: React.ReactNode };
  /** Optional sidebar for desktop/tablet breakpoints inside this shell */
  sidebar?: React.ReactNode;
  /** Default: true */
  showSidebarOnDesktop?: boolean;
  className?: string;
}
```

```typescript
import { MobileAppShell } from '@nasnet/ui/layouts';

<MobileAppShell
  header={{ title: 'Dashboard' }}
  navigation={{ activeId: 'home', items: navItems }}
  statusBanner={{ status: 'warning', content: <span>Connecting...</span> }}
>
  <RouterDashboard />
</MobileAppShell>
```

---

### `PageContainer`

**File:** `libs/ui/layouts/src/page-container/page-container.tsx`

Responsive `<main>` content wrapper with automatic horizontal padding using design token spacing
(`px-page-mobile` / `px-page-tablet` / `px-page-desktop`), a configurable max-width, an optional
title/description header, optional breadcrumbs, and optional action buttons.

```typescript
interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  /** Action buttons rendered top-right */
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
  /** Default: '2xl' */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Default: 'default' */
  variant?: 'default' | 'elevated' | 'flat';
}
```

```typescript
import { PageContainer } from '@nasnet/ui/layouts';

<PageContainer
  title="Firewall Rules"
  description="Manage network firewall rules"
  breadcrumbs={<Breadcrumb items={crumbs} />}
  actions={<Button>Add Rule</Button>}
  maxWidth="xl"
>
  <RulesList />
</PageContainer>
```

The `elevated` variant applies `bg-surfaceElevated1` with rounded corners. The `flat` variant
applies `bg-background`.

---

### `SidebarLayout`

**File:** `libs/ui/layouts/src/sidebar-layout/sidebar-layout.tsx`

Two-column layout with a sidebar and a main content area. Stacks vertically on mobile (`flex-col`),
switches to side-by-side on tablet and above (`md:flex-row`). Distinct from `AppShell` —
`SidebarLayout` is a content-level layout (e.g., a filter panel next to a list), not an application
shell.

```typescript
interface SidebarLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  /** CSS width value. Default: '16rem' */
  sidebarWidth?: string;
  /** Default: 'left' */
  sidebarPosition?: 'left' | 'right';
  /** Default: 'md' */
  gap?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}
```

```typescript
import { SidebarLayout } from '@nasnet/ui/layouts';

<SidebarLayout
  sidebar={<FilterPanel />}
  sidebarPosition="left"
  gap="lg"
>
  <ResourceList />
</SidebarLayout>
```

---

### `CollapsibleSidebar`

**File:** `libs/ui/layouts/src/sidebar/CollapsibleSidebar.tsx`

Sidebar `<aside>` wrapper that handles collapse/expand via CSS width transitions. Renders a toggle
button (positioned at the sidebar edge). Respects `prefers-reduced-motion` by switching to instant
width changes when the user preference is set. Registers the `Ctrl+B` / `Cmd+B` keyboard shortcut
independently of `ResponsiveShell` (remove `onToggle` from `CollapsibleSidebar` if `ResponsiveShell`
already handles it).

**Width constants:**

```typescript
import { SIDEBAR_WIDTHS } from '@nasnet/ui/layouts';

SIDEBAR_WIDTHS.COLLAPSED; // 64 (px)
SIDEBAR_WIDTHS.EXPANDED; // 256 (px)
```

```typescript
interface CollapsibleSidebarProps {
  children: React.ReactNode;
  /** Default: false */
  isCollapsed?: boolean;
  onToggle?: () => void;
  /** Default: true */
  showToggle?: boolean;
  /** Default: 'bottom' */
  togglePosition?: 'top' | 'middle' | 'bottom';
  /** Default: 64 */
  collapsedWidth?: number;
  /** Default: 256 */
  expandedWidth?: number;
  /** Default: 'left' */
  position?: 'left' | 'right';
  className?: string;
}
```

```typescript
import { CollapsibleSidebar } from '@nasnet/ui/layouts';
import { useSidebarStore } from '@nasnet/state/stores';

function Sidebar() {
  const { desktopCollapsed, toggle } = useSidebarStore();

  return (
    <CollapsibleSidebar isCollapsed={desktopCollapsed} onToggle={toggle}>
      <NavigationMenu isCollapsed={desktopCollapsed} />
    </CollapsibleSidebar>
  );
}
```

**Context for children:** Use `CollapsibleSidebarProvider` and `useCollapsibleSidebarContext` to let
nested nav items adapt to the collapse state without prop drilling:

```typescript
import {
  CollapsibleSidebarProvider,
  useCollapsibleSidebarContext,
} from '@nasnet/ui/layouts';

// Wrap sidebar content
<CollapsibleSidebarProvider isCollapsed={desktopCollapsed} toggle={toggle}>
  <NavItem icon={<Home />} label="Dashboard" />
</CollapsibleSidebarProvider>

// Inside a nav item
function NavItem({ icon, label }) {
  const { isCollapsed } = useCollapsibleSidebarContext();
  return (
    <div className="flex items-center gap-2">
      {icon}
      {!isCollapsed && <span>{label}</span>}
    </div>
  );
}
```

---

### `BottomNavigation`

**File:** `libs/ui/layouts/src/bottom-navigation/BottomNavigation.tsx`

Fixed bottom tab bar for mobile navigation. Hidden on `md+` screens via `hidden sm:flex md:hidden`.
Provides 44px minimum touch targets (WCAG AAA). Supports optional badge counts (rendered as
error-colored pill above the icon). Renders as `<a>` when `href` is provided, `<button>` when
`onClick` is provided.

```typescript
interface NavItem {
  id: string;
  label: string;
  /** Icon name — supports 'lucide:name', 'custom:name', 'category:name' prefixes */
  icon: string;
  href?: string;
  onClick?: () => void;
  /** Badge count, e.g. notification count */
  badge?: number;
}

interface BottomNavigationProps {
  activeId: string;
  items?: NavItem[];
  className?: string;
}
```

```typescript
import { BottomNavigation } from '@nasnet/ui/layouts';
import { useNavigate, useLocation } from '@tanstack/react-router';

const navItems = [
  { id: 'home',     label: 'Home',     icon: 'lucide:home',     href: '/' },
  { id: 'vpn',      label: 'VPN',      icon: 'lucide:shield',   href: '/vpn' },
  { id: 'monitor',  label: 'Monitor',  icon: 'lucide:activity', href: '/monitor' },
  { id: 'settings', label: 'Settings', icon: 'lucide:settings', href: '/settings' },
];

<BottomNavigation
  activeId="home"
  items={navItems}
/>
```

The active item shows `text-primary` color and a `bg-primary` bottom accent line. Inactive items use
`text-muted`. Safe-area insets are applied via `env(safe-area-inset-bottom)` for iOS notched
devices.

---

### `MobileHeader`

**File:** `libs/ui/layouts/src/mobile-header/mobile-header.tsx`

Sticky top header (`sticky top-0 z-40`) for mobile and tablet layouts. Renders a `<header>` landmark
with `h-16` height, frosted glass background (`bg-card/80 backdrop-blur-md`), and an optional action
area. Uses design token spacing: `px-page-mobile`, `md:px-page-tablet`, `lg:px-page-desktop`.

```typescript
interface MobileHeaderProps {
  title: string;
  actions?: React.ReactNode;
  className?: string;
}
```

```typescript
import { MobileHeader } from '@nasnet/ui/layouts';

<MobileHeader
  title="Network"
  actions={<RefreshButton />}
/>
```

---

### `CardLayout`

**File:** `libs/ui/layouts/src/card-layout/card-layout.tsx`

CSS grid container for card-based content. Automatically adjusts from 1 to 4 columns across
breakpoints. Optional `variant` applies consistent elevation styling to all child cards via
`React.cloneElement`.

```typescript
interface CardLayoutProps {
  children: React.ReactNode;
  /** Default: 'auto' */
  columns?: 1 | 2 | 3 | 4 | 'auto';
  /** Default: 'md' */
  gap?: 'none' | 'sm' | 'md' | 'lg';
  /** Applies elevation variant to all child cards */
  variant?: 'elevated' | 'interactive' | 'flat';
  className?: string;
}
```

Column grid mapping:

| `columns` | Mobile | Tablet (`sm+`) | Desktop (`xl+`) |
| --------- | ------ | -------------- | --------------- |
| `1`       | 1 col  | 1 col          | 1 col           |
| `2`       | 1 col  | 2 cols         | 2 cols          |
| `3`       | 1 col  | 2 cols         | 3 cols          |
| `4`       | 1 col  | 2 cols         | 3 cols (2xl: 4) |
| `auto`    | 1 col  | 2 cols         | 3 cols          |

```typescript
import { CardLayout } from '@nasnet/ui/layouts';

<CardLayout columns="auto" gap="lg" variant="elevated">
  <RouterCard router={r1} />
  <RouterCard router={r2} />
  <RouterCard router={r3} />
</CardLayout>
```

---

### `StatusLayout`

**File:** `libs/ui/layouts/src/status-layout/status-layout.tsx`

Sticky status/alert banner for temporary status messages. Uses semantic color tokens: `bg-success`,
`bg-warning`, `bg-error`, `bg-info`. Provides `role="status"` and `aria-live="polite"` for screen
reader announcements. Can be dismissed via an optional `onDismiss` callback.

```typescript
interface StatusLayoutProps {
  children: React.ReactNode;
  /** Default: 'info' */
  status?: 'success' | 'warning' | 'error' | 'info';
  /** Default: true */
  visible?: boolean;
  /** Default: true */
  sticky?: boolean;
  className?: string;
  onDismiss?: () => void;
}
```

```typescript
import { StatusLayout } from '@nasnet/ui/layouts';

<StatusLayout
  status="error"
  visible={isError}
  onDismiss={() => setIsError(false)}
>
  Configuration failed: check your settings and try again.
</StatusLayout>
```

---

## Motion Hooks

These hooks live in `libs/ui/layouts/src/responsive-shell/useReducedMotion.ts` and are exported from
`@nasnet/ui/layouts`. They implement the WCAG AAA requirement (AC 3.6) for reduced motion support.

### `useReducedMotion`

```typescript
function useReducedMotion(): boolean;
```

Returns `true` when the user has enabled `prefers-reduced-motion: reduce` at the OS level.
Subscribes to changes so it updates if the user toggles the system preference during a session.
Returns `false` during SSR.

```typescript
import { useReducedMotion } from '@nasnet/ui/layouts';

function AnimatedDiv() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        prefersReducedMotion ? 'duration-0' : 'duration-200',
        'transition-all'
      )}
    >
      Content
    </div>
  );
}
```

---

### `useAnimationDuration`

```typescript
function useAnimationDuration(normalDuration: number, reducedDuration?: number): number;
```

Returns `normalDuration` when animations are allowed, or `reducedDuration` (default: `0`) when the
user prefers reduced motion. Useful for style props where you need a raw millisecond value.

```typescript
import { useAnimationDuration } from '@nasnet/ui/layouts';

const duration = useAnimationDuration(200); // 200 or 0
return <div style={{ transitionDuration: `${duration}ms` }}>...</div>
```

---

### `useMotionConfig`

```typescript
function useMotionConfig(durationMs?: number): {
  shouldAnimate: boolean;
  transition: { duration: number } | { duration: number; ease: string };
  duration: number;
  durationSeconds: number;
};
```

Returns a Framer Motion-compatible transition config. Uses `ANIMATION_DURATIONS.DEFAULT` (200ms)
when no argument is provided.

```typescript
import { motion } from 'framer-motion';
import { useMotionConfig } from '@nasnet/ui/layouts';

function SidebarAnimation() {
  const { transition, shouldAnimate } = useMotionConfig(200);

  return (
    <motion.div
      initial={shouldAnimate ? { width: 256 } : false}
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={transition}
    >
      Sidebar content
    </motion.div>
  );
}
```

---

### `useMotionClasses`

```typescript
function useMotionClasses(): {
  transitionClass: 'transition-all' | 'transition-none';
  durationClass: 'duration-200' | 'duration-0';
  motionClass: 'transition-all duration-200 ease-out' | 'transition-none';
};
```

Returns Tailwind CSS class strings for motion-safe transitions. Use `motionClass` when you want both
`transition-all` and `duration-200` together.

```typescript
import { useMotionClasses } from '@nasnet/ui/layouts';

function Component() {
  const { motionClass } = useMotionClasses();
  return <div className={cn(motionClass, 'transform')}>Content</div>;
}
```

---

### `ANIMATION_DURATIONS` constant

```typescript
import { ANIMATION_DURATIONS } from '@nasnet/ui/layouts';

export const ANIMATION_DURATIONS = {
  SIDEBAR: 200, // Sidebar collapse/expand
  LAYOUT: 150, // Platform transitions
  DRAWER: 200, // Mobile drawer, modal, sheet
  QUICK: 100, // Hover states, micro-interactions
  DEFAULT: 200, // Standard transitions
  SLOW: 300, // Deliberate, emphasis transitions
} as const;
```

Use these named durations instead of hardcoded millisecond values to keep animations consistent
across the application.

---

## Wiring Example: ResponsiveShell and Zustand Sidebar Store

`@nasnet/ui/layouts` cannot import from `@nasnet/state/stores` (library dependency rules:
`ui/ → core/` only). Sidebar state is wired at the app layer via props.

The actual wiring in `apps/connect/src/routes/__root.tsx`:

```typescript
// apps/connect/src/routes/__root.tsx

import { ResponsiveShell, CollapsibleSidebarProvider } from '@nasnet/ui/layouts';
import { useSidebarStore } from '@nasnet/state/stores';

import { AppHeader } from '../app/components/AppHeader';
import { AppSidebar } from '../app/components/AppSidebar';

function RootInner() {
  // Pull sidebar state from Zustand store (persisted to localStorage as 'nasnet-sidebar')
  const { desktopCollapsed, toggle } = useSidebarStore();

  return (
    <ResponsiveShell
      header={<AppHeader />}
      banner={<ConnectionBanner />}
      sidebar={
        // CollapsibleSidebarProvider makes isCollapsed available to AppSidebar
        // children via useCollapsibleSidebarContext(), without prop drilling
        <CollapsibleSidebarProvider isCollapsed={desktopCollapsed} toggle={toggle}>
          <AppSidebar />
        </CollapsibleSidebarProvider>
      }
      sidebarCollapsed={desktopCollapsed}  // Controls AppShell sidebar width (w-16 vs w-64)
      onSidebarToggle={toggle}             // Called by Ctrl+B and the toggle button
    >
      <Outlet />
    </ResponsiveShell>
  );
}
```

**Data flow:**

```
useSidebarStore()           — Zustand store, persists to localStorage key 'nasnet-sidebar'
  ├─ desktopCollapsed       → ResponsiveShell sidebarCollapsed prop
  │                            → AppShell sidebarCollapsed (controls w-16 vs w-64)
  │                            → CollapsibleSidebarProvider isCollapsed
  │                               → useCollapsibleSidebarContext in AppSidebar children
  └─ toggle                 → ResponsiveShell onSidebarToggle prop
                               → Ctrl+B / Cmd+B keyboard listener (registered in ResponsiveShell)
                               → Collapse toggle button in sidebar edge
```

**Platform precedence in ResponsiveShell:**

```
Mobile (<640px)    — MobileAppShell rendered; sidebarCollapsed ignored; sidebar hidden
Tablet (640-1024px) — AppShell rendered; effectiveCollapsed = false (always expanded)
Desktop (>1024px)  — AppShell rendered; effectiveCollapsed = sidebarCollapsed from store
```

The store itself lives in `libs/state/stores/src/ui/sidebar.store.ts` and exposes:

```typescript
interface SidebarState {
  desktopCollapsed: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
  expand: () => void;
  collapse: () => void;
  reset: () => void;
}

// Selectors (for re-render optimization)
const isCollapsed = useSidebarStore(selectSidebarCollapsed);
const toggle = useSidebarStore(selectSidebarToggle);
```

---

## Cross-References

- **Primitive base components** (Button, Card, cn utility): see `primitives-reference.md`
- **Animation and spacing design tokens** (transition durations, page padding tokens): see
  `tokens-and-animation.md`
- **Full Platform Presenter pattern guide** (headless hooks, Storybook setup):
  `Docs/design/PLATFORM_PRESENTER_GUIDE.md`
- **ADR-018** — Headless + Platform Presenters decision record:
  `Docs/architecture/adrs/018-headless-platform-presenters.md`
- **ADR-017** — Three-layer component architecture:
  `Docs/architecture/adrs/017-three-layer-component-architecture.md`
