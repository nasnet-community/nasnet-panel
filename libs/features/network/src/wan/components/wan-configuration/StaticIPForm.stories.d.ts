/**
 * Static IP Form Storybook Stories
 *
 * Interactive documentation and visual testing for the Static IP WAN
 * configuration form. Covers all states, presets, and safety flows.
 */
import { StaticIPForm } from './StaticIPForm';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof StaticIPForm>;
export default meta;
type Story = StoryObj<typeof StaticIPForm>;
/**
 * Default - empty form ready for a new static IP WAN connection.
 */
export declare const Default: Story;
/**
 * PrefilledConfiguration - editing an existing static IP WAN entry.
 */
export declare const PrefilledConfiguration: Story;
/**
 * WithCloudflareDNS - form pre-filled with Cloudflare DNS servers.
 */
export declare const WithCloudflareDNS: Story;
/**
 * Loading - form locked while a submit is in progress.
 */
export declare const Loading: Story;
/**
 * NoDNS - configuration without DNS servers (relying on router-level DNS).
 */
export declare const NoDNS: Story;
/**
 * NoCancelButton - embedded in a multi-step wizard.
 */
export declare const NoCancelButton: Story;
//# sourceMappingURL=StaticIPForm.stories.d.ts.map