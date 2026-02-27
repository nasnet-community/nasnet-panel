/**
 * ValidationStage Stories
 *
 * Storybook stories for the ValidationStage component.
 * Demonstrates every status variant, expandable error/warning details,
 * connector lines, and all 7 stage types in the validation pipeline.
 *
 * @module @nasnet/ui/patterns/validation-progress
 */

import { useState } from 'react';

import { ValidationStage } from './ValidationStage';

import type { ValidationStageResult } from './types';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * ValidationStage
 *
 * Displays a single stage within the 7-stage configuration validation pipeline.
 * Each stage shows a status icon, stage label, description, duration, and an
 * optional expandable panel for errors and warnings.
 *
 * ## Status Variants
 *
 * | Status    | Icon         | Colour     | Behaviour |
 * |-----------|--------------|------------|-----------|
 * | `pending` | Circle       | Muted      | No timing shown |
 * | `running` | Loader (spin)| Primary    | No timing shown |
 * | `passed`  | CheckCircle  | Success    | Duration shown |
 * | `failed`  | XCircle      | Error      | Duration shown, expandable |
 * | `skipped` | SkipForward  | Muted      | No timing shown |
 *
 * ## Stage Types
 *
 * `schema` | `syntax` | `cross-resource` | `dependencies` | `network` | `platform` | `dry-run`
 *
 * ## Expand / Collapse
 *
 * Clicking the row toggles the error/warning detail panel. The button is
 * disabled (non-interactive) when there are no errors or warnings.
 */
const meta: Meta<typeof ValidationStage> = {
  title: 'Patterns/Forms/ValidationStage',
  component: ValidationStage,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Individual stage row within the 7-step validation pipeline. Displays status, label, description, duration, and an expandable error/warning detail panel.',
      },
    },
  },
  argTypes: {
    isExpanded: {
      control: 'boolean',
      description: 'Whether the error/warning detail panel is expanded',
    },
    showConnector: {
      control: 'boolean',
      description: 'Whether to render the vertical connector line to the next stage',
    },
    index: {
      control: { type: 'number', min: 0, max: 6 },
      description: 'Stage index used for animation stagger delay',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ValidationStage>;

/**
 * Pending
 *
 * Stage is queued but has not started yet. Circle icon with muted colour;
 * no duration is shown. The row is non-interactive (no expand toggle).
 */
export const Pending: Story = {
  args: {
    result: {
      stage: 'schema',
      status: 'pending',
      errors: [],
      warnings: [],
    },
    showConnector: false,
    index: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Pending state: stage is queued and waiting to start.',
      },
    },
  },
};

/**
 * Running
 *
 * Stage is actively executing. Animated spinning Loader icon in primary colour.
 * No duration is shown while in progress.
 */
export const Running: Story = {
  args: {
    result: {
      stage: 'network',
      status: 'running',
      errors: [],
      warnings: [],
    },
    showConnector: false,
    index: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Running state: animated spinner shows the stage is actively executing.',
      },
    },
  },
};

/**
 * Passed
 *
 * Stage completed without errors. Green CheckCircle icon and duration badge.
 * Row is non-interactive because there are no details to expand.
 */
export const Passed: Story = {
  args: {
    result: {
      stage: 'syntax',
      status: 'passed',
      errors: [],
      warnings: [],
      durationMs: 14,
    },
    showConnector: false,
    index: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Passed state: green icon and duration. The row has no expand toggle.',
      },
    },
  },
};

/**
 * Skipped
 *
 * Stage was intentionally bypassed (e.g., low-risk operation does not require
 * a dry-run). SkipForward icon in muted colour; no duration shown.
 */
export const Skipped: Story = {
  args: {
    result: {
      stage: 'dry-run',
      status: 'skipped',
      errors: [],
      warnings: [],
    },
    showConnector: false,
    index: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Skipped state: stage bypassed because it is not required for this operation risk level.',
      },
    },
  },
};

/**
 * Failed - Collapsed
 *
 * Stage failed with one error. The red XCircle icon and error count badge are
 * visible. The detail panel is collapsed; click to expand.
 */
export const FailedCollapsed: Story = {
  args: {
    result: {
      stage: 'cross-resource',
      status: 'failed',
      errors: [
        {
          code: 'IP_COLLISION',
          message: 'IP address 192.168.1.1 conflicts with existing interface bridge1',
          fieldPath: 'address',
          suggestedFix: 'Choose an address outside the 192.168.1.0/24 subnet',
        },
      ],
      warnings: [],
      durationMs: 42,
    },
    isExpanded: false,
    showConnector: false,
    index: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Failed stage with detail panel collapsed. The error count is shown; click the row to reveal the full error message.',
      },
    },
  },
};

