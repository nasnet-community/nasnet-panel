/**
 * Storybook stories for SaveTemplateDialog
 *
 * Demonstrates the dialog for saving current firewall rules as a reusable template.
 * Covers: empty rule set, rules with detectable variables (IP, subnet, interface, port),
 * name-conflict validation, saving state, and controlled open/close mode.
 */

import type { Meta, StoryObj } from '@storybook/react';
import type { TemplateRule } from '../schemas/templateSchemas';
import { SaveTemplateDialog } from './SaveTemplateDialog';

// ============================================================================
// Mock Data
// ============================================================================

/** Minimal rule set with no extractable variables */
const simpleRules: TemplateRule[] = [
  {
    id: 'rule-1',
    chain: 'forward',
    action: 'drop',
    properties: {
      comment: 'Drop invalid traffic',
      connectionState: 'invalid',
    },
  },
  {
    id: 'rule-2',
    chain: 'input',
    action: 'accept',
    properties: {
      comment: 'Accept established connections',
      connectionState: 'established,related',
    },
  },
];

/** Rules that expose IP address, subnet, interface, and port variables */
const richRules: TemplateRule[] = [
  {
    id: 'rule-nat-1',
    chain: 'srcnat',
    action: 'masquerade',
    properties: {
      outInterface: 'ether1',
      srcAddress: '192.168.88.0/24',
      comment: 'LAN masquerade',
    },
  },
  {
    id: 'rule-fwd-1',
    chain: 'forward',
    action: 'accept',
    properties: {
      inInterface: 'bridge1',
      srcAddress: '192.168.88.1',
      dstPort: '443',
      protocol: 'tcp',
      comment: 'Allow HTTPS from LAN',
    },
  },
  {
    id: 'rule-fwd-2',
    chain: 'forward',
    action: 'drop',
    properties: {
      outInterface: 'ether1',
      comment: 'Block WAN forwarding by default',
    },
  },
];

/** Single rule — edge-case for singular label */
const singleRule: TemplateRule[] = [
  {
    id: 'rule-only',
    chain: 'input',
    action: 'drop',
    properties: {
      srcAddress: '10.0.0.50',
      comment: 'Block specific host',
    },
  },
];

/** Simulates a successful async save */
const mockSaveSuccess = async (template: unknown): Promise<void> => {
  await new Promise<void>((resolve) => setTimeout(resolve, 1000));
  console.info('Template saved:', template);
};

/** Simulates a failed save (e.g., persistence error) */
const mockSaveFailure = async (_template: unknown): Promise<void> => {
  await new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('Failed to write template to disk')), 800)
  );
};

const existingTemplateNames = ['Basic Security', 'Home Network', 'Gaming Setup'];

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof SaveTemplateDialog> = {
  title: 'Features/Firewall/SaveTemplateDialog',
  component: SaveTemplateDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dialog for persisting the current set of firewall rules as a named, versioned template. ' +
          'Automatically analyses rule properties to suggest parameterisable variables (IP address, ' +
          'subnet, interface, port). Supports controlled and uncontrolled open state, name uniqueness ' +
          'validation against existing templates, category/complexity classification, and semver versioning.',
      },
    },
  },
  argTypes: {
    rules: {
      control: false,
      description: 'Array of TemplateRule objects to include in the saved template',
    },
    existingNames: {
      control: false,
      description: 'Existing template names used for uniqueness validation',
    },
    onSave: { action: 'onSave', description: 'Async callback invoked when the form is submitted' },
    open: {
      control: 'boolean',
      description: 'Controlled open state (omit for uncontrolled behaviour)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SaveTemplateDialog>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default — dialog triggered by a button, two simple rules, no existing names.
 */
export const Default: Story = {
  args: {
    rules: simpleRules,
    existingNames: [],
    onSave: mockSaveSuccess,
    open: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic dialog with two simple rules that do not yield any detectable template variables. ' +
          'The Variables section is hidden.',
      },
    },
  },
};

/**
 * Rules with rich variable candidates — IP, subnet, interface, and port are detected.
 */
export const WithVariableCandidates: Story = {
  args: {
    rules: richRules,
    existingNames: existingTemplateNames,
    onSave: mockSaveSuccess,
    open: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When rules contain IP addresses, subnets, interface names, or port numbers the component ' +
          'analyses them and surfaces a "Template Variables" section with checkboxes. ' +
          'Checked variables are parameterised in the saved template.',
      },
    },
  },
};

/**
 * Single rule — tests singular form of the dialog description ("1 firewall rule").
 */
export const SingleRule: Story = {
  args: {
    rules: singleRule,
    existingNames: [],
    onSave: mockSaveSuccess,
    open: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edge case: only one rule is being saved. The dialog description should read ' +
          '"1 firewall rule" (singular), not "1 firewall rules".',
      },
    },
  },
};

/**
 * Saving state — simulates the 1-second async save delay to show the spinner.
 */
export const SavingInProgress: Story = {
  args: {
    rules: simpleRules,
    existingNames: existingTemplateNames,
    onSave: mockSaveSuccess,
    open: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fill in a valid name and description then click Save to observe the loading spinner ' +
          'on the button while the async save is in progress.',
      },
    },
  },
};

/**
 * Save failure — the onSave callback rejects, triggering the destructive Alert.
 */
export const SaveFailure: Story = {
  args: {
    rules: richRules,
    existingNames: [],
    onSave: mockSaveFailure,
    open: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When the save callback throws, a destructive Alert with the error message is displayed ' +
          'below the form fields. The dialog stays open so the user can retry.',
      },
    },
  },
};

/**
 * Controlled closed state — dialog is closed by the parent, only the trigger renders.
 */
export const ControlledClosed: Story = {
  args: {
    rules: simpleRules,
    existingNames: [],
    onSave: mockSaveSuccess,
    open: false,
    onOpenChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Controlled mode with `open={false}`. The dialog content is not rendered; ' +
          'only the trigger slot (if provided) is visible.',
      },
    },
  },
};
