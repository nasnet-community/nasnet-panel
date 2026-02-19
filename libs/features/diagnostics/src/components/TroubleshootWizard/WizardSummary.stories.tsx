/**
 * WizardSummary Storybook Stories
 * Visual documentation for the wizard summary component (NAS-5.11)
 */

import { WizardSummary } from './WizardSummary';

import type { DiagnosticSummary, DiagnosticStep } from '../../types/troubleshoot.types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof WizardSummary> = {
  title: 'Features/Diagnostics/WizardSummary',
  component: WizardSummary,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displayed at the end of the troubleshooting wizard after all steps have run. Shows a status icon, pass/fail statistics, a per-step results list, and any fixes that were applied. Provides Run Again and Close actions.',
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
    onRestart: { action: 'onRestart' },
    onClose: { action: 'onClose' },
  },
};

export default meta;
type Story = StoryObj<typeof WizardSummary>;

// ─── Shared step fixtures ────────────────────────────────────────────────────

const passedWanStep: DiagnosticStep = {
  id: 'wan',
  name: 'WAN Interface',
  description: 'Checking if your internet connection is physically connected',
  status: 'passed',
  result: {
    success: true,
    message: 'Your WAN port is connected and working',
    executionTimeMs: 310,
  },
};

const passedGatewayStep: DiagnosticStep = {
  id: 'gateway',
  name: 'Gateway Connection',
  description: "Testing connection to your internet provider's equipment",
  status: 'passed',
  result: {
    success: true,
    message: "Successfully connected to your internet provider's gateway",
    executionTimeMs: 480,
  },
};

const passedInternetStep: DiagnosticStep = {
  id: 'internet',
  name: 'Internet Access',
  description: 'Testing if you can reach the internet',
  status: 'passed',
  result: {
    success: true,
    message: 'Internet connection is working',
    executionTimeMs: 620,
  },
};

const passedDnsStep: DiagnosticStep = {
  id: 'dns',
  name: 'DNS Resolution',
  description: 'Testing if websites can be found by name',
  status: 'passed',
  result: {
    success: true,
    message: 'DNS is working correctly - websites can be found',
    executionTimeMs: 290,
  },
};

const passedNatStep: DiagnosticStep = {
  id: 'nat',
  name: 'Network Address Translation',
  description: 'Checking if your devices can share the internet connection',
  status: 'passed',
  result: {
    success: true,
    message: 'NAT is configured correctly',
    executionTimeMs: 150,
  },
};

const failedDnsStep: DiagnosticStep = {
  id: 'dns',
  name: 'DNS Resolution',
  description: 'Testing if websites can be found by name',
  status: 'failed',
  result: {
    success: false,
    message: 'Cannot look up website addresses. Your DNS server may be down.',
    issueCode: 'DNS_FAILED',
    executionTimeMs: 5032,
  },
  fix: {
    issueCode: 'DNS_FAILED',
    title: 'Switch to Cloudflare DNS',
    description:
      "Your current DNS server isn't working. Cloudflare DNS (1.1.1.1) is fast, free, and reliable.",
    command: '/ip dns set servers=1.1.1.1,8.8.8.8',
    confidence: 'high',
    requiresConfirmation: false,
    isManualFix: false,
  },
};

const failedNatStep: DiagnosticStep = {
  id: 'nat',
  name: 'Network Address Translation',
  description: 'Checking if your devices can share the internet connection',
  status: 'failed',
  result: {
    success: false,
    message: 'NAT is not configured. This prevents your devices from accessing the internet.',
    issueCode: 'NAT_MISSING',
    executionTimeMs: 210,
  },
};

const skippedInternetStep: DiagnosticStep = {
  id: 'internet',
  name: 'Internet Access',
  description: 'Testing if you can reach the internet',
  status: 'skipped',
};

const skippedNatStep: DiagnosticStep = {
  id: 'nat',
  name: 'Network Address Translation',
  description: 'Checking if your devices can share the internet connection',
  status: 'skipped',
};

// ─── Summaries ───────────────────────────────────────────────────────────────

const allPassedSummary: DiagnosticSummary = {
  totalSteps: 5,
  passedSteps: 5,
  failedSteps: 0,
  skippedSteps: 0,
  appliedFixes: [],
  durationMs: 1850,
  finalStatus: 'all_passed',
};

