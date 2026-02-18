/**
 * ResourceBudgetPanel Desktop Presenter
 *
 * Table-based presenter for desktop devices.
 * Features:
 * - Dense data table with sortable columns
 * - Inline resource usage bars
 * - Keyboard navigation
 * - Hover states
 */

import { ArrowDown, ArrowUp, Server } from 'lucide-react';

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@nasnet/ui/primitives';

import { ResourceUsageBar } from '../resource-usage-bar';
import { useResourceBudgetPanel } from './useResourceBudgetPanel';

import type { ResourceBudgetPanelProps, SortColumn } from './types';

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
 * Sort header component
 */
function SortHeader({
  column,
  currentColumn,
  currentDirection,
  onSort,
  children,
}: {
  column: SortColumn;
  currentColumn: SortColumn;
  currentDirection: 'asc' | 'desc';
  onSort: (column: SortColumn) => void;
  children: React.ReactNode;
}) {
  const isActive = column === currentColumn;

  return (
    <TableHead
      className={cn(
        'cursor-pointer select-none transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        isActive && 'bg-gray-50 dark:bg-gray-900'
      )}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-2">
        {children}
        {isActive && (
          currentDirection === 'asc' ? (
            <ArrowUp className="h-4 w-4" aria-label="Sorted ascending" />
          ) : (
            <ArrowDown className="h-4 w-4" aria-label="Sorted descending" />
          )
        )}
      </div>
    </TableHead>
  );
}

/**
 * Desktop presenter for ResourceBudgetPanel
 *
 * Displays resource budget as a sortable data table.
 * Optimized for keyboard navigation and larger screens.
 */
export function ResourceBudgetPanelDesktop(props: ResourceBudgetPanelProps) {
  const {
    showSystemTotals = true,
    enableSorting = true,
    onInstanceClick,
    className,
  } = props;
  const state = useResourceBudgetPanel(props);

  if (state.isLoading) {
    return (
      <div className={cn('p-8 text-center', className)}>
        <p className="text-muted-foreground">Loading resource data...</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* System Totals */}
      {showSystemTotals && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">System Resources</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <ResourceUsageBar
                  used={state.systemTotals.totalMemoryUsed}
                  total={state.systemTotals.totalMemoryAvailable}
                  resourceType="memory"
                  unit="MB"
                  label="Total Memory"
                  showValues={true}
                  showPercentage={true}
                  variant="desktop"
                />
              </div>
              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">
                    Running Instances
                  </span>
                  <span className="text-2xl font-bold text-semantic-success">
                    {state.systemTotals.runningInstances}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">
                    Stopped Instances
                  </span>
                  <span className="text-2xl font-bold text-muted-foreground">
                    {state.systemTotals.stoppedInstances}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instance Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            Service Instances ({state.totalInstances})
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          {!state.hasInstances ? (
            <div className="py-12 text-center">
              <Server className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{state.emptyMessage}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {enableSorting ? (
                    <>
                      <SortHeader
                        column="name"
                        currentColumn={state.sortColumn}
                        currentDirection={state.sortDirection}
                        onSort={state.toggleSort}
                      >
                        Service Name
                      </SortHeader>
                      <SortHeader
                        column="status"
                        currentColumn={state.sortColumn}
                        currentDirection={state.sortDirection}
                        onSort={state.toggleSort}
                      >
                        Status
                      </SortHeader>
                      <SortHeader
                        column="memoryUsed"
                        currentColumn={state.sortColumn}
                        currentDirection={state.sortDirection}
                        onSort={state.toggleSort}
                      >
                        Memory Used
                      </SortHeader>
                      <SortHeader
                        column="memoryLimit"
                        currentColumn={state.sortColumn}
                        currentDirection={state.sortDirection}
                        onSort={state.toggleSort}
                      >
                        Memory Limit
                      </SortHeader>
                      <SortHeader
                        column="usagePercent"
                        currentColumn={state.sortColumn}
                        currentDirection={state.sortDirection}
                        onSort={state.toggleSort}
                      >
                        Usage
                      </SortHeader>
                    </>
                  ) : (
                    <>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Memory Used</TableHead>
                      <TableHead>Memory Limit</TableHead>
                      <TableHead>Usage</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.instances.map((instance) => (
                  <TableRow
                    key={instance.id}
                    className={cn(
                      'transition-colors',
                      onInstanceClick &&
                        'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900'
                    )}
                    onClick={() => onInstanceClick?.(instance)}
                  >
                    {/* Service Name */}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        {instance.name}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge className={STATUS_COLORS[instance.status]}>
                        {instance.status}
                      </Badge>
                    </TableCell>

                    {/* Memory Used */}
                    <TableCell className="font-mono text-sm">
                      {Math.round(instance.memoryUsed)} MB
                    </TableCell>

                    {/* Memory Limit */}
                    <TableCell className="font-mono text-sm">
                      {Math.round(instance.memoryLimit)} MB
                    </TableCell>

                    {/* Usage Bar */}
                    <TableCell>
                      <div className="min-w-[200px]">
                        <ResourceUsageBar
                          used={instance.memoryUsed}
                          total={instance.memoryLimit}
                          resourceType="memory"
                          unit="MB"
                          showValues={false}
                          showPercentage={true}
                          variant="desktop"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
