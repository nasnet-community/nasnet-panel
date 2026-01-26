# 3. Visual Foundation

**Last Updated:** January 20, 2026  
**Version:** 2.0  
**Design Token Count:** ~200 tokens (Primitive → Semantic → Component)

---

## 3.1 Three-Tier Color System

**Architecture:** Following W3C Design Tokens specification with three semantic layers.

### Tier 1: Primitive Color Tokens (~80 tokens)

**Foundation:** Tailwind's extended color palette with custom brand colors.

```typescript
primitiveColors = {
  // Brand colors
  brand: {
    amber: { 50: '#FFFBEB', 500: '#EFC729', 900: '#78350F' },  // Golden Amber
    blue: { 50: '#EFF6FF', 500: '#4972BA', 900: '#1E3A8A' },   // Trust Blue
  },
  
  // Semantic color bases
  green: { 50: '#F0FDF4', 500: '#22C55E', 900: '#14532D' },
  red: { 50: '#FEF2F2', 500: '#EF4444', 900: '#7F1D1D' },
  yellow: { 50: '#FEFCE8', 500: '#F59E0B', 900: '#713F12' },
  sky: { 50: '#F0F9FF', 500: '#0EA5E9', 900: '#0C4A6E' },
  
  // Category accent colors (14 feature categories)
  purple: { 50: '#FAF5FF', 500: '#A855F7', 900: '#581C87' },   // Monitoring
  cyan: { 50: '#ECFEFF', 500: '#06B6D4', 900: '#164E63' },     // WiFi
  orange: { 50: '#FFF7ED', 500: '#F97316', 900: '#7C2D12' },   // Firewall
  pink: { 50: '#FDF2F8', 500: '#EC4899', 900: '#831843' },     // QoS
  
  // Neutral grays
  slate: { 50: '#F8FAFC', 200: '#E2E8F0', 500: '#64748B', 800: '#1E293B', 900: '#0F172A', 950: '#020617' },
  
  // Pure values
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
}
```

---

### Tier 2: Semantic Color Tokens (~70 tokens)

**Purpose:** Tokens with meaning, mapped from primitives.

**Functional Semantics:**
```typescript
semanticColors = {
  // Primary actions (context-aware)
  primary: 'primitive.brand.amber.500',        // Golden Amber - empowerment
  primaryHover: 'primitive.brand.amber.600',
  primaryActive: 'primitive.brand.amber.700',
  
  // Status colors (universal meaning)
  success: 'primitive.green.500',              // Connected, healthy
  successLight: 'primitive.green.50',
  successDark: 'primitive.green.900',
  
  warning: 'primitive.yellow.500',             // Pending, degraded
  warningLight: 'primitive.yellow.50',
  warningDark: 'primitive.yellow.900',
  
  error: 'primitive.red.500',                  // Disconnected, failed
  errorLight: 'primitive.red.50',
  errorDark: 'primitive.red.900',
  
  info: 'primitive.sky.500',                   // Informational, help
  infoLight: 'primitive.sky.50',
  infoDark: 'primitive.sky.900',
  
  neutral: 'primitive.slate.500',              // Disabled, inactive
  
  // Category accent colors (14 feature categories)
  categorySecurity: 'primitive.red.600',       // Security features
  categoryMonitoring: 'primitive.purple.500',  // Monitoring/diagnostics
  categoryNetworking: 'primitive.blue.600',    // Network config
  categoryVPN: 'primitive.green.600',          // VPN features
  categoryWiFi: 'primitive.cyan.600',          // WiFi features
  categoryFirewall: 'primitive.orange.600',    // Firewall features
  categorySystem: 'primitive.slate.600',       // System settings
  categoryDHCP: 'primitive.pink.600',          // DHCP/DNS
  categoryRouting: 'primitive.indigo.600',     // Routing protocols
  categoryTunnels: 'primitive.teal.600',       // GRE, IPIP, etc.
  categoryQoS: 'primitive.pink.600',           // QoS/Traffic shaping
  categoryHotspot: 'primitive.orange.500',     // Hotspot/Captive portal
  categoryLogging: 'primitive.gray.600',       // Logs/history
  categoryBackup: 'primitive.blue.500',        // Backup/restore
}
```

