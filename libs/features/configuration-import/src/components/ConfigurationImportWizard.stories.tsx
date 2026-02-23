import { fn } from 'storybook/test';

import { ConfigurationImportWizard } from './ConfigurationImportWizard';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * NOTE: ConfigurationImportWizard relies on several API hooks at runtime:
 *   - useEnabledProtocols  (from @nasnet/api-client/queries)
 *   - useCreateBatchJob    (from @nasnet/api-client/queries)
 *   - useBatchJob          (from @nasnet/api-client/queries)
 *   - useCancelBatchJob    (from @nasnet/api-client/queries)
 *
 * In a full Storybook setup these would be satisfied via MSW handlers or
 * Apollo MockedProvider decorators. The stories below document the full
 * prop surface and each dialog entry point.
 */

const meta: Meta<typeof ConfigurationImportWizard> = {
  title: 'Features/ConfigurationImport/ConfigurationImportWizard',
  component: ConfigurationImportWizard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A multi-step dialog wizard that guides the user through importing a MikroTik RouterOS configuration. Steps: (1) Paste or upload a .rsc file, (2) choose a connection protocol (API / SSH / Telnet), (3) watch real-time execution progress with optional rollback. Follows the Safety Pipeline pattern — changes are previewed before being applied.',
      },
    },
  },
  args: {
    onClose: fn(),
    onSuccess: fn(),
    onSkip: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ConfigurationImportWizard>;

export const OpenOnInputStep: Story = {
  name: 'Open — Step 1: Configuration Input',
  args: {
    isOpen: true,
    routerIp: '192.168.88.1',
    credentials: { username: 'admin', password: '' },
  },
};

export const Closed: Story = {
  name: 'Closed (Dialog Hidden)',
  args: {
    isOpen: false,
    routerIp: '192.168.88.1',
    credentials: { username: 'admin', password: '' },
  },
};

export const WithCustomRouterIp: Story = {
  name: 'Custom Router IP',
  args: {
    isOpen: true,
    routerIp: '10.0.0.1',
    credentials: { username: 'netadmin', password: 'secret123' },
  },
};

export const WithSkipCallback: Story = {
  name: 'With Skip Handler (Setup Flow)',
  parameters: {
    docs: {
      description: {
        story:
          'When embedded in a setup wizard flow the caller provides onSkip so the user can defer configuration import and continue setup.',
      },
    },
  },
  args: {
    isOpen: true,
    routerIp: '192.168.88.1',
    credentials: { username: 'admin', password: '' },
    onSkip: fn(),
  },
};

export const NoSkipOption: Story = {
  name: 'Without Skip (Mandatory Import)',
  parameters: {
    docs: {
      description: {
        story:
          'When onSkip is omitted the "Skip for now" button is not rendered, making configuration import a required step.',
      },
    },
  },
  args: {
    isOpen: true,
    routerIp: '192.168.88.1',
    credentials: { username: 'admin', password: '' },
    onSkip: undefined,
  },
};
