/**
 * SortableList Stories
 *
 * Storybook documentation for the drag & drop sortable list system.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */

import { useState } from 'react';

import { FirewallRuleList, type FirewallRule } from '../domain';
import { SortableList, SortableListDesktop, SortableListMobile, useSortableList } from '../index';

import type { SortableItemData, SortableItemRenderOptions } from '../types';
import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Test Data
// ============================================================================

interface SimpleItem extends SortableItemData {
  id: string;
  label: string;
  description?: string;
}

const createSimpleItems = (count = 5): SimpleItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `item-${i + 1}`,
    label: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`,
  }));

const sampleFirewallRules: FirewallRule[] = [
  {
    id: 'rule-1',
    chain: 'input',
    action: 'accept',
    src: '192.168.1.0/24',
    dst: undefined,
    protocol: 'tcp',
    dstPort: '22',
    comment: 'Allow SSH from LAN',
    hitCount: 1234,
  },
  {
    id: 'rule-2',
    chain: 'input',
    action: 'accept',
    src: '192.168.1.0/24',
    dst: undefined,
    protocol: 'tcp',
    dstPort: '80,443',
    comment: 'Allow HTTP/HTTPS',
    hitCount: 45678,
  },
  {
    id: 'rule-3',
    chain: 'forward',
    action: 'drop',
    src: 'any',
    dst: '10.0.0.0/8',
    comment: 'Block private range access',
    hitCount: 12,
  },
  {
    id: 'rule-4',
    chain: 'input',
    action: 'log',
    comment: 'Log all other input',
    hitCount: 9999,
  },
  {
    id: 'rule-5',
    chain: 'input',
    action: 'drop',
    comment: 'Drop all other input',
    hitCount: 5432,
  },
];

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof SortableList> = {
  title: 'Patterns/Sortable/SortableList',
  component: SortableList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# SortableList

A drag & drop reorderable list component with full accessibility support.

## Features

- **Mouse, Touch, and Keyboard Support**: Works on all devices
- **WCAG AAA Accessibility**: Screen reader announcements, keyboard navigation
- **Multi-select**: Shift+click for range, Ctrl+click for toggle
- **Undo/Redo**: Built-in history management
- **Platform Presenters**: Optimized for mobile and desktop
- **Animation**: Smooth transitions with Framer Motion

## Keyboard Controls

| Key | Action |
|-----|--------|
| Tab | Navigate between items |
| Space/Enter | Start/confirm drag |
| Arrow Up/Down | Move item |
| Home | Move to top |
| End | Move to bottom |
| Escape | Cancel drag |
| Shift+Click | Range select |
| Cmd/Ctrl+Click | Toggle select |
| Cmd/Ctrl+A | Select all |

## Usage

\`\`\`tsx
import { SortableList } from '@nasnet/ui/patterns/sortable';

function MyList() {
  const [items, setItems] = useState([
    { id: '1', label: 'Item 1' },
    { id: '2', label: 'Item 2' },
  ]);

  return (
    <SortableList
      items={items}
      onReorder={({ items }) => setItems(items)}
      renderItem={(item) => <div>{item.label}</div>}
    />
  );
}
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SortableList>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Basic sortable list with drag and drop.
 */
export const Basic: Story = {
  render: () => {
    const [items, setItems] = useState<SimpleItem[]>(createSimpleItems(5));

    return (
      <div className="max-w-md">
        <SortableList<SimpleItem>
          items={items}
          onReorder={(event) => setItems(event.items)}
          renderItem={(item: SimpleItem) => (
            <div className="bg-card border-border rounded-lg border p-3">
              <div className="font-medium">{item.label}</div>
              {item.description && (
                <div className="text-muted-foreground text-sm">{item.description}</div>
              )}
            </div>
          )}
          aria-label="Basic sortable list"
        />
      </div>
    );
  },
};

/**
 * List with position numbers displayed.
 */
export const WithPositionNumbers: Story = {
  render: () => {
    const [items, setItems] = useState<SimpleItem[]>(createSimpleItems(5));

    return (
      <div className="max-w-md">
        <SortableList<SimpleItem>
          items={items}
          onReorder={(event) => setItems(event.items)}
          showPositionNumbers={true}
          renderItem={(item: SimpleItem) => (
            <div className="bg-card border-border rounded-lg border p-3">
              <div className="font-medium">{item.label}</div>
            </div>
          )}
          aria-label="List with position numbers"
        />
      </div>
    );
  },
};

/**
 * Desktop-optimized list with context menu.
 */
export const Desktop: Story = {
  render: () => {
    const [items, setItems] = useState<SimpleItem[]>(createSimpleItems(5));

    return (
      <div className="max-w-lg">
        <p className="text-muted-foreground mb-4 text-sm">
          Right-click on an item to see the context menu with move options.
        </p>
        <SortableListDesktop<SimpleItem>
          items={items}
          onReorder={(event) => setItems(event.items)}
          showContextMenu={true}
          showRowNumbers={true}
          multiSelect={true}
          actions={{
            onDelete: (item) => {
              setItems((prev) => prev.filter((i) => i.id !== item.id));
            },
            onDuplicate: (item) => {
              const newItem = { ...item, id: `${item.id}-copy`, label: `${item.label} (Copy)` };
              setItems((prev) => [...prev, newItem]);
            },
          }}
          renderItem={(item: SimpleItem) => (
            <div className="py-1">
              <div className="font-medium">{item.label}</div>
              {item.description && (
                <div className="text-muted-foreground text-xs">{item.description}</div>
              )}
            </div>
          )}
          aria-label="Desktop sortable list"
        />
      </div>
    );
  },
};

/**
 * Mobile-optimized list with move buttons.
 */
export const Mobile: Story = {
  render: () => {
    const [items, setItems] = useState<SimpleItem[]>(createSimpleItems(5));

    const handleMoveItem = (id: string, direction: 'up' | 'down') => {
      const index = items.findIndex((i) => i.id === id);
      if (direction === 'up' && index > 0) {
        const newItems = [...items];
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        setItems(newItems);
      } else if (direction === 'down' && index < items.length - 1) {
        const newItems = [...items];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        setItems(newItems);
      }
    };

    return (
      <div className="max-w-sm">
        <p className="text-muted-foreground mb-4 text-sm">
          Long-press to drag, or use the up/down buttons.
        </p>
        <SortableListMobile<SimpleItem>
          items={items}
          onReorder={(event) => setItems(event.items)}
          onMoveItem={handleMoveItem}
          showMoveButtons={true}
          renderItem={(item: SimpleItem) => (
            <div>
              <div className="font-medium">{item.label}</div>
              {item.description && (
                <div className="text-muted-foreground text-xs">{item.description}</div>
              )}
            </div>
          )}
          aria-label="Mobile sortable list"
        />
      </div>
    );
  },
  globals: {
    viewport: {
      value: 'mobile1',
      isRotated: false,
    },
  },
};

/**
 * Multi-select drag example.
 */
export const MultiSelect: Story = {
  render: () => {
    const [items, setItems] = useState<SimpleItem[]>(createSimpleItems(8));

    return (
      <div className="max-w-md">
        <p className="text-muted-foreground mb-4 text-sm">
          Use Shift+click for range selection, Ctrl/Cmd+click for toggle. Drag any selected item to
          move all selected items together.
        </p>
        <SortableList<SimpleItem>
          items={items}
          onReorder={(event) => setItems(event.items)}
          multiSelect={true}
          renderItem={(item: SimpleItem, options: SortableItemRenderOptions) => (
            <div
              className={`bg-card rounded-lg border p-3 transition-colors ${
                options.isSelected ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="font-medium">{item.label}</div>
            </div>
          )}
          aria-label="Multi-select sortable list"
        />
      </div>
    );
  },
};

