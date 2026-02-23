import { SidebarLayout } from './sidebar-layout';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SidebarLayout> = {
  title: 'Layouts/SidebarLayout',
  component: SidebarLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A flexible two-column layout with a sidebar. Stacks vertically on mobile, side-by-side on tablet/desktop. Supports left/right positioning, configurable gap sizes, and custom sidebar width.',
      },
    },
  },
  argTypes: {
    children: { control: false },
    sidebar: { control: false },
    sidebarWidth: { control: 'text' },
    sidebarPosition: { control: 'radio', options: ['left', 'right'] },
    gap: { control: 'radio', options: ['none', 'sm', 'md', 'lg'] },
    className: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof SidebarLayout>;

// ---------------------------------------------------------------------------
// Shared mock content
// ---------------------------------------------------------------------------

const MockSidebar = (
  <div className="p-4 flex flex-col gap-3">
    <div className="text-sm font-semibold text-foreground mb-2">Filters</div>
    {['Category', 'Status', 'Priority', 'Date Range'].map((filter) => (
      <div key={filter} className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground">{filter}</label>
        <div className="px-3 py-2 rounded border border-border bg-background text-sm">
          Select...
        </div>
      </div>
    ))}
  </div>
);

const MockContent = (
  <div className="p-6 flex flex-col gap-4">
    <div>
      <h2 className="text-2xl font-bold mb-2">Results</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Apply filters on the left to narrow down results
      </p>
    </div>

    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 cursor-pointer transition-colors"
        >
          <div className="font-medium mb-1">Result Item {n}</div>
          <p className="text-sm text-muted-foreground">
            Description for item {n} with some details and context
          </p>
        </div>
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    sidebar: MockSidebar,
    children: MockContent,
    sidebarPosition: 'left',
    gap: 'md',
  },
};

export const RightSidebar: Story = {
  args: {
    sidebar: MockSidebar,
    children: MockContent,
    sidebarPosition: 'right',
    gap: 'md',
  },
};

export const SmallGap: Story = {
  args: {
    sidebar: MockSidebar,
    children: MockContent,
    sidebarPosition: 'left',
    gap: 'sm',
  },
};

export const LargeGap: Story = {
  args: {
    sidebar: MockSidebar,
    children: MockContent,
    sidebarPosition: 'left',
    gap: 'lg',
  },
};

export const NoGap: Story = {
  args: {
    sidebar: MockSidebar,
    children: MockContent,
    sidebarPosition: 'left',
    gap: 'none',
  },
};

export const NarrowSidebar: Story = {
  args: {
    sidebar: MockSidebar,
    children: MockContent,
    sidebarPosition: 'left',
    sidebarWidth: '12rem',
    gap: 'md',
  },
};

export const WideSidebar: Story = {
  args: {
    sidebar: MockSidebar,
    children: MockContent,
    sidebarPosition: 'left',
    sidebarWidth: '20rem',
    gap: 'md',
  },
};

export const Mobile: Story = {
  name: 'Mobile (375px - Stacked)',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
      viewports: {
        mobile1: {
          name: 'Mobile 1',
          styles: { width: '375px', height: '667px' },
        },
      },
    },
  },
  args: {
    sidebar: MockSidebar,
    children: MockContent,
    sidebarPosition: 'left',
    gap: 'md',
  },
};

export const Tablet: Story = {
  name: 'Tablet (768px - Side-by-side)',
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
      viewports: {
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
      },
    },
  },
  args: {
    sidebar: MockSidebar,
    children: MockContent,
    sidebarPosition: 'left',
    gap: 'md',
  },
};

export const Desktop: Story = {
  name: 'Desktop (1280px - Full)',
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
      viewports: {
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
        },
      },
    },
  },
  args: {
    sidebar: MockSidebar,
    children: MockContent,
    sidebarPosition: 'left',
    gap: 'md',
  },
};
