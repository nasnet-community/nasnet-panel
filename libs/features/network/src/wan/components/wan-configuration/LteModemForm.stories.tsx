/**
 * LTE Modem Form Storybook Stories
 *
 * Interactive documentation and visual testing for LTE modem configuration form.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 7: LTE Support)
 */

import { LteModemForm } from './LteModemForm';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LteModemForm> = {
  title: 'Features/Network/WAN/LteModemForm',
  component: LteModemForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
LTE/4G modem configuration form with comprehensive settings for cellular WAN connections.

## Features
- **Signal Strength Indicator** - Real-time signal display with visual bars
- **APN Presets** - One-click configuration for 9 popular carriers
- **PIN Management** - Secure SIM unlock with encrypted storage
- **Authentication** - PAP/CHAP support with credentials
- **Advanced Options** - MTU, default route, enable/disable controls

## Security
- PIN and password fields are never logged (backend enforces this)
- Masked input with visibility toggles
- Security notices for sensitive data
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    routerId: {
      control: 'text',
      description: 'Router ID for the LTE configuration',
    },
    signalStrength: {
      control: { type: 'range', min: -130, max: -50, step: 5 },
      description: 'RSSI signal strength in dBm (-130 to -50)',
    },
    signalQuality: {
      control: { type: 'range', min: 0, max: 100, step: 5 },
      description: 'Signal quality percentage (0-100)',
    },
    onSuccess: { action: 'success' },
    onCancel: { action: 'cancel' },
  },
};

export default meta;
type Story = StoryObj<typeof LteModemForm>;

/**
 * Default state - Empty form ready for new LTE configuration
 */
export const Default: Story = {
  args: {
    routerId: 'router-demo-123',
  },
};

/**
 * Excellent Signal - Strong cellular signal (-70 dBm)
 */
export const ExcellentSignal: Story = {
  args: {
    routerId: 'router-demo-123',
    signalStrength: -70,
    signalQuality: 95,
  },
  parameters: {
    docs: {
      description: {
        story: 'Form with excellent signal strength (-70 dBm, 95% quality). Signal bars show full strength with green indicator.',
      },
    },
  },
};

/**
 * Good Signal - Typical outdoor signal (-80 dBm)
 */
export const GoodSignal: Story = {
  args: {
    routerId: 'router-demo-123',
    signalStrength: -80,
    signalQuality: 75,
  },
  parameters: {
    docs: {
      description: {
        story: 'Form with good signal strength (-80 dBm, 75% quality). Typical for outdoor locations.',
      },
    },
  },
};

/**
 * Fair Signal - Indoor signal (-95 dBm)
 */
export const FairSignal: Story = {
  args: {
    routerId: 'router-demo-123',
    signalStrength: -95,
    signalQuality: 50,
  },
  parameters: {
    docs: {
      description: {
        story: 'Form with fair signal strength (-95 dBm, 50% quality). Typical for indoor locations with amber warning.',
      },
    },
  },
};

/**
 * Poor Signal - Weak signal (-110 dBm)
 */
export const PoorSignal: Story = {
  args: {
    routerId: 'router-demo-123',
    signalStrength: -110,
    signalQuality: 25,
  },
  parameters: {
    docs: {
      description: {
        story: 'Form with poor signal strength (-110 dBm, 25% quality). Red indicator warns of connectivity issues.',
      },
    },
  },
};

/**
 * No Signal - Very weak or no signal (-125 dBm)
 */
export const NoSignal: Story = {
  args: {
    routerId: 'router-demo-123',
    signalStrength: -125,
    signalQuality: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Form with no usable signal (-125 dBm, 5% quality). Connection may fail.',
      },
    },
  },
};

/**
 * Pre-filled Configuration - Editing existing LTE modem
 */
export const PrefilledConfiguration: Story = {
  args: {
    routerId: 'router-demo-123',
    signalStrength: -85,
    signalQuality: 70,
    initialData: {
      interface: 'lte1',
      apn: 'fast.t-mobile.com',
      authProtocol: 'pap',
      username: 'tmobile',
      password: '********',
      mtu: 1450,
      profileNumber: 1,
      isDefaultRoute: true,
      enabled: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Form pre-populated with existing LTE configuration for editing. Shows T-Mobile APN with PAP authentication.',
      },
    },
  },
};

