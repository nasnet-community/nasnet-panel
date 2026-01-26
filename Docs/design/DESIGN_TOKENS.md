# Design Tokens Quick Reference

**Version:** 2.0  
**Last Updated:** January 20, 2026  
**Total Tokens:** ~200

This is a quick reference for developers. For complete specifications, see [Visual Foundation](./ux-design/3-visual-foundation.md).

---

## 🎨 Colors

### Brand Colors (Core Identity)

**PRIMARY:** Golden Amber `#EFC729`
**SECONDARY:** Trust Blue `#4972BA`

These are NasNetConnect's core brand colors and must be preserved across all themes and contexts.

```typescript
// Primary Brand Color - Golden Amber
primary            // #EFC729 - Main brand color
                   // Used for: Primary buttons, active states, CTAs, emphasis
                   // Emotional: Energy, confidence, empowerment

// Secondary Brand Color - Trust Blue  
secondary          // #4972BA - Supporting brand color
                   // Used for: Links, navigation, information, reliability
                   // Emotional: Trust, stability, professionalism
```

---

### Tier 1: Primitive Colors

```typescript
// Brand colors (CORE - DO NOT REMOVE)
brand.amber.500    // #EFC729 - PRIMARY: Golden Amber
brand.blue.500     // #4972BA - SECONDARY: Trust Blue

// Status colors (semantic bases)
green.500          // #22C55E - Success
red.500            // #EF4444 - Error
yellow.500         // #F59E0B - Warning
sky.500            // #0EA5E9 - Info

// Category accents (14 categories)
red.600            // Security
purple.500         // Monitoring
blue.600           // Networking
green.600          // VPN
cyan.600           // WiFi
orange.600         // Firewall
slate.600          // System
pink.600           // DHCP
indigo.600         // Routing
teal.600           // Tunnels
orange.500         // Hotspot
gray.600           // Logging
blue.500           // Backup

// Neutral
slate.50           // #F8FAFC
slate.200          // #E2E8F0
slate.500          // #64748B
slate.800          // #1E293B
slate.900          // #0F172A
slate.950          // #020617
```

### Tier 2: Semantic Colors

```typescript
// PRIMARY BRAND COLOR (Golden Amber #EFC729)
primary            // brand.amber.500 - CORE BRAND COLOR
primaryHover       // brand.amber.600 - Hover state
primaryActive      // brand.amber.700 - Active/pressed state
primaryLight       // brand.amber.50  - Backgrounds
primaryDark        // brand.amber.900 - Dark mode variant

// SECONDARY BRAND COLOR (Trust Blue #4972BA)
secondary          // brand.blue.500 - CORE BRAND COLOR
secondaryHover     // brand.blue.600 - Hover state
secondaryActive    // brand.blue.700 - Active/pressed state
secondaryLight     // brand.blue.50  - Backgrounds
secondaryDark      // brand.blue.900 - Dark mode variant

// Status colors (universal meaning - DO NOT use for branding)
success            // Green - Always green (not brand colors)
warning            // Amber - Always amber (not brand colors)
error              // Red - Always red (not brand colors)
info               // Blue - Always blue (not brand colors)
neutral            // Gray - Disabled/inactive

// Category accents
categorySecurity        // Red
categoryMonitoring      // Purple
categoryNetworking      // Blue
categoryVPN             // Green
categoryWiFi            // Cyan
categoryFirewall        // Orange
categorySystem          // Gray
categoryDHCP            // Pink
categoryRouting         // Indigo
categoryTunnels         // Teal
categoryQoS             // Pink
categoryHotspot         // Orange
categoryLogging         // Gray
categoryBackup          // Blue

// Surfaces
lightBg            // #F8FAFC
lightSurface       // #FFFFFF
lightBorder        // #E2E8F0
lightText          // #0F172A
lightTextMuted     // #64748B

darkBg             // #020617
darkSurface        // #0F172A
darkBorder         // #1E293B
darkText           // #F8FAFC
darkTextMuted      // #94A3B8
```

### Tier 3: Component Colors

