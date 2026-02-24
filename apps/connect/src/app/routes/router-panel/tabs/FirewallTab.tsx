/**
 * Firewall Tab Component - Dashboard Layout
 * Epic 0.6: Firewall & Routing Viewer
 * Restructured with hero stats, overview grid, and tabbed detail views
 *
 * NAS-7.10: Counter visualization controls integrated
 */

import { useState, useCallback } from 'react';

import { Settings2, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';


import {
  useFilterRules,
  useMoveFilterRule,
  useDeleteFilterRule,
  useToggleFilterRule,
} from '@nasnet/api-client/queries/firewall';
import type { FirewallRule , FirewallChain } from '@nasnet/core/types';
import {
  ServicesStatus,
  ChainSummaryCards,
  TrafficFlowDiagram,
  FirewallStatusHero,
  FirewallQuickStats,
  RecentFirewallActivity,
  FirewallDetailTabs,
 useCounterSettingsStore } from '@nasnet/features/firewall';
import { useConnectionStore } from '@nasnet/state/stores';
import { RuleEfficiencyReport, UnusedRulesFilter } from '@nasnet/ui/patterns';
import type { Suggestion } from '@nasnet/ui/patterns/rule-efficiency-report/types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  Card,
  CardContent,
  useToast,
} from '@nasnet/ui/primitives';



