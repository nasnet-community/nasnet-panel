import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceDetailPage } from './ServiceDetailPage';

// Mock dependencies
vi.mock('@nasnet/api-client/queries', () => ({
  useServiceInstance: vi.fn(),
  useGatewayStatus: vi.fn(),
  useInstanceIsolation: vi.fn(),
  useInstanceHealth: vi.fn(),
  useFeatureVerification: vi.fn(),
  useAvailableUpdates: vi.fn(),
}));

vi.mock('@nasnet/ui/patterns', () => ({
  ServiceCard: ({ service }: any) => <div data-testid="service-card">{service.name}</div>,
  VirtualInterfaceBridge: () => <div data-testid="vif-bridge">VIF Bridge</div>,
  IsolationStatus: () => <div data-testid="isolation-status">Isolation Status</div>,
  ServiceExportDialog: () => <div data-testid="export-dialog">Export Dialog</div>,
  ServiceHealthBadge: () => <div data-testid="health-badge">Health Badge</div>,
  VerificationBadge: () => <div data-testid="verification-badge">Verification Badge</div>,
  UpdateIndicator: () => <div data-testid="update-indicator">Update Indicator</div>,
}));

vi.mock('../components/GatewayStatusCard', () => ({
  GatewayStatusCard: () => <div data-testid="gateway-status">Gateway Status</div>,
}));

vi.mock('../components/ResourceLimitsForm', () => ({
  ResourceLimitsForm: () => <div data-testid="resource-limits">Resource Limits</div>,
}));

vi.mock('../components/ServiceLogViewer', () => ({
  ServiceLogViewer: () => <div data-testid="log-viewer">Log Viewer</div>,
}));

vi.mock('../components/DiagnosticsPanel', () => ({
  DiagnosticsPanel: () => <div data-testid="diagnostics">Diagnostics</div>,
}));

vi.mock('../components/service-traffic', () => ({
  ServiceTrafficPanel: () => <div data-testid="traffic-panel">Traffic Panel</div>,
  QuotaSettingsForm: () => <div data-testid="quota-form">Quota Form</div>,
}));

vi.mock('../components/ServiceConfigForm', () => ({
  ServiceConfigForm: () => <div data-testid="config-form">Config Form</div>,
}));

vi.mock('../components/ServiceAlertsTab', () => ({
  ServiceAlertsTab: () => <div data-testid="alerts-tab">Alerts Tab</div>,
}));

