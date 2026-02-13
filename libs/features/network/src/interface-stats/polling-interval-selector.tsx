/**
 * PollingIntervalSelector Component
 * UI for configuring interface statistics polling interval
 *
 * NAS-6.9: Implement Interface Traffic Statistics (Task 8)
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';
import {
  useInterfaceStatsStore,
  POLLING_INTERVAL_LABELS,
  type PollingInterval,
} from '@nasnet/state/stores';

/**
 * Props for PollingIntervalSelector component
 */
export interface PollingIntervalSelectorProps {
  /** Additional CSS classes */
  className?: string;
  /** Show as inline (no label) */
  inline?: boolean;
}

/**
 * PollingIntervalSelector Component
 *
 * Allows users to configure the polling interval for interface statistics updates.
 * Changes apply immediately to active subscriptions and persist across sessions.
 *
 * Available intervals:
 * - 1s: Real-time monitoring (high CPU usage)
 * - 5s: Recommended default (balanced)
 * - 10s: Low bandwidth mode
 * - 30s: Minimal updates
 *
 * @example
 * ```tsx
 * <PollingIntervalSelector />
 * // Full layout with label
 *
 * <PollingIntervalSelector inline />
 * // Compact inline layout
 * ```
 */
export function PollingIntervalSelector({
  className,
  inline = false,
}: PollingIntervalSelectorProps) {
  const { pollingInterval, setPollingInterval } = useInterfaceStatsStore();

  const handleChange = (value: string) => {
    setPollingInterval(value as PollingInterval);
  };

  if (inline) {
    return (
      <Select value={pollingInterval} onValueChange={handleChange}>
        <SelectTrigger className={className} aria-label="Update interval">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(POLLING_INTERVAL_LABELS) as PollingInterval[]).map((interval) => {
            const { label, description } = POLLING_INTERVAL_LABELS[interval];
            return (
              <SelectItem key={interval} value={interval}>
                <div className="flex flex-col">
                  <span className="font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">{description}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className={className}>
      <label htmlFor="polling-interval" className="mb-2 block text-sm font-medium">
        Update Interval
      </label>
      <Select value={pollingInterval} onValueChange={handleChange}>
        <SelectTrigger id="polling-interval" className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(POLLING_INTERVAL_LABELS) as PollingInterval[]).map((interval) => {
            const { label, description } = POLLING_INTERVAL_LABELS[interval];
            return (
              <SelectItem key={interval} value={interval}>
                <div className="flex flex-col">
                  <span className="font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">{description}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <p className="mt-1 text-xs text-muted-foreground">
        Changes apply immediately to active statistics subscriptions
      </p>
    </div>
  );
}
