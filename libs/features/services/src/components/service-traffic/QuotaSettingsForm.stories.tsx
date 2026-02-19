/**
 * Storybook stories for QuotaSettingsForm
 *
 * Form for configuring traffic quota on a service instance.
 * Uses React Hook Form + Zod validation.
 * Fields: period (daily/weekly/monthly), limit (GB), warning threshold (%), action.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { QuotaSettingsForm } from './QuotaSettingsForm';
import type { TrafficQuota } from '@nasnet/api-client/generated';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

/** A quota set to 100 GB monthly with 80% warning, Alert action */
const mockQuotaMonthly: TrafficQuota = {
  id: 'quota-001',
  instanceID: 'xray-instance-abc123',
  period: 'MONTHLY',
  limitBytes: 107374182400,           // 100 GB
  consumedBytes: 85899345920,         // 80 GB (80% used)
  remainingBytes: 21474836480,        // 20 GB
  warningThreshold: 80,
  action: 'ALERT',
  limitReached: false,
  usagePercent: 80,
  warningTriggered: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-07-15T12:00:00Z',
  periodStartedAt: '2024-07-01T00:00:00Z',
  periodEndsAt: '2024-07-31T23:59:59Z',
};

/** A quota that has been exceeded — limit reached, action is STOP_SERVICE */
const mockQuotaExceeded: TrafficQuota = {
  id: 'quota-002',
  instanceID: 'tor-instance-xyz789',
  period: 'WEEKLY',
  limitBytes: 10737418240,            // 10 GB
  consumedBytes: 11811160064,         // ~11 GB — over limit
  remainingBytes: 0,
  warningThreshold: 75,
  action: 'STOP_SERVICE',
  limitReached: true,
  usagePercent: 110,
  warningTriggered: true,
  createdAt: '2024-02-01T00:00:00Z',
  updatedAt: '2024-07-16T08:00:00Z',
  periodStartedAt: '2024-07-15T00:00:00Z',
  periodEndsAt: '2024-07-21T23:59:59Z',
};

/** A conservative daily quota with LOG_ONLY action */
const mockQuotaDaily: TrafficQuota = {
  id: 'quota-003',
  instanceID: 'adguard-instance-001',
  period: 'DAILY',
  limitBytes: 5368709120,             // 5 GB
  consumedBytes: 1073741824,          // 1 GB (20% used)
  remainingBytes: 4294967296,         // 4 GB
  warningThreshold: 90,
  action: 'LOG_ONLY',
  limitReached: false,
  usagePercent: 20,
  warningTriggered: false,
  createdAt: '2024-03-01T00:00:00Z',
  updatedAt: '2024-07-16T06:00:00Z',
  periodStartedAt: '2024-07-16T00:00:00Z',
  periodEndsAt: '2024-07-16T23:59:59Z',
};

/** A throttle-action quota at 50 GB/month with 60% warning */
const mockQuotaThrottle: TrafficQuota = {
  id: 'quota-004',
  instanceID: 'singbox-instance-001',
  period: 'MONTHLY',
  limitBytes: 53687091200,            // 50 GB
  consumedBytes: 32212254720,         // 30 GB (60% used)
  remainingBytes: 21474836480,        // 20 GB
  warningThreshold: 60,
  action: 'THROTTLE',
  limitReached: false,
  usagePercent: 60,
  warningTriggered: true,
  createdAt: '2024-04-01T00:00:00Z',
  updatedAt: '2024-07-15T18:00:00Z',
  periodStartedAt: '2024-07-01T00:00:00Z',
  periodEndsAt: '2024-07-31T23:59:59Z',
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof QuotaSettingsForm> = {
  title: 'Features/Services/Traffic/QuotaSettingsForm',
  component: QuotaSettingsForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Form for configuring traffic quota on a service instance. ' +
          'Supports daily, weekly, and monthly periods with configurable GB limits, ' +
          'warning thresholds, and enforcement actions (Log Only, Alert, Stop Service, Throttle). ' +
          'Uses React Hook Form + Zod for validation. ' +
          'When `currentQuota` is provided, the form pre-populates and a "Remove Quota" button appears.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    routerID: 'router-main-01',
    instanceID: 'xray-instance-abc123',
    onSuccess: fn(),
    onError: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof QuotaSettingsForm>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * New quota setup — no existing quota.
 * Form shows defaults: Monthly, 100 GB, 80% warning, Alert action.
 * Only the "Set Quota" button appears (no Remove Quota).
 */
export const NewQuota: Story = {
  name: 'New Quota (No Existing)',
  args: {
    currentQuota: null,
  },
};

/**
 * Editing an existing monthly quota at 80% usage.
 * Pre-populated from currentQuota. Shows "Update Quota" + "Remove Quota" buttons.
 */
export const EditMonthlyQuota: Story = {
  name: 'Edit Monthly Quota (80% used)',
  args: {
    currentQuota: mockQuotaMonthly,
  },
};

/**
 * An exceeded quota (STOP_SERVICE action, weekly period).
 * Shows the Remove Quota button prominently. Form pre-fills with exceeded values.
 */
export const ExceededQuota: Story = {
  name: 'Exceeded Quota (Stop Service)',
  args: {
    instanceID: 'tor-instance-xyz789',
    currentQuota: mockQuotaExceeded,
  },
};

/**
 * Daily quota with a conservative LOG_ONLY action.
 * Tests that daily period selection and log-only action display correctly.
 */
export const DailyLogOnly: Story = {
  name: 'Daily Quota (Log Only)',
  args: {
    instanceID: 'adguard-instance-001',
    currentQuota: mockQuotaDaily,
  },
};

/**
 * Monthly quota with THROTTLE action.
 * Demonstrates the throttle enforcement option pre-selected.
 */
export const ThrottleAction: Story = {
  name: 'Throttle Action',
  args: {
    instanceID: 'singbox-instance-001',
    currentQuota: mockQuotaThrottle,
  },
};

/**
 * Form with additional className applied for custom width/margin in a parent layout.
 */
export const WithCustomClass: Story = {
  name: 'Custom Class (Full Width)',
  args: {
    currentQuota: mockQuotaMonthly,
    className: 'w-full',
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-4">
        <Story />
      </div>
    ),
  ],
};
