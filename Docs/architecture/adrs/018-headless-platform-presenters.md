# ADR-018: Headless + Platform Presenters Pattern

**Date:** 2026-01-20  
**Status:** Accepted  
**Deciders:** Technical Architect, BMad, UX Designer  
**Category:** Architecture / Frontend / Responsive Design  
**Source Session:** brainstorming-session-component-library-2026-01-03.md  
**Related ADRs:** ADR-017 (Three-Layer Components), ADR-001 (shadcn/ui)

---

## Context

NasNetConnect must provide optimal UX across three device classes:

| Device | Screen | Primary Use | UX Paradigm |
|--------|--------|-------------|-------------|
| **Mobile** | <640px | On-the-go monitoring | Consumer-grade simplicity, bottom nav, cards, swipe gestures |
| **Tablet** | 640-1024px | Casual management | Hybrid (collapsible sidebar + touch-friendly) |
| **Desktop** | >1024px | Power user management | Pro-grade density, sidebar, data tables, keyboard shortcuts |

**Not Just Responsive - Different Paradigms:**
- Mobile isn't "shrunk desktop" - it's a different mental model
- Desktop has space for multi-column layouts, data tables, detailed metrics
- Mobile focuses on essential info, quick actions, single-column flow
- Tablet is hybrid (can use either paradigm based on user preference)

**Traditional Responsive Design Problems:**

**Approach 1: CSS-Only Responsive:**
```tsx
// Single component, CSS media queries
<Card className="p-2 md:p-4 lg:p-6">
  <h3 className="text-sm md:text-base lg:text-lg">{name}</h3>
  <div className="flex flex-col md:flex-row">...</div>
</Card>
```

**Problems:**
- Component becomes complex spaghetti of conditional classes
- Hard to maintain (which className applies when?)
- Can't change component structure (only styling)
- No way to show different data on mobile vs desktop
- Testing difficult (simulate all breakpoints)

**Approach 2: Separate Mobile/Desktop Components:**
```tsx
// Completely separate components
{isMobile ? <VPNCardMobile vpn={vpn} /> : <VPNCardDesktop vpn={vpn} />}
```

**Problems:**
- Duplicate business logic (connect, disconnect, validation)
- Inconsistent behavior (mobile and desktop drift apart)
- 2-3× code to maintain
- Bugs in one variant not in others

**Problem:**
How to provide optimal UX per device while avoiding duplication and maintaining consistency?

---

## Decision

Adopt the **Headless + Platform Presenters Pattern** where:
1. **Headless Hook:** Contains all business logic, state management, data fetching
2. **Platform Presenters:** Three separate render implementations (Mobile/Tablet/Desktop)
3. **Automatic Detection:** Component auto-selects presenter based on viewport
4. **Manual Override:** Developer can force specific presenter when needed

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│         HEADLESS + PLATFORM PRESENTERS PATTERN               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  HEADLESS HOOK (Business Logic - Write Once)                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  export function useResourceCard<T>(props) {            ││
│  │    const { resource, actions } = props;                 ││
│  │                                                          ││
│  │    // State                                              ││
│  │    const status = resource.runtime?.status;             ││
│  │    const isOnline = status === 'online';                ││
│  │                                                          ││
│  │    // Computed                                           ││
│  │    const statusColor = getStatusColor(status);          ││
│  │    const primaryAction = actions?.[0];                  ││
│  │                                                          ││
│  │    // Handlers                                           ││
│  │    const handlePrimaryAction = () => primaryAction?.();  ││
│  │                                                          ││
│  │    return { status, isOnline, statusColor,              ││
│  │             primaryAction, handlePrimaryAction };        ││
│  │  }                                                       ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│                          ▼ Used by all presenters            │
│                                                              │
│  PLATFORM PRESENTERS (Presentation - Optimal per Device)    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  MOBILE (<640px)                                        ││
│  │  • Bottom sheet actions                                 ││
│  │  • Large touch targets (44px)                           ││
│  │  • Single column                                         ││
│  │  • Essential info only                                   ││
│  │  • Swipe gestures                                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  TABLET (640-1024px)                                    ││
│  │  • Collapsible sidebar                                  ││
│  │  • Two-column layouts                                    ││
│  │  • Dropdown menus                                        ││
│  │  • More details than mobile                             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  DESKTOP (>1024px)                                      ││
│  │  • Multi-column layouts                                  ││
│  │  • Data tables                                           ││
│  │  • Hover states                                          ││
│  │  • Keyboard shortcuts                                    ││
│  │  • Maximum information density                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  AUTO-DETECTION (Default)                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  export function ResourceCard<T>(props) {               ││
│  │    const platform = usePlatform(); // Auto-detect       ││
│  │                                                          ││
│  │    switch (platform) {                                   ││
│  │      case 'mobile':                                      ││
│  │        return <ResourceCardMobile {...props} />;        ││
│  │      case 'tablet':                                      ││
│  │        return <ResourceCardTablet {...props} />;        ││
│  │      case 'desktop':                                     ││
│  │        return <ResourceCardDesktop {...props} />;       ││
│  │    }                                                     ││
│  │  }                                                       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Rationale

