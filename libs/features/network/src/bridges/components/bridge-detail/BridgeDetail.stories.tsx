/**
 * Storybook stories for the Bridge Detail presenter components.
 *
 * `BridgeDetail` is the main container that wires Apollo hooks (useBridgeDetail,
 * useCreateBridge, useUpdateBridge). Because those hooks require a live Apollo
 * client, the stories use the lower-level presenter components directly:
 *   - BridgeDetailDesktop (Sheet slide-over, used on tablet/desktop)
 *   - BridgeDetailMobile  (full-screen Dialog, used on mobile)
 *
 * All presenter props are plain TypeScript – no provider setup needed.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { BridgeDetailDesktop } from './BridgeDetailDesktop';
import { BridgeDetailMobile } from './BridgeDetailMobile';
import type { Bridge } from '@nasnet/api-client/generated';
import type { BridgeFormData } from './bridge-form';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const existingBridge: Bridge = {
  id: 'bridge-uuid-001',
  name: 'bridge1',
  comment: 'Main LAN bridge',
  protocol: 'RSTP',
  priority: 32768,
  vlanFiltering: false,
  pvid: 1,
  mtu: 1500,
  ports: [
    {
      id: 'port-uuid-001',
      interface: { id: 'iface-001', name: 'ether2', type: 'ETHER' },
      pvid: 1,
      frameTypes: 'ADMIT_ALL',
      ingressFiltering: false,
      taggedVlans: [],
      untaggedVlans: [1],
      edge: true,
      pathCost: null,
    },
    {
      id: 'port-uuid-002',
      interface: { id: 'iface-002', name: 'ether3', type: 'ETHER' },
      pvid: 1,
      frameTypes: 'ADMIT_ALL',
      ingressFiltering: false,
      taggedVlans: [],
      untaggedVlans: [1],
      edge: false,
      pathCost: 100,
    },
  ],
} as unknown as Bridge;

const vlanBridge: Bridge = {
  id: 'bridge-uuid-002',
  name: 'bridge-vlan',
  comment: 'VLAN-aware bridge for trunk uplink',
  protocol: 'MSTP',
  priority: 4096,
  vlanFiltering: true,
  pvid: 10,
  mtu: 9000,
  ports: [],
} as unknown as Bridge;

const handleSubmit = async (data: BridgeFormData) => {
  console.log('Bridge form submitted:', data);
  await new Promise((r) => setTimeout(r, 800));
};

// ---------------------------------------------------------------------------
// Meta – BridgeDetailDesktop
// ---------------------------------------------------------------------------

const meta: Meta<typeof BridgeDetailDesktop> = {
  title: 'Features/Network/Bridges/BridgeDetail',
  component: BridgeDetailDesktop,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`BridgeDetail` is the smart container that fetches bridge data via Apollo and ' +
          'dispatches create/update mutations. The stories here exercise the dumb presenter ' +
          'components (`BridgeDetailDesktop` and `BridgeDetailMobile`) which accept all ' +
          'data as props and contain no network calls. ' +
          '\n\n' +
          '**Desktop** – renders as a Radix Sheet slide-over from the right. ' +
          '**Mobile** – renders as a full-screen Dialog.',
      },
    },
  },
  argTypes: {
    open: { control: 'boolean' },
    loading: { control: 'boolean' },
    isSubmitting: { control: 'boolean' },
    onClose: { action: 'onClose' },
    onSubmit: { action: 'onSubmit' },
  },
};

export default meta;
type Story = StoryObj<typeof BridgeDetailDesktop>;

// ---------------------------------------------------------------------------
// Desktop stories
// ---------------------------------------------------------------------------

export const DesktopEditExisting: Story = {
  name: 'Desktop – Edit Existing Bridge',
  args: {
    bridge: existingBridge,
    loading: false,
    error: null,
    open: true,
    onClose: () => {},
    onSubmit: handleSubmit,
    isSubmitting: false,
  },
};

export const DesktopEditVlanBridge: Story = {
  name: 'Desktop – Edit VLAN-Filtered Bridge',
  args: {
    bridge: vlanBridge,
    loading: false,
    error: null,
    open: true,
    onClose: () => {},
    onSubmit: handleSubmit,
    isSubmitting: false,
  },
};

export const DesktopCreateNew: Story = {
  name: 'Desktop – Create New Bridge',
  args: {
    bridge: null,
    loading: false,
    error: null,
    open: true,
    onClose: () => {},
    onSubmit: handleSubmit,
    isSubmitting: false,
  },
};

export const DesktopLoading: Story = {
  name: 'Desktop – Loading State',
  args: {
    bridge: undefined,
    loading: true,
    error: null,
    open: true,
    onClose: () => {},
    onSubmit: handleSubmit,
    isSubmitting: false,
  },
};

export const DesktopError: Story = {
  name: 'Desktop – Error State',
  args: {
    bridge: undefined,
    loading: false,
    error: new Error('Failed to load bridge: router returned 503'),
    open: true,
    onClose: () => {},
    onSubmit: handleSubmit,
    isSubmitting: false,
  },
};

export const DesktopSubmitting: Story = {
  name: 'Desktop – Submitting (save in progress)',
  args: {
    bridge: existingBridge,
    loading: false,
    error: null,
    open: true,
    onClose: () => {},
    onSubmit: handleSubmit,
    isSubmitting: true,
  },
};

// ---------------------------------------------------------------------------
// Mobile stories (separate presenter component)
// ---------------------------------------------------------------------------

export const MobileCreateNew: Story = {
  name: 'Mobile – Create New Bridge',
  render: (args) => <BridgeDetailMobile {...args} />,
  args: {
    bridge: null,
    loading: false,
    error: null,
    open: true,
    onClose: () => {},
    onSubmit: handleSubmit,
    isSubmitting: false,
  },
};

export const MobileEditExisting: Story = {
  name: 'Mobile – Edit Existing Bridge',
  render: (args) => <BridgeDetailMobile {...args} />,
  args: {
    bridge: existingBridge,
    loading: false,
    error: null,
    open: true,
    onClose: () => {},
    onSubmit: handleSubmit,
    isSubmitting: false,
  },
};

export const MobileLoading: Story = {
  name: 'Mobile – Loading State',
  render: (args) => <BridgeDetailMobile {...args} />,
  args: {
    bridge: undefined,
    loading: true,
    error: null,
    open: true,
    onClose: () => {},
    onSubmit: handleSubmit,
    isSubmitting: false,
  },
};
