/**
 * Firewall Logs Page Component
 *
 * Main page for viewing firewall logs with filters, stats, and auto-refresh.
 *
 * Features:
 * - Desktop: Sidebar filters + main log viewer + stats panel
 * - Mobile: Bottom sheet filters + card-based viewer
 * - Auto-refresh controls (play/pause, interval selector)
 * - Export logs functionality
 * - Rule navigation via log prefix clicks
 * - ARIA live region for new log announcements
 *
 * @see Task #10: Integration - FirewallLogsPage
 * @see NAS-5.6: Implement Firewall Logging Viewer
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConnectionStore, useFirewallLogStore } from '@nasnet/state/stores';
import { useRuleNavigation } from '../hooks';
import {
  FirewallLogViewer,
  FirewallLogFilters,
  FirewallLogStats,
  useFirewallLogViewer,
} from '@nasnet/ui/patterns';
import type { FirewallLogEntry } from '@nasnet/core/types';
import { cn } from '@nasnet/ui/utils';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';
import {
  Play,
  Pause,
  Download,
  Filter,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ============================================================================
// Platform Detection Hook
// ============================================================================

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

// ============================================================================
// Auto-Refresh Controls Component
// ============================================================================

interface AutoRefreshControlsProps {
  isAutoRefreshEnabled: boolean;
  refreshInterval: number | false;
  onToggleRefresh: () => void;
  onIntervalChange: (interval: number | false) => void;
  onExport: () => void;
  className?: string;
}

const AutoRefreshControls = React.memo(function AutoRefreshControlsComponent({
  isAutoRefreshEnabled,
  refreshInterval,
  onToggleRefresh,
  onIntervalChange,
  onExport,
  className,
}: AutoRefreshControlsProps) {
  AutoRefreshControls.displayName = 'AutoRefreshControls';
  const { t } = useTranslation('firewall');

  return (
    <div className={cn('flex items-center gap-component-sm', className)}>
      {/* Play/Pause Toggle */}
      <Button
        variant={isAutoRefreshEnabled ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleRefresh}
        aria-label={isAutoRefreshEnabled ? t('logs.controls.pauseRefresh') : t('logs.controls.startRefresh')}
        title={isAutoRefreshEnabled ? 'Pause auto-refresh' : 'Start auto-refresh'}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {isAutoRefreshEnabled ? (
          <Pause className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>

      {/* Interval Selector */}
      <Select
        value={refreshInterval === false ? 'manual' : refreshInterval.toString()}
        onValueChange={(value) => {
          const interval = value === 'manual' ? false : parseInt(value, 10);
          onIntervalChange(interval as number | false);
        }}
      >
        <SelectTrigger className="w-32 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="5000">5s</SelectItem>
          <SelectItem value="10000">10s</SelectItem>
          <SelectItem value="30000">30s</SelectItem>
          <SelectItem value="60000">60s</SelectItem>
          <SelectItem value="manual">{t('logs.controls.manual')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Export Button */}
      <Button variant="outline" size="sm" onClick={onExport} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Download className="h-4 w-4 mr-2" aria-hidden="true" />
        {t('logs.controls.export')}
      </Button>
    </div>
  );
});

// ============================================================================
// Desktop Layout Component
// ============================================================================

interface DesktopLayoutProps {
  routerId: string;
  filters: any;
  onFiltersChange: (filters: any) => void;
  availablePrefixes: string[];
  logs: FirewallLogEntry[];
  onPrefixClick: (prefix: string) => void;
  onAddToBlocklist?: (ip: string) => void;
  expandedStats: boolean;
  onToggleStats: () => void;
  autoRefreshControls: React.ReactNode;
  className?: string;
}

