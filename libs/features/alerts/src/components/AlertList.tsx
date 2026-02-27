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
          <Spinner
            size="lg"
            aria-label="Loading alerts"
          />
        </div>
      );
    }

    if (error) {
      return (
        <div
          className="p-component-md bg-error/10 text-error rounded-md"
          role="alert"
          aria-live="assertive"
        >
          <p className="font-medium">Failed to load alerts</p>
          <p className="mt-component-xs text-sm">{error.message}</p>
        </div>
      );
    }

    const alerts = data?.alerts?.edges || [];
    const totalCount = data?.alerts?.totalCount || 0;
    const hasNextPage = data?.alerts?.pageInfo?.hasNextPage || false;

    if (alerts.length === 0) {
      return (
        <div className="py-component-xl text-muted-foreground text-center">
          <Icon
            icon={Inbox}
            className="mb-component-lg mx-auto h-12 w-12 opacity-30"
            aria-hidden="true"
          />
          <p className="font-display text-lg font-semibold">No alerts found</p>
          <p className="mt-component-sm text-sm">
            {shouldShowAcknowledged ?
              'No alerts match your filters.'
            : 'All caught up! No active alerts at the moment.'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-component-sm">
        {alerts.map(({ node: alert }: { node: Record<string, any> }) => {
          const severityInfo = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG];
          const isAcknowledged = Boolean(alert.acknowledgedAt);

          return (
            <div
              key={alert.id}
              className={cn(
                'p-component-md border-border rounded-[var(--semantic-radius-card)] border-l-4 shadow-sm transition-opacity',
                isAcknowledged && 'opacity-60',
                severityInfo.borderClass
              )}
            >
              <div className="gap-component-md flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  {/* Title and Severity */}
                  <div className="gap-component-sm mb-component-sm flex flex-wrap items-center">
                    <span
                      className={cn(
                        'px-component-sm inline-block rounded py-0.5 text-xs font-medium',
                        severityInfo.badgeClass
                      )}
                    >
                      {severityInfo.label}
                    </span>
                    <h3 className="truncate text-sm font-semibold">{alert.title}</h3>
                    {/* Queued alert badge */}
                    <QueuedAlertBadge
                      queuedUntil={alert.data?.queuedUntil}
                      shouldBypassQuietHours={alert.data?.shouldBypassQuietHours}
                    />
                  </div>

                  {/* Message */}
                  <p className="text-muted-foreground mb-component-sm text-sm">{alert.message}</p>

                  {/* Metadata */}
                  <div className="gap-component-md text-muted-foreground flex items-center text-xs">
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
                    <div className="mt-component-sm text-muted-foreground text-xs">
                      Acknowledged by {alert.acknowledgedBy} •{' '}
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
                      'px-component-md py-component-sm border-border min-h-[44px] rounded-[var(--semantic-radius-button)] border text-sm',
                      'hover:bg-muted transition-colors disabled:opacity-50',
                      'focus-visible:ring-ring whitespace-nowrap focus-visible:outline-none focus-visible:ring-2',
                      'focus-visible:ring-offset-2'
                    )}
                  >
                    {isAcknowledging ?
                      <>
                        <Spinner
                          size="sm"
                          className="mr-1 inline"
                          aria-hidden="true"
                        />
                        Acknowledging...
                      </>
                    : 'Acknowledge'}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Pagination Info */}
        {hasNextPage && (
          <div className="pt-component-lg text-center">
            <button
              aria-label={`Load more alerts, ${totalCount - alerts.length} remaining`}
              className={cn(
                'text-primary rounded-[var(--semantic-radius-button)] text-sm hover:underline',
                'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-offset-2'
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
