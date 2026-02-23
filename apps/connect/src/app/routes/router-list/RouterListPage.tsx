import React from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@nasnet/core/constants';
import { Button } from '@nasnet/ui/primitives';

/**
 * RouterListPage Component
 *
 * Displays a list of saved routers with their connection status.
 *
 * Features:
 * - Shows saved routers from Epic 0.1 credential persistence
 * - Displays router IP, name (optional), and connection status
 * - Connection status indicators:
 *   - Green: Currently connected
 *   - Yellow: Connection in progress
 *   - Red: Offline/unreachable
 *   - Gray: Never connected
 * - Add Router button for manual entry
 * - Clickable routers navigate to router panel
 * - Empty state when no routers saved
 *
 * Note: Full router persistence functionality is implemented in Epic 0.1.
 * This is a placeholder structure that will be populated when Epic 0.1 is complete.
 *
 * Related:
 * - Epic 0.1: Router Discovery & Connection
 * - Story 0.9.6: Return to Router List
 */
export const RouterListPage = React.memo(function RouterListPage() {
  const { t } = useTranslation('router');
  const navigate = useNavigate();

  // Placeholder: Router list will come from Epic 0.1 credential persistence
  // For now, show empty state
  const routers: never[] = [];

  const handleAddRouter = () => {
    // Placeholder: Will navigate to auto-scan or manual entry (Epic 0.1)
    navigate({ to: ROUTES.DASHBOARD });
  };

  return (
    <div className="min-h-screen bg-muted p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between px-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">{t('list.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('list.subtitle')}
            </p>
          </div>
          <Button onClick={handleAddRouter} className="gap-2" aria-label={t('list.addButton')}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t('list.addButton')}</span>
          </Button>
        </div>

        {routers.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <img
              src="/favicon.png"
              alt=""
              aria-hidden="true"
              className="w-20 h-20 rounded-2xl shadow-md mb-6"
            />
            <h2 className="text-xl md:text-2xl font-semibold mb-2">{t('list.noRoutersYet')}</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              {t('list.emptyStateDescription')}
            </p>
            <Button onClick={handleAddRouter} size="lg" className="gap-2">
              <Plus className="h-5 w-5" aria-hidden="true" />
              {t('list.addFirstRouter')}
            </Button>
            <p className="text-xs text-muted-foreground mt-6 opacity-70">
              {t('list.epicNote')}
            </p>
          </div>
        ) : (
          // Router list (will be populated in Epic 0.1)
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Router cards will be rendered here */}
          </div>
        )}
      </div>
    </div>
  );
});
RouterListPage.displayName = 'RouterListPage';