### Why Headless + Presenters?

**Comparison with Alternatives:**

| Approach | Code Reuse | Optimal UX | Maintainability | Testability |
|----------|-----------|------------|-----------------|-------------|
| **CSS-Only Responsive** | High (100%) | Low | Medium | Low |
| **Separate Components** | Low (33%) | High | Low | Medium |
| **Headless + Presenters** | High (80%) | High | High | High |

**Headless + Presenters Wins Because:**
- **Business logic shared** (80% of code)
- **Optimal presentation** per device (not compromised)
- **Easy to maintain** (fix bug once in headless hook)
- **Easy to test** (test headless logic once, visual test presenters)

### Why Automatic Detection?

**Developer Experience:**

```tsx
// Simple usage (95% of cases)
<ResourceCard resource={vpn} actions={actions} />
// Auto-detects mobile/tablet/desktop, renders optimal variant

// Manual override (5% of cases - force desktop on tablet)
<ResourceCard resource={vpn} presenter="desktop" />
```

**Benefits:**
- Features don't think about responsive design
- Patterns handle platform detection automatically
- Can override when needed (special cases)
- Consistent breakpoints across all patterns

---

## Implementation

### Platform Detection Hook

```tsx
// libs/ui/patterns/src/hooks/usePlatform.ts
export type Platform = 'mobile' | 'tablet' | 'desktop';

const breakpoints = {
  mobile: 640,
  tablet: 1024,
};

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>(() => 
    detectPlatform(window.innerWidth)
  );
  
  useEffect(() => {
    const handleResize = () => {
      setPlatform(detectPlatform(window.innerWidth));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return platform;
}

function detectPlatform(width: number): Platform {
  if (width < breakpoints.mobile) return 'mobile';
  if (width < breakpoints.tablet) return 'tablet';
  return 'desktop';
}
```

### Platform Context (Global)

```tsx
// libs/ui/patterns/src/providers/PlatformProvider.tsx
export const PlatformContext = createContext<Platform>('desktop');

export function PlatformProvider({ children }: PropsWithChildren) {
  const platform = usePlatform();
  
  return (
    <PlatformContext.Provider value={platform}>
      {children}
    </PlatformContext.Provider>
  );
}

// Wrap app
function App() {
  return (
    <PlatformProvider>
      <Router />
    </PlatformProvider>
  );
}
```

### Complete Pattern Example

```tsx
// libs/ui/patterns/src/data-table/

// 1. Headless hook (business logic)
export function useDataTable<T>(props: DataTableProps<T>) {
  const { data, columns, onSort, onFilter } = props;
  
  const [sortBy, setSortBy] = useState<SortBy>();
  const [filters, setFilters] = useState<Filters>({});
  
  const sortedData = useMemo(() => {
    return sortData(data, sortBy);
  }, [data, sortBy]);
  
  const filteredData = useMemo(() => {
    return filterData(sortedData, filters);
  }, [sortedData, filters]);
  
  return {
    data: filteredData,
    sortBy,
    setSortBy,
    filters,
    setFilters,
    columns,
  };
}

// 2. Mobile presenter (cards, no table)
export function DataTableMobile<T>(props: DataTableProps<T>) {
  const state = useDataTable(props);
  
  return (
    <div className="space-y-2">
      {/* Filters */}
      <FilterSheet filters={state.filters} onChange={state.setFilters} />
      
      {/* Data as cards (better for mobile) */}
      {state.data.map((item, i) => (
        <Card key={i} className="p-4">
          {state.columns.map(col => (
            <div key={col.id}>
              <span className="text-sm text-muted">{col.header}</span>
              <span className="font-medium">{col.cell(item)}</span>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

// 3. Desktop presenter (data table)
export function DataTableDesktop<T>(props: DataTableProps<T>) {
  const state = useDataTable(props);
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {state.columns.map(col => (
            <TableHead key={col.id} onClick={() => state.setSortBy(col.id)}>
              {col.header}
              {state.sortBy === col.id && <SortIcon />}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {state.data.map((item, i) => (
          <TableRow key={i}>
            {state.columns.map(col => (
              <TableCell key={col.id}>{col.cell(item)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// 4. Auto-detect wrapper
export function DataTable<T>(props: DataTableProps<T> & { presenter?: Platform }) {
  const platform = usePlatform();
  const presenter = props.presenter || platform;
  
  switch (presenter) {
    case 'mobile':
      return <DataTableMobile {...props} />;
    case 'desktop':
      return <DataTableDesktop {...props} />;
    default:
      return <DataTableDesktop {...props} />;
  }
}
```

---

## Consequences

### Positive

- **Write Logic Once:** Business logic in headless hook, shared across all presenters
- **Optimal UX per Device:** Mobile gets cards/sheets, desktop gets tables, each optimized
- **Easy Maintenance:** Fix bug in headless hook, all presenters benefit
- **Easy Testing:** Test headless logic once (unit), visual test presenters (Chromatic)
- **Automatic Detection:** Features don't think about responsive (patterns handle it)
- **Type-Safe:** TypeScript generics ensure type safety across hook and presenters
- **Accessibility:** Each presenter can use platform-appropriate patterns (touch targets, hover states)

