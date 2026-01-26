# Component Pattern Template

Use this template when creating new pattern components for NasNetConnect.

**Last Updated:** January 20, 2026  
**Version:** 2.0

---

## Before You Start

### ✅ Checklist

- [ ] Verified no existing pattern can be extended
- [ ] Documented use case and rationale
- [ ] Identified pattern layer (Common vs Domain)
- [ ] Got approval from design team
- [ ] Reviewed [Component Library](./ux-design/6-component-library.md)

### Pattern Naming Convention

**Common Patterns:** Purpose-based names
- Examples: `ResourceCard`, `ConfigForm`, `StatusBadge`

**Domain Patterns:** Domain-prefixed names
- Examples: `VPNProviderSelector`, `FirewallRuleEditor`, `NetworkTopologyGraph`

---

## File Structure

```
libs/ui/patterns/{common|domain}/{pattern-name}/
├── {PatternName}.tsx              # Main component
├── use{PatternName}.ts            # Headless hook (logic)
├── {PatternName}.Mobile.tsx       # Mobile presenter
├── {PatternName}.Tablet.tsx       # Tablet presenter
├── {PatternName}.Desktop.tsx      # Desktop presenter
├── {PatternName}.test.tsx         # Unit & component tests
├── {PatternName}.stories.tsx      # Storybook stories
├── types.ts                       # TypeScript types
├── README.md                      # Component documentation
└── index.ts                       # Barrel exports
```

---

## 1. Main Component (`{PatternName}.tsx`)

```tsx
import { usePlatform } from '@/core/hooks/usePlatform';
import { use{PatternName} } from './use{PatternName}';
import { {PatternName}Mobile } from './{PatternName}.Mobile';
import { {PatternName}Tablet } from './{PatternName}.Tablet';
import { {PatternName}Desktop } from './{PatternName}.Desktop';
import type { {PatternName}Props } from './types';

/**
 * {PatternName} - [Brief description]
 * 
 * @description
 * [Detailed description of what this component does and when to use it]
 * 
 * @example
 * ```tsx
 * <{PatternName} prop1="value" prop2={value} />
 * ```
 * 
 * @see {@link ./README.md} for detailed documentation
 */
export function {PatternName}<T extends Resource>(props: {PatternName}Props<T>) {
  // Get headless hook state
  const componentState = use{PatternName}(props);
  
  // Platform detection (or manual override)
  const { platform } = usePlatform();
  const selectedPlatform = props.presenter ?? platform;
  
  // Select appropriate presenter
  const Presenter = {
    mobile: {PatternName}Mobile,
    tablet: {PatternName}Tablet,
    desktop: {PatternName}Desktop,
  }[selectedPlatform];
  
  return <Presenter {...componentState} />;
}

// Attach platform presenters for manual selection
{PatternName}.Mobile = {PatternName}Mobile;
{PatternName}.Tablet = {PatternName}Tablet;
{PatternName}.Desktop = {PatternName}Desktop;

// Display name for debugging
{PatternName}.displayName = '{PatternName}';
```

---

## 2. Headless Hook (`use{PatternName}.ts`)

```tsx
import { useState, useCallback, useMemo } from 'react';
import type { {PatternName}Props, {PatternName}State } from './types';

/**
 * Headless hook for {PatternName} logic
 * 
 * @description
 * Contains all behavior and state management for {PatternName}.
 * Separated from presentation to enable platform-specific rendering.
 * 
 * @param props - Component props
 * @returns Component state and handlers for presenters
 */
export function use{PatternName}<T extends Resource>(
  props: {PatternName}Props<T>
): {PatternName}State<T> {
  const { resource, onAction, ...rest } = props;
  
  // State
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Handlers (stable references with useCallback)
  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);
  
  const handleAction = useCallback(async (action: string) => {
    setLoading(true);
    try {
      await onAction?.(action, resource);
    } finally {
      setLoading(false);
    }
  }, [onAction, resource]);
  
  // Derived state (memoized)
  const isActive = useMemo(() => {
    return resource.status === 'active';
  }, [resource.status]);
  
  // Return all state and handlers for presenters
  return {
    // Props passthrough
    resource,
    ...rest,
    
    // State
    expanded,
    loading,
    isActive,
    
    // Handlers
    handleToggle,
    handleAction,
  };
}
```

