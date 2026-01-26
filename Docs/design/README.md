# NasNetConnect Design System

**Version:** 2.0  
**Last Updated:** January 20, 2026  
**Status:** Production-Ready

---

## 🚀 Quick Start

**For Designers:**
- Start with [Executive Summary](./ux-design/executive-summary.md) for overview
- Review [Visual Foundation](./ux-design/3-visual-foundation.md) for colors, typography, spacing
- Browse [Component Library](./ux-design/6-component-library.md) for UI patterns

**For Developers:**
- Start with [Design System Foundation](./ux-design/1-design-system-foundation.md) for architecture
- Review [Implementation Guidance](./ux-design/9-implementation-guidance.md) for tech stack
- Use [Design Tokens Reference](./DESIGN_TOKENS.md) for implementation

**For Product Managers:**
- Start with [Executive Summary](./ux-design/executive-summary.md)
- Review [Core User Experience](./ux-design/2-core-user-experience.md) for UX patterns
- Check [User Journey Flows](./ux-design/5-user-journey-flows.md) for critical paths

---

## 📁 Documentation Structure

```
design/
├── README.md                           # This file - navigation guide
├── DESIGN_UPDATE_SUMMARY.md           # Complete update changelog
├── DESIGN_TOKENS.md                   # Quick token reference
├── COMPONENT_PATTERN_TEMPLATE.md      # Template for new patterns
│
└── ux-design/                         # Complete UX specifications
    ├── index.md                       # Table of contents
    ├── executive-summary.md           # High-level overview
    │
    ├── 1-design-system-foundation.md  # Architecture & tokens
    ├── 2-core-user-experience.md      # UX patterns & flows
    ├── 3-visual-foundation.md         # Colors, typography, spacing
    ├── 4-design-direction.md          # Design direction choices
    ├── 5-user-journey-flows.md        # User flow diagrams
    ├── 6-component-library.md         # 56 pattern catalog
    ├── 7-ux-pattern-decisions.md      # Consistency rules
    ├── 8-responsive-design-accessibility.md  # Responsive & a11y
    ├── 9-implementation-guidance.md   # Tech stack & workflow
    │
    ├── appendix.md                    # Related docs & decisions
    ├── validation-report-2026-01-20.md  # Quality validation
    │
    ├── DESIGN_TOKENS.md               # Token reference (copy)
    ├── THEME_IMPLEMENTATION_SUMMARY.md  # Theme system guide
    │
    ├── ux-color-themes.html           # Interactive color preview
    └── ux-design-directions.html      # Interactive design mockups
```

---

## 🎨 Design System Overview

### Components
- **Primitives:** 40 components (shadcn/ui + Radix)
- **Patterns:** 56 components (30 common + 26 domain)
- **Domain:** 60+ feature-specific components

### Design Tokens
- **Total:** ~200 tokens
- **Structure:** Primitive → Semantic → Component (3 tiers)
- **Implementation:** Tailwind config + CSS variables

### Platforms
- **Mobile:** <640px (Bottom nav, compact cards)
- **Tablet:** 640-1024px (Collapsible sidebar, balanced density)
- **Desktop:** >1024px (Full sidebar, dense tables, keyboard shortcuts)

### Accessibility
- **Target:** WCAG 2.1 AAA
- **Contrast:** 7:1 for normal text
- **Touch Targets:** 44px minimum
- **Testing:** axe-core + manual validation

---

## 🔑 Key Concepts

### 1. Headless + Platform Presenters
All 56 pattern components follow this architecture:
- **Headless Hook:** Behavior logic (written once)
- **Platform Presenters:** Mobile/Tablet/Desktop (optimal per device)
- **Benefit:** Write logic once, render optimally everywhere

### 2. Three-Tier Token System
```
Primitive Tokens (~80)     Raw values (colors, spacing)
    ↓
Semantic Tokens (~70)      Meaning (success, primary, categoryAccent)
    ↓
Component Tokens (~50)     Specific usage (buttonPrimaryBg, cardPadding)
```

### 3. Form Field Modes
All forms support 4 modes:
- **editable:** User inputs (standard fields)
- **readonly:** Display only (UUID, status)
- **hidden:** Auto-filled from context (router ID, user ID)
- **computed:** Derived values (total bandwidth, IP range)

