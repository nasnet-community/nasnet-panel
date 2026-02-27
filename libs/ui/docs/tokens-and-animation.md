# Design Tokens & Animation System

**Source package:** `libs/ui/tokens/` **Motion components:** `libs/ui/patterns/src/motion/`
**Cross-reference:** [layouts-and-platform.md](./layouts-and-platform.md) for platform-specific
timing, [primitives-reference.md](./primitives-reference.md) for `useReducedMotion` hook.

---

## Three-Tier Token Architecture

NasNetConnect uses a strict three-tier token architecture defined in
`libs/ui/tokens/src/tokens.json`. Approximately 200 tokens are organized across the three tiers. The
build pipeline processes the JSON source and emits CSS variables, TypeScript constants, and a
Tailwind config extension.

```
Tier 1: Primitives (~80 tokens)   — raw values, never used directly in components
Tier 2: Semantic (~70 tokens)     — contextual meaning, the tier you use in components
Tier 3: Component (~50 tokens)    — component-specific, used only inside that component
```

### Tier 1: Primitive Tokens

Raw, named values with no meaning attached. Their only role is to be referenced by Tier 2 tokens.

```json
// libs/ui/tokens/src/tokens.json — primitive.color.brand
"amber": {
  "500": { "$value": "#EFC729" }   // PRIMARY - Golden Amber
},
"blue": {
  "500": { "$value": "#4972BA" }   // SECONDARY - Trust Blue
}

// primitive.color.status
"green.500":  "#22C55E"   // base for success
"red.500":    "#EF4444"   // base for error
"yellow.500": "#F59E0B"   // base for warning
"sky.500":    "#0EA5E9"   // base for info

// primitive.color.category (14 categories)
"security":  "#EF4444"   // red
"monitoring":"#A855F7"   // purple
"networking":"#3B82F6"   // blue
"vpn":       "#22C55E"   // green
"wifi":      "#06B6D4"   // cyan
"firewall":  "#F97316"   // orange
"system":    "#6B7280"   // gray
"dhcp":      "#EC4899"   // pink
"routing":   "#6366F1"   // indigo
"tunnels":   "#14B8A6"   // teal
"qos":       "#F472B6"   // pink
"hotspot":   "#FB923C"   // orange
"logging":   "#9CA3AF"   // gray
"backup":    "#60A5FA"   // light blue

// primitive.spacing — 4px base scale
"4":  "1rem"    // 16px
"6":  "1.5rem"  // 24px
"8":  "2rem"    // 32px
"11": "2.75rem" // 44px — minimum touch target

// primitive.typography.fontFamily
"sans":    "'Inter', system-ui, -apple-system, sans-serif"
"mono":    "'JetBrains Mono', 'Fira Code', ui-monospace, monospace"
"display": "'Satoshi', 'Inter', system-ui, sans-serif"

// primitive.duration — CSS transition durations
"100": "100ms"   "200": "200ms"   "300": "300ms"
```

### Tier 2: Semantic Tokens

Tokens with intent. These are the tokens you reference in component code. They point to Tier 1
values through the `{primitive.x.y}` reference syntax.

```json
// semantic.color.primary
"DEFAULT": "{primitive.color.brand.amber.500}"   // #EFC729
"hover":   "{primitive.color.brand.amber.600}"
"active":  "{primitive.color.brand.amber.700}"
"light":   "{primitive.color.brand.amber.100}"
"foreground": "{primitive.color.neutral.slate.900}"

// semantic.color.success / warning / error / info
"success.DEFAULT": "{primitive.color.status.green.500}"
"warning.DEFAULT": "{primitive.color.status.yellow.500}"
"error.DEFAULT":   "{primitive.color.status.red.500}"
"info.DEFAULT":    "{primitive.color.status.sky.500}"

// semantic.color.surface (background/card/muted)
"background": "{primitive.color.neutral.slate.100}"
"card":       "{primitive.color.neutral.white}"
"muted":      "{primitive.color.neutral.slate.100}"

// semantic.color.network — interface type colors
"wan":      firewall orange
"lan":      networking blue
"vpn":      vpn green
"wireless": wifi cyan

// semantic.color.networkStatus
"connected":    green.500
"disconnected": slate.400
"pending":      yellow.500
"error":        red.500

// semantic.duration
"fast":   "100ms"
"normal": "200ms"
"slow":   "300ms"
```

