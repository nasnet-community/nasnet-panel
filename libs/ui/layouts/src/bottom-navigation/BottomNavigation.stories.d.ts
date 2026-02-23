import { BottomNavigation } from './BottomNavigation';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof BottomNavigation>;
export default meta;
type Story = StoryObj<typeof BottomNavigation>;
/**
 * Default state with home active and 4 core navigation items
 */
export declare const Default: Story;
/**
 * Mobile viewport (375px) - typical phone size
 */
export declare const Mobile: Story;
/**
 * With notification badges showing different counts
 */
export declare const WithBadges: Story;
/**
 * Five navigation items (secondary item overflows)
 */
export declare const FiveItems: Story;
/**
 * Active VPN tab with badge
 */
export declare const VPNActive: Story;
/**
 * Interactive story with local state - tab changes on click
 */
export declare const Interactive: Story;
/**
 * With links instead of onClick handlers
 */
export declare const WithLinks: Story;
//# sourceMappingURL=BottomNavigation.stories.d.ts.map