const DesktopLayout = React.memo(function DesktopLayoutComponent({
  routerId,
  filters,
  onFiltersChange,
  availablePrefixes,
  logs,
  onPrefixClick,
  onAddToBlocklist,
  expandedStats,
  onToggleStats,
  autoRefreshControls,
  className,
}: DesktopLayoutProps) {
  DesktopLayout.displayName = 'DesktopLayout';
  const { t } = useTranslation('firewall');

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Filters */}
      <div className="w-80 border-r border-border bg-muted/30 p-component-md overflow-y-auto">
        <div className="mb-component-md">
          <h2 className="text-lg font-semibold font-display mb-2">{t('logs.filters.title')}</h2>
        </div>
        <FirewallLogFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          availablePrefixes={availablePrefixes}
        />
      </div>

      {/* Main Content - Log Viewer */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Controls */}
        <div className="border-b border-border p-component-md bg-card">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-display">{t('logs.title')}</h1>
            {autoRefreshControls}
          </div>
        </div>

        {/* Log Viewer */}
        <div className="flex-1 overflow-hidden p-component-md">
          <FirewallLogViewer
            routerId={routerId}
            onPrefixClick={onPrefixClick}
            onAddToBlocklist={onAddToBlocklist}
          />
        </div>
      </div>

      {/* Right Panel - Stats */}
      {expandedStats && (
        <div className="w-96 border-l border-border bg-muted/30 p-component-md overflow-y-auto">
          <div className="flex items-center justify-between mb-component-md">
            <h2 className="text-lg font-semibold font-display">{t('logs.stats.title')}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleStats}
              aria-label={t('logs.stats.collapse')}
              title="Collapse stats panel"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <FirewallLogStats logs={logs} onAddToBlocklist={onAddToBlocklist} />
        </div>
      )}

      {/* Collapsed Stats Toggle */}
      {!expandedStats && (
        <div className="border-l border-border bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleStats}
            className="h-full px-component-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={t('logs.stats.expand')}
            title="Expand stats panel"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// Mobile Layout Component
// ============================================================================

interface MobileLayoutProps {
  routerId: string;
  filters: any;
  onFiltersChange: (filters: any) => void;
  availablePrefixes: string[];
  logs: FirewallLogEntry[];
  onPrefixClick: (prefix: string) => void;
  onAddToBlocklist?: (ip: string) => void;
  filtersSheetOpen: boolean;
  onFiltersSheetChange: (open: boolean) => void;
  autoRefreshControls: React.ReactNode;
  activeFilterCount: number;
  className?: string;
}

const MobileLayout = React.memo(function MobileLayoutComponent({
  routerId,
  filters,
  onFiltersChange,
  availablePrefixes,
  logs,
  onPrefixClick,
  onAddToBlocklist,
  filtersSheetOpen,
  onFiltersSheetChange,
  autoRefreshControls,
  activeFilterCount,
  className,
}: MobileLayoutProps) {
  MobileLayout.displayName = 'MobileLayout';
  const { t } = useTranslation('firewall');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-component-md bg-card">
        <h1 className="text-xl font-bold font-display mb-component-md">{t('logs.title')}</h1>
        <div className="flex items-center gap-component-sm">
          {autoRefreshControls}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersSheetChange(true)}
            className="ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Open filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
          >
            <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
            {t('logs.filters.title')}
            {activeFilterCount > 0 && (
              <span className="ml-2 px-component-sm py-0.5 text-xs bg-primary text-primary-foreground rounded-[var(--semantic-radius-badge)] font-semibold" aria-label={`${activeFilterCount} active filters`}>
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Log Viewer */}
      <div className="flex-1 overflow-y-auto p-component-md">
        <FirewallLogViewer
          routerId={routerId}
          onPrefixClick={onPrefixClick}
          onAddToBlocklist={onAddToBlocklist}
        />

        {/* Stats Card (Mobile) */}
        <Card className="mt-component-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-component-sm font-display">
              <BarChart3 className="h-5 w-5" />
              {t('logs.stats.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FirewallLogStats logs={logs} onAddToBlocklist={onAddToBlocklist} />
          </CardContent>
        </Card>
      </div>

      {/* Filters Bottom Sheet */}
      <Sheet open={filtersSheetOpen} onOpenChange={onFiltersSheetChange}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle className="font-display">{t('logs.filters.title')}</SheetTitle>
            <SheetDescription>{t('logs.filters.description')}</SheetDescription>
          </SheetHeader>
          <div className="mt-component-md overflow-y-auto">
            <FirewallLogFilters
              filters={filters}
              onFiltersChange={onFiltersChange}
              availablePrefixes={availablePrefixes}
              open={filtersSheetOpen}
              onClose={() => onFiltersSheetChange(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * FirewallLogsPage Component
 *
 * Main page for firewall log viewing with adaptive layout.
 *
 * @returns Firewall logs page component
 */
export function FirewallLogsPage() {
  const { t } = useTranslation('firewall');
  const isMobile = useMediaQuery('(max-width: 640px)');

  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  // Store state
  const {
    filters,
    setFilters,
    autoRefresh,
    toggleAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    expandedStats,
    toggleExpandedStats,
    filtersSheetOpen,
    setFiltersSheetOpen,
  } = useFirewallLogStore();

  // Navigation hook
  const { navigateToRuleByPrefix } = useRuleNavigation({ routerId: routerIp });

  // Use headless hook for log viewer logic
  const viewer = useFirewallLogViewer({
    routerId: routerIp,
    initialState: {
      filters,
      autoRefresh,
      refreshInterval: refreshInterval || undefined,
    } as any,
  });

  // ARIA live region ref for accessibility announcements
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const previousLogCountRef = useRef(viewer.logs.length);

  // Announce new logs to screen readers
  useEffect(() => {
    if (viewer.logs.length > previousLogCountRef.current) {
      const newCount = viewer.logs.length - previousLogCountRef.current;
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = t('logs.accessibility.newLogsAnnouncement', {
          count: newCount,
        });
      }
    }
    previousLogCountRef.current = viewer.logs.length;
  }, [viewer.logs.length, t]);

  // Extract available prefixes from logs for autocomplete
  const availablePrefixes = Array.from(
    new Set(
      viewer.logs
        .map((log) => log.parsed.prefix)
        .filter((prefix): prefix is string => prefix !== undefined)
    )
  );

  // Count active filters
  const activeFilterCount = [
    filters.actions.length > 0,
    filters.srcIp,
    filters.dstIp,
    filters.srcPort,
    filters.dstPort,
    filters.prefix,
  ].filter(Boolean).length;

  // Handlers
  const handlePrefixClick = useCallback(
    (prefix: string) => {
      navigateToRuleByPrefix(prefix);
    },
    [navigateToRuleByPrefix]
  );

  const handleExport = useCallback(() => {
    // Export logs to CSV
    const csv = [
      // Header
      ['Timestamp', 'Chain', 'Action', 'Source IP', 'Source Port', 'Dest IP', 'Dest Port', 'Protocol', 'Prefix'].join(','),
      // Data rows
      ...viewer.logs.map((log) =>
        [
          log.timestamp,
          log.parsed.chain,
          log.parsed.action,
          log.parsed.srcIp || '',
          log.parsed.srcPort || '',
          log.parsed.dstIp || '',
          log.parsed.dstPort || '',
          log.parsed.protocol,
          log.parsed.prefix || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `firewall-logs-${new Date().toISOString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [viewer.logs]);

  const handleAddToBlocklist = useCallback(
    (ip: string) => {
      // TODO: Implement blocklist integration
      // This will be connected to the address list API in a future task
    },
    []
  );

  // Auto-refresh controls
  const autoRefreshControls = (
    <AutoRefreshControls
      isAutoRefreshEnabled={autoRefresh}
      refreshInterval={refreshInterval}
      onToggleRefresh={toggleAutoRefresh}
      onIntervalChange={setRefreshInterval as any}
      onExport={handleExport}
    />
  );

  return (
    <>
      {/* ARIA Live Region for new log announcements */}
      <div
        ref={liveRegionRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Platform-specific layout */}
      {isMobile ? (
        <MobileLayout
          routerId={routerIp}
          filters={filters}
          onFiltersChange={setFilters}
          availablePrefixes={availablePrefixes}
          logs={viewer.logs}
          onPrefixClick={handlePrefixClick}
          onAddToBlocklist={handleAddToBlocklist}
          filtersSheetOpen={filtersSheetOpen}
          onFiltersSheetChange={setFiltersSheetOpen}
          autoRefreshControls={autoRefreshControls}
          activeFilterCount={activeFilterCount}
        />
      ) : (
        <DesktopLayout
          routerId={routerIp}
          filters={filters}
          onFiltersChange={setFilters}
          availablePrefixes={availablePrefixes}
          logs={viewer.logs}
          onPrefixClick={handlePrefixClick}
          onAddToBlocklist={handleAddToBlocklist}
          expandedStats={expandedStats}
          onToggleStats={toggleExpandedStats}
          autoRefreshControls={autoRefreshControls}
        />
      )}
    </>
  );
}
