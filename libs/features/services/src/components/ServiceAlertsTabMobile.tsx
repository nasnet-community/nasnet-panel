/**
 * ServiceAlertsTab Mobile Presenter
 *
 * Mobile-optimized presenter for ServiceAlertsTab pattern.
 * Optimized for touch interaction with 44px minimum targets.
 *
 * Features:
 * - Card list with severity-colored left border
 * - Filter chips for quick severity filtering
 * - Swipe-to-acknowledge gesture
 * - 44px minimum touch targets
 * - Infinite scroll for large alert lists
 *
 * @see ADR-018: Headless Platform Presenters
 * @see Task #12: Create ServiceAlertsTab with platform presenters
 */

import * as React from 'react';
import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  ScrollArea,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

import { useServiceAlertsTab } from '../hooks/useServiceAlertsTab';
import type { ServiceAlertsTabProps } from './ServiceAlertsTab';
import type { ServiceAlert, AlertSeverity } from '@nasnet/api-client/queries';

/**
 * Severity filter chip configuration
 */
const SEVERITY_FILTERS: Array<{
  value: AlertSeverity | 'ALL';
  label: string;
  icon: React.ElementType;
}> = [
  { value: 'ALL', label: 'All', icon: AlertCircle },
  { value: 'CRITICAL', label: 'Critical', icon: AlertTriangle },
  { value: 'WARNING', label: 'Warning', icon: AlertTriangle },
  { value: 'INFO', label: 'Info', icon: Info },
];

/**
 * Get severity color classes
 */
function getSeverityStyles(severity: AlertSeverity): {
  borderColor: string;
  badgeVariant: 'error' | 'warning' | 'info';
  icon: React.ElementType;
} {
  switch (severity) {
    case 'CRITICAL':
      return {
        borderColor: 'border-l-destructive',
        badgeVariant: 'error',
        icon: AlertTriangle,
      };
    case 'WARNING':
      return {
        borderColor: 'border-l-warning',
        badgeVariant: 'warning',
        icon: AlertTriangle,
      };
    case 'INFO':
    default:
      return {
        borderColor: 'border-l-info',
        badgeVariant: 'info',
        icon: Info,
      };
  }
}

/**
 * Alert Card Component with swipe-to-acknowledge
 */
