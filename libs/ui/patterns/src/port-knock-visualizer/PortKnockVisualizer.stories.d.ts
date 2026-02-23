/**
 * Port Knock Visualizer Stories
 * Visual flow diagram for knock sequence progression
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 9
 */
import { PortKnockVisualizer } from './PortKnockVisualizer';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof PortKnockVisualizer>;
export default meta;
type Story = StoryObj<typeof PortKnockVisualizer>;
/**
 * Simple 2-port knock sequence protecting SSH
 */
export declare const TwoPortSSH: Story;
/**
 * Complex 4-port knock sequence protecting HTTPS
 */
export declare const FourPortHTTPS: Story;
/**
 * Maximum 8-port knock sequence
 */
export declare const EightPortMaximum: Story;
/**
 * Mixed TCP/UDP protocol sequence
 */
export declare const MixedProtocols: Story;
/**
 * UDP-only knock sequence
 */
export declare const UDPOnly: Story;
/**
 * Compact mode for space-constrained UIs
 */
export declare const CompactMode: Story;
/**
 * Mobile/Vertical layout (simulated with narrow viewport)
 */
export declare const MobileLayout: Story;
//# sourceMappingURL=PortKnockVisualizer.stories.d.ts.map