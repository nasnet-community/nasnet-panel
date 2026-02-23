/**
 * Rate Limit Alert Service Stub
 *
 * IMPORTANT: This is a stub implementation for Epic 18 Alert integration.
 * Replace this with actual Epic 18 notification system when available.
 *
 * @description Provides alert notification for rate-limit triggered events. Console-based
 * logging in stub mode with cooldown tracking to prevent alert spam. Full integration with
 * Epic 18 notification system pending.
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-11-implement-connection-rate-limiting.md
 * @see Epic 18 - Notification & Alert Engine
 */

import type { RateLimitTriggeredEvent } from '@nasnet/core/types';

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_COOLDOWN_MINUTES = 5;
const MILLISECONDS_PER_MINUTE = 60 * 1000;

// ============================================
// TYPES
// ============================================

/**
 * Alert Severity Levels
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Rate Limit Alert Configuration
 */
export interface RateLimitAlertConfig {
  /** Whether alert service is enabled */
  enabled: boolean;
  /** Alert severity level (info|warning|critical) */
  severity: AlertSeverity;
  /** Emit alert when IP is blocked */
  notifyOnBlock: boolean;
  /** Emit alert when IP is whitelisted */
  notifyOnWhitelist: boolean;
  /** Minimum blocks before emitting alert */
  minBlocksBeforeAlert: number;
  /** Cooldown period in minutes between alerts for same rule */
  cooldownMinutes: number;
}

/**
 * Default alert configuration
 */
export const DEFAULT_ALERT_CONFIG: RateLimitAlertConfig = {
  enabled: false, // Disabled by default until Epic 18 is available
  severity: 'warning',
  notifyOnBlock: true,
  notifyOnWhitelist: false,
  minBlocksBeforeAlert: 1,
  cooldownMinutes: DEFAULT_COOLDOWN_MINUTES,
};

/**
 * Rate Limit Alert Service Stub
 *
 * TODO: Replace with Epic 18 Notification Service when available.
 * This stub provides console logging and local storage tracking until
 * the full notification engine is implemented.
 */
export class RateLimitAlertService {
  private config: RateLimitAlertConfig;
  private lastAlertTimestamps: Map<string, number> = new Map();

  constructor(config: Partial<RateLimitAlertConfig> = {}) {
    this.config = { ...DEFAULT_ALERT_CONFIG, ...config };
  }

  /**
   * Emit rate limit triggered event
   *
   * TODO: Epic 18 Integration Point #1
   * Replace console.warn with actual notification system call:
   * - notificationService.emit(event)
   * - Use Epic 18 severity mapping
   * - Integrate with notification preferences
   */
  emitRateLimitTriggered(event: RateLimitTriggeredEvent): void {
    if (!this.config.enabled) {
      return;
    }

    // Check cooldown period to prevent alert spam
    if (!this.shouldEmitAlert(event.ruleId)) {
      return;
    }

    // TODO: Replace with Epic 18 notification service
    // Example: await notificationService.create({
    //   type: 'rate-limit-triggered',
    //   severity: event.severity,
    //   title: `Rate Limit Triggered`,
    //   message: this.formatAlertMessage(event),
    //   metadata: event,
    // });

    // Stub implementation: console logging
    console.warn('[Rate Limit Alert]', {
      severity: event.severity,
      message: this.formatAlertMessage(event),
      timestamp: event.timestamp,
      blockedIP: event.blockedIP,
      rule: {
        id: event.ruleId,
        limit: event.connectionLimit,
        timeWindow: event.timeWindow,
        action: event.action,
      },
    });

    // Track last alert timestamp for cooldown
    this.updateLastAlertTimestamp(event.ruleId);
  }

  /**
   * Emit IP whitelist event
   *
   * TODO: Epic 18 Integration Point #2
   * Add notification for whitelist actions if configured
   */
  emitIPWhitelisted(ip: string, timeout: string, routerId: string): void {
    if (!this.config.enabled || !this.config.notifyOnWhitelist) {
      return;
    }

    // TODO: Replace with Epic 18 notification service
    console.info('[Rate Limit Alert] IP Whitelisted', {
      ip,
      timeout,
      routerId,
      timestamp: new Date(),
    });
  }

  /**
   * Emit bulk block event (for statistics dashboard)
   *
   * TODO: Epic 18 Integration Point #3
   * Aggregate multiple blocks into single notification
   */
  emitBulkBlockEvent(
    blockedCount: number,
    routerId: string,
    timeWindow: string
  ): void {
    if (!this.config.enabled) {
      return;
    }

    // TODO: Replace with Epic 18 notification service
    console.warn('[Rate Limit Alert] Bulk Block Event', {
      blockedCount,
      routerId,
      timeWindow,
      timestamp: new Date(),
    });
  }

