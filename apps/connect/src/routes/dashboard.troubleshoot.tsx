// apps/connect/src/routes/dashboard.troubleshoot.tsx
import { useEffect, useState } from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { useTranslation } from '@nasnet/core/i18n';
import { TroubleshootWizard } from '@nasnet/features/diagnostics';

// Route search params
export interface TroubleshootSearch {
  routerId?: string;
  autoStart?: boolean;
}

export const Route = createFileRoute('/dashboard/troubleshoot')({
  component: TroubleshootPage,
  validateSearch: (search: Record<string, unknown>): TroubleshootSearch => {
    return {
      routerId: typeof search?.routerId === 'string' ? search.routerId : undefined,
      autoStart: search?.autoStart === true || search?.autoStart === 'true',
    };
  },
});

export function TroubleshootPage() {
  const { t } = useTranslation('diagnostics');
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [routerId, setRouterId] = useState<string | undefined>(search.routerId);

  // Get router ID from search params or local storage
  useEffect(() => {
    if (!routerId) {
      // Try to get from localStorage or global state
      const storedRouterId = localStorage.getItem('selectedRouterId');
      if (storedRouterId) {
        setRouterId(storedRouterId);
      }
    }
  }, [routerId]);

  const handleClose = () => {
    navigate({ to: '/dashboard' });
  };

  // Show error if no router is selected
  if (!routerId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-error/10 border border-error/20 rounded-lg p-6 text-center" role="alert">
          <h2 className="text-lg font-semibold text-error mb-2">{t("troubleshoot.noRouterSelected")}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('troubleshoot.selectRouterMessage')}
          </p>
          <button
            onClick={handleClose}
            aria-label={t('troubleshoot.returnToDashboard')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            {t('troubleshoot.returnToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <TroubleshootWizard
          routerId={routerId}
          autoStart={search.autoStart}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}
