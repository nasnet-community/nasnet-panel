/**
 * Logs Tab Component
 *
 * Displays system logs with filtering options.
 * Epic 0.8: System Logs - Story 0.8.1: Log Viewer
 */

import { useTranslation } from 'react-i18next';

import { LogViewer } from '@nasnet/features/dashboard';

export function LogsTab() {
  const { t } = useTranslation('dashboard');
  return (
    <div className="flex flex-col h-full p-component-md md:p-component-lg animate-fade-in-up">
      <div className="mb-component-md px-component-sm">
        <h2 className="text-lg md:text-xl font-semibold font-display">{t('recentLogs.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('recentLogs.description')}
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <LogViewer limit={100} />
      </div>
    </div>
  );
}

LogsTab.displayName = 'LogsTab';
