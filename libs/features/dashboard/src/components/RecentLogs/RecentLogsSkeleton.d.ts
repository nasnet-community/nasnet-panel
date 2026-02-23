/**
 * RecentLogsSkeleton component for loading state
 * Provides visual feedback while logs are loading from server
 * Respects prefers-reduced-motion for accessibility
 * Story NAS-5.6: Recent Logs with Filtering
 *
 * @component
 * @see RecentLogs - Main component
 * @see https://docs.nasnet.io/design/COMPREHENSIVE_COMPONENT_CHECKLIST#10-loading-states
 *
 * @example
 * <RecentLogsSkeleton />
 *
 * @example
 * <RecentLogsSkeleton className="col-span-2" />
 */
import React from 'react';
import type { RecentLogsSkeletonProps } from './types';
/**
 * Loading skeleton for RecentLogs component
 * Displays 3 skeleton rows matching the log entry structure
 * Used during initial data loading and while fetching new logs
 *
 * @component
 * @param {RecentLogsSkeletonProps} props - Component props
 * @param {string} [props.className] - Optional CSS classes for styling
 *
 * @returns {React.ReactElement} Rendered skeleton component
 *
 * Layout:
 * - Card header with title, topic filter skeleton, and view all button skeleton
 * - Content area with 3 skeleton log entry rows
 * - Each row contains: icon (5x5px), timestamp (5x16px), duration (4x12px), message (4x full)
 *
 * Accessibility:
 * - Uses semantic Card structure
 * - Skeleton pulse animation respects prefers-reduced-motion
 * - No aria-live on skeletons (they're replaced by actual content)
 *
 * @see Skeleton - Primitive component for loading placeholders
 */
declare function RecentLogsSkeletonComponent({ className, }: RecentLogsSkeletonProps): import("react/jsx-runtime").JSX.Element;
/**
 * RecentLogsSkeleton export with React.memo for performance optimization
 * Prevents unnecessary re-renders when parent updates but props haven't changed
 */
export declare const RecentLogsSkeleton: React.MemoExoticComponent<typeof RecentLogsSkeletonComponent>;
export {};
//# sourceMappingURL=RecentLogsSkeleton.d.ts.map