const issuesResolvedSummary: DiagnosticSummary = {
  totalSteps: 5,
  passedSteps: 4,
  failedSteps: 0,
  skippedSteps: 1,
  appliedFixes: ['dns_switch_cloudflare', 'nat_masquerade_added'],
  durationMs: 47200,
  finalStatus: 'issues_resolved',
};

const issuesRemainingSummary: DiagnosticSummary = {
  totalSteps: 5,
  passedSteps: 3,
  failedSteps: 2,
  skippedSteps: 0,
  appliedFixes: [],
  durationMs: 28500,
  finalStatus: 'issues_remaining',
};

const contactIspSummary: DiagnosticSummary = {
  totalSteps: 5,
  passedSteps: 1,
  failedSteps: 1,
  skippedSteps: 3,
  appliedFixes: [],
  durationMs: 12000,
  finalStatus: 'contact_isp',
};

// ─── Stories ─────────────────────────────────────────────────────────────────

// Story: All Tests Passed
export const AllPassed: Story = {
  args: {
    summary: allPassedSummary,
    steps: [passedWanStep, passedGatewayStep, passedInternetStep, passedDnsStep, passedNatStep],
    onRestart: () => {},
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'All five diagnostic checks completed without errors. Shows a green check icon and "All tests passed" message. No applied-fixes section is rendered.',
      },
    },
  },
};

// Story: Issues Resolved via Auto-Fixes
export const IssuesResolved: Story = {
  args: {
    summary: issuesResolvedSummary,
    steps: [
      passedWanStep,
      passedGatewayStep,
      { ...failedDnsStep, status: 'passed', result: { success: true, message: 'DNS now working after fix', executionTimeMs: 310 } },
      passedNatStep,
      skippedInternetStep,
    ],
    onRestart: () => {},
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Some steps initially failed, but automated fixes resolved them. Shows a green check icon and lists each applied fix in the "Applied Fixes" section.',
      },
    },
  },
};

// Story: Issues Remaining (No Fixes Applied)
export const IssuesRemaining: Story = {
  args: {
    summary: issuesRemainingSummary,
    steps: [passedWanStep, passedGatewayStep, passedInternetStep, failedDnsStep, failedNatStep],
    onRestart: () => {},
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Two steps failed and no fixes were applied or accepted. Shows a red X icon and a message indicating unresolved issues.',
      },
    },
  },
};

// Story: Contact ISP Recommended
export const ContactISP: Story = {
  args: {
    summary: contactIspSummary,
    steps: [
      passedWanStep,
      {
        id: 'gateway',
        name: 'Gateway Connection',
        description: "Testing connection to your internet provider's equipment",
        status: 'failed',
        result: {
          success: false,
          message: "Cannot reach your internet provider's gateway.",
          issueCode: 'GATEWAY_UNREACHABLE',
          executionTimeMs: 10200,
        },
      },
      skippedInternetStep,
      { ...skippedNatStep, id: 'dns', name: 'DNS Resolution' },
      skippedNatStep,
    ],
    onRestart: () => {},
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'The gateway check failed, indicating the problem is upstream with the ISP. Shows a warning triangle icon and advises the user to contact their provider.',
      },
    },
  },
};

// Story: Long Run Duration (minutes display)
export const LongDuration: Story = {
  args: {
    summary: {
      ...issuesRemainingSummary,
      durationMs: 185000, // 3 minutes 5 seconds
    },
    steps: [passedWanStep, passedGatewayStep, passedInternetStep, failedDnsStep, failedNatStep],
    onRestart: () => {},
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Duration display switches from seconds to "Xm Ys" format when the run exceeds 60 seconds.',
      },
    },
  },
};

// Story: Single Fix Applied
export const SingleFixApplied: Story = {
  args: {
    summary: {
      totalSteps: 5,
      passedSteps: 5,
      failedSteps: 0,
      skippedSteps: 0,
      appliedFixes: ['wan_interface_enabled'],
      durationMs: 23400,
      finalStatus: 'issues_resolved',
    },
    steps: [
      {
        ...passedWanStep,
        result: { success: true, message: 'WAN interface enabled successfully', executionTimeMs: 800 },
      },
      passedGatewayStep,
      passedInternetStep,
      passedDnsStep,
      passedNatStep,
    ],
    onRestart: () => {},
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Exactly one fix was applied (WAN interface was re-enabled). The Applied Fixes card shows a single item, and underscores are converted to spaces for readability.',
      },
    },
  },
};