### Negative

- **More Code per Component:** 3 presenter implementations instead of 1
- **Complexity:** Requires understanding of headless pattern
- **Potential Duplication:** Similar code across presenters (mitigated by shared utilities)

### Mitigations

- **Shared Utilities:** Common presenter utilities (formatting, status colors, etc.)
  ```tsx
  // libs/ui/patterns/src/utils/presenter-utils.ts
  export const presenterUtils = {
    formatStatus: (status: string) => ...,
    getStatusColor: (status: string) => ...,
    formatBytes: (bytes: number) => ...,
  };
  ```

- **Template Generators:** Plop templates for creating new headless components
  ```bash
  npm run generate:pattern
  # Creates: usePattern.ts + Mobile.tsx + Tablet.tsx + Desktop.tsx + index.ts
  ```

- **Documentation:** Clear examples in Storybook showing all three presenters

---

## Examples

### Feature Usage

```tsx
// VPN Feature - doesn't specify presenter
import { ResourceCard } from '@nasnet/ui-patterns';

function VPNList({ vpns }: { vpns: VPNClient[] }) {
  return (
    <div className="grid gap-4">
      {vpns.map(vpn => (
        <ResourceCard<VPNClient>
          key={vpn.uuid}
          resource={vpn}
          actions={vpnActions}
        />
        // Auto-renders:
        // - Mobile: Bottom sheet actions, large buttons, essential info
        // - Desktop: Dropdown menu, compact layout, detailed stats
      ))}
    </div>
  );
}
```

### Force Desktop on Tablet

```tsx
// Special case: Power user prefers desktop view on tablet
function FirewallRuleTable({ rules }: Props) {
  return (
    <DataTable<FirewallRule>
      data={rules}
      columns={columns}
      presenter="desktop"  // Force desktop table even on tablet
    />
  );
}
```

---

## Alternatives Considered

### CSS-Only Responsive (Rejected)

**Approach:** Single component with media queries

**Why rejected:**
- Can't fundamentally change component structure (cards vs table)
- Becomes spaghetti of conditional classes
- Hard to provide truly optimal UX per device
- Mobile users get "shrunk desktop" not "mobile-first"

### Render Props for Custom Presentation (Rejected)

**Approach:** Pattern provides headless logic, feature provides all UI

```tsx
<ResourceCard resource={vpn}>
  {(state) => (
    <Card>
      <h3>{state.name}</h3>
      <Badge>{state.status}</Badge>
    </Card>
  )}
</ResourceCard>
```

**Why rejected:**
- Defeats purpose of pattern library (no consistency)
- Every feature reimplements presentation
- Accessibility not guaranteed
- Loses automatic responsive handling

### Component Props Only (No Headless) - Rejected

**Approach:** Pass different props to single component for mobile vs desktop

```tsx
<ResourceCard 
  resource={vpn} 
  variant={isMobile ? 'compact' : 'detailed'} 
  layout={isMobile ? 'vertical' : 'horizontal'}
/>
```

**Why rejected:**
- Component becomes giant switch statement
- Hard to maintain (which props apply when?)
- Can't fundamentally change structure (still same component)
- Less optimal than dedicated presenters

---

## Performance

**Bundle Impact:**
- Headless hook: ~2-3KB (shared)
- Mobile presenter: ~1-2KB
- Tablet presenter: ~1-2KB (lazy-loaded on tablet)
- Desktop presenter: ~2-3KB (lazy-loaded on desktop)
- **Total:** ~5-8KB per pattern (acceptable)

**Code-Splitting:**
```tsx
// Lazy load tablet/desktop presenters on mobile (don't ship unused code)
const ResourceCardDesktop = lazy(() => import('./ResourceCard.Desktop'));
const ResourceCardTablet = lazy(() => import('./ResourceCard.Tablet'));

export function ResourceCard<T>(props) {
  const platform = usePlatform();
  
  switch (platform) {
    case 'mobile':
      return <ResourceCardMobile {...props} />;  // Bundled (always needed)
    case 'tablet':
      return <Suspense><ResourceCardTablet {...props} /></Suspense>;
    case 'desktop':
      return <Suspense><ResourceCardDesktop {...props} /></Suspense>;
  }
}
```

---

## Review Date

Review after 3 months of usage:
- Assess if 3× code overhead justified by UX improvements
- Check if presenters diverging (logic duplication creeping in?)
- Evaluate if tablet presenter needed or if mobile/desktop sufficient
- Measure actual code-splitting effectiveness
- Consider if more patterns should adopt this vs CSS-only

---

## References

- Brainstorming Session: `Docs/brainstorming-sessions/brainstorming-session-component-library-2026-01-03.md`
- Design System: `Docs/design/ux-design/8-responsive-design-accessibility.md`
- ADR-017: Three-Layer Component Architecture

---
