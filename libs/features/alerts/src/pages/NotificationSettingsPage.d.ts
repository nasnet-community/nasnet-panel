/**
 * NotificationSettingsPage component
 * Per Task 6.1: Create NotificationSettingsPage for channel configuration
 * Per AC4: User can configure notification channels with test button
 * Per Task #7: Integrated QuietHoursConfig component for global quiet hours
 * Per NAS-18.3: Email form refactored to Platform Presenter pattern
 *
 * @description Page for managing notification channel configurations (Email, Telegram, Pushover, Webhook)
 * and global quiet hours settings. Provides test functionality for each channel.
 * Supports platform-aware rendering via presenter pattern.
 */
import React from 'react';
/**
 * Main Notification Settings Page
 * Per Task 6.2: Create channel configuration cards
 *
 * @description Main page component for notification channel and quiet hours configuration.
 * Implements tab-based UI for channel selection with test functionality.
 * Supports multiple notification backends: Email, Telegram, Pushover, Webhooks.
 */
declare function NotificationSettingsPageComponent(): import("react/jsx-runtime").JSX.Element;
declare namespace NotificationSettingsPageComponent {
    var displayName: string;
}
/**
 * Memoized notification settings page for preventing unnecessary re-renders.
 * @description Full page component managing notification channel configuration
 * and global quiet hours. Should be lazy-loaded as route and wrapped in Suspense.
 */
export declare const NotificationSettingsPage: React.MemoExoticComponent<typeof NotificationSettingsPageComponent>;
export {};
//# sourceMappingURL=NotificationSettingsPage.d.ts.map