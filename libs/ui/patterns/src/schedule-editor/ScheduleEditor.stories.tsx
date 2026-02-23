import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { ScheduleEditor } from './ScheduleEditor';

import type { ScheduleInput } from '@nasnet/core/types';

const meta: Meta<typeof ScheduleEditor> = {
  title: 'Patterns/ScheduleEditor',
  component: ScheduleEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Schedule editor dialog for creating and editing time-based device routing schedules. Supports day selection, time ranges, and timezone configuration.',
      },
    },
  },
  argTypes: {
    routingID: { control: 'text' },
    open: { control: 'boolean' },
    mode: { control: { type: 'select', options: ['create', 'edit'] } },
    isSaving: { control: 'boolean' },
    isDeleting: { control: 'boolean' },
    onClose: { action: 'close' },
    onSave: { action: 'save' },
    onDelete: { action: 'delete' },
  },
};

export default meta;
type Story = StoryObj<typeof ScheduleEditor>;

const mockSchedule: Partial<ScheduleInput> = {
  routingID: 'routing-001',
  days: [1, 2, 3, 4, 5],
  startTime: '09:00',
  endTime: '17:00',
  timezone: 'America/New_York',
  enabled: true,
};

export const CreateMode: Story = {
  name: 'Create Mode',
  args: {
    routingID: 'routing-001',
    open: true,
    mode: 'create',
    isSaving: false,
    isDeleting: false,
    onClose: fn(),
    onSave: fn(),
  },
};

export const EditMode: Story = {
  name: 'Edit Mode',
  args: {
    routingID: 'routing-001',
    open: true,
    mode: 'edit',
    initialSchedule: mockSchedule,
    isSaving: false,
    isDeleting: false,
    onClose: fn(),
    onSave: fn(),
    onDelete: fn(),
  },
};

export const Saving: Story = {
  name: 'Saving',
  args: {
    routingID: 'routing-001',
    open: true,
    mode: 'create',
    isSaving: true,
    isDeleting: false,
    onClose: fn(),
    onSave: fn(),
  },
};

export const Deleting: Story = {
  name: 'Deleting',
  args: {
    routingID: 'routing-001',
    open: true,
    mode: 'edit',
    initialSchedule: mockSchedule,
    isSaving: false,
    isDeleting: true,
    onClose: fn(),
    onSave: fn(),
    onDelete: fn(),
  },
};

export const WithTimezone: Story = {
  name: 'With Custom Timezone',
  args: {
    routingID: 'routing-002',
    open: true,
    mode: 'create',
    defaultTimezone: 'America/New_York',
    isSaving: false,
    isDeleting: false,
    onClose: fn(),
    onSave: fn(),
  },
};

export const Closed: Story = {
  name: 'Closed',
  args: {
    routingID: 'routing-003',
    open: false,
    mode: 'create',
    isSaving: false,
    isDeleting: false,
    onClose: fn(),
    onSave: fn(),
  },
};
