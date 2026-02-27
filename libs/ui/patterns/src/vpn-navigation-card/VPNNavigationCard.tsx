/**
 * VPN Navigation Card Component
 * Card links for navigating to Server/Client pages
 * Based on UX Design - Direction 2: Card-Heavy Dashboard
 *
 * @example
 * ```tsx
 * <VPNNavigationCard
 *   type="server"
 *   count={4}
 *   activeCount={3}
 *   onClick={() => navigate('/vpn/servers')}
 * />
 * ```
 */

import * as React from 'react';
import { forwardRef, useCallback } from 'react';

import { Server, Monitor, ChevronRight } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import { Card, CardContent } from '@nasnet/ui/primitives';

export interface VPNNavigationCardProps {
  /** Card type - server or client */
  type: 'server' | 'client';
  /** Total count */
  count: number;
  /** Active count */
  activeCount: number;
  /** Click handler */
  onClick: () => void;
  /** Custom className */
  className?: string;
}

/**
 * Get type configuration
 */
function getTypeConfig(type: 'server' | 'client') {
  if (type === 'server') {
    return {
      Icon: Server,
      title: 'VPN Servers',
      description: 'Manage your VPN server configurations',
      iconColor: 'text-category-vpn',
    };
  }
  return {
    Icon: Monitor,
    title: 'VPN Clients',
    description: 'Manage outgoing VPN connections',
    iconColor: 'text-category-vpn',
  };
}

/**
 * VPNNavigationCard Component
 * Clickable card for navigating to server/client management
 */
function VPNNavigationCardComponent({
  type,
  count,
  activeCount,
  onClick,
  className = '',
}: VPNNavigationCardProps) {
  const config = getTypeConfig(type);
  const Icon = config.Icon;

  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  return (
    <Card
      className={cn(
        'bg-card border-border cursor-pointer rounded-[var(--semantic-radius-card)] border transition-colors duration-150',
        'hover:bg-muted',
        'sm:min-h-auto min-h-[44px]',
        className
      )}
      onClick={handleClick}
      role="button"
      aria-label={`Navigate to ${config.title}`}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4 sm:gap-6">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="bg-category-vpn/10 flex h-8 w-8 items-center justify-center rounded-[var(--semantic-radius-button)] sm:h-10 sm:w-10">
              <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', config.iconColor)} />
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground truncate text-sm font-semibold sm:text-lg">
              {config.title}
            </h3>
            <p className="text-muted-foreground hidden truncate text-xs sm:block sm:text-sm">
              {config.description}
            </p>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0">
            <ChevronRight className="text-muted-foreground h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const VPNNavigationCard = React.memo(
  forwardRef<HTMLDivElement, VPNNavigationCardProps>((props, ref) => (
    <VPNNavigationCardComponent {...props} />
  ))
);

VPNNavigationCard.displayName = 'VPNNavigationCard';
