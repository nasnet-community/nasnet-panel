/**
 * InstallDialog stories
 *
 * NOTE: InstallDialog internally calls GraphQL hooks (useAvailableServices,
 * useInstallService, useInstallProgressSubscription). In Storybook these
 * hooks must be mocked via MSW or a decorator. The stories below demonstrate
 * the dialog's visual states using a thin wrapper that accepts pre-rendered
 * inner content so designers can review each step without a live backend.
 *
 * For full integration testing, point Storybook at the dev backend and ensure
 * the MSW worker is configured with service fixtures.
 */
import { InstallDialog } from './InstallDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof InstallDialog>;
export default meta;
type Story = StoryObj<typeof InstallDialog>;
/**
 * Dialog in its open state (Step 1: Select Service).
 * Requires mocked useAvailableServices to show the service list.
 */
export declare const Open: Story;
/**
 * Dialog is closed — nothing should be visible.
 */
export declare const Closed: Story;
/**
 * Open dialog for a different router context.
 */
export declare const DifferentRouter: Story;
/**
 * With a success callback registered — fired after Step 4 is dismissed.
 */
export declare const WithSuccessCallback: Story;
//# sourceMappingURL=InstallDialog.stories.d.ts.map