### 4. Virtual Interface Factory (VIF)
Network services (Tor, VPN, MTProxy) become native router interfaces:
1. Install service
2. Interface auto-appears (e.g., `nnc-tor-usa`)
3. Route devices with 3 clicks
4. No manual VLAN configuration

### 5. Safety Pipeline
All config changes go through 5 stages:
1. **Zod Validation:** Instant client-side validation
2. **Dry Run:** Backend conflict detection
3. **Impact Analysis:** Show affected resources
4. **Visual Diff:** Before/after preview
5. **Apply → Undo:** 10-second undo window

---

## 📖 Common Tasks

### Finding a Component

**Q: "I need a card for displaying VPN connections"**

1. Check [Component Library](./ux-design/6-component-library.md)
2. Look in **Common Patterns → Displays**
3. Find: `ResourceCard<T>` - Generic card for any resource
4. Or check **Domain Patterns → Networking**
5. Find: `VPNConnectionCard` - VPN-specific extension

### Understanding a Design Token

**Q: "What is `semantic.colorCategorySecurity`?"**

1. Check [Design Tokens Reference](./DESIGN_TOKENS.md)
2. Or check [Visual Foundation](./ux-design/3-visual-foundation.md) → Three-Tier Color System
3. Find: `categorySecurity: 'primitive.red.600'` (Red accent for security features)

### Implementing a User Flow

**Q: "How should the first-time setup flow work?"**

1. Check [User Journey Flows](./ux-design/5-user-journey-flows.md)
2. Find: **Journey 1: First-Time Setup (Wizard)**
3. See: Mermaid diagram + detailed screen descriptions
4. Implement: Using `WizardStep` pattern from Component Library

### Creating a New Pattern

**Q: "I need a new pattern component for X"**

1. Check [Component Pattern Template](./COMPONENT_PATTERN_TEMPLATE.md)
2. Follow the template structure
3. Implement headless hook + 3 presenters
4. Add Storybook stories (~5-8 stories)
5. Write tests (unit + component + E2E)

---

## 🎯 Design Principles

### 1. Patterns-First Philosophy
- All UI must be built as reusable patterns first
- No feature-specific components until patterns are abstracted
- Ensures consistency across all features

### 2. Progressive Disclosure
- Simple by default, complexity on demand
- Essential → Common → Advanced → Expert modes
- Adapts to user expertise level

### 3. Safety-First Design
- Every config change is validated, previewed, reversible
- Multi-stage validation prevents network breakage
- 10-second undo window for all changes

### 4. Adaptive Complexity
- Interface expands to meet user's expertise
- Novice: Consumer-grade simplicity
- Expert: Pro-grade density and keyboard shortcuts

### 5. Emotional Design
- **Empowered:** "I did that myself"
- **Safe:** "It's okay to try this, I can undo it"
- **Professional:** "This is a serious tool, not a toy"

---

## 🔧 Development Workflow

### 1. Setup Environment
```bash
# Install dependencies
npm install

# Start Storybook
npm run storybook

# Run tests
npm run test

# Run accessibility tests
npm run test:a11y
```

### 2. Implement Pattern Component

**File Structure:**
```
libs/ui/patterns/common/resource-card/
├── ResourceCard.tsx              # Main component
├── useResourceCard.ts            # Headless hook
├── ResourceCard.Mobile.tsx       # Mobile presenter
├── ResourceCard.Tablet.tsx       # Tablet presenter
├── ResourceCard.Desktop.tsx      # Desktop presenter
├── ResourceCard.test.tsx         # Tests
├── ResourceCard.stories.tsx      # Storybook
└── index.ts                      # Exports
```

### 3. Testing Requirements

**Five-Layer Pyramid:**
1. **Unit tests (Vitest)** - Test headless hook
2. **Component tests (RTL)** - Test presenters
3. **Storybook Play** - Interaction testing
4. **Visual regression (Chromatic)** - Screenshot comparison
5. **E2E (Playwright + axe-core)** - Critical flows + accessibility

### 4. Documentation

Each pattern component needs:
- Description & when to use
- Props table with types
- 5-8 Storybook stories
- Platform presenter notes
- Accessibility notes

