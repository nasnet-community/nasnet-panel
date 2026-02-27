/**
 * WiFi Status Hero Component
 * Dashboard Pro style stats grid showing WiFi overview metrics
 */

import React, { useMemo } from 'react';

import { Wifi, Users, Signal, Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { WirelessInterface, WirelessClient } from '@nasnet/core/types';

interface WifiStatusHeroProps {
  interfaces: WirelessInterface[];
  clients: WirelessClient[];
  isLoading?: boolean;
}

function getSignalQuality(signalDbm: number): { label: string; color: string; bgColor: string } {
  if (signalDbm >= -50) {
    return { label: 'Excellent', color: 'text-success', bgColor: 'bg-success' };
  }
  if (signalDbm >= -60) {
    return { label: 'Good', color: 'text-success', bgColor: 'bg-success' };
  }
  if (signalDbm >= -70) {
    return { label: 'Fair', color: 'text-warning', bgColor: 'bg-warning' };
  }
  return { label: 'Weak', color: 'text-error', bgColor: 'bg-error' };
}

function signalToPercent(signalDbm: number): number {
  const minDbm = -100;
  const maxDbm = -30;
  const clamped = Math.max(minDbm, Math.min(maxDbm, signalDbm));
  return Math.round(((clamped - minDbm) / (maxDbm - minDbm)) * 100);
}

export const WifiStatusHero = React.memo(function WifiStatusHero({ interfaces, clients, isLoading }: WifiStatusHeroProps) {
  const { t } = useTranslation('wifi');
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-component-sm md:gap-component-md animate-pulse" role="status" aria-label="Loading WiFi status">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted rounded-card-sm p-component-sm md:p-component-md">
            <div className="h-4 bg-muted-foreground/20 rounded w-12 mb-component-sm" />
            <div className="h-6 bg-muted-foreground/20 rounded w-8 mb-component-xs" />
            <div className="h-1.5 bg-muted-foreground/20 rounded-full mt-component-sm" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-component-sm md:gap-component-md category-hero-wifi rounded-card-lg shadow-md p-component-md md:p-component-lg">
      {/* Connected Clients */}
      <div className="bg-card rounded-card-sm p-component-sm md:p-component-md border border-border shadow-sm">
        <div className="flex items-center gap-component-xs mb-component-xs">
          <Users className="w-3.5 h-3.5 text-info" aria-hidden="true" />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('status.clients')}</p>
        </div>
        <p className="text-xl md:text-2xl font-bold font-display text-foreground font-mono">{totalClients}</p>
        <p className="text-xs text-muted-foreground mt-component-xs">{t('status.connectedDevices')}</p>
      </div>

      {/* Active Interfaces */}
      <div className="bg-card rounded-card-sm p-component-sm md:p-component-md border border-border shadow-sm">
        <div className="flex items-center gap-component-xs mb-component-xs">
          <Wifi className="w-3.5 h-3.5 text-success" aria-hidden="true" />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('status.active')}</p>
        </div>
        <p className="text-xl md:text-2xl font-bold font-display text-foreground">
          {activeInterfaces.length}
          <span className="text-muted-foreground text-sm font-normal ml-component-sm font-mono">/{interfaces.length}</span>
        </p>
        <div className="w-full bg-muted rounded-full h-1.5 mt-component-sm" role="progressbar" aria-valuenow={activePercent} aria-valuemin={0} aria-valuemax={100} aria-label="Active interfaces">
          <div
            className="bg-success h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${activePercent}%` }}
          />
        </div>
      </div>

      {/* Signal Quality */}
      <div className="bg-card rounded-card-sm p-component-sm md:p-component-md border border-border shadow-sm">
        <div className="flex items-center gap-component-xs mb-component-xs">
          <Signal className="w-3.5 h-3.5 text-warning" aria-hidden="true" />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('status.signal')}</p>
        </div>
        <p className={`text-xl md:text-2xl font-bold font-mono ${signalQuality.color}`}>
          {clients.length > 0 ? `${avgSignal} dBm` : '—'}
        </p>
        {clients.length > 0 ? (
          <>
            <div className="w-full bg-muted rounded-full h-1.5 mt-component-sm" role="progressbar" aria-valuenow={signalPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Signal strength">
              <div
                className={`${signalQuality.bgColor} h-1.5 rounded-full transition-all duration-300`}
                style={{ width: `${signalPercent}%` }}
              />
            </div>
            <p className={`text-xs mt-component-xs ${signalQuality.color}`}>{signalQuality.label}</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground mt-component-xs">{t('status.noClients')}</p>
        )}
      </div>

      {/* Frequency Bands */}
      <div className="bg-card rounded-card-sm p-component-sm md:p-component-md border border-border shadow-sm">
        <div className="flex items-center gap-component-xs mb-component-xs">
          <Radio className="w-3.5 h-3.5 text-info" aria-hidden="true" />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('status.bands')}</p>
        </div>
        <div className="flex flex-wrap gap-component-xs mt-component-xs">
          {bandCounts['2.4GHz'] > 0 && (
            <span className="px-component-xs py-component-xs text-xs font-medium rounded-md bg-info/10 text-info font-mono">2.4G</span>
          )}
          {bandCounts['5GHz'] > 0 && (
            <span className="px-component-xs py-component-xs text-xs font-medium rounded-md bg-warning/10 text-warning font-mono">5G</span>
          )}
          {bandCounts['6GHz'] > 0 && (
            <span className="px-component-xs py-component-xs text-xs font-medium rounded-md bg-error/10 text-error font-mono">6G</span>
          )}
          {interfaces.length === 0 && <span className="text-xs text-muted-foreground">{t('status.noInterfaces')}</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-component-xs">
          {t('status.interfaceCount', { count: interfaces.length, defaultValue: `${interfaces.length} interface${interfaces.length !== 1 ? 's' : ''}` })}
        </p>
      </div>
    </div>
  );
});

WifiStatusHero.displayName = 'WifiStatusHero';





















