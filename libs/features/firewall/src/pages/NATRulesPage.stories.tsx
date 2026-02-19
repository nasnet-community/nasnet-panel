/**
 * NATRulesPage Storybook Stories
 *
 * Interactive stories for the NAT Rules page domain component.
 * Demonstrates chain tabs, quick action buttons, and empty/loading/populated states.
 *
 * @module @nasnet/features/firewall/pages
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { NATRulesPage } from './NATRulesPage';

import type { Meta, StoryObj } from '@storybook/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity },
  },
});

/**
 * NATRulesPage - NAT firewall rules management page
 *
 * The NATRulesPage provides the main interface for managing MikroTik Network Address
 * Translation (NAT) rules with chain-based tab filtering and quick action wizards.
 *
 * ## Features
 *
 * - **Chain Tabs**: Switch between All / Source NAT (srcnat) / Destination NAT (dstnat)
 * - **Quick Masquerade**: One-click masquerade rule creation via dialog wizard
 * - **Port Forward Wizard**: Step-by-step port forwarding configuration wizard
 * - **Add NAT Rule**: Full rule builder with all NAT parameters (NATRuleBuilder)
 * - **Edit Rules**: Inline edit with pre-filled rule data
 * - **Toggle Disable**: Enable/disable rules without opening editor
 * - **Delete Rules**: Safety Pipeline confirmation before deletion
 * - **Responsive Layout**: Desktop DataTable vs Mobile Card list
 * - **Empty States**: Chain-specific empty states with contextual CTAs
 * - **Loading Skeletons**: Smooth loading during fetch
 * - **Accessibility**: WCAG AAA compliant keyboard navigation
 *
 * ## NAT Chains
 *
 * - **srcnat** (Source NAT): Masquerade, SNAT — hide internal IPs behind WAN IP
 * - **dstnat** (Destination NAT): Port forwarding, DNAT — expose internal services
 *
 * ## Usage
 *
 * ```tsx
 * import { NATRulesPage } from '@nasnet/features/firewall/pages';
 *
 * function FirewallApp() {
 *   return <NATRulesPage />;
 * }
 * ```
 */
const meta = {
  title: 'Features/Firewall/Pages/NATRulesPage',
  component: NATRulesPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Main page for managing NAT rules with chain tabs (srcnat/dstnat), Quick Masquerade and Port Forward Wizard actions, and responsive table/card display.',
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof NATRulesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Empty State - All Chains
 *
 * No NAT rules configured. Shows the "All" tab empty state with three CTAs:
 * Quick Masquerade, Port Forward Wizard, and Add NAT Rule.
 */
export const EmptyAllChains: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Empty state on the "All" tab. Three action buttons guide users to the most common NAT setups: masquerade for outbound internet access and port forwarding for exposing services.',
      },
    },
    mockData: {
      rules: [],
      isLoading: false,
      selectedChain: 'all',
    },
  },
};

/**
 * Empty State - Source NAT Chain
 *
 * No srcnat rules configured. Shows contextual empty state with masquerade CTA.
 */
export const EmptySourceNAT: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Empty state on the "Source NAT" tab. Contextual message about masquerade rules for hiding internal IPs. Quick Masquerade button prominently offered.',
      },
    },
    mockData: {
      rules: [],
      isLoading: false,
      selectedChain: 'srcnat',
    },
  },
};

/**
 * With NAT Rules - All Chains
 *
 * Populated view showing both srcnat and dstnat rules in the "All" tab.
 * Demonstrates rule cards with action badges, interface matchers, and address translation.
 */
export const WithRulesAllChains: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Populated "All" tab showing mix of srcnat (masquerade, SNAT) and dstnat (port forward) rules. Demonstrates action badges, interface selectors, and address/port translation display.',
      },
    },
    mockData: {
      rules: [
        {
          id: '*1',
          chain: 'srcnat',
          action: 'masquerade',
          outInterface: 'ether1',
          comment: 'Default masquerade for internet access',
          disabled: false,
          packets: 1234567,
          bytes: 9876543210,
          position: 0,
        },
        {
          id: '*2',
          chain: 'srcnat',
          action: 'snat',
          outInterface: 'ether1',
          toAddresses: '203.0.113.100',
          srcAddress: '192.168.10.0/24',
          comment: 'SNAT for servers subnet',
          disabled: false,
          packets: 45678,
          bytes: 12345678,
          position: 1,
        },
        {
          id: '*3',
          chain: 'dstnat',
          action: 'dst-nat',
          protocol: 'tcp',
          dstPort: '80',
          toAddresses: '192.168.1.10',
          toPorts: '80',
          comment: 'HTTP to internal web server',
          disabled: false,
          packets: 98765,
          bytes: 56789012,
          position: 2,
        },
        {
          id: '*4',
          chain: 'dstnat',
          action: 'dst-nat',
          protocol: 'tcp',
          dstPort: '443',
          toAddresses: '192.168.1.10',
          toPorts: '443',
          comment: 'HTTPS to internal web server',
          disabled: false,
          packets: 234567,
          bytes: 145678901,
          position: 3,
        },
        {
          id: '*5',
          chain: 'dstnat',
          action: 'dst-nat',
          protocol: 'tcp',
          dstPort: '22',
          toAddresses: '192.168.1.20',
          toPorts: '22',
          comment: 'SSH to management server (DISABLED)',
          disabled: true,
          packets: 0,
          bytes: 0,
          position: 4,
        },
      ],
      isLoading: false,
      selectedChain: 'all',
    },
  },
};

/**
 * Loading State
 *
 * Shows animated skeleton rows while NAT rules are being fetched from the router.
 */
export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Loading state with animated skeleton rows. Shown while fetching NAT rules from MikroTik RouterOS via the API.',
      },
    },
    mockData: {
      rules: [],
      isLoading: true,
      selectedChain: 'all',
    },
  },
};

/**
 * Mobile View
 *
 * Mobile layout (<640px) with card-based rule display instead of DataTable.
 * Header action buttons collapse; Masquerade and Port Forward shown as small buttons below header.
 */
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile-optimized view (<640px). Desktop action buttons (Quick Masquerade, Port Forward Wizard) collapse into compact buttons below the header. Rules display as cards.',
      },
    },
    mockData: {
      rules: [
        {
          id: '*1',
          chain: 'srcnat',
          action: 'masquerade',
          outInterface: 'ether1',
          comment: 'Default masquerade',
          disabled: false,
          packets: 1234567,
          bytes: 9876543210,
          position: 0,
        },
        {
          id: '*2',
          chain: 'dstnat',
          action: 'dst-nat',
          protocol: 'tcp',
          dstPort: '80',
          toAddresses: '192.168.1.10',
          toPorts: '80',
          comment: 'HTTP port forward',
          disabled: false,
          packets: 98765,
          bytes: 56789012,
          position: 1,
        },
      ],
      isLoading: false,
      selectedChain: 'all',
    },
  },
};