---

## 3. Mobile Presenter (`{PatternName}.Mobile.tsx`)

```tsx
import { Card } from '@/ui/primitives/card';
import { Button } from '@/ui/primitives/button';
import { StatusBadge } from '@/ui/patterns/common/status-badge';
import type { {PatternName}State } from './types';

/**
 * Mobile presenter for {PatternName}
 * 
 * @description
 * Optimized for mobile devices (<640px):
 * - Compact row layout
 * - Tap to expand details
 * - Bottom sheet for actions
 * - Large touch targets (44px min)
 */
export function {PatternName}Mobile<T extends Resource>(
  state: {PatternName}State<T>
) {
  const { resource, expanded, loading, handleToggle, handleAction } = state;
  
  return (
    <Card className="p-3 border-b">
      <div 
        className="flex items-center justify-between"
        onClick={handleToggle}
      >
        {/* Main content - compact */}
        <div className="flex-1">
          <h4 className="font-medium text-base">{resource.name}</h4>
          <StatusBadge status={resource.status} size="sm" />
        </div>
        
        {/* Primary action - large touch target */}
        <Button 
          size="lg" 
          onClick={(e) => {
            e.stopPropagation();
            handleAction('primary');
          }}
          disabled={loading}
          className="min-w-[44px] min-h-[44px]"
        >
          {loading ? 'Loading...' : 'Connect'}
        </Button>
      </div>
      
      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t">
          {/* Additional details shown on expand */}
          <p className="text-sm text-muted-foreground">
            {/* Detail content */}
          </p>
        </div>
      )}
    </Card>
  );
}

{PatternName}Mobile.displayName = '{PatternName}.Mobile';
```

---

## 4. Tablet Presenter (`{PatternName}.Tablet.tsx`)

```tsx
import { Card } from '@/ui/primitives/card';
import { Button } from '@/ui/primitives/button';
import { StatusBadge } from '@/ui/patterns/common/status-badge';
import type { {PatternName}State } from './types';

/**
 * Tablet presenter for {PatternName}
 * 
 * @description
 * Optimized for tablet devices (640-1024px):
 * - Grid card layout
 * - Collapsible details
 * - Balanced information density
 * - Optimized touch targets
 */
export function {PatternName}Tablet<T extends Resource>(
  state: {PatternName}State<T>
) {
  const { resource, expanded, loading, handleToggle, handleAction } = state;
  
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{resource.name}</h3>
          <StatusBadge status={resource.status} />
          
          {/* Some details always visible */}
          <div className="mt-2 text-sm text-muted-foreground">
            {/* Basic info */}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => handleAction('primary')} disabled={loading}>
            Connect
          </Button>
          <Button variant="outline" onClick={handleToggle}>
            {expanded ? 'Less' : 'More'}
          </Button>
        </div>
      </div>
      
      {/* Collapsible additional details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            {/* Detailed information in grid */}
          </div>
        </div>
      )}
    </Card>
  );
}

{PatternName}Tablet.displayName = '{PatternName}.Tablet';
```

---

## 5. Desktop Presenter (`{PatternName}.Desktop.tsx`)

