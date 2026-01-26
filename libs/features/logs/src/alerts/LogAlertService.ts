/**
 * Log Alert Service
 * Manages real-time alerts and notifications for log entries
 * Epic 0.8: System Logs - Real-time Alerts/Notifications
 */

import type { LogEntry, LogTopic, LogSeverity } from '@nasnet/core/types';

/**
 * Notification preference
 */
export type NotificationPreference = 'browser' | 'toast' | 'both' | 'none';

/**
 * Alert rule configuration
 */
export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  topics: LogTopic[];
  severities: LogSeverity[];
  notificationType: NotificationPreference;
  soundEnabled: boolean;
  messagePattern?: string; // Optional regex pattern to match
}

/**
 * Alert settings
 */
export interface AlertSettings {
  enabled: boolean;
  notificationPreference: NotificationPreference;
  soundEnabled: boolean;
  rules: AlertRule[];
  rateLimitMs: number; // Rate limit per topic
}

const SETTINGS_KEY = 'nasnet-log-alert-settings';
const RATE_LIMIT_MS = 10000; // 10 seconds per topic

/**
 * Default alert settings
 */
const defaultSettings: AlertSettings = {
  enabled: false,
  notificationPreference: 'both',
  soundEnabled: false,
  rateLimitMs: RATE_LIMIT_MS,
  rules: [
    {
      id: 'critical-errors',
      name: 'Critical & Error Alerts',
      enabled: true,
      topics: [],
      severities: ['critical', 'error'],
      notificationType: 'both',
      soundEnabled: false,
    },
    {
      id: 'firewall-blocks',
      name: 'Firewall Blocks',
      enabled: false,
      topics: ['firewall'],
      severities: ['warning', 'error', 'critical'],
      notificationType: 'toast',
      soundEnabled: false,
    },
  ],
};

/**
 * Log Alert Service class
 */
export class LogAlertService {
  private settings: AlertSettings;
  private lastAlertTime: Map<string, number> = new Map();
  private notificationPermission: NotificationPermission = 'default';
  private toastHandler: ((log: LogEntry, rule: AlertRule) => void) | null = null;

  constructor() {
    this.settings = this.loadSettings();
    this.checkNotificationPermission();
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): AlertSettings {
    if (typeof window === 'undefined') return defaultSettings;

    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('[LogAlertService] Failed to load settings:', error);
    }
    return defaultSettings;
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('[LogAlertService] Failed to save settings:', error);
    }
  }

  /**
   * Check and update notification permission status
   */
  private async checkNotificationPermission(): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      this.notificationPermission = 'denied';
      return;
    }
    this.notificationPermission = Notification.permission;
  }

  /**
   * Request browser notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      this.notificationPermission = 'granted';
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      this.notificationPermission = 'denied';
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    this.notificationPermission = permission;
    return permission;
  }

  /**
   * Get current settings
   */
  getSettings(): AlertSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<AlertSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  /**
   * Add or update an alert rule
   */
  upsertRule(rule: AlertRule): void {
    const existingIndex = this.settings.rules.findIndex((r) => r.id === rule.id);
    if (existingIndex >= 0) {
      this.settings.rules[existingIndex] = rule;
    } else {
      this.settings.rules.push(rule);
    }
    this.saveSettings();
  }

  /**
   * Remove an alert rule
   */
  removeRule(ruleId: string): void {
    this.settings.rules = this.settings.rules.filter((r) => r.id !== ruleId);
    this.saveSettings();
  }

  /**
   * Set the toast handler for in-app notifications
   */
  setToastHandler(handler: (log: LogEntry, rule: AlertRule) => void): void {
    this.toastHandler = handler;
  }

  /**
   * Check if a log matches an alert rule
   */
  private matchesRule(log: LogEntry, rule: AlertRule): boolean {
    if (!rule.enabled) return false;

    // Check topic filter (empty = all topics)
    if (rule.topics.length > 0 && !rule.topics.includes(log.topic)) {
      return false;
    }

    // Check severity filter (empty = all severities)
    if (rule.severities.length > 0 && !rule.severities.includes(log.severity)) {
      return false;
    }

    // Check message pattern if specified
    if (rule.messagePattern) {
      try {
        const regex = new RegExp(rule.messagePattern, 'i');
        if (!regex.test(log.message)) {
          return false;
        }
      } catch {
        // Invalid regex, skip pattern check
      }
    }

    return true;
  }

  /**
   * Check rate limit for a topic
   */
  private isRateLimited(topic: string): boolean {
    const lastTime = this.lastAlertTime.get(topic);
    if (!lastTime) return false;

    return Date.now() - lastTime < this.settings.rateLimitMs;
  }

  /**
   * Update rate limit timestamp
   */
  private updateRateLimit(topic: string): void {
    this.lastAlertTime.set(topic, Date.now());
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(log: LogEntry, rule: AlertRule): void {
    if (this.notificationPermission !== 'granted') return;

    const severityEmoji: Record<LogSeverity, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    };

    const notification = new Notification(
      `${severityEmoji[log.severity]} ${rule.name}`,
      {
        body: `[${log.topic}] ${log.message}`,
        icon: '/favicon.ico',
        tag: `log-alert-${log.topic}`,
        requireInteraction: log.severity === 'critical',
      }
    );

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 5 seconds for non-critical
    if (log.severity !== 'critical') {
      setTimeout(() => notification.close(), 5000);
    }
  }

  /**
   * Show in-app toast notification
   */
  private showToastNotification(log: LogEntry, rule: AlertRule): void {
    if (this.toastHandler) {
      this.toastHandler(log, rule);
    }
  }

  /**
   * Play alert sound
   */
  private playAlertSound(): void {
    if (!this.settings.soundEnabled) return;

    try {
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 150);
    } catch (error) {
      console.error('[LogAlertService] Failed to play alert sound:', error);
    }
  }

  /**
   * Process a log entry and trigger alerts if rules match
   */
  processLogEntry(log: LogEntry): void {
    if (!this.settings.enabled) return;

    for (const rule of this.settings.rules) {
      if (!this.matchesRule(log, rule)) continue;

      // Check rate limit
      if (this.isRateLimited(log.topic)) continue;

      // Update rate limit
      this.updateRateLimit(log.topic);

      // Determine notification type
      const notificationType =
        rule.notificationType || this.settings.notificationPreference;

      // Show notifications based on preference
      if (notificationType === 'browser' || notificationType === 'both') {
        this.showBrowserNotification(log, rule);
      }

      if (notificationType === 'toast' || notificationType === 'both') {
        this.showToastNotification(log, rule);
      }

      // Play sound if enabled
      if (rule.soundEnabled || this.settings.soundEnabled) {
        this.playAlertSound();
      }

      // Only trigger one alert per log entry
      break;
    }
  }

  /**
   * Process multiple log entries (batch)
   */
  processLogEntries(logs: LogEntry[]): void {
    for (const log of logs) {
      this.processLogEntry(log);
    }
  }

  /**
   * Get notification permission status
   */
  getNotificationPermission(): NotificationPermission {
    return this.notificationPermission;
  }

  /**
   * Check if browser notifications are supported
   */
  isBrowserNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }
}

// Singleton instance
let alertServiceInstance: LogAlertService | null = null;

/**
 * Get the shared alert service instance
 */
export function getLogAlertService(): LogAlertService {
  if (!alertServiceInstance) {
    alertServiceInstance = new LogAlertService();
  }
  return alertServiceInstance;
}



























