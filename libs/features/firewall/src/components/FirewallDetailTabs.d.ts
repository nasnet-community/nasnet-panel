/**
 * Firewall Detail Tabs Component
 * Tabbed interface for Filter Rules, NAT Rules, and Routing Table
 * Epic 0.6 Enhancement: Dashboard Overview
 */
import React from 'react';
import type { FirewallChain } from '@nasnet/core/types';
interface FirewallDetailTabsProps {
    className?: string;
    defaultTab?: 'filter' | 'nat' | 'routing' | 'mangle' | 'raw' | 'rateLimiting' | 'addressLists' | 'connections' | 'templates' | 'logs';
    selectedChain?: FirewallChain | null;
}
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
declare function FirewallDetailTabsContent({ className, defaultTab, selectedChain, }: FirewallDetailTabsProps): import("react/jsx-runtime").JSX.Element;
export declare const FirewallDetailTabs: React.MemoExoticComponent<typeof FirewallDetailTabsContent>;
export {};
//# sourceMappingURL=FirewallDetailTabs.d.ts.map