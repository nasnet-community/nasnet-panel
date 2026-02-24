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
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">{t('connection.failedLoad')}</h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          {error.message || t('connection.unexpected')}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t('button.tryAgain')}
          </button>
        )}
      </div>
    </div>
  );
});

ErrorDisplay.displayName = 'ErrorDisplay';
