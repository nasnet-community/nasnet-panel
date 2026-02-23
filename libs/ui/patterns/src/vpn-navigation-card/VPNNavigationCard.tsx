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
      bgGradient: 'from-secondary/10 to-secondary/5 dark:from-secondary/20 dark:to-secondary/10',
      borderColor: 'border-secondary/30',
      iconColor: 'text-secondary',
    };
  }
  return {
    Icon: Monitor,
    title: 'VPN Clients',
    description: 'Manage outgoing VPN connections',
    bgGradient: 'from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10',
    borderColor: 'border-primary/30',
    iconColor: 'text-primary',
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
        'cursor-pointer overflow-hidden transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-1',
        `border ${config.borderColor}`,
        className
      )}
      onClick={handleClick}
      role="button"
      aria-label={`Navigate to ${config.title}`}
    >
      <CardContent className={cn('p-0 bg-gradient-to-br', config.bgGradient)}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm">
              <Icon className={cn('w-6 h-6', config.iconColor)} />
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-1">
            {config.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {config.description}
          </p>

          <div className="flex items-center gap-4">
            <div>
              <p className="text-2xl font-bold text-foreground">{count}</p>
              <p className="text-xs text-muted-foreground">
                {count === 1 ? 'Configured' : 'Configured'}
              </p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-2xl font-bold text-success">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const VPNNavigationCard = React.memo(
  forwardRef<HTMLDivElement, VPNNavigationCardProps>(
    (props, ref) => <VPNNavigationCardComponent {...props} />
  )
);

VPNNavigationCard.displayName = 'VPNNavigationCard';

