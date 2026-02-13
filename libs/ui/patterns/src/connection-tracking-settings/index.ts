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

// Main component
export {
  ConnectionTrackingSettings,
  type ConnectionTrackingSettingsProps,
} from './ConnectionTrackingSettings';

// Headless hook
export {
  useConnectionTrackingSettings,
  type UseConnectionTrackingSettingsOptions,
  type UseConnectionTrackingSettingsReturn,
  type ConnectionTrackingSchema,
} from './use-connection-tracking-settings';

// Sub-components (exported for testing and custom layouts)
export { ConnectionTrackingSettingsDesktop } from './ConnectionTrackingSettingsDesktop';
export { ConnectionTrackingSettingsMobile } from './ConnectionTrackingSettingsMobile';

// Utilities
export {
  parseDuration,
  formatDuration,
  isValidDuration,
  getDurationOrDefault,
  parseOrDefault,
} from './timeout-utils';

// Types
export type {
  ConnectionTrackingSettings as ConnectionTrackingSettingsType,
  ConnectionTrackingTimeouts,
  ConnectionTrackingFormValues,
} from './types';
export { DEFAULT_TIMEOUTS, DEFAULT_SETTINGS } from './types';
