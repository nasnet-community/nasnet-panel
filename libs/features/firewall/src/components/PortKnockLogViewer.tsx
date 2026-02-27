/**
 * Port Knock Log Viewer Component
 * @description Displays port knock attempt log with filtering and export
 *
 * Features:
 * - Infinite scroll pagination
 * - Filter by status (all/success/failed/partial) and IP address
 * - Status badges with semantic colors
 * - "Block IP" action for failed attempts
 * - Export to CSV
 * - Auto-refresh toggle
 * - Professional error and empty states
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@nasnet/ui/utils';
import { useConnectionStore, usePortKnockStore } from '@nasnet/state/stores';
import { usePortKnockLog } from '@nasnet/api-client/queries';
import type { PortKnockAttempt } from '@nasnet/core/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@nasnet/ui/primitives';
import {
  Shield,
  Download,
  RefreshCw,
  Search,
  Filter,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface PortKnockLogViewerProps {
  className?: string;
}

/**
 * Renders a semantic badge for port knock attempt status
 * @description Maps status to color variant and icon
 */
const StatusBadge = ({ status }: { status: string }) => {
  const VARIANT_MAP: Record<
    string,
    { variant: 'success' | 'error' | 'warning'; icon: typeof CheckCircle }
  > = {
    success: { variant: 'success', icon: CheckCircle },
    failed: { variant: 'error', icon: XCircle },
    partial: { variant: 'warning', icon: AlertTriangle },
  };

  const config = VARIANT_MAP[status] || VARIANT_MAP.failed;
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className="text-xs"
    >
      <Icon
        className="mr-component-xs h-3 w-3"
        aria-hidden="true"
      />
      {status}
    </Badge>
  );
};

StatusBadge.displayName = 'StatusBadge';

// ============================================================================
// Filter Bar Component
// ============================================================================

/** Type guard for knock status filter values */
type KnockStatusFilter = 'all' | 'partial' | 'success' | 'failed';

interface FilterBarProps {
  /** Current status filter value */
  statusFilter: string;
  /** Callback when status filter changes */
  onStatusFilterChange: (status: KnockStatusFilter) => void;
  /** Current IP filter value */
  ipFilter: string;
  /** Callback when IP filter changes */
  onIpFilterChange: (ip: string) => void;
  /** Whether auto-refresh is enabled */
  autoRefresh: boolean;
  /** Callback when auto-refresh toggle changes */
  onAutoRefreshChange: (enabled: boolean) => void;
  /** Callback for CSV export */
  onExport: () => void;
}

/**
 * Renders filter controls for the port knock log
 * @description Status filter, IP search, auto-refresh toggle, and export button
 */
const FilterBar = ({
  statusFilter,
  onStatusFilterChange,
  ipFilter,
  onIpFilterChange,
  autoRefresh,
  onAutoRefreshChange,
  onExport,
}: FilterBarProps) => {
  return (
    <div className="gap-component-md mb-component-md flex flex-col sm:flex-row">
      <div className="flex-1">
        <Input
          placeholder="Filter by IP..."
          value={ipFilter}
          onChange={(e) => onIpFilterChange(e.target.value)}
          className="w-full"
          data-testid="ip-filter"
          aria-label="Filter by IP address"
        />
      </div>
      <div className="w-full sm:w-48">
        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusFilterChange(v as KnockStatusFilter)}
        >
          <SelectTrigger data-testid="status-filter">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="gap-component-sm flex items-center">
        <Switch
          id="auto-refresh"
          checked={autoRefresh}
          onCheckedChange={onAutoRefreshChange}
        />
        <Label
          htmlFor="auto-refresh"
          className="text-sm"
        >
          Auto-refresh
        </Label>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        aria-label="Export log to CSV"
      >
        <Download
          className="mr-component-sm h-4 w-4"
          aria-hidden="true"
        />
        Export CSV
      </Button>
    </div>
  );
};

FilterBar.displayName = 'FilterBar';

/**
 * PortKnockLogViewer Component
 * @description Displays and manages port knock attempt logs with filtering
 *
 * @example
 * ```tsx
 * <PortKnockLogViewer />
 * ```
 */
