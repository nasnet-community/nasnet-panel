# ADR 001: Component Library Selection - shadcn/ui

**Status:** Accepted  
**Date:** 2025-12-03  
**Deciders:** Architecture Team  
**Epic Context:** Epic 0.0 - Project Foundation  
**Related Stories:** 0-0-2 (Configure Tailwind + shadcn/ui)

## Context

NasNetConnect requires a UI component library for the React frontend that must work within severe constraints:
- Docker image must be <10MB compressed
- Runs on MikroTik routers with limited CPU/RAM
- Requires accessibility compliance (WCAG)
- Needs dark mode support
- Must support mobile-first responsive design

The team evaluated multiple component libraries during Epic 0.0 planning.

## Decision

Use **shadcn/ui** with Radix UI primitives and Tailwind CSS as the component foundation.

shadcn/ui is not a traditional component library - it's a collection of copy-paste components that you own. Components are added to your codebase via CLI and can be customized directly.

## Rationale

**Bundle Size Optimization:**
- Only includes components actually used (no unused code shipped)
- Tree-shakeable by design - each component is independent
- Tailwind CSS purges unused styles automatically
- Measured impact: ~45KB for core components vs 300KB+ for Material-UI

**Code Ownership:**
- Components copied into `libs/ui/primitives/src/`
- Full control over customization and optimization
- No black-box dependency updates breaking production
- Can optimize specific components for router constraints

**Developer Experience:**
- Built on Radix UI primitives (battle-tested accessibility)
- TypeScript-first with excellent type safety
- Integrates seamlessly with React Hook Form + Zod
- 90,000+ GitHub stars, proven in production

**Accessibility:**
- WCAG 2.1 Level AA compliant out of the box
- ARIA attributes handled by Radix UI
- Keyboard navigation, screen reader support included
- Focus management built-in

**Dark Mode:**
- Native support via Tailwind CSS classes
- CSS variables for theme switching
- No runtime overhead for theme toggling

## Consequences

### Positive

- **Small Bundle:** Only pay for what we use, critical for <10MB constraint
- **Customizable:** Can optimize components specifically for router deployment
- **Type-Safe:** Full TypeScript support with proper type inference
- **Accessible:** WCAG compliance without additional effort
- **Future-Proof:** Components owned by us, not subject to breaking changes from upstream

### Negative

- **Manual Updates:** Component updates require manual copying from shadcn/ui CLI
- **No Centralized Registry:** Each component managed individually
- **Initial Setup Time:** More configuration than dropping in a pre-built library
- **Team Training:** Team needs to understand Radix UI primitives

### Mitigations

- Created `@nasnet/ui-primitives` library for centralized component management
- Documented component update process in `libs/ui/primitives/README.md`
- Established component testing standards using Storybook
- Created design system documentation in `docs/design/ux-design/`

## Alternatives Considered

### Material-UI (MUI)
- **Rejected:** Bundle size too large (300KB+ minified)
- Runtime theme system adds overhead
- Difficult to customize deeply
- Would require significant tree-shaking configuration

### Ant Design
- **Rejected:** Even larger bundle than MUI (400KB+)
- Less flexible for custom design systems
- Strong opinionated design language harder to override

### Chakra UI
- **Rejected:** Runtime CSS-in-JS overhead
- Larger bundle size than shadcn/ui
- Less control over component internals

### Custom Components (Built from Scratch)
- **Rejected:** Would take 4-6 weeks to build accessible components
- Risk of accessibility issues without Radix UI foundation
- Team bandwidth better spent on router management features
- Reinventing well-solved problems

## Implementation Notes

Components installed via:
```bash
npx shadcn@latest add button card dialog toast tabs table input select checkbox switch
```

Components live in:
- `libs/ui/primitives/src/button/`
- `libs/ui/primitives/src/card/`
- `libs/ui/primitives/src/dialog/`
- etc.

Theme configuration in `tailwind.config.js` with CSS variables for dark mode.

## Review Date

Will review this decision after Phase 0 completion (Epic 0.10) to assess:
- Actual bundle size impact
- Developer productivity
- Component maintenance burden
- Any accessibility issues discovered

## References

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- Epic 0.0 Tech Spec: `implementation/tech-specs/phase-0/tech-spec-epic-0-0.md`
- UX Design Specification: `design/ux-design/1-design-system-foundation.md`

