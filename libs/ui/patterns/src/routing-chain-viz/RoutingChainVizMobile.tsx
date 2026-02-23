import { memo } from 'react';
import {
  AlertCircle,
  Zap,
  Wifi,
  Globe,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
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

function StepIndicator({
  number,
  health,
}: {
  number: number;
  health: HopHealth;
}): JSX.Element {
  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0',
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
  const health = hop.healthy
    ? hop.latencyMs !== null && hop.latencyMs > 200
      ? 'degraded'
      : 'healthy'
    : 'unhealthy';

  return (
    <button
      onClick={() => onHopClick?.(hop)}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all',
        getHealthColor(health),
        onHopClick && 'active:scale-95',
        !onHopClick && 'cursor-default'
      )}
      disabled={!onHopClick}
      type="button"
      aria-label={`Hop ${number}: ${hop.serviceName}`}
    >
      <div className="flex items-start gap-3">
        <StepIndicator number={number} health={health} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">
              {hop.serviceName}
            </span>
            {hop.killSwitchActive && (
              <Zap className="w-4 h-4 text-warning flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono truncate mt-1">
            {hop.routingMark}
          </p>
          {showLatency && hop.latencyMs !== null && (
            <p className="text-xs mt-1">
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
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export const RoutingChainVizMobile = memo(
  function RoutingChainVizMobileComponent(props: RoutingChainVizPresenterProps) {
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
              <div className="min-w-0">
                <p className="font-semibold text-sm text-error">Error</p>
                <p className="text-sm text-muted-foreground break-words">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (loading) {
      return (
        <Card className={cn('w-full', className)}>
          <CardContent className="pt-6 space-y-3">
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
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm truncate">
                  {deviceLabel}
                </span>
                {!isActive && (
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground text-xs"
                  >
                    Inactive
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalHops} hop{totalHops !== 1 ? 's' : ''} • {state.healthyHops} healthy
              </p>
            </div>

            {/* Kill Switch Status */}
            {showKillSwitch && chain.killSwitchEnabled && (
              <div
                className={cn(
                  'flex items-center gap-2 p-2 rounded text-xs',
                  chain.killSwitchActive
                    ? 'bg-error/10 text-error'
                    : 'bg-warning/10 text-warning'
                )}
              >
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>
                  {chain.killSwitchActive
                    ? 'Kill Switch Activated'
                    : 'Kill Switch Ready'}
                </span>
              </div>
            )}

            {/* Device Node */}
            <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-primary bg-primary/5">
              <Wifi className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">
                  {chain.routingMode} Mode
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {deviceLabel}
                </p>
              </div>
            </div>

            {/* Timeline with Hops */}
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

              {/* Hops */}
              <div className="space-y-3 relative z-10">
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
            <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-success bg-success/5">
              <Globe className="w-4 h-4 text-success flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">Internet</p>
                <p className="text-xs text-muted-foreground">
                  Total latency: {totalLatency}
                </p>
              </div>
            </div>

            {/* Collapsible Stats */}
            {state.unhealthyHops > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted text-sm font-semibold">
                  <span>Chain Issues ({state.unhealthyHops})</span>
                  <ChevronDown className="w-4 h-4 transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-2">
                  {hops
                    .filter((h) => !h.healthy)
                    .map((hop) => (
                      <div
                        key={hop.id}
                        className="text-xs p-2 rounded bg-error/10 text-error"
                      >
                        <p className="font-semibold">{hop.serviceName}</p>
                        <p className="text-muted-foreground">
                          {hop.latencyMs === -1
                            ? 'Unreachable'
                            : 'Service unavailable'}
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
  }
);

RoutingChainVizMobile.displayName = 'RoutingChainVizMobile';