```typescript
// Buttons (using brand colors)
buttonPrimaryBg         // primary (Golden Amber #EFC729)
buttonPrimaryText       // white
buttonPrimaryHover      // primaryHover
buttonSecondaryBg       // secondary (Trust Blue #4972BA)
buttonSecondaryText     // white
buttonDangerBg          // error (red - not brand color)

// Cards
cardBg                  // lightSurface / darkSurface
cardBorder              // lightBorder / darkBorder

// Status badges
badgeOnline             // success (green)
badgeOffline            // error (red)
badgeWarning            // warning (amber)
badgeInfo               // info (blue)

// Navigation
navActive               // primary
navHover                // slate.100 / slate.800

// Inputs
inputBorder             // lightBorder
inputFocus              // primary
inputError              // error
```

### WCAG AAA Compliant Pairings

| Foreground | Background | Ratio | Status |
|-----------|------------|-------|--------|
| slate.900 | white | 19.2:1 | ✅ AAA |
| slate.50 | slate.950 | 18.8:1 | ✅ AAA |
| green.700 | green.50 | 7.5:1 | ✅ AAA |
| red.700 | red.50 | 7.2:1 | ✅ AAA |
| amber.800 | amber.50 | 8.1:1 | ✅ AAA |

---

## 📐 Spacing

### Primitive Scale (Base: 4px)

```typescript
0     // 0
1     // 4px
2     // 8px
3     // 12px
4     // 16px
5     // 20px
6     // 24px
8     // 32px
10    // 40px
12    // 48px
16    // 64px
20    // 80px
24    // 96px
```

### Semantic Spacing

```typescript
// Component padding
componentPadding.sm    // 8px
componentPadding.md    // 16px
componentPadding.lg    // 24px

// Layout gaps
layoutGap.sm           // 16px
layoutGap.md           // 24px
layoutGap.lg           // 32px

// Page margins
pageMargin.mobile      // 16px
pageMargin.tablet      // 24px
pageMargin.desktop     // 32px
```

### Component Spacing

```typescript
// Cards
cardPadding            // 24px
cardGap                // 16px

// Buttons
buttonPaddingX         // 16px
buttonPaddingY         // 8px
buttonGap              // 8px (icon + text)

// Forms
formFieldGap           // 16px
formLabelMargin        // 4px
```

---

## ✍️ Typography

### Font Families

```typescript
fontFamily.sans        // Inter Variable, system-ui
fontFamily.mono        // JetBrains Mono, Consolas
fontFamily.display     // Satoshi, Inter
```

### Font Sizes (Responsive with clamp)

```typescript
xs     // 12-14px
sm     // 14-16px
base   // 16-18px
lg     // 18-20px
xl     // 20-24px
'2xl'  // 24-30px
'3xl'  // 30-36px
'4xl'  // 36-48px
```

### Font Weights

```typescript
light      // 300
normal     // 400
medium     // 500
semibold   // 600
bold       // 700
extrabold  // 800
```

### Line Heights

```typescript
none       // 1
tight      // 1.25
snug       // 1.375
normal     // 1.5
relaxed    // 1.625
loose      // 2
```

### Component Typography

```typescript
// Buttons
buttonFontSize         // base (16-18px)
buttonFontWeight       // medium (500)
buttonLetterSpacing    // wide (0.025em)

// Card titles
cardTitleFontSize      // lg (18-20px)
cardTitleFontWeight    // semibold (600)

// Form labels
labelFontSize          // sm (14-16px)
labelFontWeight        // medium (500)

// Help text
helpTextFontSize       // xs (12-14px)
```

---

## 📦 Shadows & Depth

### Primitive Shadows

```typescript
sm    // 0 1px 2px 0 rgb(0 0 0 / 0.05)
md    // 0 4px 6px -1px rgb(0 0 0 / 0.1)
lg    // 0 10px 15px -3px rgb(0 0 0 / 0.1)
xl    // 0 20px 25px -5px rgb(0 0 0 / 0.1)
'2xl' // 0 25px 50px -12px rgb(0 0 0 / 0.25)
none  // 0 0 #0000
```

### Component Shadows

```typescript
cardShadow         // sm (light) / none (dark)
dropdownShadow     // md (light) / none (dark)
modalShadow        // xl (light) / none (dark)
```