export const PortKnockLogViewer = ({ className }: PortKnockLogViewerProps) => {
  const { t } = useTranslation('firewall');
  const { activeRouterId } = useConnectionStore();
  const {
    logStatusFilter,
    setLogStatusFilter,
    logIpFilter,
    setLogIpFilter,
    autoRefreshLog,
    setAutoRefreshLog,
  } = usePortKnockStore();

  // Build filters object
  const filters = useMemo(() => {
    const f: any = {};
    if (logStatusFilter !== 'all') {
      f.status = logStatusFilter;
    }
    if (logIpFilter) {
      f.sourceIP = logIpFilter;
    }
    return f;
  }, [logStatusFilter, logIpFilter]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
    usePortKnockLog(activeRouterId!, filters);

  // Flatten pages
  const attempts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.attempts);
  }, [data]);

  const handleExport = useCallback(() => {
    const CSV_HEADERS = ['Timestamp', 'Sequence', 'Source IP', 'Status', 'Progress', 'Ports Hit'];
    const rows = attempts.map((attempt) => [
      new Date(attempt.timestamp).toISOString(),
      attempt.sequenceName,
      attempt.sourceIP,
      attempt.status,
      `${attempt.progress}`,
      attempt.portsHit.join(' → '),
    ]);

    const csv = [CSV_HEADERS.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `port-knock-log-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [attempts]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="text-muted-foreground animate-pulse">Loading port knock log...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-component-md bg-error/10 rounded-lg', className)}>
        <p className="text-error font-medium">Error loading port knock log</p>
        <p className="text-error/80 mt-component-xs text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(className)}
      data-testid="log-viewer"
    >
      <FilterBar
        statusFilter={logStatusFilter}
        onStatusFilterChange={setLogStatusFilter}
        ipFilter={logIpFilter}
        onIpFilterChange={setLogIpFilter}
        autoRefresh={autoRefreshLog}
        onAutoRefreshChange={setAutoRefreshLog}
        onExport={handleExport}
      />

      {attempts.length === 0 ?
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="text-muted-foreground mb-component-md h-12 w-12" />
            <h3 className="mb-component-sm text-lg font-semibold">No Knock Attempts</h3>
            <p className="text-muted-foreground text-sm">
              Knock attempts will appear here when sequences are triggered.
            </p>
          </CardContent>
        </Card>
      : <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Sequence</TableHead>
                <TableHead>Source IP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Ports Hit</TableHead>
                <TableHead>Protected Port</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.map((attempt, index) => (
                <TableRow
                  key={attempt.id}
                  data-testid={`log-entry-${index}`}
                >
                  <TableCell className="font-mono text-xs">
                    {new Date(attempt.timestamp).toLocaleString()}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs"
                    >
                      {attempt.sequenceName}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-mono">
                    <span className="font-mono">{attempt.sourceIP}</span>
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={attempt.status} />
                  </TableCell>

                  <TableCell>
                    <div className="gap-component-sm flex items-center">
                      <div className="bg-muted h-2 w-20 rounded-full">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            attempt.status === 'success' && 'bg-success',
                            attempt.status === 'failed' && 'bg-error',
                            attempt.status === 'partial' && 'bg-warning'
                          )}
                          style={{
                            width: `${(() => {
                              const parts = attempt.progress.split('/');
                              return parts.length === 2 ?
                                  (parseInt(parts[0]) / parseInt(parts[1])) * 100
                                : 0;
                            })()}%`,
                          }}
                          aria-hidden="true"
                        />
                      </div>
                      <span className="text-muted-foreground font-mono text-xs">
                        {attempt.progress}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="gap-component-sm flex">
                      {attempt.portsHit.map((port, index) => (
                        <Badge
                          key={`port-${index}`}
                          variant="outline"
                          className="font-mono text-xs"
                        >
                          {port}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs"
                    >
                      {attempt.protectedPort}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {attempt.status === 'failed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Block this IP address"
                      >
                        <Ban
                          className="text-error h-4 w-4"
                          aria-hidden="true"
                        />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {hasNextPage && (
            <div className="mt-component-md flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                aria-label={isFetchingNextPage ? 'Loading more entries' : 'Load more entries'}
              >
                {isFetchingNextPage ?
                  <>
                    <RefreshCw
                      className="mr-component-sm h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Loading...
                  </>
                : 'Load More'}
              </Button>
            </div>
          )}
        </>
      }
    </div>
  );
};

PortKnockLogViewer.displayName = 'PortKnockLogViewer';