### Tier 3: Component Tokens

Tokens scoped to a single component. Defined under `component.*` in `tokens.json`. Do not reference
them outside their component.

```json
// component.button.primary
"bg":           "{semantic.color.primary.DEFAULT}"
"bgHover":      "{semantic.color.primary.hover}"
"text":         "{semantic.color.primary.foreground}"
"borderRadius": "{semantic.radius.button}"
"focusRing":    "0 0 0 4px rgba(239, 199, 41, 0.2)"

// component.card
"bg":             "{semantic.color.surface.card}"
"border":         "{semantic.color.border.DEFAULT}"
"shadow":         "{semantic.shadow.card}"
"borderRadius":   "{semantic.radius.card}"
"padding":        "{primitive.spacing.4}"
"paddingDesktop": "{primitive.spacing.6}"

// component.stepper
"activeColor":    "{semantic.color.primary.DEFAULT}"
"completedColor": "{semantic.color.success.DEFAULT}"
"itemSize":       "2rem"
"itemSizeMobile": "2.5rem"   // touch-friendly
```

### The Golden Rule

```tsx
// CORRECT — use semantic tokens
<Button className="bg-primary text-primary-foreground">Connect</Button>
<div className="bg-card border-border shadow-card">...</div>
<span className="text-success">Online</span>

// WRONG — never reference primitive colors directly
<Button className="bg-amber-500">Connect</Button>
<div className="bg-white border-slate-200">...</div>
```

---

## Token Build Pipeline

Source and build files:

- **Source:** `libs/ui/tokens/src/tokens.json`
- **Build script:** `libs/ui/tokens/build.js`
- **TypeScript animation tokens:** `libs/ui/tokens/src/animation.ts`

### Build Outputs

Running the build script produces four files under `libs/ui/tokens/dist/`:

| Output file               | Contents                                                           |
| ------------------------- | ------------------------------------------------------------------ |
| `dist/variables.css`      | CSS custom properties for `:root` and `.dark`                      |
| `dist/tokens.ts`          | TypeScript constants with `designTokens`, `cssVar()`, `getToken()` |
| `dist/tokens.d.ts`        | Type definitions for the above                                     |
| `dist/tailwind.config.js` | Tailwind theme extension mapping CSS variables to utilities        |

### Running the Build

```bash
# One-time build
npx nx build ui-tokens

# Watch mode (rebuilds on tokens.json changes)
node libs/ui/tokens/build.js --watch
```

The build script resolves all `{reference.path}` tokens, merges dark overrides, and emits only the
diff between light and dark into the `.dark {}` block.

---

## CSS Variable Naming Convention

The build script derives variable names from the JSON path using dashes:

```
--{tier}-{group}-{name}-{variant}
```

Real examples from `dist/variables.css`:

```css
:root {
  /* Tier 1 primitives */
  --primitive-color-brand-amber-500: #efc729;
  --primitive-spacing-4: 1rem;
  --primitive-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), ...;

  /* Tier 2 semantic */
  --semantic-color-primary-DEFAULT: #efc729;
  --semantic-color-primary-hover: #d4a50e;
  --semantic-color-success-DEFAULT: #22c55e;
  --semantic-color-surface-background: #f1f5f9;
  --semantic-color-surface-card: #ffffff;
  --semantic-color-category-security: #ef4444;
  --semantic-color-network-wan: #f97316;
  --semantic-color-networkStatus-connected: #22c55e;
  --semantic-confidence-high: #16a34a;
  --semantic-radius-button: 0.75rem;
  --semantic-shadow-card: 0 4px 6px -1px rgb(0 0 0 / 0.1), ...;
  --semantic-animation-wizard-stepTransition: 300ms;
  --semantic-animation-wizard-easing: cubic-bezier(0.4, 0, 0.2, 1);

  /* Tier 3 component */
  --component-button-primary-bg: #efc729;
  --component-card-borderRadius: 1rem;
  --component-stepper-activeColor: #efc729;
  --component-stepper-itemSize: 2rem;
  --component-stepper-itemSizeMobile: 2.5rem;
}

/* Dark theme overrides — only tokens that differ */
[data-theme='dark'],
.dark {
  --semantic-color-surface-background: #0f172a;
  --semantic-color-surface-card: #1e293b;
  --semantic-color-text-primary: #f8fafc;
  --semantic-color-border-DEFAULT: #334155;
  --semantic-color-networkStatus-connected: #4ade80;
}
```

