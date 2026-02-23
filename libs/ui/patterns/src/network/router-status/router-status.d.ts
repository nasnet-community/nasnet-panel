/**
 * Router Status Component
 *
 * Auto-detecting wrapper that selects the appropriate presenter
 * based on viewport size or explicit override.
 *
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/network/router-status
 * @see NAS-4A.22: Build Router Status Component
 * @see Docs/architecture/adrs/018-headless-platform-presenters.md
 */
import type { RouterStatusProps } from './types';
/**
 * Router Status Component
 *
 * Displays real-time router connection status with platform-adaptive UI.
 * Auto-detects mobile vs desktop based on screen width.
 *
 * Features:
 * - Real-time GraphQL subscription updates
 * - Protocol and latency display
 * - Reconnection progress tracking
 * - Action menu (Refresh, Reconnect, Disconnect)
 * - ARIA live region for status change announcements
 * - Full keyboard navigation support
 * - Responsive: mobile badge vs desktop card
 *
 * @example
 * ```tsx
 * // Auto-detect platform
 * <RouterStatus routerId="router-1" />
 *
 * // Force mobile variant
 * <RouterStatus routerId="router-1" presenter="mobile" />
 *
 * // Force desktop variant
 * <RouterStatus routerId="router-1" presenter="desktop" />
 *
 * // Compact mode (always shows badge)
 * <RouterStatus routerId="router-1" compact />
 *
 * // With status change callback
 * <RouterStatus
 *   routerId="router-1"
 *   onStatusChange={(status) => console.log('Status:', status)}
 * />
 * ```
 */
declare function RouterStatusComponent({ routerId, compact, presenter: presenterOverride, className, onStatusChange, }: RouterStatusProps): import("react/jsx-runtime").JSX.Element;
export declare const RouterStatus: import("react").MemoExoticComponent<typeof RouterStatusComponent>;
export {};
//# sourceMappingURL=router-status.d.ts.map