/**
 * AlertList component
 * Per Task 5.1: Create AlertList component with severity color coding
 * Per AC3: User can view active alerts with count badge, see alert list with
 * timestamp/severity/message
 * Per Task #9: Added queued alert status display
 */
import { useAlerts, useAcknowledgeAlert } from '../hooks/useAlerts';
import { severityConfig } from '../schemas/alert-rule.schema';
import { formatDistanceToNow } from 'date-fns';
import { QueuedAlertBadge } from './QueuedAlertBadge';

interface AlertListProps {
  deviceId?: string;
  severity?: 'CRITICAL' | 'WARNING' | 'INFO';
  acknowledged?: boolean;
  limit?: number;
}

/**
 * AlertList displays a list of alerts with filtering
 */
export function AlertList({ deviceId, severity, acknowledged = false, limit = 50 }: AlertListProps) {
  const { data, loading, error } = useAlerts({
    deviceId,
    severity,
    acknowledged,
    limit,
    enableSubscription: true,
  });

  const { acknowledgeAlert, loading: acknowledging } = useAcknowledgeAlert();

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        Failed to load alerts: {error.message}
      </div>
    );
  }

  const alerts = data?.alerts?.edges || [];

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No alerts found</p>
        <p className="text-sm mt-1">
          {acknowledged === false
            ? 'All caught up! No active alerts at the moment.'
            : 'No alerts match your filters.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map(({ node: alert }) => {
        const severityInfo = severityConfig[alert.severity as keyof typeof severityConfig];
        const isAcknowledged = Boolean(alert.acknowledgedAt);

        return (
          <div
            key={alert.id}
            className={`p-4 border-l-4 rounded-md shadow-sm transition-opacity ${
              isAcknowledged ? 'opacity-60' : ''
            }`}
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
                  {/* Queued alert badge (placeholder - backend integration pending) */}
                  <QueuedAlertBadge
                    queuedUntil={alert.data?.queuedUntil}
                    bypassedQuietHours={alert.data?.bypassedQuietHours}
                  />
                </div>

                {/* Message */}
                <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}</span>
                  <span>•</span>
                  <span>{alert.eventType}</span>
                  {alert.deviceId && (
                    <>
                      <span>•</span>
                      <span>Device: {alert.deviceId}</span>
                    </>
                  )}
                </div>

                {/* Acknowledgment Info */}
                {isAcknowledged && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Acknowledged by {alert.acknowledgedBy} •{' '}
                    {formatDistanceToNow(new Date(alert.acknowledgedAt!), { addSuffix: true })}
                  </div>
                )}
              </div>

              {/* Actions */}
              {!isAcknowledged && (
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  disabled={acknowledging}
                  className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {acknowledging ? 'Acknowledging...' : 'Acknowledge'}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Pagination Info */}
      {data?.alerts?.pageInfo?.hasNextPage && (
        <div className="text-center pt-4">
          <button className="text-sm text-primary hover:underline">
            Load More ({data.alerts.totalCount - alerts.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