export function FirewallTab() {
  const { t } = useTranslation('firewall');
  const [selectedChain, setSelectedChain] = useState<FirewallChain | null>(null);
  const [showEfficiencyReport, setShowEfficiencyReport] = useState(false);
  const [showUnusedOnly, setShowUnusedOnly] = useState(false);
  const [sortMode, setSortMode] = useState<'default' | 'packets-asc' | 'packets-desc'>('default');
  const { toast } = useToast();

  // Counter settings from Zustand store
  const pollingInterval = useCounterSettingsStore((state) => state.pollingInterval);
  const showRelativeBar = useCounterSettingsStore((state) => state.showRelativeBar);
  const showRate = useCounterSettingsStore((state) => state.showRate);
  const setPollingInterval = useCounterSettingsStore((state) => state.setPollingInterval);
  const setShowRelativeBar = useCounterSettingsStore((state) => state.setShowRelativeBar);
  const setShowRate = useCounterSettingsStore((state) => state.setShowRate);

  // Fetch filter rules for efficiency report
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: rules } = useFilterRules(routerIp);

  // Mutation hooks for efficiency report actions
  const moveFilterRule = useMoveFilterRule(routerIp);
  const deleteFilterRule = useDeleteFilterRule(routerIp);
  const toggleFilterRule = useToggleFilterRule(routerIp);

  const handleChainSelect = useCallback((chain: FirewallChain | null) => {
    setSelectedChain(chain);
  }, []);

  const handleTrafficFlowChainClick = useCallback(
    (chain: FirewallChain) => {
      handleChainSelect(selectedChain === chain ? null : chain);
    },
    [handleChainSelect, selectedChain]
  );

  const handleApplySuggestion = useCallback(
    async (suggestion: Suggestion) => {
      try {
        switch (suggestion.action) {
          case 'move':
            if (suggestion.targetPosition === undefined) {
              throw new Error('Target position is required for move action');
            }
            if (suggestion.affectedRules.length === 0) {
              throw new Error('No affected rules specified');
            }
            await moveFilterRule.mutateAsync({
              ruleId: suggestion.affectedRules[0],
              destination: suggestion.targetPosition,
            });
            toast({
              title: t('actions.ruleReorderedSuccess'),
              description: suggestion.title,
            });
            break;

          case 'delete':
            if (suggestion.affectedRules.length === 0) {
              throw new Error('No affected rules specified');
            }
            await deleteFilterRule.mutateAsync(suggestion.affectedRules[0]);
            toast({
              title: t('actions.ruleDeletedSuccess'),
              description: suggestion.title,
            });
            break;

          case 'disable':
            if (suggestion.affectedRules.length === 0) {
              throw new Error('No affected rules specified');
            }
            await toggleFilterRule.mutateAsync({
              ruleId: suggestion.affectedRules[0],
              disabled: true,
            });
            toast({
              title: t('actions.ruleDisabledSuccess'),
              description: suggestion.title,
            });
            break;

          default:
            console.warn('Unknown suggestion action:', suggestion.action);
        }
      } catch (error) {
        toast({
          title: t('actions.applySuggestionFailed'),
          description: error instanceof Error ? error.message : t('actions.unknownError'),
          variant: 'destructive',
        });
      }
    },
    [moveFilterRule, deleteFilterRule, toggleFilterRule, toast, t]
  );

  const handlePreviewSuggestion = useCallback((suggestion: Suggestion) => {
    // TODO: Implement preview (read-only visualization)
    // This would show the user what the rule order would look like after applying the suggestion
    // without actually making the change
    console.log('Preview suggestion:', suggestion);
  }, []);

  return (
    <div className="p-component-md md:p-component-lg">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="px-component-sm">
          <h1 className="text-2xl md:text-3xl font-semibold mb-1">
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>

        {/* Hero Stats Section */}
        <FirewallStatusHero />

        {/* Dashboard Grid: 2 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3 width) - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chain Summary Cards */}
            <ChainSummaryCards
              selectedChain={selectedChain}
              onChainSelect={handleChainSelect}
            />

            {/* Traffic Flow Diagram */}
            <TrafficFlowDiagram
              activeChain={selectedChain}
              onChainClick={handleTrafficFlowChainClick}
            />
          </div>

          {/* Right Column (1/3 width) - Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <FirewallQuickStats />

            {/* Services Status (Compact) */}
            <ServicesStatus compact />

            {/* Recent Activity */}
            <RecentFirewallActivity />
          </div>
        </div>

        {/* Counter Controls Toolbar */}
        <Card>
          <CardContent className="p-component-md">
            <div className="flex flex-col md:flex-row gap-component-md md:items-center md:justify-between">
              {/* Left side: Filter controls */}
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <UnusedRulesFilter
                  onFilterChange={setShowUnusedOnly}
                  onSortChange={setSortMode}
                  showUnusedOnly={showUnusedOnly}
                  currentSort={sortMode}
                />
              </div>

              {/* Right side: Action buttons and settings */}
              <div className="flex gap-component-sm">
                {/* Efficiency Report Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEfficiencyReport(true)}
                  className="gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  {t('buttons.efficiencyReport')}
                </Button>

                {/* Counter Settings Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings2 className="h-4 w-4" />
                      {t('buttons.counterSettings')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{t('settings.pollingInterval')}</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setPollingInterval(null)}>
                      {pollingInterval === null && '✓ '}{t('settings.manual')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPollingInterval(5000)}>
                      {pollingInterval === 5000 && '✓ '}5 {t('settings.seconds')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPollingInterval(10000)}>
                      {pollingInterval === 10000 && '✓ '}10 {t('settings.seconds')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPollingInterval(30000)}>
                      {pollingInterval === 30000 && '✓ '}30 {t('settings.seconds')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPollingInterval(60000)}>
                      {pollingInterval === 60000 && '✓ '}60 {t('settings.seconds')}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>{t('settings.displayOptions')}</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      checked={showRelativeBar}
                      onCheckedChange={setShowRelativeBar}
                    >
                      {t('settings.showTrafficBars')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={showRate}
                      onCheckedChange={setShowRate}
                    >
                      {t('settings.showRate')}
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Tables in Tabs */}
        <FirewallDetailTabs selectedChain={selectedChain} />
      </div>

      {/* Efficiency Report Dialog */}
      <Dialog open={showEfficiencyReport} onOpenChange={setShowEfficiencyReport}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('dialogs.efficiencyReportTitle')}</DialogTitle>
            <DialogDescription>
              {t('dialogs.efficiencyReportDescription')}
            </DialogDescription>
          </DialogHeader>
          <RuleEfficiencyReport
            rules={(rules || []) as FirewallRule[]}
            onApplySuggestion={handleApplySuggestion}
            onPreview={handlePreviewSuggestion}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

FirewallTab.displayName = 'FirewallTab';