---

## TypeScript Access

### Importing the Token Package

```tsx
// Import CSS variables (must be in app entrypoint or a root layout)
import '@nasnet/ui/tokens/variables.css';

// Import TypeScript animation tokens
import {
  transitions,
  getAnimationTokens,
  durations,
  easings,
  springs,
  getReducedMotionTransition,
  getReducedMotionDuration,
  msToSeconds,
  type Platform,
  type AnimationTokens,
} from '@nasnet/ui/tokens';
```

### Reading Token Values Programmatically

The build script generates `designTokens`, `cssVar()`, and `getToken()` in `dist/tokens.ts`:

```tsx
import { designTokens, cssVar, getToken } from '@nasnet/ui/tokens/tokens';

// Read a resolved value
const primary = designTokens.semantic.color.primary.DEFAULT;
// => '#EFC729'

// Get a CSS variable reference string
const varRef = cssVar('semantic-color-primary-DEFAULT');
// => 'var(--semantic-color-primary-DEFAULT)'

// Get a value by dot-path (returns string or undefined)
const successColor = getToken('semantic.color.success.DEFAULT');
// => '#22C55E'
```

---

## Tailwind Mapping

The build script emits `dist/tailwind.config.js` which maps every CSS variable to a Tailwind utility
class. The app's `tailwind.config.js` extends this.

### Color Utilities

```tsx
// Brand
bg-primary           // var(--semantic-color-primary-DEFAULT)   #EFC729
bg-primary/50        // 50% opacity of primary
text-primary-foreground
bg-secondary         // var(--semantic-color-secondary-DEFAULT)  #4972BA

// Status
bg-success           // var(--semantic-color-success-DEFAULT)
bg-warning
bg-error
bg-info
text-success
text-error

// Surfaces
bg-background        // app background
bg-card              // card surface
bg-muted             // muted surface
text-foreground      // primary text
text-muted-foreground

// Borders
border-border        // default border
ring-ring            // focus ring (maps to primary)

// Category accents (14 categories)
bg-category-security
bg-category-monitoring
bg-category-networking
bg-category-vpn
bg-category-wifi
bg-category-firewall
bg-category-system
bg-category-dhcp
bg-category-routing
bg-category-tunnels
bg-category-qos
bg-category-hotspot
bg-category-logging
bg-category-backup

// Network interface types
bg-network-wan
bg-network-lan
bg-network-vpn
bg-network-wireless
text-network-wan
text-network-lan

// Network status
bg-networkStatus-connected
bg-networkStatus-disconnected
bg-networkStatus-pending
bg-networkStatus-error

// Confidence indicators
bg-confidence-highBg   text-confidence-highText
bg-confidence-mediumBg text-confidence-mediumText
bg-confidence-lowBg    text-confidence-lowText
```

### Shadow, Border Radius, and Spacing Utilities

```tsx
// Shadows
shadow - card; // semantic shadow for cards
shadow - dropdown; // semantic shadow for dropdowns
shadow - modal; // semantic shadow for modals

// Border radius
rounded - button; // semantic.radius.button (xl = 12px)
rounded - card; // semantic.radius.card (2xl = 16px)
rounded - input; // semantic.radius.input (lg = 8px)

// Wizard layout spacing
w - wizard - sidebar; // 280px
w - wizard - preview; // 320px
max - w - wizard - content; // 720px
spacing - wizard - step - gap;

// Stepper component
w - stepper - item; // 2rem
w - stepper - item - mobile; // 2.5rem

// Animation timing
duration - step; // semantic.animation.wizard.stepTransition (300ms)
duration - validation; // semantic.animation.wizard.validationFeedback (150ms)
ease - step; // cubic-bezier(0.4, 0, 0.2, 1)
```

---

## Dark Mode

### How It Works

The build script compares light and dark token values and emits only changed variables into the
`.dark {}` block. The selector targets both `[data-theme="dark"]` (data attribute) and `.dark`
(class), which matches Tailwind's `darkMode: 'class'` strategy.

