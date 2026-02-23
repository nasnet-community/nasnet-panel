/**
 * WirelessInterfaceCard Stories
 *
 * Showcases the card component used to display a single wireless interface
 * in the WiFi page grid. Each story demonstrates a distinct combination of
 * band, status, and client count.
 *
 * NOTE: WirelessInterfaceCard renders an InterfaceToggle internally, which
 * depends on useToggleInterface and useConnectionStore at runtime. In a full
 * Storybook setup those would be provided via MSW / store decorators. The
 * visual states driven by the `interface` prop are fully exercised here.
 */
import { WirelessInterfaceCard } from './WirelessInterfaceCard';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof WirelessInterfaceCard>;
export default meta;
type Story = StoryObj<typeof WirelessInterfaceCard>;
export declare const Band2_4GHz: Story;
export declare const Band5GHz: Story;
export declare const Band6GHz: Story;
export declare const DisabledInterface: Story;
export declare const NoClients: Story;
export declare const SingleClient: Story;
export declare const HiddenSsid: Story;
export declare const NotConfigured: Story;
//# sourceMappingURL=WirelessInterfaceCard.stories.d.ts.map