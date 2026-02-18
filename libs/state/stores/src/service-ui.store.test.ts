/**
 * Service UI Store Tests
 * Tests for Service Instance Management UI state
 *
 * Story: Service Instance Manager - Frontend State Management
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { useServiceUIStore, type ServiceInstallWizardDraft } from './service-ui.store';

describe('useServiceUIStore', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    // Reset store to initial state
    act(() => {
      useServiceUIStore.getState().reset();
    });
  });

  describe('service search', () => {
    it('should initialize with empty search', () => {
      const { result } = renderHook(() => useServiceUIStore());

      expect(result.current.serviceSearch).toBe('');
    });

    it('should update service search', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setServiceSearch('tor');
      });

      expect(result.current.serviceSearch).toBe('tor');
    });

    it('should clear service search', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setServiceSearch('test');
        result.current.setServiceSearch('');
      });

      expect(result.current.serviceSearch).toBe('');
    });
  });

  describe('category filter', () => {
    it('should initialize with "all" filter', () => {
      const { result } = renderHook(() => useServiceUIStore());

      expect(result.current.categoryFilter).toBe('all');
    });

    it('should update to "privacy" filter', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setCategoryFilter('privacy');
      });

      expect(result.current.categoryFilter).toBe('privacy');
    });

    it('should update to "proxy" filter', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setCategoryFilter('proxy');
      });

      expect(result.current.categoryFilter).toBe('proxy');
    });

    it('should update to "dns" filter', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setCategoryFilter('dns');
      });

      expect(result.current.categoryFilter).toBe('dns');
    });
  });

  describe('status filter', () => {
    it('should initialize with "all" filter', () => {
      const { result } = renderHook(() => useServiceUIStore());

      expect(result.current.statusFilter).toBe('all');
    });

    it('should update to "installed" filter', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setStatusFilter('installed');
      });

      expect(result.current.statusFilter).toBe('installed');
    });

    it('should update to "running" filter', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setStatusFilter('running');
      });

      expect(result.current.statusFilter).toBe('running');
    });

    it('should update to "failed" filter', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setStatusFilter('failed');
      });

      expect(result.current.statusFilter).toBe('failed');
    });
  });

  describe('service selection', () => {
    it('should initialize with empty selection', () => {
      const { result } = renderHook(() => useServiceUIStore());

      expect(result.current.selectedServices).toEqual([]);
    });

    it('should add service to selection', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.toggleServiceSelection('service-1');
      });

      expect(result.current.selectedServices).toEqual(['service-1']);
    });

    it('should remove service from selection when toggled twice', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.toggleServiceSelection('service-1');
        result.current.toggleServiceSelection('service-1');
      });

      expect(result.current.selectedServices).toEqual([]);
    });

    it('should select multiple services', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.toggleServiceSelection('service-1');
        result.current.toggleServiceSelection('service-2');
        result.current.toggleServiceSelection('service-3');
      });

      expect(result.current.selectedServices).toEqual(['service-1', 'service-2', 'service-3']);
    });

    it('should clear all selected services', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.toggleServiceSelection('service-1');
        result.current.toggleServiceSelection('service-2');
        result.current.clearServiceSelection();
      });

      expect(result.current.selectedServices).toEqual([]);
    });

    it('should select all services at once', () => {
      const { result } = renderHook(() => useServiceUIStore());

      const serviceIds = ['service-1', 'service-2', 'service-3', 'service-4'];

      act(() => {
        result.current.selectAllServices(serviceIds);
      });

      expect(result.current.selectedServices).toEqual(serviceIds);
    });
  });

  describe('install wizard draft', () => {
    it('should initialize with null draft', () => {
      const { result } = renderHook(() => useServiceUIStore());

      expect(result.current.wizardDraft).toBeNull();
    });

    it('should save wizard draft', () => {
      const { result } = renderHook(() => useServiceUIStore());

      const draft: ServiceInstallWizardDraft = {
        featureId: 'tor',
        instanceName: 'Tor Proxy 1',
        vlanId: 100,
        bindIp: '192.168.100.1',
        ports: [9050, 9051],
        config: {
          socksPort: 9050,
          controlPort: 9051,
        },
      };

      act(() => {
        result.current.saveWizardDraft(draft);
      });

      expect(result.current.wizardDraft).toEqual(draft);
    });

    it('should update existing wizard draft', () => {
      const { result } = renderHook(() => useServiceUIStore());

      const initialDraft: ServiceInstallWizardDraft = {
        featureId: 'sing-box',
        instanceName: 'Sing-Box Proxy',
      };

      const updatedDraft: ServiceInstallWizardDraft = {
        ...initialDraft,
        vlanId: 200,
        ports: [1080, 8080],
      };

      act(() => {
        result.current.saveWizardDraft(initialDraft);
        result.current.saveWizardDraft(updatedDraft);
      });

      expect(result.current.wizardDraft).toEqual(updatedDraft);
    });

    it('should clear wizard draft and reset wizard step', () => {
      const { result } = renderHook(() => useServiceUIStore());

      const draft: ServiceInstallWizardDraft = {
        featureId: 'xray-core',
        instanceName: 'Xray Proxy',
      };

      act(() => {
        result.current.saveWizardDraft(draft);
        result.current.setWizardStep(2);
        result.current.clearWizardDraft();
      });

      expect(result.current.wizardDraft).toBeNull();
      expect(result.current.wizardStep).toBe(0);
    });

    it('should persist wizard draft to localStorage', () => {
      const { result } = renderHook(() => useServiceUIStore());

      const draft: ServiceInstallWizardDraft = {
        featureId: 'adguard-home',
        instanceName: 'AdGuard DNS',
        ports: [53, 3000],
      };

      act(() => {
        result.current.saveWizardDraft(draft);
      });

      // Check localStorage
      const storedData = localStorage.getItem('service-ui-store');
      expect(storedData).toBeTruthy();

      const parsed = JSON.parse(storedData!);
      expect(parsed.state.wizardDraft).toEqual(draft);
    });

    it('should restore wizard draft from localStorage', () => {
      const draft: ServiceInstallWizardDraft = {
        featureId: 'mtproxy',
        instanceName: 'MTProxy Telegram',
        bindIp: '192.168.1.100',
      };

      // Save a draft first to ensure persistence works
      const { result: firstRender } = renderHook(() => useServiceUIStore());

      act(() => {
        firstRender.current.saveWizardDraft(draft);
      });

      // Verify it was saved to localStorage
      const storedData = localStorage.getItem('service-ui-store');
      expect(storedData).toBeTruthy();
      const parsed = JSON.parse(storedData!);
      expect(parsed.state.wizardDraft).toEqual(draft);

      // Now create a new hook instance (simulating page reload)
      // The store should restore from localStorage
      const { result: secondRender } = renderHook(() => useServiceUIStore());

      expect(secondRender.current.wizardDraft).toEqual(draft);
    });
  });

  describe('wizard step navigation', () => {
    it('should initialize wizard step at 0', () => {
      const { result } = renderHook(() => useServiceUIStore());

      expect(result.current.wizardStep).toBe(0);
    });

    it('should set wizard step directly', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setWizardStep(3);
      });

      expect(result.current.wizardStep).toBe(3);
    });

    it('should increment wizard step with nextWizardStep', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.nextWizardStep();
        result.current.nextWizardStep();
      });

      expect(result.current.wizardStep).toBe(2);
    });

    it('should decrement wizard step with previousWizardStep', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setWizardStep(3);
        result.current.previousWizardStep();
      });

      expect(result.current.wizardStep).toBe(2);
    });

    it('should not allow wizard step to go below 0', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.previousWizardStep();
        result.current.previousWizardStep();
      });

      expect(result.current.wizardStep).toBe(0);
    });
  });

  describe('view mode preference', () => {
    it('should initialize with grid view mode', () => {
      const { result } = renderHook(() => useServiceUIStore());

      expect(result.current.viewMode).toBe('grid');
    });

    it('should toggle to list view mode', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setViewMode('list');
      });

      expect(result.current.viewMode).toBe('list');
    });

    it('should persist view mode preference to localStorage', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setViewMode('list');
      });

      const storedData = localStorage.getItem('service-ui-store');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.viewMode).toBe('list');
    });
  });

  describe('resource metrics preference', () => {
    it('should initialize with resource metrics enabled', () => {
      const { result } = renderHook(() => useServiceUIStore());

      expect(result.current.showResourceMetrics).toBe(true);
    });

    it('should toggle resource metrics', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setShowResourceMetrics(false);
      });

      expect(result.current.showResourceMetrics).toBe(false);

      act(() => {
        result.current.setShowResourceMetrics(true);
      });

      expect(result.current.showResourceMetrics).toBe(true);
    });

    it('should persist resource metrics preference to localStorage', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setShowResourceMetrics(false);
      });

      const storedData = localStorage.getItem('service-ui-store');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.showResourceMetrics).toBe(false);
    });
  });

  describe('advanced config preference', () => {
    it('should initialize with advanced config disabled', () => {
      const { result } = renderHook(() => useServiceUIStore());

      expect(result.current.showAdvancedConfig).toBe(false);
    });

    it('should toggle advanced config', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setShowAdvancedConfig(true);
      });

      expect(result.current.showAdvancedConfig).toBe(true);

      act(() => {
        result.current.setShowAdvancedConfig(false);
      });

      expect(result.current.showAdvancedConfig).toBe(false);
    });

    it('should persist advanced config preference to localStorage', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setShowAdvancedConfig(true);
      });

      const storedData = localStorage.getItem('service-ui-store');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.showAdvancedConfig).toBe(true);
    });
  });

  describe('reset functionality', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useServiceUIStore());

      // Set various state values
      act(() => {
        result.current.setServiceSearch('tor');
        result.current.setCategoryFilter('privacy');
        result.current.setStatusFilter('running');
        result.current.toggleServiceSelection('service-1');
        result.current.saveWizardDraft({ featureId: 'tor' });
        result.current.setWizardStep(2);
        result.current.setViewMode('list');
        result.current.setShowResourceMetrics(false);
        result.current.setShowAdvancedConfig(true);
      });

      // Verify state was changed
      expect(result.current.serviceSearch).toBe('tor');
      expect(result.current.categoryFilter).toBe('privacy');
      expect(result.current.statusFilter).toBe('running');
      expect(result.current.selectedServices).toHaveLength(1);
      expect(result.current.wizardDraft).not.toBeNull();
      expect(result.current.wizardStep).toBe(2);
      expect(result.current.viewMode).toBe('list');
      expect(result.current.showResourceMetrics).toBe(false);
      expect(result.current.showAdvancedConfig).toBe(true);

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify everything is back to initial state
      expect(result.current.serviceSearch).toBe('');
      expect(result.current.categoryFilter).toBe('all');
      expect(result.current.statusFilter).toBe('all');
      expect(result.current.selectedServices).toEqual([]);
      expect(result.current.wizardDraft).toBeNull();
      expect(result.current.wizardStep).toBe(0);
      expect(result.current.viewMode).toBe('grid');
      expect(result.current.showResourceMetrics).toBe(true);
      expect(result.current.showAdvancedConfig).toBe(false);
    });
  });

  describe('selector hooks', () => {
    it('should provide selector hooks for optimized access', () => {
      const { result: searchResult } = renderHook(() =>
        useServiceUIStore((state) => state.serviceSearch)
      );
      const { result: categoryResult } = renderHook(() =>
        useServiceUIStore((state) => state.categoryFilter)
      );
      const { result: statusResult } = renderHook(() =>
        useServiceUIStore((state) => state.statusFilter)
      );
      const { result: selectionResult } = renderHook(() =>
        useServiceUIStore((state) => state.selectedServices)
      );

      expect(searchResult.current).toBe('');
      expect(categoryResult.current).toBe('all');
      expect(statusResult.current).toBe('all');
      expect(selectionResult.current).toEqual([]);
    });
  });

  describe('persistence exclusions', () => {
    it('should NOT persist service search to localStorage', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setServiceSearch('test search');
      });

      const storedData = localStorage.getItem('service-ui-store');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.serviceSearch).toBeUndefined();
    });

    it('should NOT persist category filter to localStorage', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setCategoryFilter('privacy');
      });

      const storedData = localStorage.getItem('service-ui-store');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.categoryFilter).toBeUndefined();
    });

    it('should NOT persist status filter to localStorage', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setStatusFilter('running');
      });

      const storedData = localStorage.getItem('service-ui-store');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.statusFilter).toBeUndefined();
    });

    it('should NOT persist selected services to localStorage', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.toggleServiceSelection('service-1');
      });

      const storedData = localStorage.getItem('service-ui-store');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.selectedServices).toBeUndefined();
    });

    it('should NOT persist wizard step to localStorage', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setWizardStep(3);
      });

      const storedData = localStorage.getItem('service-ui-store');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.wizardStep).toBeUndefined();
    });
  });

  describe('persistence inclusions', () => {
    it('should persist viewMode to localStorage', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setViewMode('list');
      });

      const storedData = localStorage.getItem('service-ui-store');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.viewMode).toBe('list');
    });

    it('should persist showResourceMetrics to localStorage', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setShowResourceMetrics(false);
      });

      const storedData = localStorage.getItem('service-ui-store');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.showResourceMetrics).toBe(false);
    });

    it('should persist showAdvancedConfig to localStorage', () => {
      const { result } = renderHook(() => useServiceUIStore());

      act(() => {
        result.current.setShowAdvancedConfig(true);
      });

      const storedData = localStorage.getItem('service-ui-store');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.showAdvancedConfig).toBe(true);
    });

    it('should persist wizardDraft to localStorage', () => {
      const { result } = renderHook(() => useServiceUIStore());

      const draft: ServiceInstallWizardDraft = {
        featureId: 'psiphon',
        instanceName: 'Psiphon VPN',
      };

      act(() => {
        result.current.saveWizardDraft(draft);
      });

      const storedData = localStorage.getItem('service-ui-store');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.wizardDraft).toEqual(draft);
    });
  });
});
