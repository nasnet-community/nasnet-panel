/**
 * FixSuggestion Storybook Stories
 * Visual documentation for the fix suggestion component (NAS-5.11)
 */

import type { Meta, StoryObj } from '@storybook/react';
import { FixSuggestion } from './FixSuggestion';
import type { FixSuggestion as FixSuggestionType } from '../../types/troubleshoot.types';

const meta: Meta<typeof FixSuggestion> = {
  title: 'Features/Diagnostics/FixSuggestion',
  component: FixSuggestion,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays a suggested fix for a failed diagnostic step. Supports both automated and manual fixes with confidence indicators.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-6 bg-background">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    status: {
      control: 'select',
      options: ['available', 'applying', 'applied', 'failed', 'issue_persists'],
      description: 'Current status of the fix application',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FixSuggestion>;

// Story: High Confidence Automated Fix
export const HighConfidenceAutomated: Story = {
  args: {
    fix: {
      issueCode: 'WAN_DISABLED',
      title: 'Enable WAN Interface',
      explanation:
        'Your WAN interface is currently disabled. We can enable it for you automatically.',
      confidence: 'high',
      requiresConfirmation: true,
      isManualFix: false,
      command: '/interface/enable [find where name~"ether1"]',
      rollbackCommand: '/interface/disable [find where name~"ether1"]',
    },
    status: 'available',
    onApply: () => console.log('Apply fix'),
    onSkip: () => console.log('Skip fix'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Automated fix with high confidence. Shows green badge and "Apply Fix" button.',
      },
    },
  },
};

// Story: Medium Confidence Automated Fix
export const MediumConfidenceAutomated: Story = {
  args: {
    fix: {
      issueCode: 'GATEWAY_UNREACHABLE',
      title: 'Reset DHCP Client',
      explanation:
        'Your DHCP lease may have expired. Renewing it might restore gateway connectivity.',
      confidence: 'medium',
      requiresConfirmation: true,
      isManualFix: false,
      command: '/ip/dhcp-client/renew [find where interface~"ether1"]',
    },
    status: 'available',
    onApply: () => console.log('Apply fix'),
    onSkip: () => console.log('Skip fix'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Automated fix with medium confidence. Shows yellow/amber badge.',
      },
    },
  },
};

// Story: Manual Fix with ISP Contact
export const ManualFixWithISP: Story = {
  args: {
    fix: {
      issueCode: 'WAN_LINK_DOWN',
      title: 'Check Physical Connection',
      explanation:
        'The cable to your internet provider appears disconnected. This requires manual intervention.',
      confidence: 'high',
      requiresConfirmation: false,
      isManualFix: true,
      manualSteps: [
        'Check that the ethernet cable from your ISP is firmly plugged into the WAN port',
        'Look for a green link light on the WAN port (usually labeled "ether1" or "WAN")',
        'If using a modem, ensure the modem is powered on and showing an active connection',
        'Try unplugging and re-plugging the cable to reseat the connection',
      ],
    },
    status: 'available',
    ispInfo: {
      name: 'Comcast Xfinity',
      supportPhone: '1-800-934-6489',
      supportUrl: 'https://www.xfinity.com/support',
    },
    onSkip: () => console.log('Skip fix'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Manual fix with step-by-step instructions and ISP contact information.',
      },
    },
  },
};

// Story: DNS Fix with Manual Steps
export const DNSManualFix: Story = {
  args: {
    fix: {
      issueCode: 'DNS_FAILED',
      title: 'Configure DNS Servers',
      explanation:
        'Your router needs to be configured with working DNS servers to resolve domain names.',
      confidence: 'high',
      requiresConfirmation: true,
      isManualFix: false,
      command: '/ip/dns/set servers=8.8.8.8,8.8.4.4',
    },
    status: 'available',
    onApply: () => console.log('Apply fix'),
    onSkip: () => console.log('Skip fix'),
  },
  parameters: {
    docs: {
      description: {
        story: 'DNS configuration fix that can be applied automatically.',
      },
    },
  },
};

