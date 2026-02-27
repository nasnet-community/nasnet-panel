# Pattern Component Guide

This guide explains how to create pattern components following the **Headless + Platform
Presenters** architecture defined in
[ADR-018](../../../Docs/architecture/adrs/018-headless-platform-presenters.md).

## Overview

Pattern components (Layer 2) sit between primitives (Layer 1) and domain components (Layer 3). They
provide:

- **Reusable UX patterns** that compose primitives
- **Automatic responsive behavior** via platform presenters
- **TypeScript generics** for type-safe resource handling
- **Accessibility compliance** (WCAG AAA)

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    PATTERN COMPONENT                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             HEADLESS HOOK                            │   │
│  │  useResourceCard<T>(props)                           │   │
│  │  • All business logic                                │   │
│  │  • State management                                  │   │
│  │  • Computed values                                   │   │
│  │  • Event handlers (stable references)               │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           AUTO-DETECT WRAPPER                        │   │
│  │  ResourceCard<T>(props)                              │   │
│  │  • Calls usePlatform()                               │   │
│  │  • Routes to correct presenter                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                    ↓           ↓                           │
│  ┌──────────────────┐   ┌──────────────────┐               │
│  │  MOBILE PRESENTER │   │ DESKTOP PRESENTER │              │
│  │  • Touch-optimized │   │ • Mouse-optimized │              │
│  │  • 44px targets    │   │ • Dense layout    │              │
│  │  • Bottom sheets   │   │ • Dropdowns       │              │
│  └──────────────────┘   └──────────────────┘               │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

## File Structure

```
libs/ui/patterns/src/common/{pattern-name}/
├── use{PatternName}.ts       # Headless hook (business logic)
├── {PatternName}.tsx         # Auto-detect wrapper
├── {PatternName}.Mobile.tsx  # Mobile presenter
├── {PatternName}.Desktop.tsx # Desktop presenter
├── {PatternName}.test.tsx    # Tests
├── {PatternName}.stories.tsx # Storybook stories
├── types.ts                  # TypeScript types (if complex)
└── index.ts                  # Exports
```

## Implementation Guide

### Step 1: Create the Headless Hook

```typescript
// useResourceCard.ts
import { useMemo, useCallback } from 'react';

export interface UseResourceCardProps<T extends Resource> {
  resource: T;
  actions?: Action[];
  expanded?: boolean;
  onToggle?: () => void;
}

export interface UseResourceCardReturn {
  // Derived state
  status: Status;
  isOnline: boolean;
  statusColor: string;

  // Actions
  primaryAction: Action | undefined;
  secondaryActions: Action[];

  // Event handlers (stable references)
  handleToggle: () => void;
  handlePrimaryAction: () => void;
}

export function useResourceCard<T extends Resource>(
  props: UseResourceCardProps<T>
): UseResourceCardReturn {
  const { resource, actions = [], expanded = false, onToggle } = props;

  // Derived state (memoized)
  const status = useMemo(() => resource.runtime?.status || 'unknown', [resource.runtime?.status]);

  const isOnline = useMemo(() => status === 'online' || status === 'connected', [status]);

  const statusColor = useMemo(() => getStatusColor(status), [status]);

  // Actions
  const primaryAction = actions[0];
  const secondaryActions = useMemo(() => actions.slice(1), [actions]);

  // Event handlers (stable references via useCallback)
  const handleToggle = useCallback(() => {
    onToggle?.();
  }, [onToggle]);

  const handlePrimaryAction = useCallback(() => {
    primaryAction?.onClick?.();
  }, [primaryAction]);

  return {
    status,
    isOnline,
    statusColor,
    primaryAction,
    secondaryActions,
    handleToggle,
    handlePrimaryAction,
  };
}
```

### Step 2: Create Platform Presenters

