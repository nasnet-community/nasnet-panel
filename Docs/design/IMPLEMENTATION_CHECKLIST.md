# Design System Implementation Checklist

**Version:** 2.0  
**Last Updated:** January 20, 2026

Use this checklist to ensure your feature implementation follows NasNetConnect design system guidelines.

---

## 🎯 Before You Start

### Planning
- [ ] Reviewed [User Journey Flows](./ux-design/5-user-journey-flows.md) for this feature
- [ ] Identified which pattern components to use
- [ ] Checked [Component Library](./ux-design/6-component-library.md) catalog
- [ ] Verified no new pattern components are needed
- [ ] Understood field modes (editable/readonly/hidden/computed) for forms

### Design Tokens
- [ ] Reviewed [Design Tokens Reference](./DESIGN_TOKENS.md)
- [ ] Understand semantic vs primitive tokens
- [ ] Know category accent color for this feature
- [ ] Understand platform-responsive sizing

---

## 🎨 Visual Implementation

### Colors
- [ ] Using semantic tokens (NOT primitive colors directly)
  - ✅ `className="bg-primary"` 
  - ❌ `className="bg-amber-500"`
- [ ] Status colors are correct
  - Green = Success/Online/Healthy
  - Red = Error/Offline/Failed
  - Amber = Warning/Pending/Degraded
  - Blue = Info/Help
- [ ] Category accent applied to page header
- [ ] All text has 7:1 contrast ratio (WCAG AAA)
- [ ] Dark mode colors tested

### Typography
- [ ] Using correct font families
  - Inter for UI text
  - JetBrains Mono for IPs, MACs, logs, code
  - Satoshi for H1/H2 headings
- [ ] Font sizes use responsive scale (clamp)
- [ ] Line heights appropriate for readability
- [ ] Text is legible at 200% zoom

### Spacing
- [ ] All spacing uses 4px base unit
- [ ] Using semantic spacing tokens
  - `componentPadding.md` for cards
  - `layoutGap.lg` for sections
  - `formFieldGap` for form fields
- [ ] Consistent padding across similar components
- [ ] Proper margin collapse handling

### Icons
- [ ] Using unified `<Icon>` component (not direct Lucide imports)
- [ ] Icon sizes are platform-responsive
- [ ] Icons have semantic mappings where appropriate
- [ ] Icon stroke is 1.5px (default)

---

## 🧩 Component Usage

### Pattern Components
- [ ] Using existing pattern components (NOT building custom)
- [ ] Pattern component layer is correct
  - Layer 1: Primitives (shadcn/ui)
  - Layer 2: Patterns (common/domain)
  - Layer 3: Domain (feature-specific)
- [ ] Not duplicating pattern logic
- [ ] Composition preferred over customization

### Platform Presenters
- [ ] Pattern components auto-detect platform (no manual override unless needed)
- [ ] Mobile presenter: Compact, large touch targets
- [ ] Tablet presenter: Balanced density
- [ ] Desktop presenter: Full density, keyboard-optimized
- [ ] Tested on all 3 platforms

### Form Components
- [ ] Using `ConfigForm` or `ResourceForm` pattern
- [ ] Field modes are correct
  - editable: User inputs
  - readonly: Display only
  - hidden: Auto-filled from context
  - computed: Derived values
- [ ] Zod validation schema defined
- [ ] React Hook Form integrated
- [ ] Error messages are clear and actionable

---

## ♿ Accessibility (WCAG AAA)

### Keyboard Navigation
- [ ] All interactive elements keyboard accessible
- [ ] Logical tab order (top-to-bottom, left-to-right)
- [ ] Focus indicators visible (3px ring)
- [ ] Escape key closes modals/dropdowns
- [ ] Enter/Space activates buttons

### Screen Readers
- [ ] All images have alt text
- [ ] ARIA labels on interactive elements
- [ ] ARIA live regions for dynamic updates
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Form fields have associated labels

### Touch Targets
- [ ] All touch targets minimum 44×44px
- [ ] Adequate spacing between touch targets (8px minimum)
- [ ] No tiny clickable areas

### Color Contrast
- [ ] Normal text has 7:1 contrast (WCAG AAA)
- [ ] Large text has 4.5:1 contrast (WCAG AAA)
- [ ] Interactive elements have 3:1 contrast
- [ ] Tested with color blindness simulator
- [ ] Information not conveyed by color alone

### Motion & Animation
- [ ] Respects `prefers-reduced-motion`
  - Decorative: Disabled
  - Functional: Reduced to 50ms
  - Critical: Instant (0ms)
- [ ] No auto-playing videos
- [ ] No flashing content (seizure risk)

---

