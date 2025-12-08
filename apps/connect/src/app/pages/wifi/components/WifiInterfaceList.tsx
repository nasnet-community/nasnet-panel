/**
 * WiFi Interface List Component
 * Wrapper for WirelessInterfaceList with section header styling
 */

import { WirelessInterfaceList } from '@nasnet/features/wireless';
import { SectionHeader } from '../../network/components/SectionHeader';

export function WifiInterfaceList() {
  return (
    <section>
      <SectionHeader title="Wireless Interfaces" />
      <WirelessInterfaceList />
    </section>
  );
}