```tsx
import { Card } from '@/ui/primitives/card';
import { Button } from '@/ui/primitives/button';
import { StatusBadge } from '@/ui/patterns/common/status-badge';
import type { {PatternName}State } from './types';

/**
 * Desktop presenter for {PatternName}
 * 
 * @description
 * Optimized for desktop devices (>1024px):
 * - Full card with exposed actions
 * - Dense information display
 * - Inline editing capabilities
 * - Hover states and tooltips
 * - Keyboard shortcuts
 */
export function {PatternName}Desktop<T extends Resource>(
  state: {PatternName}State<T>
) {
  const { resource, loading, handleAction } = state;
  
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">{resource.name}</h2>
          <StatusBadge status={resource.status} showLabel />
        </div>
        
        {/* All actions exposed */}
        <div className="flex gap-2">
          <Button onClick={() => handleAction('edit')}>
            Edit
          </Button>
          <Button onClick={() => handleAction('primary')} disabled={loading}>
            Connect
          </Button>
          <Button 
            variant="danger" 
            onClick={() => handleAction('delete')}
          >
            Delete
          </Button>
        </div>
      </div>
      
      {/* Details always visible on desktop */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Status
          </label>
          <p className="text-base">{resource.status}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Type
          </label>
          <p className="text-base">{resource.type}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Created
          </label>
          <p className="text-base">{resource.createdAt}</p>
        </div>
      </div>
    </Card>
  );
}

{PatternName}Desktop.displayName = '{PatternName}.Desktop';
```

---

## 6. TypeScript Types (`types.ts`)

```tsx
import type { Resource } from '@/core/types';

/**
 * Props for {PatternName} component
 */
export interface {PatternName}Props<T extends Resource> {
  /** Resource to display */
  resource: T;
  
  /** Callback when action is triggered */
  onAction?: (action: string, resource: T) => void | Promise<void>;
  
  /** Manual platform presenter override */
  presenter?: 'mobile' | 'tablet' | 'desktop';
  
  /** Additional actions to show */
  actions?: Action[];
  
  /** Custom className */
  className?: string;
  
  /** Whether to show expanded details initially */
  defaultExpanded?: boolean;
}

/**
 * State returned by headless hook
 */
export interface {PatternName}State<T extends Resource> 
  extends Omit<{PatternName}Props<T>, 'defaultExpanded'> {
  /** Is details section expanded */
  expanded: boolean;
  
  /** Is action in progress */
  loading: boolean;
  
  /** Is resource active */
  isActive: boolean;
  
  /** Toggle expanded state */
  handleToggle: () => void;
  
  /** Execute action */
  handleAction: (action: string) => Promise<void>;
}

/**
 * Action definition
 */
export interface Action {
  /** Action identifier */
  id: string;
  
  /** Display label */
  label: string;
  
  /** Icon name */
  icon?: string;
  
  /** Visual variant */
  variant?: 'default' | 'danger' | 'outline';
  
  /** Is action disabled */
  disabled?: boolean;
}
```

---

## 7. Tests (`{PatternName}.test.tsx`)

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { {PatternName} } from './{PatternName}';
import { use{PatternName} } from './use{PatternName}';

