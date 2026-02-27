# UI Libraries - Three-Layer Component Architecture

This directory contains the UI component libraries for NasNetConnect, implementing the **Three-Layer
Component Architecture** as defined in
[ADR-017](../../Docs/architecture/adrs/017-three-layer-component-architecture.md).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│           THREE-LAYER COMPONENT ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LAYER 1: PRIMITIVES (libs/ui/primitives)                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • shadcn/ui + Radix components                         ││
│  │  • WCAG AAA accessible                                   ││
│  │  • Zero business logic                                   ││
│  │  • ~25 components: Button, Card, Dialog, Input, etc.    ││
│  └─────────────────────────────────────────────────────────┘│
│                          ↓ used by                           │
│                                                              │
│  LAYER 2: PATTERNS (libs/ui/patterns)                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Headless logic + Platform presenters                 ││
│  │  • Automatic responsive (Mobile/Tablet/Desktop)         ││
│  │  • TypeScript generics for resource types               ││
│  │  • ~50 components: ResourceCard, DataTable, etc.        ││
│  └─────────────────────────────────────────────────────────┘│
│                          ↓ used by                           │
│                                                              │
│  LAYER 3: DOMAIN (libs/features/*/components)               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Feature-specific business logic                      ││
│  │  • Composes Layer 2 patterns                            ││
│  │  • Not reused across features                           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
libs/ui/
├── primitives/       # Layer 1: shadcn/ui components
│   ├── src/
│   │   ├── button/
│   │   ├── card/
│   │   ├── dialog/
│   │   ├── input/
│   │   ├── select/
│   │   ├── ... (25+ primitives)
│   │   └── index.ts
│   └── project.json  # tags: scope:ui, scope:ui-primitives
│
├── patterns/         # Layer 2: Reusable UX patterns
│   ├── src/
│   │   ├── common/           # Common patterns (30)
│   │   │   ├── resource-card/
│   │   │   ├── data-table/
│   │   │   ├── status-badge/
│   │   │   └── ...
│   │   ├── domain/           # Domain-specific patterns (26)
│   │   │   ├── vpn-client-card/
│   │   │   ├── firewall-rule-table/
│   │   │   └── ...
│   │   ├── hooks/            # Shared pattern hooks
│   │   └── index.ts
│   └── project.json  # tags: scope:ui, scope:ui-patterns
│
├── layouts/          # Layout shells and responsive system
│   ├── src/
│   │   ├── app-shell/
│   │   ├── mobile-app-shell/
│   │   ├── responsive-shell/  # Platform detection
│   │   │   ├── usePlatform.ts
│   │   │   ├── PlatformProvider.tsx
│   │   │   └── ResponsiveShell.tsx
│   │   └── index.ts
│   └── project.json  # tags: scope:ui, scope:ui-layouts
│
└── README.md         # This file
```

## Dependency Rules

ESLint `@nx/enforce-module-boundaries` enforces:

| Source                | Can Depend On                                                                |
| --------------------- | ---------------------------------------------------------------------------- |
| `scope:features`      | `scope:ui-patterns`, `scope:ui-primitives`, `scope:ui-layouts`, `scope:core` |
| `scope:ui-patterns`   | `scope:ui-primitives`, `scope:ui-layouts`, `scope:core`                      |
| `scope:ui-layouts`    | `scope:ui-primitives`, `scope:core`                                          |
| `scope:ui-primitives` | `scope:core` only                                                            |

**Key Rules:**

- Primitives cannot import from patterns or features
- Patterns can import from primitives only
- Features can import from patterns and primitives

## Import Aliases

Defined in `tsconfig.base.json`:

```typescript
import { Button, Card, Dialog } from '@nasnet/ui/primitives';
import { ResourceCard, DataTable } from '@nasnet/ui/patterns';
import { AppShell, usePlatform } from '@nasnet/ui/layouts';
```

## Platform Detection (ADR-018)

Pattern components automatically adapt to the platform using the `usePlatform()` hook:

```typescript
import { usePlatform } from '@nasnet/ui/layouts';

export function ResourceCard<T>(props: Props<T>) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <ResourceCardMobile {...props} />;
    case 'tablet':
    case 'desktop':
      return <ResourceCardDesktop {...props} />;
  }
}
```

**Breakpoints:**

- Mobile: `<640px`
- Tablet: `640-1024px`
- Desktop: `>1024px`

## Pattern Component Structure

Each pattern follows the **Headless + Presenter** architecture:

```
libs/ui/patterns/src/common/resource-card/
├── useResourceCard.ts       # Headless hook (business logic)
├── ResourceCard.tsx         # Auto-detect wrapper
├── ResourceCard.Mobile.tsx  # Mobile presenter
├── ResourceCard.Desktop.tsx # Desktop presenter
├── ResourceCard.test.tsx    # Tests
├── ResourceCard.stories.tsx # Storybook stories
└── index.ts                 # Exports
```

## Creating New Patterns

See [PATTERNS.md](./patterns/PATTERNS.md) for detailed guidelines on creating new pattern
components.

## Accessibility

All components must meet WCAG AAA standards:

- 7:1 contrast ratio for normal text
- 44px minimum touch targets on mobile
- Full keyboard navigation
- Screen reader support
- ARIA labels where needed

Tests use `axe-core` for accessibility validation.

## Related Documentation

- [ADR-017: Three-Layer Component Architecture](../../Docs/architecture/adrs/017-three-layer-component-architecture.md)
- [ADR-018: Headless Platform Presenters](../../Docs/architecture/adrs/018-headless-platform-presenters.md)
- [ADR-001: Component Library Choice (shadcn/ui)](../../Docs/architecture/adrs/001-component-library-choice.md)
- [Frontend Architecture](../../Docs/architecture/frontend-architecture.md)
- [UX Design - Component Library](../../Docs/design/ux-design/6-component-library.md)
