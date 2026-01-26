/**
 * React hook for log alerts
 * Epic 0.8: System Logs - Real-time Alerts/Notifications
 */

import * as React from 'react';
import { useToast } from '@nasnet/ui/primitives';
import type { LogEntry } from '@nasnet/core/types';
import {
  getLogAlertService,
  type AlertSettings,
  type AlertRule,
  type NotificationPreference,
} from './LogAlertService';

export interface UseLogAlertsReturn {
  /**
   * Current alert settings
   */
  settings: AlertSettings;
  /**
   * Whether alerts are enabled
   */
  isEnabled: boolean;
  /**
   * Enable/disable alerts
   */
  setEnabled: (enabled: boolean) => void;
  /**
   * Update notification preference
   */
  setNotificationPreference: (pref: NotificationPreference) => void;
  /**
   * Enable/disable sound
   */
  setSoundEnabled: (enabled: boolean) => void;
  /**
   * Add or update an alert rule
   */
  upsertRule: (rule: AlertRule) => void;
  /**
   * Remove an alert rule
   */
  removeRule: (ruleId: string) => void;
  /**
   * Toggle a rule's enabled state
   */
  toggleRule: (ruleId: string) => void;
  /**
   * Request browser notification permission
   */
  requestPermission: () => Promise<NotificationPermission>;
  /**
   * Current notification permission
   */
  notificationPermission: NotificationPermission;
  /**
   * Whether browser notifications are supported
   */
  isBrowserNotificationSupported: boolean;
  /**
   * Process logs for alerts (call when new logs arrive)
   */
  processLogs: (logs: LogEntry[]) => void;
}

/**
 * Hook for managing log alerts
 */
export function useLogAlerts(): UseLogAlertsReturn {
  const { toast } = useToast();
  const alertService = React.useMemo(() => getLogAlertService(), []);

  const [settings, setSettings] = React.useState<AlertSettings>(() =>
    alertService.getSettings()
  );
  const [notificationPermission, setNotificationPermission] =
    React.useState<NotificationPermission>(() =>
      alertService.getNotificationPermission()
    );

  // Set up toast handler
  React.useEffect(() => {
    alertService.setToastHandler((log, rule) => {
      const severityVariant: Record<string, 'default' | 'destructive'> = {
        debug: 'default',
        info: 'default',
        warning: 'default',
        error: 'destructive',
        critical: 'destructive',
      };

      toast({
        title: rule.name,
        description: `[${log.topic}] ${log.message}`,
        variant: severityVariant[log.severity] || 'default',
      });
    });
  }, [alertService, toast]);

  const refreshSettings = React.useCallback(() => {
    setSettings(alertService.getSettings());
  }, [alertService]);

  const setEnabled = React.useCallback(
    (enabled: boolean) => {
      alertService.updateSettings({ enabled });
      refreshSettings();
    },
    [alertService, refreshSettings]
  );

  const setNotificationPreference = React.useCallback(
    (notificationPreference: NotificationPreference) => {
      alertService.updateSettings({ notificationPreference });
      refreshSettings();
    },
    [alertService, refreshSettings]
  );

  const setSoundEnabled = React.useCallback(
    (soundEnabled: boolean) => {
      alertService.updateSettings({ soundEnabled });
      refreshSettings();
    },
    [alertService, refreshSettings]
  );

  const upsertRule = React.useCallback(
    (rule: AlertRule) => {
      alertService.upsertRule(rule);
      refreshSettings();
    },
    [alertService, refreshSettings]
  );

  const removeRule = React.useCallback(
    (ruleId: string) => {
      alertService.removeRule(ruleId);
      refreshSettings();
    },
    [alertService, refreshSettings]
  );

  const toggleRule = React.useCallback(
    (ruleId: string) => {
      const rule = settings.rules.find((r) => r.id === ruleId);
      if (rule) {
        alertService.upsertRule({ ...rule, enabled: !rule.enabled });
        refreshSettings();
      }
    },
    [alertService, settings.rules, refreshSettings]
  );

  const requestPermission = React.useCallback(async () => {
    const permission = await alertService.requestNotificationPermission();
    setNotificationPermission(permission);
    return permission;
  }, [alertService]);

  const processLogs = React.useCallback(
    (logs: LogEntry[]) => {
      alertService.processLogEntries(logs);
    },
    [alertService]
  );

  return {
    settings,
    isEnabled: settings.enabled,
    setEnabled,
    setNotificationPreference,
    setSoundEnabled,
    upsertRule,
    removeRule,
    toggleRule,
    requestPermission,
    notificationPermission,
    isBrowserNotificationSupported: alertService.isBrowserNotificationSupported(),
    processLogs,
  };
}



























