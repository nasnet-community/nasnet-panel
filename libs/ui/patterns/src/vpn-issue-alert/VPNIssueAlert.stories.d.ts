/**
 * VPNIssueAlert Storybook Stories
 *
 * Demonstrates the VPNIssueAlert pattern for displaying VPN connection
 * issues, warnings, and errors. Covers different severity levels and
 * dismissible states.
 *
 * @module @nasnet/ui/patterns/vpn-issue-alert
 */
import { VPNIssueAlert } from './VPNIssueAlert';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof VPNIssueAlert>;
export default meta;
type Story = StoryObj<typeof VPNIssueAlert>;
/**
 * A warning-level issue (orange alert).
 */
export declare const ConnectionWarning: Story;
/**
 * An error-level issue (red alert).
 */
export declare const ConnectionError: Story;
/**
 * Warning without dismiss handler (read-only view).
 */
export declare const ReadOnlyWarning: Story;
/**
 * IKEv2 authentication error.
 */
export declare const AuthenticationError: Story;
/**
 * Recently detected issue (just now).
 */
export declare const RecentIssue: Story;
/**
 * SSTP protocol issue.
 */
export declare const SSTPWarning: Story;
/**
 * Long error message (tests text wrapping).
 */
export declare const LongErrorMessage: Story;
//# sourceMappingURL=VPNIssueAlert.stories.d.ts.map