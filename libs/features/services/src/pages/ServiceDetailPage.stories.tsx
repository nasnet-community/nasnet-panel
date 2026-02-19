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

import type { Meta, StoryObj } from '@storybook/react';
import { ServiceDetailPage } from './ServiceDetailPage';

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
const meta: Meta<typeof ServiceDetailPage> = {
  title: 'Pages/Services/ServiceDetailPage',
  component: ServiceDetailPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Service instance detail page (Task #7, NAS-8.4, NAS-8.5, NAS-8.6). ' +
          'Tabbed interface: Overview (health, VIF bridge, resource limits, isolation, ' +
          'gateway status), Configuration (dynamic form), Traffic (24h chart + quota), ' +
          'Logs (live tail), Diagnostics (tests + history). Auto-switches to Diagnostics ' +
          'tab when instance status is FAILED. Export dialog available when instance is ' +
          'not in PENDING or INSTALLING state.',
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  argTypes: {
    routerId: {
      description: 'Router ID used to scope all API queries and mutations',
      control: 'text',
    },
    instanceId: {
      description: 'Service instance ID to display',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ServiceDetailPage>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default — Running Tor instance
 *
 * Renders a running Tor privacy service with health badge. Overview tab is
 * shown by default. Actual content (gateway status, isolation data, logs)
 * depends on the MSW / Apollo mock environment.
 */
export const Default: Story = {
  args: {
    routerId: 'router-001',
    instanceId: 'inst-tor-001',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Running Tor instance. Overview tab is active. ServiceHealthBadge ' +
          'is visible in the page header. Export button is shown. Gateway ' +
          'status card appears if the mock returns a gateway state other than ' +
          'NOT_NEEDED.',
      },
    },
    mockData: {
      instance: {
        id: 'inst-tor-001',
        instanceName: 'tor-main',
        featureID: 'tor',
        status: 'RUNNING',
        binaryVersion: '0.4.8.10',
        vlanID: null,
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-02-19T08:30:00Z',
      },
    },
  },
};

/**
 * Proxy Service — sing-box with VLAN Bridge
 *
 * A sing-box proxy instance with a VLAN assigned (`vlanID` is set), so the
 * `VirtualInterfaceBridge` card is rendered in the Overview tab below the
 * ServiceCard. Shows the bridge topology with the assigned VLAN segment.
 */
export const ProxyWithVLANBridge: Story = {
  args: {
    routerId: 'router-001',
    instanceId: 'inst-singbox-001',
  },
  parameters: {
    docs: {
      description: {
        story:
          'sing-box proxy instance with a VLAN ID assigned. The ' +
          'VirtualInterfaceBridge card renders below the ServiceCard in the ' +
          'Overview tab, showing the bridge between the service virtual ' +
          'interface and the VLAN segment.',
      },
    },
    mockData: {
      instance: {
        id: 'inst-singbox-001',
        instanceName: 'singbox-proxy',
        featureID: 'sing-box',
        status: 'RUNNING',
        binaryVersion: '1.8.0',
        vlanID: 'vlan-42',
        createdAt: '2026-01-20T14:00:00Z',
        updatedAt: '2026-02-19T09:00:00Z',
      },
    },
  },
};

/**
 * Failed Instance — Diagnostics Auto-Selected
 *
 * An AdGuard Home instance that is in FAILED status. The page auto-selects
 * the Diagnostics tab so the admin can immediately see the test results and
 * error details without having to navigate manually.
 */
export const FailedInstanceDiagnostics: Story = {
  args: {
    routerId: 'router-001',
    instanceId: 'inst-adguard-001',
  },
  parameters: {
    docs: {
      description: {
        story:
          'AdGuard Home instance in FAILED state. The page auto-selects the ' +
          'Diagnostics tab on mount via the useEffect that watches instance.status. ' +
          'DiagnosticsPanel shows the most recent test run results and failure ' +
          'reason. The health badge is hidden (only shown for RUNNING).',
      },
    },
    mockData: {
      instance: {
        id: 'inst-adguard-001',
        instanceName: 'adguard-home',
        featureID: 'adguard-home',
        status: 'FAILED',
        binaryVersion: '0.107.43',
        vlanID: null,
        createdAt: '2026-02-10T08:00:00Z',
        updatedAt: '2026-02-19T07:45:00Z',
      },
    },
  },
};

/**
 * Loading State
 *
 * `useServiceInstance` is still in flight. A centered spinner with
 * "Loading service instance..." text is displayed.
 */
export const LoadingState: Story = {
  args: {
    routerId: 'router-001',
    instanceId: 'inst-loading',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Loading state while the service instance query is in flight. ' +
          'A Loader2 spinner with role="status" is rendered to satisfy ' +
          'WCAG AAA requirements for dynamic content indicators.',
      },
    },
    mockData: {
      loading: true,
      instance: null,
    },
  },
};
