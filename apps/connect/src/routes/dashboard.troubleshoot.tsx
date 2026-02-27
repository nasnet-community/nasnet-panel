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
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="bg-error/10 border-error/20 w-full max-w-md rounded-lg border p-6 text-center"
          role="alert"
        >
          <h2 className="text-error mb-2 text-lg font-semibold">
            {t('troubleshoot.noRouterSelected')}
          </h2>
          <p className="text-muted-foreground mb-4 text-sm">
            {t('troubleshoot.selectRouterMessage')}
          </p>
          <button
            onClick={handleClose}
            aria-label={t('troubleshoot.returnToDashboard')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
          >
            {t('troubleshoot.returnToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <TroubleshootWizard
          routerId={routerId}
          autoStart={search.autoStart}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}