/**
 * T-Mobile Preset - Quick setup for T-Mobile US
 */
export const TMobilePreset: Story = {
  args: {
    routerId: 'router-demo-123',
    signalStrength: -78,
    signalQuality: 80,
    initialData: {
      interface: 'lte1',
      apn: 'fast.t-mobile.com',
      authProtocol: 'none',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Quick setup using T-Mobile US preset. APN automatically filled with fast.t-mobile.com.',
      },
    },
  },
};

/**
 * AT&T Preset - Quick setup for AT&T
 */
export const ATTPreset: Story = {
  args: {
    routerId: 'router-demo-123',
    signalStrength: -82,
    signalQuality: 72,
    initialData: {
      interface: 'lte1',
      apn: 'broadband',
      authProtocol: 'none',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Quick setup using AT&T preset. Simple "broadband" APN configuration.',
      },
    },
  },
};

/**
 * With Authentication - PAP authentication enabled
 */
export const WithAuthentication: Story = {
  args: {
    routerId: 'router-demo-123',
    signalStrength: -88,
    signalQuality: 65,
    initialData: {
      interface: 'lte1',
      apn: 'internet',
      authProtocol: 'pap',
      username: 'user@carrier.com',
      password: 'secretpass',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Form with PAP authentication enabled, showing username and password fields with visibility toggles.',
      },
    },
  },
};

/**
 * With SIM PIN - PIN-locked SIM card configuration
 */
export const WithSimPin: Story = {
  args: {
    routerId: 'router-demo-123',
    signalStrength: -75,
    signalQuality: 90,
    initialData: {
      interface: 'lte1',
      apn: 'internet.carrier.com',
      pin: '1234',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration for PIN-locked SIM card. PIN field shows security notice about encrypted storage.',
      },
    },
  },
};

/**
 * Custom MTU - Modified MTU setting for specific networks
 */
export const CustomMTU: Story = {
  args: {
    routerId: 'router-demo-123',
    signalStrength: -80,
    signalQuality: 75,
    initialData: {
      interface: 'lte1',
      apn: 'internet',
      mtu: 1400,
      isDefaultRoute: true,
      enabled: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration with custom MTU value (1400). Useful for carriers with specific MTU requirements.',
      },
    },
  },
};

/**
 * Disabled Interface - LTE configured but disabled
 */
export const DisabledInterface: Story = {
  args: {
    routerId: 'router-demo-123',
    initialData: {
      interface: 'lte1',
      apn: 'internet',
      enabled: false,
      isDefaultRoute: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'LTE interface configured but disabled. No signal data shown as interface is inactive.',
      },
    },
  },
};

/**
 * Backup WAN - LTE as backup without default route
 */
export const BackupWAN: Story = {
  args: {
    routerId: 'router-demo-123',
    signalStrength: -85,
    signalQuality: 68,
    initialData: {
      interface: 'lte2',
      apn: 'internet.backup.com',
      isDefaultRoute: false, // Not default route
      enabled: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'LTE configured as backup WAN without default route. Primary WAN uses different interface.',
      },
    },
  },
};

/**
 * Mobile Only - No cancel button (embedded in workflow)
 */
export const MobileEmbedded: Story = {
  args: {
    routerId: 'router-demo-123',
    signalStrength: -82,
    signalQuality: 72,
    // No onCancel - button won't be shown
  },
  parameters: {
    docs: {
      description: {
        story: 'Form embedded in a workflow where cancel is not applicable. Cancel button is hidden.',
      },
    },
  },
};

/**
 * International - Vodafone EU preset
 */
export const VodafoneEU: Story = {
  args: {
    routerId: 'router-demo-123',
    signalStrength: -76,
    signalQuality: 85,
    initialData: {
      interface: 'lte1',
      apn: 'internet.vodafone.net',
      authProtocol: 'none',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'European carrier configuration using Vodafone preset with standard APN.',
      },
    },
  },
};

/**
 * Interactive - Playground for testing all configurations
 */
export const Playground: Story = {
  args: {
    routerId: 'router-playground-123',
    signalStrength: -80,
    signalQuality: 75,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground - adjust all controls to test different configurations and states.',
      },
    },
  },
};