**Surface & Text Semantics:**
```typescript
semanticSurfaces = {
  // Light theme
  lightBg: 'primitive.slate.50',               // #F8FAFC
  lightSurface: 'primitive.white',
  lightBorder: 'primitive.slate.200',
  lightText: 'primitive.slate.900',
  lightTextMuted: 'primitive.slate.500',
  
  // Dark theme
  darkBg: 'primitive.slate.950',               // #020617
  darkSurface: 'primitive.slate.900',
  darkBorder: 'primitive.slate.800',
  darkText: 'primitive.slate.50',
  darkTextMuted: 'primitive.slate.400',
}
```

---

### Tier 3: Component Color Tokens (~50 tokens)

**Purpose:** Specific usage in components, context-aware.

```typescript
componentColors = {
  // Buttons
  buttonPrimaryBg: 'semantic.primary',
  buttonPrimaryText: 'primitive.white',
  buttonPrimaryHover: 'semantic.primaryHover',
  
  buttonDangerBg: 'semantic.error',
  buttonDangerText: 'primitive.white',
  buttonDangerHover: 'primitive.red.600',
  
  // Cards
  cardBg: 'semantic.lightSurface',             // Light theme
  cardBgDark: 'semantic.darkSurface',          // Dark theme
  cardBorder: 'semantic.lightBorder',
  cardBorderDark: 'semantic.darkBorder',
  
  // Status badges (with live pulse)
  badgeOnline: 'semantic.success',
  badgeOffline: 'semantic.error',
  badgeWarning: 'semantic.warning',
  badgeInfo: 'semantic.info',
  
  // Navigation
  navBg: 'primitive.white',
  navBgDark: 'primitive.slate.900',
  navActive: 'semantic.primary',
  navHover: 'primitive.slate.100',
  navHoverDark: 'primitive.slate.800',
  
  // Inputs
  inputBg: 'primitive.white',
  inputBorder: 'semantic.lightBorder',
  inputFocus: 'semantic.primary',
  inputError: 'semantic.error',
  
  // Category-themed components (primary color adapts to category)
  // e.g., Security feature cards use red primary, VPN uses green primary
  categoryPrimary: 'semantic.category[currentCategory]',  // Runtime resolution
}
```

---

### Semantic Color Mental Model

**Rule 1: Semantic colors NEVER change meaning**
- `success` is always green (healthy, connected, valid)
- `error` is always red (failed, disconnected, invalid)
- `warning` is always amber (degraded, pending, caution)
- `info` is always blue (informational, help, tips)

**Rule 2: Primary color adapts to context**
- Global primary: Golden Amber (brand)
- Security pages: Red primary (danger awareness)
- VPN pages: Green primary (privacy, protection)
- Monitoring pages: Purple primary (observability)

**Rule 3: Category accents for visual identity**
- Each of 14 feature categories has a consistent accent color
- Used in page headers, icons, badges to create visual familiarity
- Users learn "purple = monitoring" subconsciously

**Implementation:**
```tsx
// Components use semantic tokens, not primitives
<Button variant="primary" /> // Uses semantic.primary
<StatusBadge status="online" /> // Uses semantic.success (always green)

// Category-aware components
<PageHeader category="vpn" /> // Primary color = green
<PageHeader category="security" /> // Primary color = red
```

---

### Emotional Mapping

| Color | Emotion | When Used | Example |
|-------|---------|-----------|---------|
| **Golden Amber** | Empowerment, Action | Primary actions, active states | "Connect VPN" button |
| **Trust Blue** | Reliability, System | Navigation, links | Sidebar, breadcrumbs |
| **Green** | Success, Health | Connected states, validation | "VPN Connected", "Form valid" |
| **Red** | Danger, Error | Failures, destructive actions | "Delete router", "Connection failed" |
| **Amber** | Caution, Pending | Warnings, in-progress | "Router restarting...", "Low disk space" |
| **Purple** | Insight, Observability | Monitoring features | Performance graphs, diagnostics |

### WCAG AAA Compliance

**Contrast Requirements:**
- **Normal text (body):** 7:1 minimum contrast ratio
- **Large text (18px+):** 4.5:1 minimum contrast ratio
- **Interactive elements:** 3:1 minimum against background

**Validation:**
- All color combinations CI-validated with axe-core
- Automated contrast checker in build pipeline
- Manual testing with color blindness simulators

**Accessible Color Pairings:**
| Foreground | Background | Ratio | WCAG Level |
|-----------|------------|-------|------------|
| slate-900 | white | 19.2:1 | AAA ✅ |
| slate-50 | slate-950 | 18.8:1 | AAA ✅ |
| green-700 | green-50 | 7.5:1 | AAA ✅ |
| red-700 | red-50 | 7.2:1 | AAA ✅ |
| amber-800 | amber-50 | 8.1:1 | AAA ✅ |

