# Appendix

## Related Documents

### Product Strategy
- [Product Requirements Document (PRD)](../prd/index.md)
- [Product Brief](../product-brief/index.md)
- [Brainstorming Sessions](../brainstorming-sessions/index.md)

### Technical Architecture
- [Backend Core](../product-brief/backend-core-architecture.md)
- [Universal State Architecture](../product-brief/universal-state-architecture.md)
- [Component Library Architecture](../product-brief/component-library-architecture.md)

## Interactive Deliverables

| Deliverable | Purpose | File |
|-------------|---------|------|
| **Color Themes** | Color system visualization | [ux-color-themes.html](../ux-color-themes.html) |
| **Design Directions** | Visual approaches | [ux-design-directions.html](../ux-design-directions.html) |

## Key Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture** | 3-Layer (Primitives/Patterns/Domain) | Scalability and consistency. |
| **Navigation** | Adaptive (Sidebar vs Bottom Tabs) | Best-in-class UX for both mobile and desktop. |
| **Theme** | Dual (Light/Dark) | Accessibility and user preference. |
| **Safety** | Invisible Pipeline | Confidence for non-expert users. |
| **State** | TanStack Query + Zustand | Separation of Server vs Client state. |
| **Forms** | Zod + Manual Patterns | Type safety and flexibility. |

## Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-20 | 1.1 | Updated to match Product Brief v4.0 | Agent |
| 2025-12-05 | 1.0 | Initial UX Design Specification | BMad |

---

**Next Steps:**
1.  **Implementation:** Begin building Primitives in `libs/ui/primitives`.
2.  **Storybook:** Set up Storybook for pattern development.
3.  **Prototype:** Build the "First-Time Setup" wizard flow.
