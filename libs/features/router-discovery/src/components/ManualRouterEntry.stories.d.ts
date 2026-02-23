import { ManualRouterEntry } from './ManualRouterEntry';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ManualRouterEntry>;
export default meta;
type Story = StoryObj<typeof ManualRouterEntry>;
/**
 * Default empty form — the user has not yet entered any data.
 */
export declare const Default: Story;
/**
 * With cancel button hidden — used when there is no previous step to return to.
 */
export declare const NoCancel: Story;
/**
 * Simulates a submit with just an IP address (no optional name).
 */
export declare const SubmitIpOnly: Story;
/**
 * Demonstrates the full submission with both IP and a friendly name.
 */
export declare const SubmitWithName: Story;
/**
 * Validation error state — trigger by leaving IP empty and clicking Add Router,
 * or by entering an invalid IP like "999.0.0.1".
 */
export declare const ValidationError: Story;
/**
 * Narrow mobile-width container — verifies layout at 375px (iPhone SE).
 */
export declare const MobileWidth: Story;
//# sourceMappingURL=ManualRouterEntry.stories.d.ts.map