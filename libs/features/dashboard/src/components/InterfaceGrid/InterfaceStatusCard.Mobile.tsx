/**
 * InterfaceStatusCard Mobile Presenter
 *
 * Mobile-optimized compact card for interface status.
 * Features:
 * - Minimum 44px touch targets (WCAG AAA)
 * - Simplified single-row layout
 * - Combined traffic display
 * - Touch feedback
 */

import { Card, CardContent } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/primitives';
import { InterfaceTypeIcon } from '@nasnet/ui/patterns/network-inputs/interface-selector';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useInterfaceStatusCard } from './useInterfaceStatusCard';
import { formatTrafficRate } from './utils';
import type { InterfaceStatusCardProps, InterfaceStatus } from './types';

// Status configuration - same as Desktop but for mobile
const STATUS_CONFIG: Record<
  InterfaceStatus,
  {
    icon: LucideIcon;
    label: string;
    bgClass: string;
    iconClass: string;
  }
> = {
  up: {
    icon: CheckCircle2,
    label: 'Up',
    bgClass: 'bg-success/10 dark:bg-success/20',
    iconClass: 'text-success',
  },
  down: {
    icon: XCircle,
    label: 'Down',
    bgClass: 'bg-destructive/10 dark:bg-destructive/20',
    iconClass: 'text-destructive',
  },
  disabled: {
    icon: MinusCircle,
    label: 'Disabled',
    bgClass: 'bg-muted',
    iconClass: 'text-muted-foreground',
  },
};

/**
 * Mobile presenter for InterfaceStatusCard.
 * Optimized for touch interaction with minimum 44px touch targets.
 */
export function InterfaceStatusCardMobile({
  interface: iface,
  onSelect,
  className,
}: InterfaceStatusCardProps) {
  const {
    handleClick,
    handleKeyDown,
    isStatusChanged,
    prefersReducedMotion,
    ariaLabel,
    detailsId,
  } = useInterfaceStatusCard({ interface: iface, onSelect });

  const status = STATUS_CONFIG[iface.status];
  const StatusIcon = status.icon;

  return (
    <Card
      role="article"
      aria-label={ariaLabel}
      aria-describedby={detailsId}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'cursor-pointer transition-all min-h-[44px]', // 44px touch target
        'active:bg-accent', // Touch feedback
        'focus:outline-none focus:ring-3 focus:ring-primary focus:ring-offset-2',
        status.bgClass,
        !prefersReducedMotion && isStatusChanged && 'animate-pulse',
        className
      )}
    >
      <CardContent className="p-3">
        {/* Compact header: Icon + Name + Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <InterfaceTypeIcon
              type={iface.type}
              className="h-4 w-4 shrink-0"
            />
            <span className="font-medium text-sm truncate">{iface.name}</span>
          </div>
          <StatusIcon
            className={cn('h-4 w-4 shrink-0', status.iconClass)}
            aria-hidden="true"
          />
        </div>

        {/* Combined traffic on single line */}
        <div className="text-xs text-muted-foreground mt-1">
          ↑{formatTrafficRate(iface.txRate)} ↓{formatTrafficRate(iface.rxRate)}
        </div>

        {/* IP address if available */}
        {iface.ip && (
          <div className="text-xs font-mono text-muted-foreground mt-0.5 truncate">
            {iface.ip}
          </div>
        )}

        {/* Screen reader details */}
        <span id={detailsId} className="sr-only">
          Status {status.label}, TX: {formatTrafficRate(iface.txRate)}, RX:{' '}
          {formatTrafficRate(iface.rxRate)}
        </span>
      </CardContent>
    </Card>
  );
}
