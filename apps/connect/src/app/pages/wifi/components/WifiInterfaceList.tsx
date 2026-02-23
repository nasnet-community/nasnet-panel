/**
 * WiFi Interface List Component
 * Wrapper for WirelessInterfaceList with section header styling
 */

import React from 'react';

import { useTranslation } from 'react-i18next';

import { WirelessInterfaceList } from '@nasnet/features/wireless';

import { SectionHeader } from '../../network/components/SectionHeader';

interface WifiInterfaceListProps {
  routerId: string;
}

export const WifiInterfaceList = React.memo(function WifiInterfaceList({ routerId }: WifiInterfaceListProps) {
  const { t } = useTranslation('wifi');
  return (
    <section>
      <SectionHeader title={t('interfaces.title')} />
      <WirelessInterfaceList routerId={routerId} />
    </section>
  );
});

WifiInterfaceList.displayName = 'WifiInterfaceList';

























