/**
 * Service Ports Table Storybook Stories
 *
 * Visual documentation and testing for ServicePortsTable component.
 *
 * Stories:
 * - Default (with built-in services)
 * - With custom services
 * - With search applied
 * - Empty state
 * - Loading state
 *
 * @see NAS-7.8: Implement Service Ports Management - Task 5
 */
import { ServicePortsTable } from './ServicePortsTable';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ServicePortsTable>;
export default meta;
type Story = StoryObj<typeof ServicePortsTable>;
/**
 * Default state with built-in services
 */
export declare const Default: Story;
/**
 * With custom services
 */
export declare const WithCustomServices: Story;
/**
 * Empty state
 */
export declare const EmptyState: Story;
/**
 * With search applied
 */
export declare const WithSearch: Story;
/**
 * Loading state
 */
export declare const LoadingState: Story;
/**
 * Mobile view
 */
export declare const MobileView: Story;
/**
 * Desktop view with filters
 */
export declare const DesktopWithFilters: Story;
//# sourceMappingURL=ServicePortsTable.stories.d.ts.map