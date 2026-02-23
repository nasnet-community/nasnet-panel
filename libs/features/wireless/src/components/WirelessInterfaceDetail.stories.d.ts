/**
 * WirelessInterfaceDetail Stories
 *
 * Exercises the full detail view for a wireless interface. Each story targets
 * a distinct combination of operating mode, band, security profile presence,
 * signal strength (station mode), hidden SSID, and regional settings.
 *
 * NOTE: WirelessInterfaceDetail mounts InterfaceToggle and WirelessSettingsModal
 * internally. Both components consume runtime hooks (useToggleInterface,
 * useConnectionStore, and mutation hooks). The visual layout driven by the
 * `interface` prop is fully exercised; interactive mutations need provider
 * decorators in a full Storybook environment.
 */
import { WirelessInterfaceDetail } from './WirelessInterfaceDetail';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof WirelessInterfaceDetail>;
export default meta;
type Story = StoryObj<typeof WirelessInterfaceDetail>;
export declare const AccessPoint2_4GHz: Story;
export declare const AccessPoint5GHz: Story;
export declare const HiddenSsid: Story;
export declare const StationMode: Story;
export declare const OpenGuestNetwork: Story;
export declare const DisabledInterface: Story;
//# sourceMappingURL=WirelessInterfaceDetail.stories.d.ts.map