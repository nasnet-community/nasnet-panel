/**
 * Connected Clients Table Component
 * Displays WiFi clients connected to wireless interfaces
 */

import { useMemo } from 'react';
import type { WirelessClient } from '@nasnet/core/types';
import { formatBytes } from '@nasnet/core/utils';
import { SectionHeader } from '../../network/components/SectionHeader';
import { Signal, Clock, ArrowDown, ArrowUp } from 'lucide-react';

interface ConnectedClientsTableProps {
  clients: WirelessClient[];
  isLoading?: boolean;
}

function getSignalIcon(signalDbm: number) {
  if (signalDbm >= -50) return { color: 'text-emerald-500', bars: 4 };
  if (signalDbm >= -60) return { color: 'text-green-500', bars: 3 };
  if (signalDbm >= -70) return { color: 'text-amber-500', bars: 2 };
  return { color: 'text-red-500', bars: 1 };
}

function SignalBars({ signal }: { signal: number }) {
  const { color, bars } = getSignalIcon(signal);
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={`w-1 rounded-sm ${bar <= bars ? color : 'bg-slate-200 dark:bg-slate-700'}`}
          style={{ height: `${bar * 25}%` }}
        />
      ))}
    </div>
  );
}

export function ConnectedClientsTable({ clients, isLoading }: ConnectedClientsTableProps) {
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => b.signalStrength - a.signalStrength);
  }, [clients]);

  if (isLoading) {
    return (
      <section>
        <SectionHeader title="Connected Clients" />
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (clients.length === 0) {
    return (
      <section>
        <SectionHeader title="Connected Clients" />
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <Signal className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">No clients connected</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader title="Connected Clients" count={clients.length} />
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide px-4 py-3">MAC Address</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide px-4 py-3">Interface</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide px-4 py-3">Signal</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide px-4 py-3">Rate</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide px-4 py-3">Traffic</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide px-4 py-3">Uptime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-slate-900 dark:text-white">{client.macAddress}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{client.interface}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <SignalBars signal={client.signalStrength} />
                      <span className="text-sm text-slate-600 dark:text-slate-300">{client.signalStrength} dBm</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="text-emerald-500">↓</span> {client.rxRate} Mbps
                      <span className="text-purple-500 ml-2">↑</span> {client.txRate} Mbps
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-mono text-slate-600 dark:text-slate-300">
                      <span className="text-emerald-500">↓</span> {formatBytes(client.rxBytes)}
                      <span className="text-purple-500 ml-2">↑</span> {formatBytes(client.txBytes)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
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
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {sortedClients.map((client) => (
            <div key={client.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-slate-900 dark:text-white">{client.macAddress}</span>
                <SignalBars signal={client.signalStrength} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{client.interface}</span>
                <span className="text-slate-600 dark:text-slate-300">{client.signalStrength} dBm</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-3 h-3 text-emerald-500" />
                  {formatBytes(client.rxBytes)}
                  <ArrowUp className="w-3 h-3 text-purple-500" />
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
}




