# UI Layouts Library

Layout components for NasNetConnect following the design system with dual-theme support and mobile-first patterns.

## Design System

All components follow the NasNetConnect design system:

- **Design Tokens**: [`Docs/design/DESIGN_TOKENS.md`](../../../Docs/design/DESIGN_TOKENS.md)
- **Visual Direction**: Hybrid approach combining Clean Minimal + Action-First patterns
- **Typography**: Inter (body), Satoshi (headings), Fira Code (monospace)
- **Colors**: Golden Amber (primary), Trust Blue (secondary), semantic colors
- **Spacing**: 4px base unit with responsive tokens
- **Transitions**: 200ms ease-in-out for theme changes

## Components

### AppShell

Main application wrapper with header, sidebar, and footer support.

**Features:**
- Theme-aware surface colors
- Sticky header with elevation
- Collapsible sidebar with smooth transitions
- Mobile-responsive (sidebar hidden on mobile)
- Design system spacing and borders

**Usage:**

```tsx
import { AppShell } from '@nasnet/ui/layouts';

<AppShell
  header={<Header />}
  sidebar={<Sidebar />}
  footer={<Footer />}
  sidebarPosition="left"
  sidebarCollapsed={false}
>
  <YourContent />
</AppShell>
```

### PageContainer

Page content wrapper with title, description, and actions.

**Features:**
- Font-display typography for titles
- Responsive padding (p-4 mobile, p-6 desktop)
- Optional card variants (elevated, flat)
- Breadcrumb support with design system styling
- Flexible action area

**Usage:**

```tsx
import { PageContainer } from '@nasnet/ui/layouts';

<PageContainer
  title="Dashboard"
  description="Monitor your network status"
  actions={<Button>Settings</Button>}
  breadcrumbs={<Breadcrumbs />}
  variant="elevated"
  maxWidth="xl"
>
  <YourContent />
</PageContainer>
```

### SidebarLayout

Flexible sidebar + content layout with responsive behavior.

**Features:**
- Design system gap spacing (gap-3 md:gap-4)
- Surface colors for sidebar
- Border styling with border-default
- Responsive (stacks on mobile, side-by-side on desktop)
- Smooth transitions

**Usage:**

```tsx
import { SidebarLayout } from '@nasnet/ui/layouts';

<SidebarLayout
  sidebar={<Navigation />}
  sidebarWidth="16rem"
  sidebarPosition="left"
  gap="md"
>
  <MainContent />
</SidebarLayout>
```

### BottomNavigation

Mobile-first bottom navigation bar following Direction 4 (Action-First) pattern.

**Features:**
- Fixed bottom position with safe-area support
- Active state with primary color indicator
- Icon + label layout
- Badge support for notifications
- Smooth transitions
- Hidden on desktop (md breakpoint)

**Usage:**

```tsx
import { BottomNavigation } from '@nasnet/ui/layouts';

const navItems = [
  { id: 'home', label: 'Home', icon: <HomeIcon /> },
  { id: 'vpn', label: 'VPN', icon: <VPNIcon />, badge: 2 },
  { id: 'monitor', label: 'Monitor', icon: <MonitorIcon /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

<BottomNavigation
  items={navItems}
  activeId="home"
  onItemClick={(id) => navigate(id)}
/>
```

### MobileHeader

Mobile-optimized header with greeting and page title following Direction 1 (Clean Minimal) pattern.

**Features:**
- Time-aware greeting (Good morning/afternoon/evening)
- Font-display typography
- Optional actions area
- Safe-area support for device notches
- Responsive padding

**Usage:**

```tsx
import { MobileHeader } from '@nasnet/ui/layouts';

<MobileHeader
  title="Your Network"
  greeting={true} // or custom string
  subtitle="All systems online"
  actions={<ThemeToggle />}
/>
```

### CardLayout

Grid/flex container for card-based content with responsive columns.

**Features:**
- Auto-responsive columns (1→2→3 based on screen size)
- Design system gap spacing
- Variant support (elevated, interactive, flat)
- Applies rounded-card-sm (mobile) and rounded-card-lg (desktop)
- Shadow elevation system

**Usage:**

```tsx
import { CardLayout } from '@nasnet/ui/layouts';

<CardLayout
  columns="auto" // or 1, 2, 3, 4
  gap="md"
  variant="elevated"
>
  <StatusCard />
  <VPNCard />
  <MonitorCard />
</CardLayout>
```

### StatusLayout

Status/connection banner area with semantic colors.

