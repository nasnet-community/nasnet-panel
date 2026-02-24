/**
 * Port Knock Sequence Manager Stories
 * Manages the list of port knock sequences with CRUD operations
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 9
 */
import { PortKnockSequenceManager } from './PortKnockSequenceManager';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof PortKnockSequenceManager>;
export default meta;
type Story = StoryObj<typeof PortKnockSequenceManager>;
/**
 * Default state with multiple sequences
 */
export declare const Default: Story;
/**
 * Empty state - No sequences configured
 */
export declare const Empty: Story;
/**
 * Loading state
 */
export declare const Loading: Story;
/**
 * Mobile viewport
 */
export declare const Mobile: Story;
/**
 * With callbacks
 */
export declare const WithCallbacks: Story;
//# sourceMappingURL=PortKnockSequenceManager.stories.d.ts.map