/**
 * Firewall rules domain implementation.
 */
export const FirewallRules: Story = {
  render: () => {
    const [rules, setRules] = useState<FirewallRule[]>(sampleFirewallRules);

    return (
      <div className="max-w-2xl">
        <h3 className="mb-4 text-lg font-semibold">Firewall Filter Rules</h3>
        <FirewallRuleList
          rules={rules}
          onReorder={(event) => setRules(event.items)}
          onDelete={(rule) => {
            setRules((prev) => prev.filter((r) => r.id !== rule.id));
          }}
          onDuplicate={(rule) => {
            const newRule = {
              ...rule,
              id: `${rule.id}-copy`,
              comment: `${rule.comment} (Copy)`,
            };
            setRules((prev) => [...prev, newRule]);
          }}
        />
      </div>
    );
  },
};

/**
 * Empty state display.
 */
export const EmptyState: Story = {
  render: () => (
    <div className="max-w-md">
      <SortableList<SimpleItem>
        items={[]}
        onReorder={() => {}}
        renderItem={() => null}
        emptyState={
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No items yet</p>
            <p className="text-muted-foreground mt-1 text-sm">Add some items to get started</p>
          </div>
        }
        aria-label="Empty sortable list"
      />
    </div>
  ),
};

/**
 * Interactive playground for testing all features.
 */
