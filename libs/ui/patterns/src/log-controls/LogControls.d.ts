/**
 * Log Controls Component
 * Provides pause/resume and export functionality for logs
 * Epic 0.8: System Logs - Pause/Resume & Export
 */
import * as React from 'react';
import type { LogEntry } from '@nasnet/core/types';
export interface LogControlsProps {
    /**
     * Whether auto-refresh is paused
     */
    isPaused: boolean;
    /**
     * Toggle pause/resume
     */
    onPauseToggle: () => void;
    /**
     * Last update timestamp
     */
    lastUpdated?: Date;
    /**
     * Logs to export
     */
    logs: LogEntry[];
    /**
     * Router IP for filename
     */
    routerIp?: string;
    /**
     * Additional class names
     */
    className?: string;
}
/**
 * Format logs as CSV
 */
declare function logsToCSV(logs: LogEntry[]): string;
/**
 * Format logs as JSON
 */
declare function logsToJSON(logs: LogEntry[]): string;
/**
 * Download content as file
 */
declare function downloadFile(content: string, filename: string, mimeType: string): void;
/**
 * LogControls Component
 */
declare function LogControlsComponent({ isPaused, onPauseToggle, lastUpdated, logs, routerIp, className, }: LogControlsProps): import("react/jsx-runtime").JSX.Element;
export declare const LogControls: React.MemoExoticComponent<typeof LogControlsComponent>;
export declare const logExport: {
    toCSV: typeof logsToCSV;
    toJSON: typeof logsToJSON;
    download: typeof downloadFile;
};
export {};
//# sourceMappingURL=LogControls.d.ts.map