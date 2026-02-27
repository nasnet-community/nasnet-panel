/**
 * Interface IP Configuration Component
 * Dashboard Pro style with grouped IP addresses per interface
 */

import React, { useState } from 'react';

import { Globe, ChevronRight, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { type IPAddress } from '@nasnet/core/types';
import { parseCIDR } from '@nasnet/core/utils';

import { cn } from '@nasnet/ui/utils';

import { SectionHeader } from './SectionHeader';

interface InterfaceIPConfigProps {
  ipAddresses: IPAddress[];
  defaultCollapsed?: boolean;
  className?: string;
}

export const InterfaceIPConfig = React.memo(function InterfaceIPConfig({
  ipAddresses,
  defaultCollapsed = false,
  className,
}: InterfaceIPConfigProps) {
  const { t } = useTranslation('network');
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
    if (ipAddress.isDisabled) {
      return (
        <span className="bg-muted text-muted-foreground inline-flex items-center rounded px-2 py-0.5 text-xs font-medium">
          {t('status.disabled', { ns: 'common' })}
        </span>
      );
    }

    if (ipAddress.isDynamic) {
      return (
        <span className="bg-success/10 text-success inline-flex items-center rounded px-2 py-0.5 text-xs font-medium">
          {t('ipConfig.dynamic')}
        </span>
      );
    }

    return (
      <span className="bg-info/10 text-info inline-flex items-center rounded px-2 py-0.5 text-xs font-medium">
        {t('ipConfig.static')}
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
  const groupedIPs = ipAddresses.reduce(
    (acc, ip) => {
      if (!acc[ip.interface]) {
        acc[ip.interface] = [];
      }
      acc[ip.interface].push(ip);
      return acc;
    },
    {} as Record<string, IPAddress[]>
  );

  const interfaceNames = Object.keys(groupedIPs);

  if (ipAddresses.length === 0) {
    return (
      <div className="space-y-component-md">
        <SectionHeader
          title={t('ipConfig.title')}
          count={0}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
        {!isCollapsed && (
          <div className="bg-card border-border rounded-xl border py-8 text-center">
            <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <Globe className="text-muted-foreground h-6 w-6" />
            </div>
            <p className="text-muted-foreground text-sm">{t('ipConfig.notConfigured')}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-component-md', className)}>
      <SectionHeader
        title={t('ipConfig.title')}
        count={ipAddresses.length}
        subtitle={t('ipConfig.interfaces', { count: interfaceNames.length })}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      {!isCollapsed && (
        <div className="space-y-component-sm">
          {interfaceNames.map((interfaceName) => {
            const ips = groupedIPs[interfaceName];
            const isExpanded = expandedInterfaces.has(interfaceName);

            return (
              <div
                key={interfaceName}
                className="bg-card border-border rounded-card-sm overflow-hidden border"
              >
                {/* Interface Header */}
                <button
                  onClick={() => toggleInterface(interfaceName)}
                  className="hover:bg-muted/50 focus-visible:ring-ring flex min-h-[44px] w-full items-center justify-between p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:p-4"
                >
                  <div className="gap-component-md flex items-center">
                    {isExpanded ?
                      <ChevronDown
                        className="text-muted-foreground h-4 w-4"
                        aria-hidden="true"
                      />
                    : <ChevronRight
                        className="text-muted-foreground h-4 w-4"
                        aria-hidden="true"
                      />
                    }
                    <span className="font-display text-foreground text-sm font-semibold">
                      {interfaceName}
                    </span>
                    <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs font-medium">
                      {t('ipConfig.addressCount', { count: ips.length })}
                    </span>
                  </div>

                  {/* Quick preview of first IP */}
                  {!isExpanded && ips.length > 0 && (
                    <span className="text-muted-foreground hidden break-all font-mono text-xs sm:block">
                      {ips[0].address}
                    </span>
                  )}
                </button>

                {/* IP Addresses List */}
                {isExpanded && (
                  <div className="border-border border-t">
                    {ips.map((ip: IPAddress) => {
                      const networkInfo = getNetworkInfo(ip);

                      return (
                        <div
                          key={ip.id}
                          className="border-border border-b p-3 last:border-b-0 md:p-4"
                        >
                          <div className="gap-component-sm mb-2 flex flex-wrap items-center justify-between">
                            <span className="text-foreground break-all font-mono text-sm font-medium">
                              {ip.address}
                            </span>
                            {getTypeBadge(ip)}
                          </div>

                          {networkInfo && (
                            <div className="gap-component-sm mt-3 grid grid-cols-1 sm:grid-cols-3">
                              <div className="bg-muted rounded-card-sm p-2">
                                <p className="text-muted-foreground mb-0.5 text-xs font-medium">
                                  {t('ipConfig.network')}
                                </p>
                                <p className="text-foreground break-all font-mono text-xs">
                                  {networkInfo.network}
                                </p>
                              </div>
                              <div className="bg-muted rounded-card-sm p-2">
                                <p className="text-muted-foreground mb-0.5 text-xs font-medium">
                                  {t('ipConfig.netmask')}
                                </p>
                                <p className="text-foreground break-all font-mono text-xs">
                                  {networkInfo.netmask}
                                </p>
                              </div>
                              <div className="bg-muted rounded-card-sm p-2">
                                <p className="text-muted-foreground mb-0.5 text-xs font-medium">
                                  {t('ipConfig.broadcast')}
                                </p>
                                <p className="text-foreground break-all font-mono text-xs">
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
});

InterfaceIPConfig.displayName = 'InterfaceIPConfig';
