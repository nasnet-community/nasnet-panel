---
sidebar_position: 10
title: Multi-Package Flows
---

# Multi-Package Flows — End-to-End Code Traces

This document traces eight significant runtime flows through the `libs/ui/` library system. Each
flow starts at the entry point a feature developer touches, crosses multiple packages, and ends at a
rendered pixel or a side-effect. Package boundaries are annotated inline.

**Why this document exists:** The other documents in this series describe individual packages or
component catalogs. This one stitches everything together so you can read one page and understand
_exactly_ what executes when a user resizes a browser, applies a configuration, drags a firewall
rule, or pastes an IP list.

**Prerequisites:** Read [intro.md](./intro.md) and [quick-start.md](./quick-start.md) first.
The three-layer dependency hierarchy is assumed knowledge throughout.

---

## Package Abbreviations Used in Annotations

| Annotation | Package | Import alias |
|------------|---------|--------------|
| `[layouts]` | `libs/ui/layouts` | `@nasnet/ui/layouts` |
| `[patterns]` | `libs/ui/patterns` | `@nasnet/ui/patterns` |
| `[primitives]` | `libs/ui/primitives` | `@nasnet/ui/primitives` |
| `[tokens]` | `libs/ui/tokens` | `@nasnet/ui/tokens` |
| `[state]` | `libs/state/stores` | `@nasnet/state/stores` |
| `[features]` | `libs/features/*` | `@nasnet/features/*` |
| `[app]` | `apps/connect/src` | `@/` |

---

## Flow 1: Responsive Page with Platform-Specific Layouts

**Entry point:** `apps/connect/src/app/providers/index.tsx` mounts `ResponsiveShell`.
**End state:** The correct shell (mobile or desktop) is mounted, the sidebar toggle works via
keyboard, and pattern components inside the page automatically choose their platform presenters.

### Stage 1 — Viewport observation

`ResponsiveShell` [layouts] calls `usePlatform()` [layouts]:

```tsx
// libs/ui/layouts/src/responsive-shell/usePlatform.ts
import { useMemo } from 'react';
import { useBreakpoint, type Breakpoint, BREAKPOINTS } from './useBreakpoint';

export type Platform = 'mobile' | 'tablet' | 'desktop';

export function usePlatform(debounceMs = 100): Platform {
  const breakpoint = useBreakpoint(debounceMs); // [layouts] — ResizeObserver on documentElement
  return useMemo(() => breakpointToPlatform(breakpoint), [breakpoint]);
}

// Mapping: xs→mobile  sm,md→tablet  lg,xl→desktop
function breakpointToPlatform(breakpoint: Breakpoint): Platform {
  switch (breakpoint) {
    case 'xs':  return 'mobile';
    case 'sm':
    case 'md':  return 'tablet';
    case 'lg':
    case 'xl':  return 'desktop';
    default:    return 'desktop';
  }
}
```

`useBreakpoint` [layouts] attaches a `ResizeObserver` to `document.documentElement` and returns
`'xs' | 'sm' | 'md' | 'lg' | 'xl'`. Updates are debounced (default 100 ms). SSR defaults to
`1024px` (desktop) so there is no server-side layout shift.

### Stage 2 — Shell selection

`ResponsiveShell` [layouts] branches on the platform value and delegates to different shells:

```tsx
// libs/ui/layouts/src/responsive-shell/ResponsiveShell.tsx
import { AppShell }       from '../app-shell';         // [layouts]
import { MobileAppShell } from '../mobile-app-shell';  // [layouts]
import { usePlatform }    from './usePlatform';         // [layouts]

export const ResponsiveShell = React.memo(React.forwardRef<HTMLDivElement, ResponsiveShellProps>(
  ({ children, sidebar, header, mobileHeaderProps, mobileNavigationProps,
     sidebarCollapsed = false, onSidebarToggle, forcePlatform, className }, ref) => {

    const detectedPlatform = usePlatform();          // [layouts]
    const platform = forcePlatform ?? detectedPlatform;
    const prefersReducedMotion = useReducedMotion(); // [layouts]

    // Keyboard shortcut: Cmd+B / Ctrl+B to collapse sidebar
    React.useEffect(() => {
      if (platform === 'mobile' || !onSidebarToggle) return;
      const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
          event.preventDefault();
          onSidebarToggle();  // [state] — calls useSidebarStore.toggle()
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [platform, onSidebarToggle]);

    if (platform === 'mobile') {
      return (
        <MobileAppShell    // [layouts] — bottom navigation + stacked layout
          ref={ref}
          header={mobileHeaderProps}
          navigation={mobileNavigationProps}
        >
          {children}
        </MobileAppShell>
      );
    }

    // tablet or desktop → AppShell with collapsible sidebar
    const effectiveCollapsed = platform === 'tablet' ? false : sidebarCollapsed;
    return (
      <div className="bg-background min-h-screen">
        <AppShell       // [layouts] — fixed sidebar + header layout
          ref={ref}
          header={header}
          sidebar={enhancedSidebar}
          sidebarCollapsed={effectiveCollapsed}
          className={className}
        >
          {children}
        </AppShell>
      </div>
    );
  }
));
```

### Stage 3 — Sidebar state (app layer wires Zustand)

`ResponsiveShell` cannot import from `@nasnet/state/stores` (library dependency rule). The app
layer injects sidebar state via props:

```tsx
// apps/connect/src/app/providers/index.tsx
import { ResponsiveShell } from '@nasnet/ui/layouts';         // [layouts]
import { useSidebarStore }  from '@nasnet/state/stores';       // [state]

function AppProviders({ children }: { children: React.ReactNode }) {
  const { desktopCollapsed, toggle } = useSidebarStore();      // [state] — Zustand store

  return (
    <ResponsiveShell                                           // [layouts]
      sidebar={<NavigationSidebar />}
      header={<AppHeader />}
      sidebarCollapsed={desktopCollapsed}  // injected from [state]
      onSidebarToggle={toggle}             // injected from [state]
      mobileNavigationProps={{ activeId: 'home', items: NAV_ITEMS }}
    >
      {children}
    </ResponsiveShell>
  );
}
```

### Stage 4 — Components inside the page auto-select presenters

Any pattern component rendered as `children` calls `usePlatform()` independently:

```tsx
// From libs/ui/patterns/src/sortable/domain/FirewallRuleList.tsx
import { usePlatform } from '@nasnet/ui/layouts'; // [layouts]

export const FirewallRuleList: React.FC<FirewallRuleListProps> = ({ rules, onReorder }) => {
  const platform = usePlatform?.() ?? 'desktop';  // [layouts]

  if (platform === 'desktop') {
    return <SortableListDesktop items={rules} onReorder={onReorder} ... />;
  }
  return <SortableListMobile items={rules} onReorder={onReorder} ... />;
};
```

