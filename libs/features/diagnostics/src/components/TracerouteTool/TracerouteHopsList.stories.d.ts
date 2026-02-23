/**
 * Storybook stories for TracerouteHopsList
 *
 * Covers: empty state, running (discovering), completed with excellent/
 * acceptable/poor latency hops, timeouts, and packet loss.
 */
import { TracerouteHopsList } from './TracerouteHopsList';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof TracerouteHopsList>;
export default meta;
type Story = StoryObj<typeof TracerouteHopsList>;
export declare const Empty: Story;
export declare const Discovering: Story;
export declare const Completed: Story;
export declare const HighLatency: Story;
export declare const WithTimeouts: Story;
export declare const WithPacketLoss: Story;
//# sourceMappingURL=TracerouteHopsList.stories.d.ts.map