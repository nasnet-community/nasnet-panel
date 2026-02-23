/**
 * ResourceBudgetPanel Storybook Stories
 *
 * Comprehensive stories demonstrating all ResourceBudgetPanel states and scenarios.
 */
import { ResourceBudgetPanel } from './ResourceBudgetPanel';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ResourceBudgetPanel>;
export default meta;
type Story = StoryObj<typeof ResourceBudgetPanel>;
/**
 * Empty State
 * No service instances
 */
export declare const Empty: Story;
/**
 * Few Services
 * Typical usage with a few service instances
 */
export declare const FewServices: Story;
/**
 * Many Services
 * Shows scrollable list with many instances
 */
export declare const ManyServices: Story;
/**
 * Mixed Status
 * Shows all threshold statuses (idle, normal, warning, critical, danger, error)
 */
export declare const MixedStatus: Story;
/**
 * Show Only Running
 * Filters to show only running instances
 */
export declare const ShowOnlyRunning: Story;
/**
 * Hide System Totals
 * Shows only the instance table without system overview
 */
export declare const HideSystemTotals: Story;
/**
 * Loading State
 * Shows loading message while data is being fetched
 */
export declare const Loading: Story;
/**
 * Custom Empty Message
 * Shows custom empty state message
 */
export declare const CustomEmptyMessage: Story;
/**
 * Mobile Variant
 * Forces mobile presentation (card-based layout)
 */
export declare const MobileVariant: Story;
/**
 * Desktop Variant
 * Forces desktop presentation (table layout)
 */
export declare const DesktopVariant: Story;
/**
 * Interactive Example
 * Shows instance click handler
 */
export declare const Interactive: Story;
/**
 * High Memory Usage
 * System approaching capacity
 */
export declare const HighMemoryUsage: Story;
//# sourceMappingURL=ResourceBudgetPanel.stories.d.ts.map