```css
[data-theme='dark'],
.dark {
  /* Only overridden tokens are emitted */
  --semantic-color-surface-background: #0f172a;
  --semantic-color-surface-card: #1e293b;
  --semantic-color-surface-muted: #334155;
  --semantic-color-text-primary: #f8fafc;
  --semantic-color-text-secondary: #cbd5e1;
  --semantic-color-border-DEFAULT: #334155;
  /* networkStatus — brighter for dark backgrounds */
  --semantic-color-networkStatus-connected: #4ade80;
  --semantic-color-networkStatus-pending: #fbbf24;
  --semantic-color-networkStatus-error: #f87171;
  /* Confidence — darker backgrounds, brighter text */
  --semantic-confidence-highBg: #14532d;
  --semantic-confidence-highText: #86efac;
}
```

### Where Dark Tokens Are Defined

The `dark` key in `tokens.json` contains only the overrides:

```json
// libs/ui/tokens/src/tokens.json
"dark": {
  "semantic": {
    "color": {
      "surface": {
        "background": { "$value": "{primitive.color.neutral.slate.900}" },
        "card":       { "$value": "{primitive.color.neutral.slate.800}" }
      },
      "networkStatus": {
        "connected": { "$value": "{primitive.color.status.green.400}" }
      }
    }
  },
  "component": {
    "button": {
      "ghost": { "bgHover": { "$value": "{primitive.color.neutral.slate.800}" } }
    },
    "card": {
      "bgHover": { "$value": "{primitive.color.neutral.slate.700}" }
    }
  }
}
```

### ThemeProvider Integration

Theme is toggled by adding or removing the `dark` class on `<html>`. The UI store in
`@nasnet/state/stores` manages the `theme` value, and the ThemeProvider (in
`apps/connect/src/app/providers/index.tsx`) syncs it to the DOM.

---

## Animation Tokens

**Source:** `libs/ui/tokens/src/animation.ts`

All animation tokens are TypeScript-only (not in `tokens.json`) and are exported directly from
`@nasnet/ui/tokens`.

### Tier 1: Duration Values (`durations`)

```typescript
import { durations } from '@nasnet/ui/tokens';

durations.instant; // 0    — no animation
durations.fast; // 100  — micro-interactions: button hover, toggle, status change
durations.normal; // 200  — standard animations: modal enter, content fade
durations.slow; // 300  — page transitions, complex sequences
durations.slower; // 500  — rarely used, very slow transitions
```

### Tier 1: Easing Curves (`easings`)

Cubic bezier arrays for Framer Motion's `ease` property:

```typescript
import { easings } from '@nasnet/ui/tokens';

// ease-out: fast start, slow end — for entering elements
easings.enter; // [0, 0, 0.2, 1]

// ease-in: slow start, fast end — for exiting elements
easings.exit; // [0.4, 0, 1, 1]

// ease-in-out: smooth repositioning — for layout changes
easings.move; // [0.4, 0, 0.2, 1]

// linear: constant speed — for progress indicators
easings.linear; // [0, 0, 1, 1]
```

### Tier 1: Spring Configurations (`springs`)

```typescript
import { springs } from '@nasnet/ui/tokens';

springs.default; // { type: 'spring', stiffness: 300, damping: 30 }
springs.gentle; // { type: 'spring', stiffness: 200, damping: 25 }
springs.bouncy; // { type: 'spring', stiffness: 400, damping: 20 }
springs.stiff; // { type: 'spring', stiffness: 500, damping: 35 }
```

### Tier 2: Platform-Aware Tokens (`getAnimationTokens`)

Mobile animations run 25% faster to feel snappier on touch devices. Exit transitions are an
additional 25% faster than enter transitions regardless of platform.

```typescript
import { getAnimationTokens } from '@nasnet/ui/tokens';
import type { Platform, AnimationTokens } from '@nasnet/ui/tokens';

const tokens = getAnimationTokens('mobile');
// tokens.pageTransition.enter   = 225ms  (300 * 0.75)
// tokens.pageTransition.exit    = 169ms  (300 * 0.75 * 0.75)
// tokens.modal.enter            = 150ms  (200 * 0.75)
// tokens.modal.exit             = 113ms
// tokens.microInteraction       = 75ms   (100 * 0.75)

const desktopTokens = getAnimationTokens('desktop');
// desktopTokens.pageTransition.enter  = 300ms
// desktopTokens.modal.enter           = 200ms
// desktopTokens.microInteraction      = 100ms
// desktopTokens.skeleton.duration     = 1.5  (seconds, infinite)
// desktopTokens.connectionPulse.duration = 2 (seconds, infinite)
```

