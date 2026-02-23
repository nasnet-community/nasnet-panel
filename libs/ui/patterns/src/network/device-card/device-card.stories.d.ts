/**
 * Device Card Stories
 *
 * Storybook stories for the DeviceCard pattern component.
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */
import { DeviceCard } from './device-card';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DeviceCard>;
export default meta;
type Story = StoryObj<typeof DeviceCard>;
/**
 * Default device card showing an online computer
 */
export declare const Default: Story;
/**
 * Online device with all information displayed
 */
export declare const OnlineDevice: Story;
/**
 * Offline device with gray status indicator
 */
export declare const OfflineDevice: Story;
/**
 * Phone device (smartphone icon)
 */
export declare const PhoneDevice: Story;
/**
 * Tablet device
 */
export declare const TabletDevice: Story;
/**
 * IoT device (router, smart device)
 */
export declare const IoTDevice: Story;
/**
 * Printer device
 */
export declare const PrinterDevice: Story;
/**
 * Gaming console
 */
export declare const GamingDevice: Story;
/**
 * Unknown device type
 */
export declare const UnknownDevice: Story;
/**
 * Wired connection (Ethernet)
 */
export declare const WiredConnection: Story;
/**
 * Wireless connection (WiFi)
 */
export declare const WirelessConnection: Story;
/**
 * High confidence detection (>= 90%)
 * No confidence indicator shown
 */
export declare const HighConfidence: Story;
/**
 * Medium confidence detection (60-89%)
 * Shows amber confidence indicator
 */
export declare const MediumConfidence: Story;
/**
 * Low confidence detection (< 60%)
 * Shows red confidence indicator
 */
export declare const LowConfidence: Story;
/**
 * Compact mode for sidebar/widget usage
 */
export declare const CompactMode: Story;
/**
 * Card with no actions (view only)
 */
export declare const NoActions: Story;
/**
 * Selected/active card state
 */
export declare const SelectedCard: Story;
/**
 * Device with custom user-assigned name
 */
export declare const WithCustomName: Story;
/**
 * Device without hostname (shows MAC address)
 */
export declare const WithoutHostname: Story;
/**
 * Desktop presenter with hover actions and dropdown menu
 */
export declare const DesktopPresenter: Story;
/**
 * Mobile presenter with tap-to-open bottom sheet
 */
export declare const MobilePresenter: Story;
/**
 * Compact presenter for sidebar usage
 */
export declare const CompactPresenter: Story;
/**
 * Device card in dark theme
 */
export declare const DarkTheme: Story;
/**
 * Multiple device cards in a list
 */
export declare const DeviceList: Story;
/**
 * Compact device cards in sidebar
 */
export declare const CompactList: Story;
//# sourceMappingURL=device-card.stories.d.ts.map