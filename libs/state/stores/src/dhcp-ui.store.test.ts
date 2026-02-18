/**
 * DHCP UI Store Tests
 * Tests for DHCP UI state management
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { useDHCPUIStore, type DHCPWizardDraft } from './dhcp-ui.store';

describe('useDHCPUIStore', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    // Reset store to initial state
    act(() => {
      useDHCPUIStore.getState().reset();
    });
  });

  describe('lease search', () => {
    it('should initialize with empty search', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      expect(result.current.leaseSearch).toBe('');
    });

    it('should update lease search', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      act(() => {
        result.current.setLeaseSearch('192.168.1');
      });

      expect(result.current.leaseSearch).toBe('192.168.1');
    });

    it('should clear lease search', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      act(() => {
        result.current.setLeaseSearch('test');
        result.current.setLeaseSearch('');
      });

      expect(result.current.leaseSearch).toBe('');
    });
  });

  describe('lease status filter', () => {
    it('should initialize with "all" filter', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      expect(result.current.leaseStatusFilter).toBe('all');
    });

    it('should update to "bound" filter', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      act(() => {
        result.current.setLeaseStatusFilter('bound');
      });

      expect(result.current.leaseStatusFilter).toBe('bound');
    });

    it('should update to "waiting" filter', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      act(() => {
        result.current.setLeaseStatusFilter('waiting');
      });

      expect(result.current.leaseStatusFilter).toBe('waiting');
    });

    it('should update to "static" filter', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      act(() => {
        result.current.setLeaseStatusFilter('static');
      });

      expect(result.current.leaseStatusFilter).toBe('static');
    });
  });

  describe('lease selection', () => {
    it('should initialize with empty selection', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      expect(result.current.selectedLeases).toEqual([]);
    });

    it('should add lease to selection', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      act(() => {
        result.current.toggleLeaseSelection('lease-1');
      });

      expect(result.current.selectedLeases).toEqual(['lease-1']);
    });

    it('should remove lease from selection when toggled twice', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      act(() => {
        result.current.toggleLeaseSelection('lease-1');
        result.current.toggleLeaseSelection('lease-1');
      });

      expect(result.current.selectedLeases).toEqual([]);
    });

    it('should select multiple leases', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      act(() => {
        result.current.toggleLeaseSelection('lease-1');
        result.current.toggleLeaseSelection('lease-2');
        result.current.toggleLeaseSelection('lease-3');
      });

      expect(result.current.selectedLeases).toEqual(['lease-1', 'lease-2', 'lease-3']);
    });

    it('should clear all selected leases', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      act(() => {
        result.current.toggleLeaseSelection('lease-1');
        result.current.toggleLeaseSelection('lease-2');
        result.current.clearLeaseSelection();
      });

      expect(result.current.selectedLeases).toEqual([]);
    });

    it('should select all leases at once', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      const leaseIds = ['lease-1', 'lease-2', 'lease-3', 'lease-4'];

      act(() => {
        result.current.selectAllLeases(leaseIds);
      });

      expect(result.current.selectedLeases).toEqual(leaseIds);
    });
  });

  describe('wizard draft', () => {
    it('should initialize with null draft', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      expect(result.current.wizardDraft).toBeNull();
    });

    it('should save wizard draft', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      const draft: DHCPWizardDraft = {
        interface: 'ether1',
        interfaceIP: '192.168.1.1/24',
        poolStart: '192.168.1.100',
        poolEnd: '192.168.1.254',
        gateway: '192.168.1.1',
        dnsServers: ['8.8.8.8', '8.8.4.4'],
        leaseTime: '1d',
      };

      act(() => {
        result.current.saveWizardDraft(draft);
      });

      expect(result.current.wizardDraft).toEqual(draft);
    });

    it('should update existing wizard draft', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      const initialDraft: DHCPWizardDraft = {
        interface: 'ether1',
        interfaceIP: '192.168.1.1/24',
      };

      const updatedDraft: DHCPWizardDraft = {
        ...initialDraft,
        poolStart: '192.168.1.100',
        poolEnd: '192.168.1.254',
      };

      act(() => {
        result.current.saveWizardDraft(initialDraft);
        result.current.saveWizardDraft(updatedDraft);
      });

      expect(result.current.wizardDraft).toEqual(updatedDraft);
    });

    it('should clear wizard draft', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      const draft: DHCPWizardDraft = {
        interface: 'ether1',
        poolStart: '192.168.1.100',
      };

      act(() => {
        result.current.saveWizardDraft(draft);
        result.current.clearWizardDraft();
      });

      expect(result.current.wizardDraft).toBeNull();
    });

    it('should persist wizard draft to localStorage', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      const draft: DHCPWizardDraft = {
        interface: 'ether1',
        poolStart: '192.168.1.100',
        poolEnd: '192.168.1.254',
      };

      act(() => {
        result.current.saveWizardDraft(draft);
      });

      // Check localStorage
      const storedData = localStorage.getItem('dhcp-ui-store');
      expect(storedData).toBeTruthy();

      const parsed = JSON.parse(storedData!);
      expect(parsed.state.wizardDraft).toEqual(draft);
    });

    it('should restore wizard draft from localStorage', () => {
      const draft: DHCPWizardDraft = {
        interface: 'ether2',
        gateway: '192.168.10.1',
      };

      // Manually set localStorage
      localStorage.setItem(
        'dhcp-ui-store',
        JSON.stringify({
          state: {
            wizardDraft: draft,
            showPoolVisualization: true,
          },
          version: 0,
        })
      );

      // Create new hook instance (simulating page reload)
      const { result } = renderHook(() => useDHCPUIStore());

      expect(result.current.wizardDraft).toEqual(draft);
    });
  });

  describe('pool visualization preference', () => {
    it('should initialize with pool visualization enabled', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      expect(result.current.showPoolVisualization).toBe(true);
    });

    it('should toggle pool visualization', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      act(() => {
        result.current.setShowPoolVisualization(false);
      });

      expect(result.current.showPoolVisualization).toBe(false);

      act(() => {
        result.current.setShowPoolVisualization(true);
      });

      expect(result.current.showPoolVisualization).toBe(true);
    });

    it('should persist pool visualization preference to localStorage', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      act(() => {
        result.current.setShowPoolVisualization(false);
      });

      const storedData = localStorage.getItem('dhcp-ui-store');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.showPoolVisualization).toBe(false);
    });
  });

  describe('reset functionality', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      // Set various state values
      act(() => {
        result.current.setLeaseSearch('test');
        result.current.setLeaseStatusFilter('bound');
        result.current.toggleLeaseSelection('lease-1');
        result.current.saveWizardDraft({ interface: 'ether1' });
        result.current.setShowPoolVisualization(false);
      });

      // Verify state was changed
      expect(result.current.leaseSearch).toBe('test');
      expect(result.current.leaseStatusFilter).toBe('bound');
      expect(result.current.selectedLeases).toHaveLength(1);
      expect(result.current.wizardDraft).not.toBeNull();
      expect(result.current.showPoolVisualization).toBe(false);

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify everything is back to initial state
      expect(result.current.leaseSearch).toBe('');
      expect(result.current.leaseStatusFilter).toBe('all');
      expect(result.current.selectedLeases).toEqual([]);
      expect(result.current.wizardDraft).toBeNull();
      expect(result.current.showPoolVisualization).toBe(true);
    });
  });

  describe('selector hooks', () => {
    it('should provide selector hooks for optimized access', () => {
      const { result: searchResult } = renderHook(() =>
        useDHCPUIStore((state) => state.leaseSearch)
      );
      const { result: filterResult } = renderHook(() =>
        useDHCPUIStore((state) => state.leaseStatusFilter)
      );
      const { result: selectionResult } = renderHook(() =>
        useDHCPUIStore((state) => state.selectedLeases)
      );

      expect(searchResult.current).toBe('');
      expect(filterResult.current).toBe('all');
      expect(selectionResult.current).toEqual([]);
    });
  });

  describe('persistence exclusions', () => {
    it('should NOT persist lease search to localStorage', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      act(() => {
        result.current.setLeaseSearch('test search');
      });

      const storedData = localStorage.getItem('dhcp-ui-store');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.leaseSearch).toBeUndefined();
    });

    it('should NOT persist lease status filter to localStorage', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      act(() => {
        result.current.setLeaseStatusFilter('bound');
      });

      const storedData = localStorage.getItem('dhcp-ui-store');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.leaseStatusFilter).toBeUndefined();
    });

    it('should NOT persist selected leases to localStorage', () => {
      const { result } = renderHook(() => useDHCPUIStore());

      act(() => {
        result.current.toggleLeaseSelection('lease-1');
      });

      const storedData = localStorage.getItem('dhcp-ui-store');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.selectedLeases).toBeUndefined();
    });
  });
});
