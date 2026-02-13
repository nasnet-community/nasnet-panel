/**
 * QueuedAlertBadge Component
 * Per Task #9: Add queued alert status display
 *
 * Displays a badge when an alert is queued due to quiet hours.
 */

import { useTranslation } from 'react-i18next';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';

export interface QueuedAlertBadgeProps {
  /**
   * When the alert will be delivered (ISO 8601 timestamp)
   */
  queuedUntil?: string;

  /**
   * Whether this alert bypassed quiet hours (critical severity)
   */
  bypassedQuietHours?: boolean;

  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Badge showing alert queuing status
 *
 * @example
 * ```tsx
 * <QueuedAlertBadge queuedUntil="2026-02-13T08:00:00Z" />
 * <QueuedAlertBadge bypassedQuietHours={true} />
 * ```
 */
export function QueuedAlertBadge({
  queuedUntil,
  bypassedQuietHours,
  className,
}: QueuedAlertBadgeProps) {
  const { t } = useTranslation('alerts');

  // Don't render if no queuing info
  if (!queuedUntil && !bypassedQuietHours) {
    return null;
  }

  // Show bypassed badge for critical alerts during quiet hours
  if (bypassedQuietHours) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
          'bg-warning/10 text-warning border border-warning/20',
          className
        )}
      >
        <AlertCircle className="h-3.5 w-3.5" />
        <span>{t('status.bypassedQuietHours')}</span>
      </div>
    );
  }

  // Show queued badge with delivery time
  if (queuedUntil) {
    const deliveryTime = new Date(queuedUntil);
    const now = new Date();
    const hoursUntilDelivery = Math.ceil((deliveryTime.getTime() - now.getTime()) / (1000 * 60 * 60));

    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
          'bg-info/10 text-info border border-info/20',
          className
        )}
        title={t('status.queuedTooltip', { time: deliveryTime.toLocaleString() })}
      >
        <Clock className="h-3.5 w-3.5" />
        <span>
          {t('status.queued')} • {hoursUntilDelivery === 0 ? t('status.soon') : t('status.hoursUntil', { hours: hoursUntilDelivery })}
        </span>
      </div>
    );
  }

  return null;
}
