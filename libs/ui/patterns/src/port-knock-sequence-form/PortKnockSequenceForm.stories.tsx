/**
 * Port Knock Sequence Form Stories
 * Form for creating and editing port knock sequences
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 9
 */

import type { PortKnockSequenceInput } from '@nasnet/core/types';

import { PortKnockSequenceForm } from './PortKnockSequenceForm';
import { usePortKnockSequenceForm } from './use-port-knock-sequence-form';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * Wrapper component to use the form hook
 */
function FormStoryWrapper({
  initialValues,
  isEditMode = false,
  isSubmitting = false,
}: {
  initialValues?: PortKnockSequenceInput;
  isEditMode?: boolean;
  isSubmitting?: boolean;
}) {
  const formState = usePortKnockSequenceForm({
    initialValues,
    onSubmit: async (data) => {
      console.log('Form submitted:', data);
      // Simulate async submission
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    isEditMode,
  });

  return (
    <PortKnockSequenceForm
      formState={formState}
      isEditMode={isEditMode}
      isSubmitting={isSubmitting}
    />
  );
}

const meta: Meta<typeof FormStoryWrapper> = {
  title: 'Patterns/Port Knocking/PortKnockSequenceForm',
  component: FormStoryWrapper,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Form for creating and editing port knock sequences. Follows the Headless + Platform Presenters pattern with automatic mobile/desktop detection.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isEditMode: {
      description: 'Whether the form is in edit mode',
      control: 'boolean',
    },
    isSubmitting: {
      description: 'Whether the form is currently submitting',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormStoryWrapper>;

/**
 * Create mode - Empty form for creating new sequence
 */
export const CreateMode: Story = {
  args: {
    isEditMode: false,
    isSubmitting: false,
  },
};

/**
 * Edit mode - Pre-filled form for editing existing sequence
 */
export const EditMode: Story = {
  args: {
    initialValues: {
      name: 'ssh-protection',
      knockPorts: [
        { port: 1234, protocol: 'tcp', order: 1 },
        { port: 5678, protocol: 'tcp', order: 2 },
        { port: 9012, protocol: 'tcp', order: 3 },
      ],
      protectedPort: 22,
      protectedProtocol: 'tcp',
      accessTimeout: '1h',
      knockTimeout: '10s',
      isEnabled: true,
    },
    isEditMode: true,
    isSubmitting: false,
  },
};

/**
 * With SSH lockout warning
 */
export const WithLockoutWarning: Story = {
  args: {
    initialValues: {
      name: 'ssh-strict',
      knockPorts: [
        { port: 7000, protocol: 'tcp', order: 1 },
        { port: 8000, protocol: 'tcp', order: 2 },
      ],
      protectedPort: 22,
      protectedProtocol: 'tcp',
      accessTimeout: '30m',
      knockTimeout: '5s',
      isEnabled: true,
    },
    isEditMode: false,
    isSubmitting: false,
  },
};

/**
 * Maximum knock ports (8)
 */
export const MaximumKnockPorts: Story = {
  args: {
    initialValues: {
      name: 'max-security',
      knockPorts: [
        { port: 1111, protocol: 'tcp', order: 1 },
        { port: 2222, protocol: 'tcp', order: 2 },
        { port: 3333, protocol: 'tcp', order: 3 },
        { port: 4444, protocol: 'tcp', order: 4 },
        { port: 5555, protocol: 'tcp', order: 5 },
        { port: 6666, protocol: 'tcp', order: 6 },
        { port: 7777, protocol: 'tcp', order: 7 },
        { port: 8888, protocol: 'tcp', order: 8 },
      ],
      protectedPort: 443,
      protectedProtocol: 'tcp',
      accessTimeout: '2h',
      knockTimeout: '15s',
      isEnabled: true,
    },
    isEditMode: false,
    isSubmitting: false,
  },
};

/**
 * Mixed TCP/UDP protocols
 */
export const MixedProtocols: Story = {
  args: {
    initialValues: {
      name: 'mixed-protocol-knock',
      knockPorts: [
        { port: 1234, protocol: 'tcp', order: 1 },
        { port: 5678, protocol: 'udp', order: 2 },
        { port: 9012, protocol: 'tcp', order: 3 },
      ],
      protectedPort: 80,
      protectedProtocol: 'tcp',
      accessTimeout: '1h',
      knockTimeout: '10s',
      isEnabled: true,
    },
    isEditMode: false,
    isSubmitting: false,
  },
};

/**
 * Submitting state
 */
export const Submitting: Story = {
  args: {
    initialValues: {
      name: 'rdp-protection',
      knockPorts: [
        { port: 1234, protocol: 'tcp', order: 1 },
        { port: 5678, protocol: 'tcp', order: 2 },
      ],
      protectedPort: 3389,
      protectedProtocol: 'tcp',
      accessTimeout: '1h',
      knockTimeout: '10s',
      isEnabled: true,
    },
    isEditMode: false,
    isSubmitting: true,
  },
};

/**
 * Mobile viewport
 */
export const Mobile: Story = {
  args: {
    initialValues: {
      name: 'web-server',
      knockPorts: [
        { port: 7000, protocol: 'tcp', order: 1 },
        { port: 8000, protocol: 'tcp', order: 2 },
        { port: 9000, protocol: 'tcp', order: 3 },
      ],
      protectedPort: 443,
      protectedProtocol: 'tcp',
      accessTimeout: '2h',
      knockTimeout: '10s',
      isEnabled: true,
    },
    isEditMode: false,
    isSubmitting: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
