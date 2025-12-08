/**
 * Firewall Tab Component - Dashboard Layout
 * Epic 0.6: Firewall & Routing Viewer
 * Restructured with hero stats, overview grid, and tabbed detail views
 */

import { useState, useCallback } from 'react';
import {
  ReadOnlyNotice,
  ServicesStatus,
  ChainSummaryCards,
  TrafficFlowDiagram,
  FirewallStatusHero,
  FirewallQuickStats,
  RecentFirewallActivity,
  FirewallDetailTabs,
} from '@nasnet/features/firewall';
import type { FirewallChain } from '@nasnet/core/types';

export function FirewallTab() {
  const [selectedChain, setSelectedChain] = useState<FirewallChain | null>(null);

  const handleChainSelect = useCallback((chain: FirewallChain | null) => {
    setSelectedChain(chain);
  }, []);

  const handleTrafficFlowChainClick = useCallback(
    (chain: FirewallChain) => {
      handleChainSelect(selectedChain === chain ? null : chain);
    },
    [handleChainSelect, selectedChain]
  );

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="px-2">
          <h1 className="text-2xl md:text-3xl font-semibold mb-1">
            Firewall & Routing
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor firewall rules, NAT configuration, and routing tables
          </p>
        </div>

        {/* Read-Only Notice */}
        <ReadOnlyNotice />

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

        {/* Detailed Tables in Tabs */}
        <FirewallDetailTabs selectedChain={selectedChain} />
      </div>
    </div>
  );
}
