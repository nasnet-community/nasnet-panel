/**
 * StepAnnouncer Storybook Stories
 * Visual documentation for the accessibility live-region component (NAS-5.11)
 */

import { StepAnnouncer } from './StepAnnouncer';

import type { DiagnosticStep } from '../../types/troubleshoot.types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof StepAnnouncer> = {
  title: 'Features/Diagnostics/StepAnnouncer',
  component: StepAnnouncer,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An invisible ARIA live-region (`role="status" aria-live="polite"`) that announces wizard progress to screen readers. The component is visually hidden (`sr-only`) — these stories use a wrapper to make the announcement text visible so it can be reviewed in Storybook. Announcements are generated based on step status, fix lifecycle state, and wizard completion.',
      },
    },
  },
  decorators: [
    (Story) => (
      // Wrapper removes sr-only so the text is visible in Storybook canvas
      <div className="bg-background w-full max-w-xl space-y-4 p-6">
        <div className="text-muted-foreground mb-2 text-sm italic">
          Note: This component is screen-reader-only in production. The announcement text is
          surfaced here for review.
        </div>
        <div className="[&_.sr-only]:clip-auto [&_.sr-only]:border-muted-foreground [&_.sr-only]:static [&_.sr-only]:h-auto [&_.sr-only]:w-auto [&_.sr-only]:overflow-visible [&_.sr-only]:rounded-md [&_.sr-only]:border [&_.sr-only]:border-dashed [&_.sr-only]:p-3 [&_.sr-only]:font-mono [&_.sr-only]:text-sm">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StepAnnouncer>;

// ─── Shared step fixtures ────────────────────────────────────────────────────

const runningStep: DiagnosticStep = {
  id: 'wan',
  name: 'WAN Interface',
  description: 'Checking if your internet connection is physically connected',
  status: 'running',
};

const passedStep: DiagnosticStep = {
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

const failedStep: DiagnosticStep = {
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

const pendingStep: DiagnosticStep = {
  id: 'nat',
  name: 'Network Address Translation',
  description: 'Checking if your devices can share the internet connection',
  status: 'pending',
};

// ─── Stories ─────────────────────────────────────────────────────────────────

// Story: Step Started (Running)
export const StepRunning: Story = {
  args: {
    currentStep: runningStep,
    currentStepIndex: 0,
    totalSteps: 5,
    isApplyingFix: false,
    isVerifying: false,
    isCompleted: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Announces "Step 1 of 5: WAN Interface. Checking if your internet connection is physically connected" when a step begins running.',
      },
    },
  },
};

// Story: Step Passed
export const StepPassed: Story = {
  args: {
    currentStep: passedStep,
    currentStepIndex: 1,
    totalSteps: 5,
    isApplyingFix: false,
    isVerifying: false,
    isCompleted: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Announces "Step 2 passed: Successfully connected to your internet provider\'s gateway" when a step completes successfully.',
      },
    },
  },
};

// Story: Step Failed
export const StepFailed: Story = {
  args: {
    currentStep: failedStep,
    currentStepIndex: 2,
    totalSteps: 5,
    isApplyingFix: false,
    isVerifying: false,
    isCompleted: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Announces "Step 3 failed: Cannot look up website addresses. Fix suggestion available." when a step fails.',
      },
    },
  },
};

// Story: Fix Being Applied
export const ApplyingFix: Story = {
  args: {
    currentStep: failedStep,
    currentStepIndex: 2,
    totalSteps: 5,
    isApplyingFix: true,
    isVerifying: false,
    isCompleted: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Announces "Applying fix: Switch to Cloudflare DNS" while the automated fix command is executing.',
      },
    },
  },
};

// Story: Verifying Fix
export const VerifyingFix: Story = {
  args: {
    currentStep: failedStep,
    currentStepIndex: 2,
    totalSteps: 5,
    isApplyingFix: false,
    isVerifying: true,
    isCompleted: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Announces "Fix applied. Verifying..." immediately after the fix command completes, while re-running the diagnostic check.',
      },
    },
  },
};

// Story: Wizard Completed
export const WizardCompleted: Story = {
  args: {
    currentStep: passedStep,
    currentStepIndex: 4,
    totalSteps: 5,
    isApplyingFix: false,
    isVerifying: false,
    isCompleted: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Announces "Troubleshooting complete. Check results below" when all steps have finished and the summary screen is shown.',
      },
    },
  },
};

// Story: Mid-Run on Pending Step (no announcement)
export const PendingStepNoAnnouncement: Story = {
  args: {
    currentStep: pendingStep,
    currentStepIndex: 3,
    totalSteps: 5,
    isApplyingFix: false,
    isVerifying: false,
    isCompleted: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When the current step status is "pending" and no flags are active, no announcement is generated. The live region stays silent until state changes.',
      },
    },
  },
};