The `AnimationTokens` interface:

```typescript
interface AnimationTokens {
  pageTransition: { enter: number; exit: number }; // ms
  modal: { enter: number; exit: number }; // ms
  drawer: { enter: number; exit: number }; // ms
  listReorder: number; // ms
  microInteraction: number; // ms
  skeleton: { duration: number; repeat: number }; // seconds
  connectionPulse: { duration: number; repeat: number }; // seconds
}
```

---

## Framer Motion Transitions

**Source:** `libs/ui/tokens/src/animation.ts` — the `transitions` object.

Pre-configured `Transition` objects ready to pass to `motion` components:

```typescript
import { transitions } from '@nasnet/ui/tokens';

// Standard content transitions
transitions.enter; // ease-out, 200ms  — modal/panel enter
transitions.exit; // ease-in,  150ms  — modal/panel exit (25% faster)
transitions.move; // ease-in-out, 200ms — layout repositioning
transitions.fast; // ease-out, 100ms  — micro-interactions

// Page-level transitions
transitions.pageEnter; // ease-out, 300ms
transitions.pageExit; // ease-in,  225ms

// Spring transitions
transitions.spring; // stiffness:300, damping:30
transitions.springGentle; // stiffness:200, damping:25
transitions.springBouncy; // stiffness:400, damping:20

// Special
transitions.instant; // duration:0 — no animation
```

Usage with Framer Motion:

```tsx
import { motion } from 'framer-motion';
import { transitions } from '@nasnet/ui/tokens';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={transitions.enter}
/>;
```

---

## Animation Presets

**Source:** `libs/ui/patterns/src/motion/presets.ts` **Import:**
`import { fadeIn, slideUp, ... } from '@nasnet/ui/patterns/motion'`

Presets are Framer Motion `Variants` objects with `initial`, `animate`, and `exit` states baked in.

### Fade Variants

```typescript
fadeIn; // opacity: 0 → 1, uses enterTransition / exitTransition
fadeOut; // stays at 1, exit fades to 0
```

### Slide Variants

```typescript
slideUp; // y: 20 → 0 enter, y: 0 → -10 exit
slideDown; // y: -20 → 0 enter, y: 0 → 10 exit
slideLeft; // x: 20 → 0 enter (slides in from right), x: 0 → -10 exit
slideRight; // x: -20 → 0 enter (slides in from left), x: 0 → 10 exit
```

### Scale Variants

```typescript
scaleIn; // scale: 0.95 → 1 — modals, popovers, toasts
scaleOut; // stays at 1, scale: 1 → 0.95 on exit
popIn; // scale: 0.8 → 1 with spring physics — badges, attention elements
```

### Page Transition Variants

```typescript
pageFade; // opacity: 0 → 1, uses pageEnterTransition / pageExitTransition
pageSlideUp; // opacity + y: 20 → 0, uses pageEnterTransition
```

### Drawer and Sheet Variants

```typescript
drawerRight; // x: '100%' → 0 — desktop right drawer
drawerLeft; // x: '-100%' → 0 — desktop left drawer
bottomSheet; // y: '100%' → 0 — mobile bottom sheet
backdrop; // opacity: 0 → 1, fast (100ms)
```

### Stagger Variants (for Lists)

```typescript
// Wrap list with staggerContainer, items with staggerItem
staggerContainer; // staggerChildren: 0.05s, delayChildren: 0.1s
staggerItem; // opacity + y: 10 → 0 per item
staggerContainerFast; // staggerChildren: 0.02s — for long lists
```

### Reduced Motion Variants

```typescript
reducedMotionFade; // minimal fade (0.1s enter, 0.05s exit)
reducedMotionInstant; // opacity: 1, instant exit
```

### Micro-Interaction Variants

