/**
 * ServicesPage Storybook Stories
 *
 * Interactive stories for the Services page domain component.
 * Demonstrates the Feature Marketplace instance list, resource overview,
 * storage management collapsibles, bulk operations, filtering, and
 * install/import dialogs.
 *
 * @module @nasnet/features/services/pages
 */
import { ServicesPage } from './ServicesPage';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * ServicesPage — Feature Marketplace service instance management
 *
 * Main page for managing downloadable network service instances on the router.
 * Services include Tor, sing-box, Xray-core, MTProxy, Psiphon, and AdGuard
 * Home. Provides:
 *
 * - **Page header**: Title, description, "Import" and "Install Service" CTA
 *   buttons.
 * - **Resource Overview** (collapsible): `ResourceBudgetPanel` shows per-
 *   instance RAM allocation and system totals. Auto-expands on first render.
 * - **Storage Management** (collapsible): `StorageSettings` component for
 *   configuring external USB / flash storage. Auto-expands when storage is
 *   connected or already configured.
 * - **Instance Manager**: `InstanceManager` pattern component rendering all
 *   installed service instances with search, category filter, status filter,
 *   sort controls, view-mode toggle (grid / list), and bulk operations
 *   (start, stop, restart, delete).
 * - **Install Dialog**: `InstallDialog` mounted at page level to avoid
 *   portal z-index issues.
 * - **Import Dialog**: `ServiceImportDialog` for importing a shared service
 *   configuration from another router.
 *
 * ## Props
 *
 * | Prop | Type | Description |
 * |------|------|-------------|
 * | `routerId` | `string` | Router ID used to scope all API queries |
 *
 * ## Data flow
 *
 * `useServiceInstances` fetches installed instances via GraphQL.
 * `useSystemResources` fetches RAM / CPU budgets for the resource panel.
 * `useStorageConfig` fetches USB/flash storage status.
 * UI filter/sort/selection state lives in `useServiceUIStore` (Zustand).
 */
declare const meta: Meta<typeof ServicesPage>;
export default meta;
type Story = StoryObj<typeof ServicesPage>;
/**
 * Default — populated instance list
 *
 * Renders with a typical router ID. The Resource Overview and Storage
 * Management sections are expanded by default. Instance list content
 * depends on the MSW / Apollo mock environment.
 */
export declare const Default: Story;
/**
 * Empty State — no services installed
 *
 * No service instances returned from the API. The InstanceManager renders
 * the built-in empty-state card: "No services installed yet" with an
 * "Install Your First Service" button that opens the InstallDialog.
 */
export declare const EmptyState: Story;
/**
 * Mobile Viewport
 *
 * Narrow viewport (<640px). The page header buttons collapse to icon-only
 * variants; the InstanceManager switches to its card-grid mobile presenter;
 * the ResourceBudgetPanel adapts to a single-column layout.
 */
export declare const MobileViewport: Story;
/**
 * Desktop Viewport — wide layout
 *
 * Wide viewport (>1024px). The InstanceManager renders its dense data-table
 * presenter with inline action menus and sortable column headers. Resource
 * Overview shows a horizontal bar chart layout for the budget panel.
 */
export declare const DesktopViewport: Story;
//# sourceMappingURL=ServicesPage.stories.d.ts.map