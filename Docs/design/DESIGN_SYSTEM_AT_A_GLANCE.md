# Design System At-A-Glance

**Quick visual reference for NasNetConnect design system**  
**Version:** 2.0 | **Date:** January 20, 2026

---

## 🎨 Colors

### Brand Colors
```
Primary:   ██████  Golden Amber (#EFC729)
Secondary: ██████  Trust Blue (#4972BA)
```

### Semantic Colors
```
Success:   ██████  Green (#22C55E)   - Online, Connected, Valid
Warning:   ██████  Amber (#F59E0B)   - Pending, Degraded
Error:     ██████  Red (#EF4444)     - Offline, Failed, Invalid
Info:      ██████  Blue (#0EA5E9)    - Help, Tips
```

### Category Accents (14 Categories)
```
Security:    ██████  Red (#DC2626)
Monitoring:  ██████  Purple (#A855F7)
Networking:  ██████  Blue (#2563EB)
VPN:         ██████  Green (#16A34A)
WiFi:        ██████  Cyan (#06B6D4)
Firewall:    ██████  Orange (#F97316)
System:      ██████  Gray (#64748B)
DHCP:        ██████  Pink (#EC4899)
Routing:     ██████  Indigo (#6366F1)
Tunnels:     ██████  Teal (#14B8A6)
QoS:         ██████  Pink (#EC4899)
Hotspot:     ██████  Orange (#F97316)
Logging:     ██████  Gray (#6B7280)
Backup:      ██████  Blue (#3B82F6)
```

---

## ✍️ Typography

```
Font Stack:
- UI Text:        Inter Variable
- Technical Data: JetBrains Mono
- Headings:       Satoshi

Sizes (Responsive):
xs    12-14px   Labels, metadata
sm    14-16px   Secondary text
base  16-18px   Body text, inputs
lg    18-20px   Card titles
xl    20-24px   Section headers
2xl   24-30px   Page titles
3xl   30-36px   Hero text
```

---

## 📐 Spacing (Base: 4px)

```
0     0
1     4px    Tight
2     8px    Compact
3     12px
4     16px   Standard gap
5     20px
6     24px   Card padding
8     32px   Section margin
10    40px
12    48px
16    64px
20    80px   Large sections
```

---

## 🧩 Component Layers

```
┌─────────────────────────────────────────────────┐
│  Layer 3: DOMAIN (60+ components)               │
│  ┌───────────────────────────────────────────┐  │
│  │ VPNProviderSelector                        │  │
│  │ NetworkTopologyGraph                       │  │
│  │ FirewallRuleEditor                         │  │
│  │ VirtualInterfaceBridge                     │  │
│  └───────────────────────────────────────────┘  │
│                    ↓ uses                        │
│  Layer 2: PATTERNS (56 components)              │
│  ┌───────────────────────────────────────────┐  │
│  │ Common (30): ResourceCard, ConfigForm,    │  │
│  │   StatusBadge, DataTable, WizardStep...   │  │
│  │                                            │  │
│  │ Domain (26): VPNProviderSelector,         │  │
│  │   FirewallRuleEditor, TrafficChart...     │  │
│  └───────────────────────────────────────────┘  │
│                    ↓ uses                        │
│  Layer 1: PRIMITIVES (40 components)            │
│  ┌───────────────────────────────────────────┐  │
│  │ shadcn/ui + Radix UI                       │  │
│  │ Button, Card, Input, Dialog, Table...     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 📱 Platform Presenters

### Mobile (<640px)
```
┌──────────────────┐
│  ☰  NasNetConnect│  Header + Menu
├──────────────────┤
│                  │
│  [Resource Card] │  Single column
│  [Resource Card] │  Tap to expand
│  [Resource Card] │  Large touch targets (44px)
│                  │
│                  │
├──────────────────┤
│ [H] [V] [M] [S] │  Bottom Tab Bar
└──────────────────┘
```

### Tablet (640-1024px)
```
┌────────────────────────────────┐
│  ☰  NasNetConnect       [User] │  Top Bar
├────┬───────────────────────────┤
│ S  │                           │
│ i  │  [Card] [Card]            │  2-column grid
│ d  │  [Card] [Card]            │  Collapsible details
│ e  │                           │
│ b  │                           │
│ a  │                           │
│ r  │                           │
└────┴───────────────────────────┘
```

### Desktop (>1024px)
```
┌───┬────────────────────────────────┬───┐
│   │  NasNetConnect         [User]  │   │  Top Bar
├───┼────────────────────────────────┼───┤
│ S │                                │ D │
│ i │  [Card]  [Card]  [Card]        │ e │  3-column grid
│ d │  [Card]  [Card]  [Card]        │ t │  All actions visible
│ e │                                │ a │  Dense info display
│ b │  [Data Table with 8 columns]   │ i │
│ a │                                │ l │  Detail panel (opt)
│ r │                                │   │
└───┴────────────────────────────────┴───┘
```

---

## 🎭 Novel UX Patterns

### 1. Virtual Interface Factory (VIF)
```
Install Service → Auto-creates Interface → Route Devices
   (Tor)            (nnc-tor-usa)           (3 clicks)
```

### 2. Safety Pipeline (5 Stages)
```
Zod → Dry Run → Impact → Diff → Apply → Undo (10s)
 ✓      ✓         ⚠️       👁️      ⏳      ↶
