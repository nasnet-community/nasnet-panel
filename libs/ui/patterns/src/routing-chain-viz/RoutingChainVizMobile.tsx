import { memo } from 'react';
import { AlertCircle, Zap, Wifi, Globe, AlertTriangle, ChevronDown } from 'lucide-react';
import {
  Card,
  CardContent,
  Badge,
  Skeleton,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { RoutingChainVizPresenterProps, ChainHopData, HopHealth } from './types';

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

function StepIndicator({ number, health }: { number: number; health: HopHealth }): JSX.Element {
  return (
    <div
      className={cn(
        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold',
        getHealthDotColor(health),
        'bg-opacity-20'
      )}
    >
      {number}
    </div>
  );
}

function HopStep({
  hop,
  number,
  showLatency,
  onHopClick,
}: {
  hop: ChainHopData;
  number: number;
  showLatency?: boolean;
  onHopClick?: (hop: ChainHopData) => void;
}): JSX.Element {
  const health =
    hop.healthy ?
      hop.latencyMs !== null && hop.latencyMs > 200 ?
        'degraded'
      : 'healthy'
    : 'unhealthy';

  return (
    <button
      onClick={() => onHopClick?.(hop)}
      className={cn(
        'w-full rounded-lg border p-3 text-left transition-all',
        getHealthColor(health),
        onHopClick && 'active:scale-95',
        !onHopClick && 'cursor-default'
      )}
      disabled={!onHopClick}
      type="button"
      aria-label={`Hop ${number}: ${hop.serviceName}`}
    >
      <div className="flex items-start gap-3">
        <StepIndicator
          number={number}
          health={health}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{hop.serviceName}</span>
            {hop.killSwitchActive && <Zap className="text-warning h-4 w-4 flex-shrink-0" />}
          </div>
          <p className="text-muted-foreground mt-1 truncate font-mono text-xs">{hop.routingMark}</p>
          {showLatency && hop.latencyMs !== null && (
            <p className="mt-1 text-xs">
              {hop.latencyMs < 0 ? 'Unreachable' : `Latency: ${Math.round(hop.latencyMs)}ms`}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function SkeletonStep(): JSX.Element {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export const RoutingChainVizMobile = memo(function RoutingChainVizMobileComponent(
  props: RoutingChainVizPresenterProps
) {
  const { state, loading, error, compact, showLatency, showKillSwitch, onHopClick, className } =
    props;

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-error mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-error text-sm font-semibold">Error</p>
              <p className="text-muted-foreground break-words text-sm">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="space-y-3 pt-6">
          <SkeletonStep />
          <SkeletonStep />
          <SkeletonStep />
        </CardContent>
      </Card>
    );
  }

  const { chain, hops, totalHops, isActive, totalLatency, deviceLabel } = state;

  if (!chain) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">No chain data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className={cn('pt-6', compact ? 'p-4' : 'p-6')}>
        <div className="space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wifi className="text-primary h-4 w-4" />
              <span className="truncate text-sm font-semibold">{deviceLabel}</span>
              {!isActive && (
                <Badge
                  variant="secondary"
                  className="bg-muted text-muted-foreground text-xs"
                >
                  Inactive
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {totalHops} hop{totalHops !== 1 ? 's' : ''} • {state.healthyHops} healthy
            </p>
          </div>

          {/* Kill Switch Status */}
          {showKillSwitch && chain.killSwitchEnabled && (
            <div
              className={cn(
                'flex items-center gap-2 rounded p-2 text-xs',
                chain.killSwitchActive ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
              )}
            >
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              <span>{chain.killSwitchActive ? 'Kill Switch Activated' : 'Kill Switch Ready'}</span>
            </div>
          )}

          {/* Device Node */}
          <div className="border-primary bg-primary/5 flex items-center gap-3 rounded-lg border-2 p-3">
            <Wifi className="text-primary h-4 w-4 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{chain.routingMode} Mode</p>
              <p className="text-muted-foreground truncate text-xs">{deviceLabel}</p>
            </div>
          </div>

          {/* Timeline with Hops */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="bg-border absolute bottom-0 left-4 top-0 w-0.5" />

            {/* Hops */}
            <div className="relative z-10 space-y-3">
              {hops.map((hop, index) => (
                <HopStep
                  key={hop.id}
                  hop={hop}
                  number={index + 1}
                  showLatency={showLatency}
                  onHopClick={onHopClick}
                />
              ))}
            </div>
          </div>

          {/* Internet Destination */}
          <div className="border-success bg-success/5 flex items-center gap-3 rounded-lg border-2 p-3">
            <Globe className="text-success h-4 w-4 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">Internet</p>
              <p className="text-muted-foreground text-xs">Total latency: {totalLatency}</p>
            </div>
          </div>

          {/* Collapsible Stats */}
          {state.unhealthyHops > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="bg-muted/50 hover:bg-muted flex w-full items-center justify-between rounded-lg p-3 text-sm font-semibold">
                <span>Chain Issues ({state.unhealthyHops})</span>
                <ChevronDown className="h-4 w-4 transition-transform" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-3">
                {hops
                  .filter((h) => !h.healthy)
                  .map((hop) => (
                    <div
                      key={hop.id}
                      className="bg-error/10 text-error rounded p-2 text-xs"
                    >
                      <p className="font-semibold">{hop.serviceName}</p>
                      <p className="text-muted-foreground">
                        {hop.latencyMs === -1 ? 'Unreachable' : 'Service unavailable'}
                      </p>
                    </div>
                  ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

RoutingChainVizMobile.displayName = 'RoutingChainVizMobile';
