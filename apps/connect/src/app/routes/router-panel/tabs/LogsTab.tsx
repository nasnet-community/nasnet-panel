/**
 * Logs Tab Component
 *
 * Displays system logs with filtering options.
 * Epic 0.8: System Logs - Story 0.8.1: Log Viewer
 */

import { LogViewer } from '@nasnet/features/dashboard';

export function LogsTab() {
  return (
    <div className="flex flex-col h-full p-4 md:p-6">
      <div className="mb-4 px-2">
        <h2 className="text-lg md:text-xl font-semibold">System Logs</h2>
        <p className="text-sm text-muted-foreground">
          View real-time system logs from your router
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <LogViewer limit={100} />
      </div>
    </div>
  );
}
