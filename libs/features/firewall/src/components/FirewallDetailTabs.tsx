/**
 * Firewall Detail Tabs Component
 * Tabbed interface for Filter Rules, NAT Rules, and Routing Table
 * Epic 0.6 Enhancement: Dashboard Overview
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@nasnet/ui/primitives';
import {
  Filter,
  ArrowLeftRight,
  Route,
  Tag,
  List,
  Activity,
  Shield,
  FileStack,
  ScrollText,
  Layers,
} from 'lucide-react';
import { FilterRulesTable } from './FilterRulesTable';
import { NATRulesTable } from './NATRulesTable';
import { RoutingTable } from './RoutingTable';
import { MangleRulesTable } from './MangleRulesTable';
import { RawRulesTable } from './RawRulesTable';
import { ConnectionsPage } from './ConnectionsPage';
import { RuleSearchFilters } from './RuleSearchFilters';
import { useRuleFilters } from '../hooks/useRuleFilters';
import type { FirewallChain } from '@nasnet/core/types';
import { cn } from '@nasnet/ui/utils';

interface FirewallDetailTabsProps {
  className?: string;
  defaultTab?:
    | 'filter'
    | 'nat'
    | 'routing'
    | 'mangle'
    | 'raw'
    | 'rateLimiting'
    | 'addressLists'
    | 'connections'
    | 'templates'
    | 'logs';
  selectedChain?: FirewallChain | null;
}

type TabValue =
  | 'filter'
  | 'nat'
  | 'routing'
  | 'mangle'
  | 'raw'
  | 'rateLimiting'
  | 'addressLists'
  | 'connections'
  | 'templates'
  | 'logs';

/**
 * FirewallDetailTabs Component
 *
 * Tabbed interface for firewall management. Provides access to filter rules,
 * NAT rules, routing tables, mangle rules, RAW rules, rate limiting,
 * address lists, connections tracking, templates, and logs.
 *
 * @param props - Component props
 * @returns Tabbed firewall interface component
 */
