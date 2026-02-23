/**
 * ConnectionTrackingSettingsDesktop Component
 *
 * Desktop presenter for connection tracking settings form.
 * Standard form layout with grouped timeout settings.
 */
import type { UseConnectionTrackingSettingsReturn } from './use-connection-tracking-settings';
export interface ConnectionTrackingSettingsDesktopProps {
    /** Settings hook return value */
    settingsHook: UseConnectionTrackingSettingsReturn;
    /** Loading state */
    loading?: boolean;
    /** Container className */
    className?: string;
}
/**
 * Desktop presenter for ConnectionTrackingSettings
 *
 * Features:
 * - Tabbed/grouped layout for timeout settings
 * - Real-time validation with Zod
 * - Dangerous level confirmation (orange) for disabling tracking
 * - Reset to defaults button
 */
export declare function ConnectionTrackingSettingsDesktop({ settingsHook, loading, className, }: ConnectionTrackingSettingsDesktopProps): import("react/jsx-runtime").JSX.Element;
export declare namespace ConnectionTrackingSettingsDesktop {
    var displayName: string;
}
//# sourceMappingURL=ConnectionTrackingSettingsDesktop.d.ts.map