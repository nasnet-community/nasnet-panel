/**
 * PollingIntervalSelector Component
 * UI for configuring interface statistics polling interval
 *
 * NAS-6.9: Implement Interface Traffic Statistics (Task 8)
 */

import React, { useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
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
 * @description Provides a dropdown selector for real-time control of statistics polling frequency with persistent user preference
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
const PollingIntervalSelector = React.memo(function PollingIntervalSelector({
  className,
  inline = false,
}: PollingIntervalSelectorProps) {
  const { pollingInterval, setPollingInterval } = useInterfaceStatsStore();

  const handleChange = useCallback(
    (value: string) => {
      setPollingInterval(value as PollingInterval);
    },
    [setPollingInterval]
  );

  if (inline) {
    return (
      <Select
        value={pollingInterval}
        onValueChange={handleChange}
      >
        <SelectTrigger
          className={cn('category-networking', className)}
          aria-label="Update interval"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(POLLING_INTERVAL_LABELS) as PollingInterval[]).map((interval) => {
            const { label, description } = POLLING_INTERVAL_LABELS[interval];
            return (
              <SelectItem
                key={interval}
                value={interval}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground text-xs">{description}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className={cn('category-networking', className)}>
      <label
        htmlFor="polling-interval"
        className="mb-component-sm block text-sm font-medium"
      >
        Update Interval
      </label>
      <Select
        value={pollingInterval}
        onValueChange={handleChange}
      >
        <SelectTrigger
          id="polling-interval"
          className="w-[200px]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(POLLING_INTERVAL_LABELS) as PollingInterval[]).map((interval) => {
            const { label, description } = POLLING_INTERVAL_LABELS[interval];
            return (
              <SelectItem
                key={interval}
                value={interval}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground text-xs">{description}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <p className="mt-component-sm text-muted-foreground text-xs">
        Changes apply immediately to active statistics subscriptions
      </p>
    </div>
  );
});

PollingIntervalSelector.displayName = 'PollingIntervalSelector';

export { PollingIntervalSelector };
