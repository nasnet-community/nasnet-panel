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
      <div className="flex items-center gap-component-sm">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-component-sm px-component-sm py-component-sm text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('quickActions.refresh')}
        </button>
        <button
          onClick={() => setShowRestartDialog(true)}
          className="inline-flex items-center gap-component-sm px-component-sm py-component-sm text-sm font-medium text-warning bg-warning/10 border border-warning/30 rounded-md hover:bg-warning/20 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
          <div className="relative bg-card rounded-card-lg p-component-lg max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold font-display text-foreground mb-component-sm">{t('quickActions.restartConfirmTitle')}</h3>
            <p className="text-sm text-muted-foreground mb-component-md">
              {t('quickActions.restartConfirmMessage')}
            </p>
            <div className="flex justify-end gap-component-md">
              <button
                onClick={() => setShowRestartDialog(false)}
                className="px-component-md py-component-sm text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {t('button.cancel', { ns: 'common' })}
              </button>
              <button
                onClick={handleRestart}
                className="px-component-md py-component-sm text-sm font-medium text-white bg-warning hover:bg-warning/90 rounded-md transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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





