export const Playground: Story = {
  render: () => {
    const [items, setItems] = useState<SimpleItem[]>(createSimpleItems(10));
    const [showPositions, setShowPositions] = useState(true);
    const [showHandles, setShowHandles] = useState(true);
    const [multiSelect, setMultiSelect] = useState(true);

    return (
      <div className="max-w-lg">
        <div className="bg-muted/50 mb-6 flex flex-wrap gap-4 rounded-lg p-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showPositions}
              onChange={(e) => setShowPositions(e.target.checked)}
              className="rounded"
            />
            Show positions
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showHandles}
              onChange={(e) => setShowHandles(e.target.checked)}
              className="rounded"
            />
            Show drag handles
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={multiSelect}
              onChange={(e) => setMultiSelect(e.target.checked)}
              className="rounded"
            />
            Multi-select
          </label>
        </div>

        <SortableList<SimpleItem>
          items={items}
          onReorder={(event) => setItems(event.items)}
          showPositionNumbers={showPositions}
          showDragHandle={showHandles}
          multiSelect={multiSelect}
          renderItem={(item: SimpleItem) => (
            <div className="bg-card border-border rounded-lg border p-3">
              <div className="font-medium">{item.label}</div>
              {item.description && (
                <div className="text-muted-foreground text-sm">{item.description}</div>
              )}
            </div>
          )}
          aria-label="Playground sortable list"
        />

        <div className="bg-muted/30 text-muted-foreground mt-4 rounded p-3 text-xs">
          <strong>Current order:</strong> {items.map((i) => i.label).join(', ')}
        </div>
      </div>
    );
  },
};

/**
 * Hook-based example with undo/redo.
 */
export const WithUndoRedo: Story = {
  render: () => {
    const [items, setItems] = useState<SimpleItem[]>(createSimpleItems(5));
    const sortable = useSortableList(items, {
      undoEnabled: true,
      onReorder: (event) => setItems(event.items),
    });

    return (
      <div className="max-w-md">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => sortable.undo()}
            disabled={!sortable.canUndo}
            className="bg-muted rounded px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Undo (Cmd+Z)
          </button>
          <button
            onClick={() => sortable.redo()}
            disabled={!sortable.canRedo}
            className="bg-muted rounded px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Redo (Cmd+Shift+Z)
          </button>
        </div>

        <SortableList<SimpleItem>
          items={sortable.items}
          onReorder={(event) => setItems(event.items)}
          renderItem={(item: SimpleItem) => (
            <div className="bg-card border-border rounded-lg border p-3">
              <div className="font-medium">{item.label}</div>
            </div>
          )}
          aria-label="Sortable list with undo/redo"
        />
      </div>
    );
  },
};
