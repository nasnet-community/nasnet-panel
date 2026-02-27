# Design Tokens

NasNetConnect uses a three-tier design token architecture defined in
`libs/ui/tokens/src/tokens.json` and surfaced as CSS custom properties. Tokens flow from raw values
(Tier 1) through semantic meaning (Tier 2) to component-specific defaults (Tier 3).

**Authoritative reference:** `Docs/design/DESIGN_TOKENS.md`

## Three-Tier Token Architecture

```
Tier 1: Primitive Tokens
  Raw values — foundation layer (~80 tokens)
  color.brand.amber.500 = #EFC729
  color.status.green.500 = #22C55E
        ↓
Tier 2: Semantic Tokens
  Meaning-bearing aliases — use these in components
  semantic.color.primary = primitive.color.brand.amber.500
  semantic.color.success = primitive.color.status.green.500
        ↓
Tier 3: Component Tokens
  Component-specific overrides
  component.button.height = 2.5rem
  component.card.radius = 0.75rem
```

**Rule:** Always use Tier 2 (semantic) tokens in components. Never reference Tier 1 primitives
directly.

```tsx
// Correct — semantic token
<div className="bg-primary text-primary-foreground">
<div className="bg-success">

// Wrong — raw primitive color
<div className="bg-amber-500">
<div className="bg-green-500">
```

## Brand Colors

Defined in `libs/ui/tokens/src/tokens.json` under `primitive.color.brand`.

| Name         | Hex       | CSS Variable  | Tailwind Class | Usage                          |
| ------------ | --------- | ------------- | -------------- | ------------------------------ |
| Golden Amber | `#EFC729` | `--primary`   | `bg-primary`   | CTAs, emphasis, energy         |
| Trust Blue   | `#4972BA` | `--secondary` | `bg-secondary` | Links, navigation, reliability |

Both colors maintain WCAG AAA contrast ratios:

- Golden Amber uses `--primary-foreground` (dark text, slate-900) on light background
- Trust Blue uses `--secondary-foreground` (light text, slate-50) on its background

**Brand gradient** (for featured CTAs):

```css
background: linear-gradient(135deg, hsl(47 84% 55%) 0%, hsl(42 84% 48%) 100%);
```

Available as utility class `.brand-gradient` in `apps/connect/src/styles.css`.

## Semantic Status Colors

These colors carry fixed semantic meaning and must never be used decoratively. Defined in
`libs/ui/tokens/src/tokens.json` under `primitive.color.status`.

| Status  | Hex       | CSS Variable | Tailwind Class | Meaning                      |
| ------- | --------- | ------------ | -------------- | ---------------------------- |
| Success | `#22C55E` | `--success`  | `bg-success`   | Online, connected, valid     |
| Warning | `#F59E0B` | `--warning`  | `bg-warning`   | Pending, degraded, attention |
| Error   | `#EF4444` | `--error`    | `bg-error`     | Offline, failed, invalid     |
| Info    | `#0EA5E9` | `--info`     | `bg-info`      | Help, tips, informational    |

Each status color has light/dark variants for badge backgrounds:

- `bg-success-light` / `text-success-dark` — for badge backgrounds
- `dark:bg-green-900/20` / `dark:text-green-400` — dark mode badge

**Status utility classes** in `apps/connect/src/styles.css`:

```css
.status-connected {
  background-color: var(--semantic-color-success-DEFAULT);
}
.status-warning {
  background-color: var(--semantic-color-warning-DEFAULT);
}
.status-error {
  background-color: var(--semantic-color-error-DEFAULT);
}
.status-info {
  background-color: var(--semantic-color-info-DEFAULT);
}
.status-offline {
  @apply bg-muted text-muted-foreground;
}
```

## Category Accent Colors

14 categories each have a distinct accent color for visual identification of feature sections.
Defined in `libs/ui/primitives/src/category-accent/category-accent-provider.tsx`.

| Category     | CSS Variable                           | Tailwind Class           |
| ------------ | -------------------------------------- | ------------------------ |
| `security`   | `--semantic-color-category-security`   | `bg-category-security`   |
| `monitoring` | `--semantic-color-category-monitoring` | `bg-category-monitoring` |
| `networking` | `--semantic-color-category-networking` | `bg-category-networking` |
| `vpn`        | `--semantic-color-category-vpn`        | `bg-category-vpn`        |
| `wifi`       | `--semantic-color-category-wifi`       | `bg-category-wifi`       |
| `firewall`   | `--semantic-color-category-firewall`   | `bg-category-firewall`   |
| `system`     | `--semantic-color-category-system`     | `bg-category-system`     |
| `dhcp`       | `--semantic-color-category-dhcp`       | `bg-category-dhcp`       |
| `routing`    | `--semantic-color-category-routing`    | `bg-category-routing`    |
| `tunnels`    | `--semantic-color-category-tunnels`    | `bg-category-tunnels`    |
| `qos`        | `--semantic-color-category-qos`        | `bg-category-qos`        |
| `hotspot`    | `--semantic-color-category-hotspot`    | `bg-category-hotspot`    |
| `logging`    | `--semantic-color-category-logging`    | `bg-category-logging`    |
| `backup`     | `--semantic-color-category-backup`     | `bg-category-backup`     |

Use `CategoryAccentProvider` to apply category context to a feature section:

```tsx
import { CategoryAccentProvider, useCategoryAccent } from '@nasnet/ui/primitives';

<CategoryAccentProvider defaultCategory="vpn">
  <VPNSection />
</CategoryAccentProvider>;

function VPNSection() {
  const { meta } = useCategoryAccent();
  return <div className={cn('border-l-4 p-4', meta?.borderClass)}>...</div>;
}
```

## Surface Colors

Defined as CSS custom properties in `apps/connect/src/styles.css`. Light and dark variants are set
under `:root` and `.dark` respectively.

| Token                 | Light Value         | Dark Value          | Purpose            |
| --------------------- | ------------------- | ------------------- | ------------------ |
| `--background`        | `slate-100 #F1F5F9` | `slate-900 #0F172A` | App background     |
| `--surface`           | `white #FFFFFF`     | `slate-800 #1E293B` | Card/panel surface |
| `--surface-secondary` | `slate-50 #F8FAFC`  | `slate-700 #334155` | Secondary panels   |
| `--card`              | `white`             | `slate-800 #1E293B` | Card backgrounds   |
| `--muted`             | `slate-100`         | `slate-700`         | Muted backgrounds  |
| `--border`            | `slate-200 #E2E8F0` | `slate-700 #334155` | Borders            |

## Typography

Three typefaces are used for distinct roles.

| Font               | Role                                               | Import                                |
| ------------------ | -------------------------------------------------- | ------------------------------------- |
| **Inter Variable** | UI text — all general interface copy               | `@fontsource-variable/inter`          |
| **JetBrains Mono** | Technical data — IPs, MAC addresses, config values | `@fontsource-variable/jetbrains-mono` |
| **Satoshi**        | Display headings — page titles, marketing copy     | Local font via `@font-face`           |

Both Inter and JetBrains Mono are loaded as variable fonts with `font-display: swap`. Satoshi is
loaded from local system fonts first (for performance in offline/air-gapped environments), falling
back gracefully.

```css
/* Inter for body/UI text */
font-family:
  'Inter',
  system-ui,
  -apple-system,
  sans-serif;

/* JetBrains Mono for technical values */
font-family: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace;

/* Satoshi for headings */
font-family: 'Satoshi', 'Inter', sans-serif;
```

## Spacing Scale

4px base grid. All spacing values are multiples of 4px:

| Scale | Pixels | Tailwind       |
| ----- | ------ | -------------- |
| 1     | 4px    | `p-1`, `m-1`   |
| 2     | 8px    | `p-2`, `gap-2` |
| 3     | 12px   | `p-3`, `gap-3` |
| 4     | 16px   | `p-4`, `gap-4` |
| 6     | 24px   | `p-6`, `gap-6` |
| 8     | 32px   | `p-8`          |
| 12    | 48px   | `p-12`         |
| 16    | 64px   | `p-16`         |

## Border Radius

Component-specific tokens ensure consistent corner radii:

| Token                      | Value            | Used For                                    |
| -------------------------- | ---------------- | ------------------------------------------- |
| `--radius`                 | `0.75rem` (12px) | Base border radius for cards and containers |
| `--semantic-radius-button` | (from tokens)    | Button corners                              |
| `--semantic-radius-badge`  | (from tokens)    | Badge corners                               |

Card utility classes apply progressive radii:

```css
.card-elevated {
  border-radius: 1rem;
} /* 16px */
.card-interactive {
  border-radius: 1rem;
}

@media (min-width: 768px) {
  .card-elevated {
    border-radius: 1.5rem;
  } /* 24px on tablet+ */
}
```

## Component-Specific Tokens

Defined in `apps/connect/src/styles.css` under `:root`:

| Token             | Value            | Purpose                |
| ----------------- | ---------------- | ---------------------- |
| `--button-height` | `2.5rem` (40px)  | Standard button height |
| `--nav-height`    | `4rem` (64px)    | Navigation bar height  |
| `--card-padding`  | `1rem` (16px)    | Default card padding   |
| `--radius`        | `0.75rem` (12px) | Base border radius     |

## Dark Mode Implementation

Dark mode is activated by adding the `.dark` class to the root `<html>` element (managed by the
`ThemeToggle` pattern and a Zustand theme store). All CSS custom properties are redefined under
`.dark`:

```css
:root {
  --background: 210 40% 96.1%; /* light: slate-100 */
  --primary: 47 84% 55%; /* same in both themes */
}

.dark {
  --background: 222.2 47.4% 11.2%; /* dark: slate-900 */
  --primary: 47 84% 55%; /* same in both themes */
}
```

Theme transitions are smooth at 200ms, applied globally:

```css
* {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: ease-in-out;
  transition-duration: 200ms;
}
```

The primary Golden Amber color is identical in both themes since it reads well on both light and
dark backgrounds. The secondary Trust Blue is slightly darkened in dark mode (`hsl(217 44% 41%)` vs
`hsl(217 44% 51%)`) to maintain contrast ratios.

## Token Pipeline

Tokens are defined in `libs/ui/tokens/src/tokens.json` using the W3C Design Tokens Community Group
format. The build pipeline generates:

1. `variables.css` — CSS custom properties, imported by `apps/connect/src/styles.css`
2. TypeScript exports in `libs/ui/tokens/src/index.ts`
3. Animation tokens in `libs/ui/tokens/src/animation.ts`

**Do not edit generated token files directly.** Edit `tokens.json` and re-run the token build.
