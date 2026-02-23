/**
 * StorageDisconnectBanner Component
 * @description Persistent alert banner displayed when configured external storage disconnects.
 * Shows affected services and prompts user to reconnect the device.
 *
 * @features
 * - Prominent destructive styling for critical state
 * - Lists affected services with truncation at 5 items
 * - Dismissible with persistent warning until reconnection
 * - ARIA live region for screen reader announcements
 * - Auto-resets when storage reconnects
 *
 * @see NAS-8.20: External Storage Management
 * @see Docs/design/COMPREHENSIVE_COMPONENT_CHECKLIST.md - section 7 (Accessibility)
 */
import * as React from 'react';
/**
 * StorageDisconnectBanner component props
 */
export interface StorageDisconnectBannerProps {
    /** Optional CSS class name for custom styling */
    className?: string;
    /** Optional callback fired when banner is dismissed by user */
    onDismiss?: () => void;
}
/**
 * StorageDisconnectBanner component
 * @description Shows persistent warning when configured external storage becomes unavailable
 * @param {StorageDisconnectBannerProps} props - Component props
 * @returns {React.ReactNode | null} Rendered alert or null if dismissed/connected
 */
declare function StorageDisconnectBannerComponent({ className, onDismiss, }: StorageDisconnectBannerProps): import("react/jsx-runtime").JSX.Element | null;
/**
 * Exported StorageDisconnectBanner with React.memo() optimization
 */
export declare const StorageDisconnectBanner: React.MemoExoticComponent<typeof StorageDisconnectBannerComponent>;
export {};
//# sourceMappingURL=StorageDisconnectBanner.d.ts.map