describe('{PatternName}', () => {
  const mockResource = {
    id: '1',
    name: 'Test Resource',
    status: 'active',
    type: 'test',
  };
  
  describe('Headless Hook', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => 
        use{PatternName}({ resource: mockResource })
      );
      
      expect(result.current.expanded).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.isActive).toBe(true);
    });
    
    it('should toggle expanded state', () => {
      const { result } = renderHook(() => 
        use{PatternName}({ resource: mockResource })
      );
      
      act(() => {
        result.current.handleToggle();
      });
      
      expect(result.current.expanded).toBe(true);
    });
  });
  
  describe('Component', () => {
    it('should render resource name', () => {
      render(<{PatternName} resource={mockResource} />);
      expect(screen.getByText('Test Resource')).toBeInTheDocument();
    });
    
    it('should call onAction when button clicked', async () => {
      const onAction = vi.fn();
      render(
        <{PatternName} resource={mockResource} onAction={onAction} />
      );
      
      const button = screen.getByRole('button', { name: /connect/i });
      fireEvent.click(button);
      
      expect(onAction).toHaveBeenCalledWith('primary', mockResource);
    });
    
    it('should respect platform presenter override', () => {
      const { container } = render(
        <{PatternName} resource={mockResource} presenter="desktop" />
      );
      
      // Verify desktop-specific elements are present
      expect(container.querySelector('.desktop-class')).toBeInTheDocument();
    });
  });
  
  describe('Accessibility', () => {
    it('should have accessible name', () => {
      render(<{PatternName} resource={mockResource} />);
      expect(screen.getByRole('article')).toHaveAccessibleName();
    });
    
    it('should be keyboard navigable', () => {
      render(<{PatternName} resource={mockResource} />);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
      
      fireEvent.keyDown(button, { key: 'Enter' });
      // Verify action triggered
    });
  });
});
```

---

## 8. Storybook Stories (`{PatternName}.stories.tsx`)

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { {PatternName} } from './{PatternName}';

const meta: Meta<typeof {PatternName}> = {
  title: 'Patterns/Common/{PatternName}',  // or 'Patterns/Domain/...'
  component: {PatternName},
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '[Brief description of the component and when to use it]',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    resource: {
      description: 'Resource to display',
    },
    onAction: {
      description: 'Callback when action is triggered',
      action: 'action triggered',
    },
    presenter: {
      control: 'select',
      options: ['mobile', 'tablet', 'desktop'],
      description: 'Force specific platform presenter',
    },
  },
};

export default meta;
type Story = StoryObj<typeof {PatternName}>;

// Story 1: Default
export const Default: Story = {
  args: {
    resource: {
      id: '1',
      name: 'Example Resource',
      status: 'active',
      type: 'vpn',
    },
  },
};

// Story 2: Mobile Presenter
export const Mobile: Story = {
  args: {
    ...Default.args,
    presenter: 'mobile',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

// Story 3: Tablet Presenter
export const Tablet: Story = {
  args: {
    ...Default.args,
    presenter: 'tablet',
  },
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};

// Story 4: Desktop Presenter
export const Desktop: Story = {
  args: {
    ...Default.args,
    presenter: 'desktop',
  },
};

// Story 5: Loading State
export const Loading: Story = {
  args: {
    ...Default.args,
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: /connect/i });
    await userEvent.click(button);
    // Should show loading state
  },
};

// Story 6: Error State
export const ErrorState: Story = {
  args: {
    resource: {
      ...Default.args.resource,
      status: 'error',
    },
  },
};

// Story 7: With Multiple Actions
export const WithActions: Story = {
  args: {
    ...Default.args,
    actions: [
      { id: 'edit', label: 'Edit', icon: 'pencil' },
      { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' },
      { id: 'clone', label: 'Clone', icon: 'copy' },
    ],
  },
};

// Story 8: Interaction Test
export const Interactions: Story = {
  args: {
    ...Default.args,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test expand/collapse
    const expandButton = canvas.getByRole('button', { name: /more/i });
    await userEvent.click(expandButton);
    expect(canvas.getByText(/additional details/i)).toBeInTheDocument();
    
    // Test primary action
    const connectButton = canvas.getByRole('button', { name: /connect/i });
    await userEvent.click(connectButton);
  },
};
```

---

## 9. Component Documentation (`README.md`)