// Story: Fix Being Applied
export const Applying: Story = {
  args: {
    fix: {
      issueCode: 'NAT_DISABLED',
      title: 'Enable NAT Masquerade',
      explanation: 'Enabling the NAT masquerade rule to allow internet access from LAN devices.',
      confidence: 'high',
      requiresConfirmation: true,
      isManualFix: false,
      command: '/ip/firewall/nat/enable [find where action=masquerade]',
    },
    status: 'applying',
  },
  parameters: {
    docs: {
      description: {
        story: 'Fix currently being applied. Shows spinner and disabled state.',
      },
    },
  },
};

// Story: Fix Applied Successfully
export const Applied: Story = {
  args: {
    fix: {
      issueCode: 'WAN_DISABLED',
      title: 'Enable WAN Interface',
      explanation: 'WAN interface has been enabled successfully.',
      confidence: 'high',
      requiresConfirmation: true,
      isManualFix: false,
    },
    status: 'applied',
  },
  parameters: {
    docs: {
      description: {
        story: 'Fix has been applied successfully. Shows success state with check icon.',
      },
    },
  },
};

// Story: Fix Application Failed
export const Failed: Story = {
  args: {
    fix: {
      issueCode: 'DNS_FAILED',
      title: 'Configure DNS Servers',
      explanation: 'Failed to apply DNS configuration. You may need to configure it manually.',
      confidence: 'high',
      requiresConfirmation: true,
      isManualFix: false,
    },
    status: 'failed',
    onApply: () => console.log('Retry fix'),
    onSkip: () => console.log('Skip fix'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Fix application failed. Shows error state with retry option.',
      },
    },
  },
};

// Story: Fix Applied But Issue Persists
export const IssuePersists: Story = {
  args: {
    fix: {
      issueCode: 'GATEWAY_UNREACHABLE',
      title: 'Reset DHCP Client',
      explanation:
        'The DHCP client was reset, but the gateway is still unreachable. This may indicate a more serious network issue.',
      confidence: 'medium',
      requiresConfirmation: true,
      isManualFix: false,
    },
    status: 'issue_persists',
    ispInfo: {
      name: 'Spectrum',
      supportPhone: '1-833-267-6094',
      supportUrl: 'https://www.spectrum.com/contact-us',
    },
    onSkip: () => console.log('Skip to next step'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fix was applied but the issue remains. Shows warning state and suggests contacting ISP.',
      },
    },
  },
};

// Story: Low Confidence Fix
export const LowConfidence: Story = {
  args: {
    fix: {
      issueCode: 'INTERNET_TIMEOUT',
      title: 'Adjust MTU Settings',
      explanation:
        'Lowering the MTU size might help with slow internet, but this is unlikely to be the root cause.',
      confidence: 'low',
      requiresConfirmation: true,
      isManualFix: false,
      command: '/interface/set [find where name~"ether1"] mtu=1400',
    },
    status: 'available',
    onApply: () => console.log('Apply fix'),
    onSkip: () => console.log('Skip fix'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Fix with low confidence. Shows red/orange badge to indicate uncertainty.',
      },
    },
  },
};

// Story: All Fix States (for visual testing)
export const AllStates: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Available (High Confidence)</h3>
        <FixSuggestion
          fix={{
            issueCode: 'WAN_DISABLED',
            title: 'Enable WAN Interface',
            explanation: 'Your WAN interface is currently disabled.',
            confidence: 'high',
            requiresConfirmation: true,
            isManualFix: false,
          }}
          status="available"
          onApply={() => {}}
          onSkip={() => {}}
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Applying</h3>
        <FixSuggestion
          fix={{
            issueCode: 'NAT_DISABLED',
            title: 'Enable NAT',
            explanation: 'Enabling NAT masquerade rule.',
            confidence: 'high',
            requiresConfirmation: true,
            isManualFix: false,
          }}
          status="applying"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Applied</h3>
        <FixSuggestion
          fix={{
            issueCode: 'DNS_FAILED',
            title: 'Configure DNS',
            explanation: 'DNS servers configured successfully.',
            confidence: 'high',
            requiresConfirmation: true,
            isManualFix: false,
          }}
          status="applied"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Failed</h3>
        <FixSuggestion
          fix={{
            issueCode: 'GATEWAY_UNREACHABLE',
            title: 'Reset DHCP',
            explanation: 'Failed to reset DHCP client.',
            confidence: 'medium',
            requiresConfirmation: true,
            isManualFix: false,
          }}
          status="failed"
          onApply={() => {}}
          onSkip={() => {}}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual comparison of all fix suggestion states.',
      },
    },
  },
};
