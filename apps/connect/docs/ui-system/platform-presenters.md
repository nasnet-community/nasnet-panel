# Platform Presenters Pattern

NasNetConnect uses a **Headless + Platform Presenters** architecture as the core responsive design strategy. This is not standard CSS-only responsive design — it is a deliberate component architecture that separates business logic from rendering, then renders entirely different component trees per platform.

**Authoritative reference:** `Docs/design/PLATFORM_PRESENTER_GUIDE.md`
**ADR reference:** ADR-018 (Headless Platform Presenters)

## Why This Pattern

MikroTik administrators use the app in very different contexts:

- **In server rooms on mobile** — needs large touch targets, simplified flows, bottom navigation
- **At a desk on desktop** — needs dense data tables, keyboard shortcuts, collapsible sidebars

A single CSS-responsive component cannot adequately serve both. Instead, the architecture provides entirely separate presenter components per platform, sharing only the business logic layer.

## Three Platform Targets

| Platform | Viewport | Breakpoints | UX Paradigm |
|----------|----------|-------------|-------------|
| **Mobile** | `<640px` | `xs` | Consumer-grade simplicity, bottom tab bar, 44px touch targets, swipe gestures |
| **Tablet** | `640–1024px` | `sm`, `md` | Hybrid, collapsible sidebar, balanced density |
| **Desktop** | `>1024px` | `lg`, `xl` | Pro-grade power user, dense data tables, keyboard shortcuts, fixed sidebar |

## Breakpoint System

Defined in `libs/ui/layouts/src/responsive-shell/useBreakpoint.ts`:

```
xs  < 640px    → mobile
sm  640-767px  → tablet
md  768-1023px → tablet
lg  1024-1279px → desktop
xl  1280px+    → desktop
```

The `useBreakpoint()` hook uses `ResizeObserver` on `document.documentElement` (more efficient than `window.resize`) with 100ms debounce to prevent excessive re-renders.

## The usePlatform() Hook

**Source:** `libs/ui/layouts/src/responsive-shell/usePlatform.ts`

`usePlatform()` is the primary hook for platform detection in components.

```tsx
import { usePlatform } from '@nasnet/ui/layouts';

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

The hook maps breakpoints to platforms:
- `xs` → `'mobile'`
- `sm`, `md` → `'tablet'`
- `lg`, `xl` → `'desktop'`

It is SSR-compatible: defaults to `'desktop'` (1024px) when `window` is undefined.

### Additional Platform Hooks

| Hook | Returns | Use Case |
|------|---------|---------|
| `usePlatform()` | `'mobile' \| 'tablet' \| 'desktop'` | Primary platform detection |
| `usePlatformWithBreakpoint()` | `{ platform, breakpoint }` | Need both coarse and fine-grained info |
| `useIsMobile()` | `boolean` | Simple mobile check |
| `useIsTablet()` | `boolean` | Simple tablet check |
| `useIsDesktop()` | `boolean` | Simple desktop check |
| `useIsTouchPlatform()` | `boolean` | True for mobile and tablet |
| `usePlatformConfig(config)` | `T` | Select config object by platform |
| `useBreakpoint()` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | Fine-grained breakpoint |

### usePlatformConfig

For components that change configuration rather than entire rendering trees:

```tsx
const layout = usePlatformConfig({
  mobile:  { columns: 1, gap: 'sm', compact: true },
  tablet:  { columns: 2, gap: 'md', compact: false },
  desktop: { columns: 3, gap: 'lg', compact: false },
});

return <Grid columns={layout.columns} gap={layout.gap} />;
```

## PlatformProvider

**Source:** `libs/ui/layouts/src/responsive-shell/PlatformProvider.tsx`

`PlatformProvider` wraps the application to supply platform detection via React Context. It supports manual override for testing or previewing specific platform layouts.

```tsx
// Root of the app (apps/connect/src/app/providers/index.tsx)
<PlatformProvider>
  <App />
</PlatformProvider>

// With override for testing
<PlatformProvider initialPlatform="mobile">
  <StorybookPreview />
</PlatformProvider>
```

### Context Access

```tsx
// Full context with override control
const { platform, isOverridden, setOverride, clearOverride } = usePlatformContext();

// Platform only (with fallback to direct detection if no Provider)
const platform = usePlatformFromContext();
```

### PlatformSwitch Component

Declarative rendering based on platform:

```tsx
<PlatformSwitch
  mobile={<MobileView />}
  tablet={<TabletView />}
  desktop={<DesktopView />}
/>
```

### PlatformDebugger

Development-only overlay showing current platform with override buttons. Only visible when `NODE_ENV === 'development'`:

```tsx
<PlatformProvider>
  <App />
  <PlatformDebugger />  {/* Shows M/T/D buttons in bottom-right corner */}
