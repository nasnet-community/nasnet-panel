/**
 * Error Display Component
 * Shows user-friendly error messages with retry option
 */

import React from 'react';

import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
}

export const ErrorDisplay = React.memo(function ErrorDisplay({
  error,
  onRetry,
}: ErrorDisplayProps) {
  const { t } = useTranslation('errors');
  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop container mx-auto">
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-error/10 border-error/30 rounded-card-sm animate-fade-in-up w-full max-w-md border p-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <AlertCircle className="text-error h-12 w-12" />
            <h2 className="font-display text-error text-xl font-semibold">
              {t('connection.failedLoad')}
            </h2>
            <p className="text-muted-foreground text-sm">
              {error.message || t('connection.unexpected')}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring min-h-[44px] w-full rounded-lg px-4 py-3 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {t('button.tryAgain')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ErrorDisplay.displayName = 'ErrorDisplay';
