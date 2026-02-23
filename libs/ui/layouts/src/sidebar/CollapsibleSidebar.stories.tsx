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
  argTypes: {
    isCollapsed: {
      control: 'boolean',
      description: 'Whether the sidebar is currently collapsed',
      table: { defaultValue: { summary: 'false' } },
    },
    onToggle: {
      action: 'toggle clicked',
      description: 'Callback when the collapse state changes',
    },
    showToggle: {
      control: 'boolean',
      description: 'Show the collapse toggle button',
      table: { defaultValue: { summary: 'true' } },
    },
    togglePosition: {
      control: 'select',
      options: ['top', 'middle', 'bottom'],
      description: 'Position of the toggle button on the sidebar edge',
      table: { defaultValue: { summary: 'bottom' } },
    },
    position: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Position of the sidebar (left or right side of screen)',
      table: { defaultValue: { summary: 'left' } },
    },
    collapsedWidth: {
      control: { type: 'number', min: 40, max: 100, step: 10 },
      description: 'Width of the sidebar when collapsed (in pixels)',
      table: { defaultValue: { summary: '64' } },
    },
    expandedWidth: {
      control: { type: 'number', min: 200, max: 400, step: 20 },
      description: 'Width of the sidebar when expanded (in pixels)',
      table: { defaultValue: { summary: '256' } },
    },
    className: {
      description: 'Additional CSS classes to apply to the sidebar container',
    },
    children: {
      description: 'Content to render inside the sidebar',
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

/**
 * Default state: sidebar is expanded
 * Shows full navigation labels and the collapse toggle button
 */
export const Expanded: Story = {
  args: {
    isCollapsed: false,
    showToggle: true,
    togglePosition: 'bottom',
    children: <AdaptiveNavMenu />,
  },
};

/**
 * Collapsed state: sidebar is minimized to icon-only view
 * Labels are hidden and icons are centered
 */
export const Collapsed: Story = {
  args: {
    isCollapsed: true,
    showToggle: true,
    togglePosition: 'bottom',
    children: <AdaptiveNavMenu />,
  },
};

/**
 * Toggle button positioned at middle of the sidebar
 * Useful for sidebars with significant vertical space
 */
export const ToggleAtMiddle: Story = {
  name: 'Toggle Button at Middle',
  args: {
    isCollapsed: false,
    showToggle: true,
    togglePosition: 'middle',
    children: <AdaptiveNavMenu />,
  },
};

/**
 * Sidebar without toggle button
 * Useful when collapse/expand is controlled elsewhere (e.g., menu button in header)
 */
export const NoToggleButton: Story = {
  name: 'Without Toggle Button',
  args: {
    isCollapsed: false,
    showToggle: false,
    children: <AdaptiveNavMenu />,
  },
};

/**
 * Sidebar positioned on the right side of the screen
 * Common in RTL layouts and right-aligned application designs
 */
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
 *
 * Try:
 * - Click the toggle button on the sidebar edge
 * - Press Ctrl+B / Cmd+B to toggle via keyboard shortcut
 * - Observe how the navigation labels hide when collapsed
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

/**
 * Example with custom width values
 * Demonstrates how to configure non-standard sidebar dimensions
 */
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
