/**
 * Rate Limiting UI Store Tests
 * Tests for Rate Limiting UI state management
 *
 * Story: NAS-7.11 - Implement Connection Rate Limiting - Task 7
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import type { RateLimitRule } from '@nasnet/core/types';

import { useRateLimitingUIStore } from './rate-limiting-ui.store';


describe('useRateLimitingUIStore', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    // Reset store to initial state
    act(() => {
      useRateLimitingUIStore.getState().reset();
    });
  });

  describe('tab selection', () => {
    it('should initialize with "rate-limits" tab', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      expect(result.current.selectedTab).toBe('rate-limits');
    });

    it('should switch to "syn-flood" tab', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.setSelectedTab('syn-flood');
      });

      expect(result.current.selectedTab).toBe('syn-flood');
    });

    it('should switch to "statistics" tab', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.setSelectedTab('statistics');
      });

      expect(result.current.selectedTab).toBe('statistics');
    });

    it('should persist selected tab to localStorage', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.setSelectedTab('statistics');
      });

      const storedData = localStorage.getItem('nasnet-rate-limiting-ui');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.selectedTab).toBe('statistics');
    });
  });

  describe('rule editor', () => {
    const mockRule: RateLimitRule = {
      id: 'rule-1',
      srcAddress: '192.168.1.0/24',
      connectionLimit: 100,
      timeWindow: 'per-minute',
      action: 'drop',
      comment: 'Test rule',
      isDisabled: false,
    };

    it('should initialize with editor closed', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      expect(result.current.showRuleEditor).toBe(false);
      expect(result.current.editingRule).toBeNull();
    });

    it('should open rule editor for new rule', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.openRuleEditor();
      });

      expect(result.current.showRuleEditor).toBe(true);
      expect(result.current.editingRule).toBeNull();
    });

    it('should open rule editor for existing rule', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.openRuleEditor(mockRule);
      });

      expect(result.current.showRuleEditor).toBe(true);
      expect(result.current.editingRule).toEqual(mockRule);
    });

    it('should close rule editor and clear editing rule', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.openRuleEditor(mockRule);
        result.current.closeRuleEditor();
      });

      expect(result.current.showRuleEditor).toBe(false);
      expect(result.current.editingRule).toBeNull();
    });

    it('should NOT persist rule editor state to localStorage', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.openRuleEditor(mockRule);
      });

      const storedData = localStorage.getItem('nasnet-rate-limiting-ui');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.showRuleEditor).toBeUndefined();
      expect(parsed.state.editingRule).toBeUndefined();
    });
  });

  describe('filters', () => {
    it('should initialize with disabled rules shown', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      expect(result.current.showDisabledRules).toBe(true);
    });

    it('should toggle show disabled rules', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.toggleShowDisabledRules();
      });

      expect(result.current.showDisabledRules).toBe(false);

      act(() => {
        result.current.toggleShowDisabledRules();
      });

      expect(result.current.showDisabledRules).toBe(true);
    });

    it('should initialize with "all" action filter', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      expect(result.current.actionFilter).toBe('all');
    });

    it('should set action filter to "drop"', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.setActionFilter('drop');
      });

      expect(result.current.actionFilter).toBe('drop');
    });

    it('should set action filter to "tarpit"', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.setActionFilter('tarpit');
      });

      expect(result.current.actionFilter).toBe('tarpit');
    });

    it('should set action filter to "add-to-list"', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.setActionFilter('add-to-list');
      });

      expect(result.current.actionFilter).toBe('add-to-list');
    });

    it('should persist showDisabledRules to localStorage', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.toggleShowDisabledRules();
      });

      const storedData = localStorage.getItem('nasnet-rate-limiting-ui');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.showDisabledRules).toBe(false);
    });

    it('should persist actionFilter to localStorage', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.setActionFilter('tarpit');
      });

      const storedData = localStorage.getItem('nasnet-rate-limiting-ui');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.actionFilter).toBe('tarpit');
    });
  });

  describe('statistics polling interval', () => {
    it('should initialize with 30 second polling interval', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      expect(result.current.statsPollingInterval).toBe(30000);
    });

    it('should update polling interval to 10 seconds', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.setStatsPollingInterval(10000);
      });

      expect(result.current.statsPollingInterval).toBe(10000);
    });

    it('should update polling interval to 60 seconds', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.setStatsPollingInterval(60000);
      });

      expect(result.current.statsPollingInterval).toBe(60000);
    });

    it('should persist polling interval to localStorage', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.setStatsPollingInterval(15000);
      });

      const storedData = localStorage.getItem('nasnet-rate-limiting-ui');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.statsPollingInterval).toBe(15000);
    });
  });

  describe('expanded rules', () => {
    it('should initialize with no expanded rules', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      expect(result.current.expandedRules).toEqual([]);
    });

    it('should expand a rule', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.toggleExpandedRule('rule-1');
      });

      expect(result.current.expandedRules).toEqual(['rule-1']);
    });

    it('should collapse an expanded rule', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.toggleExpandedRule('rule-1');
        result.current.toggleExpandedRule('rule-1');
      });

      expect(result.current.expandedRules).toEqual([]);
    });

    it('should expand multiple rules', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.toggleExpandedRule('rule-1');
        result.current.toggleExpandedRule('rule-2');
        result.current.toggleExpandedRule('rule-3');
      });

      expect(result.current.expandedRules).toEqual(['rule-1', 'rule-2', 'rule-3']);
    });

    it('should NOT persist expanded rules to localStorage', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.toggleExpandedRule('rule-1');
      });

      const storedData = localStorage.getItem('nasnet-rate-limiting-ui');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.expandedRules).toBeUndefined();
    });
  });

  describe('bulk IP selection', () => {
    it('should initialize with no selected IPs', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      expect(result.current.selectedIPs).toEqual([]);
    });

    it('should select an IP', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.toggleSelectedIP('192.168.1.100');
      });

      expect(result.current.selectedIPs).toEqual(['192.168.1.100']);
    });

    it('should deselect an IP when toggled twice', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.toggleSelectedIP('192.168.1.100');
        result.current.toggleSelectedIP('192.168.1.100');
      });

      expect(result.current.selectedIPs).toEqual([]);
    });

    it('should select multiple IPs', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.toggleSelectedIP('192.168.1.100');
        result.current.toggleSelectedIP('192.168.1.101');
        result.current.toggleSelectedIP('192.168.1.102');
      });

      expect(result.current.selectedIPs).toEqual([
        '192.168.1.100',
        '192.168.1.101',
        '192.168.1.102',
      ]);
    });

    it('should clear all selected IPs', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.toggleSelectedIP('192.168.1.100');
        result.current.toggleSelectedIP('192.168.1.101');
        result.current.clearSelectedIPs();
      });

      expect(result.current.selectedIPs).toEqual([]);
    });

    it('should select all IPs at once', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      const ips = ['192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103'];

      act(() => {
        result.current.selectAllIPs(ips);
      });

      expect(result.current.selectedIPs).toEqual(ips);
    });

    it('should NOT persist selected IPs to localStorage', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.toggleSelectedIP('192.168.1.100');
      });

      const storedData = localStorage.getItem('nasnet-rate-limiting-ui');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.selectedIPs).toBeUndefined();
    });
  });

  describe('reset functionality', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      const mockRule: RateLimitRule = {
        id: 'rule-1',
        connectionLimit: 50,
        timeWindow: 'per-second',
        action: 'tarpit',
        isDisabled: false,
      };

      // Set various state values
      act(() => {
        result.current.setSelectedTab('statistics');
        result.current.openRuleEditor(mockRule);
        result.current.toggleShowDisabledRules();
        result.current.setActionFilter('drop');
        result.current.setStatsPollingInterval(60000);
        result.current.toggleExpandedRule('rule-1');
        result.current.toggleSelectedIP('192.168.1.100');
      });

      // Verify state was changed
      expect(result.current.selectedTab).toBe('statistics');
      expect(result.current.showRuleEditor).toBe(true);
      expect(result.current.editingRule).toEqual(mockRule);
      expect(result.current.showDisabledRules).toBe(false);
      expect(result.current.actionFilter).toBe('drop');
      expect(result.current.statsPollingInterval).toBe(60000);
      expect(result.current.expandedRules).toHaveLength(1);
      expect(result.current.selectedIPs).toHaveLength(1);

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify everything is back to initial state
      expect(result.current.selectedTab).toBe('rate-limits');
      expect(result.current.showRuleEditor).toBe(false);
      expect(result.current.editingRule).toBeNull();
      expect(result.current.showDisabledRules).toBe(true);
      expect(result.current.actionFilter).toBe('all');
      expect(result.current.statsPollingInterval).toBe(30000);
      expect(result.current.expandedRules).toEqual([]);
      expect(result.current.selectedIPs).toEqual([]);
    });
  });

  describe('selector hooks', () => {
    it('should provide selector hooks for optimized access', () => {
      const { result: tabResult } = renderHook(() =>
        useRateLimitingUIStore((state) => state.selectedTab)
      );
      const { result: filterResult } = renderHook(() =>
        useRateLimitingUIStore((state) => state.actionFilter)
      );
      const { result: pollingResult } = renderHook(() =>
        useRateLimitingUIStore((state) => state.statsPollingInterval)
      );
      const { result: ipsResult } = renderHook(() =>
        useRateLimitingUIStore((state) => state.selectedIPs)
      );

      expect(tabResult.current).toBe('rate-limits');
      expect(filterResult.current).toBe('all');
      expect(pollingResult.current).toBe(30000);
      expect(ipsResult.current).toEqual([]);
    });
  });

  describe('persistence behavior', () => {
    it('should restore persisted state from localStorage', () => {
      // First render: set some persisted values
      const { result: firstRender } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        firstRender.current.setSelectedTab('syn-flood');
        firstRender.current.setActionFilter('tarpit');
        firstRender.current.setStatsPollingInterval(45000);
        firstRender.current.toggleShowDisabledRules();
      });

      // Verify it was saved to localStorage
      const storedData = localStorage.getItem('nasnet-rate-limiting-ui');
      expect(storedData).toBeTruthy();
      const parsed = JSON.parse(storedData!);
      expect(parsed.state.selectedTab).toBe('syn-flood');
      expect(parsed.state.actionFilter).toBe('tarpit');
      expect(parsed.state.statsPollingInterval).toBe(45000);
      expect(parsed.state.showDisabledRules).toBe(false);

      // Second render: simulates page reload
      const { result: secondRender } = renderHook(() => useRateLimitingUIStore());

      expect(secondRender.current.selectedTab).toBe('syn-flood');
      expect(secondRender.current.actionFilter).toBe('tarpit');
      expect(secondRender.current.statsPollingInterval).toBe(45000);
      expect(secondRender.current.showDisabledRules).toBe(false);
    });

    it('should NOT restore non-persisted state from localStorage', () => {
      const mockRule: RateLimitRule = {
        id: 'rule-1',
        connectionLimit: 100,
        timeWindow: 'per-minute',
        action: 'drop',
        isDisabled: false,
      };

      // First render: set some non-persisted values
      const { result: firstRender } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        firstRender.current.openRuleEditor(mockRule);
        firstRender.current.toggleExpandedRule('rule-1');
        firstRender.current.toggleSelectedIP('192.168.1.100');
      });

      // Second render: simulates page reload
      const { result: secondRender } = renderHook(() => useRateLimitingUIStore());

      // Non-persisted state should be reset to initial values
      expect(secondRender.current.showRuleEditor).toBe(false);
      expect(secondRender.current.editingRule).toBeNull();
      expect(secondRender.current.expandedRules).toEqual([]);
      expect(secondRender.current.selectedIPs).toEqual([]);
    });
  });

  describe('persistence inclusions', () => {
    it('should persist selectedTab to localStorage', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.setSelectedTab('statistics');
      });

      const storedData = localStorage.getItem('nasnet-rate-limiting-ui');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.selectedTab).toBe('statistics');
    });

    it('should persist showDisabledRules to localStorage', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.toggleShowDisabledRules();
      });

      const storedData = localStorage.getItem('nasnet-rate-limiting-ui');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.showDisabledRules).toBe(false);
    });

    it('should persist actionFilter to localStorage', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.setActionFilter('add-to-list');
      });

      const storedData = localStorage.getItem('nasnet-rate-limiting-ui');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.actionFilter).toBe('add-to-list');
    });

    it('should persist statsPollingInterval to localStorage', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.setStatsPollingInterval(20000);
      });

      const storedData = localStorage.getItem('nasnet-rate-limiting-ui');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.statsPollingInterval).toBe(20000);
    });
  });

  describe('persistence exclusions', () => {
    it('should NOT persist showRuleEditor to localStorage', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.openRuleEditor();
      });

      const storedData = localStorage.getItem('nasnet-rate-limiting-ui');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.showRuleEditor).toBeUndefined();
    });

    it('should NOT persist editingRule to localStorage', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      const mockRule: RateLimitRule = {
        id: 'rule-1',
        connectionLimit: 50,
        timeWindow: 'per-second',
        action: 'drop',
        isDisabled: false,
      };

      act(() => {
        result.current.openRuleEditor(mockRule);
      });

      const storedData = localStorage.getItem('nasnet-rate-limiting-ui');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.editingRule).toBeUndefined();
    });

    it('should NOT persist expandedRules to localStorage', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.toggleExpandedRule('rule-1');
      });

      const storedData = localStorage.getItem('nasnet-rate-limiting-ui');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.expandedRules).toBeUndefined();
    });

    it('should NOT persist selectedIPs to localStorage', () => {
      const { result } = renderHook(() => useRateLimitingUIStore());

      act(() => {
        result.current.toggleSelectedIP('192.168.1.100');
      });

      const storedData = localStorage.getItem('nasnet-rate-limiting-ui');
      const parsed = JSON.parse(storedData!);

      expect(parsed.state.selectedIPs).toBeUndefined();
    });
  });
});