### Dark Theme: Surface Elevation

```typescript
surfaceBase        // slate.950 (#020617)
surfaceElevated1   // slate.900 (#0F172A)
surfaceElevated2   // slate.800 (#1E293B)
surfaceElevated3   // slate.700 (#334155)
```

---

## 🔲 Border Radius

```typescript
none   // 0
sm     // 2px
md     // 6px
lg     // 8px
xl     // 12px
'2xl'  // 16px
'3xl'  // 24px
full   // 9999px (fully rounded)
```

### Component Border Radius

```typescript
button             // md (6px)
card               // lg (8px)
input              // md (6px)
badge              // full (pill)
modal              // xl (12px)
avatar             // full (circle)
statusIndicator    // full (dot)
```

---

## 🎬 Animation & Motion

### Duration (Platform-Responsive)

```typescript
// Mobile
mobile.fast        // 100ms
mobile.default     // 150ms
mobile.slow        // 200ms

// Tablet
tablet.fast        // 150ms
tablet.default     // 200ms
tablet.slow        // 300ms

// Desktop
desktop.fast       // 150ms
desktop.default    // 300ms
desktop.slow       // 500ms
```

### Easing

```typescript
default    // cubic-bezier(0.4, 0, 0.2, 1)
spring     // cubic-bezier(0.34, 1.56, 0.64, 1)
linear     // linear
```

### Framer Motion Presets

```typescript
fadeIn             // { initial: { opacity: 0 }, animate: { opacity: 1 } }
slideUp            // { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 } }
slideInFromRight   // { initial: { x: 20, opacity: 0 }, animate: { x: 0, opacity: 1 } }
scaleIn            // { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 } }
expandHeight       // { initial: { height: 0 }, animate: { height: 'auto' } }
```

### Reduced Motion

```typescript
decorative         // none (disable completely)
functional         // 50ms (reduce duration)
critical           // 0ms (instant)
```

---

## 🎯 Icons

### Icon Sizes (Platform-Responsive)

```typescript
// Size token → Mobile / Desktop
xs     // 14px / 16px
sm     // 16px / 18px
md     // 20px / 24px (default)
lg     // 24px / 28px
xl     // 32px / 40px
```

### Icon Stroke

```typescript
thin       // 1px
default    // 1.5px
thick      // 2px
```

### Icon Colors

```typescript
default    // currentColor (inherits text color)
primary    // semantic.primary
success    // semantic.success
warning    // semantic.warning
error      // semantic.error
muted      // semantic.textMuted
```

### Semantic Icon Mappings

```typescript
// Categories
'category:networking'   // lucide:wifi
'category:security'     // lucide:shield
'category:monitoring'   // lucide:activity
'category:vpn'          // lucide:key
'category:firewall'     // lucide:flame
'category:wifi'         // lucide:wifi
'category:system'       // lucide:settings

// Actions
'action:edit'           // lucide:pencil
'action:delete'         // lucide:trash-2
'action:connect'        // lucide:plug
'action:save'           // lucide:check
'action:cancel'         // lucide:x

// Status
'status:online'         // lucide:check-circle
'status:offline'        // lucide:x-circle
'status:warning'        // lucide:alert-triangle
'status:loading'        // lucide:loader
```

---

## 📱 Breakpoints

```typescript
mobile     // < 640px
tablet     // 640px - 1024px
desktop    // > 1024px
```

### Usage in Tailwind

```tsx
// Mobile-first approach
className="p-4 md:p-6 lg:p-8"  // 16px → 24px → 32px
className="text-sm md:text-base lg:text-lg"
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

---

## 🎨 Usage Examples

### Using Brand Colors

```tsx
// ✅ GOOD - Use PRIMARY brand color for main CTAs
<Button className="bg-primary text-white">Connect</Button>
<Button className="bg-primary hover:bg-primary-hover">Save</Button>

// ✅ GOOD - Use SECONDARY brand color for supporting actions
<Button className="bg-secondary text-white">Learn More</Button>
<Link className="text-secondary hover:text-secondary-hover">Documentation</Link>

