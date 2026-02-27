# Accessibility

NasNetConnect targets **WCAG 2.1 Level AAA** accessibility compliance. This is a non-negotiable constraint because MikroTik administrators use the UI across diverse environments — phones in server rooms, high-ambient-light conditions, assistive technologies. Every component must meet these requirements before shipping.

---

## Requirements Summary

| Requirement | Standard | Target |
|-------------|----------|--------|
| Color contrast (normal text) | WCAG AAA 1.4.6 | 7:1 ratio |
| Color contrast (large text) | WCAG AAA 1.4.6 | 4.5:1 ratio |
| Touch target size | WCAG AAA 2.5.5 | 44×44px minimum |
| Focus indicators | WCAG AA 2.4.7 | 3px ring, high contrast |
| Keyboard navigation | WCAG AA 2.1.1 | Full, no mouse required |
| Screen reader support | WCAG AA 1.3.1 | Semantic HTML + ARIA |
| Reduced motion | WCAG 2.1 SC 2.3.3 | Respect `prefers-reduced-motion` |
| Semantic HTML | WCAG 1.3.1 | Proper element types + ARIA labels |

---

## Color Contrast

### 7:1 Contrast Ratio for Normal Text

All text at font sizes below 18pt (24px) or bold below 14pt (18.67px bold) must achieve a 7:1 contrast ratio.

The design system uses semantic tokens that are pre-validated for WCAG AAA:

```tsx
// Good — semantic tokens guaranteed 7:1 on their respective backgrounds
<p className="text-foreground">...</p>        // Primary text
<p className="text-muted-foreground">...</p>  // Secondary text

// Bad — raw Tailwind palette colors, contrast not guaranteed
<p className="text-gray-400">...</p>
<p className="text-gray-500">...</p>
```

When adding custom text colors, verify the ratio with a contrast checker. Both light and dark themes must meet the requirement independently.

### Status Colors

Status colors (success green, warning amber, error red) must be paired with sufficient background contrast. Never use color as the **sole** indicator of status — always pair with an icon or label:

```tsx
// Good — status conveyed by color AND label AND icon
<StatusBadge status="online" />
// Renders: green dot + "Online" text

// Bad — status conveyed by color only
<div className="bg-success h-3 w-3 rounded-full" />
```

---

## Touch Targets

All interactive elements must have a minimum tap area of **44×44px** to comply with WCAG 2.5.5 and support users on mobile devices (which is a primary use case).

```tsx
// Enforce minimum touch target on icon buttons
<button
  className="h-11 w-11 flex items-center justify-center"
  aria-label="Close panel"
>
  <X className="h-4 w-4" />
</button>
```

If the visible button is smaller than 44px, add padding to expand the hit area:

```tsx
// Icon appears small but tap area is 44px
<button className="p-3 rounded-full">  {/* 12px padding × 2 + 20px icon = 44px */}
  <Settings className="h-5 w-5" />
</button>
```

---

## Focus Indicators

All focusable elements must show a clearly visible focus ring. The design system uses:

```css
/* 3px ring with offset for maximum visibility */
focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2
```

Never remove focus outlines (`outline: none`) without providing an equivalent replacement. The `focus-visible` variant ensures the ring only shows for keyboard users, not mouse clicks.

```tsx
// Correct — uses focus-visible ring
<button className="rounded-md px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Save
</button>

// Incorrect — removes focus indicator
<button className="outline-none focus:outline-none">
  Save
</button>
```

---

## Keyboard Navigation

All features must be fully usable without a mouse. Required keyboard support:

| Key | Expected behavior |
|-----|------------------|
| `Tab` / `Shift+Tab` | Move focus forward/backward through interactive elements |
| `Enter` / `Space` | Activate buttons and links |
| `Escape` | Close dialogs, drawers, dropdowns |
| `ArrowUp` / `ArrowDown` | Navigate list items, menu options |
| `Home` / `End` | Jump to first/last item in list |

Verify keyboard support with the E2E tests in `apps/connect-e2e/src/interface-management.spec.ts`:

```typescript
test('supports keyboard navigation', async ({ page }) => {
  await page.goto('/dashboard/network');
  await page.keyboard.press('Tab');        // Focus first element
  await page.keyboard.press('ArrowDown'); // Move in list
  await page.keyboard.press('Enter');     // Open detail panel
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('closes detail panel on escape', async ({ page }) => {
  await page.getByText('ether1').click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
```

---

## Screen Reader Support

### Semantic HTML

Use the correct HTML element for each purpose. This gives screen readers the right role automatically:

```tsx
// Good — semantic elements
<nav aria-label="Main navigation">...</nav>
<main id="content">...</main>
<h1>Network Interfaces</h1>
<table aria-label="ARP table">...</table>
<button>Save</button>
<a href="/dashboard">Dashboard</a>

// Bad — div soup
<div onClick={handleClick}>Save</div>
<div className="nav">...</div>
```

### ARIA Labels

When a visible label is insufficient or absent, add `aria-label` or `aria-labelledby`:

```tsx
// Icon-only button — add aria-label
<button aria-label="Close panel">
  <X className="h-4 w-4" />
</button>

// Table with no visible caption
<table aria-label="ARP table">...</table>

// Search input
<input
  type="search"
  aria-label="Search interfaces"
  placeholder="Search interfaces..."
/>
```

### Live Regions

For status changes that happen without a page navigation (e.g., after saving a configuration), use ARIA live regions so screen readers announce the update:

