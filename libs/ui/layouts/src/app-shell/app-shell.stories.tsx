import { AppShell } from './app-shell';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof AppShell> = {
  title: 'Layouts/AppShell',
  component: AppShell,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof AppShell>;

// ---------------------------------------------------------------------------
// Shared placeholder blocks
// ---------------------------------------------------------------------------

const MockHeader = (
  <div className="h-full flex items-center px-6 gap-4">
    <span className="font-semibold text-lg">NasNetConnect</span>
    <nav className="flex gap-4 ml-auto text-sm text-muted-foreground">
      <a href="/dashboard">Dashboard</a>
      <a href="/network">Network</a>
      <a href="/firewall">Firewall</a>
    </nav>
  </div>
);

const MockSidebar = (
  <div className="p-4 flex flex-col gap-2 h-full">
    {['Dashboard', 'Network', 'VPN', 'Firewall', 'Diagnostics', 'Services', 'Settings'].map(
      (item) => (
        <div
          key={item}
          className="px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent cursor-pointer"
        >
          {item}
        </div>
      )
    )}
  </div>
);

const MockContent = (
  <div className="p-6 flex flex-col gap-4">
    <div className="h-24 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
      Main content area
    </div>
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-32 rounded-lg bg-muted/50 border border-border" />
      ))}
    </div>
  </div>
);

const MockFooter = (
  <div className="px-6 py-3 text-xs text-muted-foreground">
    NasNetConnect v1.0.0 &mdash; MikroTik Router Management
  </div>
);

const MockBanner = (
  <div className="bg-warning text-white px-6 py-2 text-sm text-center">
    Offline mode active &mdash; changes will be applied when reconnected
  </div>
);

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    header: MockHeader,
    sidebar: MockSidebar,
    children: MockContent,
  },
};

export const WithFooter: Story = {
  args: {
    header: MockHeader,
    sidebar: MockSidebar,
    footer: MockFooter,
    children: MockContent,
  },
};

export const CollapsedSidebar: Story = {
  args: {
    header: MockHeader,
    sidebar: (
      <div className="p-2 flex flex-col gap-2 items-center h-full">
        {['D', 'N', 'V', 'F', 'X', 'S', '⚙'].map((icon, i) => (
          <div
            key={i}
            className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-sm font-medium cursor-pointer hover:bg-accent"
          >
            {icon}
          </div>
        ))}
      </div>
    ),
    sidebarCollapsed: true,
    children: MockContent,
  },
};

export const RightSidebar: Story = {
  args: {
    header: MockHeader,
    sidebar: MockSidebar,
    sidebarPosition: 'right',
    children: MockContent,
  },
};

export const WithBanner: Story = {
  args: {
    header: MockHeader,
    sidebar: MockSidebar,
    banner: MockBanner,
    footer: MockFooter,
    children: MockContent,
  },
};

export const NoSidebar: Story = {
  args: {
    header: MockHeader,
    footer: MockFooter,
    children: MockContent,
  },
};
