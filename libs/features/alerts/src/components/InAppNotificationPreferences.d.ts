/**
 * InAppNotificationPreferences Component
 *
 * @description
 * Provides UI controls for configuring in-app notification preferences.
 * Per Task #6: Create preferences component for in-app notifications.
 * All changes are automatically saved to the Zustand store.
 *
 * Features:
 * - Enable/disable toggle for in-app notifications
 * - Severity filter (multi-select: CRITICAL, WARNING, INFO, ALL)
 * - Auto-dismiss timing (0 = never, 3s, 5s, 10s, 30s)
 * - Sound toggle
 * - Auto-save to Zustand store on change
 */
import * as React from 'react';
/**
 * Props for InAppNotificationPreferences component
 */
export interface InAppNotificationPreferencesProps {
    /**
     * Optional CSS class name
     */
    className?: string;
    /**
     * Optional callback when settings change
     */
    onSettingsChange?: () => void;
}
/**
 * InAppNotificationPreferences Component
 *
 * Provides UI controls for configuring in-app notification preferences.
 * All changes are automatically saved to the Zustand store.
 *
 * @example
 * ```tsx
 * <InAppNotificationPreferences />
 * ```
 */
declare function InAppNotificationPreferencesComponent({ className, onSettingsChange, }: InAppNotificationPreferencesProps): import("react/jsx-runtime").JSX.Element;
export declare const InAppNotificationPreferences: React.MemoExoticComponent<typeof InAppNotificationPreferencesComponent>;
export {};
//# sourceMappingURL=InAppNotificationPreferences.d.ts.map