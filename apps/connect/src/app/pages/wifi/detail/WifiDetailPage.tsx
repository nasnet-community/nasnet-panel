/**
 * WiFi Interface Detail Page
 * Displays detailed configuration for a single wireless interface
 * Implements FR0-15: View wireless interface configuration details
 */

import React from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWirelessInterfaceDetail } from '@nasnet/api-client/queries';
import { WirelessInterfaceDetail } from '@nasnet/features/wireless';
import { useConnectionStore } from '@nasnet/state/stores';
import { Skeleton } from '@nasnet/ui/primitives';

/**
 * WiFi Interface Detail Page
 * - Shows detailed wireless interface configuration
 * - Provides back navigation to interface list
 * - Implements loading and error states
 *
 * @example
 * Route: /router/:id/wifi/:interfaceName
 */
export const WifiDetailPage = React.memo(function WifiDetailPage() {
  const { t } = useTranslation('wifi');
  const { interfaceName, id: routerId } = useParams({ from: '/router/$id/wifi/$interfaceName' });
  const navigate = useNavigate();
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const {
    data: interfaceData,
    isLoading,
    error,
  } = useWirelessInterfaceDetail(routerIp, interfaceName || '');

  /**
   * Navigate back to the router's WiFi tab
   */
  const handleBack = () => {
    navigate({ to: `/router/${routerId}/wifi` });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-page-mobile md:py-page-tablet lg:py-page-desktop">
        <div className="mx-auto max-w-3xl">
          {/* Header skeleton */}
          <div className="mb-component-lg">
            <Skeleton className="mb-component-md h-10 w-32" />
            <Skeleton className="mb-component-sm h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>

          {/* Detail cards skeleton */}
          <div className="gap-component-md">
            <Skeleton className="h-48 w-full rounded-[var(--semantic-radius-card)]" />
            <Skeleton className="h-32 w-full rounded-[var(--semantic-radius-card)]" />
            <Skeleton className="h-32 w-full rounded-[var(--semantic-radius-card)]" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !interfaceData) {
    return (
      <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-page-mobile md:py-page-tablet lg:py-page-desktop">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={handleBack}
            className="gap-component-sm text-muted-foreground hover:text-foreground mb-component-lg focus-visible:ring-ring flex items-center rounded-[var(--semantic-radius-button)] text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('button.backToWiFi', { ns: 'common' })}
          </button>

          <div className="bg-error/10 border-error p-component-lg rounded-[var(--semantic-radius-card)] border text-center">
            <h2 className="text-error mb-component-sm text-lg font-semibold">
              {t('status.failedToLoadInterface')}
            </h2>
            <p className="text-muted-foreground text-sm">
              {error?.message || `Interface "${interfaceName}" not found`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="px-page-tablet py-page-tablet">
      <div className="mx-auto max-w-3xl">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="gap-component-sm text-muted-foreground hover:text-foreground mb-component-lg focus-visible:ring-ring flex items-center rounded-[var(--semantic-radius-button)] text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-label={t('button.backToWiFi', { ns: 'common' })}
        >
          <ArrowLeft className="h-4 w-4" />
          {t('button.backToWiFi', { ns: 'common' })}
        </button>

        {/* Page header */}
        <div className="mb-component-lg">
          <h1 className="font-display text-foreground mb-component-sm text-2xl font-semibold">
            <span className="font-display font-semibold">
              {interfaceData.ssid || t('status.wirelessInterface')}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('interfaces.detailedConfig', { name: interfaceData.name })}
          </p>
        </div>

        {/* Interface detail component */}
        <WirelessInterfaceDetail interface={interfaceData} />
      </div>
    </div>
  );
});

WifiDetailPage.displayName = 'WifiDetailPage';
