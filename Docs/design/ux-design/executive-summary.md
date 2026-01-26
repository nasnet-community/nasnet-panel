# Executive Summary

**Project:** NasNetConnect UX Design Specification  
**Version:** 2.0 (Comprehensive Architecture Update)  
**Date:** January 20, 2026  
**Aligned with:** Product Brief v4.0, PRD v1.1, Brainstorming Sessions (Jan 2026)

---

## Vision & Core Promise

**Transform MikroTik router management** from a daunting technical challenge into a reliable, confidence-building experience. The platform eliminates the fear of network configuration by hiding underlying complexity behind intent-based interfaces while ensuring that no configuration change can accidentally take down a network.

**Core Promise:** Every configuration change is validated, previewed, and reversible.

**Unique Innovation:** Virtual Interface Factory (VIF) - Network services (Tor, VPN, MTProxy) become native router interfaces with 3-click per-device routing.

**Target Users:** 
1.  **The Capable Non-Expert:** Small business owners/home power users. They have goals (VPN, Guest WiFi) but fear breaking the network.
2.  **The Efficient Pro:** Sysadmins who want a mobile-friendly, faster way to manage fleets.

**What Users Value:**
- **Confidence:** Knowing they won't break connectivity.
- **Speed:** 1-click actions vs 15 clicks in WinBox.
- **Clarity:** "Internet is Slow" vs "Ether1 RX Drop".
- **Recovery:** 10-second undo window for everything.

**Unique Constraint:** Application runs as Docker container ON the MikroTik router itself (<10MB image, <50MB RAM, works offline).

## Platform Strategy
**Adaptive layouts** that shift paradigms based on device:
*   **Mobile:** Consumer-grade simplicity, bottom nav, quick actions.
*   **Desktop:** Pro-grade density, sidebar, data tables, keyboard shortcuts.

## Emotional Signature
- **Empowered:** "I did that myself."
- **Safe:** "It's okay to try this, I can undo it."
- **Professional:** "This is a serious tool, not a toy."

## Core Experience
- **Intent-Based:** Ask *what* (Route Netflix via VPN), not *how* (Mangle rule src-address-list).
- **Invisible Safety:** All changes pass through a validation → diff → apply → confirm pipeline.
- **Hybrid Real-time:** Live status where it matters (VPN, Interfaces), cached data where it doesn't.

---

## Design System Architecture

**Three-Layer Component Hierarchy:**
- **Layer 1: Primitives** - 40 components (shadcn/ui + Radix)
- **Layer 2: Patterns** - 56 components (30 common + 26 domain)
- **Layer 3: Domain** - 60+ feature-specific components

**Design Token System:**
- **200+ tokens** in three tiers (Primitive → Semantic → Component)
- **Platform-responsive** sizing and timing
- **WCAG AAA compliant** color pairings (7:1 contrast)
- **Theme system** with CSS variables for runtime switching

**Key Architectural Patterns:**
1. **Headless + Platform Presenters** - Write logic once, render optimally on mobile/tablet/desktop
2. **Form Field Modes** - 4 modes (editable/readonly/hidden/computed) handle all form scenarios
3. **Virtual Interface Factory** - Transform network services into native router interfaces
4. **Safety Pipeline** - 5-stage validation (Zod → Dry Run → Impact Analysis → Diff → Apply → Undo)
5. **Hybrid Real-Time** - WebSocket subscriptions for critical data, polling for non-critical

---

## Component Catalog

**Primitives (40):**
Forms (9), Display (6), Overlay (6), Navigation (7), Layout (6), Data (6)

**Common Patterns (30):**
- Forms (6): ResourceForm, WizardStep, FieldGroup, ConfigurationPreview, BulkEditForm, ImportExportForm
- Displays (7): ResourceCard, StatusBadge, MetricDisplay, InfoPanel, ConnectionIndicator, HealthScore, DependencyGraph
- Data (6): DataTable, Chart, LogViewer, Timeline, StatisticsPanel, ComparisonView
- Navigation (5): Sidebar, TabBar, Breadcrumb, CommandPalette, QuickActions
- Feedback (6): Alert, ConfirmDialog, ProgressTracker, Toast, LoadingSkeleton, EmptyState

