/**
 * NotificationBell Storybook Stories
 *
 * Visual testing for all platform presenters and states.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { NotificationBell } from './NotificationBell';
declare const meta: Meta<typeof NotificationBell>;
export default meta;
type Story = StoryObj<typeof NotificationBell>;
/**
 * Default state with unread notifications
 */
export declare const Default: Story;
/**
 * No notifications
 */
export declare const Empty: Story;
/**
 * High unread count (9+)
 */
export declare const HighUnreadCount: Story;
/**
 * Single unread notification
 */
export declare const SingleNotification: Story;
/**
 * Loading state
 */
export declare const Loading: Story;
/**
 * All read notifications
 */
export declare const AllRead: Story;
/**
 * Mixed severities
 */
export declare const MixedSeverities: Story;
/**
 * Desktop presenter (forced)
 */
export declare const DesktopPresenter: Story;
/**
 * Mobile presenter (forced)
 */
export declare const MobilePresenter: Story;
/**
 * Desktop - Empty state
 */
export declare const DesktopEmpty: Story;
/**
 * Desktop - Loading state
 */
export declare const DesktopLoading: Story;
/**
 * Mobile - Empty state
 */
export declare const MobileEmpty: Story;
/**
 * Mobile - Loading state
 */
export declare const MobileLoading: Story;
/**
 * Accessibility: High contrast mode
 */
export declare const HighContrast: Story;
/**
 * Keyboard Navigation Test
 */
export declare const KeyboardNavigation: Story;
//# sourceMappingURL=NotificationBell.stories.d.ts.map