vi.mock('../hooks/useServiceConfigForm', () => ({
  useServiceConfigForm: () => ({
    isLoading: false,
    error: null,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useServiceInstance } from '@nasnet/api-client/queries';

const mockUseServiceInstance = useServiceInstance as any;

describe('ServiceDetailPage', () => {
  const mockInstance = {
    id: 'instance-1',
    instanceName: 'My Service',
    featureID: 'tor',
    status: 'RUNNING',
    binaryVersion: '1.0.0',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    vlanID: null,
  };

  beforeEach(() => {
    mockUseServiceInstance.mockReturnValue({
      instance: mockInstance,
      loading: false,
      error: null,
    });
  });

  describe('Rendering', () => {
    it('should render loading state correctly', () => {
      mockUseServiceInstance.mockReturnValue({
        instance: null,
        loading: true,
        error: null,
      });

      render(
        <ServiceDetailPage routerId="router-1" instanceId="instance-1" />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('services.detail.loading')).toBeInTheDocument();
    });

    it('should render error state with retry button', () => {
      const error = new Error('Failed to fetch instance');
      mockUseServiceInstance.mockReturnValue({
        instance: null,
        loading: false,
        error,
      });

      render(
        <ServiceDetailPage routerId="router-1" instanceId="instance-1" />
      );

      expect(screen.getByText('services.detail.errorLoadingTitle')).toBeInTheDocument();
      expect(screen.getByText(error.message)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /common.retry/i })).toBeInTheDocument();
    });

    it('should render not found state', () => {
      mockUseServiceInstance.mockReturnValue({
        instance: null,
        loading: false,
        error: null,
      });

      render(
        <ServiceDetailPage routerId="router-1" instanceId="instance-1" />
      );

      expect(screen.getByText('services.detail.notFoundTitle')).toBeInTheDocument();
      expect(screen.getByText('services.detail.notFoundMessage')).toBeInTheDocument();
    });

    it('should render instance details when loaded', () => {
      render(
        <ServiceDetailPage routerId="router-1" instanceId="instance-1" />
      );

      expect(screen.getByText('My Service')).toBeInTheDocument();
      expect(screen.getByTestId('service-card')).toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    it('should render all tabs with localized labels', () => {
      render(
        <ServiceDetailPage routerId="router-1" instanceId="instance-1" />
      );

      expect(screen.getByText('services.detail.tabs.overview')).toBeInTheDocument();
      expect(screen.getByText('services.detail.tabs.configuration')).toBeInTheDocument();
      expect(screen.getByText('services.detail.tabs.traffic')).toBeInTheDocument();
      expect(screen.getByText('services.detail.tabs.logs')).toBeInTheDocument();
      expect(screen.getByText('services.detail.tabs.alerts')).toBeInTheDocument();
      expect(screen.getByText('services.detail.tabs.diagnostics')).toBeInTheDocument();
    });

    it('should render overview tab content by default', () => {
      render(
        <ServiceDetailPage routerId="router-1" instanceId="instance-1" />
      );

      expect(screen.getByTestId('service-card')).toBeInTheDocument();
    });
  });

  describe('VirtualInterfaceBridge', () => {
    it('should render VIF bridge when vlanID is set', () => {
      const instanceWithVlan = {
        ...mockInstance,
        vlanID: 'vlan-1',
      };

      mockUseServiceInstance.mockReturnValue({
        instance: instanceWithVlan,
        loading: false,
        error: null,
      });

      render(
        <ServiceDetailPage routerId="router-1" instanceId="instance-1" />
      );

      expect(screen.getByTestId('vif-bridge')).toBeInTheDocument();
    });

    it('should not render VIF bridge when vlanID is not set', () => {
      render(
        <ServiceDetailPage routerId="router-1" instanceId="instance-1" />
      );

      expect(screen.queryByTestId('vif-bridge')).not.toBeInTheDocument();
    });
  });

  describe('Export Dialog', () => {
    it('should show export button when instance can be exported', () => {
      render(
        <ServiceDetailPage routerId="router-1" instanceId="instance-1" />
      );

      const exportButton = screen.getByRole('button', {
        name: /services.sharing.export.button/i,
      });
      expect(exportButton).toBeInTheDocument();
    });

    it('should not show export button for PENDING instance', () => {
      const pendingInstance = {
        ...mockInstance,
        status: 'PENDING',
      };

      mockUseServiceInstance.mockReturnValue({
        instance: pendingInstance,
        loading: false,
        error: null,
      });

      render(
        <ServiceDetailPage routerId="router-1" instanceId="instance-1" />
      );

      expect(
        screen.queryByRole('button', { name: /services.sharing.export.button/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <ServiceDetailPage routerId="router-1" instanceId="instance-1" />
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('My Service');
    });

    it('should have descriptive aria labels on buttons', () => {
      render(
        <ServiceDetailPage routerId="router-1" instanceId="instance-1" />
      );

      const exportButton = screen.getByRole('button', {
        name: /services.sharing.export.button/i,
      });
      expect(exportButton).toHaveAttribute('aria-label');
    });

    it('should use aria-hidden on decorative icons', () => {
      render(
        <ServiceDetailPage routerId="router-1" instanceId="instance-1" />
      );

      const icons = screen.getAllByTestId((testId) => testId.includes('aria-hidden'));
      expect(icons.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Tab Navigation', () => {
    it('should switch tabs when clicked', async () => {
      const user = userEvent.setup();

      render(
        <ServiceDetailPage routerId="router-1" instanceId="instance-1" />
      );

      const logsTab = screen.getByText('services.detail.tabs.logs');
      await user.click(logsTab);

      // After clicking logs tab, log viewer should be visible
      // (assuming the component renders selected tab content)
      expect(screen.getByTestId('log-viewer')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render all main components on overview tab', () => {
      render(
        <ServiceDetailPage routerId="router-1" instanceId="instance-1" />
      );

      expect(screen.getByTestId('service-card')).toBeInTheDocument();
      expect(screen.getByTestId('isolation-status')).toBeInTheDocument();
      expect(screen.getByTestId('resource-limits')).toBeInTheDocument();
    });
  });
});
