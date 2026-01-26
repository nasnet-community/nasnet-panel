# 9. Implementation Guidance

## 9.1 Tech Stack

**Core Framework:**
*   **React 18+**
*   **TypeScript 5+**
*   **Vite 5+**

**Styling & Components:**
*   **Tailwind CSS 3.4+** (Styling engine)
*   **shadcn/ui** (Component primitives)
*   **Radix UI** (Headless accessibility)
*   **Lucide React** (Icons)
*   **Framer Motion** (Animation)

**State & Data:**
*   **TanStack Query v5** (Server state, caching)
*   **Zustand v4** (Client UI state)
*   **XState v5** (Complex state machines/wizards)

**Routing:**
*   **TanStack Router** (Type-safe routing)

**UX Enhancements:**
*   **Sonner** (Toast notifications)
*   **cmdk** (Command palette)

## 9.2 Development Workflow

1.  **Identify Pattern:** Before building a feature, check `libs/ui/patterns`. If a pattern is missing, design and build it there first.
2.  **Storybook First:** Build components in isolation using Storybook.
3.  **Feature Composition:** Assemble features in `libs/features` using patterns.
4.  **Integration:** Connect data using TanStack Query hooks.

## 9.3 File Structure Recommendation

```
libs/
├── ui/
│   ├── primitives/    # shadcn/ui components (Button, Card)
│   ├── patterns/      # Composed patterns (ResourceCard, ConfigForm)
│   └── design-tokens/ # Tailwind config, colors
├── features/
│   ├── network/       # Network feature module
│   │   ├── components/ # Domain components
│   │   ├── routes/     # Route definitions
│   │   └── hooks/      # Data hooks
│   ├── vpn/
│   └── ...
├── state/             # Global stores (Zustand/XState)
└── api-client/        # Type-safe API wrappers
```

## 9.4 Testing Recommendations

*   **Unit:** Vitest for utility functions and hooks.
*   **Component:** React Testing Library + Storybook interactions.
*   **E2E:** Playwright for critical user flows (Wizards, Auth).
*   **Visual:** Chromatic (Storybook) for regression testing.
*   **Accessibility:** `axe-core` automated checks in CI.

## 9.5 Design-to-Code Handoff

*   **Figma:** Source of truth for visual design.
*   **Tokens:** Defined in `DESIGN_TOKENS.md` and `tailwind.config.js`.
*   **Specs:** Use this documentation for behavioral specs (flows, error states).
