/**
 * Recent Firewall Activity Component
 * Placeholder for log integration showing recent firewall events
 * Epic 0.6 Enhancement: Dashboard Overview
 */

import { Activity, Info, AlertTriangle } from 'lucide-react';

interface RecentFirewallActivityProps {
  className?: string;
}

export function RecentFirewallActivity({ className }: RecentFirewallActivityProps) {
  const hasLogging = false;

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 ${className || ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          Recent Activity
        </h3>
      </div>

      {!hasLogging ? (
        <div className="text-center py-6">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Info className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Logging Not Configured
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Enable firewall logging to see recent blocked connections
          </p>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            No Recent Activity
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            No blocked connections in the last hour
          </p>
        </div>
      )}
    </div>
  );
}

