---

### Theme System Architecture

**Implementation:** Full theme objects with CSS variables at runtime

```typescript
interface Theme {
  primitive: PrimitiveTokens;  // ~80 tokens
  semantic: SemanticTokens;    // ~70 tokens
  component: ComponentTokens;  // ~50 tokens
}

const lightTheme: Theme = { /* all 200 tokens */ };
const darkTheme: Theme = { /* all 200 tokens */ };

// Applied as CSS variables
:root {
  --color-primary: #EFC729;
  --color-success: #22C55E;
  --color-bg: #F8FAFC;
  /* ... 200 variables */
}

[data-theme="dark"] {
  --color-bg: #020617;
  --color-surface: #0F172A;
  /* ... overrides */
}
```

**Theme Switching Strategy:**
1. **System preference detection** on first load
2. **User override** persisted in localStorage
3. **Flash-free hydration** (server renders correct theme)
4. **Coordinated switching:**
   - Block theme switching during critical operations (wizard, config apply)
   - Pause animations before switch
   - Apply theme with CSS transition (200ms)
   - Resume animations after repaint

**Dark Theme Philosophy:**
- Not just inverted colors - purpose-designed for late-night NOC usage
- Higher surfaces are *lighter* gray (not darker)
- Borders more prominent to define edges without shadows
- Reduced saturation for semantic colors (less eye strain)

---

## 3.2 Typography System

**Font Stack Strategy:**

```typescript
typographyTokens = {
  // Font families
  fontFamily: {
    sans: ['Inter Variable', 'system-ui', 'sans-serif'],  // UI text
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],    // Technical data
    display: ['Satoshi', 'Inter', 'sans-serif'],          // Hero headings
  },
  
  // Font sizes (Responsive with clamp())
  fontSize: {
    xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',    // 12-14px
    sm: 'clamp(0.875rem, 0.825rem + 0.25vw, 1rem)',     // 14-16px
    base: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',    // 16-18px
    lg: 'clamp(1.125rem, 1.075rem + 0.25vw, 1.25rem)',  // 18-20px
    xl: 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)',      // 20-24px
    '2xl': 'clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)', // 24-30px
    '3xl': 'clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem)',  // 30-36px
    '4xl': 'clamp(2.25rem, 1.95rem + 1.5vw, 3rem)',     // 36-48px
  },
  
  // Font weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  }
}
```

---

### Type Scale Usage

| Token | Size Range | Weight | Line Height | Usage | Example |
|-------|------------|--------|-------------|-------|---------|
| `xs` | 12-14px | Normal | Tight | Labels, metadata, timestamps | "Last updated: 2m ago" |
| `sm` | 14-16px | Normal | Normal | Secondary text, table cells | DHCP lease list |
| `base` | 16-18px | Normal | Normal | Body text, inputs, buttons | Form fields, descriptions |
| `lg` | 18-20px | Medium | Normal | Card titles, nav items | "VPN Connections" card |
| `xl` | 20-24px | Semibold | Snug | Section headers | "Network Configuration" |
| `2xl` | 24-30px | Bold | Tight | Page titles | "Dashboard" |
| `3xl` | 30-36px | Bold | Tight | Hero text, wizard welcome | "Welcome to NasNetConnect" |
| `4xl` | 36-48px | Extrabold | None | Splash, marketing | Landing page hero |

---

### Font Usage Rules

**Inter (UI Text):**
- All body text, buttons, navigation, forms
- Highly legible at small sizes
- Supports 100+ languages
- Variable font for smooth weight transitions

**JetBrains Mono (Technical Data):**
- IP addresses: `192.168.1.1`
- MAC addresses: `AA:BB:CC:DD:EE:FF`
- Log entries and terminal output
- JSON/YAML configuration snippets
- RouterOS commands
- **Why:** Monospace ensures alignment, easy to scan

**Satoshi (Display Headings):**
- H1, H2 only (page titles, major sections)
- Modern, friendly personality
- Fallback to Inter if not loaded

---

### Typography Component Tokens