```markdown
# {PatternName}

[Brief description of what this component does]

## When to Use

Use {PatternName} when:
- [Use case 1]
- [Use case 2]
- [Use case 3]

**Don't use when:**
- [Alternative scenario 1] - Use `OtherComponent` instead
- [Alternative scenario 2] - Use `AnotherComponent` instead

## Examples

### Basic Usage

\`\`\`tsx
<{PatternName} resource={vpnConnection} />
\`\`\`

### With Actions

\`\`\`tsx
<{PatternName} 
  resource={vpnConnection}
  onAction={(action, resource) => {
    if (action === 'delete') {
      deleteVPN(resource.id);
    }
  }}
  actions={[
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete', variant: 'danger' },
  ]}
/>
\`\`\`

### Force Desktop View

\`\`\`tsx
<{PatternName} resource={vpnConnection} presenter="desktop" />
\`\`\`

## Platform Presenters

### Mobile (<640px)
- Compact row layout
- Tap to expand details
- Large touch targets (44px)
- Bottom sheet for actions

### Tablet (640-1024px)
- Grid card layout
- Collapsible details
- Balanced density
- Optimized touch targets

### Desktop (>1024px)
- Full card with exposed actions
- Dense information display
- Inline editing
- Hover states and keyboard shortcuts

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `resource` | `T extends Resource` | required | Resource to display |
| `onAction` | `(action: string, resource: T) => void \| Promise<void>` | - | Callback when action triggered |
| `presenter` | `'mobile' \| 'tablet' \| 'desktop'` | auto | Force specific platform |
| `actions` | `Action[]` | `[]` | Additional actions to show |
| `className` | `string` | - | Custom CSS class |
| `defaultExpanded` | `boolean` | `false` | Show expanded initially |

## Accessibility

- **ARIA role:** `article`
- **Keyboard navigation:** Full keyboard support (Tab, Enter, Space, Escape)
- **Screen reader:** Announces resource name, status, and actions
- **Focus management:** Proper focus trap in modals
- **Touch targets:** Minimum 44×44px (WCAG AAA)
- **Contrast:** 7:1 ratio for all text (WCAG AAA)

## Related Components

- `OtherPattern` - [When to use instead]
- `RelatedPattern` - [Often used together]

## Technical Details

### Headless Hook
Logic is separated in `use{PatternName}` hook for maximum flexibility.

### State Management
- Local state: `expanded`, `loading`
- Derived state: `isActive`
- Stable callbacks: All handlers memoized

### Performance
- React.memo applied
- Lazy loading for heavy content
- Virtualization for lists >20 items

## Testing

Run tests:
\`\`\`bash
npm test {PatternName}
\`\`\`

Test coverage target: >80%

## Changelog

- v1.0 - Initial implementation
```

---

## 10. Barrel Export (`index.ts`)

```ts
export { {PatternName} } from './{PatternName}';
export { use{PatternName} } from './use{PatternName}';
export type { 
  {PatternName}Props,
  {PatternName}State,
  Action,
} from './types';
```

---

## Checklist Before Submitting

### Implementation
- [ ] Main component follows headless + presenter pattern
- [ ] All 3 platform presenters implemented (Mobile/Tablet/Desktop)
- [ ] TypeScript types defined
- [ ] Props have JSDoc comments
- [ ] Component has display name

### Testing
- [ ] Unit tests for headless hook (>80% coverage)
- [ ] Component tests for all presenters
- [ ] 5-8 Storybook stories created
- [ ] Interaction tests with Play functions
- [ ] Accessibility tested with axe-core

### Documentation
- [ ] Component README.md written
- [ ] When to use / when not to use documented
- [ ] Props table complete
- [ ] Examples provided
- [ ] Platform differences documented
- [ ] Accessibility notes included

### Quality
- [ ] Passes ESLint
- [ ] Passes TypeScript strict mode
- [ ] Passes accessibility tests (axe-core)
- [ ] Visual regression baseline created (Chromatic)
- [ ] Code reviewed by design team
- [ ] Added to [Component Library](./ux-design/6-component-library.md)

---

## Common Patterns

### Loading States

```tsx
{loading ? (
  <Skeleton className="h-20 w-full" />
) : (
  <Content />
)}
```

### Empty States

```tsx
{items.length === 0 ? (
  <EmptyState 
    icon="inbox"
    title="No items yet"
    message="Get started by creating your first item"
    action={{ label: 'Create Item', onClick: handleCreate }}
  />
) : (
  <ItemList items={items} />
)}
```

### Error Handling

```tsx
{error ? (
  <Alert variant="error" title="Failed to load">
    {error.message}
  </Alert>
) : (
  <Content />
)}
```

### Optimistic Updates

```tsx
const handleAction = useCallback(async () => {
  // Optimistic update
  setResource({ ...resource, status: 'connecting' });
  
  try {
    const result = await connectVPN(resource.id);
    setResource(result);
  } catch (error) {
    // Revert on error
    setResource({ ...resource, status: 'disconnected' });
    toast.error('Failed to connect');
  }
}, [resource]);
```

---

**Good luck building your pattern component! 🚀**

For questions, refer to:
- [Component Library](./ux-design/6-component-library.md)
- [Design System Foundation](./ux-design/1-design-system-foundation.md)
- [Design Tokens Reference](./DESIGN_TOKENS.md)
