/**
 * WiFi Quick Actions Component
 * Action buttons for refresh and restart operations
 */

import React, { useState } from 'react';

import { RefreshCw, Power } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WifiQuickActionsProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const WifiQuickActions = React.memo(function WifiQuickActions({ onRefresh, isRefreshing }: WifiQuickActionsProps) {
  const { t } = useTranslation('wifi');
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
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('quickActions.refresh')}
        </button>
        <button
          onClick={() => setShowRestartDialog(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-warning bg-warning/10 border border-warning/30 rounded-lg hover:bg-warning/20 transition-colors"
        >
          <Power className="w-4 h-4" />
          {t('quickActions.restartWiFi')}
        </button>
      </div>

      {/* Restart Confirmation Dialog */}
      {showRestartDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowRestartDialog(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowRestartDialog(false);
              }
            }}
            role="presentation"
            tabIndex={-1}
          />
          <div className="relative bg-card rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('quickActions.restartConfirmTitle')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('quickActions.restartConfirmMessage')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRestartDialog(false)}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                {t('button.cancel', { ns: 'common' })}
              </button>
              <button
                onClick={handleRestart}
                className="px-4 py-2 text-sm font-medium text-white bg-warning hover:bg-warning/90 rounded-lg transition-colors"
              >
                {t('quickActions.restartWiFi')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

WifiQuickActions.displayName = 'WifiQuickActions';





















