/**
 * ServicePortsPage Storybook Stories
 *
 * Interactive stories for the Service Ports page domain component.
 * Demonstrates tab navigation between the Services and Groups views,
 * context-aware action buttons, empty states, and dialog integration.
 *
 * @module @nasnet/features/firewall/pages
 */
import { ServicePortsPage } from './ServicePortsPage';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * ServicePortsPage — service ports and service groups management
 *
 * Main page for managing firewall service port definitions used in filter,
 * NAT, and mangle rules. Provides:
 *
 * - **Services tab**: Combined list of built-in RouterOS services (HTTP,
 *   HTTPS, DNS, SSH, etc.) and user-created custom services. Rendered by
 *   `ServicePortsTable`.
 * - **Groups tab**: User-defined service groups that bundle multiple ports
 *   into a single reusable matcher. Empty state is shown when no groups
 *   exist; a placeholder card appears when groups are present (full table
 *   is a future milestone).
 * - **Context-aware action button**: Shows "Add Service" on the Services
 *   tab and "Create Group" on the Groups tab.
 * - **Dialogs**: `AddServiceDialog` and `ServiceGroupDialog` are mounted
 *   at page level and controlled via boolean state.
 *
 * ## Data flow
 *
 * `useCustomServices` (from `@nasnet/features/firewall/hooks`) fetches
 * user-defined services and service groups from the backend.
 * Built-in services are rendered from a static constant list inside
 * `ServicePortsTable`.
 */
declare const meta: Meta<typeof ServicePortsPage>;
export default meta;
type Story = StoryObj<typeof ServicePortsPage>;
/**
 * Default — Services Tab
 *
 * The page opens on the Services tab by default. The full list of built-in
 * RouterOS services is displayed alongside any custom services stored in the
 * backend. The "Add Service" button is shown in the header.
 */
export declare const Default: Story;
/**
 * Groups Tab — Empty State
 *
 * The Groups tab is active and no service groups have been created yet.
 * The dashed-border empty-state card is shown with a "Create Group" CTA.
 * The page-level action button also switches to "Create Group".
 */
export declare const GroupsTabEmpty: Story;
/**
 * Groups Tab — With Groups
 *
 * The Groups tab is active and service groups exist in the store. The
 * placeholder "coming soon" card is shown with the group count, indicating
 * the full groups table is a future scope item.
 */
export declare const GroupsTabWithGroups: Story;
/**
 * Mobile Viewport
 *
 * Narrow viewport (<640px). Tab triggers stack cleanly; the action button
 * remains full-width below the tab list on smaller screens.
 */
export declare const MobileViewport: Story;
//# sourceMappingURL=ServicePortsPage.stories.d.ts.map