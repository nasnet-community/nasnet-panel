import { memo } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Zap,
  Wifi,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, Badge, Skeleton } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type {
  RoutingChainVizPresenterProps,
  ChainHopData,
  HopHealth,
} from './types';

function getHealthColor(health: HopHealth): string {
  switch (health) {
    case 'healthy':
      return 'bg-success/10 border-success text-success';
    case 'degraded':
      return 'bg-warning/10 border-warning text-warning';
    case 'unhealthy':
      return 'bg-error/10 border-error text-error';
    default:
      return 'bg-muted/10 border-muted text-muted-foreground';
  }
}

function getHealthDotColor(health: HopHealth): string {
  switch (health) {
    case 'healthy':
      return 'bg-success';
    case 'degraded':
      return 'bg-warning';
    case 'unhealthy':
      return 'bg-error';
    default:
      return 'bg-muted-foreground';
  }
}

function HopNode({
  hop,
  showLatency,
  onHopClick,
}: {
  hop: ChainHopData;
  showLatency?: boolean;
  onHopClick?: (hop: ChainHopData) => void;
}): JSX.Element {
  const health = hop.healthy
    ? hop.latencyMs !== null && hop.latencyMs > 200
      ? 'degraded'
      : 'healthy'
    : 'unhealthy';

  return (
    <button
      onClick={() => onHopClick?.(hop)}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
        'hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        getHealthColor(health),
        !onHopClick && 'cursor-default hover:shadow-none active:scale-100'
      )}
      disabled={!onHopClick}
      type="button"
      aria-label={`${hop.serviceName} hop (order ${hop.order})`}
    >
      <div className="flex items-center gap-2">
        <div className={cn('w-3 h-3 rounded-full', getHealthDotColor(health))} />
        <span className="font-semibold text-sm">{hop.serviceName}</span>
        {hop.killSwitchActive && (
          <Zap className="w-4 h-4 text-warning" aria-label="Kill switch active" />
        )}
      </div>
      {showLatency && hop.latencyMs !== null && (
        <span className="text-xs opacity-75">
          {hop.latencyMs < 0 ? '✗' : `${Math.round(hop.latencyMs)}ms`}
        </span>
      )}
      <span className="text-xs opacity-60 font-mono">{hop.routingMark}</span>
    </button>
  );
}

function DeviceNode({
  deviceLabel,
  routingMode,
}: {
  deviceLabel: string;
  routingMode: string;
}): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-primary bg-primary/5">
      <Wifi className="w-5 h-5 text-primary" />
      <span className="font-semibold text-sm text-center">{deviceLabel}</span>
      <Badge variant="secondary" className="text-xs">
        {routingMode}
      </Badge>
    </div>
  );
}

function InternetNode(): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-success bg-success/5">
      <Globe className="w-5 h-5 text-success" />
      <span className="font-semibold text-sm">Internet</span>
    </div>
  );
}

function ConnectorArrow({
  latency,
  showLatency,
}: {
  latency: number | null;
  showLatency?: boolean;
}): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-1">
      <ArrowRight className="w-5 h-5 text-muted-foreground" />
      {showLatency && latency !== null && (
        <span className="text-xs text-muted-foreground">
          {latency < 0 ? '✗' : `${Math.round(latency)}ms`}
        </span>
      )}
    </div>
  );
}

function SkeletonHop(): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2 p-3">
      <Skeleton className="w-20 h-10 rounded" />
      <Skeleton className="w-16 h-4 rounded" />
    </div>
  );
}

export const RoutingChainVizDesktop = memo(
  function RoutingChainVizDesktopComponent(props: RoutingChainVizPresenterProps) {
    const {
      state,
      loading,
      error,
      compact,
      showLatency,
      showKillSwitch,
      onHopClick,
      className,
    } = props;

    if (error) {
      return (
        <Card className={cn('w-full', className)}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-error">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (loading) {
      return (
        <Card className={cn('w-full', className)}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <SkeletonHop />
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
              <SkeletonHop />
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
              <SkeletonHop />
            </div>
          </CardContent>
        </Card>
      );
    }

    const { chain, hops, totalHops, isActive, totalLatency, deviceLabel } = state;

    if (!chain) {
      return (
        <Card className={cn('w-full', className)}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No chain data</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={cn('w-full', className)}>
        <CardContent className={cn('pt-6', compact ? 'p-4' : 'p-6')}>
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Routing Chain</h3>
                <p className="text-xs text-muted-foreground">
                  {totalHops} hop{totalHops !== 1 ? 's' : ''} • Total latency:{' '}
                  {totalLatency}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isActive && (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    Inactive
                  </Badge>
                )}
                {state.unhealthyHops > 0 && (
                  <Badge variant="error">
                    {state.unhealthyHops} unhealthy
                  </Badge>
                )}
              </div>
            </div>

            {/* Kill Switch Status */}
            {showKillSwitch && chain.killSwitchEnabled && (
              <div
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg text-sm',
                  chain.killSwitchActive
                    ? 'bg-error/10 text-error border border-error/20'
                    : 'bg-warning/10 text-warning border border-warning/20'
                )}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {chain.killSwitchActive ? 'Kill Switch Activated' : 'Kill Switch Ready'}
                </span>
              </div>
            )}

            {/* Flow Diagram */}
            <div className="overflow-x-auto">
              <div className="flex items-center gap-3 min-w-min py-4 px-2">
                {/* Device */}
                <DeviceNode
                  deviceLabel={deviceLabel}
                  routingMode={chain.routingMode}
                />

                {/* Hops */}
                {hops.map((hop, index) => (
                  <div key={hop.id} className="flex items-center gap-3">
                    <ConnectorArrow latency={hop.latencyMs} showLatency={showLatency} />
                    <HopNode
                      hop={hop}
                      showLatency={showLatency}
                      onHopClick={onHopClick}
                    />
                  </div>
                ))}

                {/* Internet */}
                <div className="flex items-center gap-3">
                  <ConnectorArrow latency={null} showLatency={false} />
                  <InternetNode />
                </div>
              </div>
            </div>

            {/* Stats Footer */}
            <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
              <div>
                <span className="font-semibold text-foreground">
                  {state.healthyHops}
                </span>{' '}
                Healthy
              </div>
              <div>
                <span className="font-semibold text-foreground">
                  {state.unhealthyHops}
                </span>{' '}
                Unhealthy
              </div>
              <div className="ml-auto">
                <span className="font-semibold text-foreground">{totalLatency}</span> Total
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

RoutingChainVizDesktop.displayName = 'RoutingChainVizDesktop';
