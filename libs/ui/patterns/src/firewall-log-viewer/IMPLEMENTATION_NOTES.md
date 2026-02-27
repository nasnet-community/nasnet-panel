# FirewallLogViewer Implementation Notes

## Current Status

**Completed by i18n-specialist:**

- ✅ `FirewallLogViewer.types.ts` - Complete type definitions with semantic color mappings
- ✅ `FirewallLogViewer.tsx` - Platform wrapper with proper integration
- ✅ `index.ts` - Barrel exports updated

**Remaining Work:**

- 🔄 `FirewallLogViewerDesktop.tsx` (~400 lines)
- 🔄 `FirewallLogViewerMobile.tsx` (~350 lines)
- 🔄 `FirewallLogViewer.test.tsx` (~600 lines)
- 🔄 `FirewallLogViewer.stories.tsx` (~500 lines)

## Architecture Overview

### Integration Points

The FirewallLogViewer integrates these completed components:

1. **useFirewallLogViewer** (Task #5) - Headless hook providing:

   - Filter state management with debouncing
   - Auto-refresh control
   - Log selection for detail view
   - CSV export
   - Sorting and searching

2. **FirewallLogFilters** (Task #7) - Filter UI:

   - Desktop: Sidebar layout
   - Mobile: Bottom sheet
   - Time range, action, IP, port, prefix filters

3. **FirewallLogStats** (Task #8) - Statistics panel:

   - Top 10 blocked IPs with "Add to Blocklist"
   - Top 10 ports with service names
   - Action distribution pie chart

4. **useRuleNavigation** (Task #9) - Rule navigation:
   - Click log prefix to navigate to matching rule
   - Highlight matching rules

### Semantic Action Colors

Use these semantic token classes (defined in FirewallLogViewer.types.ts):

```typescript
ACTION_COLORS = {
  accept: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
  },
  drop: {
    bg: 'bg-error/10',
    text: 'text-error',
    border: 'border-error/20',
  },
  reject: {
    bg: 'bg-error/10',
    text: 'text-error',
    border: 'border-error/20',
  },
  unknown: {
    bg: 'bg-muted/50',
    text: 'text-muted-foreground',
    border: 'border-muted',
  },
};
```

## Desktop Presenter Requirements

**File:** `FirewallLogViewerDesktop.tsx`

### Layout

```
┌─────────────────────────────────────────────┐
│  Header (auto-refresh, export, stats)      │
├──────────────┬──────────────────────────────┤
│   Filters    │   Log Table (Virtualized)   │
│   Sidebar    │   - Timestamp                │
│              │   - Action (colored badge)   │
│   - Time     │   - Source IP:Port           │
│   - Action   │   - Dest IP:Port             │
│   - IP       │   - Protocol                 │
│   - Port     │   - Prefix (clickable)       │
│   - Prefix   │   - Interfaces               │
│              │                              │
│   [Stats]    │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

### Key Components

1. **Header Bar:**

   - Auto-refresh toggle + interval selector
   - Export to CSV button
   - Stats panel toggle
   - Search input (viewer.setSearchQuery)

2. **Filters Sidebar** (280px width):

   - Use `<FirewallLogFilters>` component
   - Pass `viewer.state.filters` and `viewer.setFilters`
   - Pass `availablePrefixes` for autocomplete

3. **Log Table** (VirtualizedTable):

   - Import: `import { VirtualizedTable } from '@nasnet/ui/patterns/virtualization'`
   - Enable when `viewer.logs.length > 100`
   - Columns:
     ```typescript
     const columns = useMemo(() => [
       {
         id: 'timestamp',
         header: 'Time',
         accessorFn: (log) => log.timestamp,
         cell: ({ row }) => formatTime(row.original.timestamp),
       },
       {
         id: 'action',
         header: 'Action',
         accessorFn: (log) => log.parsed.action,
         cell: ({ row }) => (
           <ActionBadge action={row.original.parsed.action} />
         ),
       },
       {
         id: 'source',
         header: 'Source',
         cell: ({ row }) => (
           <span>
             {row.original.parsed.srcIp}
             {row.original.parsed.srcPort && `:${row.original.parsed.srcPort}`}
           </span>
         ),
       },
       {
         id: 'destination',
         header: 'Destination',
         cell: ({ row }) => (
           <span>
             {row.original.parsed.dstIp}
             {row.original.parsed.dstPort && `:${row.original.parsed.dstPort}`}
           </span>
         ),
       },
       {
         id: 'protocol',
         header: 'Protocol',
         accessorFn: (log) => log.parsed.protocol,
       },
       {
         id: 'prefix',
         header: 'Prefix',
         cell: ({ row }) => row.original.parsed.prefix && (
           <button
             onClick={() => onPrefixClick?.(row.original.parsed.prefix!)}
             className="text-primary hover:underline"
           >
             {row.original.parsed.prefix}
           </button>
         ),
       },
       {
         id: 'interfaces',
         header: 'Interfaces',
         cell: ({ row }) => (
           <span className="text-xs text-muted-foreground">
             {row.original.parsed.interfaceIn} → {row.original.parsed.interfaceOut}
           </span>
         ),
       },
     ], [onPrefixClick]);
     ```

4. **Stats Panel** (collapsible):
   - Use `<FirewallLogStats>` component
   - Pass `viewer.logs` and `onAddToBlocklist`
   - Collapsible with `viewer.state.expandedStats` and `viewer.toggleStats()`

### ActionBadge Component

Create inline helper component:

```typescript
function ActionBadge({ action }: { action: string }) {
  const colors = getActionColorClasses(action);
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
        colors.bg,
        colors.text,
        colors.border,
        'border'
      )}
    >
      {action.toUpperCase()}
    </span>
  );
}
```

## Mobile Presenter Requirements

**File:** `FirewallLogViewerMobile.tsx`

### Layout

```
┌─────────────────────────────┐
│  Header                     │
│  - Auto-refresh toggle      │
│  - Filter button            │
│  - Export button            │
├─────────────────────────────┤
│  Stats (collapsible)        │
├─────────────────────────────┤
│  ╔═══════════════════════╗  │
│  ║  Log Card             ║  │
│  ║  [Action Badge]       ║  │
│  ║  192.168.1.100:54321  ║  │
│  ║  → 10.0.0.1:443       ║  │
│  ║  TCP • ether1         ║  │
│  ║  PREFIX: DROP_WAN     ║  │
│  ╚═══════════════════════╝  │
│  ╔═══════════════════════╗  │
│  ║  Log Card             ║  │
│  ╚═══════════════════════╝  │
└─────────────────────────────┘

[Bottom Sheet for Filters]
```

### Key Components

1. **Header:**

   - Auto-refresh toggle (large 44px button)
   - Filter button with badge showing active filter count
   - Export menu button

2. **Stats Panel:**

   - Use `<FirewallLogStats>` component
   - Collapsible accordion style
   - Compact mobile layout

3. **Log Cards** (not virtualized on mobile):

   - Card-based layout with 44px minimum height
   - Each card shows:
     - Action badge at top
     - Source IP:Port → Dest IP:Port
     - Protocol, Interface
     - Prefix (clickable if present)
     - Timestamp
   - Tap card to expand full details

4. **Bottom Sheet for Filters:**
   - Use shadcn Sheet component
   - Controlled by `filtersOpen` state
   - Contains `<FirewallLogFilters>` with `open` and `onClose` props
   - Apply button at bottom

### LogCard Component

Create inline helper:

```typescript
function LogCard({
  log,
  onPrefixClick,
}: {
  log: FirewallLogEntry;
  onPrefixClick?: (prefix: string) => void;
}) {
  const colors = getActionColorClasses(log.parsed.action);

  return (
    <Card className="p-4 space-y-2">
      {/* Action Badge */}
      <div className={cn('inline-flex px-2 py-1 rounded text-xs font-medium', colors.bg, colors.text)}>
        {log.parsed.action.toUpperCase()}
      </div>

      {/* Connection */}
      <div className="font-mono text-sm">
        <div className="text-foreground">
          {log.parsed.srcIp}
          {log.parsed.srcPort && <span>:{log.parsed.srcPort}</span>}
        </div>
        <div className="text-muted-foreground text-xs">↓</div>
        <div className="text-foreground">
          {log.parsed.dstIp}
          {log.parsed.dstPort && <span>:{log.parsed.dstPort}</span>}
        </div>
      </div>

      {/* Protocol & Interface */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{log.parsed.protocol}</span>
        {log.parsed.interfaceIn && (
          <>
            <span>•</span>
            <span>{log.parsed.interfaceIn}</span>
          </>
        )}
      </div>

      {/* Prefix (clickable) */}
      {log.parsed.prefix && (
        <button
          onClick={() => onPrefixClick?.(log.parsed.prefix!)}
          className="text-xs text-primary hover:underline min-h-[44px] flex items-center"
        >
          PREFIX: {log.parsed.prefix}
        </button>
      )}

      {/* Timestamp */}
      <div className="text-xs text-muted-foreground">
        {formatTime(log.timestamp)}
      </div>
    </Card>
  );
}
```

## Testing Requirements

**File:** `FirewallLogViewer.test.tsx`

### Test Suites

1. **Rendering Tests:**

   - Renders empty state when no logs
   - Renders loading state
   - Renders with logs
   - Platform detection switches presenter

2. **Filter Integration Tests:**

   - Filters sidebar renders (desktop)
   - Bottom sheet renders (mobile)
   - Filter changes update logs
   - Clear filters works

3. **Stats Integration Tests:**

   - Stats panel renders
   - Toggle stats works
   - onAddToBlocklist callback fires

4. **Table/List Tests:**

   - VirtualizedTable used for >100 logs (desktop)
   - Card list renders (mobile)
   - Row/card click works
   - Action badges render with correct colors

5. **Navigation Tests:**

   - Prefix click fires onPrefixClick callback
   - Correct prefix passed to callback

6. **Auto-refresh Tests:**

   - Toggle auto-refresh works
   - Interval selector works

7. **Export Tests:**

   - Export to CSV works

8. **Accessibility Tests (axe-core):**
   - Zero violations with data (desktop)
   - Zero violations with data (mobile)
   - Zero violations empty state
   - Proper heading hierarchy
   - Accessible action badges
   - Keyboard navigation works

## Storybook Stories

**File:** `FirewallLogViewer.stories.tsx`

### Story Variants

1. **Default** - Realistic mixed traffic (200 logs)
2. **Empty** - No logs
3. **Loading** - Loading state
4. **HeavyBlockedTraffic** - Mostly blocked traffic
5. **PortScanPattern** - Port scan attack
6. **WithFiltersActive** - Filters pre-applied
7. **LargeDataset** - 1000+ logs to test virtualization
8. **MobileView** - Force mobile presenter

### Story Setup

Use the same log generators from FirewallLogStats.stories.tsx:

- `generateRealisticLogs(count)`
- `generateBlockedTrafficLogs()`
- `generatePortScanLogs()`

## Helper Functions

```typescript
/**
 * Format timestamp for display
 */
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format full timestamp for tooltips
 */
function formatFullTime(date: Date): string {
  return date.toLocaleString();
}
```

## Export to Main Patterns Index

Once all files are complete, add to `libs/ui/patterns/src/index.ts`:

```typescript
// ============================================================================
// Firewall Log Viewer (NAS-7.14)
// ============================================================================

// FirewallLogViewer - Main log viewer component
export {
  FirewallLogViewer,
  useFirewallLogViewer,
  getActionColorClasses,
  ACTION_COLORS,
} from './firewall-log-viewer';
export type {
  FirewallLogViewerProps,
  FirewallLogViewerPresenterProps,
  UseFirewallLogViewerOptions,
  UseFirewallLogViewerReturn,
  FirewallLogViewerState,
} from './firewall-log-viewer';
```

## Implementation Checklist

- [x] Types and color mappings defined
- [x] Platform wrapper component created
- [x] Index exports updated
- [ ] Desktop presenter implemented
- [ ] Mobile presenter implemented
- [ ] Tests written (RTL + axe-core)
- [ ] Storybook stories created
- [ ] Main patterns index updated
- [ ] Task #6 marked complete

## Notes for Next Developer

- All dependencies (Tasks #5, #7, #8, #9) are complete and working
- The foundation (types + wrapper) is production-ready
- Follow the semantic color system defined in types
- Use VirtualizedTable for desktop >100 logs
- Maintain 44px touch targets on mobile
- Test with axe-core for accessibility
- Reference FirewallLogStats.stories.tsx for log generators

Good luck! The hard design work is done - now it's implementation! 🚀