**Features:**
- Sticky positioning option
- Semantic color support (success, warning, error, info)
- Smooth expand/collapse animations
- Dismissible with onDismiss callback
- Integration point for connection banners

**Usage:**

```tsx
import { StatusLayout } from '@nasnet/ui/layouts';

<StatusLayout
  status="warning"
  visible={showBanner}
  sticky={true}
  onDismiss={() => setShowBanner(false)}
>
  <div>Connection unstable. Reconnecting...</div>
</StatusLayout>
```

### MobileAppShell

Complete mobile-first responsive application shell integrating header, navigation, and status banners.

**Features:**
- Integrates MobileHeader + BottomNavigation
- Status banner area
- Optional desktop sidebar
- Safe-area support
- Theme transition support (200ms)
- Follows hybrid design direction

**Usage:**

```tsx
import { MobileAppShell } from '@nasnet/ui/layouts';

<MobileAppShell
  header={{
    title: 'Dashboard',
    greeting: true,
    actions: <ThemeToggle />,
  }}
  navigation={{
    items: navItems,
    activeId: 'home',
    onItemClick: handleNavClick,
  }}
  statusBanner={{
    status: 'success',
    visible: isConnected,
    content: <div>Connected to VPN</div>,
  }}
  sidebar={<DesktopNav />}
  showSidebarOnDesktop={true}
>
  <YourContent />
</MobileAppShell>
```

## Design Tokens Reference

### Colors

```tsx
// Surface colors (theme-aware)
surface                  // Primary surface (white/slate-800)
surface-secondary       // Secondary surface (slate-50/slate-700)
border-default          // Default border (slate-200/slate-700)

// Brand colors
bg-primary-500          // Golden Amber #EFC729
bg-secondary-500        // Trust Blue #4972ba

// Semantic colors
bg-success              // Green #22C55E
bg-warning              // Amber #F59E0B
bg-error                // Red #EF4444
bg-info                 // Blue #0EA5E9
```

### Typography

```tsx
font-display            // Satoshi for headings
font-sans               // Inter for body text
font-mono               // Fira Code for technical content

text-xs                 // 12px - captions, labels
text-sm                 // 14px - secondary text
text-base               // 16px - body text
text-lg                 // 18px - emphasized body
text-xl                 // 20px - section headers
text-2xl                // 24px - page titles
```

### Spacing

```tsx
p-4 md:p-6             // Responsive padding (design system standard)
gap-3 md:gap-4         // Responsive gap
rounded-card-sm         // 16px mobile cards
rounded-card-lg         // 24px desktop cards
rounded-button          // 12px buttons
```

### Utilities

```tsx
card-elevated          // Elevated card with shadow
card-interactive       // Hoverable card
card-flat              // Flat card with subtle background

text-muted             // Muted text color
text-emphasis          // Emphasized text

safe-top               // Safe area for device notches (top)
safe-bottom            // Safe area for device notches/home indicator (bottom)
```

## Responsive Behavior

All components follow a mobile-first approach:

- **Mobile (<768px)**: Single column, bottom navigation, stacked layouts
- **Tablet (≥768px)**: 2 columns, sidebar appears, bottom nav hidden
- **Desktop (≥1024px)**: 3 columns, full sidebar, enhanced spacing

## Theme Support

All components support light and dark themes with smooth 200ms transitions:

```tsx
// Toggle theme
document.documentElement.classList.toggle('dark');

// All layout components automatically adapt to the theme
```

## Accessibility

- WCAG 2.1 AA compliant color contrasts
- Keyboard navigation support
- Screen reader friendly
- Semantic HTML structure
- ARIA attributes where appropriate

## Related Documentation

- [Design Tokens](../../../Docs/design/DESIGN_TOKENS.md)
- [Theme Implementation](../../../Docs/design/THEME_IMPLEMENTATION_SUMMARY.md)
- [Component Library Spec](../../../Docs/design/ux-design/6-component-library.md)
- [Implementation Guidance](../../../Docs/design/ux-design/9-implementation-guidance.md)

## Development

### Testing

All components should be tested in:
- Both light and dark themes
- All responsive breakpoints
- With keyboard navigation
- With screen readers

### Integration

Import from the package:

```tsx
import {
  AppShell,
  PageContainer,
  SidebarLayout,
  BottomNavigation,
  MobileHeader,
  CardLayout,
  StatusLayout,
  MobileAppShell,
} from '@nasnet/ui/layouts';
```

## License

Part of the NasNetConnect project.




























