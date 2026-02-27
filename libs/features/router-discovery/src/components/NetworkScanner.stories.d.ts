import { NetworkScanner } from './NetworkScanner';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof NetworkScanner>;
export default meta;
type Story = StoryObj<typeof NetworkScanner>;
/**
 * Default idle state — the scanner is ready for the user to click Scan Network.
 * The subnet field is pre-populated with the common MikroTik default.
 */
export declare const Default: Story;
/**
 * Custom subnet pre-filled — useful for enterprise environments using 10.x addressing.
 */
export declare const CustomSubnet: Story;
/**
 * Demonstrates the layout when scan results populate — click "Scan Network" in
 * the Default story to reach this state interactively. This story documents the
 * props passed to onScanComplete once results arrive.
 *
 * Note: because NetworkScanner owns its state, this story shows the idle view
 * but documents what the result list looks like (see _mockResults above).
 */
export declare const WithResultsCallback: Story;
/**
 * No callbacks wired — useful for embedding as a display-only component
 * or when the parent provides no handler yet.
 */
export declare const Standalone: Story;
/**
 * Wide container — verifies the layout fills larger viewports gracefully.
 */
export declare const WideLayout: Story;
//# sourceMappingURL=NetworkScanner.stories.d.ts.map
