/**
 * useBogonFilterDialog Hook Tests
 *
 * Tests for bogon filter dialog hook.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBogonFilterDialog } from './use-bogon-filter-dialog';

describe('useBogonFilterDialog', () => {
  const availableInterfaces = ['ether1-wan', 'ether2-wan', 'pppoe-out1'];

  describe('Initialization', () => {
    it('initializes with first interface', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces })
      );

      expect(result.current.selectedInterface).toBe('ether1-wan');
    });

    it('initializes with default categories (excluding private)', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces })
      );

      expect(result.current.selectedCategories.has('loopback')).toBe(true);
      expect(result.current.selectedCategories.has('reserved')).toBe(true);
      expect(result.current.selectedCategories.has('linkLocal')).toBe(true);
      expect(result.current.selectedCategories.has('multicast')).toBe(true);
      expect(result.current.selectedCategories.has('futureUse')).toBe(true);
      expect(result.current.selectedCategories.has('private')).toBe(false); // Not default
    });

    it('shows private warning when private category is selected', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces })
      );

      expect(result.current.showPrivateWarning).toBe(false);

      act(() => {
        result.current.toggleCategory('private');
      });

      expect(result.current.showPrivateWarning).toBe(true);
    });
  });

  describe('Interface Selection', () => {
    it('sets selected interface', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces })
      );

      act(() => {
        result.current.setSelectedInterface('ether2-wan');
      });

      expect(result.current.selectedInterface).toBe('ether2-wan');
    });
  });

  describe('Category Selection', () => {
    it('toggles category selection', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces })
      );

      const initialSize = result.current.selectedCategories.size;

      act(() => {
        result.current.toggleCategory('private');
      });

      expect(result.current.selectedCategories.has('private')).toBe(true);
      expect(result.current.selectedCategories.size).toBe(initialSize + 1);

      act(() => {
        result.current.toggleCategory('private');
      });

      expect(result.current.selectedCategories.has('private')).toBe(false);
      expect(result.current.selectedCategories.size).toBe(initialSize);
    });

    it('selects all categories', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces })
      );

      act(() => {
        result.current.selectAllCategories();
      });

      expect(result.current.selectedCategories.size).toBe(result.current.allCategories.length);
      expect(result.current.selectedCategories.has('private')).toBe(true);
      expect(result.current.selectedCategories.has('loopback')).toBe(true);
    });

    it('clears all categories', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces })
      );

      act(() => {
        result.current.clearCategories();
      });

      expect(result.current.selectedCategories.size).toBe(0);
    });

    it('checks if category is selected', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces })
      );

      expect(result.current.isCategorySelected('loopback')).toBe(true);
      expect(result.current.isCategorySelected('private')).toBe(false);
    });
  });

  describe('Rule Generation', () => {
    it('generates rules for selected categories', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces })
      );

      // Start with default selection (5 categories)
      const rules = result.current.generateRules();

      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every(r => r.chain === 'prerouting')).toBe(true);
      expect(rules.every(r => r.action === 'drop')).toBe(true);
      expect(rules.every(r => r.inInterface === 'ether1-wan')).toBe(true);
    });

    it('rule count matches generated rules', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces })
      );

      const ruleCount = result.current.ruleCount;
      const rules = result.current.generateRules();

      expect(rules.length).toBe(ruleCount);
    });

    it('generates rules with correct interface', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces })
      );

      act(() => {
        result.current.setSelectedInterface('ether2-wan');
      });

      const rules = result.current.generateRules();

      expect(rules.every(r => r.inInterface === 'ether2-wan')).toBe(true);
    });

    it('includes private addresses when selected', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces })
      );

      // Clear all first
      act(() => {
        result.current.clearCategories();
        result.current.toggleCategory('private');
      });

      const rules = result.current.generateRules();

      // Private has 3 ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
      expect(rules.length).toBe(3);
      expect(rules.some(r => r.srcAddress === '10.0.0.0/8')).toBe(true);
      expect(rules.some(r => r.srcAddress === '172.16.0.0/12')).toBe(true);
      expect(rules.some(r => r.srcAddress === '192.168.0.0/16')).toBe(true);
    });

    it('calls onGenerateStart callback', () => {
      const onGenerateStart = vi.fn();

      const { result } = renderHook(() =>
        useBogonFilterDialog({
          availableInterfaces,
          onGenerateStart,
        })
      );

      result.current.generateRules();

      expect(onGenerateStart).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('is valid when interface and categories are selected', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces })
      );

      expect(result.current.isValid).toBe(true);
    });

    it('is invalid when no categories selected', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces })
      );

      act(() => {
        result.current.clearCategories();
      });

      expect(result.current.isValid).toBe(false);
    });

    it('is invalid when no interface selected', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces: [] })
      );

      act(() => {
        result.current.setSelectedInterface('');
      });

      expect(result.current.isValid).toBe(false);
    });
  });

  describe('Category Descriptions', () => {
    it('provides category descriptions', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces })
      );

      const description = result.current.getCategoryDescription('private');
      expect(description).toContain('RFC 1918');
    });

    it('provides security recommendations', () => {
      const { result } = renderHook(() =>
        useBogonFilterDialog({ availableInterfaces })
      );

      const recommendation = result.current.getSecurityRecommendation('private');
      expect(recommendation).toContain('spoofing');
    });
  });
});
