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
import { ChevronDown, Trash2, Pin } from 'lucide-react';

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
              'absolute left-0 top-0 bottom-0 flex items-center justify-start px-4',
              'bg-accent text-accent-foreground',
              'transition-opacity',
              Math.abs(swipeOffset) > 60 ? 'opacity-100' : 'opacity-60'
            )}
            style={{ width: Math.abs(swipeOffset) }}
          >
            <Pin className="h-5 w-5" />
          </div>
        )}

        {/* Left swipe: Delete */}
        {swipeDirection === 'left' && (
          <div
            className={cn(
              'absolute right-0 top-0 bottom-0 flex items-center justify-end px-4',
              'bg-error/20 text-error-dark',
              'transition-opacity',
              Math.abs(swipeOffset) > 60 ? 'opacity-100' : 'opacity-60'
            )}
            style={{ width: Math.abs(swipeOffset) }}
          >
            <Trash2 className="h-5 w-5" />
          </div>
        )}

        {/* Main card */}
        <Card
          ref={cardRef}
          id={id}
          role="listitem"
          aria-label={ariaLabel}
          className={cn(
            'border-b border-border last:border-b-0 rounded-none',
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
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
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
            <div className="flex-1 min-w-0">
              {/* Top row: IP + New badge */}
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-base truncate">
                  {lease.address}
                </span>
                {isNew && (
                  <Badge
                    variant="info"
                    pulse
                    className={cn(
                      'text-xs px-1.5 py-0',
                      '@media (prefers-reduced-motion: reduce)',
                      'animate-none'
                    )}
                  >
                    New
                  </Badge>
                )}
              </div>

              {/* Middle row: Hostname */}
              <div className="text-sm text-muted-foreground truncate mb-1">
                {lease.hostname || 'Unknown'}
              </div>

              {/* Bottom row: MAC + Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">
                  {formatMACAddress(lease.macAddress)}
                </span>
                <StatusBadge status={isStatic ? 'static' : lease.status} />
              </div>
            </div>

            {/* Expand indicator */}
            <ChevronDown
              className={cn(
                'h-5 w-5 text-muted-foreground flex-shrink-0 mt-1',
                'transition-transform duration-200'
              )}
              aria-hidden="true"
            />
          </button>
        </Card>
      </div>

      {/* Bottom sheet for expanded details */}
      <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{lease.address}</SheetTitle>
            <SheetDescription>
              {lease.hostname || 'Unknown hostname'}
            </SheetDescription>
          </SheetHeader>

          {/* Detailed info */}
          <div className="mt-6 space-y-4">
            {/* Status card */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <StatusBadge status={isStatic ? 'static' : lease.status} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Expires</div>
                <div className="text-sm font-medium">{expiration}</div>
              </div>
            </div>

            {/* Network info */}
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">IP Address</div>
                <div className="text-sm font-mono">{lease.address}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">MAC Address</div>
                <div className="text-sm font-mono">{formatMACAddress(lease.macAddress)}</div>
              </div>

              {lease.clientId && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Client ID</div>
                  <div className="text-sm font-mono">{lease.clientId}</div>
                </div>
              )}

              <div>
                <div className="text-xs text-muted-foreground mb-1">DHCP Server</div>
                <div className="text-sm">{lease.server}</div>
              </div>

              {lease.lastSeen && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Last Seen</div>
                  <div className="text-sm">
                    {new Date(lease.lastSeen).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="pt-4 space-y-2">
              {!isStatic && onMakeStatic && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full min-h-[44px]"
                  onClick={() => {
                    onMakeStatic(lease);
                    setIsExpanded(false);
                  }}
                >
                  <Pin className="h-4 w-4 mr-2" />
                  Make Static
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  size="lg"
                  className="w-full min-h-[44px]"
                  onClick={() => {
                    onDelete(lease);
                    setIsExpanded(false);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
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
