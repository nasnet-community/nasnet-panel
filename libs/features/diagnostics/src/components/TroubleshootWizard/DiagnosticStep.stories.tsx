/**
 * DiagnosticStep Storybook Stories
 * Visual documentation for the diagnostic step component (NAS-5.11)
 */

import type { Meta, StoryObj } from '@storybook/react';
import { DiagnosticStep } from './DiagnosticStep';
import type { DiagnosticStep as DiagnosticStepType } from '../../types/troubleshoot.types';

const meta: Meta<typeof DiagnosticStep> = {
  title: 'Features/Diagnostics/DiagnosticStep',
  component: DiagnosticStep,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays a single diagnostic step in the troubleshooting wizard. Shows different visual states based on step status.',
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
    isActive: {
      control: 'boolean',
      description: 'Whether this step is currently active/being executed',
    },
    stepNumber: {
      control: { type: 'number', min: 1, max: 5 },
      description: 'Display number for this step (1-based)',
    },
    totalSteps: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Total number of steps in the wizard',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DiagnosticStep>;

// Base step data
const baseStep: DiagnosticStepType = {
  id: 'wan',
  name: 'WAN Interface',
  description: 'Checking if your internet connection is physically connected',
  status: 'pending',
};

// Story: Pending State
export const Pending: Story = {
  args: {
    step: baseStep,
    isActive: false,
    stepNumber: 1,
    totalSteps: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Step that has not started yet. Shows clock icon and muted colors.',
      },
    },
  },
};

// Story: Running State
export const Running: Story = {
  args: {
    step: {
      ...baseStep,
      status: 'running',
    },
    isActive: true,
    stepNumber: 1,
    totalSteps: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Step currently executing. Shows spinning loader icon.',
      },
    },
  },
};

// Story: Passed State
export const Passed: Story = {
  args: {
    step: {
      ...baseStep,
      status: 'passed',
      result: {
        success: true,
        message: 'Your WAN port is connected and working',
        executionTimeMs: 450,
      },
    },
    isActive: false,
    stepNumber: 1,
    totalSteps: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Step completed successfully. Shows green check icon and success message.',
      },
    },
  },
};

// Story: Failed State
export const Failed: Story = {
  args: {
    step: {
      ...baseStep,
      status: 'failed',
      result: {
        success: false,
        message: 'The cable to your internet provider appears disconnected',
        issueCode: 'WAN_LINK_DOWN',
        executionTimeMs: 320,
      },
    },
    isActive: false,
    stepNumber: 1,
    totalSteps: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Step failed. Shows red X icon and error message.',
      },
    },
  },
};

// Story: Failed with Fix Available
export const FailedWithFix: Story = {
  args: {
    step: {
      ...baseStep,
      status: 'failed',
      result: {
        success: false,
        message: 'Your internet port has been turned off',
        issueCode: 'WAN_DISABLED',
        executionTimeMs: 280,
      },
      fix: {
        issueCode: 'WAN_DISABLED',
        title: 'Enable WAN Interface',
        explanation:
          'Your WAN interface is currently disabled. We can enable it for you with a single click.',
        confidence: 'high',
        requiresConfirmation: true,
        isManualFix: false,
        command: '/interface/enable [find where name~"ether1"]',
        rollbackCommand: '/interface/disable [find where name~"ether1"]',
      },
    },
    isActive: false,
    stepNumber: 1,
    totalSteps: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Step failed with an automated fix available. Shows error message with fix badge.',
      },
    },
  },
};

// Story: Gateway Check Running
export const GatewayCheckRunning: Story = {
  args: {
    step: {
      id: 'gateway',
      name: 'Gateway',
      description: 'Pinging your default gateway',
      status: 'running',
    },
    isActive: true,
    stepNumber: 2,
    totalSteps: 5,
  },
};

// Story: Internet Check Passed
export const InternetCheckPassed: Story = {
  args: {
    step: {
      id: 'internet',
      name: 'Internet',
      description: 'Testing connection to external servers',
      status: 'passed',
      result: {
        success: true,
        message: 'Internet is reachable',
        details: 'Successfully pinged 8.8.8.8 (Google DNS)',
        executionTimeMs: 850,
      },
    },
    isActive: false,
    stepNumber: 3,
    totalSteps: 5,
  },
};

// Story: DNS Check Failed
export const DNSCheckFailed: Story = {
  args: {
    step: {
      id: 'dns',
      name: 'DNS',
      description: 'Testing name resolution',
      status: 'failed',
      result: {
        success: false,
        message: 'DNS resolution failed',
        issueCode: 'DNS_FAILED',
        details: 'Unable to resolve google.com',
        executionTimeMs: 5020,
      },
      fix: {
        issueCode: 'DNS_FAILED',
        title: 'Configure DNS Servers',
        explanation:
          'Your router is not configured with working DNS servers. We can set up Google DNS (8.8.8.8) for you.',
        confidence: 'high',
        requiresConfirmation: true,
        isManualFix: false,
        command: '/ip/dns/set servers=8.8.8.8,8.8.4.4',
      },
    },
    isActive: false,
    stepNumber: 4,
    totalSteps: 5,
  },
};

// Story: NAT Check Passed
export const NATCheckPassed: Story = {
  args: {
    step: {
      id: 'nat',
      name: 'NAT',
      description: 'Verifying masquerade rules',
      status: 'passed',
      result: {
        success: true,
        message: 'NAT is configured correctly',
        details: 'Masquerade rule found for WAN interface',
        executionTimeMs: 380,
      },
    },
    isActive: false,
    stepNumber: 5,
    totalSteps: 5,
  },
};

// Story: All Steps Combined (for visual testing)
export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      <DiagnosticStep step={{ ...baseStep, status: 'pending' }} isActive={false} stepNumber={1} totalSteps={5} />
      <DiagnosticStep step={{ ...baseStep, status: 'running' }} isActive={true} stepNumber={2} totalSteps={5} />
      <DiagnosticStep
        step={{
          ...baseStep,
          status: 'passed',
          result: { success: true, message: 'Check passed', executionTimeMs: 450 },
        }}
        isActive={false}
        stepNumber={3}
        totalSteps={5}
      />
      <DiagnosticStep
        step={{
          ...baseStep,
          status: 'failed',
          result: { success: false, message: 'Check failed', issueCode: 'ERROR', executionTimeMs: 320 },
        }}
        isActive={false}
        stepNumber={4}
        totalSteps={5}
      />
      <DiagnosticStep
        step={{
          ...baseStep,
          status: 'skipped',
        }}
        isActive={false}
        stepNumber={5}
        totalSteps={5}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual comparison of all step states in one view.',
      },
    },
  },
};
