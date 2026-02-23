/**
 * Storybook stories for QuotaSettingsForm
 *
 * Form for configuring traffic quota on a service instance.
 * Uses React Hook Form + Zod validation.
 * Fields: period (daily/weekly/monthly), limit (GB), warning threshold (%), action.
 */
import { QuotaSettingsForm } from './QuotaSettingsForm';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof QuotaSettingsForm>;
export default meta;
type Story = StoryObj<typeof QuotaSettingsForm>;
/**
 * New quota setup — no existing quota.
 * Form shows defaults: Monthly, 100 GB, 80% warning, Alert action.
 * Only the "Set Quota" button appears (no Remove Quota).
 */
export declare const NewQuota: Story;
/**
 * Editing an existing monthly quota at 80% usage.
 * Pre-populated from currentQuota. Shows "Update Quota" + "Remove Quota" buttons.
 */
export declare const EditMonthlyQuota: Story;
/**
 * An exceeded quota (STOP_SERVICE action, weekly period).
 * Shows the Remove Quota button prominently. Form pre-fills with exceeded values.
 */
export declare const ExceededQuota: Story;
/**
 * Daily quota with a conservative LOG_ONLY action.
 * Tests that daily period selection and log-only action display correctly.
 */
export declare const DailyLogOnly: Story;
/**
 * Monthly quota with THROTTLE action.
 * Demonstrates the throttle enforcement option pre-selected.
 */
export declare const ThrottleAction: Story;
/**
 * Form with additional className applied for custom width/margin in a parent layout.
 */
export declare const WithCustomClass: Story;
//# sourceMappingURL=QuotaSettingsForm.stories.d.ts.map