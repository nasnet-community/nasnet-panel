/**
 * ServiceCard Desktop Presenter
 *
 * Desktop-optimized presenter for ServiceCard pattern.
 * Denser layout with hover states and dropdown menus.
 *
 * @see ADR-018: Headless Platform Presenters
 */

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

import { ResourceUsageBar } from '../resource-usage-bar';
import { ServiceHealthBadge } from '../service-health-badge';
import { useServiceCard, formatBytes } from './useServiceCard';

import type { ServiceCardProps } from './types';

/**
 * Desktop presenter for ServiceCard
 *
 * Features:
 * - Compact horizontal layout with semantic tokens
 * - Hover shadow transition with 200ms duration
 * - Secondary actions in dropdown menu
 * - Inline resource metrics with mono font
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
        bg-card border border-border rounded-[var(--semantic-radius-card)]
        shadow-[var(--semantic-shadow-card)]
        hover:shadow-lg transition-shadow duration-200
        ${className || ''}
      `.trim()}
      onClick={handleClick}
      role="article"
      aria-label={`${service.name} - ${statusLabel}`}
    >
      <CardContent className="p-component-lg">
        <div className="flex items-center gap-component-md">
          {/* Service icon with category color background */}
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

          {/* Service info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-component-md">
              <h3 className="text-lg font-semibold text-foreground truncate">
                {service.name}
              </h3>
              {service.version && (
                <span className="text-xs font-mono text-muted-foreground">
                  v{service.version}
                </span>
              )}
              <div className="ml-auto">
                <ServiceHealthBadge />
              </div>
            </div>

            {/* Category and description */}
            <div className="flex items-center gap-component-sm">
              <span className={`text-xs font-medium ${categoryColor}`}>
                {service.category.charAt(0).toUpperCase() +
                  service.category.slice(1)}
              </span>
              {service.description && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground line-clamp-2">
                    {service.description}
                  </span>
                </>
              )}
            </div>

            {/* Resource metrics (inline, mono font) */}
            {hasMetrics && (
              <div className="flex items-center gap-component-md text-xs font-mono text-muted-foreground">
                {cpuUsage !== undefined && (
                  <div className="flex items-center gap-1">
                    <span>CPU:</span>
                    <span className="font-medium text-foreground">
                      {cpuUsage.toFixed(1)}%
                    </span>
                  </div>
                )}
                {memoryUsage !== undefined && (
                  <div className="flex items-center gap-1">
                    <span>RAM:</span>
                    <span className="font-medium text-foreground">
                      {memoryUsage} MB
                    </span>
                  </div>
                )}
                {networkRx !== undefined && (
                  <div className="flex items-center gap-1">
                    <span>RX:</span>
                    <span className="font-medium text-foreground">
                      {formatBytes(networkRx)}
                    </span>
                  </div>
                )}
                {networkTx !== undefined && (
                  <div className="flex items-center gap-1">
                    <span>TX:</span>
                    <span className="font-medium text-foreground">
                      {formatBytes(networkTx)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Custom content */}
            {children}
          </div>

          {/* Resource usage bar (compact inline for running instances) */}
          {isRunning &&
            service.metrics?.currentMemory !== undefined &&
            service.metrics?.memoryLimit !== undefined && (
              <div className="shrink-0 w-48">
                <ResourceUsageBar
                  label="Memory"
                  used={service.metrics.currentMemory}
                  total={service.metrics.memoryLimit}
                  unit="MB"
                  showValues={false}
                />
              </div>
            )}

          {/* Actions */}
          <div className="shrink-0 flex items-center gap-component-sm">
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
                className="transition-colors duration-150"
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
                    className="transition-colors duration-150"
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
