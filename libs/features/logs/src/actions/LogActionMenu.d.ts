/**
 * Log Action Context Menu Component
 * Epic 0.8: System Logs - Custom Log Actions
 */
import * as React from 'react';
import type { LogEntry } from '@nasnet/core/types';
import { type LogAction } from './logActionRegistry';
export interface LogActionMenuProps {
    /**
     * The log entry to show actions for
     */
    entry: LogEntry;
    /**
     * Handler for action selection
     */
    onAction: (action: LogAction, extractedData: string | null) => void;
    /**
     * Whether the entry is bookmarked
     */
    isBookmarked?: boolean;
    /**
     * Optional trigger element (defaults to MoreVertical icon)
     */
    trigger?: React.ReactNode;
    /**
     * Additional class names for the trigger
     */
    className?: string;
}
/**
 * @description Context menu for log entry actions including copy, bookmark, and topic-specific actions
 */
export declare const LogActionMenu: React.NamedExoticComponent<LogActionMenuProps>;
//# sourceMappingURL=LogActionMenu.d.ts.map