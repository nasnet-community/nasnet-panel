/**
 * Storybook stories for DeviceTypeIcon
 *
 * Displays the correct Lucide icon with category-based color coding
 * and an optional tooltip showing device type and confidence level.
 * Part of the DHCP Fingerprinting feature (NAS-6.13).
 */
import type { Meta, StoryObj } from '@storybook/react';
import { DeviceTypeIcon } from './device-type-icon';
declare const meta: Meta<typeof DeviceTypeIcon>;
export default meta;
type Story = StoryObj<typeof DeviceTypeIcon>;
/**
 * iOS device — mobile category, rendered in info-blue.
 * Tooltip shows "iOS (95% confidence)".
 */
export declare const IosDevice: Story;
/**
 * Windows PC — computer category, rendered in success-green.
 */
export declare const WindowsPC: Story;
/**
 * IoT smart speaker — IoT category, rendered in warning-amber.
 */
export declare const SmartSpeaker: Story;
/**
 * Network router — network category, uses accent-foreground color.
 */
export declare const NetworkRouter: Story;
/**
 * Unknown device — "other" category, rendered in muted-foreground gray.
 * Tooltip shows "Unknown" with no confidence value.
 */
export declare const UnknownDevice: Story;
/**
 * Clickable icon variant. Wraps the icon in a 44px touch-target button.
 * The onClick callback fires when the icon is pressed.
 */
export declare const Clickable: Story;
/**
 * No tooltip — icon only without any Tooltip wrapper.
 * Useful when surrounding context already communicates the device type.
 */
export declare const NoTooltip: Story;
/**
 * Gallery of all 6 device categories side-by-side.
 * Each icon uses its category color class.
 */
export declare const AllCategories: Story;
//# sourceMappingURL=device-type-icon.stories.d.ts.map