/**
 * ConnectionTrackingSettings Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * const settingsHook = useConnectionTrackingSettings({
 *   initialSettings: currentSettings,
 *   onSubmit: async (settings) => {
 *     await updateSettingsMutation(settings);
 *   },
 * });
 *
 * <ConnectionTrackingSettings
 *   settingsHook={settingsHook}
 *   loading={isLoading}
 * />
 * ```
 */
import type { UseConnectionTrackingSettingsReturn } from './use-connection-tracking-settings';
export interface ConnectionTrackingSettingsProps {
    /** Settings hook return value */
    settingsHook: UseConnectionTrackingSettingsReturn;
    /** Loading state */
    loading?: boolean;
    /** Container className */
    className?: string;
}
/**
 * ConnectionTrackingSettings - Configure firewall connection tracking
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Accordion layout with 44px touch targets
 * - Tablet/Desktop (>=640px): Card-based grouped layout
 *
 * Features:
 * - React Hook Form + Zod validation
 * - Duration format support (1d, 12h, 30m, 45s)
 * - Dangerous confirmation when disabling tracking
 * - Reset to defaults with confirmation
 */
declare function ConnectionTrackingSettingsComponent(props: ConnectionTrackingSettingsProps): import("react/jsx-runtime").JSX.Element;
export declare const ConnectionTrackingSettings: import("react").MemoExoticComponent<typeof ConnectionTrackingSettingsComponent>;
export {};
//# sourceMappingURL=ConnectionTrackingSettings.d.ts.map