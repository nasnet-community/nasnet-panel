/**
 * useRateLimitRulesTable Hook Tests
 *
 * Tests filtering, sorting, toggle, delete functionality for rate limit rules table.
 * Uses fixtures from __test-utils__/rate-limit-fixtures.ts
 *
 * @see NAS-7.11: Implement Connection Rate Limiting
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import {
  useRateLimitRules,
  useDeleteRateLimitRule,
  useToggleRateLimitRule,
} from '@nasnet/api-client/queries/firewall';
import type { UseQueryResult } from '@tanstack/react-query';
import type { RateLimitRule } from '@nasnet/core/types';

import { useRateLimitRulesTable } from './use-rate-limit-rules-table';
import {
  mockRateLimitRules,
  mockDropRule,
  mockTarpitRule,
  mockAddToListRule,
  mockDisabledRule,
} from '../__test-utils__/rate-limit-fixtures';

// Mock dependencies - must be before mock declarations for vitest
vi.mock('@nasnet/state/stores', () => ({
  useConnectionStore: vi.fn(() => '192.168.1.1'),
}));

vi.mock('@nasnet/api-client/queries/firewall', () => ({
  useRateLimitRules: vi.fn(),
  useDeleteRateLimitRule: vi.fn(),
  useToggleRateLimitRule: vi.fn(),
}));

// Setup default mock implementations
const mockUseRateLimitRules = vi.mocked(useRateLimitRules);
const mockUseDeleteRateLimitRule = vi.mocked(useDeleteRateLimitRule);
const mockUseToggleRateLimitRule = vi.mocked(useToggleRateLimitRule);

describe('useRateLimitRulesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock implementation
    mockUseRateLimitRules.mockReturnValue({
      data: mockRateLimitRules,
      isLoading: false,
      error: null,
    } as any as UseQueryResult<typeof mockRateLimitRules>);
    mockUseDeleteRateLimitRule.mockReturnValue({
      mutate: vi.fn<any>(),
      data: undefined,
      error: null,
      isPending: false,
    } as any);
    mockUseToggleRateLimitRule.mockReturnValue({
      mutate: vi.fn<any>(),
      data: undefined,
      error: null,
      isPending: false,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Data Loading', () => {
    it('should load rules successfully', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      expect(result.current.rules).toHaveLength(mockRateLimitRules.length);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle loading state', () => {
      mockUseRateLimitRules.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any as UseQueryResult<typeof mockRateLimitRules>);

      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.rules).toEqual([]);
    });

    it('should handle error state', () => {
      const mockError = new Error('Failed to fetch rules');
      mockUseRateLimitRules.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      } as any as UseQueryResult<typeof mockRateLimitRules>);

      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      expect(result.current.error).toBe(mockError);
      expect(result.current.rules).toEqual([]);
    });
  });

  describe('Filtering by Action', () => {
    it('should show all rules when actionFilter is "all"', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ actionFilter: 'all', statusFilter: 'all' })
      );

      expect(result.current.rules).toHaveLength(mockRateLimitRules.length);
    });

    it('should filter by "drop" action', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ actionFilter: 'drop', statusFilter: 'all' })
      );

      const dropRules = mockRateLimitRules.filter((r) => r.action === 'drop');
      expect(result.current.rules).toHaveLength(dropRules.length);
      expect(result.current.rules.every((r) => r.action === 'drop')).toBe(true);
    });

    it('should filter by "tarpit" action', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ actionFilter: 'tarpit', statusFilter: 'all' })
      );

      const tarpitRules = mockRateLimitRules.filter((r) => r.action === 'tarpit');
      expect(result.current.rules).toHaveLength(tarpitRules.length);
      expect(result.current.rules.every((r) => r.action === 'tarpit')).toBe(true);
    });

    it('should filter by "add-to-list" action', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ actionFilter: 'add-to-list', statusFilter: 'all' })
      );

      const addToListRules = mockRateLimitRules.filter((r) => r.action === 'add-to-list');
      expect(result.current.rules).toHaveLength(addToListRules.length);
      expect(result.current.rules.every((r) => r.action === 'add-to-list')).toBe(true);
    });
  });

  describe('Filtering by Status', () => {
    it('should show all rules when statusFilter is "all"', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      expect(result.current.rules).toHaveLength(mockRateLimitRules.length);
    });

    it('should filter enabled rules', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'enabled' })
      );

      const enabledRules = mockRateLimitRules.filter((r) => !r.isDisabled);
      expect(result.current.rules).toHaveLength(enabledRules.length);
      expect(result.current.rules.every((r) => !r.isDisabled)).toBe(true);
    });

    it('should filter disabled rules', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'disabled' })
      );

      const disabledRules = mockRateLimitRules.filter((r) => r.isDisabled);
      expect(result.current.rules).toHaveLength(disabledRules.length);
      expect(result.current.rules.every((r) => r.isDisabled)).toBe(true);
    });
  });

  describe('Combined Filtering', () => {
    it('should apply both action and status filters', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ actionFilter: 'drop', statusFilter: 'enabled' })
      );

      const filtered = mockRateLimitRules.filter(
        (r) => r.action === 'drop' && !r.isDisabled
      );
      expect(result.current.rules).toHaveLength(filtered.length);
    });
  });

  describe('Max Bytes Calculation', () => {
    it('should calculate max bytes from filtered rules', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      const expectedMax = Math.max(...mockRateLimitRules.map((r) => r.bytes ?? 0));
      expect(result.current.maxBytes).toBe(expectedMax);
    });

    it('should return 0 when no rules exist', () => {
      mockUseRateLimitRules.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any as UseQueryResult<typeof mockRateLimitRules>);

      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      expect(result.current.maxBytes).toBe(0);
    });
  });

  describe('Rule Actions', () => {
    it('should open edit dialog for a rule', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      act(() => {
        result.current.handleEdit(mockDropRule);
      });

      expect(result.current.editingRule).toEqual(mockDropRule);
    });

    it('should close edit dialog', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      act(() => {
        result.current.handleEdit(mockDropRule);
      });

      expect(result.current.editingRule).toEqual(mockDropRule);

      act(() => {
        result.current.closeEdit();
      });

      expect(result.current.editingRule).toBeNull();
    });

    it('should duplicate a rule without ID', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      act(() => {
        result.current.handleDuplicate(mockDropRule);
      });

      expect(result.current.editingRule).toEqual(
        expect.objectContaining({
          ...mockDropRule,
          id: undefined,
          comment: `${mockDropRule.comment} (copy)`,
        })
      );
    });

    it('should duplicate a rule without comment', () => {
      const ruleWithoutComment = { ...mockDropRule, comment: undefined };
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      act(() => {
        result.current.handleDuplicate(ruleWithoutComment);
      });

      expect(result.current.editingRule?.comment).toBe('Copy');
    });

    it('should open delete confirmation dialog', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      act(() => {
        result.current.handleDelete(mockDropRule);
      });

      expect(result.current.deleteConfirmRule).toEqual(mockDropRule);
    });

    it('should close delete confirmation dialog', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      act(() => {
        result.current.handleDelete(mockDropRule);
      });

      expect(result.current.deleteConfirmRule).toEqual(mockDropRule);

      act(() => {
        result.current.closeDelete();
      });

      expect(result.current.deleteConfirmRule).toBeNull();
    });

    it('should confirm delete and call mutation', () => {
      const deleteMutate = vi.fn<any>();
      mockUseDeleteRateLimitRule.mockReturnValue({
        mutate: deleteMutate,
        data: undefined,
        error: null,
        isPending: false,
      } as any);

      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      act(() => {
        result.current.handleDelete(mockDropRule);
      });

      act(() => {
        result.current.confirmDelete();
      });

      expect(deleteMutate).toHaveBeenCalledWith(mockDropRule.id);
      expect(result.current.deleteConfirmRule).toBeNull();
    });

    it('should not delete if rule has no ID', () => {
      const deleteMutate = vi.fn<any>();
      mockUseDeleteRateLimitRule.mockReturnValue({
        mutate: deleteMutate,
        data: undefined,
        error: null,
        isPending: false,
      } as any);

      const ruleWithoutId = { ...mockDropRule, id: undefined };
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      act(() => {
        result.current.handleDelete(ruleWithoutId);
      });

      act(() => {
        result.current.confirmDelete();
      });

      expect(deleteMutate).not.toHaveBeenCalled();
    });

    it('should toggle rule enabled/disabled state', () => {
      const toggleMutate = vi.fn<any>();
      mockUseToggleRateLimitRule.mockReturnValue({
        mutate: toggleMutate,
        data: undefined,
        error: null,
        isPending: false,
      } as any);

      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      act(() => {
        result.current.handleToggle(mockDropRule);
      });

      expect(toggleMutate).toHaveBeenCalledWith({
        ruleId: mockDropRule.id,
        isDisabled: !mockDropRule.isDisabled,
      });
    });

    it('should not toggle if rule has no ID', () => {
      const toggleMutate = vi.fn<any>();
      mockUseToggleRateLimitRule.mockReturnValue({
        mutate: toggleMutate,
        data: undefined,
        error: null,
        isPending: false,
      } as any);

      const ruleWithoutId = { ...mockDropRule, id: undefined };
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      act(() => {
        result.current.handleToggle(ruleWithoutId);
      });

      expect(toggleMutate).not.toHaveBeenCalled();
    });

    it('should open stats dialog for a rule', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      act(() => {
        result.current.handleShowStats(mockDropRule);
      });

      expect(result.current.statsRule).toEqual(mockDropRule);
    });

    it('should close stats dialog', () => {
      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      act(() => {
        result.current.handleShowStats(mockDropRule);
      });

      expect(result.current.statsRule).toEqual(mockDropRule);

      act(() => {
        result.current.closeStats();
      });

      expect(result.current.statsRule).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty rules array', () => {
      mockUseRateLimitRules.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any as UseQueryResult<typeof mockRateLimitRules>);

      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      expect(result.current.rules).toEqual([]);
      expect(result.current.maxBytes).toBe(0);
    });

    it('should handle undefined rules data', () => {
      mockUseRateLimitRules.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any as UseQueryResult<typeof mockRateLimitRules>);

      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      expect(result.current.rules).toEqual([]);
    });

    it('should handle rules with missing bytes field', () => {
      const { useRateLimitRules } = require('@nasnet/api-client/queries/firewall');
      const rulesWithoutBytes = mockRateLimitRules.map((r) => ({ ...r, bytes: undefined }));
      useRateLimitRules.mockReturnValue({
        data: rulesWithoutBytes,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() =>
        useRateLimitRulesTable({ statusFilter: 'all' })
      );

      expect(result.current.maxBytes).toBe(0);
    });
  });
});
