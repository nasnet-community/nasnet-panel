import { AppShell } from './app-shell';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * AppShell Component Stories
 *
 * Pattern component for main application layout with header, sidebar, and footer.
 *
 * Platform support:
 * - Desktop (>1024px): Sidebar visible, fixed layout
 * - Tablet (640-1024px): Sidebar hidden, full-width content
 * - Mobile (<640px): Sidebar hidden, full-width content (use BottomNavigation instead)
 *
 * @see https://Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */
const meta: Meta<typeof AppShell> = {
  title: 'Layouts/AppShell',
  component: AppShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Main application layout wrapper with responsive header, sidebar (desktop only), main content area, and optional footer. Uses semantic HTML with proper ARIA labels for accessibility.',
      },
    },
  },
  argTypes: {
    children: {
      description: 'Main content area (required)',
      control: { disable: true },
    },
    header: {
      description: 'Header/top navigation bar',
      control: { disable: true },
    },
    footer: {
      description: 'Footer (sticky to bottom)',
      control: { disable: true },
    },
    sidebar: {
      description: 'Sidebar navigation (hidden on mobile, visible md+)',
      control: { disable: true },
    },
    sidebarPosition: {
      description: 'Sidebar position relative to main content',
      control: { type: 'select', options: ['left', 'right'] },
      table: { defaultValue: { summary: 'left' } },
    },
    sidebarCollapsed: {
      description: 'Sidebar collapse state (w-64 → w-16 transition)',
      control: { type: 'boolean' },
      table: { defaultValue: { summary: 'false' } },
    },
    banner: {
      description: 'Optional status banner between header and content',
      control: { disable: true },
    },
    className: {
      description: 'Additional CSS classes for root element',
      control: { disable: true },
    },
  },
};
export default meta;
type Story = StoryObj<typeof AppShell>;

// ---------------------------------------------------------------------------
// Shared placeholder blocks
// ---------------------------------------------------------------------------

const MockHeader = (
  <header className="h-full flex items-center px-6 gap-4">
    <span className="font-semibold text-lg">NasNetConnect</span>
    <nav className="flex gap-4 ml-auto text-sm text-muted-foreground">
      <a href="#dashboard">Dashboard</a>
      <a href="#network">Network</a>
      <a href="#firewall">Firewall</a>
    </nav>
  </header>
);

const MockSidebar = (
  <nav className="p-4 flex flex-col gap-2 h-full">
    {['Dashboard', 'Network', 'VPN', 'Firewall', 'Diagnostics', 'Services', 'Settings'].map(
      (item) => (
        <a
          key={item}
          href={`#${item.toLowerCase()}`}
          className="px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent cursor-pointer transition-colors"
        >
          {item}
        </a>
      )
    )}
  </nav>
);

const MockContent = (
  <section className="p-6 flex flex-col gap-4">
    <div className="h-24 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
      Main content area
    </div>
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((n) => (
        <article
          key={n}
          className="h-32 rounded-lg bg-muted/50 border border-border flex items-center justify-center"
        >
          Card {n}
        </article>
      ))}
    </div>
  </section>
);

const MockFooter = (
  <footer className="px-6 py-3 text-xs text-muted-foreground">
    NasNetConnect v1.0.0 &mdash; MikroTik Router Management
  </footer>
);

const MockBanner = (
  <div className="bg-warning text-white px-6 py-2 text-sm text-center" role="alert">
    Offline mode active &mdash; changes will be applied when reconnected
  </div>
);

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default Desktop Layout
 * Shows the full desktop layout with header, left sidebar, and main content area.
 */
export const Default: Story = {
  args: {
    header: MockHeader,
    sidebar: MockSidebar,
    children: MockContent,
  },
  parameters: {
    viewport: 'desktop1280',
  },
};

/**
 * Desktop Layout with Footer
 * Demonstrates sticky footer at bottom of page.
 */
export const WithFooter: Story = {
  args: {
    header: MockHeader,
    sidebar: MockSidebar,
    footer: MockFooter,
    children: MockContent,
  },
  parameters: {
    viewport: 'desktop1280',
  },
};

/**
 * Collapsed Sidebar State
 * Shows sidebar in collapsed mode (w-16), commonly used when user toggles collapse.
 */
export const CollapsedSidebar: Story = {
  args: {
    header: MockHeader,
    sidebar: (
      <nav className="p-2 flex flex-col gap-2 items-center h-full" aria-label="Collapsed navigation">
        {['D', 'N', 'V', 'F', 'X', 'S', '⚙'].map((icon, i) => (
          <button
            key={i}
            type="button"
            className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-sm font-medium cursor-pointer hover:bg-accent transition-colors"
            aria-label={`Navigation item ${i + 1}`}
          >
            {icon}
          </button>
        ))}
      </nav>
    ),
    sidebarCollapsed: true,
    children: MockContent,
  },
  parameters: {
    viewport: 'desktop1280',
  },
};

/**
 * Right-Positioned Sidebar
 * Sidebar on the right side instead of left.
 */
export const RightSidebar: Story = {
  args: {
    header: MockHeader,
    sidebar: MockSidebar,
    sidebarPosition: 'right',
    children: MockContent,
  },
  parameters: {
    viewport: 'desktop1280',
  },
};

/**
 * With Status Banner
 * Shows optional banner area (for offline, alerts, etc.) between header and content.
 */
export const WithBanner: Story = {
  args: {
    header: MockHeader,
    sidebar: MockSidebar,
    banner: MockBanner,
    footer: MockFooter,
    children: MockContent,
  },
  parameters: {
    viewport: 'desktop1280',
  },
};

/**
 * No Sidebar (Full Width)
 * Desktop layout without sidebar - full width content area.
 */
export const NoSidebar: Story = {
  args: {
    header: MockHeader,
    footer: MockFooter,
    children: MockContent,
  },
  parameters: {
    viewport: 'desktop1280',
  },
};

/**
 * Mobile Viewport
 * Shows how layout responds on mobile devices (<640px).
 * Sidebar is hidden with `hidden md:block` CSS class.
 */
export const Mobile: Story = {
  args: {
    header: MockHeader,
    sidebar: MockSidebar,
    footer: MockFooter,
    children: MockContent,
  },
  parameters: {
    viewport: 'iphone12',
  },
};

/**
 * Tablet Viewport
 * Shows how layout responds on tablets (640-1024px).
 * Sidebar is hidden but could be collapsible with drawer pattern.
 */
export const Tablet: Story = {
  args: {
    header: MockHeader,
    sidebar: MockSidebar,
    footer: MockFooter,
    children: MockContent,
  },
  parameters: {
    viewport: 'ipad',
  },
};
