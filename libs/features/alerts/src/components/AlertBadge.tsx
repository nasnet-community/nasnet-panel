/**
 * AlertBadge component
 *
 * Displays count of unacknowledged alerts in header notification area.
 * Updates in real-time via GraphQL subscription. When count is 0, renders nothing.
 *
 * @description Per Task 5.3: Create AlertBadge component for header notification count
 * @example
 * // Basic usage
 * <AlertBadge deviceId="router-1" />
 *
 * // With custom styling
 * <AlertBadge deviceId="router-1" className="mr-2" />
 *
 * @see useUnacknowledgedAlertCount
 */
import { useMemo } from 'react';
import { useUnacknowledgedAlertCount } from '../hooks/useAlerts';
import { cn } from '@nasnet/ui/utils';

/**
 * @interface AlertBadgeProps
 * @description Props for AlertBadge component
 */
interface AlertBadgeProps {
  /** Optional device/router ID for scoped alert count */
  deviceId?: string;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * Badge showing count of unacknowledged alerts.
 * Hides when count is 0. Shows "99+" for counts above 99.
 * Accessible: aria-label describes the count to screen readers.
 *
 * @component
 * @example
 * return <AlertBadge deviceId="router-1" />;
 */
const AlertBadge = ({ deviceId, className }: AlertBadgeProps) => {
  const count = useUnacknowledgedAlertCount(deviceId);

  // Memoize display text to avoid recalculation
  const displayCount = useMemo(() => (count > 99 ? '99+' : count), [count]);

  // Don't render if no alerts
  if (count === 0) {
    return null;
  }

  return (
    <span
      className={cn(
        'px-component-sm inline-flex items-center justify-center rounded-[var(--semantic-radius-badge)] py-0.5 text-xs font-bold',
        'bg-error/10 text-error',
        'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        className
      )}
      aria-label={`${count} unacknowledged alerts`}
      aria-live="polite"
      role="status"
      tabIndex={0}
    >
      {displayCount}
    </span>
  );
};

AlertBadge.displayName = 'AlertBadge';

export { AlertBadge };
export type { AlertBadgeProps };