function FirewallDetailTabsContent({
  className,
  defaultTab = 'filter',
  selectedChain,
}: FirewallDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>(defaultTab);
  const { filters, setFilters, clearAll, activeFilterCount } = useRuleFilters();

  const handleChainChange = useCallback(
    (chain: FirewallChain | null) => {
      setFilters({ chain: chain || 'all' });
    },
    [setFilters]
  );

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue);
  }, []);

  return (
    <div className={className}>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <div className="gap-component-md mb-component-md flex flex-col sm:flex-row sm:items-center">
          <TabsList className="bg-muted p-component-xs rounded-lg">
            <TabsTrigger
              value="filter"
              className={cn(
                'gap-component-sm px-component-md py-component-sm flex items-center rounded-md',
                'data-[state=active]:bg-background'
              )}
            >
              <Filter
                className="h-4 w-4"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Filter Rules</span>
              <span className="sm:hidden">Filter</span>
            </TabsTrigger>
            <TabsTrigger
              value="nat"
              className={cn(
                'gap-component-sm px-component-md py-component-sm flex items-center rounded-md',
                'data-[state=active]:bg-background'
              )}
            >
              <ArrowLeftRight
                className="h-4 w-4"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">NAT Rules</span>
              <span className="sm:hidden">NAT</span>
            </TabsTrigger>
            <TabsTrigger
              value="routing"
              className={cn(
                'gap-component-sm px-component-md py-component-sm flex items-center rounded-md',
                'data-[state=active]:bg-background'
              )}
            >
              <Route
                className="h-4 w-4"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Routing Table</span>
              <span className="sm:hidden">Routes</span>
            </TabsTrigger>
            <TabsTrigger
              value="mangle"
              className={cn(
                'gap-component-sm px-component-md py-component-sm flex items-center rounded-md',
                'data-[state=active]:bg-background'
              )}
            >
              <Tag
                className="h-4 w-4"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Mangle Rules</span>
              <span className="sm:hidden">Mangle</span>
            </TabsTrigger>
            <TabsTrigger
              value="raw"
              className={cn(
                'gap-component-sm px-component-md py-component-sm flex items-center rounded-md',
                'data-[state=active]:bg-background'
              )}
            >
              <Layers
                className="h-4 w-4"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">RAW Rules</span>
              <span className="sm:hidden">RAW</span>
            </TabsTrigger>
            <TabsTrigger
              value="rateLimiting"
              className={cn(
                'gap-component-sm px-component-md py-component-sm flex items-center rounded-md',
                'data-[state=active]:bg-background'
              )}
            >
              <Shield
                className="h-4 w-4"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Rate Limiting</span>
              <span className="sm:hidden">Rate</span>
            </TabsTrigger>
            <TabsTrigger
              value="addressLists"
              className={cn(
                'gap-component-sm px-component-md py-component-sm flex items-center rounded-md',
                'data-[state=active]:bg-background'
              )}
            >
              <List
                className="h-4 w-4"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Address Lists</span>
              <span className="sm:hidden">Lists</span>
            </TabsTrigger>
            <TabsTrigger
              value="connections"
              className={cn(
                'gap-component-sm px-component-md py-component-sm flex items-center rounded-md',
                'data-[state=active]:bg-background'
              )}
            >
              <Activity
                className="h-4 w-4"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Connections</span>
              <span className="sm:hidden">Conns</span>
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className={cn(
                'gap-component-sm px-component-md py-component-sm flex items-center rounded-md',
                'data-[state=active]:bg-background'
              )}
            >
              <FileStack
                className="h-4 w-4"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Templates</span>
              <span className="sm:hidden">Tmpls</span>
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className={cn(
                'gap-component-sm px-component-md py-component-sm flex items-center rounded-md',
                'data-[state=active]:bg-background'
              )}
            >
              <ScrollText
                className="h-4 w-4"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Logs</span>
              <span className="sm:hidden">Logs</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="filter"
          className="space-y-component-md"
        >
          <RuleSearchFilters
            filters={filters}
            onChange={setFilters}
            onClearAll={clearAll}
            activeFilterCount={activeFilterCount}
          />
          <div className="bg-card border-border overflow-hidden rounded-xl border">
            <FilterRulesTable
              chain={filters.chain !== 'all' ? (filters.chain as any) : undefined}
            />
          </div>
        </TabsContent>

        <TabsContent value="nat">
          <div className="bg-card border-border overflow-hidden rounded-xl border">
            <NATRulesTable />
          </div>
        </TabsContent>

        <TabsContent value="routing">
          <div className="bg-card border-border overflow-hidden rounded-xl border">
            <RoutingTable />
          </div>
        </TabsContent>

        <TabsContent value="mangle">
          <div className="bg-card border-border overflow-hidden rounded-xl border">
            <MangleRulesTable />
          </div>
        </TabsContent>

        <TabsContent value="raw">
          <div className="py-component-lg text-muted-foreground text-center">
            <p className="font-medium">RAW Firewall Rules</p>
            <p className="mt-component-md text-foreground/70 font-mono text-sm">
              /router/$id/firewall/raw
            </p>
            <p className="mt-component-md text-xs">
              Use the navigation menu to access the full RAW Rules page.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="rateLimiting">
          <div className="py-component-lg text-muted-foreground text-center">
            <p className="font-medium">Rate Limiting Configuration</p>
            <p className="mt-component-md text-foreground/70 font-mono text-sm">
              /router/$id/firewall/rate-limiting
            </p>
            <p className="mt-component-md text-xs">
              Use the navigation menu to access the full Rate Limiting page.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="addressLists">
          <div className="py-component-lg text-muted-foreground text-center">
            <p className="font-medium">Firewall Address Lists</p>
            <p className="mt-component-md text-foreground/70 font-mono text-sm">
              /router/$id/firewall/address-lists
            </p>
            <p className="mt-component-md text-xs">
              Use the navigation menu to access the full Address Lists page.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="connections">
          <ConnectionsPage />
        </TabsContent>

        <TabsContent value="templates">
          <div className="py-component-lg text-muted-foreground text-center">
            <p className="font-medium">Firewall Rule Templates</p>
            <p className="mt-component-md text-foreground/70 font-mono text-sm">
              /router/$id/firewall/templates
            </p>
            <p className="mt-component-md text-xs">
              Use the navigation menu to access the full Templates page.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="py-component-lg text-muted-foreground text-center">
            <p className="font-medium">Firewall Activity Logs</p>
            <p className="mt-component-md text-foreground/70 font-mono text-sm">
              /router/$id/firewall/logs
            </p>
            <p className="mt-component-md text-xs">
              Use the navigation menu to access the full Firewall Logs page.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const FirewallDetailTabs = React.memo(FirewallDetailTabsContent);
FirewallDetailTabs.displayName = 'FirewallDetailTabs';