```tsx
// Status announcement — polite waits for the user to finish reading
<div role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Alert announcement — interrupts immediately (use for errors only)
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

### Skip Links

A "Skip to main content" link at the top of the page allows screen reader and keyboard users to bypass repeated navigation:

```tsx
// In common.json
"accessibility": {
  "skipToContent": "Skip to main content"
}

// In layout
<a
  href="#content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
>
  {t('accessibility.skipToContent')}
</a>
<main id="content">...</main>
```

---

## Reduced Motion

Users who have enabled "Reduce Motion" in their operating system accessibility settings must not see animations that could cause discomfort (vestibular disorders, epilepsy).

### useReducedMotion Hook

`libs/core/utils/src/hooks/useReducedMotion.ts` provides a React hook that tracks the `prefers-reduced-motion` media query in real time:

```tsx
import { useReducedMotion } from '@nasnet/core/utils';

function AnimatedCard({ children }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'transition-all duration-300',
        prefersReducedMotion && 'transition-none'
      )}
    >
      {children}
    </div>
  );
}
```

The hook:
- Returns `false` during SSR (safe default — no animations assumed)
- Listens for system-level changes in real time (user can toggle without page reload)
- Handles browser compatibility (`addEventListener` and deprecated `addListener` fallback)

### Static Check

For non-reactive contexts (CSS-in-JS constants, module-level code):

```typescript
import { getReducedMotionPreference } from '@nasnet/core/utils';

const duration = getReducedMotionPreference() ? 0 : 300;
```

### CSS Approach

Tailwind's `motion-reduce` variant provides CSS-level reduced-motion support:

```tsx
<div className="animate-pulse motion-reduce:animate-none">
  Loading...
</div>

<div className="transition-all duration-500 motion-reduce:transition-none">
  Content
</div>
```

Use **both** the hook (for JS-controlled animations like Framer Motion) and `motion-reduce:` (for CSS transitions).

---

## Implementing Accessible Components

### Checklist per Component

Before marking a component complete:

- [ ] Color contrast ≥7:1 for normal text in both light and dark theme
- [ ] All interactive elements are keyboard-reachable (Tab order is logical)
- [ ] All buttons and inputs have text labels or `aria-label`
- [ ] Icons used alone have `aria-label` on their container button
- [ ] Focus ring visible (3px, high contrast)
- [ ] Touch targets ≥44px on mobile
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Status changes announced via live regions
- [ ] `role="dialog"` set on modals with `aria-modal="true"`
- [ ] Form inputs have `<label>` or `aria-labelledby`
- [ ] Error messages associated with fields via `aria-describedby`

### Dialog/Modal Pattern

```tsx
<Dialog>
  <DialogContent
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
  >
    <DialogHeader>
      <DialogTitle id="dialog-title">Confirm Delete</DialogTitle>
      <DialogDescription id="dialog-description">
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    ...
  </DialogContent>
</Dialog>
```

### Form Accessibility

```tsx
<div className="space-y-2">
  <Label htmlFor="interface-name">Interface Name</Label>
  <Input
    id="interface-name"
    aria-describedby={error ? 'interface-name-error' : undefined}
    aria-invalid={!!error}
  />
  {error && (
    <p id="interface-name-error" role="alert" className="text-destructive text-sm">
      {error.message}
    </p>
  )}
</div>
```

---

## Testing Accessibility

### axe-core in E2E Tests

The Playwright E2E test suite includes accessibility scans via `axe-core`. The `interface-management.spec.ts` file shows the pattern:

```typescript
test('has no accessibility violations', async ({ page }) => {
  await page.goto('/dashboard/network');
  await page.waitForLoadState('networkidle');

  const accessibilityScanResults = await page.evaluate(() => {
    return window.axe ? window.axe.run() : null;
  });

  if (accessibilityScanResults) {
    expect(accessibilityScanResults.violations).toEqual([]);
  }
});
```

### Manual Testing Checklist

In addition to automated scans:

1. **Keyboard-only navigation** — Tab through the entire page without touching the mouse
2. **Screen reader** — NVDA (Windows) or VoiceOver (macOS/iOS) — verify all elements are announced correctly
3. **200% zoom** — Content must not overflow or break at double zoom
4. **High contrast mode** — Windows High Contrast or forced-colors CSS mode
5. **Mobile touch** — Test that all interactive elements are easily tappable on a 375px screen

### CI Accessibility Gate

Accessibility checks run in CI as a **blocking gate** — builds fail if violations are detected. The CI pipeline uses Pa11y for automated WCAG checks across critical pages.

---

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| `<div onClick={...}>` without `role` | Use `<button>` or add `role="button"` + `tabIndex={0}` + keyboard handler |
| Icon buttons with no label | Add `aria-label` describing the action |
| `outline: none` on focused elements | Replace with `focus-visible:ring-2 focus-visible:ring-ring` |
| Status shown by color only | Add icon + text label alongside color |
| Animated elements ignoring reduced motion | Add `motion-reduce:animate-none` or `useReducedMotion()` |
| Modals without `aria-modal` | Add `role="dialog" aria-modal="true"` with a labeled title |
| Form error not associated with field | Use `aria-describedby` pointing to error message id |

---

## See Also

- `Docs/design/ux-design/8-responsive-design-accessibility.md` — Complete accessibility requirements
- `libs/core/utils/src/hooks/useReducedMotion.ts` — Reduced motion hook implementation
- `apps/connect-e2e/src/interface-management.spec.ts` — Accessibility E2E test examples
- `libs/core/i18n/src/locales/en/common.json` — Accessibility string keys (`accessibility.*`)
