/**
 * Firewall Detail Tabs Component
 * Tabbed interface for Filter Rules, NAT Rules, and Routing Table
 * Epic 0.6 Enhancement: Dashboard Overview
 */

import { useState, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@nasnet/ui/primitives';
import { Filter, ArrowLeftRight, Route, Tag, List, Activity, Shield, FileStack, ScrollText, Layers } from 'lucide-react';
import { FilterRulesTable } from './FilterRulesTable';
import { NATRulesTable } from './NATRulesTable';
import { RoutingTable } from './RoutingTable';
import { MangleRulesTable } from './MangleRulesTable';
import { RawRulesTable } from './RawRulesTable';
import { ConnectionsPage } from './ConnectionsPage';
import { RuleSearchFilters } from './RuleSearchFilters';
import { useRuleFilters } from '../hooks/useRuleFilters';
import type { FirewallChain } from '@nasnet/core/types';

interface FirewallDetailTabsProps {
  className?: string;
  defaultTab?: 'filter' | 'nat' | 'routing' | 'mangle' | 'raw' | 'rateLimiting' | 'addressLists' | 'connections' | 'templates' | 'logs';
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
            <TabsTrigger
              value="mangle"
              className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
            >
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Mangle Rules</span>
              <span className="sm:hidden">Mangle</span>
            </TabsTrigger>
            <TabsTrigger
              value="raw"
              className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">RAW Rules</span>
              <span className="sm:hidden">RAW</span>
            </TabsTrigger>
            <TabsTrigger
              value="rateLimiting"
              className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Rate Limiting</span>
              <span className="sm:hidden">Rate</span>
            </TabsTrigger>
            <TabsTrigger
              value="addressLists"
              className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Address Lists</span>
              <span className="sm:hidden">Lists</span>
            </TabsTrigger>
            <TabsTrigger
              value="connections"
              className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Connections</span>
              <span className="sm:hidden">Conns</span>
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
            >
              <FileStack className="w-4 h-4" />
              <span className="hidden sm:inline">Templates</span>
              <span className="sm:hidden">Tmpls</span>
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
            >
              <ScrollText className="w-4 h-4" />
              <span className="hidden sm:inline">Logs</span>
              <span className="sm:hidden">Logs</span>
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

        <TabsContent value="mangle">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <MangleRulesTable />
          </div>
        </TabsContent>

        <TabsContent value="raw">
          <div className="text-center py-8 text-muted-foreground">
            <p>RAW Firewall Rules are available at:</p>
            <p className="font-mono text-sm mt-2">/router/$id/firewall/raw</p>
            <p className="text-xs mt-4">Use the navigation menu to access the full RAW Rules page.</p>
          </div>
        </TabsContent>

        <TabsContent value="rateLimiting">
          <div className="text-center py-8 text-muted-foreground">
            <p>Rate Limiting is available at:</p>
            <p className="font-mono text-sm mt-2">/router/$id/firewall/rate-limiting</p>
            <p className="text-xs mt-4">Use the navigation menu to access the full Rate Limiting page.</p>
          </div>
        </TabsContent>

        <TabsContent value="addressLists">
          <div className="text-center py-8 text-muted-foreground">
            <p>Address Lists are available at:</p>
            <p className="font-mono text-sm mt-2">/router/$id/firewall/address-lists</p>
            <p className="text-xs mt-4">Use the navigation menu to access the full Address Lists page.</p>
          </div>
        </TabsContent>

        <TabsContent value="connections">
          <ConnectionsPage />
        </TabsContent>

        <TabsContent value="templates">
          <div className="text-center py-8 text-muted-foreground">
            <p>Firewall Templates are available at:</p>
            <p className="font-mono text-sm mt-2">/router/$id/firewall/templates</p>
            <p className="text-xs mt-4">Use the navigation menu to access the full Templates page.</p>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="text-center py-8 text-muted-foreground">
            <p>Firewall Logs are available at:</p>
            <p className="font-mono text-sm mt-2">/router/$id/firewall/logs</p>
            <p className="text-xs mt-4">Use the navigation menu to access the full Firewall Logs page.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

























