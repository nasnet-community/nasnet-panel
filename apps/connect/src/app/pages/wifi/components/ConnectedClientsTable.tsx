/**
 * Connected Clients Table Component
 * Displays WiFi clients connected to wireless interfaces
 */

import React, { useMemo } from 'react';

import { Signal, Clock, ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { WirelessClient } from '@nasnet/core/types';
import { formatBytes } from '@nasnet/core/utils';

import { SectionHeader } from '../../network/components/SectionHeader';

interface ConnectedClientsTableProps {
  clients: WirelessClient[];
  isLoading?: boolean;
}

function getSignalIcon(signalDbm: number) {
  if (signalDbm >= -50) return { color: 'text-success', bars: 4 };
  if (signalDbm >= -60) return { color: 'text-success', bars: 3 };
  if (signalDbm >= -70) return { color: 'text-warning', bars: 2 };
  return { color: 'text-error', bars: 1 };
}

function SignalBars({ signal }: { signal: number }) {
  const { color, bars } = getSignalIcon(signal);
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={`w-1 rounded-sm ${bar <= bars ? color : 'bg-muted'}`}
          style={{ height: `${bar * 25}%` }}
        />
      ))}
    </div>
  );
}

export const ConnectedClientsTable = React.memo(function ConnectedClientsTable({ clients, isLoading }: ConnectedClientsTableProps) {
  const { t } = useTranslation('wifi');
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => b.signalStrength - a.signalStrength);
  }, [clients]);

  if (isLoading) {
    return (
      <section>
        <SectionHeader title={t('clients.title')} />
        <div className="bg-card rounded-card-sm border border-border p-component-md animate-pulse">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (clients.length === 0) {
    return (
      <section>
        <SectionHeader title={t('clients.title')} />
        <div className="bg-card rounded-card-sm border border-border p-component-lg text-center">
          <Signal className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{t('status.noClientsConnected')}</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader title={t('clients.title')} count={clients.length} />
      <div className="bg-card rounded-card-sm border border-border overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide p-component-md">{t('clients.macAddress')}</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide p-component-md">{t('clients.interface')}</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide p-component-md">{t('clients.signal')}</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide p-component-md">{t('clients.rate')}</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide p-component-md">{t('clients.traffic')}</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide p-component-md">{t('clients.uptime')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedClients.map((client) => (
                <tr key={client.id} className="hover:bg-muted transition-colors">
                  <td className="p-component-md">
                    <span className="font-mono text-sm text-foreground">{client.macAddress}</span>
                  </td>
                  <td className="p-component-md">
                    <span className="text-sm text-muted-foreground">{client.interface}</span>
                  </td>
                  <td className="p-component-md">
                    <div className="flex items-center gap-2">
                      <SignalBars signal={client.signalStrength} />
                      <span className="text-sm text-muted-foreground">{client.signalStrength} dBm</span>
                    </div>
                  </td>
                  <td className="p-component-md">
                    <div className="text-sm text-muted-foreground">
                      <span className="text-success">↓</span> {client.rxRate} Mbps
                      <span className="text-warning ml-2">↑</span> {client.txRate} Mbps
                    </div>
                  </td>
                  <td className="p-component-md">
                    <div className="text-sm font-mono text-muted-foreground">
                      <span className="text-success">↓</span> {formatBytes(client.rxBytes)}
                      <span className="text-warning ml-2">↑</span> {formatBytes(client.txBytes)}
                    </div>
                  </td>
                  <td className="p-component-md">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {client.uptime}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-border">
          {sortedClients.map((client) => (
            <div key={client.id} className="p-component-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-foreground">{client.macAddress}</span>
                <SignalBars signal={client.signalStrength} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{client.interface}</span>
                <span className="text-muted-foreground">{client.signalStrength} dBm</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-3 h-3 text-success" />
                  {formatBytes(client.rxBytes)}
                  <ArrowUp className="w-3 h-3 text-warning" />
                  {formatBytes(client.txBytes)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {client.uptime}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

ConnectedClientsTable.displayName = 'ConnectedClientsTable';

