```typescript
// ResourceCard.Mobile.tsx
import { Card, Badge, Button } from '@nasnet/ui/primitives';
import { useResourceCard, type UseResourceCardProps } from './useResourceCard';

export function ResourceCardMobile<T extends Resource>(
  props: UseResourceCardProps<T>
) {
  const {
    status,
    isOnline,
    statusColor,
    primaryAction,
    handlePrimaryAction,
  } = useResourceCard(props);

  return (
    <Card className="p-4">
      {/* Mobile-optimized layout */}
      {/* - Large touch targets (44px min) */}
      {/* - Single column layout */}
      {/* - Bottom sheet for actions */}
      <div className="flex items-center justify-between min-h-[44px]">
        <div className="flex items-center gap-3">
          <Badge variant={statusColor}>{status}</Badge>
          <span className="font-medium">{props.resource.name}</span>
        </div>
        {primaryAction && (
          <Button
            size="lg"
            className="min-w-[44px] min-h-[44px]"
            onClick={handlePrimaryAction}
          >
            {primaryAction.label}
          </Button>
        )}
      </div>
    </Card>
  );
}
```

```typescript
// ResourceCard.Desktop.tsx
import { Card, Badge, Button, DropdownMenu } from '@nasnet/ui/primitives';
import { useResourceCard, type UseResourceCardProps } from './useResourceCard';

export function ResourceCardDesktop<T extends Resource>(
  props: UseResourceCardProps<T>
) {
  const {
    status,
    isOnline,
    statusColor,
    primaryAction,
    secondaryActions,
    handlePrimaryAction,
  } = useResourceCard(props);

  return (
    <Card className="p-4 hover:bg-muted/50 transition-colors">
      {/* Desktop-optimized layout */}
      {/* - Dense information display */}
      {/* - Hover states for actions */}
      {/* - Dropdown for secondary actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant={statusColor}>{status}</Badge>
          <div>
            <h3 className="font-medium">{props.resource.name}</h3>
            <p className="text-sm text-muted-foreground">
              {props.resource.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {primaryAction && (
            <Button size="sm" onClick={handlePrimaryAction}>
              {primaryAction.label}
            </Button>
          )}
          {secondaryActions.length > 0 && (
            <DropdownMenu>
              {/* Secondary actions */}
            </DropdownMenu>
          )}
        </div>
      </div>
    </Card>
  );
}
```

### Step 3: Create Auto-Detect Wrapper

```typescript
// ResourceCard.tsx
import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { ResourceCardMobile } from './ResourceCard.Mobile';
import { ResourceCardDesktop } from './ResourceCard.Desktop';
import type { UseResourceCardProps } from './useResourceCard';

export interface ResourceCardProps<T extends Resource>
  extends UseResourceCardProps<T> {}

function ResourceCardComponent<T extends Resource>(
  props: ResourceCardProps<T>
) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <ResourceCardMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <ResourceCardDesktop {...props} />;
  }
}

// Wrap with memo for performance
export const ResourceCard = memo(ResourceCardComponent) as typeof ResourceCardComponent;
ResourceCard.displayName = 'ResourceCard';
```

### Step 4: Create Exports

```typescript
// index.ts
export { ResourceCard } from './ResourceCard';
export type { ResourceCardProps } from './ResourceCard';

export { ResourceCardMobile } from './ResourceCard.Mobile';
export { ResourceCardDesktop } from './ResourceCard.Desktop';

export { useResourceCard } from './useResourceCard';
export type { UseResourceCardProps, UseResourceCardReturn } from './useResourceCard';
```

### Step 5: Write Tests

