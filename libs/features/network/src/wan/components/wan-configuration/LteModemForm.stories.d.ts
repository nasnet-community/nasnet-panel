/**
 * LTE Modem Form Storybook Stories
 *
 * Interactive documentation and visual testing for LTE modem configuration form.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 7: LTE Support)
 */
import { LteModemForm } from './LteModemForm';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof LteModemForm>;
export default meta;
type Story = StoryObj<typeof LteModemForm>;
/**
 * Default state - Empty form ready for new LTE configuration
 */
export declare const Default: Story;
/**
 * Excellent Signal - Strong cellular signal (-70 dBm)
 */
export declare const ExcellentSignal: Story;
/**
 * Good Signal - Typical outdoor signal (-80 dBm)
 */
export declare const GoodSignal: Story;
/**
 * Fair Signal - Indoor signal (-95 dBm)
 */
export declare const FairSignal: Story;
/**
 * Poor Signal - Weak signal (-110 dBm)
 */
export declare const PoorSignal: Story;
/**
 * No Signal - Very weak or no signal (-125 dBm)
 */
export declare const NoSignal: Story;
/**
 * Pre-filled Configuration - Editing existing LTE modem
 */
export declare const PrefilledConfiguration: Story;
/**
 * T-Mobile Preset - Quick setup for T-Mobile US
 */
export declare const TMobilePreset: Story;
/**
 * AT&T Preset - Quick setup for AT&T
 */
export declare const ATTPreset: Story;
/**
 * With Authentication - PAP authentication enabled
 */
export declare const WithAuthentication: Story;
/**
 * With SIM PIN - PIN-locked SIM card configuration
 */
export declare const WithSimPin: Story;
/**
 * Custom MTU - Modified MTU setting for specific networks
 */
export declare const CustomMTU: Story;
/**
 * Disabled Interface - LTE configured but disabled
 */
export declare const DisabledInterface: Story;
/**
 * Backup WAN - LTE as backup without default route
 */
export declare const BackupWAN: Story;
/**
 * Mobile Only - No cancel button (embedded in workflow)
 */
export declare const MobileEmbedded: Story;
/**
 * International - Vodafone EU preset
 */
export declare const VodafoneEU: Story;
/**
 * Interactive - Playground for testing all configurations
 */
export declare const Playground: Story;
//# sourceMappingURL=LteModemForm.stories.d.ts.map