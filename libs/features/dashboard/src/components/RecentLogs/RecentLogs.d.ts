/**
 * RecentLogs component - Dashboard widget for recent system logs
 * Displays 10 most recent logs with topic filtering and real-time updates
 * Story NAS-5.6: Recent Logs with Filtering
 *
 * @component
 * @see https://docs.nasnet.io/design/ux-design/6-component-library#recent-logs
 *
 * @example
 * <RecentLogs deviceId="router1" />
 *
 * @example
 * <RecentLogs deviceId="router1" className="col-span-2" />
 */
import React from 'react';
import type { RecentLogsProps } from './types';
/**
 * Recent logs dashboard widget component
 * Shows 10 most recent system logs with filtering and real-time updates via subscriptions
 *
 * @component
 * @param {RecentLogsProps} props - Component props
 * @param {string} props.deviceId - Router device ID or IP address
 * @param {string} [props.className] - Optional CSS classes for styling
 *
 * @returns {React.ReactElement} Rendered component
 *
 * Features:
 * - Real-time log streaming via GraphQL subscriptions
 * - Topic-based filtering with persistent preferences
 * - Loading skeleton, error state, and empty state handling
 * - Link to full logs view with filter preservation
 * - Platform-aware sizing (mobile: 280px, desktop: 320px max height)
 * - WCAG AAA compliant with proper ARIA live region
 *
 * @see useLogStream - Custom hook for log fetching
 * @see useLogFilterPreferencesStore - Zustand store for filter preferences
 */
declare function RecentLogsComponent({ deviceId, className }: RecentLogsProps): import("react/jsx-runtime").JSX.Element;
/**
 * RecentLogs export with React.memo for performance optimization
 * Prevents unnecessary re-renders when parent component updates
 */
export declare const RecentLogs: React.MemoExoticComponent<typeof RecentLogsComponent>;
export {};
//# sourceMappingURL=RecentLogs.d.ts.map