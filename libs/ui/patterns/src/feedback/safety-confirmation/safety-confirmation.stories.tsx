/**
 * SafetyConfirmation Storybook Stories
 *
 * Interactive stories demonstrating the SafetyConfirmation component
 * in various scenarios and configurations.
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 */

import { useState } from 'react';

import { Button } from '@nasnet/ui/primitives';

import { SafetyConfirmation } from './safety-confirmation';

import type { SafetyConfirmationProps } from './safety-confirmation.types';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * # SafetyConfirmation
 *
 * Multi-step confirmation dialog for dangerous/irreversible operations.
 *
 * ## Features
 * - **Type-to-confirm**: User must type exact text to enable confirmation
 * - **Countdown timer**: Forced delay before confirming (default 10 seconds)
 * - **Urgency levels**: Visual feedback changes as countdown progresses
 * - **Platform adaptive**: Desktop uses Dialog, Mobile uses Sheet
 * - **Accessible**: Full keyboard navigation, screen reader support
 *
 * ## Use Cases
 * - Factory reset
 * - Firmware update
 * - Delete interface
 * - Clear firewall rules
 * - Disable VPN
 * - Delete certificates
 * - Restore backup
 *
 * ## Integration
 * Integrates with the configPipelineMachine for the Apply-Confirm-Merge pattern.
 * Use `useDangerousOperationConfirmation` hook for state machine integration.
 */
const meta: Meta<typeof SafetyConfirmation> = {
  title: 'Patterns/Feedback/SafetyConfirmation',
  component: SafetyConfirmation,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Multi-step confirmation dialog for dangerous operations with type-to-confirm and countdown timer.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    title: {
      control: 'text',
      description: 'Dialog title',
    },
    description: {
      control: 'text',
      description: 'Description of the dangerous operation',
    },
    consequences: {
      control: 'object',
      description: 'List of consequences/risks',
    },
    confirmText: {
      control: 'text',
      description: 'Text user must type to confirm',
    },
    countdownSeconds: {
      control: { type: 'number', min: 1, max: 60 },
      description: 'Countdown duration in seconds',
    },
    caseSensitive: {
      control: 'boolean',
      description: 'Whether validation is case-sensitive',
    },
    presenter: {
      control: 'select',
      options: ['auto', 'mobile', 'desktop'],
      description: 'Force a specific presenter',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SafetyConfirmation>;

/**
 * Interactive wrapper that provides open/close state
 */
function SafetyConfirmationDemo(
  props: Omit<SafetyConfirmationProps, 'open' | 'onOpenChange' | 'onConfirm' | 'onCancel'>
) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
      >
        Trigger {props.title}
      </Button>
      <SafetyConfirmation
        {...props}
        open={open}
        onOpenChange={setOpen}
        onConfirm={async () => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 2000));
          console.log('Operation confirmed!');
        }}
        onCancel={() => console.log('Operation cancelled')}
      />
    </div>
  );
}

/**
 * Default factory reset scenario with 10 second countdown.
 * User must type "RESET" to confirm.
 */
export const Default: Story = {
  render: () => (
    <SafetyConfirmationDemo
      title="Factory Reset"
      description="This will restore all router settings to factory defaults. This action cannot be undone."
      consequences={[
        'All configuration will be permanently lost',
        'Router will reboot automatically',
        'You will be disconnected from the network',
        'All connected devices will lose internet access',
      ]}
      confirmText="RESET"
      countdownSeconds={10}
    />
  ),
};

/**
 * Firmware update with longer countdown (15 seconds).
 * User must type "UPDATE" to confirm.
 */
export const FirmwareUpdate: Story = {
  render: () => (
    <SafetyConfirmationDemo
      title="Firmware Update"
      description="The router will be updated to RouterOS v7.15. Do not disconnect power during this process."
      consequences={[
        'Router will reboot multiple times',
        'All services will be interrupted for 5-10 minutes',
        'VPN connections will be terminated',
        'DHCP leases may be renewed',
      ]}
      confirmText="UPDATE"
      countdownSeconds={15}
    />
  ),
};

/**
 * Quick delete with shorter countdown (5 seconds).
 * User must type the interface name to confirm.
 */
