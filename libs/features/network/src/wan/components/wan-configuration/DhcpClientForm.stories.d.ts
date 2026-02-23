/**
 * DHCP Client Form Storybook Stories
 *
 * Interactive documentation and visual testing for the DHCP client WAN
 * configuration form. Covers the full range of props, states, and user flows.
 */
import { DhcpClientForm } from './DhcpClientForm';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DhcpClientForm>;
export default meta;
type Story = StoryObj<typeof DhcpClientForm>;
/**
 * Default - empty form ready for a new DHCP WAN connection.
 */
export declare const Default: Story;
/**
 * WithInitialValues - form pre-populated with an existing DHCP configuration.
 */
export declare const WithInitialValues: Story;
/**
 * Loading - form locked while a submit is in progress.
 */
export declare const Loading: Story;
/**
 * PeerDNSAndNTPDisabled - both peer DNS and NTP disabled for manual configuration.
 */
export declare const PeerDNSAndNTPDisabled: Story;
/**
 * NoCancelButton - embedded in a wizard where cancellation is not applicable.
 */
export declare const NoCancelButton: Story;
/**
 * BackupWAN - secondary WAN without a default route.
 */
export declare const BackupWAN: Story;
//# sourceMappingURL=DhcpClientForm.stories.d.ts.map