```typescript
buttonPress; // scale: 1 → 0.97 on tap, 1.02 on hover
hoverLift; // y: 0 → -2 on hover
pulse; // scale + opacity pulse, 2s, infinite
connectionPulse; // scale: 1 → 1.15 → 1, 2s, infinite
shimmer; // x: '-100%' → '100%', 1.5s, infinite — skeleton loaders
```

### Layout and State Variants

```typescript
listItem; // opacity + y: 10 → 0, uses moveTransition
collapse; // height: 0 → 'auto', opacity: 0 → 1

successCheck; // SVG pathLength: 0 → 1 with opacity
errorShake; // x: [0, -10, 10, -10, 10, 0], 0.4s
```

### Utility: `getVariant`

```typescript
import { getVariant, fadeIn, reducedMotionFade } from '@nasnet/ui/patterns/motion';

// Returns reducedMotionFade if reducedMotion is true, otherwise fadeIn
const variants = getVariant(fadeIn, reducedMotion);

// Supply a custom reduced variant
const variants = getVariant(slideUp, reducedMotion, reducedMotionFade);
```

---

## Motion Components

All components are exported from `@nasnet/ui/patterns/motion`:

```typescript
import {
  AnimationProvider,
  useAnimation,
  useAnimationOptional,
  MotionConfig,
  PageTransition,
  PageTransitionWrapper,
  usePageTransition,
  BottomSheet,
  BottomSheetHeader,
  BottomSheetContent,
  BottomSheetFooter,
  useBottomSheet,
  AnimatedList,
  DragHandle,
  StaggeredList,
  StaggeredItem,
  SharedElement,
  SharedElementRoot,
  SharedElementGroup,
  SharedImage,
  useInViewAnimation,
  useRevealAnimation,
  useStaggeredReveal,
  AnimationErrorBoundary,
} from '@nasnet/ui/patterns/motion';
```

---

### AnimationProvider

**File:** `libs/ui/patterns/src/motion/AnimationProvider.tsx`

The context provider that wires together reduced motion preference (from `@nasnet/state/stores`
`animationsEnabled`) and platform detection (from `@nasnet/ui/layouts` `usePlatform`). Must be
placed high in the component tree.

```tsx
import { AnimationProvider } from '@nasnet/ui/patterns/motion';

// In apps/connect/src/app/providers/index.tsx
export function Providers({ children }: { children: ReactNode }) {
  return <AnimationProvider>{children}</AnimationProvider>;
}
```

**`useAnimation()` hook** — access the context. Throws if used outside `AnimationProvider`.

```tsx
import { useAnimation } from '@nasnet/ui/patterns/motion';
import { slideUp } from '@nasnet/ui/patterns/motion';

function MyComponent() {
  const { reducedMotion, platform, tokens, getVariant, getTransition, getDuration } =
    useAnimation();

  return (
    <motion.div
      variants={getVariant(slideUp)} // swaps to reducedMotionFade if needed
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getTransition('enter')} // returns instant if reducedMotion
    >
      Content
    </motion.div>
  );
}
```

**`useAnimationOptional()`** — same as `useAnimation()` but returns `null` instead of throwing when
used outside the provider.

**`MotionConfig`** — override animation settings for a subtree:

```tsx
import { MotionConfig } from '@nasnet/ui/patterns/motion';

// Disable animations for form fields
<MotionConfig reducedMotion>
  <FormFields />
</MotionConfig>;
```

---

### PageTransition

**File:** `libs/ui/patterns/src/motion/PageTransition.tsx`

Wraps route content to animate transitions. Uses the current pathname as the animation key.

```tsx
import { PageTransition, PageTransitionWrapper } from '@nasnet/ui/patterns/motion';

// In apps/connect/src/routes/__root.tsx — animates every route change
<PageTransition variant="fade">
  <Outlet />
</PageTransition>

// variant options: 'fade' | 'slideUp' | 'none'
// mode options:    'wait' (sequential) | 'sync' | 'popLayout'
<PageTransition variant="slideUp" mode="wait">
  <Outlet />
</PageTransition>
```

For per-page animation without `AnimatePresence` at the root:

```tsx
// In a page component
<PageTransitionWrapper variant="fade">
  <h1>Dashboard</h1>
  <DashboardContent />
</PageTransitionWrapper>
```

**`usePageTransition()` hook:**

