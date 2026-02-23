import { RouterCard } from './RouterCard';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof RouterCard>;
export default meta;
type Story = StoryObj<typeof RouterCard>;
/**
 * A fully connected router discovered by auto-scan.
 */
export declare const Online: Story;
/**
 * Router that was previously connected but is now unreachable.
 * The Connect button is visible since the status is not "online".
 */
export declare const Offline: Story;
/**
 * Manually-added router that has never been connected — status is "unknown".
 * No model or RouterOS version data is available yet.
 */
export declare const UnknownStatus: Story;
/**
 * Authentication handshake in progress — "Connecting…" badge.
 */
export declare const Connecting: Story;
/**
 * Selected state — the card has a blue border and tinted background.
 */
export declare const Selected: Story;
/**
 * Read-only view — no Connect or Remove callbacks provided.
 * Action buttons are hidden.
 */
export declare const ReadOnly: Story;
//# sourceMappingURL=RouterCard.stories.d.ts.map