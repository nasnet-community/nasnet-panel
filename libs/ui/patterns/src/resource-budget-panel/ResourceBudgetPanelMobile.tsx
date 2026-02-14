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

import { ChevronDown, ChevronUp, Server } from 'lucide-react';
import { useState } from 'react';

import { Badge, Button, Card, CardContent, CardHeader, cn } from '@nasnet/ui/primitives';

import { ResourceUsageBar } from '../resource-usage-bar';
import type { ResourceBudgetPanelProps, EnhancedServiceInstanceResource } from './types';
import { useResourceBudgetPanel } from './useResourceBudgetPanel';

/**
 * Status badge color mapping
 */
const STATUS_COLORS = {
  running: 'bg-semantic-success text-white',
  stopped: 'bg-gray-400 dark:bg-gray-600 text-white',
  pending: 'bg-semantic-warning text-white',
  error: 'bg-semantic-error text-white',
} as const;

/**
 * Instance card component
 */
function InstanceCard({
  instance,
  onClick,
}: {
  instance: EnhancedServiceInstanceResource;
  onClick?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

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
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Server className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="font-semibold text-foreground truncate">{instance.name}</span>
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
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="w-full h-10"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Show Details
            </>
          )}
        </Button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="pt-2 space-y-2 text-sm border-t">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Memory Used:</span>
              <span className="font-semibold font-mono">
                {Math.round(instance.memoryUsed)} MB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Memory Limit:</span>
              <span className="font-semibold font-mono">
                {Math.round(instance.memoryLimit)} MB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usage:</span>
              <span className="font-semibold font-mono">
                {Math.round(instance.usagePercent)}%
              </span>
            </div>
            {instance.cpuUsage !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">CPU:</span>
                <span className="font-semibold font-mono">{instance.cpuUsage}%</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Mobile presenter for ResourceBudgetPanel
 *
 * Displays resource budget as a vertical list of cards.
 * Optimized for touch interaction and small screens.
 */
export function ResourceBudgetPanelMobile(props: ResourceBudgetPanelProps) {
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
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">System Resources</h3>
          </CardHeader>
          <CardContent className="space-y-3">
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

            <div className="grid grid-cols-2 gap-3 pt-2 text-sm border-t">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Running</span>
                <span className="font-semibold text-semantic-success">
                  {state.systemTotals.runningInstances}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Stopped</span>
                <span className="font-semibold text-muted-foreground">
                  {state.systemTotals.stoppedInstances}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instance List Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">
          Service Instances ({state.totalInstances})
        </h3>
      </div>

      {/* Empty State */}
      {!state.hasInstances && (
        <Card>
          <CardContent className="py-8 text-center">
            <Server className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
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
}
