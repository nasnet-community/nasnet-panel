/**
 * Firewall Detail Tabs Component
 * Tabbed interface for Filter Rules, NAT Rules, and Routing Table
 * Epic 0.6 Enhancement: Dashboard Overview
 */

import { useState, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@nasnet/ui/primitives';
import { Filter, ArrowLeftRight, Route } from 'lucide-react';
import { FilterRulesTable } from './FilterRulesTable';
import { NATRulesTable } from './NATRulesTable';
import { RoutingTable } from './RoutingTable';
import { RuleSearchFilters } from './RuleSearchFilters';
import { useRuleFilters } from '../hooks/useRuleFilters';
import type { FirewallChain } from '@nasnet/core/types';

interface FirewallDetailTabsProps {
  className?: string;
  defaultTab?: 'filter' | 'nat' | 'routing';
  selectedChain?: FirewallChain | null;
}

export function FirewallDetailTabs({
  className,
  defaultTab = 'filter',
  selectedChain,
}: FirewallDetailTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { filters, setFilters, clearAll, activeFilterCount } = useRuleFilters();

  const handleChainChange = useCallback(
    (chain: FirewallChain | null) => {
      setFilters({ chain: chain || 'all' });
    },
    [setFilters]
  );

  if (selectedChain && filters.chain !== selectedChain) {
    handleChainChange(selectedChain);
  }

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <TabsTrigger
              value="filter"
              className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter Rules</span>
              <span className="sm:hidden">Filter</span>
            </TabsTrigger>
            <TabsTrigger
              value="nat"
              className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span className="hidden sm:inline">NAT Rules</span>
              <span className="sm:hidden">NAT</span>
            </TabsTrigger>
            <TabsTrigger
              value="routing"
              className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
            >
              <Route className="w-4 h-4" />
              <span className="hidden sm:inline">Routing Table</span>
              <span className="sm:hidden">Routes</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="filter" className="space-y-4">
          <RuleSearchFilters
            filters={filters}
            onChange={setFilters}
            onClearAll={clearAll}
            activeFilterCount={activeFilterCount}
          />
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <FilterRulesTable filters={filters} />
          </div>
        </TabsContent>

        <TabsContent value="nat">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <NATRulesTable />
          </div>
        </TabsContent>

        <TabsContent value="routing">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <RoutingTable />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

























