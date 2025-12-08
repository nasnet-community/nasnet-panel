/**
 * WiFi Security Summary Component
 * Shows security profile status per interface
 */

import type { WirelessInterface } from '@nasnet/core/types';
import { SectionHeader } from '../../network/components/SectionHeader';
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';

interface WifiSecuritySummaryProps {
  interfaces: WirelessInterface[];
  isLoading?: boolean;
}

function getSecurityInfo(securityProfile: string) {
  const profile = securityProfile.toLowerCase();
  
  if (profile.includes('wpa3')) {
    return { level: 'strong', label: 'WPA3', icon: ShieldCheck, color: 'text-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', borderColor: 'border-emerald-200 dark:border-emerald-800' };
  }
  if (profile.includes('wpa2')) {
    return { level: 'good', label: 'WPA2', icon: Shield, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30', borderColor: 'border-green-200 dark:border-green-800' };
  }
  if (profile.includes('wpa') || profile.includes('wep')) {
    return { level: 'weak', label: profile.includes('wep') ? 'WEP' : 'WPA', icon: ShieldAlert, color: 'text-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/30', borderColor: 'border-amber-200 dark:border-amber-800' };
  }
  if (profile === 'default' || profile === 'none' || profile === '') {
    return { level: 'none', label: 'Open', icon: ShieldX, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30', borderColor: 'border-red-200 dark:border-red-800' };
  }
  return { level: 'unknown', label: securityProfile || 'Unknown', icon: Shield, color: 'text-slate-500', bgColor: 'bg-slate-100 dark:bg-slate-800', borderColor: 'border-slate-200 dark:border-slate-700' };
}

export function WifiSecuritySummary({ interfaces, isLoading }: WifiSecuritySummaryProps) {
  if (isLoading) {
    return (
      <section>
        <SectionHeader title="Security Status" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 h-24" />
          ))}
        </div>
      </section>
    );
  }

  if (interfaces.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Security Status" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {interfaces.map((iface) => {
          const security = getSecurityInfo(iface.securityProfile);
          const Icon = security.icon;
          return (
            <div key={iface.id} className={`rounded-xl p-4 border ${security.bgColor} ${security.borderColor}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{iface.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{iface.ssid || 'Not configured'}</p>
                </div>
                <Icon className={`w-5 h-5 ${security.color}`} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${security.color} ${security.bgColor}`}>{security.label}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{iface.securityProfile || 'No profile'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}




