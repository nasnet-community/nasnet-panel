/**
 * WiFi Security Summary Component
 * Shows security profile status per interface
 */

import React from 'react';

import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { WirelessInterface } from '@nasnet/core/types';

import { SectionHeader } from '../../network/components/SectionHeader';

interface WifiSecuritySummaryProps {
  interfaces: WirelessInterface[];
  isLoading?: boolean;
}

function getSecurityInfo(securityProfile: string) {
  const profile = securityProfile.toLowerCase();

  if (profile.includes('wpa3')) {
    return {
      level: 'strong',
      label: 'WPA3',
      icon: ShieldCheck,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
    };
  }
  if (profile.includes('wpa2')) {
    return {
      level: 'good',
      label: 'WPA2',
      icon: Shield,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
    };
  }
  if (profile.includes('wpa') || profile.includes('wep')) {
    return {
      level: 'weak',
      label: profile.includes('wep') ? 'WEP' : 'WPA',
      icon: ShieldAlert,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
    };
  }
  if (profile === 'default' || profile === 'none' || profile === '') {
    return {
      level: 'none',
      label: 'Open',
      icon: ShieldX,
      color: 'text-error',
      bgColor: 'bg-error/10',
      borderColor: 'border-error/30',
    };
  }
  return {
    level: 'unknown',
    label: securityProfile || 'Unknown',
    icon: Shield,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    borderColor: 'border-border',
  };
}

export const WifiSecuritySummary = React.memo(function WifiSecuritySummary({
  interfaces,
  isLoading,
}: WifiSecuritySummaryProps) {
  const { t } = useTranslation('wifi');
  if (isLoading) {
    return (
      <section>
        <SectionHeader title={t('security.title')} />
        <div className="gap-component-md grid animate-pulse grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-muted rounded-card-sm p-component-md h-24"
            />
          ))}
        </div>
      </section>
    );
  }

  if (interfaces.length === 0) return null;

  return (
    <section>
      <SectionHeader title={t('security.title')} />
      <div className="gap-component-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {interfaces.map((iface) => {
          const security = getSecurityInfo(iface.securityProfile);
          const Icon = security.icon;
          return (
            <div
              key={iface.id}
              className={`rounded-card-sm p-component-md border shadow-sm ${security.bgColor} ${security.borderColor}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-foreground font-medium">{iface.name}</p>
                  <p className="text-muted-foreground font-mono text-sm">
                    {iface.ssid || t('status.notConfigured')}
                  </p>
                </div>
                <Icon className={`h-5 w-5 ${security.color}`} />
              </div>
              <div className="mt-component-md gap-component-sm flex items-center">
                <span
                  className={`px-component-sm py-component-sm font-display rounded-md text-xs font-medium ${security.color} ${security.bgColor}`}
                >
                  {security.label}
                </span>
                <span className="text-muted-foreground font-mono text-xs">
                  {iface.securityProfile || t('status.noProfile')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});

WifiSecuritySummary.displayName = 'WifiSecuritySummary';
