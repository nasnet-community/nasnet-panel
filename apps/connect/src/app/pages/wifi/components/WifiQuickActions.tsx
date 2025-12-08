/**
 * WiFi Quick Actions Component
 * Action buttons for refresh and restart operations
 */

import { RefreshCw, Power } from 'lucide-react';
import { useState } from 'react';

interface WifiQuickActionsProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function WifiQuickActions({ onRefresh, isRefreshing }: WifiQuickActionsProps) {
  const [showRestartDialog, setShowRestartDialog] = useState(false);

  const handleRestart = () => {
    // TODO: Implement WiFi restart functionality
    setShowRestartDialog(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <button
          onClick={() => setShowRestartDialog(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        >
          <Power className="w-4 h-4" />
          Restart WiFi
        </button>
      </div>

      {/* Restart Confirmation Dialog */}
      {showRestartDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowRestartDialog(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Restart WiFi?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              This will temporarily disconnect all wireless clients. They will automatically reconnect after the restart completes.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRestartDialog(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRestart}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}




