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
    return { level: 'strong', label: 'WPA3', icon: ShieldCheck, color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/30' };
  }
  if (profile.includes('wpa2')) {
    return { level: 'good', label: 'WPA2', icon: Shield, color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/30' };
  }
  if (profile.includes('wpa') || profile.includes('wep')) {
    return { level: 'weak', label: profile.includes('wep') ? 'WEP' : 'WPA', icon: ShieldAlert, color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/30' };
  }
  if (profile === 'default' || profile === 'none' || profile === '') {
    return { level: 'none', label: 'Open', icon: ShieldX, color: 'text-error', bgColor: 'bg-error/10', borderColor: 'border-error/30' };
  }
  return { level: 'unknown', label: securityProfile || 'Unknown', icon: Shield, color: 'text-muted-foreground', bgColor: 'bg-muted', borderColor: 'border-border' };
}

export const WifiSecuritySummary = React.memo(function WifiSecuritySummary({ interfaces, isLoading }: WifiSecuritySummaryProps) {
  const { t } = useTranslation('wifi');
  if (isLoading) {
    return (
      <section>
        <SectionHeader title={t('security.title')} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted rounded-xl p-4 h-24" />
          ))}
        </div>
      </section>
    );
  }

  if (interfaces.length === 0) return null;

  return (
    <section>
      <SectionHeader title={t('security.title')} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {interfaces.map((iface) => {
          const security = getSecurityInfo(iface.securityProfile);
          const Icon = security.icon;
          return (
            <div key={iface.id} className={`rounded-xl p-4 border ${security.bgColor} ${security.borderColor}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{iface.name}</p>
                  <p className="text-sm text-muted-foreground">{iface.ssid || t('status.notConfigured')}</p>
                </div>
                <Icon className={`w-5 h-5 ${security.color}`} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${security.color} ${security.bgColor}`}>{security.label}</span>
                <span className="text-xs text-muted-foreground">{iface.securityProfile || t('status.noProfile')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});

WifiSecuritySummary.displayName = 'WifiSecuritySummary';

























