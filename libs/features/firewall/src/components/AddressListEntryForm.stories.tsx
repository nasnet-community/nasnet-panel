/**
 * Storybook stories for AddressListEntryForm
 *
 * Covers the full range of states: empty form, pre-filled list, loading,
 * and various address format modes (IP, CIDR, range).
 */

import { AddressListEntryForm } from './AddressListEntryForm';

import type { AddressListEntryFormData } from '../schemas/addressListSchemas';
import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Mock Helpers
// ============================================================================

const mockSubmit = async (data: AddressListEntryFormData): Promise<void> => {
  await new Promise<void>((resolve) => setTimeout(resolve, 800));
  console.info('Submitted:', data);
};

const mockSubmitError = async (_data: AddressListEntryFormData): Promise<void> => {
  await new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('Router returned an error: entry already exists')), 800)
  );
};

const existingLists = ['blocklist', 'allowlist', 'vpn-peers', 'temp-block'];

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof AddressListEntryForm> = {
  title: 'Features/Firewall/AddressListEntryForm',
  component: AddressListEntryForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Form for adding a single entry to a MikroTik firewall address list. ' +
          'Accepts an IP address, CIDR subnet, or IP range and auto-detects the format from input. ' +
          'Supports list name selection from existing lists or creation of a new list, ' +
          'an optional timeout duration, and an optional comment.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-background w-[480px] rounded-lg border p-6">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    existingLists: { control: false },
    isLoading: { control: 'boolean' },
    defaultList: { control: 'text' },
    onSubmit: { action: 'onSubmit' },
    onCancel: { action: 'onCancel' },
  },
};

export default meta;
type Story = StoryObj<typeof AddressListEntryForm>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  args: {
    existingLists,
    onSubmit: mockSubmit,
    onCancel: () => console.info('Cancelled'),
  },
};

export const NoExistingLists: Story = {
  args: {
    existingLists: [],
    onSubmit: mockSubmit,
    onCancel: () => console.info('Cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `existingLists` is empty the list name field renders as a plain text input rather than a dropdown.',
      },
    },
  },
};

export const WithDefaultList: Story = {
  args: {
    existingLists,
    defaultList: 'blocklist',
    onSubmit: mockSubmit,
    onCancel: () => console.info('Cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story: 'The `defaultList` prop pre-selects "blocklist" in the list dropdown on mount.',
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    existingLists,
    defaultList: 'blocklist',
    isLoading: true,
    onSubmit: mockSubmit,
    onCancel: () => console.info('Cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story: 'All inputs and buttons are disabled when `isLoading` is true.',
      },
    },
  },
};

export const WithoutCancelButton: Story = {
  args: {
    existingLists,
    onSubmit: mockSubmit,
    // onCancel intentionally omitted — Cancel button should not render
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `onCancel` is not provided the Cancel button is hidden and only the submit button is shown.',
      },
    },
  },
};

export const WithSubmissionError: Story = {
  args: {
    existingLists,
    defaultList: 'blocklist',
    onSubmit: mockSubmitError,
    onCancel: () => console.info('Cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Simulates a failed submission. Fill in valid values and submit to see the error propagate from the rejected promise.',
      },
    },
  },
};
