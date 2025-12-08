/**
 * WiFi Interface Detail Page
 * Displays detailed configuration for a single wireless interface
 * Implements FR0-15: View wireless interface configuration details
 */

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { WirelessInterfaceDetail } from '@nasnet/features/wireless';
import { useWirelessInterfaceDetail } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import { Skeleton } from '@nasnet/ui/primitives';
import { ROUTES } from '@nasnet/core/constants';

/**
 * WiFi Interface Detail Page
 * - Shows detailed wireless interface configuration
 * - Provides back navigation to interface list
 * - Implements loading and error states
 *
 * @example
 * Route: /router/:id/wifi/:interfaceName
 */
export function WifiDetailPage() {
  const { interfaceName, id: routerId } = useParams<{ interfaceName: string; id: string }>();
  const navigate = useNavigate();
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: interfaceData, isLoading, error } = useWirelessInterfaceDetail(
    routerIp,
    interfaceName || ''
  );

  /**
   * Navigate back to the router's WiFi tab
   */
  const handleBack = () => {
    navigate(`/router/${routerId}/wifi`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8">
            <Skeleton className="h-10 w-32 mb-4" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>

          {/* Detail cards skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl md:rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-2xl md:rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-2xl md:rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !interfaceData) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 mb-8 transition-colors focus-ring rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to WiFi
          </button>

          <div className="bg-error/10 dark:bg-error/20 border border-error rounded-2xl md:rounded-3xl p-6 text-center">
            <h2 className="text-lg font-semibold text-error-dark dark:text-error-light mb-2">
              Failed to load interface
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {error?.message || `Interface "${interfaceName}" not found`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="px-6 py-6">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 mb-8 transition-colors focus-ring rounded-lg"
          aria-label="Back to WiFi list"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to WiFi
        </button>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
            {interfaceData.ssid || 'Wireless Interface'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Detailed configuration for {interfaceData.name}
          </p>
        </div>

        {/* Interface detail component */}
        <WirelessInterfaceDetail interface={interfaceData} />
      </div>
    </div>
  );
}