---

## 🎨 Design Assets

### Interactive Previews
- [Color Themes Preview](./ux-design/ux-color-themes.html) - Interactive color system
- [Design Directions](./ux-design/ux-design-directions.html) - Design mockups

### Design Tokens
- [Complete Token Reference](./DESIGN_TOKENS.md) - All 200+ tokens
- [Theme Implementation](./ux-design/THEME_IMPLEMENTATION_SUMMARY.md) - Theme system guide

### Component Catalog
- [Component Library](./ux-design/6-component-library.md) - All 56 patterns
- [Pattern Template](./COMPONENT_PATTERN_TEMPLATE.md) - Template for new patterns

---

## 📊 Metrics & Targets

### Bundle Size
- **Initial:** <250KB gzipped
- **Per route:** ~150KB initial, ~90KB per route
- **Heavy components:** Lazy loaded (Chart ~50KB, Topology ~30KB)

### Performance
- **LCP:** <2.5s (Largest Contentful Paint)
- **FCP:** <1.5s (First Contentful Paint)
- **TTI:** <3.5s (Time to Interactive)
- **CLS:** <0.1 (Cumulative Layout Shift)

### Accessibility
- **Target:** WCAG 2.1 AAA
- **Contrast:** 7:1 for normal text, 4.5:1 for large text
- **Touch targets:** 44×44px minimum
- **Keyboard:** All functions accessible via keyboard

### Quality
- **Storybook stories:** ~450 across all components
- **Test coverage:** >80% for pattern components
- **Visual regression:** Automated via Chromatic
- **A11y testing:** axe-core in all E2E tests

---

## 🤝 Contributing

### Adding a New Pattern Component

1. **Propose Pattern**
   - Check if existing pattern can be extended
   - Document use case and rationale
   - Get approval from design team

2. **Implement**
   - Use [Component Pattern Template](./COMPONENT_PATTERN_TEMPLATE.md)
   - Follow headless + presenter architecture
   - Implement for all 3 platforms

3. **Test**
   - Write unit tests for headless hook
   - Write component tests for presenters
   - Create Storybook stories (~5-8)
   - Run visual regression tests
   - Test accessibility with axe-core

4. **Document**
   - Add to [Component Library](./ux-design/6-component-library.md)
   - Write usage documentation
   - Create examples in Storybook

5. **Review**
   - Code review
   - Design review
   - Accessibility review

---

## 📚 Additional Resources

### Internal Documentation
- [Product Brief](../product-brief/index.md) - Product vision
- [PRD](../prd/index.md) - Detailed requirements
- [Architecture](../architecture/) - Technical architecture
- [Brainstorming Sessions](../brainstorming-sessions/) - Design explorations

### External References
- [shadcn/ui](https://ui.shadcn.com/) - Base component library
- [Radix UI](https://www.radix-ui.com/) - Accessible primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility CSS
- [TanStack](https://tanstack.com/) - Data fetching, routing, tables
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - Accessibility guidelines

---

## 🆘 Getting Help

**Questions about:**
- **Design tokens?** → Check [Design Tokens Reference](./DESIGN_TOKENS.md)
- **Components?** → Check [Component Library](./ux-design/6-component-library.md)
- **User flows?** → Check [User Journey Flows](./ux-design/5-user-journey-flows.md)
- **Implementation?** → Check [Implementation Guidance](./ux-design/9-implementation-guidance.md)
- **Accessibility?** → Check [Responsive & Accessibility](./ux-design/8-responsive-design-accessibility.md)

**Still need help?**
- Review [Design Update Summary](./DESIGN_UPDATE_SUMMARY.md) for comprehensive overview
- Contact UX Designer for design questions
- Contact Frontend Architect for technical questions

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| **2.0** | Jan 20, 2026 | Comprehensive update - 200+ tokens, 56 patterns, 5 novel UX patterns |
| 1.1 | Jan 15, 2026 | Aligned with Product Brief v4.0 |
| 1.0 | Dec 2025 | Initial design specification |

---

**Status:** ✅ Production-Ready - Ready for Development

The design system is complete, validated, and ready for implementation. All architectural decisions are documented, all patterns are specified, and all tokens are defined.

**Let's build something amazing! 🚀**
