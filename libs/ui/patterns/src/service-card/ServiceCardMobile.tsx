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
      className={`
        bg-card border border-border rounded-[var(--semantic-radius-card)]
        shadow-[var(--semantic-shadow-card)]
        hover:shadow-lg transition-shadow duration-200
        p-component-md touch-manipulation
        ${className || ''}
      `.trim()}
      onClick={handleClick}
      role="article"
      aria-label={`${service.name} - ${statusLabel}`}
    >
      <CardContent className="p-0 space-y-component-md">
        {/* Header row with status - 44px minimum touch target */}
        <div className="flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-component-sm flex-1 min-w-0">
            {/* Service icon with category background */}
            {service.icon && (
              <div
                className={`
                  shrink-0 h-10 w-10 flex items-center justify-center
                  rounded-lg bg-category-vpn/10
                `}
              >
                {service.icon}
              </div>
            )}

            {/* Service name and version */}
            <div className="flex-1 min-w-0">
              <span className="text-lg font-semibold text-foreground truncate block">
                {service.name}
              </span>
              {service.version && (
                <span className="text-xs font-mono text-muted-foreground">
                  v{service.version}
                </span>
              )}
            </div>
          </div>

          {/* Status badge with health indicator */}
          <div className="relative shrink-0 ml-component-sm">
            <ServiceHealthBadge />
          </div>
        </div>

        {/* Category label */}
        <div className="flex items-center gap-component-sm">
          <span className="text-xs text-muted-foreground">Category:</span>
          <span className={`text-xs font-medium ${categoryColor}`}>
            {service.category.charAt(0).toUpperCase() +
              service.category.slice(1)}
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
          <p className="text-sm text-muted-foreground line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Resource metrics grid (mono font for technical data) */}
        {hasMetrics && (
          <div className="grid grid-cols-2 gap-component-sm p-component-md bg-muted/50 rounded-[var(--semantic-radius-input)]">
            {cpuUsage !== undefined && (
              <div className="text-center">
                <div className="text-xs font-mono text-muted-foreground">
                  CPU
                </div>
                <div className="text-sm font-mono font-medium text-foreground">
                  {cpuUsage.toFixed(1)}%
                </div>
              </div>
            )}
            {memoryUsage !== undefined && (
              <div className="text-center">
                <div className="text-xs font-mono text-muted-foreground">
                  RAM
                </div>
                <div className="text-sm font-mono font-medium text-foreground">
                  {memoryUsage} MB
                </div>
              </div>
            )}
            {networkRx !== undefined && (
              <div className="text-center">
                <div className="text-xs font-mono text-muted-foreground">RX</div>
                <div className="text-sm font-mono font-medium text-foreground">
                  {formatBytes(networkRx)}
                </div>
              </div>
            )}
            {networkTx !== undefined && (
              <div className="text-center">
                <div className="text-xs font-mono text-muted-foreground">TX</div>
                <div className="text-sm font-mono font-medium text-foreground">
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
            className="w-full min-h-[44px] transition-colors duration-150"
            onClick={(e) => {
              e.stopPropagation();
              handlePrimaryAction();
            }}
            disabled={primaryAction.disabled || primaryAction.loading}
            aria-label={primaryAction.label}
          >
            {primaryAction.loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {primaryAction.label}
              </span>
            ) : (
              <>
                {primaryAction.icon && (
                  <span className="mr-2" aria-hidden="true">
                    {primaryAction.icon}
                  </span>
                )}
                {primaryAction.label}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
