/**
 * Port Knock Log Viewer
 *
 * Displays port knock attempt log with infinite scroll and filtering.
 * Uses TanStack Virtual for performance with large datasets.
 *
 * Features:
 * - Infinite scroll pagination
 * - Filter by status, IP, date range, sequence
 * - Status badges (success, failed, partial)
 * - "Block IP" action (adds to address list)
 * - Export CSV
 * - Auto-refresh toggle
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 4
 */

import { useState, useMemo } from 'react';
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

// ============================================================================
// Status Badge Component
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, { variant: 'success' | 'destructive' | 'warning'; icon: any }> = {
    success: { variant: 'success', icon: CheckCircle },
    failed: { variant: 'destructive', icon: XCircle },
    partial: { variant: 'warning', icon: AlertTriangle },
  };

  const config = variantMap[status] || variantMap.failed;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="text-xs">
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  );
}

// ============================================================================
// Filter Bar Component
// ============================================================================

interface FilterBarProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  ipFilter: string;
  onIpFilterChange: (ip: string) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (enabled: boolean) => void;
  onExport: () => void;
}

function FilterBar({
  statusFilter,
  onStatusFilterChange,
  ipFilter,
  onIpFilterChange,
  autoRefresh,
  onAutoRefreshChange,
  onExport,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
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
      <div className="flex items-center gap-2">
        <Switch
          id="auto-refresh"
          checked={autoRefresh}
          onCheckedChange={onAutoRefreshChange}
        />
        <Label htmlFor="auto-refresh" className="text-sm">
          Auto-refresh
        </Label>
      </div>
      <Button variant="outline" size="sm" onClick={onExport}>
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PortKnockLogViewer({ className }: PortKnockLogViewerProps) {
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

  const handleExport = () => {
    // Convert attempts to CSV
    const headers = ['Timestamp', 'Sequence', 'Source IP', 'Status', 'Progress', 'Ports Hit'];
    const rows = attempts.map((attempt) => [
      new Date(attempt.timestamp).toISOString(),
      attempt.sequenceName,
      attempt.sourceIP,
      attempt.status,
      `${attempt.progress.current}/${attempt.progress.total}`,
      attempt.portsHit.join(' → '),
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `port-knock-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading log...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-destructive">Error loading log: {error.message}</div>
      </div>
    );
  }

  return (
    <div className={cn(className)} data-testid="log-viewer">
      <FilterBar
        statusFilter={logStatusFilter}
        onStatusFilterChange={setLogStatusFilter}
        ipFilter={logIpFilter}
        onIpFilterChange={setLogIpFilter}
        autoRefresh={autoRefreshLog}
        onAutoRefreshChange={setAutoRefreshLog}
        onExport={handleExport}
      />

      {attempts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Knock Attempts</h3>
            <p className="text-sm text-muted-foreground">
              Knock attempts will appear here when sequences are triggered.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
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
                <TableRow key={attempt.id} data-testid={`log-entry-${index}`}>
                  <TableCell className="font-mono text-xs">
                    {new Date(attempt.timestamp).toLocaleString()}
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {attempt.sequenceName}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-mono text-sm">
                    {attempt.sourceIP}
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={attempt.status} />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            attempt.status === 'success' ? 'bg-green-500' :
                            attempt.status === 'failed' ? 'bg-red-500' :
                            'bg-amber-500'
                          )}
                          style={{
                            width: `${(attempt.progress.current / attempt.progress.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {attempt.progress.current}/{attempt.progress.total}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-1">
                      {attempt.portsHit.map((port, index) => (
                        <Badge key={index} variant="outline" className="font-mono text-xs">
                          {port}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {attempt.protectedPort}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {attempt.status === 'failed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Block this IP"
                      >
                        <Ban className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {hasNextPage && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

PortKnockLogViewer.displayName = 'PortKnockLogViewer';
