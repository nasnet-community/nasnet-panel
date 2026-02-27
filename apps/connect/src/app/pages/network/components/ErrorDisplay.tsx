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

export const ErrorDisplay = React.memo(function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const { t } = useTranslation('errors');
  return (
    <div className="container mx-auto px-page-mobile md:px-page-tablet lg:px-page-desktop">
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-error/10 border border-error/30 rounded-card-sm p-6 max-w-md w-full animate-fade-in-up">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-error" />
            <h2 className="text-xl font-display font-semibold text-error">
              {t('connection.failedLoad')}
            </h2>
            <p className="text-muted-foreground text-sm">
              {error.message || t('connection.unexpected')}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors min-h-[44px] w-full font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
