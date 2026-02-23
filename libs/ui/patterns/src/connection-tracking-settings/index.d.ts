/**
 * Connection Tracking Settings Pattern Component
 *
 * Headless + Platform Presenters pattern for configuring connection tracking.
 *
 * @example
 * ```tsx
 * import {
 *   useConnectionTrackingSettings,
 *   ConnectionTrackingSettings,
 * } from '@nasnet/ui/patterns';
 *
 * function SettingsPage() {
 *   const { data, isLoading } = useSettingsQuery();
 *
 *   const settingsHook = useConnectionTrackingSettings({
 *     initialSettings: data?.settings,
 *     onSubmit: async (settings) => {
 *       await updateMutation(settings);
 *     },
 *   });
 *
 *   return (
 *     <ConnectionTrackingSettings
 *       settingsHook={settingsHook}
 *       loading={isLoading}
 *     />
 *   );
 * }
 * ```
 */
export { ConnectionTrackingSettings, type ConnectionTrackingSettingsProps, } from './ConnectionTrackingSettings';
export { useConnectionTrackingSettings, type UseConnectionTrackingSettingsOptions, type UseConnectionTrackingSettingsReturn, type ConnectionTrackingSchema, } from './use-connection-tracking-settings';
export { ConnectionTrackingSettingsDesktop } from './ConnectionTrackingSettingsDesktop';
export { ConnectionTrackingSettingsMobile } from './ConnectionTrackingSettingsMobile';
export { parseDuration, formatDuration, isValidDuration, getDurationOrDefault, parseOrDefault, } from './timeout-utils';
export type { ConnectionTrackingSettings as ConnectionTrackingSettingsType, ConnectionTrackingFormValues, } from './types';
export { DEFAULT_SETTINGS } from './types';
//# sourceMappingURL=index.d.ts.map