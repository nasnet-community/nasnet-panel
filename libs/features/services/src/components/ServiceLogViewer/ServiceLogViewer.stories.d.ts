/**
 * ServiceLogViewer Storybook Stories
 *
 * Demonstrates all visual states of the ServiceLogViewer component.
 * The component depends on useServiceLogs (GraphQL query + subscription);
 * those hooks must be mocked via MSW in Storybook for full integration.
 * The stories below document the expected states and pass mockData parameters
 * that MSW handlers can intercept.
 *
 * Platform presenters:
 * - Desktop / Tablet (≥640px): Virtual-scrolled table with dropdown filters
 * - Mobile (<640px): Card-based rows with bottom-sheet filters/actions
 */
import { ServiceLogViewer } from './ServiceLogViewer';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ServiceLogViewer>;
export default meta;
type Story = StoryObj<typeof ServiceLogViewer>;
/**
 * Default view with a realistic mix of DEBUG / INFO / WARN / ERROR entries.
 * Mock the useServiceLogs hook to return `mixedLogs` via MSW.
 */
export declare const Default: Story;
/**
 * Loading state while the initial log batch is being fetched.
 * The component should display a loading indicator and no rows.
 */
export declare const Loading: Story;
/**
 * Empty state — no logs in the buffer and no active filters.
 */
export declare const Empty: Story;
/**
 * Error state when the log subscription cannot be established.
 */
export declare const ErrorState: Story;
/**
 * Only ERROR-level entries visible — simulates the user selecting the ERROR
 * level filter from the dropdown.
 */
export declare const FilteredByError: Story;
/**
 * Large ring buffer (500 entries) demonstrating virtual scrolling performance.
 * The desktop presenter uses @tanstack/react-virtual to maintain 60 fps.
 */
export declare const LargeBuffer: Story;
/**
 * Mobile viewport — forces the mobile presenter with touch-sized rows
 * and bottom-sheet filter / actions panels.
 */
export declare const MobileLayout: Story;
//# sourceMappingURL=ServiceLogViewer.stories.d.ts.map