```typescript
componentTypography = {
  // Buttons
  buttonFontSize: 'fontSize.base',
  buttonFontWeight: 'fontWeight.medium',
  buttonLetterSpacing: 'letterSpacing.wide',
  
  // Card titles
  cardTitleFontSize: 'fontSize.lg',
  cardTitleFontWeight: 'fontWeight.semibold',
  cardTitleLineHeight: 'lineHeight.snug',
  
  // Form labels
  labelFontSize: 'fontSize.sm',
  labelFontWeight: 'fontWeight.medium',
  labelColor: 'semantic.textMuted',
  
  // Help text
  helpTextFontSize: 'fontSize.xs',
  helpTextColor: 'semantic.textMuted',
  helpTextLineHeight: 'lineHeight.relaxed',
  
  // Code/Mono
  monoFontSize: 'fontSize.sm',
  monoLineHeight: 'lineHeight.normal',
  monoColor: 'semantic.text',
  monoBg: 'semantic.surfaceElevated',
}
```

---

## 3.3 Spacing & Layout System

**Base Unit:** 4px (`0.25rem`) - All spacing is a multiple of 4px for visual rhythm.

### Spacing Scale

```typescript
spacingTokens = {
  // Primitive spacing (Tailwind extended)
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
  },
  
  // Semantic spacing
  componentPadding: {
    sm: 'spacing.2',   // Tight components
    md: 'spacing.4',   // Standard components
    lg: 'spacing.6',   // Spacious components
  },
  
  layoutGap: {
    sm: 'spacing.4',   // List items, form fields
    md: 'spacing.6',   // Card grids
    lg: 'spacing.8',   // Page sections
  },
  
  pageMargin: {
    mobile: 'spacing.4',    // 16px
    tablet: 'spacing.6',    // 24px
    desktop: 'spacing.8',   // 32px
  },
}
```

---

### Grid System

**Responsive Columns:**
| Breakpoint | Columns | Gutter | Margin | Container Width |
|------------|---------|--------|--------|-----------------|
| **Mobile** (<640px) | 4 | 16px | 16px | 100% |
| **Tablet** (640-1024px) | 8 | 20px | 24px | 100% |
| **Desktop** (>1024px) | 12 | 24px | 32px | 1280px max |

**Grid Usage:**
- **Dashboard cards:** 12-column grid on desktop, 1 column on mobile
- **Forms:** 2-column on desktop (label + input), 1 column on mobile
- **Data tables:** Full-width, virtualized for >20 rows

---

### Component Spacing Tokens

```typescript
componentSpacing = {
  // Cards
  cardPadding: 'spacing.6',              // 24px internal padding
  cardGap: 'spacing.4',                  // 16px between card content
  
  // Buttons
  buttonPaddingX: 'spacing.4',           // 16px horizontal
  buttonPaddingY: 'spacing.2',           // 8px vertical
  buttonGap: 'spacing.2',                // 8px between icon + text
  
  // Forms
  formFieldGap: 'spacing.4',             // 16px between fields
  formLabelMargin: 'spacing.1',          // 4px below label
  formHelpTextMargin: 'spacing.1',       // 4px above help text
  
  // Navigation
  navItemPaddingX: 'spacing.4',
  navItemPaddingY: 'spacing.3',
  navItemGap: 'spacing.2',               // Between icon + text
  
  // Modal/Dialog
  modalPadding: 'spacing.6',
  modalHeaderMargin: 'spacing.4',
  
  // Page layout
  pageHeaderMargin: 'spacing.8',         // 32px below page header
  sectionGap: 'spacing.12',              // 48px between major sections
}
```

---

## 3.4 Shadows & Depth System

**Philosophy:** "Subtle Depth" - Shadows indicate lift and layer hierarchy without heavy skeuomorphism.

### Shadow Scale

```typescript
shadowTokens = {
  // Primitive shadows
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    none: '0 0 #0000',
  },
  
  // Semantic shadows (light theme)
  cardShadow: 'shadow.sm',               // Subtle lift
  dropdownShadow: 'shadow.md',           // Distinct separation
  modalShadow: 'shadow.xl',              // Focus attention
  popoverShadow: 'shadow.lg',            // Overlay clarity
  toastShadow: 'shadow.md',              // Notification lift
}
```

---

### Dark Theme Strategy

**Surface Elevation Model** (instead of shadows):
- Higher surfaces = Lighter gray
- Lower surfaces = Darker gray
- Borders more prominent to define edges

```typescript
darkSurfaces = {
  surfaceBase: 'slate.950',      // #020617 (page background)
  surfaceElevated1: 'slate.900', // #0F172A (cards)
  surfaceElevated2: 'slate.800', // #1E293B (modals, dropdowns)
  surfaceElevated3: 'slate.700', // #334155 (popovers)
}
```

