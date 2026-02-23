/**
 * Storybook stories for ConnectionEventCard and ConnectionEventCardCompact.
 *
 * Covers all five event types (CONNECTED, DISCONNECTED, AUTH_FAILED, IP_CHANGED,
 * RECONNECTING) plus edge-case stories (no optional fields, long reason text).
 */
import { ConnectionEventCard } from './ConnectionEventCard';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ConnectionEventCard>;
export default meta;
type Story = StoryObj<typeof ConnectionEventCard>;
export declare const Connected: Story;
export declare const Disconnected: Story;
export declare const AuthFailed: Story;
export declare const IpChanged: Story;
export declare const Reconnecting: Story;
export declare const UnknownEventType: Story;
export declare const MinimalData: Story;
export declare const CompactConnected: Story;
export declare const CompactDisconnected: Story;
export declare const CompactAuthFailed: Story;
//# sourceMappingURL=ConnectionEventCard.stories.d.ts.map