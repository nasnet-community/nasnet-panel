/**
 * Recent Firewall Activity Component
 * @description Displays recent firewall events and activity logs. Shows empty state
 * when logging is not configured, and placeholder for future log integration.
 *
 * @example
 * <RecentFirewallActivity />
 * <RecentFirewallActivity className="mb-4" />
 *
 * Epic 0.6 Enhancement: Dashboard Overview
 */

import { memo } from 'react';
import { Icon } from '@nasnet/ui/primitives';
import { Activity, Info, CheckCircle } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';

export interface RecentFirewallActivityProps {
  /** CSS classes to apply to root element */
  className?: string;
}

/**
 * Recent Firewall Activity Component
 * Displays placeholder empty state until logging is configured.
 */
export const RecentFirewallActivity = memo(function RecentFirewallActivity({
  className,
}: RecentFirewallActivityProps) {
  // TODO: Integrate with firewall logs when logging feature is available
  const hasLogging = false;

  return (
    <div className={cn('bg-card border-border p-component-md rounded-xl border', className)}>
      <div className="mb-component-md flex items-center justify-between">
        <h3 className="text-foreground gap-component-sm flex items-center text-sm font-semibold">
          <Icon
            icon={Activity}
            className="text-muted-foreground h-4 w-4"
            aria-hidden="true"
          />
          Recent Activity
        </h3>
      </div>

      {!hasLogging ?
        <div className="py-6 text-center">
          <div className="bg-muted mb-component-md mx-auto flex h-10 w-10 items-center justify-center rounded-full">
            <Icon
              icon={Info}
              className="text-muted-foreground h-5 w-5"
              aria-hidden="true"
            />
          </div>
          <p className="text-foreground mb-component-xs text-sm font-medium">
            Logging Not Configured
          </p>
          <p className="text-muted-foreground text-xs">
            Enable firewall logging to see recent blocked connections and activity.
          </p>
        </div>
      : <div className="py-6 text-center">
          <div className="bg-success/10 mb-component-md mx-auto flex h-10 w-10 items-center justify-center rounded-full">
            <Icon
              icon={CheckCircle}
              className="text-success h-5 w-5"
              aria-hidden="true"
            />
          </div>
          <p className="text-foreground mb-component-xs text-sm font-medium">No Recent Activity</p>
          <p className="text-muted-foreground text-xs">
            No blocked connections detected in the last hour.
          </p>
        </div>
      }
    </div>
  );
});
RecentFirewallActivity.displayName = 'RecentFirewallActivity';