**Why:** Shadows are less effective in dark mode (not enough contrast). Surface lightness creates clear visual hierarchy.

---

### Component Shadow Tokens

```typescript
componentShadows = {
  // Cards
  cardShadowLight: 'shadow.sm',
  cardShadowDark: 'none',                // Use surface elevation instead
  cardHoverShadowLight: 'shadow.md',
  cardHoverShadowDark: 'none',
  
  // Dropdowns
  dropdownShadowLight: 'shadow.md',
  dropdownShadowDark: 'none',
  
  // Modals
  modalShadowLight: 'shadow.xl',
  modalShadowDark: 'none',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',    // Both themes
  
  // Buttons (no shadow by default)
  buttonShadow: 'none',
  buttonActiveShadow: 'shadow.sm',       // Pressed state
}
```

---

## 3.5 Unified Icon System

**Architecture:** Lucide React + Custom SVGs + Semantic Mappings

### Icon Registry

```typescript
iconRegistry = {
  // Lucide icons (400+ available)
  'lucide:wifi': Wifi,
  'lucide:shield': Shield,
  'lucide:activity': Activity,
  'lucide:key': Key,
  'lucide:plug': Plug,
  'lucide:pencil': Pencil,
  'lucide:trash-2': Trash2,
  'lucide:check-circle': CheckCircle,
  'lucide:x-circle': XCircle,
  'lucide:alert-triangle': AlertTriangle,
  
  // Custom SVG icons (brand, unique concepts)
  'custom:nasnet-logo': NasNetLogoSVG,
  'custom:router-topology': RouterTopologySVG,
  'custom:virtual-interface': VirtualInterfaceSVG,
  
  // Semantic mappings (14 feature categories)
  'category:networking': 'lucide:wifi',
  'category:security': 'lucide:shield',
  'category:monitoring': 'lucide:activity',
  'category:vpn': 'lucide:key',
  'category:firewall': 'lucide:flame',
  'category:wifi': 'lucide:wifi',
  'category:system': 'lucide:settings',
  'category:dhcp': 'lucide:network',
  'category:routing': 'lucide:git-branch',
  'category:tunnels': 'lucide:pipe',
  'category:qos': 'lucide:gauge',
  'category:hotspot': 'lucide:radio',
  'category:logging': 'lucide:file-text',
  'category:backup': 'lucide:database',
  
  // Action semantics
  'action:edit': 'lucide:pencil',
  'action:delete': 'lucide:trash-2',
  'action:connect': 'lucide:plug',
  'action:disconnect': 'lucide:plug-zap',
  'action:save': 'lucide:check',
  'action:cancel': 'lucide:x',
  
  // Status semantics
  'status:online': 'lucide:check-circle',
  'status:offline': 'lucide:x-circle',
  'status:warning': 'lucide:alert-triangle',
  'status:loading': 'lucide:loader',
}
```

---

### Icon Component

**Usage:**
```tsx
// Unified icon component with platform-responsive sizing
<Icon 
  name="lucide:wifi"              // Lucide library
  // or name="custom:nasnet-logo" // Custom SVG
  // or name="category:security"  // Semantic mapping
  size="md"                        // Platform-responsive
  variant="primary"                // Themed coloring
  className="mr-2"                 // Additional Tailwind
/>
```

**Size Tokens (Platform-Responsive):**
```typescript
iconSizeTokens = {
  xs: {
    mobile: '14px',
    desktop: '16px',
  },
  sm: {
    mobile: '16px',
    desktop: '18px',
  },
  md: {
    mobile: '20px',   // Default size
    desktop: '24px',
  },
  lg: {
    mobile: '24px',
    desktop: '28px',
  },
  xl: {
    mobile: '32px',
    desktop: '40px',
  },
}
```

**Style Tokens:**
```typescript
iconStyleTokens = {
  stroke: {
    thin: '1px',
    default: '1.5px',    // Fine, precise
    thick: '2px',
  },
  
  color: {
    default: 'currentColor',     // Inherits text color
    primary: 'semantic.primary',
    success: 'semantic.success',
    warning: 'semantic.warning',
    error: 'semantic.error',
    muted: 'semantic.textMuted',
  },
}
```

---

### Icon Usage Guidelines

