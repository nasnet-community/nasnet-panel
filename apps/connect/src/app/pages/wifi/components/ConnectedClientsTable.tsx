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
    <div className="flex h-4 items-end gap-0.5">
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

export const ConnectedClientsTable = React.memo(function ConnectedClientsTable({
  clients,
  isLoading,
}: ConnectedClientsTableProps) {
  const { t } = useTranslation('wifi');
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => b.signalStrength - a.signalStrength);
  }, [clients]);

  if (isLoading) {
    return (
      <section>
        <SectionHeader title={t('clients.title')} />
        <div className="bg-card rounded-card-sm border-border p-component-md animate-pulse border">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-muted h-12 rounded"
              />
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
        <div className="bg-card rounded-card-sm border-border p-component-lg border text-center">
          <Signal className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
          <p className="text-muted-foreground text-sm">{t('status.noClientsConnected')}</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader
        title={t('clients.title')}
        count={clients.length}
      />
      <div className="bg-card rounded-card-sm border-border overflow-hidden border shadow-sm">
        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead>
              <tr className="border-border border-b">
                <th className="font-display text-muted-foreground p-component-md text-left text-xs font-medium uppercase tracking-wide">
                  {t('clients.macAddress')}
                </th>
                <th className="font-display text-muted-foreground p-component-md text-left text-xs font-medium uppercase tracking-wide">
                  {t('clients.interface')}
                </th>
                <th className="font-display text-muted-foreground p-component-md text-left text-xs font-medium uppercase tracking-wide">
                  {t('clients.signal')}
                </th>
                <th className="font-display text-muted-foreground p-component-md text-left text-xs font-medium uppercase tracking-wide">
                  {t('clients.rate')}
                </th>
                <th className="font-display text-muted-foreground p-component-md text-left text-xs font-medium uppercase tracking-wide">
                  {t('clients.traffic')}
                </th>
                <th className="font-display text-muted-foreground p-component-md text-left text-xs font-medium uppercase tracking-wide">
                  {t('clients.uptime')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {sortedClients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-muted transition-colors"
                >
                  <td className="p-component-md">
                    <span className="text-foreground font-mono text-sm">{client.macAddress}</span>
                  </td>
                  <td className="p-component-md">
                    <span className="text-muted-foreground font-display text-sm">
                      {client.interface}
                    </span>
                  </td>
                  <td className="p-component-md">
                    <div className="flex items-center gap-2">
                      <SignalBars signal={client.signalStrength} />
                      <span className="text-muted-foreground font-mono text-sm">
                        {client.signalStrength} dBm
                      </span>
                    </div>
                  </td>
                  <td className="p-component-md">
                    <div className="text-muted-foreground font-mono text-sm">
                      <span className="text-success">↓</span> {client.rxRate} Mbps
                      <span className="text-warning ml-2">↑</span> {client.txRate} Mbps
                    </div>
                  </td>
                  <td className="p-component-md">
                    <div className="text-muted-foreground font-mono text-sm">
                      <span className="text-success">↓</span> {formatBytes(client.rxBytes)}
                      <span className="text-warning ml-2">↑</span> {formatBytes(client.txBytes)}
                    </div>
                  </td>
                  <td className="p-component-md">
                    <div className="text-muted-foreground flex items-center gap-1 font-mono text-sm">
                      <Clock className="h-3.5 w-3.5" />
                      {client.uptime}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-border divide-y md:hidden">
          {sortedClients.map((client) => (
            <div
              key={client.id}
              className="p-component-md space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-foreground font-display font-mono text-sm">
                  {client.macAddress}
                </span>
                <SignalBars signal={client.signalStrength} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-display">{client.interface}</span>
                <span className="text-muted-foreground font-mono">{client.signalStrength} dBm</span>
              </div>
              <div className="text-muted-foreground flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2">
                  <ArrowDown className="text-success h-3 w-3" />
                  {formatBytes(client.rxBytes)}
                  <ArrowUp className="text-warning h-3 w-3" />
                  {formatBytes(client.txBytes)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
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
