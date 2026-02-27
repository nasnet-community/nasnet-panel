import React, { useState, useMemo } from 'react';

import { Card } from '@nasnet/ui/primitives';

import { VirtualizedList } from './VirtualizedList';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * VirtualizedList provides high-performance rendering for large lists.
 * It only renders visible items plus a configurable overscan buffer,
 * making it suitable for lists with 1000+ items.
 *
 * Key Features:
 * - Automatic virtualization for lists >20 items
 * - Variable height item support
 * - Keyboard navigation (arrow keys)
 * - Scroll position restoration
 * - ARIA compliant for accessibility
 *
 * Performance Targets:
 * - 60fps scroll performance
 * - <16ms render budget per frame
 * - Memory efficient (only renders visible items)
 */
const meta: Meta = {
  title: 'Performance/VirtualizedList',
  component: VirtualizedList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'High-performance virtualized list component for rendering large datasets efficiently.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// Mock data generator
interface MockItem {
  id: number;
  name: string;
  status: 'active' | 'pending' | 'inactive';
  description: string;
}

function generateItems(count: number): MockItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    status:
      i % 3 === 0 ? 'active'
      : i % 3 === 1 ? 'pending'
      : 'inactive',
    description: `This is the description for item ${i + 1}. It contains some text to demonstrate variable content lengths.`,
  }));
}

// Simple item renderer
const SimpleItemRenderer = ({ item }: { item: MockItem }) => (
  <div className="border-b border-gray-200 p-4 dark:border-gray-700">
    <div className="font-medium">{item.name}</div>
    <div className="text-sm text-gray-500">{item.status}</div>
  </div>
);

// Card item renderer
const CardItemRenderer = ({ item }: { item: MockItem }) => (
  <Card className="m-2 p-4">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
      </div>
      <span
        className={`rounded-full px-2 py-1 text-xs ${
          item.status === 'active' ?
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
          : item.status === 'pending' ?
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
        }`}
      >
        {item.status}
      </span>
    </div>
  </Card>
);

/**
 * Basic usage with 1000 items. Notice how only visible items are rendered.
 */
export const Default: Story = {
  args: {
    items: generateItems(1000),
    estimateSize: 60,
    height: 400,
    renderItem: ({
      item,
      virtualItem,
      index,
      measureRef,
      isFocused,
    }: {
      item: MockItem;
      virtualItem: any;
      index: number;
      measureRef: any;
      isFocused: boolean;
    }) => (
      <div ref={measureRef}>
        <SimpleItemRenderer item={item} />
      </div>
    ),
  },
};

/**
 * Large dataset with 10,000 items demonstrating performance at scale.
 */
export const LargeDataset: Story = {
  args: {
    items: generateItems(10000),
    estimateSize: 60,
    height: 500,
    renderItem: ({
      item,
      virtualItem,
      index,
      measureRef,
      isFocused,
    }: {
      item: MockItem;
      virtualItem: any;
      index: number;
      measureRef: any;
      isFocused: boolean;
    }) => (
      <div ref={measureRef}>
        <SimpleItemRenderer item={item} />
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates virtualization with 10,000 items. Scroll performance should remain smooth.',
      },
    },
  },
};

/**
 * Card-style items with variable heights.
 */
export const CardItems: Story = {
  args: {
    items: generateItems(500),
    estimateSize: 100,
    height: 500,
    renderItem: ({
      item,
      virtualItem,
      index,
      measureRef,
      isFocused,
    }: {
      item: MockItem;
      virtualItem: any;
      index: number;
      measureRef: any;
      isFocused: boolean;
    }) => (
      <div ref={measureRef}>
        <CardItemRenderer item={item} />
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Card-style items with more complex layout and variable heights.',
      },
    },
  },
};

/**
 * Demonstrates keyboard navigation. Use arrow keys to navigate, Enter to select.
 */
export const WithKeyboardNavigation: Story = {
  args: {
    items: generateItems(100),
    estimateSize: 60,
    height: 400,
    enableKeyboardNav: true,
    renderItem: ({
      item,
      virtualItem,
      index,
      measureRef,
      isFocused,
    }: {
      item: MockItem;
      virtualItem: any;
      index: number;
      measureRef: any;
      isFocused: boolean;
    }) => (
      <div ref={measureRef}>
        <SimpleItemRenderer item={item} />
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Enable keyboard navigation with arrow keys. Press Tab to focus the list, then use arrows.',
      },
    },
  },
};

/**
 * Interactive example with filtering to show re-render performance.
 */
export const WithFiltering: Story = {
  render: () => {
    const [filter, setFilter] = useState<string>('');
    const allItems = useMemo(() => generateItems(1000), []);
    const filteredItems = useMemo(
      () =>
        filter ?
          allItems.filter((item) => item.name.toLowerCase().includes(filter.toLowerCase()))
        : allItems,
      [allItems, filter]
    );

    return (
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Filter items..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded-lg border px-4 py-2"
        />
        <div className="text-sm text-gray-500">
          Showing {filteredItems.length} of {allItems.length} items
        </div>
        <VirtualizedList
          items={filteredItems}
          estimateSize={60}
          height={400}
          renderItem={({
            item,
            virtualItem,
            index,
            measureRef,
            isFocused,
          }: {
            item: MockItem;
            virtualItem: any;
            index: number;
            measureRef: any;
            isFocused: boolean;
          }) => (
            <div ref={measureRef}>
              <SimpleItemRenderer item={item} />
            </div>
          )}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive filtering example. Type to filter - virtualization handles re-renders efficiently.',
      },
    },
  },
};

/**
 * Small list that does not require virtualization (below threshold).
 */
export const SmallList: Story = {
  args: {
    items: generateItems(10),
    estimateSize: 60,
    height: 400,
    renderItem: ({
      item,
      virtualItem,
      index,
      measureRef,
      isFocused,
    }: {
      item: MockItem;
      virtualItem: any;
      index: number;
      measureRef: any;
      isFocused: boolean;
    }) => (
      <div ref={measureRef}>
        <SimpleItemRenderer item={item} />
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Lists below 20 items render normally without virtualization overhead.',
      },
    },
  },
};

/**
 * Force virtualization even for small lists (useful for consistent behavior).
 */
export const ForceVirtualization: Story = {
  args: {
    items: generateItems(15),
    estimateSize: 60,
    height: 400,
    forceVirtualization: true,
    renderItem: ({
      item,
      virtualItem,
      index,
      measureRef,
      isFocused,
    }: {
      item: MockItem;
      virtualItem: any;
      index: number;
      measureRef: any;
      isFocused: boolean;
    }) => (
      <div ref={measureRef}>
        <SimpleItemRenderer item={item} />
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Use forceVirtualization to enable virtualization regardless of list size.',
      },
    },
  },
};

/**
 * Custom overscan to reduce/increase buffer items.
 */
export const CustomOverscan: Story = {
  args: {
    items: generateItems(1000),
    estimateSize: 60,
    height: 400,
    overscan: 10,
    renderItem: ({
      item,
      virtualItem,
      index,
      measureRef,
      isFocused,
    }: {
      item: MockItem;
      virtualItem: any;
      index: number;
      measureRef: any;
      isFocused: boolean;
    }) => (
      <div ref={measureRef}>
        <SimpleItemRenderer item={item} />
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Overscan controls how many items render outside the visible area. Higher values reduce blank flashes during fast scrolling.',
      },
    },
  },
};