| Context | Size | Stroke | Color | Example |
|---------|------|--------|-------|---------|
| **Inline text** | xs-sm | default | currentColor | "Connect to VPN ⟲" |
| **Navigation items** | md | default | currentColor | Sidebar menu icons |
| **Buttons** | sm-md | default | currentColor | "Save" button icon |
| **Action icons** | md | default | primary | Edit, Delete actions |
| **Status badges** | sm | default | semantic | Online/Offline indicator |
| **Page headers** | lg | default | category accent | Section icon |
| **Empty states** | xl | thin | muted | "No data" illustration |

---

## 3.6 Border Radius & Shapes

**Border Radius Scale:**
```typescript
borderRadiusTokens = {
  none: '0',
  sm: '0.125rem',    // 2px - subtle rounding
  md: '0.375rem',    // 6px - standard cards, buttons
  lg: '0.5rem',      // 8px - larger cards, modals
  xl: '0.75rem',     // 12px - hero elements
  '2xl': '1rem',     // 16px - feature cards
  '3xl': '1.5rem',   // 24px - very prominent elements
  full: '9999px',    // Fully rounded (badges, pills)
}
```

**Component Border Radius:**
```typescript
componentBorderRadius = {
  button: 'borderRadius.md',          // 6px
  card: 'borderRadius.lg',            // 8px
  input: 'borderRadius.md',           // 6px
  badge: 'borderRadius.full',         // Pill shape
  modal: 'borderRadius.xl',           // 12px
  avatar: 'borderRadius.full',        // Circle
  statusIndicator: 'borderRadius.full', // Dot
}
```

---

## 3.7 Animation & Motion Tokens

**Platform-Aware Timing:**
```typescript
animationTokens = {
  duration: {
    mobile: {
      fast: '100ms',      // Micro-interactions
      default: '150ms',   // Standard transitions
      slow: '200ms',      // Complex animations
    },
    tablet: {
      fast: '150ms',
      default: '200ms',
      slow: '300ms',
    },
    desktop: {
      fast: '150ms',
      default: '300ms',   // Smoother on desktop
      slow: '500ms',
    },
  },
  
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Ease-in-out
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',  // Bouncy
    linear: 'linear',
  },
}
```

**Reduced Motion Support:**
```typescript
// When prefers-reduced-motion: reduce
reducedMotionAnimations = {
  decorative: 'none',        // Disable: hover effects, background pulse
  functional: '50ms',        // Reduce: expand/collapse, transitions
  critical: '0ms',           // Instant: focus indicators, loading states
}
```

**Motion Presets (Framer Motion):**
```typescript
motionPresets = {
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  slideUp: { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 } },
  slideInFromRight: { initial: { x: 20, opacity: 0 }, animate: { x: 0, opacity: 1 } },
  scaleIn: { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 } },
  expandHeight: { initial: { height: 0 }, animate: { height: 'auto' } },
}
```

---

## 3.8 Complete Token Summary

**Total Token Count:** ~200 tokens

| Tier | Category | Count | Example |
|------|----------|-------|---------|
| **Primitive** | Colors | 40 | `blue.500`, `red.900` |
| **Primitive** | Spacing | 14 | `spacing.4`, `spacing.8` |
| **Primitive** | Typography | 12 | `fontSize.base`, `fontWeight.bold` |
| **Primitive** | Shadows | 6 | `shadow.md`, `shadow.xl` |
| **Primitive** | Borders | 8 | `borderRadius.lg` |
| **Semantic** | Colors | 30 | `primary`, `success`, `categorySecurity` |
| **Semantic** | Spacing | 10 | `componentPadding.md`, `layoutGap.lg` |
| **Semantic** | Typography | 12 | `labelFontSize`, `cardTitleFontWeight` |
| **Semantic** | Surfaces | 8 | `lightBg`, `darkSurface` |
| **Component** | Colors | 20 | `buttonPrimaryBg`, `navActive` |
| **Component** | Spacing | 15 | `cardPadding`, `formFieldGap` |
| **Component** | Shadows | 10 | `cardShadow`, `modalShadow` |
| **Component** | Shapes | 8 | `buttonBorderRadius` |
| **Component** | Icons | 7 | `iconSizeMd`, `iconStrokeDefault` |

**Implementation Files:**
- `tailwind.config.js` - Primitive tokens (Tailwind extended config)
- `design-tokens.ts` - Semantic + Component tokens (TypeScript definitions)
- `theme.css` - CSS variables (runtime theme switching)

---
