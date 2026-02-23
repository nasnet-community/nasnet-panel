/**
 * AlertRuleForm Storybook Stories
 *
 * Covers create mode, edit mode, error state, and variant configurations
 * of the AlertRuleForm component.
 *
 * Note: This component calls useCreateAlertRule / useUpdateAlertRule which
 * use Apollo mutations. We wrap stories with MockedProvider and provide
 * no-op callbacks for onSuccess / onCancel.
 */
import { AlertRuleForm } from './AlertRuleForm';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AlertRuleForm>;
export default meta;
type Story = StoryObj<typeof AlertRuleForm>;
/**
 * Create mode — blank form ready for a new alert rule.
 */
export declare const CreateMode: Story;
/**
 * Pre-filled CPU alert — edit mode with existing rule data.
 */
export declare const EditMode: Story;
/**
 * VPN tunnel rule — warning severity with two conditions.
 */
export declare const VpnTunnelRule: Story;
/**
 * Multi-channel alert — Critical alert delivering across 3 notification channels.
 */
export declare const MultipleChannels: Story;
/**
 * Without cancel button — used in contexts where cancellation is handled externally.
 */
export declare const NoCancelButton: Story;
/**
 * Info severity — lower urgency alert for informational notifications.
 */
export declare const InfoSeverity: Story;
//# sourceMappingURL=AlertRuleForm.stories.d.ts.map