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
export declare const DEFAULT_ALERT_CONFIG: RateLimitAlertConfig;
/**
 * Rate Limit Alert Service Stub
 *
 * TODO: Replace with Epic 18 Notification Service when available.
 * This stub provides console logging and local storage tracking until
 * the full notification engine is implemented.
 */
export declare class RateLimitAlertService {
    private config;
    private lastAlertTimestamps;
    constructor(config?: Partial<RateLimitAlertConfig>);
    /**
     * Emit rate limit triggered event
     *
     * TODO: Epic 18 Integration Point #1
     * Replace console.warn with actual notification system call:
     * - notificationService.emit(event)
     * - Use Epic 18 severity mapping
     * - Integrate with notification preferences
     */
    emitRateLimitTriggered(event: RateLimitTriggeredEvent): void;
    /**
     * Emit IP whitelist event
     *
     * TODO: Epic 18 Integration Point #2
     * Add notification for whitelist actions if configured
     */
    emitIPWhitelisted(ip: string, timeout: string, routerId: string): void;
    /**
     * Emit bulk block event (for statistics dashboard)
     *
     * TODO: Epic 18 Integration Point #3
     * Aggregate multiple blocks into single notification
     */
    emitBulkBlockEvent(blockedCount: number, routerId: string, timeWindow: string): void;
    /**
     * Update alert configuration
     *
     * TODO: Epic 18 Integration Point #4
     * Sync with user notification preferences from Epic 18
     */
    updateConfig(config: Partial<RateLimitAlertConfig>): void;
    /**
     * Get current alert configuration
     */
    getConfig(): RateLimitAlertConfig;
    /**
     * Check if alert should be emitted based on cooldown period
     */
    private shouldEmitAlert;
    /**
     * Update last alert timestamp for cooldown tracking
     */
    private updateLastAlertTimestamp;
    /**
     * Format alert message for display
     */
    private formatAlertMessage;
}
/**
 * Get or create alert service instance
 */
export declare function getRateLimitAlertService(config?: Partial<RateLimitAlertConfig>): RateLimitAlertService;
/**
 * Reset alert service instance (for testing)
 */
export declare function resetRateLimitAlertService(): void;
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
//# sourceMappingURL=rate-limit-alert.stub.d.ts.map