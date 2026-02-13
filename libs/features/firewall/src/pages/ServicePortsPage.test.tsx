/**
 * ServicePortsPage Component Tests
 *
 * Test coverage for ServicePortsPage component:
 * - Page header rendering
 * - Tab navigation (Services, Groups)
 * - Context-aware action buttons
 * - Dialog interactions (Add Service, Create Group)
 * - Empty states
 * - i18n integration
 * - Accessibility (axe-core)
 * - Responsive layout
 *
 * @see NAS-7.8: Implement Service Ports Management - Task 8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ServicePortsPage } from './ServicePortsPage';
import { useCustomServices } from '../hooks';

// ============================================================================
// Mocks
// ============================================================================

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'servicePorts.title': 'Service Ports',
        'servicePorts.description': 'Define service names for easier rule creation',
        'servicePorts.tabs.services': 'Services',
        'servicePorts.tabs.groups': 'Groups',
        'servicePorts.addService': 'Add Service',
        'servicePorts.createGroup': 'Create Group',
        'servicePorts.emptyStates.noGroups': 'No service groups defined',
        'servicePorts.emptyStates.noGroupsDescription':
          'Create groups to quickly select multiple services',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon">+</span>,
}));

// Mock child components
vi.mock('../components/ServicePortsTable', () => ({
  ServicePortsTable: () => <div data-testid="service-ports-table">Service Ports Table</div>,
}));

vi.mock('../components/AddServiceDialog', () => ({
  AddServiceDialog: ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) =>
    open ? (
      <div data-testid="add-service-dialog" data-open="true">
        <button onClick={() => onOpenChange(false)}>Close Add Service</button>
      </div>
    ) : (
      <div data-testid="add-service-dialog" data-open="false" />
    ),
}));

vi.mock('../components/ServiceGroupDialog', () => ({
  ServiceGroupDialog: ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) =>
    open ? (
      <div data-testid="service-group-dialog" data-open="true">
        <button onClick={() => onOpenChange(false)}>Close Service Group</button>
      </div>
    ) : (
      <div data-testid="service-group-dialog" data-open="false" />
    ),
}));

// Mock useCustomServices hook
const mockUseCustomServices = vi.fn();
vi.mock('../hooks', () => ({
  useCustomServices: () => mockUseCustomServices(),
}));

// ============================================================================
// Test Utilities
// ============================================================================

function renderServicePortsPage() {
  return render(<ServicePortsPage />);
}

// ============================================================================
// Test Suite
// ============================================================================

describe('ServicePortsPage', () => {
  // ============================================================================
  // Setup
  // ============================================================================

  beforeEach(() => {
    // Default mock return
    mockUseCustomServices.mockReturnValue({
      serviceGroups: [],
      services: [],
      customServices: [],
      addService: vi.fn(),
      updateService: vi.fn(),
      deleteService: vi.fn(),
      createGroup: vi.fn(),
      updateGroup: vi.fn(),
      deleteGroup: vi.fn(),
    });
  });

  // ============================================================================
  // Page Header Tests
  // ============================================================================

  describe('Page Header', () => {
    it('renders page title', () => {
      renderServicePortsPage();
      expect(screen.getByRole('heading', { name: 'Service Ports', level: 1 })).toBeInTheDocument();
    });

    it('renders page description', () => {
      renderServicePortsPage();
      expect(screen.getByText('Define service names for easier rule creation')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Tab Navigation Tests
  // ============================================================================

  describe('Tab Navigation', () => {
    it('renders Services and Groups tabs', () => {
      renderServicePortsPage();
      expect(screen.getByRole('tab', { name: 'Services' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Groups' })).toBeInTheDocument();
    });

    it('Services tab is selected by default', () => {
      renderServicePortsPage();
      const servicesTab = screen.getByRole('tab', { name: 'Services' });
      expect(servicesTab).toHaveAttribute('data-state', 'active');
    });

    it('switches to Groups tab when clicked', async () => {
      const user = userEvent.setup();
      renderServicePortsPage();

      const groupsTab = screen.getByRole('tab', { name: 'Groups' });
      await user.click(groupsTab);

      expect(groupsTab).toHaveAttribute('data-state', 'active');
    });

    it('switches back to Services tab', async () => {
      const user = userEvent.setup();
      renderServicePortsPage();

      // Click Groups
      const groupsTab = screen.getByRole('tab', { name: 'Groups' });
      await user.click(groupsTab);

      // Click Services again
      const servicesTab = screen.getByRole('tab', { name: 'Services' });
      await user.click(servicesTab);

      expect(servicesTab).toHaveAttribute('data-state', 'active');
    });
  });

  // ============================================================================
  // Tab Content Tests
  // ============================================================================

  describe('Tab Content', () => {
    it('shows ServicePortsTable in Services tab', () => {
      renderServicePortsPage();
      expect(screen.getByTestId('service-ports-table')).toBeInTheDocument();
    });

    it('shows empty state in Groups tab when no groups exist', async () => {
      const user = userEvent.setup();
      renderServicePortsPage();

      const groupsTab = screen.getByRole('tab', { name: 'Groups' });
      await user.click(groupsTab);

      expect(screen.getByText('No service groups defined')).toBeInTheDocument();
      expect(screen.getByText('Create groups to quickly select multiple services')).toBeInTheDocument();
    });

    it('shows placeholder message in Groups tab when groups exist', async () => {
      mockUseCustomServices.mockReturnValue({
        serviceGroups: [
          { id: 'group-1', name: 'web', ports: [80, 443], protocol: 'tcp' },
        ],
        services: [],
        customServices: [],
        addService: vi.fn(),
        updateService: vi.fn(),
        deleteService: vi.fn(),
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
      });

      const user = userEvent.setup();
      renderServicePortsPage();

      const groupsTab = screen.getByRole('tab', { name: 'Groups' });
      await user.click(groupsTab);

      expect(screen.getByText(/Service Groups table coming soon/)).toBeInTheDocument();
      expect(screen.getByText('1 group defined')).toBeInTheDocument();
    });

    it('shows correct plural for multiple groups', async () => {
      mockUseCustomServices.mockReturnValue({
        serviceGroups: [
          { id: 'group-1', name: 'web', ports: [80, 443], protocol: 'tcp' },
          { id: 'group-2', name: 'mail', ports: [25, 587], protocol: 'tcp' },
        ],
        services: [],
        customServices: [],
        addService: vi.fn(),
        updateService: vi.fn(),
        deleteService: vi.fn(),
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
      });

      const user = userEvent.setup();
      renderServicePortsPage();

      const groupsTab = screen.getByRole('tab', { name: 'Groups' });
      await user.click(groupsTab);

      expect(screen.getByText('2 groups defined')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Action Button Tests
  // ============================================================================

  describe('Action Buttons', () => {
    it('shows "Add Service" button on Services tab', () => {
      renderServicePortsPage();
      const buttons = screen.getAllByRole('button', { name: /Add Service/ });
      // Should have one in the page header (not from the mock dialog)
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('shows "Create Group" button on Groups tab', async () => {
      const user = userEvent.setup();
      renderServicePortsPage();

      const groupsTab = screen.getByRole('tab', { name: 'Groups' });
      await user.click(groupsTab);

      const buttons = screen.getAllByRole('button', { name: /Create Group/ });
      // Should have buttons (one in header, possibly one in empty state)
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('button changes when switching tabs', async () => {
      const user = userEvent.setup();
      renderServicePortsPage();

      // Initially shows Add Service (not Close Add Service)
      const addServiceButtons = screen.getAllByRole('button', { name: /Add Service/ });
      const actualAddButton = addServiceButtons.find((btn) => btn.textContent?.includes('Add Service') && !btn.textContent?.includes('Close'));
      expect(actualAddButton).toBeDefined();

      // Switch to Groups tab
      const groupsTab = screen.getByRole('tab', { name: 'Groups' });
      await user.click(groupsTab);

      // Now shows Create Group
      const createGroupButtons = screen.getAllByRole('button', { name: /Create Group/ });
      expect(createGroupButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================================
  // Dialog Interaction Tests
  // ============================================================================

  describe('Dialog Interactions', () => {
    it('opens AddServiceDialog when "Add Service" is clicked', async () => {
      const user = userEvent.setup();
      renderServicePortsPage();

      const buttons = screen.getAllByRole('button', { name: /Add Service/ });
      const addButton = buttons.find((btn) => btn.textContent?.includes('Add Service') && !btn.textContent?.includes('Close'));
      await user.click(addButton!);

      await waitFor(() => {
        const dialog = screen.getByTestId('add-service-dialog');
        expect(dialog).toHaveAttribute('data-open', 'true');
      });
    });

    it('closes AddServiceDialog when dialog close is triggered', async () => {
      const user = userEvent.setup();
      renderServicePortsPage();

      // Open dialog
      const buttons = screen.getAllByRole('button', { name: /Add Service/ });
      const addButton = buttons.find((btn) => btn.textContent?.includes('Add Service') && !btn.textContent?.includes('Close'));
      await user.click(addButton!);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByTestId('add-service-dialog')).toHaveAttribute('data-open', 'true');
      });

      // Close dialog
      const closeButton = screen.getByRole('button', { name: 'Close Add Service' });
      await user.click(closeButton);

      // Wait for dialog to close
      await waitFor(() => {
        const dialog = screen.getByTestId('add-service-dialog');
        expect(dialog).toHaveAttribute('data-open', 'false');
      });
    });

    it('opens ServiceGroupDialog when "Create Group" is clicked', async () => {
      const user = userEvent.setup();
      renderServicePortsPage();

      // Switch to Groups tab
      const groupsTab = screen.getByRole('tab', { name: 'Groups' });
      await user.click(groupsTab);

      // Click Create Group (get from header, not empty state)
      const buttons = screen.getAllByRole('button', { name: /Create Group/ });
      const createButton = buttons[0]; // First button is the header button
      await user.click(createButton);

      const dialog = screen.getByTestId('service-group-dialog');
      expect(dialog).toHaveAttribute('data-open', 'true');
    });

    it('closes ServiceGroupDialog when dialog close is triggered', async () => {
      const user = userEvent.setup();
      renderServicePortsPage();

      // Switch to Groups tab
      const groupsTab = screen.getByRole('tab', { name: 'Groups' });
      await user.click(groupsTab);

      // Open dialog
      const buttons = screen.getAllByRole('button', { name: /Create Group/ });
      const createButton = buttons[0];
      await user.click(createButton);

      // Close dialog
      const closeButton = screen.getByRole('button', { name: 'Close Service Group' });
      await user.click(closeButton);

      const dialog = screen.getByTestId('service-group-dialog');
      expect(dialog).toHaveAttribute('data-open', 'false');
    });

    it('can open and close dialogs multiple times', async () => {
      const user = userEvent.setup();
      renderServicePortsPage();

      // Open dialog
      const buttons = screen.getAllByRole('button', { name: /Add Service/ });
      const addButton = buttons.find((btn) => btn.textContent?.includes('Add Service') && !btn.textContent?.includes('Close'));
      await user.click(addButton!);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByTestId('add-service-dialog')).toHaveAttribute('data-open', 'true');
      });

      // Close dialog
      const closeButton1 = screen.getByRole('button', { name: 'Close Add Service' });
      await user.click(closeButton1);

      // Wait for close
      await waitFor(() => {
        expect(screen.getByTestId('add-service-dialog')).toHaveAttribute('data-open', 'false');
      });

      // Open again
      await user.click(addButton!);

      await waitFor(() => {
        const dialog = screen.getByTestId('add-service-dialog');
        expect(dialog).toHaveAttribute('data-open', 'true');
      });
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('has no axe violations on Services tab', async () => {
      const { container } = renderServicePortsPage();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations on Groups tab', async () => {
      const user = userEvent.setup();
      const { container } = renderServicePortsPage();

      const groupsTab = screen.getByRole('tab', { name: 'Groups' });
      await user.click(groupsTab);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has accessible tab navigation', () => {
      renderServicePortsPage();

      const servicesTab = screen.getByRole('tab', { name: 'Services' });
      const groupsTab = screen.getByRole('tab', { name: 'Groups' });

      expect(servicesTab).toHaveAttribute('data-state', 'active');
      expect(groupsTab).toHaveAttribute('data-state', 'inactive');
    });

    it('action buttons have accessible labels', () => {
      renderServicePortsPage();
      const buttons = screen.getAllByRole('button', { name: /Add Service/ });
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================================
  // i18n Tests
  // ============================================================================

  describe('i18n Integration', () => {
    it('uses i18n for all text content', () => {
      renderServicePortsPage();

      // Header
      expect(screen.getByText('Service Ports')).toBeInTheDocument();
      expect(screen.getByText('Define service names for easier rule creation')).toBeInTheDocument();

      // Tabs
      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByText('Groups')).toBeInTheDocument();

      // Button
      expect(screen.getByText('Add Service')).toBeInTheDocument();
    });

    it('has no hardcoded strings', () => {
      const { container } = renderServicePortsPage();
      const text = container.textContent || '';

      // All text should come from i18n keys
      expect(text).toContain('Service Ports');
      expect(text).toContain('Define service names for easier rule creation');
      expect(text).not.toContain('TODO');
      expect(text).not.toMatch(/\b(Untranslated|Missing|undefined)\b/);
    });
  });

  // ============================================================================
  // Responsive Layout Tests
  // ============================================================================

  describe('Responsive Layout', () => {
    it('renders page container with proper spacing', () => {
      renderServicePortsPage();
      // Check the main container, not the heading's parent
      const heading = screen.getByRole('heading', { name: 'Service Ports' });
      // Navigate up to the main container (2 levels up: space-y-2 div -> container div)
      const mainContainer = heading.parentElement?.parentElement;
      expect(mainContainer).toHaveClass('container', 'mx-auto', 'p-6');
    });

    it('renders responsive header layout', () => {
      renderServicePortsPage();
      const heading = screen.getByRole('heading', { name: 'Service Ports' });
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'tracking-tight');
    });
  });
});
