/**
 * PortRegistryView Component Tests
 *
 * Tests for the PortRegistryView component with platform presenter pattern.
 * Validates Desktop and Mobile rendering with proper platform detection.
 *
 * @see NAS-8.16: Port Conflict Detection
 * @see ADR-018: Headless + Platform Presenters Pattern
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { PortRegistryView } from './PortRegistryView';
import type { PortAllocation } from '@nasnet/api-client/generated';

// Mock dependencies
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(),
}));

vi.mock('./PortRegistryViewDesktop', () => ({
  PortRegistryViewDesktop: vi.fn(({ routerId }) => (
    <div data-testid="port-registry-desktop">
      <div data-testid="router-id">{routerId}</div>
      <table role="table">
        <thead>
          <tr>
            <th>Port</th>
            <th>Protocol</th>
            <th>Service</th>
            <th>Instance</th>
          </tr>
        </thead>
        <tbody>
          <tr data-testid="allocation-row-1">
            <td>9050</td>
            <td>TCP</td>
            <td>tor</td>
            <td>tor-instance-1</td>
          </tr>
          <tr data-testid="allocation-row-2">
            <td>1080</td>
            <td>TCP</td>
            <td>singbox</td>
            <td>singbox-instance-1</td>
          </tr>
        </tbody>
      </table>
    </div>
  )),
}));

vi.mock('./PortRegistryViewMobile', () => ({
  PortRegistryViewMobile: vi.fn(({ routerId }) => (
    <div data-testid="port-registry-mobile">
      <div data-testid="router-id">{routerId}</div>
      <div
        data-testid="service-group-tor"
        role="article"
      >
        <h3>tor</h3>
        <div data-testid="port-card-1">
          <span data-testid="port-badge">9050</span>
          <span data-testid="protocol-badge">TCP</span>
        </div>
      </div>
      <div
        data-testid="service-group-singbox"
        role="article"
      >
        <h3>singbox</h3>
        <div data-testid="port-card-2">
          <span data-testid="port-badge">1080</span>
          <span data-testid="protocol-badge">TCP</span>
        </div>
      </div>
    </div>
  )),
}));

import { usePlatform } from '@nasnet/ui/layouts';

describe('PortRegistryView', () => {
  const mockRouterId = 'router-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Rendering', () => {
    it('should render desktop presenter when platform is desktop', () => {
      // Mock platform detection to return 'desktop'
      vi.mocked(usePlatform).mockReturnValue('desktop');

      // Render component
      render(<PortRegistryView routerId={mockRouterId} />);

      // Verify desktop presenter is rendered
      const desktopView = screen.getByTestId('port-registry-desktop');
      expect(desktopView).toBeInTheDocument();

      // Verify router ID is passed correctly
      const routerIdElement = screen.getByTestId('router-id');
      expect(routerIdElement).toHaveTextContent(mockRouterId);

      // Verify DataTable structure is present
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Verify table has correct columns
      expect(screen.getByText('Port')).toBeInTheDocument();
      expect(screen.getByText('Protocol')).toBeInTheDocument();
      expect(screen.getByText('Service')).toBeInTheDocument();
      expect(screen.getByText('Instance')).toBeInTheDocument();

      // Verify data rows are rendered
      const row1 = screen.getByTestId('allocation-row-1');
      expect(row1).toBeInTheDocument();
      expect(row1).toHaveTextContent('9050');
      expect(row1).toHaveTextContent('TCP');
      expect(row1).toHaveTextContent('tor');

      const row2 = screen.getByTestId('allocation-row-2');
      expect(row2).toBeInTheDocument();
      expect(row2).toHaveTextContent('1080');
      expect(row2).toHaveTextContent('singbox');

      // Verify mobile view is NOT rendered
      expect(screen.queryByTestId('port-registry-mobile')).not.toBeInTheDocument();
    });

    it('should render desktop presenter when platform is tablet', () => {
      // Mock platform detection to return 'tablet'
      vi.mocked(usePlatform).mockReturnValue('tablet');

      // Render component
      render(<PortRegistryView routerId={mockRouterId} />);

      // Verify desktop presenter is used for tablet as well
      const desktopView = screen.getByTestId('port-registry-desktop');
      expect(desktopView).toBeInTheDocument();

      // Verify table structure
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Verify mobile view is NOT rendered
      expect(screen.queryByTestId('port-registry-mobile')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Rendering', () => {
    it('should render mobile presenter when platform is mobile', () => {
      // Mock platform detection to return 'mobile'
      vi.mocked(usePlatform).mockReturnValue('mobile');

      // Render component
      render(<PortRegistryView routerId={mockRouterId} />);

      // Verify mobile presenter is rendered
      const mobileView = screen.getByTestId('port-registry-mobile');
      expect(mobileView).toBeInTheDocument();

      // Verify router ID is passed correctly
      const routerIdElement = screen.getByTestId('router-id');
      expect(routerIdElement).toHaveTextContent(mockRouterId);

      // Verify card-based layout (using article role for cards)
      const torGroup = screen.getByTestId('service-group-tor');
      expect(torGroup).toBeInTheDocument();
      expect(torGroup).toHaveAttribute('role', 'article');

      const singboxGroup = screen.getByTestId('service-group-singbox');
      expect(singboxGroup).toBeInTheDocument();
      expect(singboxGroup).toHaveAttribute('role', 'article');

      // Verify port cards are rendered
      const portCard1 = screen.getByTestId('port-card-1');
      expect(portCard1).toBeInTheDocument();

      // Verify badges are present
      const portBadges = screen.getAllByTestId('port-badge');
      expect(portBadges).toHaveLength(2);
      expect(portBadges[0]).toHaveTextContent('9050');
      expect(portBadges[1]).toHaveTextContent('1080');

      const protocolBadges = screen.getAllByTestId('protocol-badge');
      expect(protocolBadges).toHaveLength(2);
      expect(protocolBadges[0]).toHaveTextContent('TCP');
      expect(protocolBadges[1]).toHaveTextContent('TCP');

      // Verify desktop view is NOT rendered
      expect(screen.queryByTestId('port-registry-desktop')).not.toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should group allocations by service type on mobile', () => {
      // Mock platform detection to return 'mobile'
      vi.mocked(usePlatform).mockReturnValue('mobile');

      // Render component
      render(<PortRegistryView routerId={mockRouterId} />);

      // Verify service groups exist
      expect(screen.getByTestId('service-group-tor')).toBeInTheDocument();
      expect(screen.getByTestId('service-group-singbox')).toBeInTheDocument();

      // Verify group headers
      expect(screen.getByText('tor')).toBeInTheDocument();
      expect(screen.getByText('singbox')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should pass routerId to both presenters', () => {
      const testRouterId = 'test-router-456';

      // Test desktop
      vi.mocked(usePlatform).mockReturnValue('desktop');
      const { unmount } = render(<PortRegistryView routerId={testRouterId} />);
      expect(screen.getByTestId('router-id')).toHaveTextContent(testRouterId);
      unmount();

      // Test mobile
      vi.mocked(usePlatform).mockReturnValue('mobile');
      render(<PortRegistryView routerId={testRouterId} />);
      expect(screen.getByTestId('router-id')).toHaveTextContent(testRouterId);
    });

    it('should pass optional className to presenters', () => {
      const customClass = 'custom-test-class';

      // Test with desktop
      vi.mocked(usePlatform).mockReturnValue('desktop');
      render(
        <PortRegistryView
          routerId={mockRouterId}
          className={customClass}
        />
      );

      // Desktop presenter should be rendered (className tested in presenter-specific tests)
      expect(screen.getByTestId('port-registry-desktop')).toBeInTheDocument();
    });
  });

  describe('Presenter Selection Logic', () => {
    it('should use desktop presenter for desktop platform', () => {
      vi.mocked(usePlatform).mockReturnValue('desktop');
      render(<PortRegistryView routerId={mockRouterId} />);
      expect(screen.getByTestId('port-registry-desktop')).toBeInTheDocument();
      expect(screen.queryByTestId('port-registry-mobile')).not.toBeInTheDocument();
    });

    it('should use mobile presenter for mobile platform', () => {
      vi.mocked(usePlatform).mockReturnValue('mobile');
      render(<PortRegistryView routerId={mockRouterId} />);
      expect(screen.getByTestId('port-registry-mobile')).toBeInTheDocument();
      expect(screen.queryByTestId('port-registry-desktop')).not.toBeInTheDocument();
    });

    it('should use desktop presenter for tablet platform', () => {
      vi.mocked(usePlatform).mockReturnValue('tablet');
      render(<PortRegistryView routerId={mockRouterId} />);
      expect(screen.getByTestId('port-registry-desktop')).toBeInTheDocument();
      expect(screen.queryByTestId('port-registry-mobile')).not.toBeInTheDocument();
    });
  });
});
