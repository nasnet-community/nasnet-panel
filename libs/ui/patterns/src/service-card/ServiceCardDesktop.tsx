/**
 * ServiceCard Desktop Presenter
 *
 * Desktop-optimized presenter for ServiceCard pattern.
 * Denser layout with hover states and dropdown menus.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nasnet/ui/primitives';

import { useServiceCard, formatBytes } from './useServiceCard';

import type { ServiceCardProps } from './types';

/**
 * Desktop presenter for ServiceCard
 *
 * Features:
 * - Compact horizontal layout
 * - Hover states and transitions
 * - Secondary actions in dropdown menu
 * - Inline resource metrics
 */
export function ServiceCardDesktop(props: ServiceCardProps) {
  const { service, className, children } = props;
  const {
    status,
    isRunning,
    statusColor,
    statusLabel,
    categoryColor,
    primaryAction,
    secondaryActions,
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
        transition-all hover:shadow-md
        ${className || ''}
      `.trim()}
      onClick={handleClick}
      role="article"
      aria-label={`${service.name} - ${statusLabel}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Service icon if present */}
          {service.icon && (
            <div className="shrink-0 w-12 h-12 flex items-center justify-center">
              {service.icon}
            </div>
          )}

          {/* Service info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{service.name}</h3>
              {service.version && (
                <span className="text-xs text-muted-foreground">
                  v{service.version}
                </span>
              )}
              <Badge variant={statusColor} className="ml-auto">
                {statusLabel}
              </Badge>
              {isRunning && (
                <span
                  className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Category and description */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${categoryColor}`}>
                {service.category.charAt(0).toUpperCase() +
                  service.category.slice(1)}
              </span>
              {service.description && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {service.description}
                  </span>
                </>
              )}
            </div>

            {/* Resource metrics (inline) */}
            {hasMetrics && (
              <div className="flex items-center gap-4 text-xs">
                {cpuUsage !== undefined && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">CPU:</span>
                    <span className="font-medium">{cpuUsage.toFixed(1)}%</span>
                  </div>
                )}
                {memoryUsage !== undefined && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">RAM:</span>
                    <span className="font-medium">{memoryUsage} MB</span>
                  </div>
                )}
                {networkRx !== undefined && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">RX:</span>
                    <span className="font-medium">
                      {formatBytes(networkRx)}
                    </span>
                  </div>
                )}
                {networkTx !== undefined && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">TX:</span>
                    <span className="font-medium">
                      {formatBytes(networkTx)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Custom content */}
            {children}
          </div>

          {/* Actions */}
          <div className="shrink-0 flex items-center gap-2">
            {/* Primary action */}
            {primaryAction && (
              <Button
                variant={primaryAction.variant || 'default'}
                size="default"
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

            {/* Secondary actions in dropdown */}
            {secondaryActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="More actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {secondaryActions.map((action) => (
                    <DropdownMenuItem
                      key={action.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                      }}
                      disabled={action.disabled || action.loading}
                    >
                      {action.icon && (
                        <span className="mr-2" aria-hidden="true">
                          {action.icon}
                        </span>
                      )}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