</PlatformProvider>
```

## Implementing a Platform Presenter Pattern

The standard pattern for Layer 2 pattern components:

### Step 1: Define the headless hook

```tsx
// useResourceCard.ts — shared business logic
export function useResourceCard<T>(props: ResourceCardProps<T>) {
  const { item, onSelect, onDelete } = props;

  const handleSelect = useCallback(() => onSelect?.(item), [item, onSelect]);
  const handleDelete = useCallback(() => onDelete?.(item), [item, onDelete]);

  return { item, handleSelect, handleDelete };
}
```

### Step 2: Create platform-specific presenters

```tsx
// ResourceCardMobile.tsx — touch-optimized
export function ResourceCardMobile<T>(props: ResourceCardProps<T>) {
  const { item, handleSelect, handleDelete } = useResourceCard(props);
  return (
    <div className="p-4 min-h-[44px]" onClick={handleSelect}>
      {/* Simplified mobile layout */}
    </div>
  );
}

// ResourceCardDesktop.tsx — dense data layout
export function ResourceCardDesktop<T>(props: ResourceCardProps<T>) {
  const { item, handleSelect, handleDelete } = useResourceCard(props);
  return (
    <div className="p-2 hover:bg-muted cursor-pointer" onClick={handleSelect}>
      {/* Dense desktop layout with more columns */}
    </div>
  );
}
```

### Step 3: Create the adapter component

```tsx
// ResourceCard.tsx — platform adapter
export function ResourceCard<T>(props: ResourceCardProps<T>) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <ResourceCardMobile {...props} />;
    case 'tablet':
      return <ResourceCardTablet {...props} />;
    case 'desktop':
    default:
      return <ResourceCardDesktop {...props} />;
  }
}
```

## Layout-Level Platform Adaptation

The `ResponsiveShell` in `libs/ui/layouts/src/responsive-shell/ResponsiveShell.tsx` is the top-level layout adapter. It selects between two fundamentally different layout shells:

```
Mobile (<640px):
  MobileAppShell
  ├── StatusLayout (optional status banner at top)
  ├── MobileHeader (compact header with hamburger/title)
  ├── <main> (scrollable content, pb-16 for bottom nav clearance)
  └── BottomNavigation (fixed bottom tab bar)

Tablet/Desktop (640px+):
  AppShell
  ├── <header> (sticky, h-[--nav-height])
  ├── Banner slot (optional ConnectionBanner)
  ├── <aside> (sidebar: w-64 expanded, w-16 collapsed; hidden on mobile)
  └── <main id="main-content"> (flex-1 scrollable)
```

Desktop sidebar behavior:
- **Tablet:** Always expanded (ignores collapse state)
- **Desktop:** Respects `sidebarCollapsed` prop (persisted in Zustand store)
- **Keyboard shortcut:** `Cmd+B` / `Ctrl+B` toggles sidebar

## Mobile Layout Details

**Source:** `libs/ui/layouts/src/mobile-app-shell/mobile-app-shell.tsx`

Key mobile-specific behaviors:
- `pb-16` on `<main>` reserves space for the 64px bottom navigation bar
- `safe-area-inset-bottom` support for notched devices (iOS)
- 44px minimum touch targets on all interactive elements
- No hover states (touch-only interaction)

**Source:** `libs/ui/layouts/src/bottom-navigation/`

The `BottomNavigation` component renders a fixed bottom tab bar (the primary navigation on mobile). Navigation items use icons with optional labels.

## Desktop Sidebar Details

**Source:** `libs/ui/layouts/src/sidebar/CollapsibleSidebar.tsx`

```
Expanded:  w-64 (256px) — shows icons + labels
Collapsed: w-16 (64px)  — shows icons only
```

Width transitions use CSS `transition-all` with duration from `ANIMATION_DURATIONS.SIDEBAR`. Reduced motion is respected: `prefersReducedMotion ? '0ms' : durationMs`.

The `CollapsibleSidebarContext` provides `isCollapsed` to child components so navigation items can hide their labels:

```tsx
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

## Wiring Sidebar State

The sidebar state is managed in a Zustand store at `libs/state/stores/`. The `ui/layouts` library cannot import from `state/` (violates library boundaries), so state is passed via props:

```tsx
// apps/connect — wires Zustand store to ResponsiveShell
function AppLayout({ children }) {
  const { desktopCollapsed, toggle } = useSidebarStore();

  return (
    <ResponsiveShell
      sidebar={<NavigationSidebar />}
      sidebarCollapsed={desktopCollapsed}
      onSidebarToggle={toggle}
    >
      {children}
    </ResponsiveShell>
  );
}
```

## Testing Platform Presenters

For Storybook stories, use `PlatformProvider` with `initialPlatform`:

```tsx
export const MobileView: Story = {
  decorators: [
    (Story) => (
      <PlatformProvider initialPlatform="mobile">
        <Story />
      </PlatformProvider>
    ),
  ],
};

export const DesktopView: Story = {
  decorators: [
    (Story) => (
      <PlatformProvider initialPlatform="desktop">
        <Story />
      </PlatformProvider>
    ),
  ],
};
```

For unit tests, pass `forcePlatform` prop directly to `ResponsiveShell`, or use `PlatformProvider initialPlatform` in RTL renders.
