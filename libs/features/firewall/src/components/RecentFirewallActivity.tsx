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
    <div
      className={cn('bg-card rounded-xl border border-border p-component-md', className)}
    >
      <div className="flex items-center justify-between mb-component-md">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-component-sm">
          <Icon
            icon={Activity}
            className="w-4 h-4 text-muted-foreground"
            aria-hidden="true"
          />
          Recent Activity
        </h3>
      </div>

      {!hasLogging ? (
        <div className="text-center py-6">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-component-md">
            <Icon
              icon={Info}
              className="w-5 h-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <p className="text-sm font-medium text-foreground mb-component-xs">
            Logging Not Configured
          </p>
          <p className="text-xs text-muted-foreground">
            Enable firewall logging to see recent blocked connections and activity.
          </p>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-component-md">
            <Icon
              icon={CheckCircle}
              className="w-5 h-5 text-success"
              aria-hidden="true"
            />
          </div>
          <p className="text-sm font-medium text-foreground mb-component-xs">
            No Recent Activity
          </p>
          <p className="text-xs text-muted-foreground">
            No blocked connections detected in the last hour.
          </p>
        </div>
      )}
    </div>
  );
});
RecentFirewallActivity.displayName = 'RecentFirewallActivity';

























