import { HardwareCard } from './HardwareCard';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof HardwareCard> = {
  title: 'Patterns/HardwareCard',
  component: HardwareCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays MikroTik routerboard hardware details (serial number, model, firmware, revision) with a copy-to-clipboard button for the serial number. Gracefully handles loading and error states.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof HardwareCard>;

const mockData = {
  serialNumber: 'HG408G02M4B',
  model: 'RouterBOARD 4011iGS+RM',
  currentFirmware: '7.13.2',
  factoryFirmware: '7.13.2',
  revision: 'r2',
};

const mockDataFirmwareMismatch = {
  serialNumber: 'D4CA6D12B901',
  model: 'RouterBOARD hEX S',
  currentFirmware: '7.14.0',
  factoryFirmware: '7.11.0',
  revision: 'r1',
};

export const Default: Story = {
  args: {
    data: mockData,
    isLoading: false,
    error: null,
  },
};

export const WithFirmwareMismatch: Story = {
  args: {
    data: mockDataFirmwareMismatch,
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When the current firmware differs from the factory firmware, an extra "Factory Firmware" row is rendered for comparison.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    data: undefined,
    isLoading: true,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'While data is being fetched the card renders skeleton placeholder rows.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    data: undefined,
    isLoading: false,
    error: new Error('Failed to fetch hardware info'),
  },
  parameters: {
    docs: {
      description: {
        story: 'When an error occurs the card falls back to a friendly "not available" message.',
      },
    },
  },
};

export const NoData: Story = {
  args: {
    data: null,
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Null data without an explicit error also triggers the fallback state (e.g. device type not supported).',
      },
    },
  },
};

export const CHRVirtualDevice: Story = {
  args: {
    data: {
      serialNumber: 'CHR-FFFFFFFFFFFFFFFF',
      model: 'CHR',
      currentFirmware: '7.14.0',
      factoryFirmware: '7.14.0',
      revision: 'x86_64',
    },
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'A Cloud Hosted Router (CHR) virtual device showing x86_64 revision.',
      },
    },
  },
};
