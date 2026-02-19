import { useState } from 'react';

import {
  CollapsibleSidebar,
  CollapsibleSidebarProvider,
  useCollapsibleSidebarContext,
} from './CollapsibleSidebar';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof CollapsibleSidebar> = {
  title: 'Layouts/CollapsibleSidebar',
  component: CollapsibleSidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A sidebar wrapper with smooth collapse/expand behavior. ' +
          'State is managed externally (dependency injection) so the app layer can ' +
          'connect it to the Zustand sidebar store. Keyboard shortcut: Ctrl+B / Cmd+B.',
      },
    },
  },
  decorators: [
    (Story) => (
      // Provide a full-height container so the sidebar fills vertically
      <div style={{ display: 'flex', height: '100vh', background: 'var(--color-background, #fff)' }}>
        <Story />
        {/* Fake main area */}
        <main style={{ flex: 1, padding: '1.5rem', background: 'var(--color-background, #fff)' }}>
          <div
            style={{
              height: '100%',
              borderRadius: 8,
              background: 'var(--color-muted, #f3f4f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-muted-foreground, #6b7280)',
              fontSize: 14,
            }}
          >
            Main content area
          </div>
        </main>
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof CollapsibleSidebar>;

// ---------------------------------------------------------------------------
// A simple nav list that adapts to the collapsed state via context
// ---------------------------------------------------------------------------

const navItems = [
  { label: 'Dashboard', icon: '🏠' },
  { label: 'Network', icon: '🌐' },
  { label: 'VPN', icon: '🔒' },
  { label: 'Firewall', icon: '🛡️' },
  { label: 'Diagnostics', icon: '🩺' },
  { label: 'Services', icon: '📦' },
  { label: 'Settings', icon: '⚙️' },
];

function AdaptiveNavMenu() {
  const { isCollapsed } = useCollapsibleSidebarContext();
  return (
    <nav style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {navItems.map(({ label, icon }) => (
        <div
          key={label}
          title={isCollapsed ? label : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: isCollapsed ? '0.5rem' : '0.5rem 0.75rem',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
          }}
          className="hover:bg-accent"
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
          {!isCollapsed && <span>{label}</span>}
        </div>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Expanded: Story = {
  args: {
    isCollapsed: false,
    showToggle: true,
    togglePosition: 'bottom',
    children: <AdaptiveNavMenu />,
  },
};

export const Collapsed: Story = {
  args: {
    isCollapsed: true,
    showToggle: true,
    togglePosition: 'bottom',
    children: <AdaptiveNavMenu />,
  },
};

export const ToggleAtMiddle: Story = {
  name: 'Toggle Button at Middle',
  args: {
    isCollapsed: false,
    showToggle: true,
    togglePosition: 'middle',
    children: <AdaptiveNavMenu />,
  },
};

export const NoToggleButton: Story = {
  name: 'Without Toggle Button',
  args: {
    isCollapsed: false,
    showToggle: false,
    children: <AdaptiveNavMenu />,
  },
};

export const RightPosition: Story = {
  name: 'Right-Side Sidebar',
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', height: '100vh', background: 'var(--color-background, #fff)' }}>
        {/* Fake main area on the left */}
        <main style={{ flex: 1, padding: '1.5rem' }}>
          <div
            style={{
              height: '100%',
              borderRadius: 8,
              background: 'var(--color-muted, #f3f4f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-muted-foreground, #6b7280)',
              fontSize: 14,
            }}
          >
            Main content area
          </div>
        </main>
        <Story />
      </div>
    ),
  ],
  args: {
    isCollapsed: false,
    showToggle: true,
    togglePosition: 'middle',
    position: 'right',
    children: <AdaptiveNavMenu />,
  },
};

/**
 * Interactive story with local state wired to toggle, demonstrating the
 * pattern used in the app layer when connecting the Zustand sidebar store.
 * Also shows how CollapsibleSidebarProvider feeds context to children.
 */
export const Interactive: Story = {
  render: () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggle = () => setIsCollapsed((c) => !c);

    return (
      <div style={{ display: 'flex', height: '100vh', background: 'var(--color-background, #fff)' }}>
        <CollapsibleSidebarProvider isCollapsed={isCollapsed} toggle={toggle}>
          <CollapsibleSidebar
            isCollapsed={isCollapsed}
            onToggle={toggle}
            showToggle
            togglePosition="bottom"
          >
            <AdaptiveNavMenu />
          </CollapsibleSidebar>
        </CollapsibleSidebarProvider>

        <main style={{ flex: 1, padding: '1.5rem' }}>
          <p style={{ fontSize: 14, color: 'var(--color-muted-foreground, #6b7280)', marginBottom: '1rem' }}>
            Sidebar is <strong>{isCollapsed ? 'collapsed' : 'expanded'}</strong>.
            Click the edge toggle or press Ctrl+B / Cmd+B to toggle.
          </p>
          <div
            style={{
              height: '80%',
              borderRadius: 8,
              background: 'var(--color-muted, #f3f4f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-muted-foreground, #6b7280)',
              fontSize: 14,
            }}
          >
            Main content area
          </div>
        </main>
      </div>
    );
  },
};

export const CustomWidths: Story = {
  name: 'Custom Widths (80px collapsed / 320px expanded)',
  args: {
    isCollapsed: false,
    showToggle: true,
    togglePosition: 'bottom',
    collapsedWidth: 80,
    expandedWidth: 320,
    children: <AdaptiveNavMenu />,
  },
};
