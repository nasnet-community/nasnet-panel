/**
 * PPPoE Wizard Storybook Stories
 *
 * Interactive documentation and visual testing for the 5-step PPPoE WAN
 * configuration wizard. Each story shows the wizard in a different context.
 */

import { PppoeWizard } from './PppoeWizard';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof PppoeWizard> = {
  title: 'Features/Network/WAN/PppoeWizard',
  component: PppoeWizard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Five-step guided wizard for configuring a PPPoE WAN connection on MikroTik routers.

## Wizard Steps
1. **Interface** - Select the physical Ethernet interface for the PPPoE dial-up
2. **Credentials** - ISP username, password, and optional service name
3. **Options** - MTU/MRU, default route, peer DNS, and comment
4. **Preview** - Review the RouterOS commands that will be executed
5. **Apply** - Safety confirmation and live configuration feedback

## Features
- **Password security** - Password field is never stored in browser history or logs
- **MTU/MRU presets** - Quick buttons for 1480 (PPPoE standard), 1492 (PPPoE+), 1500
- **RouterOS preview** - Exact commands shown before any change is applied
- **Error handling** - Mutation errors are surfaced with an option to retry
- **Rollback support** - Parent orchestrates rollback on failure (handled outside wizard)

## Guidance
The wizard is designed for router admins who may be unfamiliar with PPPoE internals.
Each step includes inline contextual help tooltips.
      `,
      },
    },
  },
  argTypes: {
    routerId: {
      control: 'text',
      description: 'Router ID used to scope the configuration and interface queries',
    },
    onComplete: { action: 'completed' },
    onCancel: { action: 'cancelled' },
  },
};

export default meta;
type Story = StoryObj<typeof PppoeWizard>;

/**
 * Default - wizard opened at step 1 (Interface selection).
 */
export const Default: Story = {
  args: {
    routerId: 'router-demo-123',
    onComplete: (result) => {
      console.log('PPPoE configured:', result);
    },
    onCancel: () => {},
  },
};

/**
 * HomeISP - typical residential broadband PPPoE setup.
 */
export const HomeISP: Story = {
  args: {
    routerId: 'router-home-001',
    onComplete: (result) => {
      console.log('PPPoE configured:', result);
    },
    onCancel: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Typical residential ISP scenario. The admin would select ether1, enter ISP username/password, accept defaults (1480 MTU, peer DNS on, default route on) and apply.',
      },
    },
  },
};

/**
 * BusinessLine - enterprise ISP with custom service name and higher MTU.
 */
export const BusinessLine: Story = {
  args: {
    routerId: 'router-enterprise-42',
    onComplete: (result) => {
      console.log('PPPoE configured:', result);
    },
    onCancel: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Enterprise ISP scenario requiring a specific PPPoE service name (e.g. "ISP_BRAS") and 1492 MTU for double-tagging networks. Admin navigates to Step 3 (Options) to adjust MTU and enter the service name.',
      },
    },
  },
};

/**
 * CancelFlow - demonstrates the Cancel button at every step.
 */
export const CancelFlow: Story = {
  args: {
    routerId: 'router-demo-123',
    onComplete: (result) => {
      console.log('PPPoE configured:', result);
    },
    onCancel: () => {
      console.log('Wizard cancelled');
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Cancel is always available. Clicking it invokes onCancel without modifying router state. Use this story to verify the cancel UX at each wizard step.',
      },
    },
  },
};

/**
 * NoCallbacks - wizard without completion or cancel handlers (read-only demo).
 */
export const NoCallbacks: Story = {
  args: {
    routerId: 'router-demo-readonly',
    // onComplete and onCancel intentionally omitted
  },
  parameters: {
    docs: {
      description: {
        story:
          'Wizard rendered without callback props for embedding in a read-only documentation context. The Cancel and Apply actions will silently no-op.',
      },
    },
  },
};
