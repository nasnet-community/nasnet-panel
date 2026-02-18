/**
 * Interface IP Configuration Component
 * Dashboard Pro style with grouped IP addresses per interface
 */

import { useState } from 'react';

import { Globe, ChevronRight, ChevronDown } from 'lucide-react';

import { type IPAddress } from '@nasnet/core/types';
import { parseCIDR } from '@nasnet/core/utils';

import { cn } from '@/lib/utils';

import { SectionHeader } from './SectionHeader';

interface InterfaceIPConfigProps {
  ipAddresses: IPAddress[];
  defaultCollapsed?: boolean;
  className?: string;
}

export function InterfaceIPConfig({
  ipAddresses,
  defaultCollapsed = false,
  className,
}: InterfaceIPConfigProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [expandedInterfaces, setExpandedInterfaces] = useState<Set<string>>(new Set());

  const toggleInterface = (interfaceName: string) => {
    const newExpanded = new Set(expandedInterfaces);
    if (newExpanded.has(interfaceName)) {
      newExpanded.delete(interfaceName);
    } else {
      newExpanded.add(interfaceName);
    }
    setExpandedInterfaces(newExpanded);
  };

  const getTypeBadge = (ipAddress: IPAddress) => {
    if (ipAddress.disabled) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          Disabled
        </span>
      );
    }

    if (ipAddress.dynamic) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          Dynamic
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400">
        Static
      </span>
    );
  };

  const getNetworkInfo = (ipAddress: IPAddress) => {
    const cidrInfo = parseCIDR(ipAddress.address);
    if (!cidrInfo) return null;

    return {
      network: cidrInfo.network,
      netmask: cidrInfo.netmask,
      broadcast: cidrInfo.broadcast,
      prefix: cidrInfo.prefix,
    };
  };

  // Group IP addresses by interface
  const groupedIPs = ipAddresses.reduce((acc, ip) => {
    if (!acc[ip.interface]) {
      acc[ip.interface] = [];
    }
    acc[ip.interface].push(ip);
    return acc;
  }, {} as Record<string, IPAddress[]>);

  const interfaceNames = Object.keys(groupedIPs);

  if (ipAddresses.length === 0) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title="IP Addresses"
          count={0}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
        {!isCollapsed && (
          <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Globe className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              No IP addresses configured
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <SectionHeader
        title="IP Addresses"
        count={ipAddresses.length}
        subtitle={`${interfaceNames.length} interfaces`}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      {!isCollapsed && (
        <div className="space-y-2">
          {interfaceNames.map((interfaceName) => {
            const ips = groupedIPs[interfaceName];
            const isExpanded = expandedInterfaces.has(interfaceName);

            return (
              <div
                key={interfaceName}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                {/* Interface Header */}
                <button
                  onClick={() => toggleInterface(interfaceName)}
                  className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="font-medium text-slate-900 dark:text-white text-sm">
                      {interfaceName}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                      {ips.length} {ips.length === 1 ? 'address' : 'addresses'}
                    </span>
                  </div>

                  {/* Quick preview of first IP */}
                  {!isExpanded && ips.length > 0 && (
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 hidden sm:block">
                      {ips[0].address}
                    </span>
                  )}
                </button>

                {/* IP Addresses List */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    {ips.map((ip: IPAddress) => {
                      const networkInfo = getNetworkInfo(ip);

                      return (
                        <div
                          key={ip.id}
                          className="p-3 md:p-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                            <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                              {ip.address}
                            </span>
                            {getTypeBadge(ip)}
                          </div>

                          {networkInfo && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">
                                  Network
                                </p>
                                <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                                  {networkInfo.network}
                                </p>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">
                                  Netmask
                                </p>
                                <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                                  {networkInfo.netmask}
                                </p>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">
                                  Broadcast
                                </p>
                                <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                                  {networkInfo.broadcast}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
