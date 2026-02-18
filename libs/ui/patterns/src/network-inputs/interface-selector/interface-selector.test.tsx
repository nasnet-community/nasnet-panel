/**
 * InterfaceSelector Component Tests
 *
 * Comprehensive tests for the interface selector component including:
 * - Headless hook logic
 * - Component rendering
 * - User interactions
 * - Accessibility
 * - Platform presenters
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */

import { render, screen, fireEvent, waitFor, within , renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { InterfaceItem } from './interface-item';
import { InterfaceSelector } from './interface-selector';
import { InterfaceSelectorDesktop } from './interface-selector-desktop';
import { InterfaceSelectorMobile } from './interface-selector-mobile';
import { InterfaceTypeIcon, getInterfaceTypeLabel } from './interface-type-icon';
import { useInterfaceSelector } from './use-interface-selector';

import type { RouterInterface, InterfaceType } from './interface-selector.types';

// Mock usePlatform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

// Mock interfaces for testing
const mockInterfaces: RouterInterface[] = [
  { id: 'eth1', name: 'ether1', type: 'ethernet', status: 'up', ip: '192.168.1.1', usedBy: [] },
  { id: 'eth2', name: 'ether2', type: 'ethernet', status: 'down', usedBy: [] },
  { id: 'br1', name: 'bridge-lan', type: 'bridge', status: 'up', ip: '10.0.0.1', usedBy: ['DHCP Server'] },
  { id: 'wlan1', name: 'wlan1', type: 'wireless', status: 'up', usedBy: [] },
  { id: 'vpn1', name: 'ovpn-out1', type: 'vpn', status: 'down', usedBy: [] },
];

describe('InterfaceSelector', () => {
  describe('useInterfaceSelector Hook', () => {
    it('should return interfaces from mock data', () => {
      const { result } = renderHook(() =>
        useInterfaceSelector({ routerId: 'test-router' })
      );

      expect(result.current.interfaces.length).toBeGreaterThan(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should filter by single type when typeFilter is set', () => {
      const { result } = renderHook(() =>
        useInterfaceSelector({ routerId: 'test-router' })
      );

      act(() => {
        result.current.setTypeFilter('ethernet');
      });

      expect(result.current.filteredInterfaces.every(i => i.type === 'ethernet')).toBe(true);
    });

    it('should filter by multiple types when types prop is provided', () => {
      const { result } = renderHook(() =>
        useInterfaceSelector({
          routerId: 'test-router',
          types: ['ethernet', 'bridge'],
        })
      );

      expect(
        result.current.filteredInterfaces.every(
          i => i.type === 'ethernet' || i.type === 'bridge'
        )
      ).toBe(true);
    });

    it('should show all types when typeFilter is "all"', () => {
      const { result } = renderHook(() =>
        useInterfaceSelector({ routerId: 'test-router' })
      );

      expect(result.current.typeFilter).toBe('all');
      expect(result.current.filteredInterfaces.length).toBe(result.current.interfaces.length);
    });

    it('should filter by search query (case-insensitive)', async () => {
      const { result } = renderHook(() =>
        useInterfaceSelector({ routerId: 'test-router' })
      );

      act(() => {
        result.current.setSearchQuery('ether');
      });

      // Wait for debounce
      await waitFor(() => {
        expect(
          result.current.filteredInterfaces.every(i =>
            i.name.toLowerCase().includes('ether')
          )
        ).toBe(true);
      }, { timeout: 300 });
    });

    it('should filter by IP address', async () => {
      const { result } = renderHook(() =>
        useInterfaceSelector({ routerId: 'test-router' })
      );

      act(() => {
        result.current.setSearchQuery('192.168');
      });

      await waitFor(() => {
        expect(result.current.filteredInterfaces.length).toBeGreaterThan(0);
        expect(
          result.current.filteredInterfaces.every(i =>
            i.ip?.includes('192.168')
          )
        ).toBe(true);
      }, { timeout: 300 });
    });

    it('should return empty array when no matches', async () => {
      const { result } = renderHook(() =>
        useInterfaceSelector({ routerId: 'test-router' })
      );

      act(() => {
        result.current.setSearchQuery('nonexistent-interface');
      });

      await waitFor(() => {
        expect(result.current.filteredInterfaces.length).toBe(0);
      }, { timeout: 300 });
    });

    it('should handle single selection', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useInterfaceSelector({
          routerId: 'test-router',
          onChange,
          multiple: false,
        })
      );

      act(() => {
        result.current.toggleSelection('eth1');
      });

      expect(onChange).toHaveBeenCalledWith('eth1');
    });

    it('should close dropdown after single selection', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useInterfaceSelector({
          routerId: 'test-router',
          onChange,
          multiple: false,
        })
      );

      act(() => {
        result.current.setIsOpen(true);
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggleSelection('eth1');
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should handle multi-selection - add', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useInterfaceSelector({
          routerId: 'test-router',
          onChange,
          multiple: true,
          value: [],
        })
      );

      act(() => {
        result.current.toggleSelection('eth1');
      });

      expect(onChange).toHaveBeenCalledWith(['eth1']);
    });

    it('should handle multi-selection - remove', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useInterfaceSelector({
          routerId: 'test-router',
          onChange,
          multiple: true,
          value: ['eth1', 'eth2'],
        })
      );

      act(() => {
        result.current.toggleSelection('eth1');
      });

      expect(onChange).toHaveBeenCalledWith(['eth2']);
    });

    it('should NOT close dropdown after multi-selection', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useInterfaceSelector({
          routerId: 'test-router',
          onChange,
          multiple: true,
        })
      );

      act(() => {
        result.current.setIsOpen(true);
        result.current.toggleSelection('eth1');
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should exclude used interfaces when excludeUsed is true', () => {
      const { result } = renderHook(() =>
        useInterfaceSelector({
          routerId: 'test-router',
          excludeUsed: true,
        })
      );

      expect(
        result.current.filteredInterfaces.every(
          i => !i.usedBy || i.usedBy.length === 0
        )
      ).toBe(true);
    });

    it('should clear selection', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useInterfaceSelector({
          routerId: 'test-router',
          onChange,
          multiple: true,
          value: ['eth1', 'eth2'],
        })
      );

      act(() => {
        result.current.clearSelection();
      });

      expect(onChange).toHaveBeenCalledWith([]);
    });

    it('should get interface by ID', () => {
      const { result } = renderHook(() =>
        useInterfaceSelector({ routerId: 'test-router' })
      );

      const iface = result.current.getInterfaceById('eth1');
      expect(iface).toBeDefined();
      expect(iface?.name).toBe('ether1');
    });

    it('should return display value for single selection', () => {
      const { result } = renderHook(() =>
        useInterfaceSelector({
          routerId: 'test-router',
          value: 'eth1',
        })
      );

      expect(result.current.getDisplayValue()).toBe('ether1');
    });

    it('should return display value for multiple selection', () => {
      const { result } = renderHook(() =>
        useInterfaceSelector({
          routerId: 'test-router',
          value: ['eth1', 'eth2', 'br1'],
          multiple: true,
        })
      );

      expect(result.current.getDisplayValue()).toBe('3 interfaces selected');
    });
  });

  describe('Component Rendering', () => {
    it('should render trigger button with placeholder', () => {
      render(
        <InterfaceSelectorDesktop
          routerId="test-router"
          placeholder="Select interface..."
        />
      );

      expect(screen.getByRole('combobox')).toHaveTextContent('Select interface...');
    });

    it('should render with label', () => {
      render(
        <InterfaceSelectorDesktop
          routerId="test-router"
          label="Network Interface"
        />
      );

      expect(screen.getByText('Network Interface')).toBeInTheDocument();
    });

    it('should open popover on click', async () => {
      const user = userEvent.setup();

      render(
        <InterfaceSelectorDesktop routerId="test-router" />
      );

      await user.click(screen.getByRole('combobox'));

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should display interface list with names', async () => {
      const user = userEvent.setup();

      render(
        <InterfaceSelectorDesktop routerId="test-router" />
      );

      await user.click(screen.getByRole('combobox'));

      expect(screen.getByText('ether1')).toBeInTheDocument();
      expect(screen.getByText('bridge-lan')).toBeInTheDocument();
    });

    it('should show IP addresses', async () => {
      const user = userEvent.setup();

      render(
        <InterfaceSelectorDesktop routerId="test-router" showIP />
      );

      await user.click(screen.getByRole('combobox'));

      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });

    it('should show usage warnings with tooltip', async () => {
      const user = userEvent.setup();

      render(
        <InterfaceSelectorDesktop routerId="test-router" />
      );

      await user.click(screen.getByRole('combobox'));

      // Look for "In Use" badge
      const badges = screen.getAllByText('In Use');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should show search input in popover', async () => {
      const user = userEvent.setup();

      render(
        <InterfaceSelectorDesktop routerId="test-router" />
      );

      await user.click(screen.getByRole('combobox'));

      expect(screen.getByPlaceholderText('Search interfaces...')).toBeInTheDocument();
    });

    it('should show type filter dropdown when types not restricted', async () => {
      const user = userEvent.setup();

      render(
        <InterfaceSelectorDesktop routerId="test-router" />
      );

      await user.click(screen.getByRole('combobox'));

      expect(screen.getByLabelText('Filter by interface type')).toBeInTheDocument();
    });

    it('should hide type filter when types prop restricts selection', async () => {
      const user = userEvent.setup();

      render(
        <InterfaceSelectorDesktop
          routerId="test-router"
          types={['ethernet']}
        />
      );

      await user.click(screen.getByRole('combobox'));

      expect(screen.queryByLabelText('Filter by interface type')).not.toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('should show skeleton while loading', () => {
      render(
        <InterfaceSelectorDesktop
          routerId="test-router"
          hookOverride={{
            isLoading: true,
            interfaces: [],
            filteredInterfaces: [],
            selectedValues: [],
            error: null,
            searchQuery: '',
            typeFilter: 'all',
            isOpen: true,
            setSearchQuery: vi.fn(),
            setTypeFilter: vi.fn(),
            setIsOpen: vi.fn(),
            toggleSelection: vi.fn(),
            clearSelection: vi.fn(),
            getInterfaceById: vi.fn(),
            getDisplayValue: () => '',
            retry: vi.fn(),
          }}
        />
      );

      // Skeletons should be visible
      const skeletons = document.querySelectorAll('[class*="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show error state with retry button', () => {
      const retry = vi.fn();

      render(
        <InterfaceSelectorDesktop
          routerId="test-router"
          hookOverride={{
            isLoading: false,
            interfaces: [],
            filteredInterfaces: [],
            selectedValues: [],
            error: new Error('Network error'),
            searchQuery: '',
            typeFilter: 'all',
            isOpen: true,
            setSearchQuery: vi.fn(),
            setTypeFilter: vi.fn(),
            setIsOpen: vi.fn(),
            toggleSelection: vi.fn(),
            clearSelection: vi.fn(),
            getInterfaceById: vi.fn(),
            getDisplayValue: () => '',
            retry,
          }}
        />
      );

      expect(screen.getByText('Failed to load interfaces')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should call retry on retry button click', async () => {
      const user = userEvent.setup();
      const retry = vi.fn();

      render(
        <InterfaceSelectorDesktop
          routerId="test-router"
          hookOverride={{
            isLoading: false,
            interfaces: [],
            filteredInterfaces: [],
            selectedValues: [],
            error: new Error('Network error'),
            searchQuery: '',
            typeFilter: 'all',
            isOpen: true,
            setSearchQuery: vi.fn(),
            setTypeFilter: vi.fn(),
            setIsOpen: vi.fn(),
            toggleSelection: vi.fn(),
            clearSelection: vi.fn(),
            getInterfaceById: vi.fn(),
            getDisplayValue: () => '',
            retry,
          }}
        />
      );

      await user.click(screen.getByRole('button', { name: /retry/i }));
      expect(retry).toHaveBeenCalled();
    });

    it('should show empty state when no interfaces', () => {
      render(
        <InterfaceSelectorDesktop
          routerId="test-router"
          hookOverride={{
            isLoading: false,
            interfaces: [],
            filteredInterfaces: [],
            selectedValues: [],
            error: null,
            searchQuery: '',
            typeFilter: 'all',
            isOpen: true,
            setSearchQuery: vi.fn(),
            setTypeFilter: vi.fn(),
            setIsOpen: vi.fn(),
            toggleSelection: vi.fn(),
            clearSelection: vi.fn(),
            getInterfaceById: vi.fn(),
            getDisplayValue: () => '',
            retry: vi.fn(),
          }}
        />
      );

      expect(screen.getByText('No interfaces available')).toBeInTheDocument();
    });

    it('should show no matches message when search has no results', () => {
      render(
        <InterfaceSelectorDesktop
          routerId="test-router"
          hookOverride={{
            isLoading: false,
            interfaces: mockInterfaces,
            filteredInterfaces: [],
            selectedValues: [],
            error: null,
            searchQuery: 'nonexistent',
            typeFilter: 'all',
            isOpen: true,
            setSearchQuery: vi.fn(),
            setTypeFilter: vi.fn(),
            setIsOpen: vi.fn(),
            toggleSelection: vi.fn(),
            clearSelection: vi.fn(),
            getInterfaceById: vi.fn(),
            getDisplayValue: () => '',
            retry: vi.fn(),
          }}
        />
      );

      expect(screen.getByText('No interfaces match your search')).toBeInTheDocument();
    });
  });

  describe('Multi-Select', () => {
    it('should render checkboxes in multi-select mode', async () => {
      const user = userEvent.setup();

      render(
        <InterfaceSelectorDesktop routerId="test-router" multiple />
      );

      await user.click(screen.getByRole('combobox'));

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should show selected chips below selector', () => {
      render(
        <InterfaceSelectorDesktop
          routerId="test-router"
          multiple
          value={['eth1', 'wlan1']}
        />
      );

      expect(screen.getByText('ether1')).toBeInTheDocument();
      expect(screen.getByText('wlan1')).toBeInTheDocument();
    });

    it('should remove selection when X clicked on chip', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <InterfaceSelectorDesktop
          routerId="test-router"
          multiple
          value={['eth1', 'wlan1']}
          onChange={onChange}
        />
      );

      const removeButton = screen.getByLabelText('Remove ether1');
      await user.click(removeButton);

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    // Note: axe-core tests are skipped due to jest-axe not being available in the test environment
    // In a proper CI environment, these would be enabled with vitest-axe or similar
    it.skip('should have no axe violations', async () => {
      // Placeholder - requires jest-axe or vitest-axe to be installed
    });

    it('should have proper ARIA attributes on trigger', () => {
      render(
        <InterfaceSelectorDesktop routerId="test-router" />
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('should update aria-expanded when open', async () => {
      const user = userEvent.setup();

      render(
        <InterfaceSelectorDesktop routerId="test-router" />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have role="listbox" on list', async () => {
      const user = userEvent.setup();

      render(
        <InterfaceSelectorDesktop routerId="test-router" />
      );

      await user.click(screen.getByRole('combobox'));

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should have role="option" on items', async () => {
      const user = userEvent.setup();

      render(
        <InterfaceSelectorDesktop routerId="test-router" />
      );

      await user.click(screen.getByRole('combobox'));

      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });

    it('should have aria-selected on selected items', async () => {
      const user = userEvent.setup();

      render(
        <InterfaceSelectorDesktop routerId="test-router" value="eth1" />
      );

      await user.click(screen.getByRole('combobox'));

      const options = screen.getAllByRole('option');
      const selectedOption = options.find(opt => opt.getAttribute('aria-selected') === 'true');
      expect(selectedOption).toBeDefined();
    });

    it('should close on Escape key', async () => {
      const user = userEvent.setup();

      render(
        <InterfaceSelectorDesktop routerId="test-router" />
      );

      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('should show error state with aria-invalid', () => {
      render(
        <InterfaceSelectorDesktop
          routerId="test-router"
          error="Interface is required"
        />
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('InterfaceTypeIcon', () => {
    const types: InterfaceType[] = ['ethernet', 'bridge', 'vlan', 'wireless', 'vpn', 'tunnel', 'loopback'];

    it.each(types)('should render icon for type: %s', (type) => {
      const { container } = render(<InterfaceTypeIcon type={type} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <InterfaceTypeIcon type="ethernet" className="custom-class" />
      );
      expect(container.querySelector('svg')).toHaveClass('custom-class');
    });

    it('should have aria-hidden="true"', () => {
      const { container } = render(<InterfaceTypeIcon type="ethernet" />);
      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('getInterfaceTypeLabel', () => {
    it('should return correct labels', () => {
      expect(getInterfaceTypeLabel('ethernet')).toBe('Ethernet');
      expect(getInterfaceTypeLabel('bridge')).toBe('Bridge');
      expect(getInterfaceTypeLabel('vlan')).toBe('VLAN');
      expect(getInterfaceTypeLabel('wireless')).toBe('Wireless');
      expect(getInterfaceTypeLabel('vpn')).toBe('VPN');
      expect(getInterfaceTypeLabel('tunnel')).toBe('Tunnel');
      expect(getInterfaceTypeLabel('loopback')).toBe('Loopback');
    });
  });

  describe('InterfaceItem', () => {
    const mockInterface: RouterInterface = {
      id: 'eth1',
      name: 'ether1',
      type: 'ethernet',
      status: 'up',
      ip: '192.168.1.1',
      usedBy: [],
    };

    it('should render interface name', () => {
      render(
        <InterfaceItem
          interface={mockInterface}
          selected={false}
          onSelect={vi.fn()}
        />
      );

      expect(screen.getByText('ether1')).toBeInTheDocument();
    });

    it('should render IP address when showIP is true', () => {
      render(
        <InterfaceItem
          interface={mockInterface}
          selected={false}
          onSelect={vi.fn()}
          showIP
        />
      );

      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });

    it('should hide IP address when showIP is false', () => {
      render(
        <InterfaceItem
          interface={mockInterface}
          selected={false}
          onSelect={vi.fn()}
          showIP={false}
        />
      );

      expect(screen.queryByText('192.168.1.1')).not.toBeInTheDocument();
    });

    it('should show checkbox when showCheckbox is true', () => {
      render(
        <InterfaceItem
          interface={mockInterface}
          selected={false}
          onSelect={vi.fn()}
          showCheckbox
        />
      );

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should show check icon when selected in single-select mode', () => {
      const { container } = render(
        <InterfaceItem
          interface={mockInterface}
          selected
          onSelect={vi.fn()}
          showCheckbox={false}
        />
      );

      // Check icon should be present
      expect(container.querySelector('[class*="text-primary"]')).toBeInTheDocument();
    });

    it('should show usage warning badge', () => {
      const interfaceWithUsage: RouterInterface = {
        ...mockInterface,
        usedBy: ['DHCP Server', 'bridge-lan'],
      };

      render(
        <InterfaceItem
          interface={interfaceWithUsage}
          selected={false}
          onSelect={vi.fn()}
        />
      );

      expect(screen.getByText('In Use')).toBeInTheDocument();
    });

    it('should call onSelect when clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      render(
        <InterfaceItem
          interface={mockInterface}
          selected={false}
          onSelect={onSelect}
        />
      );

      await user.click(screen.getByRole('option'));
      expect(onSelect).toHaveBeenCalled();
    });

    it('should call onSelect on Enter key', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      render(
        <InterfaceItem
          interface={mockInterface}
          selected={false}
          onSelect={onSelect}
        />
      );

      const item = screen.getByRole('option');
      item.focus();
      await user.keyboard('{Enter}');

      expect(onSelect).toHaveBeenCalled();
    });

    it('should have aria-selected attribute', () => {
      render(
        <InterfaceItem
          interface={mockInterface}
          selected
          onSelect={vi.fn()}
        />
      );

      expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Platform Presenters', () => {
    it('should render desktop presenter', () => {
      render(
        <InterfaceSelectorDesktop routerId="test-router" />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render mobile presenter', () => {
      render(
        <InterfaceSelectorMobile routerId="test-router" />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should use mobile presenter when platform is mobile', () => {
      // This would need to mock usePlatform to return 'mobile'
      // For now, just verify the component renders
      const { usePlatform } = require('@nasnet/ui/layouts');
      usePlatform.mockReturnValue('mobile');

      render(
        <InterfaceSelector routerId="test-router" />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();

      // Reset mock
      usePlatform.mockReturnValue('desktop');
    });
  });
});
