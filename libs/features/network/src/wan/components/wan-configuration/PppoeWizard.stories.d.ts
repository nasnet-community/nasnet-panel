/**
 * PPPoE Wizard Storybook Stories
 *
 * Interactive documentation and visual testing for the 5-step PPPoE WAN
 * configuration wizard. Each story shows the wizard in a different context.
 */
import { PppoeWizard } from './PppoeWizard';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof PppoeWizard>;
export default meta;
type Story = StoryObj<typeof PppoeWizard>;
/**
 * Default - wizard opened at step 1 (Interface selection).
 */
export declare const Default: Story;
/**
 * HomeISP - typical residential broadband PPPoE setup.
 */
export declare const HomeISP: Story;
/**
 * BusinessLine - enterprise ISP with custom service name and higher MTU.
 */
export declare const BusinessLine: Story;
/**
 * CancelFlow - demonstrates the Cancel button at every step.
 */
export declare const CancelFlow: Story;
/**
 * NoCallbacks - wizard without completion or cancel handlers (read-only demo).
 */
export declare const NoCallbacks: Story;
//# sourceMappingURL=PppoeWizard.stories.d.ts.map