// ✅ GOOD - Use semantic colors for status (NOT brand colors)
<StatusBadge status="online" /> // Uses semantic.success (green, not primary)
<Alert variant="error">Failed</Alert> // Uses semantic.error (red, not primary)

// ❌ BAD - Don't use primitive colors directly
<Button className="bg-amber-500">Connect</Button>  // Use bg-primary instead

// ❌ BAD - Don't use brand colors for status
<StatusBadge className="bg-primary" /> // Use semantic.success for "online" status
```

**Important:** 
- **PRIMARY (Golden Amber)** = Brand identity, CTAs, emphasis
- **SECONDARY (Trust Blue)** = Support actions, navigation, links
- **Semantic colors** = Status/state (success/error/warning) - NOT for branding

### Using Category Accents

```tsx
// Category-themed page header
<PageHeader category="vpn">  // Primary color = green
  VPN Configuration
</PageHeader>

<PageHeader category="security">  // Primary color = red
  Firewall Rules
</PageHeader>
```

### Platform-Responsive Sizing

```tsx
// Icon automatically sizes based on platform
<Icon name="lucide:wifi" size="md" />  // 20px mobile, 24px desktop

// Manual override
<Icon name="lucide:wifi" size="md" className="w-6 h-6" />
```

### Animation with Reduced Motion

```tsx
// Respects prefers-reduced-motion
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ 
    duration: platform === 'mobile' ? 0.15 : 0.3,
    // Automatically reduces to 0ms if user prefers reduced motion
  }}
>
  Content
</motion.div>
```

---

## 🛠️ Implementation

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Semantic colors as Tailwind utilities
        primary: 'var(--color-primary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        // ... etc
      },
      spacing: {
        // Custom spacing tokens
        'component-sm': 'var(--spacing-component-sm)',
        'component-md': 'var(--spacing-component-md)',
        // ... etc
      },
    },
  },
};
```

### CSS Variables (Runtime)

```css
:root {
  /* Primitive */
  --color-brand-amber-500: #EFC729;
  --color-green-500: #22C55E;
  
  /* Semantic */
  --color-primary: var(--color-brand-amber-500);
  --color-success: var(--color-green-500);
  
  /* Component */
  --button-primary-bg: var(--color-primary);
  --card-padding: 1.5rem;
}

[data-theme="dark"] {
  --color-bg: #020617;
  --color-surface: #0F172A;
  /* ... dark overrides */
}
```

### TypeScript Definitions

```typescript
// design-tokens.ts
export const designTokens = {
  colors: {
    primitive: { /* ... */ },
    semantic: { /* ... */ },
    component: { /* ... */ },
  },
  spacing: { /* ... */ },
  typography: { /* ... */ },
  // ... etc
} as const;

export type DesignTokens = typeof designTokens;
```

---

## 📚 Related Documentation

- [Visual Foundation](./ux-design/3-visual-foundation.md) - Complete token specifications
- [Design System Foundation](./ux-design/1-design-system-foundation.md) - Architecture
- [Component Library](./ux-design/6-component-library.md) - Component usage
- [Theme Implementation](./ux-design/THEME_IMPLEMENTATION_SUMMARY.md) - Theme system

---

## ✅ Token Naming Conventions

### Colors
- **Primitive:** `color.shade` (e.g., `blue.500`)
- **Semantic:** `purposeName` (e.g., `success`, `categorySecurity`)
- **Component:** `componentProperty` (e.g., `buttonPrimaryBg`, `cardBorder`)

### Spacing
- **Primitive:** `number` (e.g., `4`, `6`, `8`)
- **Semantic:** `contextSize` (e.g., `componentPadding.md`, `layoutGap.lg`)
- **Component:** `componentProperty` (e.g., `cardPadding`, `formFieldGap`)

### Typography
- **Primitive:** `property.value` (e.g., `fontSize.base`, `fontWeight.bold`)
- **Semantic:** `contextProperty` (e.g., `fontDisplay`, `fontBody`)
- **Component:** `componentProperty` (e.g., `buttonFontSize`, `cardTitleFontWeight`)

---

**Quick Tip:** When in doubt, use semantic tokens (Tier 2) rather than primitive tokens (Tier 1). This ensures your components adapt correctly to theme changes and category contexts.
