/**
 * ServiceDetailPage Storybook Stories
 *
 * Interactive stories for the Service Detail page domain component.
 * Demonstrates the tabbed interface (Overview, Configuration, Traffic, Logs,
 * Diagnostics), loading/error/not-found states, health badge, and the
 * VirtualInterfaceBridge card rendered when a VLAN is assigned.
 *
 * @module @nasnet/features/services/pages
 */
import { ServiceDetailPage } from './ServiceDetailPage';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * ServiceDetailPage — detailed view for a single service instance
 *
 * Renders a full-page detail view for an installed service instance.
 * Requires both `routerId` and `instanceId` props. Provides:
 *
 * - **Page header**: Instance name, feature ID subtitle, `ServiceHealthBadge`
 *   (shown only when status = RUNNING), and an Export button (hidden while
 *   PENDING or INSTALLING).
 * - **Tabs**:
 *   - **Overview**: `ServiceCard` + optional `VirtualInterfaceBridge`
 *     (shown when `vlanID` is set) + `ResourceLimitsForm` + `IsolationStatus`
 *     + optional `GatewayStatusCard` (shown when gateway state ≠ NOT_NEEDED).
 *   - **Configuration**: `ServiceConfigForm` with per-service-type dynamic
 *     field schema.
 *   - **Traffic**: `ServiceTrafficPanel` (24-hour history chart) +
 *     `QuotaSettingsForm`.
 *   - **Logs**: `ServiceLogViewer` with live tail and historical lines.
 *   - **Diagnostics**: `DiagnosticsPanel` with test history; auto-selected
 *     when instance status = FAILED.
 * - **Dialogs**: `ServiceExportDialog` mounted at page level.
 *
 * ## Props
 *
 * | Prop | Type | Description |
 * |------|------|-------------|
 * | `routerId` | `string` | Router ID for all scoped queries |
 * | `instanceId` | `string` | Service instance ID to display |
 *
 * ## States
 *
 * - **Loading**: Spinner while `useServiceInstance` is in flight.
 * - **Error**: Error card with the GraphQL error message.
 * - **Not Found**: "Instance Not Found" card when the query returns null.
 * - **Running**: Full tabbed interface with health badge.
 * - **Failed**: Full tabbed interface with Diagnostics tab auto-selected.
 */
declare const meta: Meta<typeof ServiceDetailPage>;
export default meta;
type Story = StoryObj<typeof ServiceDetailPage>;
/**
 * Default — Running Tor instance
 *
 * Renders a running Tor privacy service with health badge. Overview tab is
 * shown by default. Actual content (gateway status, isolation data, logs)
 * depends on the MSW / Apollo mock environment.
 */
export declare const Default: Story;
/**
 * Proxy Service — sing-box with VLAN Bridge
 *
 * A sing-box proxy instance with a VLAN assigned (`vlanID` is set), so the
 * `VirtualInterfaceBridge` card is rendered in the Overview tab below the
 * ServiceCard. Shows the bridge topology with the assigned VLAN segment.
 */
export declare const ProxyWithVLANBridge: Story;
/**
 * Failed Instance — Diagnostics Auto-Selected
 *
 * An AdGuard Home instance that is in FAILED status. The page auto-selects
 * the Diagnostics tab so the admin can immediately see the test results and
 * error details without having to navigate manually.
 */
export declare const FailedInstanceDiagnostics: Story;
/**
 * Loading State
 *
 * `useServiceInstance` is still in flight. A centered spinner with
 * "Loading service instance..." text is displayed.
 */
export declare const LoadingState: Story;
//# sourceMappingURL=ServiceDetailPage.stories.d.ts.map