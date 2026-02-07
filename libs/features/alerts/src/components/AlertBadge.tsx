/**
 * AlertBadge component
 * Per Task 5.3: Create AlertBadge component for header notification count
 * Per AC3: User can view active alerts with count badge
 */
import { useUnacknowledgedAlertCount } from '../hooks/useAlerts';

interface AlertBadgeProps {
  deviceId?: string;
  className?: string;
}

/**
 * Badge showing count of unacknowledged alerts
 * Updates in real-time via GraphQL subscription
 */
export function AlertBadge({ deviceId, className = '' }: AlertBadgeProps) {
  const count = useUnacknowledgedAlertCount(deviceId);

  if (count === 0) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-destructive text-destructive-foreground ${className}`}
      aria-label={`${count} unacknowledged alerts`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
