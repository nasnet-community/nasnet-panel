/**
 * Storybook stories for LogEntryItem
 *
 * Renders a single RouterOS system log entry with severity icon,
 * topic badge, timestamp, and message text.
 * Story NAS-5.6: Recent Logs with Filtering.
 */
import { LogEntryItem } from './LogEntryItem';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof LogEntryItem>;
export default meta;
type Story = StoryObj<typeof LogEntryItem>;
/** Debug-level entry — icon and topic badge use muted/secondary colour. */
export declare const DebugSeverity: Story;
/** Info-level entry — standard DHCP lease notification. */
export declare const InfoSeverity: Story;
/** Warning-level entry — amber icon colour, wireless signal degradation. */
export declare const WarningSeverity: Story;
/** Error-level entry — red icon, firewall drop event. */
export declare const ErrorSeverity: Story;
/** Critical-level entry — pulsing red icon, OOM kill event. */
export declare const CriticalSeverity: Story;
/** New entry highlight — applies animate-highlight + primary/5 background. */
export declare const NewEntry: Story;
/** Compact mode — message is clamped to a single line (used on mobile). */
export declare const CompactMode: Story;
/** Full message with no clamping — shows the complete long VPN message. */
export declare const LongMessage: Story;
//# sourceMappingURL=LogEntryItem.stories.d.ts.map