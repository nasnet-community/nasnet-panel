/**
 * DHCP Wizard Storybook Stories
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 *
 * NOTE: DHCPWizard is a full-page orchestrator that relies on router
 * connection state, routing, and API mutations. These stories demonstrate
 * the individual sub-components (WizardStepReview) that can be rendered
 * in isolation, along with the overall wizard's Live Preview panel.
 *
 * The WizardStepReview component is separately showcased for design review.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

// ─── Inline Live-Preview Panel ─────────────────────────────────────────────
// This component mirrors the `renderPreview()` output inside DHCPWizard,
// extracted into a standalone component for Storybook consumption.

interface LivePreviewPanelProps {
  interfaceData?: { interface?: string; interfaceIP?: string };
  poolData?: { poolStart?: string; poolEnd?: string };
  networkData?: {
    gateway?: string;
    dnsServers?: string[];
    leaseTime?: string;
    domain?: string;
    ntpServer?: string;
  };
}

function LivePreviewPanel({ interfaceData, poolData, networkData }: LivePreviewPanelProps) {
  const hasAnyData = interfaceData?.interface || poolData?.poolStart || networkData?.gateway;

  return (
    <Card className="h-full w-[360px]">
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
        <CardDescription>DHCP server configuration summary</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {interfaceData?.interface && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Interface</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-mono">{interfaceData.interface}</span>
              </div>
              {interfaceData.interfaceIP && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP:</span>
                  <span className="font-mono">{interfaceData.interfaceIP}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {poolData?.poolStart && poolData?.poolEnd && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Address Pool</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start:</span>
                <span className="font-mono">{poolData.poolStart}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End:</span>
                <span className="font-mono">{poolData.poolEnd}</span>
              </div>
            </div>
          </div>
        )}

        {networkData?.gateway && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Network Settings</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gateway:</span>
                <span className="font-mono">{networkData.gateway}</span>
              </div>
              {networkData.dnsServers && networkData.dnsServers.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DNS:</span>
                  <span className="font-mono">{networkData.dnsServers.join(', ')}</span>
                </div>
              )}
              {networkData.leaseTime && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lease Time:</span>
                  <span className="font-mono">{networkData.leaseTime}</span>
                </div>
              )}
              {networkData.domain && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Domain:</span>
                  <span className="font-mono">{networkData.domain}</span>
                </div>
              )}
              {networkData.ntpServer && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NTP:</span>
                  <span className="font-mono">{networkData.ntpServer}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {!hasAnyData && (
          <div className="text-muted-foreground py-component-xl text-center text-sm">
            Complete the wizard steps to see a live preview of your DHCP server configuration.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const meta = {
  title: 'Features/Network/DHCP/DHCPWizard/LivePreviewPanel',
  component: LivePreviewPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The Live Preview panel that appears alongside the DHCP Wizard. It updates in real-time as the user completes each wizard step. This story renders the preview panel in isolation to demonstrate its various states across the four wizard steps.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    interfaceData: {
      description: 'Data from Step 1 – Interface selection',
      control: 'object',
    },
    poolData: {
      description: 'Data from Step 2 – Address Pool configuration',
      control: 'object',
    },
    networkData: {
      description: 'Data from Step 3 – Network Settings',
      control: 'object',
    },
  },
} satisfies Meta<typeof LivePreviewPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────

/**
 * Initial empty state — shown before the user fills in any wizard step.
 */
export const Empty: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Before any wizard step is completed the preview panel shows a placeholder message.',
      },
    },
  },
};

/**
 * After completing Step 1 – Interface selected.
 */
export const AfterInterfaceStep: Story = {
  args: {
    interfaceData: {
      interface: 'ether2-lan',
      interfaceIP: '192.168.88.1/24',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'The preview panel after the user selects a network interface. Shows the interface name and IP.',
      },
    },
  },
};

/**
 * After completing Step 2 – Address Pool configured.
 */
export const AfterPoolStep: Story = {
  args: {
    interfaceData: {
      interface: 'ether2-lan',
      interfaceIP: '192.168.88.1/24',
    },
    poolData: {
      poolStart: '192.168.88.100',
      poolEnd: '192.168.88.200',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'The preview panel after the user configures the IP address pool range.',
      },
    },
  },
};

/**
 * After completing Step 3 – Network Settings filled in (full preview).
 */
export const FullPreview: Story = {
  args: {
    interfaceData: {
      interface: 'ether2-lan',
      interfaceIP: '192.168.88.1/24',
    },
    poolData: {
      poolStart: '192.168.88.100',
      poolEnd: '192.168.88.200',
    },
    networkData: {
      gateway: '192.168.88.1',
      dnsServers: ['1.1.1.1', '8.8.8.8'],
      leaseTime: '1d',
      domain: 'lan.local',
      ntpServer: '192.168.88.1',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Full preview shown on the Review step after all three configuration steps are complete.',
      },
    },
  },
};

/**
 * Network settings without optional domain and NTP fields.
 */
export const MinimalNetworkSettings: Story = {
  args: {
    interfaceData: {
      interface: 'bridge-home',
      interfaceIP: '10.0.0.1/24',
    },
    poolData: {
      poolStart: '10.0.0.50',
      poolEnd: '10.0.0.254',
    },
    networkData: {
      gateway: '10.0.0.1',
      dnsServers: ['9.9.9.9'],
      leaseTime: '12h',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A realistic configuration without the optional domain or NTP server fields.',
      },
    },
  },
};

/**
 * Large enterprise pool spanning a /22 block.
 */
export const LargeEnterprisePool: Story = {
  args: {
    interfaceData: {
      interface: 'bond1-vlan10',
      interfaceIP: '172.16.0.1/22',
    },
    poolData: {
      poolStart: '172.16.0.10',
      poolEnd: '172.16.3.254',
    },
    networkData: {
      gateway: '172.16.0.1',
      dnsServers: ['172.16.0.53', '8.8.8.8', '1.1.1.1'],
      leaseTime: '3d',
      domain: 'corp.example.com',
      ntpServer: '172.16.0.1',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Enterprise-scale DHCP pool spanning a /22 network with three DNS servers and custom domain.',
      },
    },
  },
};