```tsx
const { variants, enterTransition, exitTransition, reducedMotion } = usePageTransition('slideUp');

<motion.div
  variants={variants}
  initial="initial"
  animate="animate"
  transition={enterTransition}
>
  Content
</motion.div>;
```

---

### BottomSheet

**File:** `libs/ui/patterns/src/motion/BottomSheet.tsx`

Mobile-optimized bottom sheet with swipe-to-dismiss gesture, focus trap, and escape key support.

```tsx
import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetContent,
  BottomSheetFooter,
  useBottomSheet,
} from '@nasnet/ui/patterns/motion';

function RouterActionsSheet() {
  const { isOpen, open, close } = useBottomSheet();

  return (
    <>
      <Button onClick={open}>Actions</Button>

      <BottomSheet
        isOpen={isOpen}
        onClose={close}
        aria-label="Router actions"
        swipeThreshold={100} // pixels to drag before dismissing
        velocityThreshold={500} // pixels/sec flick velocity to dismiss
        swipeToDismiss // default: true
        showBackdrop // default: true
        closeOnBackdropClick // default: true
      >
        <BottomSheetHeader>Router Actions</BottomSheetHeader>
        <BottomSheetContent>
          <p>Choose an action for your router.</p>
        </BottomSheetContent>
        <BottomSheetFooter>
          <Button onClick={close}>Cancel</Button>
        </BottomSheetFooter>
      </BottomSheet>
    </>
  );
}
```

Reduced motion: when `reducedMotion` is true the `bottomSheet` variant is replaced with
`reducedMotionFade` and drag-to-dismiss is disabled.

---

### AnimatedList

**File:** `libs/ui/patterns/src/motion/AnimatedList.tsx`

Drag-and-drop reorderable list with layout animations. Wraps Framer Motion's `Reorder.Group`.

```tsx
import { AnimatedList, DragHandle } from '@nasnet/ui/patterns/motion';

function FirewallRuleList({ rules, onReorder }) {
  return (
    <AnimatedList
      items={rules}
      onReorder={onReorder}
      getKey={(rule) => rule.id}
      axis="y"
      animateEntrance // animate items on initial render
    >
      {(rule, index, dragControls) => (
        <div className="rounded-card flex items-center gap-2 border p-3">
          <DragHandle onPointerDown={(e) => dragControls.start(e)} />
          <span>{rule.name}</span>
        </div>
      )}
    </AnimatedList>
  );
}
```

For staggered entrance without reordering:

```tsx
import { StaggeredList, StaggeredItem } from '@nasnet/ui/patterns/motion';

<StaggeredList>
  {services.map((service) => (
    <StaggeredItem key={service.id}>
      <ServiceCard service={service} />
    </StaggeredItem>
  ))}
</StaggeredList>;
```

Reduced motion: `AnimatedList` and `StaggeredList` both fall back to a static `<div>` list when
`reducedMotion` is true.

---

### SharedElement

**File:** `libs/ui/patterns/src/motion/SharedElement.tsx`

Shared element transitions between routes using Framer Motion's `layoutId`.

```tsx
import { SharedElementRoot, SharedElement, SharedImage } from '@nasnet/ui/patterns/motion';

// In __root.tsx — wraps the whole app
<SharedElementRoot>
  <Outlet />
</SharedElementRoot>

// On list page
<SharedElement layoutId={`service-card-${service.id}`}>
  <ServiceCard service={service} />
</SharedElement>

// On detail page — matching layoutId triggers the shared transition
<SharedElement layoutId={`service-card-${service.id}`}>
  <ServiceHero service={service} />
</SharedElement>

// For images
<SharedImage
  layoutId={`service-icon-${service.id}`}
  src={service.iconUrl}
  alt={service.name}
  className="h-16 w-16 rounded-xl"
/>
```

Use `SharedElementGroup` to prevent cross-list animations when multiple lists have similar IDs:

```tsx
import { SharedElementGroup } from '@nasnet/ui/patterns/motion';

<SharedElementGroup id="vpn-servers">
  {servers.map((server) => (
    <SharedElement
      key={server.id}
      layoutId={server.id}
    >
      <ServerCard server={server} />
    </SharedElement>
  ))}
</SharedElementGroup>;
```

---

### useInViewAnimation

**File:** `libs/ui/patterns/src/motion/useInViewAnimation.ts`