**Domain Patterns (26):**
- Networking (10): VPNProviderSelector, NetworkTopology, InterfaceStatusGrid, WANFailoverConfig, etc.
- Security (6): FirewallRuleEditor, AddressListManager, NATRuleBuilder, etc.
- Monitoring (6): TrafficChart, DiagnosticToolPanel, DeviceDiscoveryTable, etc.
- Feature Marketplace (4): FeatureCard, InstallWizard, FeatureInstanceManager, DependencyResolver

---

## User Experience Principles

**Adaptive Complexity:**
- **Novice (Wizard Easy):** Consumer-grade simplicity, 3-5 choices, mobile-first
- **Prosumer (Dashboard Easy):** One-click actions, visual feedback, tablet/desktop
- **Expert (Power Advanced):** Dense data tables, keyboard shortcuts, TUI for SSH

**Novel UX Patterns:**
1. **Virtual Interface Factory** - 3-click per-device routing through network services
2. **Intent-Based Configuration** - "Fix slow internet" vs "Set MSS clamping to 1400"
3. **Invisible Safety Pipeline** - Multi-stage validation prevents network breakage
4. **Progressive Disclosure** - Simple by default, complexity on demand
5. **Hybrid Real-Time** - Live updates for critical data, efficient polling for rest

**Emotional Design:**
- **Empowered:** "I did that myself"
- **Safe:** "It's okay to try this, I can undo it"
- **Professional:** "This is a serious tool, not a toy"

---

## Technical Foundation

**Stack:**
- React 18+ / TypeScript 5+ / Vite 5+
- Tailwind CSS 3.4+ / shadcn/ui / Radix UI
- TanStack Query 5 / Zustand 4 / XState 5 (state management)
- TanStack Router / TanStack Table / TanStack Virtual
- React Hook Form 7 / Zod 3 (forms & validation)
- Framer Motion 11+ / Sonner (animations & toasts)

**Bundle Targets:**
- Initial: <250KB gzipped
- Per route: ~150KB initial, ~90KB per route
- Heavy components lazy-loaded (Chart ~50KB, Topology ~30KB)

**Performance Targets:**
- LCP < 2.5s
- FCP < 1.5s
- TTI < 3.5s
- CLS < 0.1

**Testing:**
- Five-layer pyramid: Unit (Vitest) → Component (RTL) → Storybook Play → Visual (Chromatic) → E2E (Playwright + axe-core)
- ~450 Storybook stories across all components
- WCAG AAA automated validation in CI

---

## Inspiration & Best Practices

**Analyzed from:** UniFi, Tailscale, Home Assistant, Linear, VS Code

| Pattern | Source | Application in NasNetConnect |
|---------|--------|------------------------------|
| **Card-based UI** | UniFi | Scannable summary cards for each subsystem |
| **Adaptive Navigation** | Linear | Sidebar (Desktop) vs Bottom Bar (Mobile) |
| **Status Pills** | Tailscale | Unified badges with live pulse animation |
| **Safety Gates** | UniFi | Multi-step confirmation for dangerous actions |
| **Visual Diffs** | VS Code | Show what will change before applying |
| **Dark Mode** | Linear | First-class citizen for NOC/late-night usage |
| **Command Palette** | VS Code | Cmd+K for instant navigation |
| **Headless Components** | TanStack | Separation of logic from presentation |

---

## Implementation Status

**Design Documentation:** ✅ Complete (v2.0)
- Design System Foundation - Updated with 200+ token system
- Core User Experience - 5 novel UX patterns documented
- Visual Foundation - Three-tier token architecture
- Component Library - 56 patterns cataloged with presenters
- User Journey Flows - 9 critical flows mapped
- UX Pattern Decisions - Consistency rules defined
- Responsive Design & Accessibility - WCAG AAA compliance
- Implementation Guidance - Stack and workflow defined

**Next Steps:**
1. Storybook setup with custom addons
2. First 10 common patterns implementation
3. Design token TypeScript definitions
4. Platform presenter templates
5. Visual regression testing with Chromatic

---

## Key Metrics

| Metric | Value |
|--------|-------|
| **Design Tokens** | ~200 (3-tier system) |
| **Components** | 150+ (40 primitives + 56 patterns + 60+ domain) |
| **Storybook Stories** | ~450 planned |
| **Supported Platforms** | 3 (Mobile, Tablet, Desktop) |
| **Accessibility Level** | WCAG 2.1 AAA |
| **Language Support** | 10+ languages + RTL |
| **Theme Support** | Light + Dark (first-class) |
| **Feature Categories** | 14 categories |
| **Total Features** | 120+ across all categories |
