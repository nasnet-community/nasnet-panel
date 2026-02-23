/**
 * DnsDiagnosticsPage Storybook Stories
 *
 * Page-level stories for the DNS Diagnostics page.
 * Covers default, alternate device IDs, and mobile viewport.
 */
import { DnsDiagnosticsPage } from './DnsDiagnosticsPage';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DnsDiagnosticsPage>;
export default meta;
type Story = StoryObj<typeof DnsDiagnosticsPage>;
/**
 * Default – page with a concrete device ID ready for interactive use.
 */
export declare const Default: Story;
/**
 * DefaultDeviceFallback – no deviceId supplied; falls back to the string "default".
 */
export declare const DefaultDeviceFallback: Story;
/**
 * AlternateDevice – diagnostic tools scoped to a different device ID.
 */
export declare const AlternateDevice: Story;
/**
 * MobileViewport – single-column stacked layout at 375 px wide.
 */
export declare const MobileViewport: Story;
//# sourceMappingURL=DnsDiagnosticsPage.stories.d.ts.map