/**
 * TroubleshootWizard Storybook Stories
 * Visual documentation for the root wizard component (NAS-5.11)
 */

import { TroubleshootWizard } from './TroubleshootWizard';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof TroubleshootWizard> = {
  title: 'Features/Diagnostics/TroubleshootWizard',
  component: TroubleshootWizard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Root entry point for the "No Internet" troubleshooting wizard. Automatically renders `TroubleshootWizardDesktop` on viewports wider than 1024 px and `TroubleshootWizardMobile` below that threshold. Accepts a `routerId` to scope all diagnostics, an `autoStart` flag to skip the idle landing screen, optional `ispInfo` for ISP-specific contact suggestions, and an `onClose` callback.\n\n> **Note:** Stories here render the full wizard shell, which uses the `useTroubleshootWizard` hook internally. In a real Storybook environment the GraphQL calls will be made against the configured Apollo Client; mock them with MSW or pass a mock router ID that returns 404s from the proxy to see the idle / error states.',
      },
    },
  },
  argTypes: {
    routerId: {
      control: 'text',
      description: 'UUID of the MikroTik router to run diagnostics against',
    },
    autoStart: {
      control: 'boolean',
      description: 'When true, the wizard begins running immediately on mount',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names applied to the root wrapper element',
    },
    onClose: { action: 'onClose' },
  },
};

export default meta;
type Story = StoryObj<typeof TroubleshootWizard>;

// ─── Stories ─────────────────────────────────────────────────────────────────

// Story: Default (Idle, Manual Start)
export const Default: Story = {
  args: {
    routerId: 'router-00000000-0000-0000-0000-000000000001',
    autoStart: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The wizard mounts in the idle state, showing an intro card with a "Start Diagnostic" button. The user must press the button to begin. This is the default production behaviour.',
      },
    },
  },
};

// Story: Auto-Start
export const AutoStart: Story = {
  args: {
    routerId: 'router-00000000-0000-0000-0000-000000000002',
    autoStart: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Passing `autoStart={true}` skips the idle screen and immediately begins the diagnostic sequence on mount. Useful when launched from an alert or deep link.',
      },
    },
  },
};

// Story: With ISP Info
export const WithISPInfo: Story = {
  args: {
    routerId: 'router-00000000-0000-0000-0000-000000000003',
    autoStart: false,
    ispInfo: {
      name: 'Comcast Xfinity',
      supportPhone: '1-800-934-6489',
      supportUrl: 'https://www.xfinity.com/support',
      detected: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `ispInfo` is provided and a step ultimately recommends contacting the ISP (e.g. gateway unreachable with no auto-fix), the wizard surfaces the ISP name, phone number, and support URL inside the FixSuggestion panel.',
      },
    },
  },
};

// Story: With Close Handler
export const WithCloseHandler: Story = {
  args: {
    routerId: 'router-00000000-0000-0000-0000-000000000004',
    autoStart: false,
    onClose: () => alert('Wizard closed'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Providing `onClose` shows the close/back button in the wizard header. On mobile this is a ChevronLeft back button; on desktop it is an X icon button.',
      },
    },
  },
};

// Story: Custom className
export const CustomClassName: Story = {
  args: {
    routerId: 'router-00000000-0000-0000-0000-000000000005',
    autoStart: false,
    className: 'border border-dashed border-primary rounded-xl p-4',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The `className` prop is forwarded to the root `div[role="region"]` wrapper. Use it to apply margin, padding, or border styling from the parent layout.',
      },
    },
  },
};

// Story: Full ISP Info + Auto-Start (kitchen sink)
export const FullConfig: Story = {
  name: 'Full Config (Auto-Start + ISP + Close)',
  args: {
    routerId: 'router-00000000-0000-0000-0000-000000000006',
    autoStart: true,
    ispInfo: {
      name: 'Spectrum',
      supportPhone: '1-833-267-6094',
      supportUrl: 'https://www.spectrum.com/contact-us',
      detected: true,
    },
    onClose: () => alert('Wizard closed'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'All props supplied at once: the wizard starts immediately, ISP contact details are available for relevant failure states, and a close callback is wired up.',
      },
    },
  },
};