## 📱 Responsive Design

### Breakpoints
- [ ] Mobile layout tested (<640px)
- [ ] Tablet layout tested (640-1024px)
- [ ] Desktop layout tested (>1024px)
- [ ] No horizontal scrolling on mobile
- [ ] Content reflows at all viewport sizes

### Mobile-Specific
- [ ] Bottom navigation (not sidebar)
- [ ] Single column layouts
- [ ] Simplified views (progressive disclosure)
- [ ] Swipe gestures work correctly
- [ ] Pull-to-refresh implemented where appropriate
- [ ] Floating action button for primary action

### Desktop-Specific
- [ ] Sidebar navigation
- [ ] Multi-column layouts where appropriate
- [ ] Keyboard shortcuts work
- [ ] Drag-and-drop enabled where useful
- [ ] Context menus (right-click)
- [ ] Hover states provide additional info

---

## 🔒 Safety & UX Patterns

### Safety Pipeline (for config changes)
- [ ] Zod validation on client
- [ ] Backend dry-run before apply
- [ ] Impact analysis shown
- [ ] Visual diff preview
- [ ] Confirmation required
- [ ] 10-second undo window after apply
- [ ] Auto-rollback on failure

### Dangerous Operations
- [ ] Red button for destructive actions
- [ ] Multi-step confirmation gate
- [ ] Impact list shown
- [ ] Countdown delay (3s) before execution
- [ ] Confirmation phrase required for critical actions

### Loading States
- [ ] Skeleton loaders (not blank screens)
- [ ] Progress indicators for multi-step operations
- [ ] Cancel button for long operations
- [ ] Disabled state on buttons during loading
- [ ] Optimistic UI updates where appropriate

### Error Handling
- [ ] Inline errors for form fields
- [ ] Toast notifications for API errors
- [ ] Error boundaries for fatal errors
- [ ] Clear error messages with remediation steps
- [ ] No generic "Something went wrong"

---

## 🚀 Performance

### Bundle Size
- [ ] Component is tree-shakeable
- [ ] Heavy components lazy-loaded
  - Chart (~50KB)
  - NetworkTopology (~30KB)
  - Feature-specific visualizations
- [ ] No unnecessary dependencies
- [ ] Icons imported individually (not entire library)

### Rendering
- [ ] Pattern components are `React.memo()`
- [ ] Event handlers are `useCallback()`
- [ ] Derived state is `useMemo()`
- [ ] Lists >20 items use virtualization
- [ ] No unnecessary re-renders

### Data Fetching
- [ ] Using TanStack Query for server state
- [ ] Appropriate cache times
  - Critical data: 5s
  - Stable data: 1-5 minutes
  - Very stable: 5-30 minutes
- [ ] Subscriptions for real-time data
- [ ] Optimistic updates for mutations

---

## 🧪 Testing

### Unit Tests
- [ ] Headless hook tested (>80% coverage)
- [ ] All logic branches tested
- [ ] Edge cases covered
- [ ] Error handling tested

### Component Tests
- [ ] All platform presenters tested
- [ ] User interactions tested
- [ ] Loading states tested
- [ ] Error states tested
- [ ] Empty states tested

### Storybook
- [ ] 5-8 stories created
  - Default
  - Mobile/Tablet/Desktop
  - States (Loading, Error, Success)
  - Interactions (Play functions)
  - Variants
  - Edge cases
- [ ] Stories documented with JSDoc
- [ ] Interactive controls configured

### E2E Tests
- [ ] Critical user flow tested
- [ ] Accessibility tested (axe-core)
- [ ] Real API integration tested
- [ ] Error scenarios tested

### Visual Regression
- [ ] Chromatic baseline created
- [ ] Visual snapshots for all states
- [ ] Platform-specific snapshots

---

## 📖 Documentation

### Code Documentation
- [ ] Component has JSDoc comment
- [ ] Props have descriptions
- [ ] Complex logic has inline comments
- [ ] Examples in JSDoc

### Component README
- [ ] When to use / when not to use
- [ ] Props table with descriptions
- [ ] Usage examples (3-5)
- [ ] Platform presenter notes
- [ ] Accessibility notes
- [ ] Related components

### Storybook Documentation
- [ ] Component description
- [ ] Interactive examples
- [ ] Props documented with controls
- [ ] Accessibility notes

---

## 🎭 UX Patterns

### Progressive Disclosure
- [ ] Simple mode shows 3-5 essential fields
- [ ] Advanced toggle reveals 15-20 fields
- [ ] Expert mode available for raw config
- [ ] Help text available but not intrusive

### Status Communication
- [ ] Current state always visible
- [ ] Color-coded indicators
- [ ] Live pulse animation for real-time data
- [ ] Timestamp for non-live data