```

### 3. Progressive Disclosure
```
Essential (3-5 fields)
  ↓ [Show more ▼]
Common (6-10 fields)
  ↓ [Advanced ⚙️]
Expert (15-20 fields)
  ↓ [Raw config →]
Full RouterOS access
```

### 4. Adaptive Complexity
```
Wizard Easy    → Dashboard Easy    → Power Easy
     ↓               ↓                  ↓
Wizard Advanced → Dashboard Advanced → Power Advanced

Novice ←──────────────────────────────→ Expert
```

---

## 📊 Pattern Component Catalog

### Common Patterns (30)

**Forms (6):**
ResourceForm • WizardStep • FieldGroup • ConfigurationPreview • BulkEditForm • ImportExportForm

**Displays (7):**
ResourceCard • StatusBadge • MetricDisplay • InfoPanel • ConnectionIndicator • HealthScore • DependencyGraph

**Data (6):**
DataTable • Chart • LogViewer • Timeline • StatisticsPanel • ComparisonView

**Navigation (5):**
Sidebar • TabBar • Breadcrumb • CommandPalette • QuickActions

**Feedback (6):**
Alert • ConfirmDialog • ProgressTracker • Toast • LoadingSkeleton • EmptyState

---

### Domain Patterns (26)

**Networking (10):**
VPNProviderSelector • NetworkTopology • InterfaceStatusGrid • WANFailoverConfig • SubnetCalculator • DHCPLeaseTable • TunnelConnectionFlow • VLANTaggingEditor • WireGuardPeerManager • BridgePortManager

**Security (6):**
FirewallRuleEditor • AddressListManager • NATRuleBuilder • SecurityProfileSelector • CertificateManager • AccessControlMatrix

**Monitoring (6):**
TrafficChart • DiagnosticToolPanel • DeviceDiscoveryTable • AlertRuleBuilder • PerformanceMetricsGrid • LogStreamViewer

**Marketplace (4):**
FeatureCard • InstallWizard • FeatureInstanceManager • DependencyResolver

---

## 🎯 Token System (200+ tokens)

```
Tier 1: PRIMITIVE (~80 tokens)
   Raw values: colors, spacing, typography
   Example: blue.500, spacing.4, fontSize.base
   ↓
Tier 2: SEMANTIC (~70 tokens)
   Meaning: success, primary, categoryAccent
   Example: colorSuccess, spacingComponentMd
   ↓
Tier 3: COMPONENT (~50 tokens)
   Usage: buttonPrimaryBg, cardPadding
   Example: buttonPrimaryBg, cardBorderRadius
```

---

## 🔑 Key Principles

### 1. Patterns-First
```
Requirement → Check Catalog → Use Existing OR Abstract New Pattern
```

### 2. Headless + Presenters
```
Logic (Hook) → Platform Detection → Render (Presenter)
Write once       Auto or manual      Optimal per device
```

### 3. Safety-First
```
All Config Changes → Validation → Preview → Confirm → Undo Window
```

### 4. Progressive Disclosure
```
Simple by default → Reveal complexity on demand
```

### 5. Adaptive Complexity
```
UI expands to meet user's expertise level
```

---

## 📏 Accessibility (WCAG AAA)

```
✅ 7:1 contrast ratio (normal text)
✅ 44px minimum touch targets
✅ Full keyboard navigation
✅ Screen reader support
✅ Reduced motion support
✅ Focus indicators (3px ring)
```

---

## 🚀 Performance Targets

```
Initial Bundle:  <250KB gzipped
Per Route:       ~150KB → ~90KB
LCP:             <2.5s
FCP:             <1.5s
TTI:             <3.5s
CLS:             <0.1
```

---

## 🛠️ Tech Stack

### Core
React 18+ • TypeScript 5+ • Vite 5+

### Styling
Tailwind CSS 3.4+ • shadcn/ui • Radix UI

### State
TanStack Query 5 • Zustand 4 • XState 5

### Forms
React Hook Form 7 • Zod 3

### Data
TanStack Table 8 • TanStack Virtual 3

### UX
Framer Motion 11+ • Sonner • cmdk

---

## 📚 Quick Links

**Start Here:**
- [README](./README.md) - Navigation guide
- [Executive Summary](./ux-design/executive-summary.md) - High-level overview

**Developers:**
- [Design Tokens Reference](./DESIGN_TOKENS.md) - Token cheat sheet
- [Component Library](./ux-design/6-component-library.md) - All patterns
- [Implementation Checklist](./IMPLEMENTATION_CHECKLIST.md) - Feature checklist
- [Platform Presenter Guide](./PLATFORM_PRESENTER_GUIDE.md) - Pattern guide
- [Component Template](./COMPONENT_PATTERN_TEMPLATE.md) - New pattern template

**Designers:**
- [Visual Foundation](./ux-design/3-visual-foundation.md) - Colors, typography
- [Core User Experience](./ux-design/2-core-user-experience.md) - UX patterns
- [Design Direction](./ux-design/4-design-direction.md) - Design choices

---

## 🎯 Golden Rules

1. **Use patterns, not custom components**
2. **Use semantic tokens, not primitives**
3. **Test on all 3 platforms**
4. **WCAG AAA is non-negotiable**
5. **Document everything**

---

**Print this page** and keep it on your desk for quick reference! 📌
