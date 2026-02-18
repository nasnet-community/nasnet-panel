/**
 * Traffic Overview Card Component
 * Dashboard Pro style - Dark theme with traffic visualization
 */

import { useMemo } from 'react';

import { Activity, ArrowDown, ArrowUp } from 'lucide-react';

import { type NetworkInterface } from '@nasnet/core/types';

interface TrafficOverviewCardProps {
  interfaces: NetworkInterface[];
  isLoading?: boolean;
}

export function TrafficOverviewCard({ interfaces, isLoading }: TrafficOverviewCardProps) {
  const stats = useMemo(() => {
    const active = interfaces.filter((i) => i.status === 'running' && i.linkStatus === 'up');
    return { activeCount: active.length };
  }, [interfaces]);

  if (isLoading) {
    return (
      <div className="bg-slate-900 rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-slate-700 rounded" />
          <div className="h-4 bg-slate-700 rounded w-24" />
        </div>
        <div className="h-20 bg-slate-800 rounded-lg mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 bg-slate-800 rounded-lg" />
          <div className="h-12 bg-slate-800 rounded-lg" />
        </div>
      </div>
    );
  }

  // Sample traffic data for visualization
  const trafficBars = [40, 60, 45, 80, 55, 70, 90, 65, 75, 50, 85, 60];

  return (
    <div className="bg-slate-900 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-400" />
          <span className="text-slate-400 text-xs uppercase tracking-wide">Traffic (last hour)</span>
        </div>
        <span className="text-xs text-slate-500">Live</span>
      </div>

      {/* Traffic Graph */}
      <div className="h-20 flex items-end gap-1 mb-4">
        {trafficBars.map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-gradient-to-t from-cyan-500/40 to-cyan-500/10 rounded-t transition-all duration-300 hover:from-cyan-500/60 hover:to-cyan-500/20"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mb-4 text-xs text-slate-600">
        <span>-1h</span>
        <span>now</span>
      </div>

      {/* Download/Upload Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 text-xs">Download</span>
          </div>
          <p className="text-white font-mono font-semibold">--</p>
          <p className="text-slate-500 text-xs mt-0.5">{stats.activeCount} active interfaces</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUp className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400 text-xs">Upload</span>
          </div>
          <p className="text-white font-mono font-semibold">--</p>
          <p className="text-slate-500 text-xs mt-0.5">Real-time unavailable</p>
        </div>
      </div>
    </div>
  );
}
