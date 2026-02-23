/**
 * Storybook stories for ImportTemplateDialog
 *
 * Demonstrates the multi-step import dialog: upload (drag-and-drop or file picker),
 * validating spinner, preview with validation results and warnings, importing spinner,
 * and success completion state.
 */

import { ImportTemplateDialog } from './ImportTemplateDialog';

import type { FirewallTemplate } from '../schemas/templateSchemas';
import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Mock Callbacks
// ============================================================================

/** Simulates a successful 1.2-second import */
const mockImportSuccess = async (template: FirewallTemplate): Promise<void> => {
  await new Promise<void>((resolve) => setTimeout(resolve, 1200));
  console.info('Template imported:', template.name);
};

/** Simulates a failed import (connection timeout) */
const mockImportFailure = async (_template: FirewallTemplate): Promise<void> => {
  await new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('Router connection timed out during import')), 1000)
  );
};

const existingNames = ['Basic Security', 'Home Network', 'Gaming Setup', 'IoT Isolation'];

const manyExistingNames = [
  'Basic Security',
  'Home Network',
  'Gaming Setup',
  'IoT Isolation',
  'Guest WiFi',
  'VPN Passthrough',
  'Anti-DDoS',
  'Parental Controls',
  'Office Subnet',
  'Remote Admin',
];

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof ImportTemplateDialog> = {
  title: 'Features/Firewall/ImportTemplateDialog',
  component: ImportTemplateDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Multi-step dialog for importing a firewall template from a JSON or YAML file. ' +
          'Step 1 (upload): drag-and-drop zone or file picker for .json/.yaml/.yml files. ' +
          'Step 2 (validating): spinner while the file is parsed and validated via Zod. ' +
          'Step 3 (preview): shows template metadata, validation errors/warnings, and variable list. ' +
          'Step 4 (importing): spinner during the async import callback. ' +
          'Step 5 (complete): success icon with auto-close after 1.5 s. ' +
          'Includes conflict detection when a template name matches an existing one.',
      },
    },
  },
  argTypes: {
    existingNames: {
      control: false,
      description: 'Existing template names used for conflict detection',
    },
    onImport: {
      action: 'onImport',
      description: 'Async callback called with the parsed FirewallTemplate when import is confirmed',
    },
    open: {
      control: 'boolean',
      description: 'Controlled open state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImportTemplateDialog>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default — dialog open on the upload step, no existing template names.
 */
export const Default: Story = {
  args: {
    existingNames: [],
    onImport: mockImportSuccess,
    open: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Initial upload step with an empty drag-and-drop zone. ' +
          'Supported formats (JSON, YAML) are listed below the drop zone.',
      },
    },
  },
};

/**
 * With existing names — triggers conflict detection when the uploaded
 * template has a matching name.
 */
export const WithExistingNames: Story = {
  args: {
    existingNames,
    onImport: mockImportSuccess,
    open: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When existing template names are provided and the uploaded template name collides, ' +
          'a warning is surfaced on the preview step: "A template named X already exists and will be replaced".',
      },
    },
  },
};

/**
 * Many existing names — a realistic fleet scenario with 10 templates already installed.
 */
export const ManyExistingNames: Story = {
  args: {
    existingNames: manyExistingNames,
    onImport: mockImportSuccess,
    open: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Upload step with 10 existing template names registered for conflict detection. ' +
          'Uploading a template whose name matches any of these will produce a conflict warning.',
      },
    },
  },
};

/**
 * Successful import flow — the onImport callback resolves after a short delay.
 */
export const WithSuccessfulImport: Story = {
  args: {
    existingNames,
    onImport: mockImportSuccess,
    open: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'After file upload and validation, clicking "Import Template" shows the importing spinner ' +
          'for ~1.2 s then transitions to the success state with a green CheckCircle2 icon. ' +
          'The dialog closes automatically after 1.5 s.',
      },
    },
  },
};

/**
 * Failing import — the callback rejects, surfacing a destructive Alert on the preview step.
 */
export const WithFailingImport: Story = {
  args: {
    existingNames,
    onImport: mockImportFailure,
    open: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'If the import callback rejects, the dialog returns to the preview step and displays ' +
          'a destructive Alert with the error message. The user can retry or cancel.',
      },
    },
  },
};

/**
 * Controlled closed state — dialog is kept closed by the parent.
 */
export const ControlledClosed: Story = {
  args: {
    existingNames: [],
    onImport: mockImportSuccess,
    open: false,
    onOpenChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Controlled mode with `open={false}`. The dialog content is not mounted; ' +
          'only the trigger slot (if provided) is visible.',
      },
    },
  },
};
