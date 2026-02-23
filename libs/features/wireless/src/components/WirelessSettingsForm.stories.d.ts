/**
 * WirelessSettingsForm Stories
 *
 * Demonstrates all meaningful states of the comprehensive wireless settings
 * form: default values per band, a pre-filled 5 GHz interface, the submitting
 * loading state, and a hidden-SSID pre-configuration. Each story uses inline
 * mock data and action handlers so no providers are needed.
 */
import { WirelessSettingsForm } from './WirelessSettingsForm';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof WirelessSettingsForm>;
export default meta;
type Story = StoryObj<typeof WirelessSettingsForm>;
export declare const Default2_4GHz: Story;
export declare const Default5GHz: Story;
export declare const Default6GHz: Story;
export declare const HiddenSsidPreFilled: Story;
export declare const Submitting: Story;
export declare const NoCountryCode: Story;
//# sourceMappingURL=WirelessSettingsForm.stories.d.ts.map