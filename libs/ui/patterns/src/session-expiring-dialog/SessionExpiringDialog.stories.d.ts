/**
 * SessionExpiringDialog Storybook Stories
 * Session timeout warnings with countdown and extension options
 */
import { SessionExpiringDialog } from './SessionExpiringDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof SessionExpiringDialog>;
export default meta;
type Story = StoryObj<typeof SessionExpiringDialog>;
/**
 * Default state - 5 minutes remaining (normal)
 */
export declare const Default: Story;
/**
 * 2 minutes remaining (urgent state - amber)
 */
export declare const Urgent: Story;
/**
 * 30 seconds remaining (critical state - red with pulse)
 */
export declare const Critical: Story;
/**
 * Without extend session option
 */
export declare const NoExtendOption: Story;
/**
 * Custom warning threshold (1 minute)
 */
export declare const CustomThreshold: Story;
/**
 * Manual presenter override - mobile layout
 */
export declare const MobileLayout: Story;
/**
 * Manual presenter override - desktop layout
 */
export declare const DesktopLayout: Story;
/**
 * Hook usage example
 */
export declare const HookUsage: Story;
//# sourceMappingURL=SessionExpiringDialog.stories.d.ts.map