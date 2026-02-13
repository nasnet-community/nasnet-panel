/**
 * Rule Navigation Hook Tests
 *
 * Tests for useRuleNavigation hook functionality including:
 * - Finding rules by prefix
 * - Navigation to rule with highlight
 * - Error handling for missing rules
 * - Toast notifications
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRuleNavigation } from './use-rule-navigation';
import * as routerModule from '@tanstack/react-router';
import * as queryModule from '@nasnet/api-client/queries/firewall';
import * as primitivesModule from '@nasnet/ui/primitives';
import type { FilterRule } from '@nasnet/core/types';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('@nasnet/api-client/queries/firewall', () => ({
  useFilterRules: vi.fn(),
}));

vi.mock('@nasnet/ui/primitives', async () => {
  const actual = await vi.importActual('@nasnet/ui/primitives');
  return {
    ...actual,
    toast: vi.fn(),
  };
});

// ============================================================================
// Test Data
// ============================================================================

const mockRules: FilterRule[] = [
  {
    id: '*1',
    chain: 'input',
    action: 'drop',
    order: 0,
    disabled: false,
    log: true,
    logPrefix: 'SSH-DROP',
    protocol: 'tcp',
    dstPort: '22',
    comment: 'Drop SSH from untrusted',
  },
  {
    id: '*2',
    chain: 'forward',
    action: 'accept',
    order: 1,
    disabled: false,
    log: true,
    logPrefix: 'WEB-ALLOW',
    protocol: 'tcp',
    dstPort: '80,443',
    comment: 'Allow web traffic',
  },
  {
    id: '*3',
    chain: 'input',
    action: 'accept',
    order: 2,
    disabled: false,
    log: false,
    comment: 'Rule without log prefix',
  },
];

// ============================================================================
// Tests
// ============================================================================

describe('useRuleNavigation', () => {
  const mockNavigate = vi.fn();
  const mockToast = vi.fn();
  const routerId = 'test-router-1';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(routerModule, 'useNavigate').mockReturnValue(mockNavigate);
    vi.spyOn(primitivesModule, 'toast').mockImplementation(mockToast);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findRuleByPrefix', () => {
    it('should find rule by exact prefix match', () => {
      vi.spyOn(queryModule, 'useFilterRules').mockReturnValue({
        data: mockRules,
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useRuleNavigation({ routerId }));

      const rule = result.current.findRuleByPrefix('SSH-DROP');
      expect(rule).toBeDefined();
      expect(rule?.id).toBe('*1');
      expect(rule?.logPrefix).toBe('SSH-DROP');
    });

    it('should find rule by case-insensitive prefix match', () => {
      vi.spyOn(queryModule, 'useFilterRules').mockReturnValue({
        data: mockRules,
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useRuleNavigation({ routerId }));

      const rule = result.current.findRuleByPrefix('ssh-drop');
      expect(rule).toBeDefined();
      expect(rule?.id).toBe('*1');
      expect(rule?.logPrefix).toBe('SSH-DROP');
    });

    it('should return undefined if prefix not found', () => {
      vi.spyOn(queryModule, 'useFilterRules').mockReturnValue({
        data: mockRules,
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useRuleNavigation({ routerId }));

      const rule = result.current.findRuleByPrefix('NON-EXISTENT');
      expect(rule).toBeUndefined();
    });

    it('should return undefined if rules are empty', () => {
      vi.spyOn(queryModule, 'useFilterRules').mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useRuleNavigation({ routerId }));

      const rule = result.current.findRuleByPrefix('SSH-DROP');
      expect(rule).toBeUndefined();
    });

    it('should return undefined if rules are not loaded', () => {
      vi.spyOn(queryModule, 'useFilterRules').mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      const { result } = renderHook(() => useRuleNavigation({ routerId }));

      const rule = result.current.findRuleByPrefix('SSH-DROP');
      expect(rule).toBeUndefined();
    });
  });

  describe('navigateToRule', () => {
    it('should navigate to filter page with highlight param', () => {
      vi.spyOn(queryModule, 'useFilterRules').mockReturnValue({
        data: mockRules,
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useRuleNavigation({ routerId }));

      result.current.navigateToRule('*1');

      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/router/$id/firewall/filter',
        params: { id: routerId },
        search: { highlight: '*1' },
      });
    });

    it('should use correct router ID in navigation', () => {
      const differentRouterId = 'router-abc-123';
      vi.spyOn(queryModule, 'useFilterRules').mockReturnValue({
        data: mockRules,
        isLoading: false,
      } as any);

      const { result } = renderHook(() =>
        useRuleNavigation({ routerId: differentRouterId })
      );

      result.current.navigateToRule('*2');

      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/router/$id/firewall/filter',
        params: { id: differentRouterId },
        search: { highlight: '*2' },
      });
    });
  });

  describe('navigateToRuleByPrefix', () => {
    it('should find and navigate to rule when prefix exists', () => {
      vi.spyOn(queryModule, 'useFilterRules').mockReturnValue({
        data: mockRules,
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useRuleNavigation({ routerId }));

      result.current.navigateToRuleByPrefix('WEB-ALLOW');

      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/router/$id/firewall/filter',
        params: { id: routerId },
        search: { highlight: '*2' },
      });
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should show error toast when rule not found', () => {
      vi.spyOn(queryModule, 'useFilterRules').mockReturnValue({
        data: mockRules,
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useRuleNavigation({ routerId }));

      result.current.navigateToRuleByPrefix('NON-EXISTENT-PREFIX');

      expect(mockToast).toHaveBeenCalledWith({
        variant: 'error',
        title: 'Rule Not Found',
        description: expect.stringContaining('NON-EXISTENT-PREFIX'),
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show error toast when rules list is empty', () => {
      vi.spyOn(queryModule, 'useFilterRules').mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useRuleNavigation({ routerId }));

      result.current.navigateToRuleByPrefix('SSH-DROP');

      expect(mockToast).toHaveBeenCalledWith({
        variant: 'error',
        title: 'Rule Not Found',
        description: expect.stringContaining('SSH-DROP'),
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive prefix search', () => {
      vi.spyOn(queryModule, 'useFilterRules').mockReturnValue({
        data: mockRules,
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useRuleNavigation({ routerId }));

      result.current.navigateToRuleByPrefix('web-allow');

      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/router/$id/firewall/filter',
        params: { id: routerId },
        search: { highlight: '*2' },
      });
      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  describe('isLoading', () => {
    it('should return loading state from useFilterRules', () => {
      vi.spyOn(queryModule, 'useFilterRules').mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      const { result } = renderHook(() => useRuleNavigation({ routerId }));

      expect(result.current.isLoading).toBe(true);
    });

    it('should return false when rules are loaded', () => {
      vi.spyOn(queryModule, 'useFilterRules').mockReturnValue({
        data: mockRules,
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useRuleNavigation({ routerId }));

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('routerId changes', () => {
    it('should update navigation when routerId changes', () => {
      vi.spyOn(queryModule, 'useFilterRules').mockReturnValue({
        data: mockRules,
        isLoading: false,
      } as any);

      const { result, rerender } = renderHook(
        ({ routerId }) => useRuleNavigation({ routerId }),
        { initialProps: { routerId: 'router-1' } }
      );

      result.current.navigateToRule('*1');
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: 'router-1' },
        })
      );

      // Change router ID
      rerender({ routerId: 'router-2' });

      result.current.navigateToRule('*1');
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: 'router-2' },
        })
      );
    });
  });
});
