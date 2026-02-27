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

export const WifiStatusHero = React.memo(function WifiStatusHero({
  interfaces,
  clients,
  isLoading,
}: WifiStatusHeroProps) {
  const { t } = useTranslation('wifi');
  const totalClients = clients.length;

  const activeInterfaces = useMemo(() => {
    return interfaces.filter((i) => !i.disabled && i.running);
  }, [interfaces]);

  const activePercent =
    interfaces.length > 0 ? Math.round((activeInterfaces.length / interfaces.length) * 100) : 0;

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
      <div
        className="gap-component-sm md:gap-component-md grid animate-pulse grid-cols-2 md:grid-cols-4"
        role="status"
        aria-label="Loading WiFi status"
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-muted rounded-card-sm p-component-sm md:p-component-md"
          >
            <div className="bg-muted-foreground/20 mb-component-sm h-4 w-12 rounded" />
            <div className="bg-muted-foreground/20 mb-component-xs h-6 w-8 rounded" />
            <div className="bg-muted-foreground/20 mt-component-sm h-1.5 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="gap-component-sm md:gap-component-md category-hero-wifi rounded-card-lg p-component-md md:p-component-lg grid grid-cols-2 shadow-md md:grid-cols-4">
      {/* Connected Clients */}
      <div className="bg-card rounded-card-sm p-component-sm md:p-component-md border-border border shadow-sm">
        <div className="gap-component-xs mb-component-xs flex items-center">
          <Users
            className="text-info h-3.5 w-3.5"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('status.clients')}
          </p>
        </div>
        <p className="font-display text-foreground font-mono text-xl font-bold md:text-2xl">
          {totalClients}
        </p>
        <p className="text-muted-foreground mt-component-xs text-xs">
          {t('status.connectedDevices')}
        </p>
      </div>

      {/* Active Interfaces */}
      <div className="bg-card rounded-card-sm p-component-sm md:p-component-md border-border border shadow-sm">
        <div className="gap-component-xs mb-component-xs flex items-center">
          <Wifi
            className="text-success h-3.5 w-3.5"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('status.active')}
          </p>
        </div>
        <p className="font-display text-foreground text-xl font-bold md:text-2xl">
          {activeInterfaces.length}
          <span className="text-muted-foreground ml-component-sm font-mono text-sm font-normal">
            /{interfaces.length}
          </span>
        </p>
        <div
          className="bg-muted mt-component-sm h-1.5 w-full rounded-full"
          role="progressbar"
          aria-valuenow={activePercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Active interfaces"
        >
          <div
            className="bg-success h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${activePercent}%` }}
          />
        </div>
      </div>

      {/* Signal Quality */}
      <div className="bg-card rounded-card-sm p-component-sm md:p-component-md border-border border shadow-sm">
        <div className="gap-component-xs mb-component-xs flex items-center">
          <Signal
            className="text-warning h-3.5 w-3.5"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('status.signal')}
          </p>
        </div>
        <p className={`font-mono text-xl font-bold md:text-2xl ${signalQuality.color}`}>
          {clients.length > 0 ? `${avgSignal} dBm` : '—'}
        </p>
        {clients.length > 0 ?
          <>
            <div
              className="bg-muted mt-component-sm h-1.5 w-full rounded-full"
              role="progressbar"
              aria-valuenow={signalPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Signal strength"
            >
              <div
                className={`${signalQuality.bgColor} h-1.5 rounded-full transition-all duration-300`}
                style={{ width: `${signalPercent}%` }}
              />
            </div>
            <p className={`mt-component-xs text-xs ${signalQuality.color}`}>
              {signalQuality.label}
            </p>
          </>
        : <p className="text-muted-foreground mt-component-xs text-xs">{t('status.noClients')}</p>}
      </div>

      {/* Frequency Bands */}
      <div className="bg-card rounded-card-sm p-component-sm md:p-component-md border-border border shadow-sm">
        <div className="gap-component-xs mb-component-xs flex items-center">
          <Radio
            className="text-info h-3.5 w-3.5"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('status.bands')}
          </p>
        </div>
        <div className="gap-component-xs mt-component-xs flex flex-wrap">
          {bandCounts['2.4GHz'] > 0 && (
            <span className="px-component-xs py-component-xs bg-info/10 text-info rounded-md font-mono text-xs font-medium">
              2.4G
            </span>
          )}
          {bandCounts['5GHz'] > 0 && (
            <span className="px-component-xs py-component-xs bg-warning/10 text-warning rounded-md font-mono text-xs font-medium">
              5G
            </span>
          )}
          {bandCounts['6GHz'] > 0 && (
            <span className="px-component-xs py-component-xs bg-error/10 text-error rounded-md font-mono text-xs font-medium">
              6G
            </span>
          )}
          {interfaces.length === 0 && (
            <span className="text-muted-foreground text-xs">{t('status.noInterfaces')}</span>
          )}
        </div>
        <p className="text-muted-foreground mt-component-xs text-xs">
          {t('status.interfaceCount', {
            count: interfaces.length,
            defaultValue: `${interfaces.length} interface${interfaces.length !== 1 ? 's' : ''}`,
          })}
        </p>
      </div>
    </div>
  );
});

WifiStatusHero.displayName = 'WifiStatusHero';
