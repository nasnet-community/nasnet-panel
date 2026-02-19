/**
 * Storybook stories for IPAddressDeleteDialog
 * NAS-6.2: IP Address Management
 *
 * Covers all dialog states: dependency check loading, safe to delete,
 * has dependencies (DHCP servers, routes, NAT rules, firewall rules),
 * cannot delete, and the deletion-in-progress loading state.
 *
 * IPAddressDeleteDialog calls useIPAddressDependencies internally (Apollo).
 * Each story wraps the component in a MockedProvider so dependency states
 * can be rendered deterministically without a live backend.
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { MockedProvider } from '@apollo/client/testing';
import { Button } from '@nasnet/ui/primitives';
import { IPAddressDeleteDialog } from './IPAddressDeleteDialog';
import { GET_IP_ADDRESS_DEPENDENCIES } from '@nasnet/api-client/queries';

// ---------------------------------------------------------------------------
// Shared IP address fixtures
// ---------------------------------------------------------------------------

const ipWan = { id: 'ip-001', address: '192.168.1.1/24', interfaceName: 'ether1' };
const ipLan = { id: 'ip-002', address: '10.0.0.1/8', interfaceName: 'bridge-lan' };
const ipPublic = { id: 'ip-003', address: '203.0.113.42/28', interfaceName: 'ether1-wan-uplink' };
const ipv6 = { id: 'ip-004', address: '2001:db8::1/64', interfaceName: 'ether2' };

// ---------------------------------------------------------------------------
// MockedProvider factory helpers
// ---------------------------------------------------------------------------

function noDependenciesMock(ipId: string) {
  return {
    request: {
      query: GET_IP_ADDRESS_DEPENDENCIES,
      variables: { routerId: 'router-001', id: ipId },
    },
    result: {
      data: {
        ipAddressDependencies: {
          canDelete: true,
          dhcpServers: [],
          routes: [],
          natRules: [],
          firewallRules: [],
          warningMessage: null,
          __typename: 'IPAddressDependencies',
        },
      },
    },
  };
}

function withDependenciesMock(ipId: string) {
  return {
    request: {
      query: GET_IP_ADDRESS_DEPENDENCIES,
      variables: { routerId: 'router-001', id: ipId },
    },
    result: {
      data: {
        ipAddressDependencies: {
          canDelete: true,
          dhcpServers: [
            { id: 'dhcp-1', name: 'dhcp-lan', network: '192.168.1.0/24', __typename: 'DHCPServerDep' },
          ],
          routes: [
            { id: 'route-1', destination: '0.0.0.0/0', gateway: '192.168.1.254', __typename: 'RouteDep' },
          ],
          natRules: [
            { id: 'nat-1', chain: 'srcnat', action: 'masquerade', __typename: 'NATRuleDep' },
          ],
          firewallRules: [],
          warningMessage:
            'This IP address is used by 1 DHCP server, 1 route, and 1 NAT rule. Deleting it will disrupt those services.',
          __typename: 'IPAddressDependencies',
        },
      },
    },
  };
}

function cannotDeleteMock(ipId: string) {
  return {
    request: {
      query: GET_IP_ADDRESS_DEPENDENCIES,
      variables: { routerId: 'router-001', id: ipId },
    },
    result: {
      data: {
        ipAddressDependencies: {
          canDelete: false,
          dhcpServers: [
            { id: 'dhcp-1', name: 'dhcp-lan', network: '10.0.0.0/8', __typename: 'DHCPServerDep' },
            { id: 'dhcp-2', name: 'dhcp-guest', network: '10.10.0.0/24', __typename: 'DHCPServerDep' },
          ],
          routes: [
            { id: 'route-1', destination: '0.0.0.0/0', gateway: '10.0.0.254', __typename: 'RouteDep' },
          ],
          natRules: [
            { id: 'nat-1', chain: 'srcnat', action: 'masquerade', __typename: 'NATRuleDep' },
            { id: 'nat-2', chain: 'dstnat', action: 'dst-nat', __typename: 'NATRuleDep' },
          ],
          firewallRules: [
            { id: 'fw-1', chain: 'input', action: 'accept', __typename: 'FirewallRuleDep' },
          ],
          warningMessage:
            'This IP address cannot be deleted because it is actively in use by 2 DHCP servers, 1 route, 2 NAT rules, and 1 firewall rule.',
          __typename: 'IPAddressDependencies',
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Interactive wrapper (trigger button + dialog + simulated delete)
// ---------------------------------------------------------------------------

interface WrapperProps {
  ipAddress: typeof ipWan;
  loading?: boolean;
  mocks: object[];
  autoOpen?: boolean;
}

function DialogWrapper({ ipAddress, loading: externalLoading, mocks, autoOpen = true }: WrapperProps) {
  const [open, setOpen] = useState(autoOpen);
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setDeleting(false);
    setOpen(false);
    console.log('Deleted IP address:', ipAddress.address);
  };

  return (
    <MockedProvider mocks={mocks} addTypename={true}>
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Click to open the delete dialog for{' '}
            <code className="font-mono text-xs bg-muted rounded px-1">{ipAddress.address}</code>
          </p>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Delete IP Address
          </Button>
        </div>

        <IPAddressDeleteDialog
          open={open}
          routerId="router-001"
          ipAddress={ipAddress}
          loading={externalLoading ?? deleting}
          onConfirm={handleConfirm}
          onCancel={() => setOpen(false)}
        />
      </div>
    </MockedProvider>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof IPAddressDeleteDialog> = {
  title: 'Features/Network/IPAddress/IPAddressDeleteDialog',
  component: IPAddressDeleteDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Confirmation dialog for deleting an IP address from a router interface.

Internally calls \`useIPAddressDependencies\` to check whether the address is
referenced by DHCP servers, routes, NAT rules, or firewall rules before
allowing deletion.

## States
| State | Trigger | UI |
|-------|---------|-----|
| Loading | Dependency query in flight | Spinner + "Checking for dependencies…" |
| Safe to delete | No dependencies found | Green info alert, Delete button enabled |
| Has dependencies | Dependencies found, canDelete=true | Amber warning with list, Delete button enabled |
| Cannot delete | canDelete=false | Red error, Delete button disabled |
| Deleting | loading=true prop | Spinner in Delete button, all controls disabled |
        `,
      },
    },
  },
  args: {
    open: true,
    routerId: 'router-001',
    ipAddress: ipWan,
    loading: false,
    onConfirm: fn(),
    onCancel: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof IPAddressDeleteDialog>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Safe to delete — dependency check completes with no dependent resources.
 * The Delete button is enabled and a green "No Dependencies" info alert is shown.
 */
