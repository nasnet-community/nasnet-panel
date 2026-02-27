/**
 * QueuedAlertBadge Component
 *
 * Displays badge for alerts queued due to quiet hours or bypassed critical alerts.
 * Shows delivery time countdown and visual distinction for critical overrides.
 *
 * @description Per Task #9: Add queued alert status display
 * @example
 * // Queued alert
 * <QueuedAlertBadge queuedUntil="2026-02-13T08:00:00Z" />
 *
 * // Bypassed quiet hours
 * <QueuedAlertBadge bypassedQuietHours={true} />
 *
 * @see useAlertQueue
 */

import { useMemo, useCallback } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

/**
 * @interface QueuedAlertBadgeProps
 * @description Props for QueuedAlertBadge component
 */
interface QueuedAlertBadgeProps {
  /** ISO 8601 timestamp when alert will be delivered */
  queuedUntil?: string;
  /** Whether alert bypassed quiet hours (critical severity) */
  shouldBypassQuietHours?: boolean;
  /** Optional CSS className for custom styling */
  className?: string;
}

/**
 * Badge showing alert queuing status and delivery timing.
 * Handles two cases: queued alerts (show countdown) and bypassed critical alerts.
 * Hides when no queuing info present.
 *
 * @component
 * @example
 * return <QueuedAlertBadge queuedUntil="2026-02-13T08:00:00Z" />;
 */
const QueuedAlertBadge = ({
  queuedUntil,
  shouldBypassQuietHours = false,
  className,
}: QueuedAlertBadgeProps) => {
  const { t } = useTranslation('alerts');

  // Memoize hours until delivery calculation
  const hoursUntilDelivery = useMemo(() => {
    if (!queuedUntil) return 0;
    const deliveryTime = new Date(queuedUntil);
    const now = new Date();
    return Math.ceil((deliveryTime.getTime() - now.getTime()) / (1000 * 60 * 60));
  }, [queuedUntil]);

  // Memoize delivery time for tooltips
  const deliveryTimeFormatted = useMemo(() => {
    if (!queuedUntil) return '';
    return new Date(queuedUntil).toLocaleString();
  }, [queuedUntil]);

  // Don't render if no queuing info
  if (!queuedUntil && !shouldBypassQuietHours) {
    return null;
  }

  // Show bypassed badge for critical alerts during quiet hours
  if (shouldBypassQuietHours) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-component-sm px-component-sm py-component-xs rounded-[var(--semantic-radius-badge)] text-xs font-medium',
          'bg-warning/10 text-warning border border-warning/20',
          className
        )}
        aria-label={t('status.bypassedQuietHours')}
      >
        <Icon icon={AlertCircle} className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t('status.bypassedQuietHours')}</span>
      </div>
    );
  }

  // Show queued badge with delivery time countdown
  if (queuedUntil) {
    const hoursText = hoursUntilDelivery === 0 ? t('status.soon') : t('status.hoursUntil', { hours: hoursUntilDelivery });

    return (
      <div
        className={cn(
          'inline-flex items-center gap-component-sm px-component-sm py-component-xs rounded-[var(--semantic-radius-badge)] text-xs font-medium',
          'bg-info/10 text-info border border-info/20',
          className
        )}
        title={t('status.queuedTooltip', { time: deliveryTimeFormatted })}
        aria-label={`${t('status.queued')}: ${hoursText}`}
        aria-live="polite"
      >
        <Icon icon={Clock} className="h-3.5 w-3.5" aria-hidden="true" />
        <span>
          {t('status.queued')} • {hoursText}
        </span>
      </div>
    );
  }

  return null;
};

QueuedAlertBadge.displayName = 'QueuedAlertBadge';

export { QueuedAlertBadge };
export type { QueuedAlertBadgeProps };