function AlertCard({
  alert,
  onAcknowledge,
  acknowledging,
}: {
  alert: ServiceAlert;
  onAcknowledge: () => void;
  acknowledging: boolean;
}) {
  const [swiping, setSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const startX = React.useRef(0);

  const styles = getSeverityStyles(alert.severity);
  const Icon = styles.icon;

  // Swipe gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (alert.acknowledgedAt) return; // Don't swipe if already acknowledged
    startX.current = e.touches[0].clientX;
    setSwiping(true);
  }, [alert.acknowledgedAt]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping || alert.acknowledgedAt) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    // Only allow left swipe (negative offset)
    if (diff < 0) {
      setSwipeOffset(Math.max(diff, -100));
    }
  }, [swiping, alert.acknowledgedAt]);

  const handleTouchEnd = useCallback(() => {
    if (!swiping) return;
    setSwiping(false);

    // If swiped more than 60px, trigger acknowledge
    if (swipeOffset < -60 && !alert.acknowledgedAt) {
      onAcknowledge();
    }

    // Reset swipe offset
    setSwipeOffset(0);
  }, [swiping, swipeOffset, alert.acknowledgedAt, onAcknowledge]);

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Acknowledge action revealed on swipe */}
      {!alert.acknowledgedAt && (
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-success flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-white" />
        </div>
      )}

      {/* Card with swipe transform */}
      <Card
        className={cn(
          'border-l-4 touch-manipulation transition-transform',
          styles.borderColor,
          alert.acknowledgedAt && 'opacity-60'
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-base truncate">{alert.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(alert.triggeredAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
            <Badge variant={styles.badgeVariant} className="shrink-0">
              {alert.severity}
            </Badge>
          </div>

          {/* Message */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {alert.message}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="truncate">{alert.eventType}</span>
            {alert.rule && (
              <>
                <span>•</span>
                <span className="truncate">{alert.rule.name}</span>
              </>
            )}
          </div>

          {/* Actions */}
          {!alert.acknowledgedAt ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full min-h-[44px]"
              onClick={onAcknowledge}
              disabled={acknowledging}
            >
              {acknowledging ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Acknowledging...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Acknowledge
                </>
              )}
            </Button>
          ) : (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>
                Acknowledged {formatDistanceToNow(new Date(alert.acknowledgedAt), { addSuffix: true })}
                {alert.acknowledgedBy && ` by ${alert.acknowledgedBy}`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Mobile presenter for ServiceAlertsTab
 *
 * Features:
 * - Filter chips at top for quick severity filtering
 * - Search input for filtering by message/title
 * - Card list with severity-colored borders
 * - Swipe-to-acknowledge gesture (left swipe)
 * - Large touch targets (44px minimum)
 * - Scroll-based pagination
 */
export function ServiceAlertsTabMobile({
  routerId,
  instanceId,
  className,
}: ServiceAlertsTabProps) {
  const tabState = useServiceAlertsTab({
    routerId,
    instanceId,
    initialPageSize: 50, // Load more for mobile infinite scroll
  });

  const {
    filteredAlerts,
    loading,
    error,
    filters,
    setFilters,
    acknowledgeAlert,
    acknowledging,
    stats,
  } = tabState;

  const handleSeverityFilter = useCallback(
    (severity: AlertSeverity | 'ALL') => {
      setFilters({
        severity: severity === 'ALL' ? undefined : severity,
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

  const handleClearSearch = useCallback(() => {
    setFilters({ searchTerm: '' });
  }, [setFilters]);

  // Loading state
  if (loading && filteredAlerts.length === 0) {
    return (
      <div className={cn('p-4', className)}>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading alerts...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('p-4', className)}>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <h3 className="font-semibold text-lg">Error Loading Alerts</h3>
              <p className="text-sm text-muted-foreground text-center">
                {error.message}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header with stats */}
      <div className="p-4 border-b bg-background sticky top-0 z-10">
        <div className="space-y-3">
          {/* Stats badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Badge variant="outline" className="shrink-0">
              Total: {stats.total}
            </Badge>
            {stats.critical > 0 && (
              <Badge variant="error" className="shrink-0">
                Critical: {stats.critical}
              </Badge>
            )}
            {stats.warning > 0 && (
              <Badge variant="warning" className="shrink-0">
                Warning: {stats.warning}
              </Badge>
            )}
            {stats.info > 0 && (
              <Badge variant="info" className="shrink-0">
                Info: {stats.info}
              </Badge>
            )}
            {stats.unacknowledged > 0 && (
              <Badge variant="outline" className="shrink-0">
                Unacked: {stats.unacknowledged}
              </Badge>
            )}
          </div>

          {/* Search input */}
          <div className="relative">
            <Input
              type="search"
              placeholder="Search alerts..."
              value={filters.searchTerm || ''}
              onChange={handleSearch}
              className="pr-8 min-h-[44px]"
            />
            {filters.searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Severity filter chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {SEVERITY_FILTERS.map((filter) => {
              const FilterIcon = filter.icon;
              const isActive =
                filter.value === 'ALL'
                  ? !filters.severity
                  : filters.severity === filter.value;

              return (
                <button
                  key={filter.value}
                  onClick={() => handleSeverityFilter(filter.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors shrink-0',
                    'min-h-[44px] touch-manipulation',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <FilterIcon className="h-4 w-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alert list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Info className="h-12 w-12 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">No Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    {filters.severity || filters.searchTerm
                      ? 'No alerts match your filters.'
                      : 'No alerts for this service yet.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={() => acknowledgeAlert(alert.id)}
                acknowledging={acknowledging}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

ServiceAlertsTabMobile.displayName = 'ServiceAlertsTab.Mobile';
