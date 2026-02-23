/**
 * EmailChannelForm Storybook Stories
 * NAS-18.3: Email notification configuration with Platform Presenters
 *
 * Showcases all prop variants, pre-filled states, and interaction scenarios
 * for the email channel configuration form.
 */

import { fn } from 'storybook/test';

import { EmailChannelForm } from './EmailChannelForm';

import type { Meta, StoryObj } from '@storybook/react';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof EmailChannelForm> = {
  title: 'Features/Alerts/EmailChannelForm',
  component: EmailChannelForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
EmailChannelForm is a platform-aware email notification configuration form that
automatically selects the correct presenter based on screen width:

- **Mobile (<640px):** Touch-optimized single-column layout with accordion sections and 44px touch targets
- **Desktop (≥640px):** Dense two-column layout with collapsible advanced settings

The form manages SMTP server settings, multi-recipient management (up to 10),
TLS configuration, and test notification functionality.

Uses React Hook Form + Zod validation internally via the \`useEmailChannelForm\` headless hook.
        `,
      },
    },
  },
  argTypes: {
    onSubmit: { action: 'submit' },
    onTest: { action: 'test' },
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof EmailChannelForm>;

// =============================================================================
// Stories
// =============================================================================

/**
 * Default empty state — new email channel configuration
 */
export const Default: Story = {
  args: {
    onSubmit: fn(),
    onTest: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty form for creating a new email notification channel.',
      },
    },
  },
};

/**
 * Pre-filled with a Gmail SMTP configuration
 */
export const PrefilledGmail: Story = {
  args: {
    initialConfig: {
      enabled: true,
      host: 'smtp.gmail.com',
      port: 587,
      username: 'alerts@example.com',
      password: 'app-specific-password',
      fromAddress: 'alerts@example.com',
      fromName: 'NasNet Alerts',
      toAddresses: ['admin@example.com', 'noc@example.com'],
      useTLS: true,
      skipVerify: false,
    },
    onSubmit: fn(),
    onTest: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Form pre-filled with a Gmail SMTP configuration. Demonstrates the two-recipient state and TLS enabled.',
      },
    },
  },
};

/**
 * Pre-filled with an Office 365 / SMTPS configuration on port 465
 */
export const PrefilledOffice365: Story = {
  args: {
    initialConfig: {
      enabled: true,
      host: 'smtp.office365.com',
      port: 465,
      username: 'router-alerts@corp.example.com',
      password: 'P@ssw0rd!',
      fromAddress: 'router-alerts@corp.example.com',
      fromName: 'Router Monitoring',
      toAddresses: [
        'netops@corp.example.com',
        'soc@corp.example.com',
        'oncall@corp.example.com',
      ],
      useTLS: true,
      skipVerify: false,
    },
    onSubmit: fn(),
    onTest: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Office 365 SMTPS configuration on port 465 with three recipients (NOC, SOC, on-call).',
      },
    },
  },
};

/**
 * Self-hosted SMTP with TLS verification disabled (internal server)
 */
export const SelfHostedInsecure: Story = {
  args: {
    initialConfig: {
      enabled: true,
      host: 'mail.internal.lan',
      port: 25,
      username: 'nasnet',
      password: 'internal-pass',
      fromAddress: 'nasnet@internal.lan',
      fromName: 'NasNet Router',
      toAddresses: ['admin@internal.lan'],
      useTLS: false,
      skipVerify: true,
    },
    onSubmit: fn(),
    onTest: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Internal SMTP relay on port 25 with TLS disabled and certificate verification skipped — common for self-hosted environments.',
      },
    },
  },
};

/**
 * Disabled form — read-only when another operation is in progress
 */
export const Disabled: Story = {
  args: {
    initialConfig: {
      enabled: true,
      host: 'smtp.gmail.com',
      port: 587,
      username: 'alerts@example.com',
      password: 'secret',
      fromAddress: 'alerts@example.com',
      fromName: 'NasNet',
      toAddresses: ['admin@example.com'],
      useTLS: true,
      skipVerify: false,
    },
    onSubmit: fn(),
    onTest: fn(),
    className: 'opacity-60 pointer-events-none',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Visually disabled state achieved via className — useful when the parent is processing a save operation.',
      },
    },
  },
};

/**
 * Mobile viewport — touch-optimized single-column layout
 */
export const Mobile: Story = {
  args: {
    initialConfig: {
      enabled: false,
      host: 'smtp.gmail.com',
      port: 587,
      username: 'alerts@example.com',
      password: '',
      fromAddress: 'alerts@example.com',
      fromName: 'NasNet',
      toAddresses: ['admin@example.com'],
      useTLS: true,
      skipVerify: false,
    },
    onSubmit: fn(),
    onTest: fn(),
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Mobile presenter (<640px) with touch-optimized accordion layout and 44px minimum touch targets.',
      },
    },
  },
};

/**
 * Desktop viewport — two-column dense layout
 */
export const Desktop: Story = {
  args: {
    initialConfig: {
      enabled: true,
      host: 'smtp.sendgrid.net',
      port: 587,
      username: 'apikey',
      password: 'SG.api_key_value',
      fromAddress: 'no-reply@example.com',
      fromName: 'NasNet Monitor',
      toAddresses: ['admin@example.com'],
      useTLS: true,
      skipVerify: false,
    },
    onSubmit: fn(),
    onTest: fn(),
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story: 'Desktop presenter (≥640px) with dense two-column grid and collapsible advanced settings.',
      },
    },
  },
};
