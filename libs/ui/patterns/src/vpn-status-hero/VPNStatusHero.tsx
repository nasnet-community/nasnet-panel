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
        title: 'All Systems Protected',
        subtitle: 'Your VPN infrastructure is healthy',
        bgClass: 'bg-success',
        iconBg: 'bg-white/20',
        textColor: 'text-success-foreground',
        mutedColor: 'text-success-foreground/70',
      };
    case 'warning':
      return {
        Icon: ShieldAlert,
        title: 'Attention Required',
        subtitle: 'Some VPN connections need attention',
        bgClass: 'bg-warning',
        iconBg: 'bg-white/20',
        textColor: 'text-warning-foreground',
        mutedColor: 'text-warning-foreground/70',
      };
    case 'critical':
      return {
        Icon: ShieldX,
        title: 'Issues Detected',
        subtitle: 'VPN connections have errors',
        bgClass: 'bg-destructive',
        iconBg: 'bg-white/20',
        textColor: 'text-destructive-foreground',
        mutedColor: 'text-destructive-foreground/70',
      };
    case 'loading':
      return {
        Icon: Loader2,
        title: 'Loading...',
        subtitle: 'Fetching VPN status',
        bgClass: 'bg-muted',
        iconBg: 'bg-foreground/10',
        textColor: 'text-foreground',
        mutedColor: 'text-muted-foreground',
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
    <Card className={cn('overflow-hidden', className)} role="status" aria-label={`VPN health: ${config.title}`}>
      <CardContent className={cn('p-0', config.bgClass)}>
        {/* Hero Section */}
        <div className="p-6 pb-8 text-center">
          <div
            className={cn(
              'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center',
              config.iconBg,
              isHealthy && 'animate-pulse'
            )}
          >
            <Icon
              className={cn(
                'w-10 h-10',
                config.textColor,
                isLoading && 'animate-spin'
              )}
            />
          </div>
          <h2 className={cn('text-2xl font-bold mb-1', config.textColor)}>
            {config.title}
          </h2>
          <p className={config.mutedColor}>
            {config.subtitle}
          </p>
          {issueCount > 0 && status !== 'healthy' && (
            <p className={cn('mt-2 text-sm font-medium', config.textColor)}>
              {issueCount} {issueCount === 1 ? 'issue' : 'issues'} found
            </p>
          )}
        </div>

        {/* Stats Bar */}
        <div className="bg-black/10 backdrop-blur-sm px-6 py-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            {/* Servers */}
            <div className="flex flex-col items-center">
              <Server className={cn('w-5 h-5 mb-1', config.mutedColor)} />
              <p className={cn('text-xl font-bold', config.textColor)}>
                {totalServers}
              </p>
              <p className={cn('text-xs', config.mutedColor)}>
                Servers
              </p>
            </div>

            {/* Clients */}
            <div className="flex flex-col items-center">
              <Monitor className={cn('w-5 h-5 mb-1', config.mutedColor)} />
              <p className={cn('text-xl font-bold', config.textColor)}>
                {totalClients}
              </p>
              <p className={cn('text-xs', config.mutedColor)}>
                Clients
              </p>
            </div>

            {/* Active */}
            <div className="flex flex-col items-center">
              <Activity className={cn('w-5 h-5 mb-1', config.mutedColor)} />
              <p className={cn('text-xl font-bold', config.textColor)}>
                {activeServerConnections + activeClientConnections}
              </p>
              <p className={cn('text-xs', config.mutedColor)}>
                Active
              </p>
            </div>

            {/* Traffic */}
            <div className="flex flex-col items-center">
              <ArrowDownUp className={cn('w-5 h-5 mb-1', config.mutedColor)} />
              <p className={cn('text-lg font-bold', config.textColor)}>
                {formatBytes(totalRx + totalTx)}
              </p>
              <p className={cn('text-xs', config.mutedColor)}>
                Traffic
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const VPNStatusHero = memo(
  forwardRef<HTMLDivElement, VPNStatusHeroProps>(
    (props, ref) => <VPNStatusHeroComponent {...props} />
  )
);

VPNStatusHero.displayName = 'VPNStatusHero';