export const QuickDelete: Story = {
  render: () => (
    <SafetyConfirmationDemo
      title="Delete Interface"
      description='You are about to delete the network interface "ether2-lan".'
      consequences={[
        'Traffic on this interface will stop immediately',
        'Connected devices will be disconnected',
        'Associated IP addresses will be removed',
      ]}
      confirmText="ether2-lan"
      countdownSeconds={5}
    />
  ),
};

/**
 * Mobile variant using Sheet instead of Dialog.
 * Force the mobile presenter regardless of viewport.
 */
export const MobileVariant: Story = {
  render: () => (
    <SafetyConfirmationDemo
      title="Clear Firewall"
      description="This will remove all firewall rules and leave your network unprotected."
      consequences={[
        'All firewall rules will be deleted',
        'Network will be temporarily unprotected',
        'You may need to reconfigure security settings',
      ]}
      confirmText="CLEAR"
      countdownSeconds={10}
      presenter="mobile"
    />
  ),
  globals: {
    viewport: {
      value: 'mobile1',
      isRotated: false,
    },
  },
};

/**
 * Desktop variant using centered Dialog.
 * Force the desktop presenter regardless of viewport.
 */
export const DesktopVariant: Story = {
  render: () => (
    <SafetyConfirmationDemo
      title="Disable VPN"
      description='Disabling "Office VPN" will terminate all remote connections.'
      consequences={[
        'Remote users will lose access',
        'File shares will become inaccessible',
        'Remote desktop sessions will disconnect',
      ]}
      confirmText="Office VPN"
      countdownSeconds={5}
      presenter="desktop"
    />
  ),
};

/**
 * Dark theme variant to verify styling in dark mode.
 */
export const DarkTheme: Story = {
  render: () => (
    <SafetyConfirmationDemo
      title="Delete Certificate"
      description='Deleting "ssl-server" certificate will break HTTPS services.'
      consequences={[
        'HTTPS web interface will show security warnings',
        'VPN authentication may fail',
        'Encrypted connections will not work',
      ]}
      confirmText="ssl-server"
      countdownSeconds={5}
    />
  ),

  parameters: {
    themes: { default: 'dark' },
  },

  globals: {
    backgrounds: {
      value: 'dark',
    },
  },
};

/**
 * Restore backup scenario with standard countdown.
 */
export const RestoreBackup: Story = {
  render: () => (
    <SafetyConfirmationDemo
      title="Restore Backup"
      description="This will overwrite all current configuration with the backup from 2026-01-15."
      consequences={[
        'Current configuration will be replaced',
        'Any changes since the backup will be lost',
        'Router will reboot to apply changes',
        'Network services may be temporarily unavailable',
      ]}
      confirmText="RESTORE"
      countdownSeconds={10}
    />
  ),
};

/**
 * Case-insensitive validation.
 * User can type "reset", "RESET", or "Reset" to confirm.
 */
export const CaseInsensitive: Story = {
  render: () => (
    <SafetyConfirmationDemo
      title="Reset DHCP Leases"
      description="This will clear all DHCP leases and force clients to request new addresses."
      consequences={[
        'All devices will get new IP addresses',
        'Static DHCP bindings will be preserved',
        'Network connectivity may be briefly interrupted',
      ]}
      confirmText="RESET"
      countdownSeconds={5}
      caseSensitive={false}
    />
  ),
};

/**
 * Many consequences - demonstrates scrollable list.
 */
export const ManyConsequences: Story = {
  render: () => (
    <SafetyConfirmationDemo
      title="Complete System Reset"
      description="This will perform a complete system reset including all user data."
      consequences={[
        'All router configuration will be erased',
        'User accounts will be deleted',
        'Scripts and scheduled tasks will be removed',
        'Firewall rules will be reset to defaults',
        'VPN configurations will be deleted',
        'DHCP settings will be reset',
        'DNS settings will be cleared',
        'Wireless networks will be removed',
        'Bridge configurations will be deleted',
        'Routing tables will be cleared',
      ]}
      confirmText="RESET ALL"
      countdownSeconds={15}
    />
  ),
};

/**
 * Controlled story with all props exposed in Storybook controls.
 */
export const Playground: Story = {
  args: {
    title: 'Dangerous Operation',
    description: 'This is a dangerous operation that cannot be undone.',
    consequences: ['First consequence', 'Second consequence', 'Third consequence'],
    confirmText: 'CONFIRM',
    countdownSeconds: 10,
    caseSensitive: true,
    presenter: 'auto',
  },
  render: (args) => <SafetyConfirmationDemo {...args} />,
};
