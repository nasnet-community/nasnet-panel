/**
 * Log Detail Panel Component
 * Side panel showing full log entry details
 * Epic 0.8: System Logs - Log Entry Details Panel
 */
import * as React from 'react';
import type { LogEntry } from '@nasnet/core/types';
export interface LogDetailPanelProps {
    /**
     * The log entry to display
     */
    entry: LogEntry | null;
    /**
     * Whether the panel is open
     */
    isOpen: boolean;
    /**
     * Close handler
     */
    onClose: () => void;
    /**
     * Related entries (from same topic, for context)
     */
    relatedEntries?: LogEntry[];
    /**
     * Navigate to previous entry
     */
    onPrevious?: () => void;
    /**
     * Navigate to next entry
     */
    onNext?: () => void;
    /**
     * Whether there is a previous entry
     */
    hasPrevious?: boolean;
    /**
     * Whether there is a next entry
     */
    hasNext?: boolean;
}
/**
 * LogDetailPanel Component
 */
declare function LogDetailPanelComponent({ entry, isOpen, onClose, relatedEntries, onPrevious, onNext, hasPrevious, hasNext, }: LogDetailPanelProps): import("react/jsx-runtime").JSX.Element | null;
export declare const LogDetailPanel: React.MemoExoticComponent<typeof LogDetailPanelComponent>;
export {};
//# sourceMappingURL=LogDetailPanel.d.ts.map