/**
 * Storybook stories for PortForwardWizardDialog
 *
 * Demonstrates the 3-step wizard: External Settings → Internal Settings → Review & Confirm,
 * with SafetyConfirmation on the final step before the rule is created.
 */
import { PortForwardWizardDialog } from './PortForwardWizardDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof PortForwardWizardDialog>;
export default meta;
type Story = StoryObj<typeof PortForwardWizardDialog>;
export declare const Default: Story;
export declare const SingleWanInterface: Story;
export declare const ManyWanInterfaces: Story;
export declare const DifferentRouterIp: Story;
export declare const WithSuccessCallback: Story;
//# sourceMappingURL=PortForwardWizardDialog.stories.d.ts.map