No prop-drilling is needed. Each component calls `usePlatform` directly and the 100 ms debounce
ensures all components observe the same viewport width on a given frame.

### Complete component tree (annotated)

```
<AppProviders>                              [app]
  └── useSidebarStore()                     [state] — Zustand sidebar collapse state
  └── <ResponsiveShell                      [layouts]
        sidebarCollapsed={...}              injected from [state]
        onSidebarToggle={toggle}>           injected from [state]
      └── usePlatform()                     [layouts] — ResizeObserver → Breakpoint → Platform
      └── if mobile → <MobileAppShell>      [layouts]
              └── <BottomNavigation>        [layouts]
          if desktop → <AppShell>           [layouts]
              └── <CollapsibleSidebar>      [layouts]
      └── <VPNPage>                         [features/vpn] — page content
          └── <WireGuardCard>               [patterns]
              └── usePlatform()             [layouts] — independent check
              └── if mobile → compact card view
              └── if desktop → dense table row
```

**Packages involved:** `layouts`, `patterns`, `primitives`, `state/stores` (via app injection).

**See also:** [layouts-and-platform.md](./layouts-and-platform.md) for full `usePlatform` API,
[shared-hooks.md](./shared-hooks.md#platform-hooks) for the complete hook table.

---

## Flow 2: Configuration Apply Pipeline

**Entry point:** User clicks "Apply" on a configuration form.
**End state:** Changes are applied to the router, a 10-second undo window is shown, and the
ChangeSet is confirmed or rolled back.

### Stage 1 — ValidationProgress gates the apply

Before `Apply` becomes clickable, `ValidationProgress` [patterns] must reach `isValid === true`:

```tsx
// Feature-layer usage (libs/features/*/src/components/ConfigApplyPanel.tsx)
import {
  ValidationProgress,
  useValidationProgress,
} from '@nasnet/ui/patterns';                    // [patterns]

function ConfigApplyPanel({ changeset }) {
  const {
    stages,
    currentStageIndex,
    isComplete,
    isValid,
    startStage,       // call to move a stage to 'running'
    completeStage,    // call with ValidationStageResult to mark passed/failed
    finish,           // call when all 7 stages are done
    reset,
  } = useValidationProgress();               // [patterns] — hook manages stage state

  // Drive the pipeline from GraphQL subscription events
  useEffect(() => {
    if (!changeset) return;
    // ...subscribe to validation events and call startStage/completeStage/finish
  }, [changeset]);

  return (
    <ValidationProgress   // [patterns]
      stages={stages}
      currentStage={currentStageIndex}
      isComplete={isComplete}
      isValid={isValid}
      autoExpandFailed    // auto-expands failed stages
    />
  );
}
```

The seven canonical stages (defined in `ValidationProgress.tsx`):

```ts
// libs/ui/patterns/src/validation-progress/ValidationProgress.tsx
const STAGE_ORDER: ValidationStageName[] = [
  'schema',
  'syntax',
  'cross-resource',
  'dependencies',
  'network',
  'platform',
  'dry-run',
];
```

Each stage emits `'pending' | 'running' | 'passed' | 'failed' | 'skipped'` status.
`useValidationProgress` [patterns] tracks these states locally; the caller drives state transitions
by invoking `startStage` and `completeStage`.

### Stage 2 — Progress bar animation

`ValidationProgress` [patterns] uses Framer Motion for the animated progress bar. It consumes
token values directly from `@nasnet/ui/tokens`:

```tsx
// libs/ui/patterns/src/validation-progress/ValidationProgress.tsx
import { motion } from 'framer-motion';  // from @nasnet/ui/patterns/motion re-export

// Animated progress bar
<motion.div
  className={cn(
    'h-full rounded-full transition-colors',
    summary.failed > 0 ? 'bg-error' :
    isComplete        ? 'bg-success' :
                        'bg-primary'    // Tailwind → CSS var --color-primary (Tier 2 token)
  )}
  initial={{ width: 0 }}
  animate={{ width: `${((passed + failed + skipped) / stages.length) * 100}%` }}
  transition={{ duration: 0.3, ease: 'easeOut' }}  // inline — short interactions don't need token
/>
```

### Stage 3 — Conflict display

When `cross-resource` stage fails, `ConflictList` [patterns] renders the conflicts:

```tsx
import { ConflictList, ConflictCard } from '@nasnet/ui/patterns'; // [patterns]
import type { ResourceConflict }       from '@nasnet/ui/patterns'; // [patterns]

// Feature-layer conflict display
<ConflictList
  conflicts={validationResult.conflicts}
  onResolve={(conflict, resolution) => applyResolution(conflict, resolution)}
/>
```

`ConflictCard` [patterns] is built on `Card` [primitives] and uses `StatusBadge` [patterns] to
show severity (`warning` / `error`).

### Stage 4 — Apply button with loading state

```tsx
import { Button } from '@nasnet/ui/primitives';   // [primitives]

<Button
  variant="default"
  isLoading={isApplying}
  loadingText="Applying..."
  disabled={!isValid || isApplying}
  onClick={handleApply}
>
  Apply Configuration
</Button>
```

`Button` [primitives] sets `aria-busy="true"` and renders a `Spinner` [primitives] during the
loading state.

### Complete data flow

```
useValidationProgress()           [patterns] — stage state machine
  ↓ startStage('schema')
ValidationProgress                [patterns] — renders 7 ValidationStage rows
  └── motion.div progress bar     Framer Motion + bg-primary token (Tier 2)
  └── ValidationStage × 7         [patterns] — expandable rows with error lists
      └── StatusIndicator         [patterns] — status dot per stage
ConflictList                      [patterns] — shown when cross-resource fails
  └── ConflictCard × N            [patterns] — each conflict
      └── Card                    [primitives]
      └── StatusBadge             [patterns]
Button "Apply"                    [primitives]
  └── isLoading → Spinner         [primitives]
      aria-busy="true"
```

**Packages involved:** `patterns`, `primitives`, `tokens` (Framer Motion transition values).

**See also:** [patterns-forms-and-inputs.md](./patterns-forms-and-inputs.md) for
`ValidationProgress` props, [patterns-status-and-data.md](./patterns-status-and-data.md) for
`StatusBadge` and `StatusIndicator`.

---

## Flow 3: Sortable Firewall Rules

**Entry point:** `FirewallRuleList` [patterns] is rendered in the firewall page.
**End state:** User drags a rule to a new position (or uses keyboard/mobile buttons); the new order
is persisted, an animated reorder plays, and screen readers hear an announcement.

### Stage 1 — Entry component delegates to platform presenter

```tsx
// libs/ui/patterns/src/sortable/domain/FirewallRuleList.tsx
import { usePlatform }        from '@nasnet/ui/layouts';   // [layouts]
import { cn, Badge }          from '@nasnet/ui/primitives'; // [primitives]
import { SortableListDesktop } from '../components/SortableListDesktop';
import { SortableListMobile }  from '../components/SortableListMobile';
import type { FirewallRule, SortableItemData, ReorderEvent } from '../types';

export const FirewallRuleList: React.FC<FirewallRuleListProps> = ({
  rules, onReorder, onDelete, onEdit,
}) => {
  const platform = usePlatform?.() ?? 'desktop'; // [layouts]

  if (platform === 'desktop') {
    return (
      <SortableListDesktop<FirewallRule>   // drag-and-drop variant
        items={rules}
        onReorder={onReorder}
        renderItem={renderItem}
        showContextMenu={true}
        showRowNumbers={true}
        multiSelect={true}
        aria-label="Firewall rules list"
      />
    );
  }

  return (
    <SortableListMobile<FirewallRule>      // up/down button variant (no drag)
      items={rules}
      onReorder={onReorder}
      renderItem={renderItem}
      onMoveItem={handleMoveItem}
      showMoveButtons={true}
      aria-label="Firewall rules list"
    />
  );
};
```

### Stage 2 — SortableList wraps dnd-kit

`SortableList` [patterns] (the generic component used by `SortableListDesktop`) wires dnd-kit:

```tsx
// libs/ui/patterns/src/sortable/components/SortableList.tsx
import {
  DndContext, DragOverlay, closestCenter,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis }  from '@dnd-kit/modifiers';
import {
  SortableContext as DndSortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { cn }   from '@nasnet/ui/primitives';  // [primitives]
import { useSortableList } from '../hooks/useSortableList';

function SortableListComponent<T extends SortableItemData>({
  items: externalItems,
  onReorder,
  renderItem,
  collisionStrategy = 'closestCenter',
  multiSelect = false,
}: SortableListProps<T>) {

  const sortable = useSortableList(externalItems, {
    onReorder,
    collisionStrategy,
    multiSelect,
    undoEnabled: true,   // undo/redo stack built in
  });

  const sensors = useSortableSensors({
    touchEnabled: true,
    keyboardEnabled: true,  // keyboard arrow keys for a11y
  });

  return (
    <SortableContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={getCollisionDetection(collisionStrategy)}
        onDragStart={_handlers.onDragStart}
        onDragEnd={_handlers.onDragEnd}
        modifiers={[restrictToVerticalAxis]}
        accessibility={{ announcements }}         // screen reader announcements
      >
        <DndSortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <LayoutGroup>
            <motion.div className={cn('flex flex-col gap-2')}>
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <SortableItem key={item.id} id={item.id}>
                    {renderItem(item, createRenderOptions(item, index))}
                  </SortableItem>
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        </DndSortableContext>

        <DragOverlay>
          {activeId && activeItem && (
            <motion.div
              initial={dragOverlayAnimation.initial}
              animate={dragOverlayAnimation.dragging}
            >
              {renderItem(activeItem, createRenderOptions(activeItem, ...))}
            </motion.div>
          )}
        </DragOverlay>
      </DndContext>
    </SortableContext.Provider>
  );
}
```

### Stage 3 — useSortableList manages order state

```tsx
// libs/ui/patterns/src/sortable/hooks/useSortableList.ts
// Key parts of the return type (from types.ts):
export interface UseSortableListReturn<T extends SortableItemData> {
  items: T[];
  activeId: UniqueIdentifier | null;
  isDragging: boolean;
  selectedIds: Set<UniqueIdentifier>;
  // Multi-select helpers
  isSelected: (id: UniqueIdentifier) => boolean;
  toggleSelection: (id: UniqueIdentifier) => void;
  selectRange: (fromId: UniqueIdentifier, toId: UniqueIdentifier) => void;
  selectAll: () => void;
  clearSelection: () => void;
  // Keyboard movement (used by mobile and keyboard a11y)
  moveUp: (id: UniqueIdentifier) => void;
  moveDown: (id: UniqueIdentifier) => void;
  moveToTop: (id: UniqueIdentifier) => void;
  moveToBottom: (id: UniqueIdentifier) => void;
  // Undo/redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}
```

### Stage 4 — Animation via tokens

Reorder animation uses token-backed Framer Motion variants from `presets.ts` [patterns]:

```tsx
// libs/ui/patterns/src/motion/presets.ts
import { transitions } from '@nasnet/ui/tokens'; // [tokens]

export const listItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: moveTransition,  // transitions.move from [tokens]
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: exitTransition,  // transitions.exit from [tokens]
  },
};
```

`AnimatePresence mode="popLayout"` in `SortableList` triggers `listItem.exit` on removed items and
`listItem.animate` on new/moved items, creating the smooth reorder animation.

### Stage 5 — Accessibility announcements

`SortableList` passes a `defaultAnnouncements` object to `DndContext.accessibility.announcements`.
Screen readers hear, for example: _"Picked up Drop rule 3 in position 1 of 12. Rule is now in
position 3 of 12. Dropped rule 3."_

### Complete component tree

```
<FirewallRuleList>                    [patterns] — domain component
  └── usePlatform()                   [layouts]
  └── desktop → <SortableListDesktop> [patterns]
      └── <SortableList>              [patterns]
          └── useSortableList()       [patterns] — order state + undo/redo
          └── useSortableSensors()    [patterns] — mouse/touch/keyboard sensors
          └── <DndContext>            @dnd-kit/core
              └── <DndSortableContext>
                  └── <LayoutGroup>  framer-motion
                      └── <AnimatePresence mode="popLayout">
                          └── <SortableItem> × N   [patterns]
                              └── <DragHandle>     [patterns]
                              └── renderItem(rule) → <FirewallRuleItem>
                                  └── <Badge>      [primitives]
          └── <DragOverlay>          @dnd-kit/core — preview while dragging
  └── mobile → <SortableListMobile>  [patterns]
      └── Up/Down buttons            [primitives] Button
      └── useSortableList.moveUp/Down [patterns]
```

**Packages involved:** `patterns`, `primitives`, `layouts` (via `usePlatform`), `tokens`
(animation values).

**See also:** [shared-hooks.md](./shared-hooks.md) for `useSortableList` return type,
[tokens-and-animation.md](./tokens-and-animation.md) for animation token values.

---

## Flow 4: Token Build Pipeline

**Entry point:** Developer defines a new token in `libs/ui/tokens/src/tokens.json`.
**End state:** A Tailwind utility class `bg-primary` on a component renders as `#EFC729` (Golden
Amber) in light mode and a different value in dark mode.

### Stage 1 — Source definition in tokens.json

```json
// libs/ui/tokens/src/tokens.json (excerpt — showing the primary chain)
{
  "primitive": {
    "color": {
      "brand": {
        "amber": {
          "500": { "$value": "#EFC729" }
        }
      }
    }
  },
  "semantic": {
    "color": {
      "primary": {
        "DEFAULT": "{primitive.color.brand.amber.500}",
        "hover":   "{primitive.color.brand.amber.600}",
        "active":  "{primitive.color.brand.amber.700}",
        "foreground": "{primitive.color.neutral.slate.900}"
      }
    }
  }
}
```

The `{...}` syntax is a design token reference resolved by the build script.

### Stage 2 — build.js generates CSS variables

`libs/ui/tokens/build.js` runs as a Node.js script:

```js
// libs/ui/tokens/build.js (relevant excerpt)
const SOURCE_PATH = resolve(__dirname, 'src/tokens.json');

async function buildTokens() {
  const tokens = JSON.parse(readFileSync(SOURCE_PATH, 'utf-8'));

  // 1. Resolve token references ({primitive.x.y} → actual values)
  const resolveReferences = (obj, root = tokens) => {
    // Walks the tree; when it sees a "{...}" string it dereferences into root
    // ...
  };

  const lightTokens = {
    ...resolveReferences(tokens.primitive, tokens),
    semantic:  resolveReferences(tokens.semantic, tokens),
    component: resolveReferences(tokens.component, tokens),
  };

  // 2. Merge dark overrides
  const darkOverrides = resolveReferences(tokens.dark, tokens);
  const darkTokens = {
    ...lightTokens,
    semantic: { ...lightTokens.semantic, color: { ...lightTokens.semantic?.color, ...darkOverrides.semantic?.color } },
  };

  // 3. Emit dist/variables.css with :root { --color-primary: #EFC729; }
  //    and .dark { --color-primary: <dark value>; }
}
```

Output file `dist/variables.css` contains:

```css
:root {
  --color-primary: #EFC729;
  --color-primary-hover: #d4aa1a;
  --color-primary-foreground: #0f172a;
  /* ... ~200 more variables */
}

.dark {
  --color-primary: #EFC729;   /* same in this case — amber stays amber in dark mode */
  --color-primary-foreground: #f8fafc;
  /* ... dark overrides */
}
```

### Stage 3 — TypeScript exports (animation tokens)

`libs/ui/tokens/src/animation.ts` exports the TypeScript-side of the token system:

```ts
// libs/ui/tokens/src/animation.ts
export const durations = { fast: 100, normal: 200, slow: 300, slower: 500 } as const;
export const transitions = {
  enter:     { duration: durations.normal / 1000, ease: easings.enter } as Transition,
  pageEnter: { duration: durations.slow   / 1000, ease: easings.enter } as Transition,
  // ...
} as const;
```

These are consumed by `presets.ts` [patterns]:

```ts
// libs/ui/patterns/src/motion/presets.ts
import { transitions } from '@nasnet/ui/tokens'; // [tokens]
export const enterTransition: Transition = transitions.enter; // 200ms ease-out
```

### Stage 4 — CSS variable loaded at app entry

```tsx
// apps/connect/src/main.tsx
import '@nasnet/ui/tokens/variables.css'; // [tokens] — loads :root { --color-primary: ... }
```

### Stage 5 — Tailwind maps CSS variables to utility classes

The Tailwind config references the CSS variables:

```js
// Tailwind config (generated or hand-written extension)
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: 'var(--color-primary)',
        hover:   'var(--color-primary-hover)',
        foreground: 'var(--color-primary-foreground)',
      },
      // ...
    },
  },
},
```

### Stage 6 — Component uses semantic token

```tsx
// Any component
import { Button } from '@nasnet/ui/primitives'; // [primitives]

<Button variant="default">Apply</Button>

// Button renders with class: bg-primary
// Tailwind expands: bg-primary → background-color: var(--color-primary)
// Browser resolves: var(--color-primary) → #EFC729
// Dark mode (.dark ancestor): var(--color-primary) → dark override value
```

### Complete chain for one token (primary color)

```
tokens.json                  [tokens] "semantic.color.primary.DEFAULT"
  → resolves to → "#EFC729"  via {primitive.color.brand.amber.500}
  ↓ build.js                 [tokens] generates CSS variable
dist/variables.css            [tokens] :root { --color-primary: #EFC729 }
  ↓ main.tsx import
Browser CSS cascade           resolved to #EFC729 in light mode
  ↓ Tailwind utility
bg-primary                   → background-color: var(--color-primary)
  ↓ Button component         [primitives] className="bg-primary"
  ↓ Browser paint            Golden Amber #EFC729
```

**Packages involved:** `tokens` (source, build, CSS output, TypeScript exports), `primitives`
(consumes CSS vars), `patterns` (consumes TypeScript animation tokens).

**See also:** [tokens-and-animation.md](./tokens-and-animation.md) for the full three-tier
token reference.

---

## Flow 5: Animation Pipeline

**Entry point:** User navigates to a new route; `PageTransition` wraps the route content.
**End state:** The old page fades out (225 ms ease-in), the new page fades in (300 ms ease-out),
reduced-motion users see an instant swap.

### Stage 1 — Token values set the timing budget

```ts
// libs/ui/tokens/src/animation.ts  [tokens]
export const durations = { slow: 300 } as const;
export const easings   = {
  enter: [0, 0, 0.2, 1] as const,  // ease-out: fast start, slow end
  exit:  [0.4, 0, 1, 1] as const,  // ease-in: slow start, fast end
} as const;

export const transitions = {
  pageEnter: { duration: 300 / 1000, ease: easings.enter } as Transition, // 300ms ease-out
  pageExit:  { duration: 225 / 1000, ease: easings.exit  } as Transition, // 225ms ease-in
} as const;
```

Mobile animations run 25% faster via `getAnimationTokens`:

```ts
export function getAnimationTokens(platform: Platform): AnimationTokens {
  const mobileFactor = platform === 'mobile' ? 0.75 : 1;
  return {
    pageTransition: {
      enter: durations.slow * mobileFactor,   // desktop: 300ms, mobile: 225ms
      exit:  durations.slow * mobileFactor * 0.75, // desktop: 225ms, mobile: 169ms
    },
    // ...
  };
}
```

### Stage 2 — Presets wire tokens to Framer Motion variants

```ts
// libs/ui/patterns/src/motion/presets.ts  [patterns]
import { transitions } from '@nasnet/ui/tokens';  // [tokens]

export const pageFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1,  transition: transitions.pageEnter },  // 300ms ease-out
  exit:    { opacity: 0,  transition: transitions.pageExit  },  // 225ms ease-in
};

export const pageSlideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: transitions.pageEnter },
  exit:    { opacity: 0, y: -20, transition: transitions.pageExit },
};
```

### Stage 3 — AnimationProvider supplies context

```tsx
// libs/ui/patterns/src/motion/AnimationProvider.tsx  [patterns]
// Wraps the app to provide animation context and MotionConfig
export function AnimationProvider({ children }: AnimationProviderProps) {
  return (
    <AnimationContext.Provider value={contextValue}>
      <MotionConfig reducedMotion="user"> {/* respects OS preference */}
        {children}
      </MotionConfig>
    </AnimationContext.Provider>
  );
}
```

`MotionConfig reducedMotion="user"` instructs Framer Motion to honour the OS
`prefers-reduced-motion` setting globally. Every animation inside the provider is automatically
disabled for users with that preference enabled.

### Stage 4 — PageTransition wraps route content

```tsx
// apps/connect/src/routes/__root.tsx (or per-route wrapper)
import {
  PageTransition,
  AnimatePresence,
  pageFade,
} from '@nasnet/ui/patterns';          // [patterns] — motion re-exports

// In the router outlet:
<AnimatePresence mode="wait">
  <PageTransition key={location.pathname} variant="fade">
    <Outlet />
  </PageTransition>
</AnimatePresence>
```

`PageTransition` [patterns] selects a variant (`pageFade` or `pageSlideUp`) from the
`presets.ts` [patterns] catalog and applies `usePageTransition` hook logic:

```tsx
// libs/ui/patterns/src/motion/PageTransition.tsx [patterns]
import { motion, AnimatePresence }  from 'framer-motion';
import { pageFade, pageSlideUp }   from './presets';   // [patterns]
import { useAnimation }             from './AnimationProvider';

export function PageTransition({ children, variant = 'fade', key }: PageTransitionProps) {
  const { prefersReducedMotion } = useAnimation(); // [patterns]
  const variants = prefersReducedMotion
    ? reducedMotionFade   // [patterns] — opacity only, 100ms
    : variant === 'slide' ? pageSlideUp : pageFade;  // [patterns]

  return (
    <motion.div
      key={key}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
```

### Stage 5 — useReducedMotion provides accessibility opt-out

```ts
// libs/ui/layouts/src/responsive-shell/useReducedMotion.ts  [layouts]
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  // subscribes to media query changes
  return prefersReduced;
}
```

Components can also call `getReducedMotionTransition` [tokens] for one-off cases:

```ts
import { getReducedMotionTransition, transitions } from '@nasnet/ui/tokens'; // [tokens]
const t = getReducedMotionTransition(transitions.pageEnter, prefersReducedMotion);
// returns transitions.instant (duration: 0) if reducedMotion === true
```

### Complete animation chain

```
tokens.json                      [tokens] durations.slow = 300
  ↓ animation.ts
transitions.pageEnter            [tokens] { duration: 0.3, ease: [0,0,0.2,1] }
  ↓ presets.ts
pageFade.animate.transition      [patterns] references transitions.pageEnter
  ↓ PageTransition
motion.div variants={pageFade}   [patterns] Framer Motion applies keyframes
  ↓ AnimationProvider
MotionConfig reducedMotion="user" [patterns] globally disables if OS setting
  ↓ useReducedMotion
boolean                          [layouts] reads prefers-reduced-motion media query
  ↓ getReducedMotionTransition
transitions.instant (duration:0) [tokens] instant swap for a11y
```

**Packages involved:** `tokens` (durations, easings, transitions, utility functions), `patterns`
(presets, AnimationProvider, PageTransition), `layouts` (useReducedMotion).

**See also:** [tokens-and-animation.md](./tokens-and-animation.md) for complete animation token
reference, [primitives-reference.md](./primitives-reference.md) for `useReducedMotion` hook.

---

## Flow 6: CategoryAccent Contextual Theming

**Entry point:** A feature page wraps its content in `CategoryAccentProvider` [primitives].
**End state:** Every component inside that subtree picks up an orange (`#F97316`) accent for the
firewall category without any explicit color prop being passed.

### Stage 1 — Provider injects context

```tsx
// A feature page — libs/features/firewall/src/pages/FirewallPage.tsx
import {
  CategoryAccentProvider,
  type Category,
} from '@nasnet/ui/primitives';                  // [primitives]

export function FirewallPage() {
  return (
    <CategoryAccentProvider defaultCategory="firewall">
      {/* All children inherit orange accent */}
      <FirewallDashboard />
    </CategoryAccentProvider>
  );
}
```

Inside `CategoryAccentProvider` [primitives]:

```tsx
// libs/ui/primitives/src/category-accent/category-accent-provider.tsx
export function CategoryAccentProvider({ children, defaultCategory }: CategoryAccentProviderProps) {
  const [category, setCategory] = useState<Category | null>(defaultCategory ?? null);

  const meta = useMemo(() => category ? CATEGORY_META[category] : null, [category]);

  return (
    <CategoryAccentContext.Provider value={{ category, meta, setCategory, getCategoryMeta, categories: CATEGORIES }}>
      {children}
    </CategoryAccentContext.Provider>
  );
}
```

`CATEGORY_META` contains the CSS class names and CSS variable names for each of the 14 categories:

```ts
// libs/ui/primitives/src/category-accent/category-accent-provider.tsx
export const CATEGORY_META: Record<Category, CategoryMeta> = {
  firewall: {
    id: 'firewall',
    label: 'Firewall',
    cssVar: '--semantic-color-category-firewall',  // maps to #F97316 (orange)
    bgClass: 'bg-category-firewall',
    textClass: 'text-category-firewall',
    borderClass: 'border-category-firewall',
  },
  // ... 13 more categories
};
```

### Stage 2 — Child component reads the accent

```tsx
// libs/features/firewall/src/components/FirewallStatusHero.tsx
import {
  useCategoryAccent,
  CategoryAccentProvider,
} from '@nasnet/ui/primitives';               // [primitives]
import { cn } from '@nasnet/ui/primitives';   // [primitives]
import { Card } from '@nasnet/ui/primitives'; // [primitives]

export function FirewallStatusHero() {
  const { meta } = useCategoryAccent();       // [primitives] — throws if no provider above

  return (
    <Card className={cn(
      'border-l-4',
      meta?.borderClass   // 'border-category-firewall' → CSS var → #F97316
    )}>
      <h2 className={cn(meta?.textClass)}>    // 'text-category-firewall'
        Firewall
      </h2>
    </Card>
  );
}
```

### Stage 3 — CSS variables resolve the actual color

The CSS variable `--semantic-color-category-firewall` is defined in `dist/variables.css` [tokens]
(generated by `build.js` from `tokens.json`):

```css
:root {
  --semantic-color-category-firewall: #F97316;  /* orange */
}
```

Tailwind class `bg-category-firewall` expands to:

```css
.bg-category-firewall {
  background-color: var(--semantic-color-category-firewall);
}
```

### Stage 4 — Dynamic category switching

The `setCategory` function from context allows dynamic switching (for example, if a page hosts
multiple category sections):

```tsx
function MultiCategoryPage() {
  return (
    <CategoryAccentProvider defaultCategory="firewall">
      <FirewallSection />    {/* orange */}
      <CategorySwitcher to="vpn">
        <VPNSection />       {/* green after switch */}
      </CategorySwitcher>
    </CategoryAccentProvider>
  );
}

function CategorySwitcher({ to, children }: { to: Category; children: ReactNode }) {
  const { setCategory } = useCategoryAccent();  // [primitives]
  useEffect(() => { setCategory(to); }, [to]);
  return <>{children}</>;
}
```

### Complete accent chain

```
CategoryAccentProvider               [primitives] — React context with category + CATEGORY_META
  ↓ useCategoryAccent()              [primitives] — reads context
  ↓ meta.bgClass = 'bg-category-firewall'
  ↓ Tailwind
bg-category-firewall                 → background-color: var(--semantic-color-category-firewall)
  ↓ CSS variable
dist/variables.css                   [tokens] --semantic-color-category-firewall: #F97316
  ↓ Browser paint
Orange accent color                  visible in sidebar icon, border, text, badge
```

**Packages involved:** `primitives` (provider, hook, CATEGORY_META), `tokens` (CSS variables for
category colors).

**See also:** [primitives-reference.md](./primitives-reference.md) for
`CategoryAccentProvider` props, [tokens-and-animation.md](./tokens-and-animation.md) for the
14 category color values.

---

## Flow 7: Help System with Simple/Technical Mode

**Entry point:** `FieldHelp` [patterns] is placed next to a form label.
**End state:** On desktop a popover opens showing context-sensitive help in simple or technical
language. On mobile a bottom sheet opens instead. Switching the global mode toggle updates all
`FieldHelp` instances simultaneously.

### Stage 1 — Global mode state lives in Zustand

```ts
// libs/state/stores — useHelpModeStore (Zustand)
// HelpMode = 'simple' | 'technical'
// Persisted in localStorage so preference survives refresh
```

### Stage 2 — useHelpMode wraps the store for pattern components

```ts
// libs/ui/patterns/src/help/use-help-mode.ts  [patterns]
import { useHelpModeStore, type HelpMode } from '@nasnet/state/stores'; // [state]

export function useHelpMode(): UseHelpModeReturn {
  const mode       = useHelpModeStore((state) => state.mode);
  const toggleMode = useHelpModeStore((state) => state.toggleMode);
  const setMode    = useHelpModeStore((state) => state.setMode);

  return {
    mode,
    toggleMode,
    setMode,
    isSimple:    mode === 'simple',
    isTechnical: mode === 'technical',
  };
}
```

### Stage 3 — useFieldHelp loads i18n content

```ts
// libs/ui/patterns/src/help/use-field-help.ts  [patterns]
import { useTranslation }  from '@nasnet/core/i18n';
import { useHelpMode }     from './use-help-mode';  // [patterns]

export function useFieldHelp(config: FieldHelpConfig): UseFieldHelpReturn {
  const { field, mode: propMode } = config;
  const { t, ready }             = useTranslation('network');
  const { mode: globalMode, toggleMode } = useHelpMode();  // [patterns]

  const mode: HelpMode = propMode ?? globalMode;  // prop overrides global

  // Load content from i18n namespace 'network'
  // Key structure: help.<field>.title.<mode>, help.<field>.description.<mode>
  const content = useMemo<HelpContent>(() => {
    if (!ready) return DEFAULT_HELP_CONTENT;

    return {
      title: t(`help.${field}.title.${mode}`, {
        defaultValue: t(`help.${field}.title.simple`, { defaultValue: field }),
      }),
      description: t(`help.${field}.description.${mode}`, {
        defaultValue: t(`help.${field}.description.simple`, { defaultValue: '' }),
      }),
      examples: t(`help.${field}.examples`, { returnObjects: true, defaultValue: [] }),
      link:     t(`help.${field}.link`, { defaultValue: '' }),
    };
  }, [t, field, mode, ready]);

  const ariaLabel = useMemo(() => `Help for ${content.title || field} field`, [content.title, field]);
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { content, isOpen, setIsOpen, toggle, mode, toggleMode, ariaLabel, isReady: ready };
}
```

### Stage 4 — FieldHelp selects presenter

```tsx
// libs/ui/patterns/src/help/field-help.tsx  [patterns]
import { usePlatform }     from '@nasnet/ui/layouts';  // [layouts]
import { FieldHelpDesktop } from './field-help-desktop';
import { FieldHelpMobile }  from './field-help-mobile';
import { useFieldHelp }     from './use-field-help';   // [patterns]

export const FieldHelp = React.memo(function FieldHelp({ field, mode, placement }: FieldHelpProps) {
  const platform  = usePlatform();                     // [layouts]
  const helpState = useFieldHelp({ field, mode, placement }); // [patterns]

  if (platform === 'mobile') {
    return <FieldHelpMobile  field={field} helpState={helpState} />; // bottom sheet
  }
  return <FieldHelpDesktop   field={field} helpState={helpState} />; // popover
});
```

### Stage 5 — Platform presenters render different UI

**Desktop presenter** uses `Popover` [primitives]:

```tsx
// libs/ui/patterns/src/help/field-help-desktop.tsx  [patterns]
import { Popover, PopoverTrigger, PopoverContent } from '@nasnet/ui/primitives'; // [primitives]
import { HelpIcon }   from './help-icon';   // [patterns]
import { HelpPopover } from './help-popover'; // [patterns]

export function FieldHelpDesktop({ field, helpState }: FieldHelpDesktopProps) {
  const { content, isOpen, setIsOpen, ariaLabel } = helpState;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <HelpIcon field={field} aria-label={ariaLabel} onClick={helpState.toggle} />
      </PopoverTrigger>
      <PopoverContent side="right" className="w-72 p-4">
        <h4 className="font-medium text-sm">{content.title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{content.description}</p>
        {content.examples?.length > 0 && (
          <ul className="mt-2 space-y-1">
            {content.examples.map((ex) => (
              <li key={ex} className="font-mono text-xs">{ex}</li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
```

**Mobile presenter** uses `BottomSheet` [patterns]:

```tsx
// libs/ui/patterns/src/help/field-help-mobile.tsx  [patterns]
import { BottomSheet, BottomSheetContent, BottomSheetHeader } from '@nasnet/ui/patterns'; // [patterns]
import { HelpIcon } from './help-icon';

export function FieldHelpMobile({ field, helpState }: FieldHelpMobileProps) {
  const { content, isOpen, setIsOpen, toggle, ariaLabel } = helpState;

  return (
    <>
      <HelpIcon field={field} aria-label={ariaLabel} onClick={toggle} />
      <BottomSheet open={isOpen} onOpenChange={setIsOpen}>
        <BottomSheetHeader>
          <h3 className="font-semibold">{content.title}</h3>
        </BottomSheetHeader>
        <BottomSheetContent>
          <p className="text-sm text-muted-foreground">{content.description}</p>
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
}
```

### Stage 6 — HelpModeToggle is placed in app header

```tsx
// libs/ui/patterns/src/help/help-mode-toggle.tsx  [patterns]
import { useHelpMode } from './use-help-mode';  // [patterns]
import { Button }      from '@nasnet/ui/primitives'; // [primitives]

export function HelpModeToggle() {
  const { isSimple, toggleMode } = useHelpMode(); // [patterns]

  return (
    <Button variant="ghost" size="sm" onClick={toggleMode}>
      {isSimple ? 'Switch to Technical' : 'Switch to Simple'}
    </Button>
  );
}
```

Clicking the toggle updates `useHelpModeStore` [state]. All mounted `FieldHelp` instances that
derive from `useHelpMode` re-render immediately because they subscribe to the same Zustand store.

### Complete data flow

```
HelpModeToggle                  [patterns]
  └── useHelpMode()              [patterns]
      └── useHelpModeStore()     [state] — Zustand (persisted)
  └── toggleMode() →             [state] updates 'simple' | 'technical'

FieldHelp                        [patterns]
  └── usePlatform()              [layouts]
  └── useFieldHelp()             [patterns]
      └── useHelpMode()          [patterns] → reads global mode
      └── useTranslation()       i18n → loads help.<field>.description.<mode>
  └── mobile → FieldHelpMobile   [patterns]
      └── HelpIcon               [patterns]
      └── BottomSheet            [patterns] — gesture-driven mobile sheet
  └── desktop → FieldHelpDesktop [patterns]
      └── HelpIcon               [patterns]
      └── Popover                [primitives] — hover/click popover
          └── PopoverContent     [primitives]
```

**Packages involved:** `patterns` (FieldHelp, useFieldHelp, useHelpMode, presenters,
BottomSheet, HelpModeToggle), `primitives` (Popover), `layouts` (usePlatform), `state/stores`
(useHelpModeStore).

**See also:** [patterns-domain-components.md](./patterns-domain-components.md) for
`BottomSheet` API, [patterns-forms-and-inputs.md](./patterns-forms-and-inputs.md) for
integrating `FieldHelp` next to `RHFFormField`.

---

## Flow 8: Clipboard Pipeline

**Entry point:** User selects rows in a data table and clicks "Copy as CSV".
**End state:** CSV data is in the system clipboard. User pastes it into a text area elsewhere.
`usePasteImport` parses and validates the content, making the parsed items available for preview.

### Stage 1 — useClipboard provides the primitive copy operation

```ts
// libs/ui/patterns/src/hooks/useClipboard.ts  [patterns]
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { timeout = 2000, onSuccess, onError } = options;
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const copy = useCallback(async (value: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);  // Modern Clipboard API
      } else {
        fallbackCopyText(value);  // execCommand fallback for older browsers
      }
      setCopied(true);
      setTimeout(() => setCopied(false), timeout); // auto-reset after 2s
      onSuccess?.(value);
      return true;
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error('Copy failed'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [timeout, onSuccess, onError]);

  return { copy, copied, error, reset, isLoading };
}
```

### Stage 2 — useBulkCopy wraps useClipboard with format selection

```ts
// libs/ui/patterns/src/hooks/useBulkCopy.ts  [patterns]
import { useClipboard, CLIPBOARD_TIMEOUT_MS } from './useClipboard'; // [patterns]

export type ExportFormat = 'csv' | 'json' | 'text';

export function useBulkCopy(options: UseBulkCopyOptions = {}): UseBulkCopyReturn {
  const { defaultFormat = 'csv', csvDelimiter = ',', includeHeader = true } = options;
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);
  const { copy, copied, error, reset: resetClipboard, isLoading } = useClipboard();

  const copyItems = useCallback(async <T extends Record<string, unknown>>(
    items: T[],
    columns?: (keyof T)[]
  ): Promise<boolean> => {
    const cols = columns ?? Object.keys(items[0]) as (keyof T)[];
    let content: string;

    switch (format) {
      case 'csv':  content = toCSV(items, cols, csvDelimiter, includeHeader); break;
      case 'json': content = JSON.stringify(items, null, 2); break;
      case 'text': content = items.map(item => cols.map(c => String(item[c] ?? '')).join('\t')).join('\n'); break;
    }

    return copy(content);  // delegates to useClipboard [patterns]
  }, [format, csvDelimiter, includeHeader, copy]);

  return { copyItems, format, setFormat, copied, copiedCount, error, reset, isLoading, supportedFormats: SUPPORTED_FORMATS };
}
```

### Stage 3 — Feature-layer usage with CopyButton

```tsx
// libs/features/firewall/src/components/AddressListView.tsx  [features/firewall]
import { useBulkCopy, type ExportFormat } from '@nasnet/ui/patterns'; // [patterns]
import { Button, Select, SelectItem }     from '@nasnet/ui/primitives'; // [primitives]
import { Check, Copy }                    from 'lucide-react';

export function AddressListBulkActions({ selectedRows }: { selectedRows: AddressListEntry[] }) {
  const { copyItems, format, setFormat, copied, isLoading } = useBulkCopy({
    defaultFormat: 'csv',
    onSuccess: (count, fmt) => console.log(`Copied ${count} rows as ${fmt}`),
  });

  const handleCopy = () => copyItems(selectedRows, ['address', 'comment', 'disabled']);

  return (
    <div className="flex items-center gap-2">
      <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
        <SelectItem value="csv">CSV</SelectItem>
        <SelectItem value="json">JSON</SelectItem>
        <SelectItem value="text">Plain Text</SelectItem>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        isLoading={isLoading}
        aria-label="Copy selected rows to clipboard"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied!' : 'Copy'}
      </Button>
    </div>
  );
}
```

### Stage 4 — usePasteImport handles the receiving end

```tsx
// libs/features/firewall/src/components/AddressListImportDialog.tsx  [features/firewall]
import { usePasteImport, type ParseResult } from '@nasnet/ui/patterns'; // [patterns]
import { Textarea }                          from '@nasnet/ui/primitives'; // [primitives]

export function AddressListImportDialog() {
  const [preview, setPreview] = useState<ParseResult | null>(null);

  const { handlePaste, parseResult, clearResult, isParsing } = usePasteImport({
    type: 'auto',    // auto-detect: 'ip-list' | 'csv' | 'routeros'
    maxItems: 1000,
    onParsed: (result) => setPreview(result),
    onError:  (err)    => console.error('Parse error:', err),
  });

  return (
    <div>
      <Textarea
        placeholder="Paste IP addresses, CSV data, or RouterOS commands..."
        onPaste={handlePaste}   // fires usePasteImport.handlePaste
      />

      {preview && (
        <div>
          <p>{preview.items.length} valid items, {preview.errors.length} errors</p>
          {preview.errors.map((err) => (
            <p key={err.line} className="text-destructive text-xs">
              Line {err.line}: {err.message}
            </p>
          ))}
          <Button onClick={() => { importItems(preview.items); clearResult(); }}>
            Import {preview.items.length} items
          </Button>
        </div>
      )}
    </div>
  );
}
```

### Stage 5 — usePasteImport auto-detects format

```ts
// libs/ui/patterns/src/hooks/usePasteImport.ts  [patterns]
export type ImportType = 'ip-list' | 'csv' | 'routeros' | 'auto';

function detectImportType(content: string): ImportType {
  const firstLine = content.trim().split('\n')[0] ?? '';

  if (firstLine.startsWith('/') || firstLine.includes('add chain=')) return 'routeros';
  if (firstLine.includes(',') || firstLine.includes('\t'))            return 'csv';

  const allIPs = content.split('\n').filter(l => l.trim()).every(l => isValidIP(l.trim()));
  if (allIPs) return 'ip-list';

  return 'auto';
}
```

The `parseContent` function returns a `ParseResult` with `items`, `errors`, `type`, and
`rawContent`, enabling the preview UI to show valid entries and highlight problematic lines.

### Complete clipboard pipeline

```
User selects rows
  ↓
AddressListBulkActions            [features/firewall]
  └── useBulkCopy()               [patterns]
      └── setFormat('csv')        user selects CSV
      └── copyItems(rows, cols)
          └── toCSV(rows, ...)    serialise to "address,comment\n192.168.1.1,..."
          └── useClipboard.copy() [patterns]
              └── navigator.clipboard.writeText(csv)  // Modern Clipboard API
              └── setCopied(true) → Button shows "Copied!" for 2000ms
              └── setTimeout → setCopied(false)

User pastes in AddressListImportDialog
  ↓
<Textarea onPaste={handlePaste}>  [primitives]
  └── usePasteImport.handlePaste  [patterns]
      └── event.clipboardData.getData('text')
      └── detectImportType()      → 'csv'
      └── parseCSV()              → { success: true, items: [...], errors: [] }
      └── setParseResult(result)
      └── onParsed(result)        → setPreview(result)
  ↓
Preview UI renders items + error list
  ↓
User clicks Import
  └── importItems(items)          → GraphQL mutation
  └── clearResult()               → setParseResult(null)
```

**Packages involved:** `patterns` (useClipboard, useBulkCopy, usePasteImport), `primitives`
(Button, Select, Textarea).

**See also:** [shared-hooks.md](./shared-hooks.md#clipboard-hooks) for the complete hook
signatures, [primitives-reference.md](./primitives-reference.md) for `Button` loading state
and `Select` props.

---

## Summary Table

| # | Flow | Packages Involved | Key Components | Key Hooks | Doc References |
|---|------|-------------------|----------------|-----------|----------------|
| 1 | Responsive Page | `layouts`, `patterns`, `primitives`, `state/stores` | `ResponsiveShell`, `MobileAppShell`, `AppShell`, `BottomNavigation` | `usePlatform`, `useSidebarStore` | [03](./layouts-and-platform.md), [08](./shared-hooks.md) |
| 2 | Config Apply Pipeline | `patterns`, `primitives`, `tokens` | `ValidationProgress`, `ValidationStage`, `ConflictList`, `ConflictCard`, `Button` | `useValidationProgress` | [06](./patterns-forms-and-inputs.md), [05](./patterns-status-and-data.md) |
| 3 | Sortable Firewall Rules | `patterns`, `primitives`, `layouts`, `tokens` | `FirewallRuleList`, `SortableList`, `SortableItem`, `DragHandle`, `AnimatedList` | `useSortableList`, `useMultiSelect`, `usePlatform` | [07](./patterns-domain-components.md), [04](./tokens-and-animation.md) |
| 4 | Token Build Pipeline | `tokens`, `primitives`, `patterns` | `Button` (consumer) | — (build-time) | [04](./tokens-and-animation.md) |
| 5 | Animation Pipeline | `tokens`, `patterns`, `layouts` | `PageTransition`, `AnimationProvider`, `AnimatePresence` | `useReducedMotion`, `useAnimation`, `getAnimationTokens` | [04](./tokens-and-animation.md), [02](./primitives-reference.md) |
| 6 | CategoryAccent Theming | `primitives`, `tokens` | `CategoryAccentProvider` | `useCategoryAccent`, `getCategoryMeta` | [02](./primitives-reference.md), [04](./tokens-and-animation.md) |
| 7 | Help System | `patterns`, `primitives`, `layouts`, `state/stores` | `FieldHelp`, `FieldHelpDesktop`, `FieldHelpMobile`, `HelpModeToggle`, `BottomSheet`, `Popover` | `useFieldHelp`, `useHelpMode`, `usePlatform` | [07](./patterns-domain-components.md), [06](./patterns-forms-and-inputs.md) |
| 8 | Clipboard Pipeline | `patterns`, `primitives` | `Button`, `Select`, `Textarea` | `useClipboard`, `useBulkCopy`, `usePasteImport` | [08](./shared-hooks.md) |

---

## Dependency Direction Recap

Every flow above respects the one-way dependency rule enforced by ESLint
`@nx/enforce-module-boundaries`. No arrow in any diagram points upward:

```
apps/ → features/ → patterns/ → primitives/ → tokens (CSS vars)
                              ↗
                    layouts/ ─
                              ↘
                    state/stores (read by patterns via hooks, injected to layouts via app)
```

The only apparent exception is `useHelpMode` [patterns] importing from `@nasnet/state/stores`.
This is intentional: `state/stores` is not in the `libs/ui/` hierarchy and is allowed to be
imported by `patterns`. `layouts` cannot import from `state/stores` (library rule) which is why
`ResponsiveShell` receives sidebar state as props injected from the app layer.

---

## Further Reading

| Topic | Document |
|-------|---------|
| All 40 primitive components | [primitives-reference.md](./primitives-reference.md) |
| Shell and page layout components | [layouts-and-platform.md](./layouts-and-platform.md) |
| Token system and animation | [tokens-and-animation.md](./tokens-and-animation.md) |
| Status and data display patterns | [patterns-status-and-data.md](./patterns-status-and-data.md) |
| Form system, RHFFormField, ValidationProgress | [patterns-forms-and-inputs.md](./patterns-forms-and-inputs.md) |
| Domain components (ServiceCard, DeviceRoutingMatrix, etc.) | [patterns-domain-components.md](./patterns-domain-components.md) |
| All shared hooks | [shared-hooks.md](./shared-hooks.md) |
| Authoritative design system | See `Docs/design/README.md` |
| Platform presenter deep-dive | See `Docs/design/PLATFORM_PRESENTER_GUIDE.md` |
| Architecture patterns | See `Docs/architecture/novel-pattern-designs.md` |
