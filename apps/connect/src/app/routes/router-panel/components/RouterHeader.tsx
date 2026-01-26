import { BackButton } from '@nasnet/ui/patterns';
import { StatusIndicator } from '@nasnet/ui/patterns';
import { ROUTES } from '@nasnet/core/constants';
import { useRouterStore, useConnectionStore } from '@nasnet/state/stores';

export interface RouterHeaderProps {
  /**
   * Router ID from URL params
   */
  routerId: string;
}

/**
 * RouterHeader Component
 *
 * Enhanced header for the router panel displaying:
 * - Back button to router list
 * - Router name/ID
 * - Connection status indicator
 * - IP address
 * - Optional router model/info
 *
 * Features:
 * - Responsive design (compact on mobile, expanded on desktop)
 * - Card-based styling with elevation
 * - Status indicator with color-coded visual feedback
 * - Accessible with proper ARIA labels and heading hierarchy
 *
 * Usage:
 * ```tsx
 * <RouterHeader routerId={id} />
 * ```
 */
export function RouterHeader({ routerId }: RouterHeaderProps) {
  const getRouter = useRouterStore((state) => state.getRouter);
  const currentRouterIp = useConnectionStore((state) => state.currentRouterIp);
  
  const router = getRouter(routerId);
  
  // Determine connection status
  const isConnected = !!currentRouterIp;
  const status = isConnected ? 'online' : 'offline';
  const statusLabel = isConnected ? 'Connected' : 'Disconnected';

  return (
    <div className="surface card-elevated p-4 md:p-6 mb-4 md:mb-6">
      <div className="flex items-start gap-3 md:gap-4">
        {/* Back Button */}
        <BackButton to={ROUTES.ROUTER_LIST} ariaLabel="Back to router list" />
        
        {/* Router Information */}
        <div className="flex-1 min-w-0">
          {/* Title and Status Row */}
          <div className="flex flex-col md:flex-row md:items-center md:gap-3 mb-1">
            <h1 className="text-xl md:text-2xl font-display font-bold text-foreground truncate">
              {router?.name || `Router ${routerId}`}
            </h1>
            <StatusIndicator 
              status={status} 
              label={statusLabel}
              size="sm"
              pulse={isConnected}
              className="mt-1 md:mt-0"
            />
          </div>
          
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-sm text-muted">
            {/* Router ID */}
            <span className="font-mono">ID: {routerId}</span>
            
            {/* IP Address */}
            {router?.ipAddress && (
              <>
                <span className="hidden md:inline text-slate-300 dark:text-slate-700">•</span>
                <span className="font-mono">{router.ipAddress}</span>
              </>
            )}
            
            {/* Router Model (if available) */}
            {router?.model && (
              <>
                <span className="hidden md:inline text-slate-300 dark:text-slate-700">•</span>
                <span className="hidden lg:inline">{router.model}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




