export const NoDependencies: Story = {
  name: 'Safe to delete (no dependencies)',
  render: () => (
    <DialogWrapper ipAddress={ipWan} mocks={[noDependenciesMock(ipWan.id)]} />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The IP address has no dependent services. The dialog shows the green "No Dependencies" ' +
          'alert and enables the Delete IP Address button immediately.',
      },
    },
  },
};

/**
 * Has dependencies but still deletable — shows the amber warning list with
 * DHCP server, route, and NAT rule entries.  Delete button remains enabled.
 */
export const WithDependencies: Story = {
  name: 'Has dependencies (delete allowed)',
  render: () => (
    <DialogWrapper ipAddress={ipLan} mocks={[withDependenciesMock(ipLan.id)]} />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows the amber warning list of dependent resources (1 DHCP server, 1 route, 1 NAT rule). ' +
          'The Delete button is still enabled — the operator can proceed after reviewing the impact.',
      },
    },
  },
};

/**
 * Cannot delete — too many critical dependencies, canDelete=false.
 * The Delete button is permanently disabled.
 */
export const CannotDelete: Story = {
  name: 'Cannot delete (blocked)',
  render: () => (
    <DialogWrapper ipAddress={ipLan} mocks={[cannotDeleteMock(ipLan.id)]} />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The API returns canDelete=false. A red alert explains that the address cannot be removed ' +
          'until dependent resources are reconfigured. The Delete button is disabled.',
      },
    },
  },
};

/**
 * Deletion in progress — loading=true shows spinner in the Delete button
 * and disables all controls while the mutation executes.
 */
export const DeletingInProgress: Story = {
  name: 'Deleting – in progress',
  render: () => (
    <DialogWrapper ipAddress={ipWan} mocks={[noDependenciesMock(ipWan.id)]} loading={true} />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'loading=true: the Delete button shows an animated spinner and all inputs are disabled. ' +
          'This state persists until the mutation resolves.',
      },
    },
  },
};

/**
 * Public WAN address with a long interface name — exercises layout with
 * longer address and interface strings.
 */
export const PublicWanAddress: Story = {
  name: 'Public WAN address',
  render: () => (
    <DialogWrapper ipAddress={ipPublic} mocks={[noDependenciesMock(ipPublic.id)]} />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Tests layout with a longer interface name (ether1-wan-uplink) and a /28 public IPv4 address.',
      },
    },
  },
};

/**
 * IPv6 address variant — verifies the dialog handles non-IPv4 address strings.
 */
export const IPv6Address: Story = {
  name: 'IPv6 address',
  render: () => (
    <DialogWrapper ipAddress={ipv6} mocks={[noDependenciesMock(ipv6.id)]} />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Verifies the dialog displays an IPv6 address (2001:db8::1/64) correctly. ' +
          'Address formatting and truncation should remain intact.',
      },
    },
  },
};
