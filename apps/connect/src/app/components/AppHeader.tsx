import { ThemeToggle } from '@nasnet/ui/patterns';
import { MoreVertical } from 'lucide-react';
import { Button } from '@nasnet/ui/primitives';
import { useConnectionStore } from '@nasnet/state/stores';

/**
 * AppHeader Component
 *
 * Dashboard Pro design header with brand identity and connection status.
 * Matches Design Direction 3 from ux-design-directions.html
 *
 * Features:
 * - Professional monitoring aesthetic
 * - Brand logo with app identity
 * - Real-time connection status display
 * - Theme toggle and settings access
 */
export function AppHeader() {
  const { state, currentRouterIp } = useConnectionStore();

  // Determine status display based on connection state
  const getStatusConfig = () => {
    switch (state) {
      case 'connected':
        return {
          text: 'Online',
          dotClass: 'bg-green-500',
          textClass: 'text-green-500 dark:text-green-400',
        };
      case 'reconnecting':
        return {
          text: 'Reconnecting',
          dotClass: 'bg-amber-500 animate-pulse',
          textClass: 'text-amber-500 dark:text-amber-400',
        };
      case 'disconnected':
      default:
        return {
          text: 'Offline',
          dotClass: 'bg-red-500',
          textClass: 'text-red-500 dark:text-red-400',
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Display router IP when connected, otherwise show app name
  const displayName = currentRouterIp && state === 'connected' 
    ? currentRouterIp 
    : 'NasNetConnect';

  return (
    <div className="flex h-full items-center justify-between px-4 py-3">
      {/* Left: Brand + Status */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <img 
          src="/favicon.png" 
          alt="NasNet" 
          className="w-8 h-8 rounded-lg shadow-sm"
        />

        {/* App/Router Info */}
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {displayName}
          </p>
          <p className={`text-xs flex items-center gap-1.5 ${statusConfig.textClass}`}>
            <span 
              className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} 
              aria-hidden="true"
            />
            {statusConfig.text}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="More options"
        >
          <MoreVertical className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </Button>
      </div>
    </div>
  );
}
