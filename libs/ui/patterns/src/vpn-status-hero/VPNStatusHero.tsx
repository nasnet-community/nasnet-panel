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
    <Card className={cn('overflow-hidden rounded-[var(--semantic-radius-card)] shadow-[var(--semantic-shadow-card)]', className)} role="status" aria-label={`VPN health: ${config.title}`}>
      <CardContent className={cn('p-0', config.bgClass)}>
        {/* Hero Section */}
        <div className="p-6 sm:p-8 text-center">
          <div
            className={cn(
              'h-16 w-16 mx-auto mb-4 rounded-full flex items-center justify-center',
              config.iconBg,
              isHealthy && 'animate-pulse'
            )}
          >
            <Icon
              className={cn(
                'h-8 w-8',
                config.accentColor,
                isLoading && 'animate-spin'
              )}
            />
          </div>
          <h2 className={cn('text-2xl font-bold font-display mb-1 text-foreground')}>
            {config.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {config.subtitle}
          </p>
          {issueCount > 0 && status !== 'healthy' && (
            <p className="mt-2 text-sm font-medium text-foreground">
              {issueCount} {issueCount === 1 ? 'issue' : 'issues'} found
            </p>
          )}
        </div>

        {/* Stats Bar */}
        <div className="bg-muted border-t border-border px-6 sm:px-8 py-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            {/* Servers */}
            <div className="flex flex-col items-center">
              <Server className="h-5 w-5 mb-1 text-muted-foreground" />
              <p className="text-xl font-bold text-foreground">
                {totalServers}
              </p>
              <p className="text-xs text-muted-foreground">
                Servers
              </p>
            </div>

            {/* Clients */}
            <div className="flex flex-col items-center">
              <Monitor className="h-5 w-5 mb-1 text-muted-foreground" />
              <p className="text-xl font-bold text-foreground">
                {totalClients}
              </p>
              <p className="text-xs text-muted-foreground">
                Clients
              </p>
            </div>

            {/* Active */}
            <div className="flex flex-col items-center">
              <Activity className="h-5 w-5 mb-1 text-muted-foreground" />
              <p className="text-xl font-bold text-foreground">
                {activeServerConnections + activeClientConnections}
              </p>
              <p className="text-xs text-muted-foreground">
                Active
              </p>
            </div>

            {/* Traffic */}
            <div className="flex flex-col items-center">
              <ArrowDownUp className="h-5 w-5 mb-1 text-muted-foreground" />
              <p className="text-lg font-bold font-mono text-foreground">
                {formatBytes(totalRx + totalTx)}
              </p>
              <p className="text-xs text-muted-foreground">
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
