/**
 * WiFi Interface List Component
 * Wrapper for WirelessInterfaceList with section header styling
 */

import { WirelessInterfaceList } from '@nasnet/features/wireless';

import { SectionHeader } from '../../network/components/SectionHeader';

interface WifiInterfaceListProps {
  routerId: string;
}

export function WifiInterfaceList({ routerId }: WifiInterfaceListProps) {
  return (
    <section>
      <SectionHeader title="Wireless Interfaces" />
      <WirelessInterfaceList routerId={routerId} />
    </section>
  );
}

























