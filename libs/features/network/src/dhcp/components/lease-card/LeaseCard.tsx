/**
 * LeaseCard Mobile Component
 *
 * Mobile-optimized card for displaying DHCP lease information.
 * Follows the Headless + Platform Presenter pattern (ADR-018).
 * Part of NAS-6.11: DHCP Lease Management
 *
 * Features:
 * - 44px minimum touch targets (WCAG AAA)
 * - Tap-to-expand for full details
 * - Swipe actions: Make Static (right), Delete (left)
 * - New lease badge with pulse animation
 * - Bottom sheet for expanded details
 *
 * @module @nasnet/features/network/dhcp/lease-card
 */

import * as React from 'react';
import { ChevronDown, Trash2, Pin, X } from 'lucide-react';

import type { DHCPLease } from '@nasnet/core/types';
import { formatMACAddress, formatExpirationTime } from '@nasnet/core/utils';
import {
  cn,
  Badge,
  Card,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  Icon,
} from '@nasnet/ui/primitives';
import { StatusBadge } from '@nasnet/ui/patterns';

export interface LeaseCardProps {
  /** DHCP lease data */
  lease: DHCPLease;

  /** Whether this is a newly detected lease (shows "New" badge) */
  isNew?: boolean;

  /** Called when Make Static is triggered */
  onMakeStatic?: (lease: DHCPLease) => void;

  /** Called when Delete is triggered */
  onDelete?: (lease: DHCPLease) => void;

  /** Called when card is tapped */
  onClick?: (lease: DHCPLease) => void;

  /** Additional CSS classes */
  className?: string;

  /** Unique ID for accessibility */
  id?: string;
}

/**
 * LeaseCard Mobile Component
 *
 * Displays DHCP lease information in a mobile-optimized card format.
 * Includes swipe gestures and expandable detail view.
 *
 * @param props - Component props
 */
