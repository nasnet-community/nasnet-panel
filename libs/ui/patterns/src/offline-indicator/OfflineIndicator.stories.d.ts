/**
 * OfflineIndicator Stories
 *
 * Demonstrates the browser-level offline/online banner in all its variants.
 * Because the real component reacts to native `online`/`offline` browser events,
 * we use static mock wrappers so each state can be shown unconditionally in
 * Storybook without having to actually disconnect the browser.
 */
import type { Meta, StoryObj } from '@storybook/react';
interface MockBannerProps {
    /** Whether the network is currently offline */
    isOffline?: boolean;
    /** Position of the banner within the demo container */
    position?: 'top' | 'bottom';
    /** Whether a dismiss button is rendered */
    dismissible?: boolean;
    /** Custom offline message */
    offlineMessage?: string;
    /** Custom online message */
    onlineMessage?: string;
    /** Additional CSS classes */
    className?: string;
}
declare function MockOfflineBanner({ isOffline, position, dismissible, offlineMessage, onlineMessage, className, }: MockBannerProps): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof MockOfflineBanner>;
export default meta;
type Story = StoryObj<typeof MockOfflineBanner>;
/**
 * Default offline banner – appears at the top of the viewport with default messaging.
 */
export declare const Offline: Story;
/**
 * Back-online confirmation – shown briefly after the connection is restored.
 */
export declare const BackOnline: Story;
/**
 * Bottom-positioned banner – useful for apps with top navigation bars.
 */
export declare const BottomPosition: Story;
/**
 * Dismissible offline banner – adds a close button so users can hide the banner.
 */
export declare const Dismissible: Story;
/**
 * Custom messages – router-specific copy for a more contextual experience.
 */
export declare const CustomMessages: Story;
/**
 * Compact offline indicator – icon-only variant intended for headers and nav bars.
 */
export declare const Compact: Story;
/**
 * Side-by-side comparison of offline and back-online states.
 */
export declare const BothStates: Story;
//# sourceMappingURL=OfflineIndicator.stories.d.ts.map