/**
 * Failed - Expanded
 *
 * Same failure as above but with the detail panel open. Shows the full error
 * message, field path, and suggested fix in a highlighted error card.
 */
export const FailedExpanded: Story = {
  args: {
    result: {
      stage: 'cross-resource',
      status: 'failed',
      errors: [
        {
          code: 'IP_COLLISION',
          message: 'IP address 192.168.1.1 conflicts with existing interface bridge1',
          fieldPath: 'address',
          suggestedFix: 'Choose an address outside the 192.168.1.0/24 subnet',
        },
      ],
      warnings: [],
      durationMs: 42,
    },
    isExpanded: true,
    showConnector: false,
    index: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Failed stage with detail panel open. Full error message, field path reference, and suggested fix are all visible.',
      },
    },
  },
};

/**
 * Passed with Warnings - Expanded
 *
 * Stage passed but produced non-blocking warnings. Yellow warning badge and
 * expandable detail panel shows the warning messages.
 */
export const PassedWithWarningsExpanded: Story = {
  args: {
    result: {
      stage: 'platform',
      status: 'passed',
      errors: [],
      warnings: [
        {
          code: 'DEPRECATED_OPTION',
          message: 'Option "legacy-ipsec" is deprecated and will be removed in RouterOS 8.0',
          fieldPath: 'ipsecPolicy',
        },
        {
          code: 'PERFORMANCE_NOTE',
          message: 'Enabling hardware acceleration is recommended for this traffic volume',
        },
      ],
      durationMs: 67,
    },
    isExpanded: true,
    showConnector: false,
    index: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Passed stage with two warnings expanded. Warnings do not block apply; they appear in amber colour.',
      },
    },
  },
};

/**
 * Multiple Errors - Expanded
 *
 * A dependencies stage failure with three distinct errors, simulating a case
 * where the router is missing required packages and firmware.
 */
export const MultipleErrorsExpanded: Story = {
  args: {
    result: {
      stage: 'dependencies',
      status: 'failed',
      errors: [
        {
          code: 'MISSING_PACKAGE',
          message: 'Package "wireguard-tools" is not installed on the router',
          suggestedFix: 'Install wireguard-tools via System > Packages',
        },
        {
          code: 'VERSION_MISMATCH',
          message: 'RouterOS 7.12 or later is required for WireGuard kernel support',
          fieldPath: 'routerOsVersion',
          suggestedFix: 'Upgrade RouterOS via System > Packages > Check for Updates',
        },
        {
          code: 'FEATURE_DISABLED',
          message: 'IPv6 is disabled on this router; dual-stack mode requires IPv6',
          fieldPath: 'ipv6Enabled',
        },
      ],
      warnings: [],
      durationMs: 88,
    },
    isExpanded: true,
    showConnector: false,
    index: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Three distinct errors from the dependencies stage shown together. Each error card has its own field path and suggested fix.',
      },
    },
  },
};

/**
 * Interactive Toggle
 *
 * Fully interactive story with local state so the expand/collapse toggle works
 * inside Storybook without requiring a parent container.
 */
export const InteractiveToggle: Story = {
  render: () => {
    const [expanded, setExpanded] = useState(false);

    const result: ValidationStageResult = {
      stage: 'network',
      status: 'failed',
      errors: [
        {
          code: 'PORT_IN_USE',
          message: 'Port 8080 is already allocated to the web-proxy service',
          fieldPath: 'listenPort',
          suggestedFix: 'Choose a different port or stop the web-proxy service first',
        },
      ],
      warnings: [
        {
          code: 'HIGH_PORT',
          message: 'Using a port above 1024 may require explicit firewall allow rules',
          fieldPath: 'listenPort',
        },
      ],
      durationMs: 31,
    };

    return (
      <div className="max-w-lg">
        <ValidationStage
          result={result}
          isExpanded={expanded}
          onToggle={() => setExpanded((prev) => !prev)}
          showConnector={false}
          index={0}
        />
        <p className="text-muted-foreground mt-4 text-sm">
          Click the row above to toggle the detail panel.
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fully interactive story demonstrating the expand/collapse toggle with both an error and a warning in the detail panel.',
      },
    },
  },
};