  /**
   * Update alert configuration
   *
   * TODO: Epic 18 Integration Point #4
   * Sync with user notification preferences from Epic 18
   */
  updateConfig(config: Partial<RateLimitAlertConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current alert configuration
   */
  getConfig(): RateLimitAlertConfig {
    return { ...this.config };
  }

  /**
   * Check if alert should be emitted based on cooldown period
   */
  private shouldEmitAlert(ruleId: string): boolean {
    const lastAlert = this.lastAlertTimestamps.get(ruleId);
    if (!lastAlert) {
      return true;
    }

    const cooldownMs = this.config.cooldownMinutes * MILLISECONDS_PER_MINUTE;
    const timeSinceLastAlert = Date.now() - lastAlert;

    return timeSinceLastAlert >= cooldownMs;
  }

  /**
   * Update last alert timestamp for cooldown tracking
   */
  private updateLastAlertTimestamp(ruleId: string): void {
    this.lastAlertTimestamps.set(ruleId, Date.now());
  }

  /**
   * Format alert message for display
   */
  private formatAlertMessage(event: RateLimitTriggeredEvent): string {
    const ACTION_TEXT_MAP: Record<string, string> = {
      drop: 'dropped',
      tarpit: 'tarpitted',
      'add-to-list': `added to list '${event.addressList}'`,
    };

    const TIME_WINDOW_TEXT_MAP: Record<string, string> = {
      'per-second': 'per second',
      'per-minute': 'per minute',
      'per-hour': 'per hour',
    };

    const actionText = ACTION_TEXT_MAP[event.action] || 'processed';
    const timeWindowText = TIME_WINDOW_TEXT_MAP[event.timeWindow] || 'per minute';

    return `IP ${event.blockedIP} exceeded rate limit (${event.connectionLimit} connections ${timeWindowText}) and was ${actionText}.`;
  }
}

/**
 * Singleton instance for app-wide usage
 *
 * TODO: Epic 18 Integration Point #5
 * Replace with Epic 18 notification service dependency injection
 */
let alertServiceInstance: RateLimitAlertService | null = null;

/**
 * Get or create alert service instance
 */
export function getRateLimitAlertService(
  config?: Partial<RateLimitAlertConfig>
): RateLimitAlertService {
  if (!alertServiceInstance) {
    alertServiceInstance = new RateLimitAlertService(config);
  }
  return alertServiceInstance;
}

/**
 * Reset alert service instance (for testing)
 */
export function resetRateLimitAlertService(): void {
  alertServiceInstance = null;
}

// ============================================================================
// Epic 18 Integration Checklist
// ============================================================================

/**
 * TODO: When Epic 18 Notification & Alert Engine is available:
 *
 * 1. Import Epic 18 notification service:
 *    import { notificationService } from '@nasnet/notifications';
 *
 * 2. Replace RateLimitAlertService with Epic 18 adapter:
 *    - Use notificationService.create() instead of console.warn/info
 *    - Map severity levels to Epic 18 severity enum
 *    - Integrate with user notification preferences
 *    - Use Epic 18 notification channels (toast, email, webhook, etc.)
 *
 * 3. Update emitRateLimitTriggered():
 *    await notificationService.create({
 *      type: 'rate-limit-triggered',
 *      severity: event.severity,
 *      title: 'Rate Limit Triggered',
 *      message: this.formatAlertMessage(event),
 *      metadata: event,
 *      channels: ['toast', 'email'], // Based on user preferences
 *      routerId: event.routerId,
 *    });
 *
 * 4. Update emitIPWhitelisted():
 *    await notificationService.create({
 *      type: 'ip-whitelisted',
 *      severity: 'info',
 *      title: 'IP Whitelisted',
 *      message: `IP ${ip} has been whitelisted`,
 *      metadata: { ip, timeout, routerId },
 *      channels: ['toast'],
 *    });
 *
 * 5. Update emitBulkBlockEvent():
 *    await notificationService.create({
 *      type: 'bulk-block-event',
 *      severity: 'warning',
 *      title: `${blockedCount} IPs Blocked`,
 *      message: `Blocked ${blockedCount} IPs in ${timeWindow}`,
 *      metadata: { blockedCount, routerId, timeWindow },
 *      channels: ['toast'],
 *    });
 *
 * 6. Add rate limit alert settings to user preferences:
 *    - Enable/disable rate limit alerts
 *    - Configure alert channels (toast, email, webhook)
 *    - Set cooldown period
 *    - Configure minimum blocks before alert
 *
 * 7. Add Epic 18 notification types to schema:
 *    export const NotificationTypeSchema = z.enum([
 *      'rate-limit-triggered',
 *      'ip-whitelisted',
 *      'bulk-block-event',
 *      // ... other types
 *    ]);
 *
 * 8. Update tests to use Epic 18 mocks instead of stub
 */
