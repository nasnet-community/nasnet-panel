import { useEffect, useCallback } from 'react';

import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Wifi,
  Shield,
  ShieldAlert,
  Network,
  Globe,
  Cable,
  ScrollText,
  Store,
  Boxes
} from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import {
  preloadFirewallTab,
  preloadLogsTab,
  preloadDHCPTab,
  preloadDnsTab,
  preloadPluginStoreTab,
  preloadAllHeavyTabs,
} from '@/app/routes/router-panel/tabs/lazy';
import { Route } from '@/routes/router/$id/route';

/**
 * Tab definition interface
 */
interface TabDefinition {
  value: string;
  label: string;
  mobileLabel?: string; // Shorter label for mobile
  icon: React.ElementType;
  ariaLabel: string;
  /** Optional preload function for lazy-loaded tabs */
  preload?: () => void;
}

/**
 * Tab configuration
 */
/**
 * Tab configuration with preload functions for lazy-loaded tabs
 *
 * Heavy tabs (firewall, logs, dhcp, plugins) are code-split and
 * their components are preloaded on hover for instant navigation.
 *
 * @see NAS-4.12: Performance Optimization
 */
const tabs: TabDefinition[] = [
  {
    value: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    ariaLabel: 'Router overview and status',
  },
  {
    value: 'wifi',
    label: 'WiFi',
    icon: Wifi,
    ariaLabel: 'WiFi configuration',
  },
  {
    value: 'vpn',
    label: 'VPN',
    icon: Shield,
    ariaLabel: 'VPN configuration',
  },
  {
    value: 'firewall',
    label: 'Firewall',
    mobileLabel: 'FW',
    icon: ShieldAlert,
    ariaLabel: 'Firewall settings',
    preload: preloadFirewallTab,
  },
  {
    value: 'dhcp',
    label: 'DHCP',
    icon: Network,
    ariaLabel: 'DHCP server configuration',
    preload: preloadDHCPTab,
  },
  {
    value: 'dns',
    label: 'DNS',
    icon: Globe,
    ariaLabel: 'DNS configuration and servers',
    preload: preloadDnsTab,
  },
  {
    value: 'network',
    label: 'Network',
    mobileLabel: 'Net',
    icon: Cable,
    ariaLabel: 'Network settings',
  },
  {
    value: 'logs',
    label: 'Logs',
    icon: ScrollText,
    ariaLabel: 'System logs',
    preload: preloadLogsTab,
  },
  {
    value: 'plugins',
    label: 'Store',
    icon: Store,
    ariaLabel: 'Plugin store',
    preload: preloadPluginStoreTab,
  },
  {
    value: 'services',
    label: 'Services',
    mobileLabel: 'Svc',
    icon: Boxes,
    ariaLabel: 'Service management',
  },
];

/**
 * Tab Navigation Component
 *
 * Provides adaptive tab-based navigation for the router panel.
 * Integrates with React Router for URL-driven navigation.
 *
 * Features:
 * - Adaptive layout: bottom navigation on mobile, top tabs on desktop
 * - Icons for visual recognition
 * - URL reflects active tab (e.g., /router/123/wifi)
 * - Deep linking support
 * - Keyboard navigation (Tab, Arrow keys, Enter)
 * - Touch-optimized on mobile (44x44px minimum)
 * - ARIA attributes for accessibility
 *
 * Breakpoint: 768px (md)
 * - Mobile (< 768px): Bottom navigation with icon + label vertical layout
 * - Desktop (≥ 768px): Top tabs with icon + label horizontal layout
 *
 * Usage:
 * ```tsx
 * <TabNavigation />
 * ```
 */
export function TabNavigation() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  // Determine active tab from URL path
  const pathSegments = pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];

  // If last segment is router ID, we're on overview (index route)
  const activeTab =
    lastSegment === id || !lastSegment ? 'overview' : lastSegment;

  // Preload all heavy tabs when entering router panel
  // This ensures fast tab switches after initial load
  useEffect(() => {
    preloadAllHeavyTabs();
  }, []);

  /**
   * Handle tab change - navigate to new tab URL
   */
  const handleTabClick = (tabValue: string) => {
    const basePath = `/router/${id}`;
    const targetPath = tabValue === 'overview' ? basePath : `${basePath}/${tabValue}`;
    navigate({ to: targetPath });
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent, tabValue: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTabClick(tabValue);
    }
  };

  /**
   * Handle hover - preload the tab's component
   * Uses mouseenter for instant feedback on hover intent
   */
  const handleMouseEnter = useCallback((preload?: () => void) => {
    if (preload) {
      preload();
    }
  }, []);

  return (
    <>
      {/* Desktop Navigation - Top Tabs */}
      <nav 
        className="hidden md:block border-b border-default bg-transparent"
        role="navigation"
        aria-label="Router panel sections"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            
            return (
              <button
                key={tab.value}
                onClick={() => handleTabClick(tab.value)}
                onKeyDown={(e) => handleKeyDown(e, tab.value)}
                onMouseEnter={() => handleMouseEnter(tab.preload)}
                onFocus={() => handleMouseEnter(tab.preload)}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.ariaLabel}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200',
                  'border-b-2 border-transparent focus-ring',
                  'hover:text-primary-600 dark:hover:text-primary-400',
                  isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-400'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Navigation - Bottom Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 surface-secondary border-t border-default shadow-lg safe-bottom"
        role="navigation"
        aria-label="Router panel sections"
      >
        <div className="grid grid-cols-9 h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            const displayLabel = tab.mobileLabel || tab.label;
            
            return (
              <button
                key={tab.value}
                onClick={() => handleTabClick(tab.value)}
                onKeyDown={(e) => handleKeyDown(e, tab.value)}
                onTouchStart={() => handleMouseEnter(tab.preload)}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.ariaLabel}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-all duration-200',
                  'focus-ring min-h-[44px]',
                  'active:scale-95',
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-400'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform',
                    isActive && 'scale-110'
                  )}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-medium leading-none">
                  {displayLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
