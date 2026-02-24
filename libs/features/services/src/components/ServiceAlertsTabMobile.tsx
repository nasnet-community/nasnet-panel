/**
 * ServiceAlertsTab Mobile Presenter
 *
 * Mobile-optimized presenter for ServiceAlertsTab pattern.
 * Optimized for touch interaction with 44px minimum targets.
 *
 * @description
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
import { CheckCircle2, Loader2, AlertTriangle, Info, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  ScrollArea,
  Icon,
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
  iconName: string;
}> = [
  { value: 'ALL', label: 'All', iconName: 'alert-circle' },
  { value: 'CRITICAL', label: 'Critical', iconName: 'alert-triangle' },
  { value: 'WARNING', label: 'Warning', iconName: 'alert-triangle' },
  { value: 'INFO', label: 'Info', iconName: 'info' },
];

/**
 * Get severity color classes and icon name
 */
function getSeverityStyles(severity: AlertSeverity): {
  borderColor: string;
  badgeVariant: 'error' | 'warning' | 'info';
  iconName: string;
} {
  switch (severity) {
    case 'CRITICAL':
      return {
        borderColor: 'border-l-destructive',
        badgeVariant: 'error',
        iconName: 'alert-triangle',
      };
    case 'WARNING':
      return {
        borderColor: 'border-l-warning',
        badgeVariant: 'warning',
        iconName: 'alert-triangle',
      };
    case 'INFO':
    default:
      return {
        borderColor: 'border-l-info',
        badgeVariant: 'info',
        iconName: 'info',
      };
  }
}

/**
 * Get icon component from icon name
 */
function getIconComponent(iconName: string): React.ComponentType<any> {
  const iconMap: Record<string, React.ComponentType<any>> = {
    'alert-circle': AlertTriangle,
    'alert-triangle': AlertTriangle,
    'info': Info,
  };
  return iconMap[iconName] || Info;
}

/**
 * AlertCard component
 *
 * @description
 * Individual alert card with swipe-to-acknowledge gesture support.
 * Displays alert details with severity-colored border and acknowledgment status.
 *
 * @param alert - Alert data
 * @param onAcknowledge - Callback when alert is acknowledged
 * @param acknowledging - Loading state during acknowledgment
 * @returns Rendered alert card
 */
function AlertCardComponent({
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
          <Icon icon={CheckCircle2} className="h-6 w-6 text-white" aria-hidden="true" />
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
        <CardContent className="p-component-md space-y-component-sm">
          {/* Header row */}
          <div className="flex items-start justify-between gap-component-sm">
            <div className="flex items-center gap-component-sm flex-1 min-w-0">
              <Icon icon={getIconComponent(styles.iconName) as LucideIcon} className="h-5 w-5 shrink-0" aria-hidden="true" />
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
          <div className="flex items-center gap-component-sm text-xs text-muted-foreground">
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
                  <Icon icon={Loader2} className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                  Acknowledging...
                </>
              ) : (
                <>
                  <Icon icon={CheckCircle2} className="h-4 w-4 mr-2" aria-hidden="true" />
                  Acknowledge
                </>
              )}
            </Button>
          ) : (
            <div className="text-xs text-muted-foreground flex items-center gap-component-sm">
              <Icon icon={CheckCircle2} className="h-4 w-4 text-success" aria-hidden="true" />
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

export const AlertCard = React.memo(AlertCardComponent);
AlertCard.displayName = 'AlertCard';

/**
 * ServiceAlertsTabMobile component
 *
 * @description
 * Mobile presenter for ServiceAlertsTab with touch-optimized interface.
 * Displays alerts as cards with severity-colored borders.
 * Supports swipe-to-acknowledge gestures and severity filtering.
 *
 * Features:
 * - Filter chips at top for quick severity filtering
 * - Search input for filtering by message/title
 * - Card list with severity-colored borders
 * - Swipe-to-acknowledge gesture (left swipe)
 * - Large touch targets (44px minimum)
 * - Scroll-based pagination
 *
 * @param props - Component props
 * @returns Rendered mobile alerts tab
 */
function ServiceAlertsTabMobileComponent({
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
      <div className={cn('p-component-md', className)}>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-component-md">
          <Icon icon={Loader2} className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Loading alerts...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('p-component-md', className)}>
        <Card className="border-error">
          <CardContent className="p-component-lg">
            <div className="flex flex-col items-center gap-component-sm">
              <Icon icon={AlertTriangle} className="h-8 w-8 text-error" aria-hidden="true" />
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
      <div className="p-component-md border-b bg-background sticky top-0 z-10">
        <div className="space-y-component-sm">
          {/* Stats badges */}
          <div className="flex items-center gap-component-sm overflow-x-auto pb-1">
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
                aria-label="Clear search"
              >
                <Icon icon={X} className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>

          {/* Severity filter chips */}
          <div className="flex items-center gap-component-sm overflow-x-auto pb-1">
            {SEVERITY_FILTERS.map((filter) => {
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
                  aria-pressed={isActive}
                >
                  <Icon icon={getIconComponent(filter.iconName) as LucideIcon} className="h-4 w-4" aria-hidden="true" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alert list */}
      <ScrollArea className="flex-1">
        <div className="p-component-md space-y-component-sm">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-component-lg">
                <div className="flex flex-col items-center gap-component-sm text-center">
                  <Icon icon={Info} className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
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

export const ServiceAlertsTabMobile = React.memo(ServiceAlertsTabMobileComponent);
ServiceAlertsTabMobile.displayName = 'ServiceAlertsTab.Mobile';
