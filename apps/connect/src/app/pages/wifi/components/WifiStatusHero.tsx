/**
 * WiFi Status Hero Component
 * Dashboard Pro style stats grid showing WiFi overview metrics
 */

import { useMemo } from 'react';
import type { WirelessInterface, WirelessClient } from '@nasnet/core/types';
import { Wifi, Users, Signal, Radio } from 'lucide-react';

interface WifiStatusHeroProps {
  interfaces: WirelessInterface[];
  clients: WirelessClient[];
  isLoading?: boolean;
}

function getSignalQuality(signalDbm: number): { label: string; color: string; bgColor: string } {
  if (signalDbm >= -50) {
    return { label: 'Excellent', color: 'text-emerald-500', bgColor: 'bg-emerald-500' };
  }
  if (signalDbm >= -60) {
    return { label: 'Good', color: 'text-green-500', bgColor: 'bg-green-500' };
  }
  if (signalDbm >= -70) {
    return { label: 'Fair', color: 'text-amber-500', bgColor: 'bg-amber-500' };
  }
  return { label: 'Weak', color: 'text-red-500', bgColor: 'bg-red-500' };
}

function signalToPercent(signalDbm: number): number {
  const minDbm = -100;
  const maxDbm = -30;
  const clamped = Math.max(minDbm, Math.min(maxDbm, signalDbm));
  return Math.round(((clamped - minDbm) / (maxDbm - minDbm)) * 100);
}

export function WifiStatusHero({ interfaces, clients, isLoading }: WifiStatusHeroProps) {
  const totalClients = clients.length;

  const activeInterfaces = useMemo(() => {
    return interfaces.filter((i) => !i.disabled && i.running);
  }, [interfaces]);

  const activePercent = interfaces.length > 0
    ? Math.round((activeInterfaces.length / interfaces.length) * 100)
    : 0;

  const avgSignal = useMemo(() => {
    if (clients.length === 0) return -100;
    const sum = clients.reduce((acc, c) => acc + c.signalStrength, 0);
    return Math.round(sum / clients.length);
  }, [clients]);

  const signalQuality = getSignalQuality(avgSignal);
  const signalPercent = signalToPercent(avgSignal);

  const bandCounts = useMemo(() => {
    return interfaces.reduce(
      (acc, iface) => {
        if (iface.band === '2.4GHz') acc['2.4GHz']++;
        else if (iface.band === '5GHz') acc['5GHz']++;
        else if (iface.band === '6GHz') acc['6GHz']++;
        return acc;
      },
      { '2.4GHz': 0, '5GHz': 0, '6GHz': 0 }
    );
  }, [interfaces]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-100 dark:bg-slate-900 rounded-xl p-3 md:p-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12 mb-2" />
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-8 mb-1" />
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
      {/* Connected Clients */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 mb-1">
          <Users className="w-3.5 h-3.5 text-cyan-500" />
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Clients</p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{totalClients}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Connected devices</p>
      </div>

      {/* Active Interfaces */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 mb-1">
          <Wifi className="w-3.5 h-3.5 text-emerald-500" />
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Active</p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
          {activeInterfaces.length}
          <span className="text-slate-400 dark:text-slate-500 text-sm font-normal ml-1">/{interfaces.length}</span>
        </p>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${activePercent}%` }}
          />
        </div>
      </div>

      {/* Signal Quality */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 mb-1">
          <Signal className="w-3.5 h-3.5 text-purple-500" />
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Signal</p>
        </div>
        <p className={`text-xl md:text-2xl font-bold ${signalQuality.color}`}>
          {clients.length > 0 ? `${avgSignal} dBm` : '—'}
        </p>
        {clients.length > 0 ? (
          <>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
              <div
                className={`${signalQuality.bgColor} h-1.5 rounded-full transition-all duration-300`}
                style={{ width: `${signalPercent}%` }}
              />
            </div>
            <p className={`text-xs mt-1 ${signalQuality.color}`}>{signalQuality.label}</p>
          </>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No clients</p>
        )}
      </div>

      {/* Frequency Bands */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 mb-1">
          <Radio className="w-3.5 h-3.5 text-blue-500" />
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Bands</p>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {bandCounts['2.4GHz'] > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">2.4G</span>
          )}
          {bandCounts['5GHz'] > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">5G</span>
          )}
          {bandCounts['6GHz'] > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">6G</span>
          )}
          {interfaces.length === 0 && <span className="text-xs text-slate-400 dark:text-slate-500">No interfaces</span>}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {interfaces.length} interface{interfaces.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

























