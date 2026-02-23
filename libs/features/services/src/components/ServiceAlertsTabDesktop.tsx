/**
 * ServiceAlertsTab Desktop Presenter
 *
 * Desktop-optimized presenter for ServiceAlertsTab pattern.
 * Optimized for mouse interaction with dense layout and keyboard shortcuts.
 *
 * Features:
 * - DataTable with sortable columns
 * - Multi-select checkboxes for bulk acknowledge
 * - Inline severity badges
 * - Pagination controls
 * - Search and filter controls
 *
 * @see ADR-018: Headless Platform Presenters
 * @see Task #12: Create ServiceAlertsTab with platform presenters
 */

import * as React from 'react';
import { useCallback, memo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Loader2, AlertTriangle, Search, CheckCircle2, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Icon,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import { useServiceAlertsTab } from '../hooks/useServiceAlertsTab';
import type { ServiceAlertsTabProps } from './ServiceAlertsTab';
import type { ServiceAlert, AlertSeverity } from '@nasnet/api-client/queries';

/**
 * Get severity badge variant and icon name
 */
function getSeverityDisplay(severity: AlertSeverity): {
  variant: 'error' | 'warning' | 'info';
  iconName: string;
} {
  switch (severity) {
    case 'CRITICAL':
      return { variant: 'error', iconName: 'alert-triangle' };
    case 'WARNING':
      return { variant: 'warning', iconName: 'alert-triangle' };
    case 'INFO':
    default:
      return { variant: 'info', iconName: 'info' };
  }
}

/**
 * Get icon component from icon name
 */
function getIconComponent(iconName: string): React.ComponentType<any> {
  const iconMap: Record<string, React.ComponentType<any>> = {
    'alert-triangle': AlertTriangle,
    'info': Info,
  };
  return iconMap[iconName] || Info;
}

/**
 * Desktop presenter for ServiceAlertsTab
 *
 * Features:
 * - Dense DataTable layout
 * - Sortable columns (timestamp, severity)
 * - Multi-select checkboxes
 * - Bulk acknowledge action
 * - Pagination with page size selector
 * - Search and severity filter
 *
 * @description Desktop-optimized presenter for service alert management with rich
 * table display, pagination, and bulk operations.
 */
function ServiceAlertsTabDesktopComponent({
  routerId,
  instanceId,
  className,
}: ServiceAlertsTabProps) {
  const tabState = useServiceAlertsTab({
    routerId,
    instanceId,
    initialPageSize: 25,
  });

  const {
    filteredAlerts,
    loading,
    error,
    filters,
    setFilters,
    pagination,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    selectedAlertIds,
    toggleSelect,
    selectAll,
    clearSelection,
    hasSelection,
    acknowledgeAlert,
    acknowledgeBulk,
    acknowledging,
    stats,
  } = tabState;

  // Filter handlers
  const handleSeverityFilter = useCallback(
    (value: string) => {
      setFilters({
        severity: value === 'all' ? undefined : (value as AlertSeverity),
      });
    },
    [setFilters]
  );

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters({ searchTerm: e.target.value });
    },
    [setFilters]
  );

  const handlePageSizeChange = useCallback(
    (value: string) => {
      setPageSize(parseInt(value, 10));
    },
    [setPageSize]
  );

  // Select all checkbox state
  const allSelected = filteredAlerts.length > 0 &&
    filteredAlerts.every((alert) => selectedAlertIds.has(alert.id));
  const someSelected = hasSelection && !allSelected;

  // Loading state
  if (loading && filteredAlerts.length === 0) {
    return (
      <div className={cn('p-6', className)}>
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Icon icon={Loader2} className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading alerts...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('p-6', className)}>
        <Card className="border-destructive">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <Icon icon={AlertTriangle} className="h-10 w-10 text-destructive" />
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">Error Loading Alerts</h3>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header card with stats and filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Service Alerts</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Total: {stats.total}</Badge>
              {stats.critical > 0 && (
                <Badge variant="error">Critical: {stats.critical}</Badge>
              )}
              {stats.warning > 0 && (
                <Badge variant="warning">Warning: {stats.warning}</Badge>
              )}
              {stats.info > 0 && (
                <Badge variant="info">Info: {stats.info}</Badge>
              )}
              {stats.unacknowledged > 0 && (
                <Badge variant="outline">Unacked: {stats.unacknowledged}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Icon icon={Search} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search alerts..."
                  value={filters.searchTerm || ''}
                  onChange={handleSearch}
                  className="pl-9"
                  aria-label="Search alerts by title or message"
                />
              </div>
            </div>

            {/* Severity filter */}
            <Select
              value={filters.severity || 'all'}
              onValueChange={handleSeverityFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
              </SelectContent>
            </Select>

            {/* Bulk acknowledge button */}
            {hasSelection && (
              <Button
                variant="outline"
                onClick={acknowledgeBulk}
                disabled={acknowledging}
                aria-label={`Acknowledge ${selectedAlertIds.size} alerts`}
              >
                {acknowledging ? (
                  <>
                    <Icon icon={Loader2} className="h-4 w-4 animate-spin mr-2" />
                    Acknowledging...
                  </>
                ) : (
                  <>
                    <Icon icon={CheckCircle2} className="h-4 w-4 mr-2" />
                    Acknowledge {selectedAlertIds.size}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerts table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={someSelected ? 'indeterminate' : allSelected}
                  onCheckedChange={(checked: any) => {
                    if (checked) {
                      selectAll();
                    } else {
                      clearSelection();
                    }
                  }}
                  aria-label="Select all alerts"
                />
              </TableHead>
              <TableHead className="w-[140px]">Triggered</TableHead>
              <TableHead className="w-[100px]">Severity</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-[180px]">Status</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Icon icon={Info} className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {filters.severity || filters.searchTerm
                        ? 'No alerts match your filters.'
                        : 'No alerts for this service yet.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAlerts.map((alert) => {
                const severityDisplay = getSeverityDisplay(alert.severity);
                const isSelected = selectedAlertIds.has(alert.id);

                return (
                  <TableRow
                    key={alert.id}
                    className={cn(
                      'hover:bg-muted/50 cursor-pointer',
                      isSelected && 'bg-muted/30'
                    )}
                    onClick={() => toggleSelect(alert.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(alert.id)}
                        aria-label={`Select alert ${alert.title}`}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex flex-col">
                        <span>
                          {format(new Date(alert.triggeredAt), 'MMM d, HH:mm')}
                        </span>
                        <span className="text-xs">
                          {formatDistanceToNow(new Date(alert.triggeredAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={severityDisplay.variant}
                        className="inline-flex items-center gap-1"
                      >
                        <Icon icon={getIconComponent(severityDisplay.iconName) as LucideIcon} className="h-3 w-3" />
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="max-w-[200px] truncate" title={alert.title}>
                        {alert.title}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="max-w-[300px] truncate" title={alert.message}>
                        {alert.message}
                      </div>
                    </TableCell>
                    <TableCell>
                      {alert.acknowledgedAt ? (
                        <div className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1 text-success">
                            <Icon icon={CheckCircle2} className="h-3 w-3" />
                            Acknowledged
                          </div>
                          <div className="mt-0.5">
                            {formatDistanceToNow(new Date(alert.acknowledgedAt), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {!alert.acknowledgedAt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                          disabled={acknowledging}
                          aria-label={`Acknowledge alert: ${alert.title}`}
                        >
                          <Icon icon={CheckCircle2} className="h-4 w-4 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {pagination.totalCount} total alerts
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Page size selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Per page:</span>
                  <Select
                    value={pagination.pageSize.toString()}
                    onValueChange={handlePageSizeChange}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Page navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPage}
                    disabled={pagination.currentPage === 1}
                    aria-label="Go to previous page"
                  >
                    <Icon icon={ChevronLeft} className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPage}
                    disabled={pagination.currentPage === pagination.totalPages}
                    aria-label="Go to next page"
                  >
                    Next
                    <Icon icon={ChevronRight} className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const ServiceAlertsTabDesktop = memo(ServiceAlertsTabDesktopComponent);
ServiceAlertsTabDesktop.displayName = 'ServiceAlertsTab.Desktop';
