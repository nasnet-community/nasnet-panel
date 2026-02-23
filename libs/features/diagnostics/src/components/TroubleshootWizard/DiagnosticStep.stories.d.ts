/**
 * DiagnosticStep Storybook Stories
 * Visual documentation for the diagnostic step component (NAS-5.11)
 */
import { DiagnosticStep } from './DiagnosticStep';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DiagnosticStep>;
export default meta;
type Story = StoryObj<typeof DiagnosticStep>;
export declare const Pending: Story;
export declare const Running: Story;
export declare const Passed: Story;
export declare const Failed: Story;
export declare const FailedWithFix: Story;
export declare const GatewayCheckRunning: Story;
export declare const InternetCheckPassed: Story;
export declare const DNSCheckFailed: Story;
export declare const NATCheckPassed: Story;
export declare const AllStates: Story;
//# sourceMappingURL=DiagnosticStep.stories.d.ts.map