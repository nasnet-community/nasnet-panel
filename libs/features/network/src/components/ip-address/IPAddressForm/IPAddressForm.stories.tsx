/**
 * IPAddressForm Stories
 *
 * IPAddressForm is a headless + platform-presenter wrapper that renders
 * IPAddressFormDesktop (Card + Dialog) or IPAddressFormMobile (Sheet) based on
 * the active viewport.
 *
 * The form supports create and edit modes, validates CIDR notation via Zod,
 * displays live subnet calculations, and runs conflict detection against
 * existing addresses on the same router.
 */

import { IPAddressForm } from './IPAddressForm';

import type { IPAddressFormProps } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const mockInterfaces = [
  { id: 'ether1', name: 'ether1', type: 'ethernet' },
  { id: 'ether2', name: 'ether2', type: 'ethernet' },
  { id: 'bridge1', name: 'bridge1', type: 'bridge' },
  { id: 'wlan1', name: 'wlan1', type: 'wireless' },
  { id: 'vlan10', name: 'vlan10', type: 'vlan', disabled: true },
];

const baseProps: Omit<IPAddressFormProps, 'mode'> = {
  routerId: 'router-1',
  interfaces: mockInterfaces,
  loading: false,
  onSubmit: async (data) => {
    console.log('submit', data);
    await new Promise((r) => setTimeout(r, 1000));
  },
  onCancel: () => console.log('cancel'),
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof IPAddressForm> = {
  title: 'Features/Network/IPAddressForm',
  component: IPAddressForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Create or edit an IP address in CIDR notation on a chosen interface. Includes live Zod validation, real-time subnet calculations (network/broadcast/usable range), and conflict detection against addresses already configured on the router. A disabled toggle lets you pre-configure an address without activating it immediately.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof IPAddressForm>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Blank create form — all fields empty, ready for new input. */
export const CreateMode: Story = {
  args: {
    ...baseProps,
    mode: 'create',
  },
};

/** Edit mode pre-populated with an existing static address. */
export const EditMode: Story = {
  args: {
    ...baseProps,
    mode: 'edit',
    excludeId: '1',
    initialValues: {
      address: '192.168.1.1/24',
      interfaceId: 'ether1',
      comment: 'Management IP',
      disabled: false,
    },
  },
};

/** Editing a disabled address — the "Disabled" toggle is pre-checked. */
export const EditDisabledAddress: Story = {
  args: {
    ...baseProps,
    mode: 'edit',
    excludeId: '3',
    initialValues: {
      address: '172.16.0.1/16',
      interfaceId: 'bridge1',
      comment: '',
      disabled: true,
    },
  },
};

/** Submission in progress — all controls disabled and the button shows a spinner. */
export const Submitting: Story = {
  args: {
    ...baseProps,
    mode: 'create',
    loading: true,
    initialValues: {
      address: '10.10.0.1/24',
      interfaceId: 'ether2',
      comment: 'New subnet',
      disabled: false,
    },
  },
};

/** No interfaces available — the interface selector renders empty. */
export const NoInterfaces: Story = {
  args: {
    ...baseProps,
    mode: 'create',
    interfaces: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'When the router has no configurable interfaces the selector is empty. The form can still be submitted but will fail validation on the backend.',
      },
    },
  },
};

/** Mobile sheet layout — form renders inside a bottom sheet with 44 px touch targets. */
export const MobileView: Story = {
  args: {
    ...baseProps,
    mode: 'create',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'On mobile the form is presented as a bottom Sheet instead of an inline Card, optimised for touch interaction.',
      },
    },
  },
};
