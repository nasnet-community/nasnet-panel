import { Avatar } from './avatar';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof Avatar>;
export declare const Default: Story;
export declare const WithFallback: Story;
export declare const FallbackOnly: Story;
export declare const RouterAdminAvatars: Story;
export declare const CustomSizes: Story;
export declare const AvatarGroup: Story;
/**
 * Mobile viewport story (375px) - Verifies component scales appropriately
 */
export declare const Mobile: Story;
/**
 * Tablet viewport story (768px) - Verifies component maintains proportions
 */
export declare const Tablet: Story;
/**
 * Desktop viewport story (1280px) - Full detail view
 */
export declare const Desktop: Story;
/**
 * Dark mode story - Verifies color tokens adapt correctly
 */
export declare const DarkMode: Story;
//# sourceMappingURL=avatar.stories.d.ts.map