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
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Icon,
} from '@nasnet/ui/primitives';
import {
  useAlertNotificationStore,
  useNotificationSettings,
  type AlertSeverity,
} from '@nasnet/state/stores';

/**
 * Severity filter options
 */
const SEVERITY_OPTIONS = [
  { value: 'ALL', label: 'All Severities', description: 'Show all notifications' },
  { value: 'CRITICAL', label: 'Critical Only', description: 'Critical alerts only' },
  { value: 'WARNING', label: 'Warning+', description: 'Warning and Critical' },
  { value: 'INFO', label: 'Info+', description: 'Info, Warning, and Critical' },
] as const;

/**
 * Auto-dismiss timing options (milliseconds)
 */
const AUTO_DISMISS_OPTIONS = [
  { value: 0, label: 'Never', description: 'Manual dismiss only' },
  { value: 3000, label: '3 seconds', description: 'Quick auto-dismiss' },
  { value: 5000, label: '5 seconds', description: 'Default timing' },
  { value: 10000, label: '10 seconds', description: 'Extended display' },
  { value: 30000, label: '30 seconds', description: 'Long display' },
] as const;

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
function InAppNotificationPreferencesComponent({
  className,
  onSettingsChange,
}: InAppNotificationPreferencesProps) {
  const settings = useNotificationSettings();
  const updateSettings = useAlertNotificationStore((state) => state.updateSettings);

  // Handle enable/disable toggle
  const handleEnabledChange = React.useCallback(
    (enabled: boolean) => {
      updateSettings({ enabled });
      onSettingsChange?.();
    },
    [updateSettings, onSettingsChange]
  );

  // Handle sound toggle
  const handleSoundChange = React.useCallback(
    (soundEnabled: boolean) => {
      updateSettings({ soundEnabled });
      onSettingsChange?.();
    },
    [updateSettings, onSettingsChange]
  );

  // Handle severity filter change
  const handleSeverityFilterChange = React.useCallback(
    (value: string) => {
      updateSettings({ severityFilter: value as AlertSeverity | 'ALL' });
      onSettingsChange?.();
    },
    [updateSettings, onSettingsChange]
  );

  // Handle auto-dismiss timing change
  const handleAutoDismissChange = React.useCallback(
    (value: string) => {
      updateSettings({ autoDismissTiming: parseInt(value, 10) });
      onSettingsChange?.();
    },
    [updateSettings, onSettingsChange]
  );

  // Get current selections
  const selectedSeverity = settings.severityFilter;
  const selectedAutoDismiss = settings.autoDismissTiming.toString();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>In-App Notification Preferences</CardTitle>
        <CardDescription>Configure how notifications appear in the application</CardDescription>
      </CardHeader>

      <CardContent className="space-y-component-lg">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-component-md">
            <div className="gap-component-md flex items-center">
              <Icon
                icon={settings.enabled ? Bell : BellOff}
                size="sm"
                className={settings.enabled ? 'text-category-monitoring' : 'text-muted-foreground'}
                aria-hidden="true"
              />
              <Label
                htmlFor="notifications-enabled"
                className="font-medium"
              >
                Enable Notifications
              </Label>
            </div>
            <p className="text-muted-foreground text-sm">
              Show in-app notifications for alert events
            </p>
          </div>
          <Switch
            id="notifications-enabled"
            checked={settings.enabled}
            onCheckedChange={handleEnabledChange}
            aria-label="Enable or disable in-app notifications"
          />
        </div>

        {/* Conditional settings (only shown when enabled) */}
        {settings.enabled && (
          <>
            {/* Severity Filter */}
            <div className="space-y-component-sm">
              <Label
                htmlFor="severity-filter"
                className="font-medium"
              >
                Severity Filter
              </Label>
              <Select
                value={selectedSeverity}
                onValueChange={handleSeverityFilterChange}
              >
                <SelectTrigger
                  id="severity-filter"
                  className="w-full"
                >
                  <SelectValue placeholder="Select minimum severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-muted-foreground text-xs">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Only show notifications matching or exceeding this severity level
              </p>
            </div>

            {/* Auto-Dismiss Timing */}
            <div className="space-y-component-sm">
              <Label
                htmlFor="auto-dismiss"
                className="font-medium"
              >
                Auto-Dismiss Timing
              </Label>
              <Select
                value={selectedAutoDismiss}
                onValueChange={handleAutoDismissChange}
              >
                <SelectTrigger
                  id="auto-dismiss"
                  className="w-full"
                >
                  <SelectValue placeholder="Select auto-dismiss timing" />
                </SelectTrigger>
                <SelectContent>
                  {AUTO_DISMISS_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-muted-foreground text-xs">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                {settings.autoDismissTiming === 0 ?
                  'Notifications remain visible until manually dismissed'
                : `Notifications automatically close after ${settings.autoDismissTiming / 1000} seconds`
                }
              </p>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-component-md">
                <div className="gap-component-md flex items-center">
                  <Icon
                    icon={settings.soundEnabled ? Volume2 : VolumeX}
                    size="sm"
                    className={
                      settings.soundEnabled ? 'text-category-monitoring' : 'text-muted-foreground'
                    }
                    aria-hidden="true"
                  />
                  <Label
                    htmlFor="sound-enabled"
                    className="font-medium"
                  >
                    Notification Sound
                  </Label>
                </div>
                <p className="text-muted-foreground text-sm">
                  Play audio alert when notifications arrive
                </p>
              </div>
              <Switch
                id="sound-enabled"
                checked={settings.soundEnabled}
                onCheckedChange={handleSoundChange}
                aria-label="Enable or disable notification sound"
              />
            </div>
          </>
        )}

        {/* Help text when disabled */}
        {!settings.enabled && (
          <div className="p-component-lg bg-muted text-muted-foreground rounded-[var(--semantic-radius-card)] text-sm">
            <p>
              In-app notifications are currently disabled. Enable them to receive real-time alerts
              in the application.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const InAppNotificationPreferences = React.memo(InAppNotificationPreferencesComponent);
InAppNotificationPreferences.displayName = 'InAppNotificationPreferences';