### Feedback
- [ ] Success confirmations (toast)
- [ ] Progress indicators
- [ ] Clear error messages
- [ ] Loading states (skeletons)

### Intent-Based UI
- [ ] User describes WHAT (goal), not HOW (implementation)
- [ ] Wizard recipes for common setups
- [ ] Troubleshooting wizards for diagnostics
- [ ] Plain language (not technical jargon)

---

## 🌍 Internationalization

### Text Content
- [ ] All user-facing text uses i18n keys
- [ ] No hardcoded strings
- [ ] Text is translatable (no concatenation)
- [ ] Date/time formats use locale
- [ ] Number formats use locale

### RTL Support
- [ ] Layout works in RTL mode
- [ ] Icons don't need flipping
- [ ] Text alignment correct
- [ ] Margin/padding logical properties

---

## 🔍 Code Review Checklist

### Before Submitting PR

**General:**
- [ ] Code follows [Implementation Guidance](./ux-design/9-implementation-guidance.md)
- [ ] No linter errors
- [ ] TypeScript strict mode passes
- [ ] All tests passing
- [ ] Storybook builds without errors

**Design System:**
- [ ] Using pattern components (not custom)
- [ ] Using semantic tokens (not primitive)
- [ ] Platform presenters implemented if new pattern
- [ ] Accessibility requirements met (WCAG AAA)

**Performance:**
- [ ] No unnecessary re-renders
- [ ] Bundle size within budget
- [ ] Heavy components lazy-loaded

**Documentation:**
- [ ] Component README written
- [ ] Storybook stories created
- [ ] Code has JSDoc comments

---

## 🚦 Quality Gates

### Must Pass Before Merge

- [ ] ✅ All unit tests passing (>80% coverage)
- [ ] ✅ All component tests passing
- [ ] ✅ Storybook stories created and documented
- [ ] ✅ Visual regression baseline approved
- [ ] ✅ Accessibility tests passing (axe-core)
- [ ] ✅ No linter errors
- [ ] ✅ TypeScript strict mode passes
- [ ] ✅ Bundle size within budget (<250KB initial)
- [ ] ✅ Code reviewed by design team
- [ ] ✅ Manual testing on all 3 platforms

---

## 📋 Common Mistakes to Avoid

### ❌ Don't Do This

```tsx
// Using primitive colors directly
<div className="bg-amber-500 text-white">

// Creating custom pattern instead of using existing
<CustomCard> instead of <ResourceCard>

// Hardcoding sizes instead of using tokens
<div className="p-4 m-6">  // Should use semantic tokens

// Ignoring platform presenters
<MyComponent>  // Should have Mobile/Tablet/Desktop variants

// Hardcoded text
<Button>Connect</Button>  // Should use i18n
```

### ✅ Do This Instead

```tsx
// Using semantic colors
<div className="bg-primary text-white">

// Using existing patterns
<ResourceCard resource={vpn} />

// Using semantic spacing tokens
<div className="p-component-md m-layout-gap-lg">

// Using platform presenters
<ResourceCard resource={vpn} />  // Auto-detects platform

// Using i18n
<Button>{t('actions.connect')}</Button>
```

---

## 🎓 Learning Resources

### Must Read (in order)
1. [Executive Summary](./ux-design/executive-summary.md) - Overview
2. [Design System Foundation](./ux-design/1-design-system-foundation.md) - Architecture
3. [Component Library](./ux-design/6-component-library.md) - Component catalog
4. [Design Tokens Reference](./DESIGN_TOKENS.md) - Token usage

### Reference
- [Visual Foundation](./ux-design/3-visual-foundation.md) - Colors, typography, spacing
- [Core User Experience](./ux-design/2-core-user-experience.md) - UX patterns
- [Responsive & Accessibility](./ux-design/8-responsive-design-accessibility.md) - A11y requirements

### Templates
- [Component Pattern Template](./COMPONENT_PATTERN_TEMPLATE.md) - New pattern template
- [Design Update Summary](./DESIGN_UPDATE_SUMMARY.md) - What changed in v2.0

---

## ✅ Feature Implementation Checklist

Copy this section for each feature you implement:

```markdown
## Feature: [Feature Name]

### Planning ✓
- [ ] User flow identified
- [ ] Pattern components selected
- [ ] No new patterns needed (or approved)
- [ ] Design tokens reviewed

### Implementation ✓
- [ ] Using semantic colors
- [ ] Using semantic spacing
- [ ] Platform presenters working
- [ ] Icons using unified system
- [ ] Typography correct
- [ ] Dark mode tested

### Accessibility ✓
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] 7:1 contrast ratio
- [ ] 44px touch targets
- [ ] Reduced motion supported

### Testing ✓
- [ ] Unit tests (>80%)
- [ ] Component tests
- [ ] Storybook stories (5-8)
- [ ] E2E critical paths
- [ ] Visual regression

### Performance ✓
- [ ] React.memo applied
- [ ] Heavy components lazy
- [ ] Bundle size checked
- [ ] No unnecessary re-renders

### Documentation ✓
- [ ] Component README
- [ ] JSDoc comments
- [ ] Storybook docs
- [ ] Usage examples

### Review ✓
- [ ] Code review
- [ ] Design review
- [ ] Accessibility review
- [ ] Manual testing all platforms
```

---

## 🎯 Quick Wins

### Most Common Tasks

**1. Adding a Status Badge**
```tsx
import { StatusBadge } from '@/ui/patterns/common/status-badge';

<StatusBadge status="online" live showLabel />
```

**2. Creating a Resource Card**
```tsx
import { ResourceCard } from '@/ui/patterns/common/resource-card';

<ResourceCard<VPNClient>
  resource={vpn}
  actions={[
    { id: 'connect', label: 'Connect', icon: 'plug' },
    { id: 'delete', label: 'Delete', variant: 'danger' },
  ]}
/>
```

**3. Building a Form**
```tsx
import { ConfigForm } from '@/ui/patterns/common/config-form';

<ConfigForm
  schema={vpnSchema}
  onSubmit={handleSubmit}
  fieldModes={{
    name: 'editable',
    uuid: 'readonly',
    routerId: 'hidden',
    isActive: 'computed',
  }}
/>
```

**4. Showing a Data Table**
```tsx
import { DataTable } from '@/ui/patterns/common/data-table';

<DataTable
  data={dhcpLeases}
  columns={leaseColumns}
  virtualizeRows={dhcpLeases.length > 20}
/>
```

**5. Adding a Chart**
```tsx
import { Chart } from '@/ui/patterns/data/chart';

<Chart
  type="line"
  data={bandwidthData}
  xAxis={{ label: 'Time' }}
  yAxis={{ label: 'Mbps' }}
/>
```

---

## 🚨 Common Pitfalls

### 1. Using Primitive Tokens Directly
**Problem:** Hard to theme, breaks on category context changes  
**Solution:** Always use semantic tokens

### 2. Building Custom Pattern Instead of Using Existing
**Problem:** Inconsistency, duplication  
**Solution:** Check component catalog first, extend existing patterns

### 3. Ignoring Platform Presenters
**Problem:** Poor mobile UX, not optimized per device  
**Solution:** Use pattern components with auto-detection

### 4. Hardcoding Text
**Problem:** Not translatable  
**Solution:** Use i18n keys for all user-facing text

### 5. Skipping Accessibility Testing
**Problem:** WCAG compliance failures  
**Solution:** Run axe-core in all E2E tests

### 6. Not Testing Dark Mode
**Problem:** Broken contrast, illegible text  
**Solution:** Test both themes for every component

### 7. Creating Forms Without Field Modes
**Problem:** Mixing editable and readonly without structure  
**Solution:** Define field modes explicitly

---

## 📊 Success Metrics

### Your Feature Implementation Should Achieve:

**Design Compliance:**
- ✅ 100% pattern component usage (no custom components)
- ✅ 100% semantic token usage
- ✅ All platform presenters working

**Accessibility:**
- ✅ 100% WCAG AAA compliance
- ✅ axe-core tests passing
- ✅ Manual screen reader test passed

**Testing:**
- ✅ >80% unit test coverage
- ✅ All component tests passing
- ✅ 5-8 Storybook stories created
- ✅ Visual regression baseline approved

**Performance:**
- ✅ Bundle size within budget
- ✅ No performance warnings
- ✅ Lighthouse score >90

**Documentation:**
- ✅ Component README complete
- ✅ Storybook documented
- ✅ Usage examples provided

---

## 🎉 You're Done When...

- ✅ All checklist items completed
- ✅ Code review approved
- ✅ Design review approved
- ✅ Accessibility review approved
- ✅ All tests passing (unit, component, E2E, visual)
- ✅ Documentation complete
- ✅ Manual testing on all platforms successful

---

**Need Help?**

- Stuck on pattern selection? → Check [Component Library](./ux-design/6-component-library.md)
- Token questions? → Check [Design Tokens Reference](./DESIGN_TOKENS.md)
- Accessibility issues? → Check [Responsive & Accessibility](./ux-design/8-responsive-design-accessibility.md)
- General questions? → Review [Design System README](./README.md)

**Happy building! 🚀**
