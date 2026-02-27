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

export const WifiQuickActions = React.memo(function WifiQuickActions({
  onRefresh,
  isRefreshing,
}: WifiQuickActionsProps) {
  const { t } = useTranslation('wifi');
  const [showRestartDialog, setShowRestartDialog] = useState(false);

  const handleRestart = () => {
    // TODO: Implement WiFi restart functionality
    setShowRestartDialog(false);
  };

  return (
    <>
      <div className="gap-component-sm flex items-center">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-component-sm px-component-md py-component-sm text-primary-foreground bg-primary border-primary hover:bg-primary/90 focus-visible:ring-ring inline-flex min-h-[44px] items-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('quickActions.refresh')}
        </button>
        <button
          onClick={() => setShowRestartDialog(true)}
          className="gap-component-sm px-component-md py-component-sm text-warning bg-warning/10 border-warning/30 hover:bg-warning/20 focus-visible:ring-ring inline-flex min-h-[44px] items-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Power className="h-4 w-4" />
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
          <div className="bg-card rounded-card-lg p-component-lg relative mx-4 max-w-md shadow-xl">
            <h3 className="font-display text-foreground mb-component-sm text-lg font-semibold">
              {t('quickActions.restartConfirmTitle')}
            </h3>
            <p className="text-muted-foreground mb-component-md text-sm">
              {t('quickActions.restartConfirmMessage')}
            </p>
            <div className="gap-component-md flex justify-end">
              <button
                onClick={() => setShowRestartDialog(false)}
                className="px-component-md py-component-sm text-foreground bg-muted border-border hover:bg-muted/80 focus-visible:ring-ring min-h-[44px] rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {t('button.cancel', { ns: 'common' })}
              </button>
              <button
                onClick={handleRestart}
                className="px-component-md py-component-sm text-warning-foreground bg-warning hover:bg-warning/90 focus-visible:ring-ring min-h-[44px] rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