```typescript
// ResourceCard.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ResourceCard } from './ResourceCard';
import { useResourceCard } from './useResourceCard';

expect.extend(toHaveNoViolations);

describe('useResourceCard', () => {
  it('returns correct status for online resource', () => {
    const { result } = renderHook(() =>
      useResourceCard({
        resource: { runtime: { status: 'online' } },
      })
    );

    expect(result.current.status).toBe('online');
    expect(result.current.isOnline).toBe(true);
  });
});

describe('ResourceCard', () => {
  it('renders resource name', () => {
    render(
      <ResourceCard
        resource={{ name: 'Test Resource', runtime: { status: 'online' } }}
      />
    );

    expect(screen.getByText('Test Resource')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ResourceCard
        resource={{ name: 'Test Resource', runtime: { status: 'online' } }}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Step 6: Create Storybook Stories

```typescript
// ResourceCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ResourceCard } from './ResourceCard';

const meta: Meta<typeof ResourceCard> = {
  title: 'Patterns/Common/ResourceCard',
  component: ResourceCard,
  tags: ['autodocs'],
  argTypes: {
    resource: { control: 'object' },
    expanded: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ResourceCard>;

export const Online: Story = {
  args: {
    resource: {
      name: 'WireGuard VPN',
      runtime: { status: 'online' },
    },
  },
};

export const Offline: Story = {
  args: {
    resource: {
      name: 'OpenVPN Client',
      runtime: { status: 'offline' },
    },
  },
};

export const WithActions: Story = {
  args: {
    resource: {
      name: 'VPN Server',
      runtime: { status: 'online' },
    },
    actions: [
      { label: 'Connect', onClick: () => {} },
      { label: 'Configure', onClick: () => {} },
      { label: 'Delete', onClick: () => {}, variant: 'destructive' },
    ],
  },
};
```

## Platform Guidelines

### Mobile (`<640px`)

- **Touch targets:** Minimum 44x44px
- **Layout:** Single column, stacked vertically
- **Actions:** Bottom sheets or large buttons
- **Typography:** Larger for readability
- **Spacing:** Generous padding (16px+)

### Tablet (`640-1024px`)

- **Hybrid approach:** Mix of mobile and desktop patterns
- **Layout:** Two columns when space allows
- **Actions:** Inline buttons with dropdown overflow

### Desktop (`>1024px`)

- **Dense layout:** Maximize information density
- **Layout:** Multi-column, data tables
- **Actions:** Hover states, dropdown menus
- **Typography:** Standard sizes
- **Spacing:** Compact (8-12px)

## Accessibility Checklist

- [ ] 7:1 contrast ratio (WCAG AAA)
- [ ] 44px touch targets on mobile
- [ ] Keyboard navigable
- [ ] Focus indicators visible
- [ ] ARIA labels on buttons/inputs
- [ ] Screen reader tested
- [ ] Reduced motion support

## Performance Guidelines

1. **Memoization:** Wrap components with `React.memo()`
2. **Stable handlers:** Use `useCallback` for event handlers
3. **Memoized values:** Use `useMemo` for expensive computations
4. **Lazy loading:** Use `React.lazy()` for heavy components

## Common Patterns List

### Common (30 patterns)

| Pattern             | Description                                      |
| ------------------- | ------------------------------------------------ |
| ResourceCard        | Generic resource display with status and actions |
| StatusBadge         | Status indicator with live pulse animation       |
| DataTable           | Virtualized table with sorting/filtering         |
| EmptyState          | No data placeholder with CTA                     |
| LoadingSkeleton     | Content placeholder with animation               |
| ConfirmDialog       | Dangerous operation confirmation                 |
| FormField           | Form field with label, input, error              |
| Toast               | Notification system (via Sonner)                 |
| MetricDisplay       | Bandwidth/CPU/uptime metrics                     |
| ConnectionIndicator | Real-time connection status                      |

### Domain (26 patterns)

See `libs/ui/patterns/src/domain/` for VPN, Firewall, Network, and other domain-specific patterns.

## Related Documentation

- [Three-Layer Architecture](../README.md)
- [ADR-018: Headless Platform Presenters](../../../Docs/architecture/adrs/018-headless-platform-presenters.md)
- [UX Design - Component Library](../../../Docs/design/ux-design/6-component-library.md)
