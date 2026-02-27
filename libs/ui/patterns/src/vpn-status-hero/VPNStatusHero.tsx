/**
 * VPN Status Hero Component
 *
 * Large status card showing overall VPN health.
 * Based on UX Design - Direction 5: Status Hero.
 *
 * @example
 * ```tsx
 * <VPNStatusHero
 *   status="healthy"
 *   totalServers={3}
 *   totalClients={5}
 *   activeServerConnections={2}
 *   activeClientConnections={4}
 *   totalRx={1024000}
 *   totalTx={512000}
 * />
 * ```
 */

import { memo, forwardRef, useMemo } from 'react';

import {
  Shield,
  ShieldAlert,
  ShieldX,
  Loader2,
  Server,
  Monitor,
  Activity,
  ArrowDownUp,
} from 'lucide-react';

import { formatBytes } from '@nasnet/core/utils';
import { cn } from '@nasnet/ui/utils';
import { Card, CardContent } from '@nasnet/ui/primitives';

export type VPNHealthStatus = 'healthy' | 'warning' | 'critical' | 'loading';

export interface VPNStatusHeroProps {
  /** Overall VPN health status */
  status: VPNHealthStatus;
  /** Total server count */
  totalServers: number;
  /** Total client count */
  totalClients: number;
  /** Active server connections */
  activeServerConnections: number;
  /** Active client connections */
  activeClientConnections: number;
  /** Total bytes received */
  totalRx: number;
  /** Total bytes transmitted */
  totalTx: number;
  /** Number of warnings/issues */
  issueCount?: number;
  /** Custom className */
  className?: string;
}

/**
 * Get status configuration
 */
function getStatusConfig(status: VPNHealthStatus) {
  switch (status) {
    case 'healthy':
      return {
        Icon: Shield,
        title: 'Connected',
        subtitle: 'Your VPN is active and protected',
        bgClass: 'bg-card border border-border',
        iconBg: 'bg-success/10',
        textColor: 'text-foreground',
        mutedColor: 'text-muted-foreground',
        accentColor: 'text-success',
      };
    case 'warning':
      return {
        Icon: ShieldAlert,
        title: 'Attention Required',
        subtitle: 'Some VPN connections need attention',
        bgClass: 'bg-card border border-border',
        iconBg: 'bg-warning/10',
        textColor: 'text-foreground',
        mutedColor: 'text-muted-foreground',
        accentColor: 'text-warning',
      };
    case 'critical':
      return {
        Icon: ShieldX,
        title: 'Disconnected',
        subtitle: 'VPN connection is offline',
        bgClass: 'bg-card border border-border',
        iconBg: 'bg-error/10',
        textColor: 'text-foreground',
        mutedColor: 'text-muted-foreground',
        accentColor: 'text-error',
      };
    case 'loading':
      return {
        Icon: Loader2,
        title: 'Loading...',
        subtitle: 'Fetching VPN status',
        bgClass: 'bg-card border border-border',
        iconBg: 'bg-muted',
        textColor: 'text-foreground',
        mutedColor: 'text-muted-foreground',
        accentColor: 'text-muted-foreground',
      };
  }
}

/**
 * VPNStatusHero Component
 * Large hero card showing VPN infrastructure health
 */
function VPNStatusHeroComponent({
  status,
  totalServers,
  totalClients,
  activeServerConnections,
  activeClientConnections,
  totalRx,
  totalTx,
  issueCount = 0,
  className = '',
}: VPNStatusHeroProps) {
  const config = useMemo(() => getStatusConfig(status), [status]);
  const Icon = config.Icon;
  const isHealthy = status === 'healthy';
  const isLoading = status === 'loading';

  return (
    <Card
      className={cn(
        'overflow-hidden rounded-[var(--semantic-radius-card)] shadow-[var(--semantic-shadow-card)]',
        className
      )}
      role="status"
      aria-label={`VPN health: ${config.title}`}
    >
      <CardContent className={cn('p-0', config.bgClass)}>
        {/* Hero Section */}
        <div className="p-6 text-center sm:p-8">
          <div
            className={cn(
              'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full',
              config.iconBg,
              isHealthy && 'animate-pulse'
            )}
          >
            <Icon className={cn('h-8 w-8', config.accentColor, isLoading && 'animate-spin')} />
          </div>
          <h2 className={cn('font-display text-foreground mb-1 text-2xl font-bold')}>
            {config.title}
          </h2>
          <p className="text-muted-foreground text-sm">{config.subtitle}</p>
          {issueCount > 0 && status !== 'healthy' && (
            <p className="text-foreground mt-2 text-sm font-medium">
              {issueCount} {issueCount === 1 ? 'issue' : 'issues'} found
            </p>
          )}
        </div>

        {/* Stats Bar */}
        <div className="bg-muted border-border border-t px-6 py-4 sm:px-8">
          <div className="grid grid-cols-4 gap-4 text-center">
            {/* Servers */}
            <div className="flex flex-col items-center">
              <Server className="text-muted-foreground mb-1 h-5 w-5" />
              <p className="text-foreground text-xl font-bold">{totalServers}</p>
              <p className="text-muted-foreground text-xs">Servers</p>
            </div>

            {/* Clients */}
            <div className="flex flex-col items-center">
              <Monitor className="text-muted-foreground mb-1 h-5 w-5" />
              <p className="text-foreground text-xl font-bold">{totalClients}</p>
              <p className="text-muted-foreground text-xs">Clients</p>
            </div>

            {/* Active */}
            <div className="flex flex-col items-center">
              <Activity className="text-muted-foreground mb-1 h-5 w-5" />
              <p className="text-foreground text-xl font-bold">
                {activeServerConnections + activeClientConnections}
              </p>
              <p className="text-muted-foreground text-xs">Active</p>
            </div>

            {/* Traffic */}
            <div className="flex flex-col items-center">
              <ArrowDownUp className="text-muted-foreground mb-1 h-5 w-5" />
              <p className="text-foreground font-mono text-lg font-bold">
                {formatBytes(totalRx + totalTx)}
              </p>
              <p className="text-muted-foreground text-xs">Traffic</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const VPNStatusHero = memo(
  forwardRef<HTMLDivElement, VPNStatusHeroProps>((props, ref) => (
    <VPNStatusHeroComponent {...props} />
  ))
);

VPNStatusHero.displayName = 'VPNStatusHero';
