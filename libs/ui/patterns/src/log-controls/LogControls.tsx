/**
 * Log Controls Component
 * Provides pause/resume and export functionality for logs
 * Epic 0.8: System Logs - Pause/Resume & Export
 */

import * as React from 'react';

import { Pause, Play, Download, FileJson, FileSpreadsheet, Clock } from 'lucide-react';

import type { LogEntry } from '@nasnet/core/types';
import { formatTimestamp } from '@nasnet/core/utils';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from '@nasnet/ui/primitives';

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
function logsToCSV(logs: LogEntry[]): string {
  const headers = ['Timestamp', 'Topic', 'Severity', 'Message'];
  const rows = logs.map((log) => [
    new Date(log.timestamp).toISOString(),
    log.topic,
    log.severity,
    `"${log.message.replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Format logs as JSON
 */
function logsToJSON(logs: LogEntry[]): string {
  return JSON.stringify(
    logs.map((log) => ({
      timestamp: new Date(log.timestamp).toISOString(),
      topic: log.topic,
      severity: log.severity,
      message: log.message,
    })),
    null,
    2
  );
}

/**
 * Download content as file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * LogControls Component
 */
function LogControlsComponent({
  isPaused,
  onPauseToggle,
  lastUpdated,
  logs,
  routerIp = 'router',
  className,
}: LogControlsProps) {
  const dateStr = new Date().toISOString().split('T')[0];
  const baseFilename = `logs-${routerIp}-${dateStr}`;

  const handleExportCSV = React.useCallback(() => {
    const csv = logsToCSV(logs);
    downloadFile(csv, `${baseFilename}.csv`, 'text/csv');
  }, [logs, baseFilename]);

  const handleExportJSON = React.useCallback(() => {
    const json = logsToJSON(logs);
    downloadFile(json, `${baseFilename}.json`, 'application/json');
  }, [logs, baseFilename]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant={isPaused ? 'default' : 'outline'}
        size="sm"
        onClick={onPauseToggle}
        className="gap-2"
        aria-label={isPaused ? 'Resume live updates' : 'Pause live updates'}
      >
        {isPaused ?
          <>
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">Resume</span>
          </>
        : <>
            <Pause className="h-4 w-4" />
            <span className="hidden sm:inline">Pause</span>
          </>
        }
      </Button>

      {isPaused && lastUpdated && (
        <div className="text-muted-foreground flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
          <Clock className="h-3 w-3" />
          <span>Paused at {formatTimestamp(lastUpdated)}</span>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleExportCSV}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleExportJSON}
            className="gap-2"
          >
            <FileJson className="h-4 w-4" />
            Export as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const LogControls = React.memo(LogControlsComponent);
LogControls.displayName = 'LogControls';

export const logExport = {
  toCSV: logsToCSV,
  toJSON: logsToJSON,
  download: downloadFile,
};
