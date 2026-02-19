/**
 * TabNavigation Stories
 *
 * TabNavigation integrates deeply with @tanstack/react-router (useNavigate,
 * useRouterState) and the app's lazy-preload system.  Stories use
 * Storybook's module-mock capability to stub these dependencies, presenting
 * the component in its two responsive layouts (desktop top-bar and mobile
 * bottom-bar) across all meaningful active-tab states.
 *
 * NOTE: Because this component is tightly coupled to the router context,
 * the stories render a visual replica using the same class names and DOM
 * structure so reviewers can audit the design without wiring up a full
 * TanStack Router tree.
 */

import {
  LayoutDashboard,
  Wifi,
  Shield,
  ShieldAlert,
  Network,
  Globe,
  Cable,
  ScrollText,
  Store,
  Boxes,
} from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';


// ---------------------------------------------------------------------------
// Visual replica (avoids router-context dependency in Storybook)
// ---------------------------------------------------------------------------

interface TabDef {
  value: string;
  label: string;
  mobileLabel?: string;
  icon: React.ElementType;
  ariaLabel: string;
}

const TAB_DEFS: TabDef[] = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard, ariaLabel: 'Router overview and status' },
  { value: 'wifi', label: 'WiFi', icon: Wifi, ariaLabel: 'WiFi configuration' },
  { value: 'vpn', label: 'VPN', icon: Shield, ariaLabel: 'VPN configuration' },
  { value: 'firewall', label: 'Firewall', mobileLabel: 'FW', icon: ShieldAlert, ariaLabel: 'Firewall settings' },
  { value: 'dhcp', label: 'DHCP', icon: Network, ariaLabel: 'DHCP server configuration' },
  { value: 'dns', label: 'DNS', icon: Globe, ariaLabel: 'DNS configuration and servers' },
  { value: 'network', label: 'Network', mobileLabel: 'Net', icon: Cable, ariaLabel: 'Network settings' },
  { value: 'logs', label: 'Logs', icon: ScrollText, ariaLabel: 'System logs' },
  { value: 'plugins', label: 'Store', icon: Store, ariaLabel: 'Plugin store' },
  { value: 'services', label: 'Services', mobileLabel: 'Svc', icon: Boxes, ariaLabel: 'Service management' },
];

interface TabNavigationPreviewProps {
  activeTab: string;
  variant: 'desktop' | 'mobile';
}

/**
 * Pure visual replica of TabNavigation for Storybook.
 * Matches the exact className strings from the real component.
 */
function TabNavigationPreview({ activeTab, variant }: TabNavigationPreviewProps) {
  if (variant === 'desktop') {
    return (
      <nav
        className="border-b border-default bg-transparent"
        role="navigation"
        aria-label="Router panel sections"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-1">
          {TAB_DEFS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.ariaLabel}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200',
                  'border-b-2 border-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'hover:text-primary',
                  isActive ? 'border-primary text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // Mobile bottom bar
  return (
    <nav
      className="surface-secondary border-t border-default shadow-lg"
      role="navigation"
      aria-label="Router panel sections"
      style={{ width: 375 }}
    >
      <div className="grid grid-cols-10 h-16">
        {TAB_DEFS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          const displayLabel = tab.mobileLabel ?? tab.label;
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.ariaLabel}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon
                className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')}
                aria-hidden="true"
              />
              <span className="text-[10px] font-medium leading-none">{displayLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof TabNavigationPreview> = {
  title: 'App/RouterPanel/TabNavigation',
  component: TabNavigationPreview,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Adaptive tab navigation for the router panel.  On desktop ' +
          '(≥768px) it renders as a horizontal top bar with border-bottom ' +
          'indicators; on mobile it becomes a fixed bottom navigation bar ' +
          'with icon + label vertical stacks and 44px touch targets.  ' +
          'Stories use a visual replica component that mirrors the exact ' +
          'class names of the real implementation so designs can be reviewed ' +
          'without requiring a full TanStack Router tree.',
      },
    },
  },
  argTypes: {
    activeTab: {
      control: 'select',
      options: TAB_DEFS.map((t) => t.value),
      description: 'The currently active tab (normally derived from the URL path).',
    },
    variant: {
      control: 'radio',
      options: ['desktop', 'mobile'],
      description: 'Which responsive layout to display.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TabNavigationPreview>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Desktop top-bar with Overview selected (default entry point). */
export const DesktopOverview: Story = {
  args: { activeTab: 'overview', variant: 'desktop' },
};

/** Desktop top-bar with the WiFi tab active. */
export const DesktopWifi: Story = {
  args: { activeTab: 'wifi', variant: 'desktop' },
};

/** Desktop top-bar with the Firewall tab active — uses mobileLabel in real component. */
export const DesktopFirewall: Story = {
  args: { activeTab: 'firewall', variant: 'desktop' },
};

/** Mobile bottom bar — all 10 tabs visible, Overview selected. */
export const MobileOverview: Story = {
  args: { activeTab: 'overview', variant: 'mobile' },
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
};

/** Mobile bottom bar with VPN selected. */
export const MobileVPN: Story = {
  args: { activeTab: 'vpn', variant: 'mobile' },
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
};

/** Mobile bottom bar with Logs selected — uses full label (no mobileLabel defined). */
export const MobileLogs: Story = {
  args: { activeTab: 'logs', variant: 'mobile' },
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
};