export const LeaseCard = React.memo(function LeaseCard({
  lease,
  isNew = false,
  onMakeStatic,
  onDelete,
  onClick,
  className,
  id,
}: LeaseCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [swipeOffset, setSwipeOffset] = React.useState(0);
  const [swipeDirection, setSwipeDirection] = React.useState<'left' | 'right' | null>(null);
  const touchStartX = React.useRef(0);
  const touchCurrentX = React.useRef(0);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Format expiration time
  const expiration = formatExpirationTime(lease.expiresAfter);
  const isStatic = !lease.dynamic;

  // Handle touch start
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  }, []);

  // Handle touch move (swipe)
  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;

    // Limit swipe distance to 80px
    const limitedDiff = Math.max(-80, Math.min(80, diff));
    setSwipeOffset(limitedDiff);

    // Determine swipe direction
    if (Math.abs(limitedDiff) > 20) {
      setSwipeDirection(limitedDiff > 0 ? 'right' : 'left');
    }
  }, []);

  // Handle touch end
  const handleTouchEnd = React.useCallback(() => {
    // Trigger action if swiped far enough (>60px)
    if (Math.abs(swipeOffset) > 60) {
      if (swipeDirection === 'right' && onMakeStatic && !isStatic) {
        onMakeStatic(lease);
      } else if (swipeDirection === 'left' && onDelete) {
        onDelete(lease);
      }
    }

    // Reset swipe state
    setSwipeOffset(0);
    setSwipeDirection(null);
  }, [swipeOffset, swipeDirection, lease, onMakeStatic, onDelete, isStatic]);

  // Handle card tap (not swipe)
  const handleCardClick = React.useCallback(() => {
    // Only trigger if not swiping
    if (Math.abs(swipeOffset) < 5) {
      setIsExpanded(true);
      onClick?.(lease);
    }
  }, [swipeOffset, lease, onClick]);

  // ARIA label for accessibility
  const ariaLabel = `DHCP lease ${lease.address}, MAC ${formatMACAddress(lease.macAddress)}, ${
    lease.hostname || 'Unknown hostname'
  }, status ${lease.status}, expires ${expiration}`;

  return (
    <>
      {/* Swipe action background indicators */}
      <div className="relative overflow-hidden">
        {/* Right swipe: Make Static */}
        {swipeDirection === 'right' && !isStatic && (
          <div
            className={cn(
              'absolute bottom-0 left-0 top-0 flex items-center justify-start px-4',
              'bg-primary text-foreground',
              'transition-opacity',
              Math.abs(swipeOffset) > 60 ? 'opacity-100' : 'opacity-60'
            )}
            style={{ width: Math.abs(swipeOffset) }}
            aria-hidden="true"
          >
            <Icon
              icon={Pin}
              size="md"
              className="text-foreground"
            />
          </div>
        )}

        {/* Left swipe: Delete */}
        {swipeDirection === 'left' && (
          <div
            className={cn(
              'absolute bottom-0 right-0 top-0 flex items-center justify-end px-4',
              'bg-error/20 text-foreground',
              'transition-opacity',
              Math.abs(swipeOffset) > 60 ? 'opacity-100' : 'opacity-60'
            )}
            style={{ width: Math.abs(swipeOffset) }}
            aria-hidden="true"
          >
            <Icon
              icon={Trash2}
              size="md"
              className="text-foreground"
            />
          </div>
        )}

        {/* Main card */}
        <Card
          ref={cardRef}
          id={id}
          role="listitem"
          aria-label={ariaLabel}
          className={cn(
            'border-border rounded-none border-b last:border-b-0',
            'hover:bg-accent/50 active:bg-accent',
            'transition-all duration-200',
            className
          )}
          style={{ transform: `translateX(${swipeOffset}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={handleCardClick}
            className={cn(
              'w-full px-4 py-3 text-left',
              'flex items-start gap-3',
              'min-h-[44px]', // WCAG AAA touch target
              'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
            )}
          >
            {/* Icon/Avatar */}
            <div
              className={cn(
                'flex-shrink-0',
                'flex items-center justify-center',
                'h-10 w-10 rounded-full',
                'bg-primary/10 text-primary',
                'font-mono text-sm font-semibold'
              )}
              aria-hidden="true"
            >
              {lease.address.split('.').pop()}
            </div>

            {/* Lease info */}
            <div className="min-w-0 flex-1">
              {/* Top row: IP + New badge */}
              <div className="gap-component-sm mb-component-xs flex items-center">
                <span className="truncate font-mono text-base font-semibold">{lease.address}</span>
                {isNew && (
                  <Badge
                    variant="info"
                    pulse
                    className={cn(
                      'px-1.5 py-0 text-xs',
                      '@media (prefers-reduced-motion: reduce)',
                      'animate-none'
                    )}
                  >
                    New
                  </Badge>
                )}
              </div>

              {/* Middle row: Hostname */}
              <div className="text-muted-foreground mb-component-xs truncate text-sm">
                {lease.hostname || 'Unknown'}
              </div>

              {/* Bottom row: MAC + Status */}
              <div className="gap-component-sm flex flex-wrap items-center">
                <span className="text-muted-foreground font-mono text-xs">
                  {formatMACAddress(lease.macAddress)}
                </span>
                <StatusBadge status={isStatic ? 'static' : lease.status} />
              </div>
            </div>

            {/* Expand indicator */}
            <Icon
              icon={ChevronDown}
              size="md"
              className={cn('text-muted-foreground', 'transition-transform duration-200')}
            />
          </button>
        </Card>
      </div>

      {/* Bottom sheet for expanded details */}
      <Sheet
        open={isExpanded}
        onOpenChange={setIsExpanded}
      >
        <SheetContent
          side="bottom"
          className="h-[80vh]"
        >
          <SheetHeader>
            <SheetTitle>{lease.address}</SheetTitle>
            <SheetDescription>{lease.hostname || 'Unknown hostname'}</SheetDescription>
          </SheetHeader>

          {/* Detailed info */}
          <div className="mt-component-lg space-y-component-md">
            {/* Status card */}
            <div className="gap-component-md grid grid-cols-2">
              <div>
                <div className="text-muted-foreground mb-component-xs text-xs">Status</div>
                <StatusBadge status={isStatic ? 'static' : lease.status} />
              </div>
              <div>
                <div className="text-muted-foreground mb-component-xs text-xs">Expires</div>
                <div className="text-sm font-medium">{expiration}</div>
              </div>
            </div>

            {/* Network info */}
            <div className="space-y-component-md">
              <div>
                <div className="text-muted-foreground mb-component-xs text-xs">IP Address</div>
                <div className="font-mono text-sm">{lease.address}</div>
              </div>

              <div>
                <div className="text-muted-foreground mb-component-xs text-xs">MAC Address</div>
                <div className="font-mono text-sm">{formatMACAddress(lease.macAddress)}</div>
              </div>

              {lease.clientId && (
                <div>
                  <div className="text-muted-foreground mb-component-xs text-xs">Client ID</div>
                  <div className="font-mono text-sm">{lease.clientId}</div>
                </div>
              )}

              <div>
                <div className="text-muted-foreground mb-component-xs text-xs">DHCP Server</div>
                <div className="text-sm">{lease.server}</div>
              </div>

              {lease.lastSeen && (
                <div>
                  <div className="text-muted-foreground mb-component-xs text-xs">Last Seen</div>
                  <div className="text-sm">{new Date(lease.lastSeen).toLocaleString()}</div>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="pt-component-md space-y-component-sm">
              {!isStatic && onMakeStatic && (
                <Button
                  variant="outline"
                  size="lg"
                  className="min-h-[44px] w-full"
                  onClick={() => {
                    onMakeStatic(lease);
                    setIsExpanded(false);
                  }}
                >
                  <Icon
                    icon={Pin}
                    size="sm"
                    className="mr-component-sm"
                  />
                  Make Static
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  size="lg"
                  className="min-h-[44px] w-full"
                  onClick={() => {
                    onDelete(lease);
                    setIsExpanded(false);
                  }}
                >
                  <Icon
                    icon={Trash2}
                    size="sm"
                    className="mr-component-sm"
                  />
                  Delete Lease
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
});

LeaseCard.displayName = 'LeaseCard';