Scroll-triggered animations using Framer Motion's `useInView`.

```tsx
import {
  useInViewAnimation,
  useRevealAnimation,
  useStaggeredReveal,
} from '@nasnet/ui/patterns/motion';

// Basic in-view detection
function FadeSection() {
  const { ref, isInView, shouldAnimate } = useInViewAnimation({
    once: true, // only animate the first time it enters view
    amount: 0.3, // 30% of element visible to trigger
  });

  return (
    <motion.div
      ref={ref}
      initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      Content
    </motion.div>
  );
}

// Convenience hook with ready-to-use props
function RevealCard() {
  const { ref, isInView, initial, animate, transition } = useRevealAnimation({
    direction: 'up', // 'up' | 'down' | 'left' | 'right' | 'none'
    distance: 20, // pixels
    delay: 100, // ms
    once: true,
  });

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? animate : initial}
      transition={transition}
    >
      Content
    </motion.div>
  );
}

// Staggered list reveal
function ServiceGrid({ services }) {
  const { ref, isInView, getItemDelay } = useStaggeredReveal({
    itemCount: services.length,
    staggerDelay: 50, // ms between each item
    baseDelay: 0,
    once: true,
  });

  return (
    <div ref={ref}>
      {services.map((service, i) => (
        <motion.div
          key={service.id}
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: getItemDelay(i) }}
        >
          <ServiceCard service={service} />
        </motion.div>
      ))}
    </div>
  );
}
```

Reduced motion: `isInView` is forced to `true` and `shouldAnimate` is `false` when reduced motion is
enabled, so content appears immediately without any transform.

---

## Reduced Motion Support

### Utility Functions from `@nasnet/ui/tokens`

```typescript
import {
  getReducedMotionTransition,
  getReducedMotionDuration,
  msToSeconds,
} from '@nasnet/ui/tokens';

// Return instant transition if reduced motion is preferred
const transition = getReducedMotionTransition(transitions.enter, prefersReducedMotion);
// If reduced: { duration: 0 }
// Otherwise: transitions.enter (ease-out, 200ms)

// Return 0ms if reduced motion, otherwise return the full duration
const duration = getReducedMotionDuration(300, prefersReducedMotion);
// If reduced: 0
// Otherwise: 300

// Convert milliseconds to seconds (Framer Motion uses seconds)
const seconds = msToSeconds(200); // => 0.2
```

### Integration with `useAnimation`

The `useAnimation()` hook from `AnimationProvider` is the preferred way to access reduced motion
state in components. It reads `animationsEnabled` from the Zustand UI store (which users can toggle
in settings) rather than directly from the `prefers-reduced-motion` media query:

```typescript
const { reducedMotion, getVariant, getTransition, getDuration } = useAnimation();

// getVariant — swap full variant for reduced variant
const myVariants = getVariant(slideUp); // reducedMotionFade if reduced
const myVariants = getVariant(slideUp, myFallback); // custom fallback

// getTransition — returns { duration: 0 } if reduced
const t = getTransition('enter'); // transitions.enter or instant

// getDuration — returns 0 if reduced
const ms = getDuration(300); // 300 or 0
```

### CSS Reduced Motion

Token-driven CSS transitions also respect the `prefers-reduced-motion` media query through the
`semantic.animation.reducedMotion` tokens:

```css
/* In components using wizard animation tokens */
@media (prefers-reduced-motion: reduce) {
  /* var(--semantic-animation-reducedMotion-stepTransition) = 0ms */
  /* var(--semantic-animation-reducedMotion-validationFeedback) = 0ms */
}
```

### The `reducedMotionFade` Preset

When `reducedMotion` is true, most motion components swap their variant for `reducedMotionFade`.
This preset still provides a subtle opacity change (0.1s enter, 0.05s exit) to give visual feedback
without spatial movement:

```typescript
// libs/ui/patterns/src/motion/presets.ts
export const reducedMotionFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.05 } },
};

// For cases that need truly instant transitions
export const reducedMotionInstant: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0 } },
};
```

See [primitives-reference.md](./primitives-reference.md) for the `useReducedMotion` primitive hook,
and [layouts-and-platform.md](./layouts-and-platform.md) for how `getAnimationTokens(platform)` ties
platform detection to animation timing.
