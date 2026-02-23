/**
 * ConnectionTrackingSettingsMobile Component
 *
 * Mobile presenter for connection tracking settings form.
 * Accordion-based layout to reduce vertical space.
 */
import type { UseConnectionTrackingSettingsReturn } from './use-connection-tracking-settings';
export interface ConnectionTrackingSettingsMobileProps {
    /** Settings hook return value */
    settingsHook: UseConnectionTrackingSettingsReturn;
    /** Loading state */
    loading?: boolean;
    /** Container className */
    className?: string;
}
/**
 * Mobile presenter for ConnectionTrackingSettings
 *
 * Features:
 * - Accordion layout for grouped settings
 * - 44px minimum touch targets
 * - Full-width buttons
 * - Collapsible timeout sections
 */
export declare function ConnectionTrackingSettingsMobile({ settingsHook, loading, className, }: ConnectionTrackingSettingsMobileProps): import("react/jsx-runtime").JSX.Element;
export declare namespace ConnectionTrackingSettingsMobile {
    var displayName: string;
}
//# sourceMappingURL=ConnectionTrackingSettingsMobile.d.ts.map