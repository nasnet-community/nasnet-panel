/**
 * AlertList component
 *
 * Displays filterable list of alerts with severity color coding, timestamps,
 * and inline acknowledge actions. Supports filtering by device, severity, and
 * acknowledgment status. Updates in real-time via GraphQL subscription.
 *
 * @description Per Task 5.1: Create AlertList component with severity color coding
 * @example
 * // Show unacknowledged critical alerts
 * <AlertList severity="CRITICAL" acknowledged={false} />
 *
 * // Show all alerts for specific device
 * <AlertList deviceId="router-1" limit={25} />
 *
 * @see useAlerts
 * @see useAcknowledgeAlert
 */
import { memo, useCallback, useMemo } from 'react';
import { Inbox } from 'lucide-react';
import { useAlerts, useAcknowledgeAlert } from '../hooks/useAlerts';
import { SEVERITY_CONFIG } from '../schemas/alert-rule.schema';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@nasnet/ui/utils';
import { Icon, Spinner } from '@nasnet/ui/primitives';
import { QueuedAlertBadge } from './QueuedAlertBadge';

/**
 * @interface AlertListProps
 * @description Props for AlertList component
 */
export interface AlertListProps {
  /** Filter alerts by device ID */
  deviceId?: string;
  /** Filter alerts by severity level */
  severity?: 'CRITICAL' | 'WARNING' | 'INFO';
  /** Filter by acknowledgment status */
  shouldShowAcknowledged?: boolean;
  /** Maximum number of alerts to display */
  limit?: number;
}

/**
 * Alert list with severity color coding, timestamps, and inline actions.
 * Supports real-time updates via subscription. Shows empty state when no alerts.
 * Loading and error states handled gracefully.
 *
 * @component
 * @example
 * return <AlertList severity="CRITICAL" shouldShowAcknowledged={false} />;
 */
export const AlertList = memo(
  function AlertList({
    deviceId,
    severity,
    shouldShowAcknowledged = false,
    limit = 50,
  }: AlertListProps) {
    const { data, loading, error } = useAlerts({
      deviceId,
      severity,
      acknowledged: shouldShowAcknowledged,
      limit,
      enableSubscription: true,
    });

    const { acknowledgeAlert, loading: isAcknowledging } = useAcknowledgeAlert();

    // Stable callback for acknowledge action
    const handleAcknowledge = useCallback(
      async (alertId: string) => {
        try {
          await acknowledgeAlert(alertId);
        } catch (err) {
          console.error('Failed to acknowledge alert:', err);
        }
      },
      [acknowledgeAlert]
    );

    if (loading && !data) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" aria-label="Loading alerts" />
        </div>
      );
    }

    if (error) {
      return (
        <div
          className="p-4 bg-destructive/10 text-destructive rounded-md"
          role="alert"
          aria-live="assertive"
        >
          <p className="font-medium">Failed to load alerts</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      );
    }

    const alerts = data?.alerts?.edges || [];
    const totalCount = data?.alerts?.totalCount || 0;
    const hasNextPage = data?.alerts?.pageInfo?.hasNextPage || false;

    if (alerts.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Icon icon={Inbox} className="h-12 w-12 mx-auto mb-4 opacity-30" aria-hidden="true" />
          <p className="text-lg font-display font-semibold">No alerts found</p>
          <p className="text-sm mt-1">
            {shouldShowAcknowledged
              ? 'No alerts match your filters.'
              : 'All caught up! No active alerts at the moment.'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {alerts.map(({ node: alert }: { node: Record<string, any> }) => {
          const severityInfo = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG];
          const isAcknowledged = Boolean(alert.acknowledgedAt);

          return (
            <div
              key={alert.id}
              className={cn(
                'p-4 border-l-4 rounded-md shadow-sm transition-opacity',
                isAcknowledged && 'opacity-60'
              )}
              style={{
                borderLeftColor: `var(--${severityInfo.color})`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Title and Severity */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="inline-block px-2 py-0.5 text-xs font-medium rounded"
                      style={{
                        backgroundColor: `var(--${severityInfo.color})`,
                        color: 'white',
                      }}
                    >
                      {severityInfo.label}
                    </span>
                    <h3 className="font-semibold text-sm truncate">{alert.title}</h3>
                    {/* Queued alert badge */}
                    <QueuedAlertBadge
                      queuedUntil={alert.data?.queuedUntil}
                      shouldBypassQuietHours={alert.data?.shouldBypassQuietHours}
                    />
                  </div>

                  {/* Message */}
                  <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-xs">{alert.eventType}</span>
                    {alert.deviceId && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-xs">{alert.deviceId}</span>
                      </>
                    )}
                  </div>

                  {/* Acknowledgment Info */}
                  {isAcknowledged && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Acknowledged by {alert.acknowledgedBy} •
                      {' '}
                      {formatDistanceToNow(new Date(alert.acknowledgedAt!), {
                        addSuffix: true,
                      })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!isAcknowledged && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={isAcknowledging}
                    aria-label={`Acknowledge alert: ${alert.title}`}
                    className={cn(
                      'px-3 py-1.5 text-sm border border-border rounded-md',
                      'hover:bg-muted disabled:opacity-50 transition-colors',
                      'whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring',
                      'focus-visible:ring-offset-2 focus-visible:outline-none'
                    )}
                  >
                    {isAcknowledging ? (
                      <>
                        <Spinner size="sm" className="inline mr-1" aria-hidden="true" />
                        Acknowledging...
                      </>
                    ) : (
                      'Acknowledge'
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Pagination Info */}
        {hasNextPage && (
          <div className="text-center pt-4">
            <button
              aria-label={`Load more alerts, ${totalCount - alerts.length} remaining`}
              className={cn(
                'text-sm text-primary hover:underline',
                'focus-visible:ring-2 focus-visible:ring-ring',
                'focus-visible:ring-offset-2 focus-visible:outline-none rounded'
              )}
            >
              Load More ({totalCount - alerts.length} remaining)
            </button>
          </div>
        )}
      </div>
    );
  },
  (prevProps: AlertListProps, nextProps: AlertListProps) => {
    // Custom memoization: only re-render if props actually change
    return (
      prevProps.deviceId === nextProps.deviceId &&
      prevProps.severity === nextProps.severity &&
      prevProps.shouldShowAcknowledged === nextProps.shouldShowAcknowledged &&
      prevProps.limit === nextProps.limit
    );
  }
);

AlertList.displayName = 'AlertList';
