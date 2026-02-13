/**
 * ServiceCard Mobile Presenter
 *
 * Mobile-optimized presenter for ServiceCard pattern.
 * Optimized for touch interaction with 44px minimum targets.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';

import { Badge, Button, Card, CardContent } from '@nasnet/ui/primitives';

import { useServiceCard, formatBytes } from './useServiceCard';

import type { ServiceCardProps } from './types';

/**
 * Mobile presenter for ServiceCard
 *
 * Features:
 * - Large touch targets (44px minimum)
 * - Single column layout
 * - Primary action as full-width button
 * - Tap to expand for details
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
        p-4 touch-manipulation
        ${className || ''}
      `.trim()}
      onClick={handleClick}
      role="article"
      aria-label={`${service.name} - ${statusLabel}`}
    >
      <CardContent className="p-0 space-y-3">
        {/* Header row with status */}
        <div className="flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Service icon if present */}
            {service.icon && (
              <div className="shrink-0 w-10 h-10 flex items-center justify-center">
                {service.icon}
              </div>
            )}

            {/* Service name */}
            <div className="flex-1 min-w-0">
              <span className="font-medium truncate block">
                {service.name}
              </span>
              {service.version && (
                <span className="text-xs text-muted-foreground">
                  v{service.version}
                </span>
              )}
            </div>
          </div>

          {/* Status badge with optional pulse */}
          <div className="relative shrink-0">
            <Badge variant={statusColor} className="min-h-[28px]">
              {statusLabel}
            </Badge>
            {isRunning && (
              <span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse"
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Category:</span>
          <span className={`text-xs font-medium ${categoryColor}`}>
            {service.category.charAt(0).toUpperCase() +
              service.category.slice(1)}
          </span>
        </div>

        {/* Description if present */}
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Resource metrics (if running and metrics available) */}
        {hasMetrics && (
          <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-md">
            {cpuUsage !== undefined && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground">CPU</div>
                <div className="text-sm font-medium">{cpuUsage.toFixed(1)}%</div>
              </div>
            )}
            {memoryUsage !== undefined && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground">RAM</div>
                <div className="text-sm font-medium">{memoryUsage} MB</div>
              </div>
            )}
            {networkRx !== undefined && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground">RX</div>
                <div className="text-sm font-medium">
                  {formatBytes(networkRx)}
                </div>
              </div>
            )}
            {networkTx !== undefined && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground">TX</div>
                <div className="text-sm font-medium">
                  {formatBytes(networkTx)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom content */}
        {children}

        {/* Primary action as full-width button */}
        {primaryAction && (
          <Button
            variant={primaryAction.variant || 'default'}
            size="lg"
            className="w-full min-h-[44px]"
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
