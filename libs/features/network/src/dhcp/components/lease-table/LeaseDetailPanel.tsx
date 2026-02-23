/**
 * LeaseDetailPanel Component
 *
 * Displays detailed information about a DHCP lease in an expandable panel:
 * - Device information (MAC, Hostname, Vendor)
 * - Assignment details (IP, Server, Type, Status)
 * - Timing information (Expires, Last Seen)
 * - Quick actions (Make Static, Delete, Copy MAC)
 *
 * Renders in table row expansion (desktop) or bottom sheet (mobile).
 *
 * @module features/network/dhcp/components/lease-table
 */

import { memo, useState, useCallback } from 'react';
import { Lock, Trash2, Copy, Clock, Globe, Info } from 'lucide-react';
import type { DHCPLease } from '@nasnet/core/types';
import { formatMACAddress, formatExpirationTime } from '@nasnet/core/utils';
import { Button, Card, Icon } from '@nasnet/ui/primitives';
import { StatusBadge } from '@nasnet/ui/patterns';
import { cn } from '@nasnet/ui/utils';

export interface LeaseDetailPanelProps {
  /**
   * DHCP lease to display
   */
  lease: DHCPLease;

  /**
   * Callback when "Make Static" is clicked
   */
  onMakeStatic?: (leaseId: string) => void;

  /**
   * Callback when "Delete" is clicked
   */
  onDelete?: (leaseId: string) => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * LeaseDetailPanel Component
 *
 * Expandable detail view for a DHCP lease with all information
 * and quick action buttons.
 *
 * @example
 * ```tsx
 * <LeaseDetailPanel
 *   lease={lease}
 *   onMakeStatic={handleMakeStatic}
 *   onDelete={handleDelete}
 * />
 * ```
 */
function LeaseDetailPanelComponent({
  lease,
  onMakeStatic,
  onDelete,
  className,
}: LeaseDetailPanelProps) {
  const [copied, setCopied] = useState(false);

  /**
   * Copy MAC address to clipboard
   */
  const handleCopyMac = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(lease.macAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy MAC address:', err);
    }
  }, [lease.macAddress]);

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        {/* Device Information Section */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon icon={Globe} className="h-4 w-4" aria-hidden="true" />
            Device Information
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">MAC Address:</dt>
            <dd className="flex items-center gap-2 font-mono">
              {formatMACAddress(lease.macAddress)}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyMac}
                className="h-6 w-6 p-0"
                aria-label="Copy MAC address"
              >
                <Icon icon={Copy} className="h-3 w-3" aria-hidden="true" />
              </Button>
              {copied && (
                <span className="text-xs text-success">Copied!</span>
              )}
            </dd>

            <dt className="text-muted-foreground">Hostname:</dt>
            <dd className={cn(!lease.hostname && 'text-muted-foreground')}>
              {lease.hostname || 'Unknown'}
            </dd>

            <dt className="text-muted-foreground">Vendor:</dt>
            <dd className={cn(!(lease as any).vendor && 'text-muted-foreground')}>
              {(lease as any).vendor || 'Unknown'}
            </dd>
          </dl>
        </div>

        {/* Assignment Details Section */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon icon={Info} className="h-4 w-4" aria-hidden="true" />
            Assignment Details
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">IP Address:</dt>
            <dd className="font-mono font-medium">{lease.address}</dd>

            <dt className="text-muted-foreground">Server:</dt>
            <dd>{lease.server}</dd>

            <dt className="text-muted-foreground">Type:</dt>
            <dd>
              <StatusBadge status={lease.dynamic ? 'bound' : 'static'} />
            </dd>

            <dt className="text-muted-foreground">Status:</dt>
            <dd>
              <div className="flex items-center gap-2">
                <StatusBadge status={lease.status} />
                {lease.blocked && <StatusBadge status="stopped" />}
              </div>
            </dd>
          </dl>
        </div>

        {/* Timing Information Section */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon icon={Clock} className="h-4 w-4" aria-hidden="true" />
            Timing Information
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Expires:</dt>
            <dd>{formatExpirationTime(lease.expiresAfter)}</dd>

            <dt className="text-muted-foreground">Last Seen:</dt>
            <dd className={cn(!(lease as any).lastSeen && 'text-muted-foreground')}>
              {String((lease as any).lastSeen || 'Never')}
            </dd>
          </dl>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 border-t pt-4">
          <span className="text-sm font-medium text-muted-foreground">
            Quick Actions:
          </span>
          <div className="flex gap-2">
            {lease.dynamic && onMakeStatic && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMakeStatic(lease.id)}
                className="gap-2"
                aria-label="Make this lease static"
              >
                <Icon icon={Lock} className="h-3 w-3" aria-hidden="true" />
                Make Static
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(lease.id)}
                className="gap-2"
                aria-label="Delete this lease"
              >
                <Icon icon={Trash2} className="h-3 w-3" aria-hidden="true" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Export with memo wrapper and displayName
export const LeaseDetailPanel = memo(LeaseDetailPanelComponent);
LeaseDetailPanel.displayName = 'LeaseDetailPanel';
