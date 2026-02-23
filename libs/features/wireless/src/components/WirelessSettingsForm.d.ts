/**
 * WirelessSettingsForm Component
 * Comprehensive form for editing wireless interface settings
 * Implements FR0-18: Modify wireless settings including SSID, password,
 * channel, channel width, TX power, hidden SSID, security mode, and country
 */
import type { FrequencyBand, ChannelWidth } from '@nasnet/core/types';
import { type WirelessSettingsFormData } from '../validation/wirelessSettings.schema';
export interface WirelessSettingsFormProps {
    /** Current values from the interface */
    currentValues: {
        ssid: string;
        hideSsid: boolean;
        channel: string;
        channelWidth: ChannelWidth;
        txPower: number;
        countryCode?: string;
        band: FrequencyBand;
    };
    /** Whether the form is submitting */
    isSubmitting?: boolean;
    /** Submit handler */
    onSubmit: (data: WirelessSettingsFormData) => void;
    /** Cancel handler */
    onCancel: () => void;
    /** Optional CSS className */
    className?: string;
}
/**
 * Wireless Settings Form Component
 * Comprehensive form with sections for:
 * - Basic settings (SSID, password, hide SSID)
 * - Radio settings (channel, channel width, TX power)
 * - Security (security mode)
 * - Regional (country/region)
 *
 * @example
 * ```tsx
 * <WirelessSettingsForm
 *   currentValues={{
 *     ssid: "HomeNetwork",
 *     hideSsid: false,
 *     channel: "auto",
 *     channelWidth: "20MHz",
 *     txPower: 17,
 *     band: "2.4GHz",
 *   }}
 *   isSubmitting={updateMutation.isPending}
 *   onSubmit={(data) => updateMutation.mutate(data)}
 *   onCancel={() => setShowModal(false)}
 * />
 * ```
 */
export declare function WirelessSettingsForm({ currentValues, isSubmitting, onSubmit, onCancel, className, }: WirelessSettingsFormProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=WirelessSettingsForm.d.ts.map