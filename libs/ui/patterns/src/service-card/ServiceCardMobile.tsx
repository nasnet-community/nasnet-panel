/**
 * ServiceCard Mobile Presenter
 *
 * Mobile-optimized presenter for ServiceCard pattern.
 * Optimized for touch interaction with 44px minimum targets.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { Badge, Button, Card, CardContent } from '@nasnet/ui/primitives';

import { ResourceUsageBar } from '../resource-usage-bar';
import { ServiceHealthBadge } from '../service-health-badge';
import { useServiceCard, formatBytes } from './useServiceCard';

import type { ServiceCardProps } from './types';

/**
 * Mobile presenter for ServiceCard
 *
 * Features:
 * - Large touch targets (44px minimum WCAG AAA)
 * - Single column stacked layout
 * - Primary action as full-width button
 * - Semantic tokens and mono font for technical data
 */
export function ServiceCardMobile(props: ServiceCardProps) {
  const { service, className, children } = props;
  const {
    status,
    isRunning,
    statusColor,
    statusLabel,
    categoryColor,
    primaryAction,
    hasMetrics,
    cpuUsage,
    memoryUsage,
    networkRx,
    networkTx,
    handleClick,
    handlePrimaryAction,
  } = useServiceCard(props);

  return (
    <Card
      className={`bg-card border-border p-component-md touch-manipulation rounded-[var(--semantic-radius-card)] border shadow-[var(--semantic-shadow-card)] transition-shadow duration-200 hover:shadow-lg ${className || ''} `.trim()}
      onClick={handleClick}
      role="article"
      aria-label={`${service.name} - ${statusLabel}`}
    >
      <CardContent className="space-y-component-md p-0">
        {/* Header row with status - 44px minimum touch target */}
        <div className="flex min-h-[44px] items-center justify-between">
          <div className="gap-component-sm flex min-w-0 flex-1 items-center">
            {/* Service icon with category background */}
            {service.icon && (
              <div
                className={`bg-category-vpn/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg`}
              >
                {service.icon}
              </div>
            )}

            {/* Service name and version */}
            <div className="min-w-0 flex-1">
              <span className="text-foreground block truncate text-lg font-semibold">
                {service.name}
              </span>
              {service.version && (
                <span className="text-muted-foreground font-mono text-xs">v{service.version}</span>
              )}
            </div>
          </div>

          {/* Status badge with health indicator */}
          <div className="ml-component-sm relative shrink-0">
            <ServiceHealthBadge />
          </div>
        </div>

        {/* Category label */}
        <div className="gap-component-sm flex items-center">
          <span className="text-muted-foreground text-xs">Category:</span>
          <span className={`text-xs font-medium ${categoryColor}`}>
            {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
          </span>
        </div>

        {/* Resource usage bar (for running instances with memory limits) */}
        {isRunning &&
          service.metrics?.currentMemory !== undefined &&
          service.metrics?.memoryLimit !== undefined && (
            <ResourceUsageBar
              used={service.metrics.currentMemory}
              total={service.metrics.memoryLimit}
              unit="MB"
              className="my-component-sm"
            />
          )}

        {/* Description if present */}
        {service.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">{service.description}</p>
        )}

        {/* Resource metrics grid (mono font for technical data) */}
        {hasMetrics && (
          <div className="gap-component-sm p-component-md bg-muted/50 grid grid-cols-2 rounded-[var(--semantic-radius-input)]">
            {cpuUsage !== undefined && (
              <div className="text-center">
                <div className="text-muted-foreground font-mono text-xs">CPU</div>
                <div className="text-foreground font-mono text-sm font-medium">
                  {cpuUsage.toFixed(1)}%
                </div>
              </div>
            )}
            {memoryUsage !== undefined && (
              <div className="text-center">
                <div className="text-muted-foreground font-mono text-xs">RAM</div>
                <div className="text-foreground font-mono text-sm font-medium">
                  {memoryUsage} MB
                </div>
              </div>
            )}
            {networkRx !== undefined && (
              <div className="text-center">
                <div className="text-muted-foreground font-mono text-xs">RX</div>
                <div className="text-foreground font-mono text-sm font-medium">
                  {formatBytes(networkRx)}
                </div>
              </div>
            )}
            {networkTx !== undefined && (
              <div className="text-center">
                <div className="text-muted-foreground font-mono text-xs">TX</div>
                <div className="text-foreground font-mono text-sm font-medium">
                  {formatBytes(networkTx)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom content */}
        {children}

        {/* Primary action as full-width button - 44px minimum */}
        {primaryAction && (
          <Button
            variant={primaryAction.variant || 'default'}
            size="lg"
            className="min-h-[44px] w-full transition-colors duration-150"
            onClick={(e) => {
              e.stopPropagation();
              handlePrimaryAction();
            }}
            disabled={primaryAction.disabled || primaryAction.loading}
            aria-label={primaryAction.label}
          >
            {primaryAction.loading ?
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {primaryAction.label}
              </span>
            : <>
                {primaryAction.icon && (
                  <span
                    className="mr-2"
                    aria-hidden="true"
                  >
                    {primaryAction.icon}
                  </span>
                )}
                {primaryAction.label}
              </>
            }
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
