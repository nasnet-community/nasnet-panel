/**
 * ResourceBudgetPanel Mobile Presenter
 *
 * Card-based presenter for mobile devices.
 * Features:
 * - Stacked card layout
 * - Collapsible details
 * - Large touch targets
 * - Vertical layout for readability
 */

import React, { useState, useCallback } from 'react';

import { ChevronDown, ChevronUp, Server } from 'lucide-react';

import { Badge, Button, Card, CardContent, CardHeader, cn } from '@nasnet/ui/primitives';

import { ResourceUsageBar } from '../resource-usage-bar';
import { useResourceBudgetPanel } from './useResourceBudgetPanel';

import type { ResourceBudgetPanelProps, EnhancedServiceInstanceResource } from './types';

/**
 * Status badge color mapping (semantic tokens)
 */
const STATUS_COLORS = {
  running: 'bg-success text-success-foreground',
  stopped: 'bg-muted text-muted-foreground',
  pending: 'bg-warning text-warning-foreground',
  error: 'bg-error text-error-foreground',
} as const;

/**
 * Instance card component
 */
const InstanceCard = React.memo(function InstanceCard({
  instance,
  onClick,
}: {
  instance: EnhancedServiceInstanceResource;
  onClick?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200',
        'hover:shadow-md',
        onClick && 'active:scale-[0.98]'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Server className="text-muted-foreground h-5 w-5 shrink-0" />
            <span className="text-foreground truncate font-semibold">{instance.name}</span>
          </div>
          <Badge className={cn('shrink-0', STATUS_COLORS[instance.status])}>
            {instance.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Resource Usage Bar */}
        <ResourceUsageBar
          used={instance.memoryUsed}
          total={instance.memoryLimit}
          resourceType="memory"
          unit="MB"
          showValues={!isExpanded}
          showPercentage={true}
          variant="mobile"
        />

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleExpand}
          className="h-10 w-full"
        >
          {isExpanded ?
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              Show Less
            </>
          : <>
              <ChevronDown className="mr-2 h-4 w-4" />
              Show Details
            </>
          }
        </Button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-2 border-t pt-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Memory Used:</span>
              <span className="font-mono font-semibold">{Math.round(instance.memoryUsed)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Memory Limit:</span>
              <span className="font-mono font-semibold">{Math.round(instance.memoryLimit)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usage:</span>
              <span className="font-mono font-semibold">{Math.round(instance.usagePercent)}%</span>
            </div>
            {instance.cpuUsage !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">CPU:</span>
                <span className="font-mono font-semibold">{instance.cpuUsage}%</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

InstanceCard.displayName = 'InstanceCard';

/**
 * Mobile presenter for ResourceBudgetPanel
 *
 * Displays resource budget as a vertical list of cards.
 * Optimized for touch interaction and small screens.
 */
export const ResourceBudgetPanelMobile = React.memo(function ResourceBudgetPanelMobile(
  props: ResourceBudgetPanelProps
) {
  const { showSystemTotals = true, onInstanceClick, className } = props;
  const state = useResourceBudgetPanel(props);

  if (state.isLoading) {
    return (
      <div className={cn('p-4 text-center', className)}>
        <p className="text-muted-foreground">Loading resource data...</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4 p-4', className)}>
      {/* System Totals */}
      {showSystemTotals && (
        <Card className="border-border rounded-[var(--semantic-radius-card)] border">
          <CardHeader>
            <h3 className="font-display text-lg font-semibold">System Resources</h3>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <ResourceUsageBar
              used={state.systemTotals.totalMemoryUsed}
              total={state.systemTotals.totalMemoryAvailable}
              resourceType="memory"
              unit="MB"
              label="Total Memory"
              showValues={true}
              showPercentage={true}
              variant="mobile"
            />

            <div className="border-border grid grid-cols-2 gap-3 border-t pt-2 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground mb-1 text-xs">Running</span>
                <span className="text-success font-semibold">
                  {state.systemTotals.runningInstances}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground mb-1 text-xs">Stopped</span>
                <span className="text-muted-foreground font-semibold">
                  {state.systemTotals.stoppedInstances}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instance List Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Service Instances ({state.totalInstances})</h3>
      </div>

      {/* Empty State */}
      {!state.hasInstances && (
        <Card className="border-border rounded-[var(--semantic-radius-card)] border">
          <CardContent className="py-8 text-center">
            <Server className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
            <p className="text-muted-foreground">{state.emptyMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Instance Cards */}
      {state.hasInstances && (
        <div className="space-y-3">
          {state.instances.map((instance) => (
            <InstanceCard
              key={instance.id}
              instance={instance}
              onClick={() => onInstanceClick?.(instance)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

ResourceBudgetPanelMobile.displayName = 'ResourceBudgetPanelMobile';
