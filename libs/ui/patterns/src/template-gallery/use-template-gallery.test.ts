/**
 * Unit Tests for useTemplateGallery Hook
 *
 * Tests filtering, sorting, searching, and selection logic for template gallery.
 *
 * Coverage:
 * - Filtering by search, category, complexity, built-in/custom
 * - Sorting by name, complexity, ruleCount, category, updatedAt
 * - Selection state management
 * - Computed metadata (category/complexity counts)
 *
 * @see libs/ui/patterns/src/template-gallery/use-template-gallery.ts
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect , vi } from 'vitest';

import { useTemplateGallery } from './use-template-gallery';
import {
  mockAllTemplates,
  mockBasicSecurityTemplate,
  mockHomeNetworkTemplate,
  mockGamingOptimizedTemplate,
  mockIotIsolationTemplate,
  mockGuestNetworkTemplate,
  mockCustomTemplate,
} from '../__test-utils__/firewall-templates/template-fixtures';

import type { FirewallTemplate } from './types';

describe('useTemplateGallery', () => {
  describe('Initialization', () => {
    it('should initialize with all templates', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      expect(result.current.filteredTemplates).toHaveLength(mockAllTemplates.length);
      expect(result.current.totalCount).toBe(mockAllTemplates.length);
      expect(result.current.filteredCount).toBe(mockAllTemplates.length);
    });

    it('should initialize with default filter state', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      expect(result.current.filter).toEqual({
        search: '',
        category: 'all',
        complexity: 'all',
        builtInOnly: false,
        customOnly: false,
      });
      expect(result.current.hasActiveFilter).toBe(false);
    });

    it('should initialize with custom filter', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialFilter: {
            category: 'HOME',
            complexity: 'MODERATE',
          },
        })
      );

      expect(result.current.filter.category).toBe('HOME');
      expect(result.current.filter.complexity).toBe('MODERATE');
      expect(result.current.hasActiveFilter).toBe(true);
    });

    it('should initialize with default sort state', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      expect(result.current.sort).toEqual({
        field: 'name',
        direction: 'asc',
      });
    });

    it('should initialize with custom sort', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialSort: {
            field: 'ruleCount',
            direction: 'desc',
          },
        })
      );

      expect(result.current.sort.field).toBe('ruleCount');
      expect(result.current.sort.direction).toBe('desc');
    });

    it('should initialize with selected template', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialSelectedId: mockBasicSecurityTemplate.id,
        })
      );

      expect(result.current.selection.selectedId).toBe(mockBasicSecurityTemplate.id);
      expect(result.current.selection.selectedTemplate).toEqual(mockBasicSecurityTemplate);
    });
  });

  describe('Filtering - Search', () => {
    it('should filter by name search', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      act(() => {
        result.current.setFilter({ search: 'Basic' });
      });

      expect(result.current.filteredTemplates).toHaveLength(1);
      expect(result.current.filteredTemplates[0].id).toBe(mockBasicSecurityTemplate.id);
      expect(result.current.hasActiveFilter).toBe(true);
    });

    it('should filter by description search', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      act(() => {
        result.current.setFilter({ search: 'gaming' });
      });

      expect(result.current.filteredTemplates.length).toBeGreaterThan(0);
      expect(result.current.filteredTemplates[0].id).toBe(mockGamingOptimizedTemplate.id);
    });

    it('should be case-insensitive in search', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      act(() => {
        result.current.setFilter({ search: 'BASIC' });
      });

      expect(result.current.filteredTemplates).toHaveLength(1);
      expect(result.current.filteredTemplates[0].id).toBe(mockBasicSecurityTemplate.id);
    });

    it('should return empty array for non-matching search', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      act(() => {
        result.current.setFilter({ search: 'nonexistent-template' });
      });

      expect(result.current.filteredTemplates).toHaveLength(0);
    });

    it('should ignore whitespace-only search', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      act(() => {
        result.current.setFilter({ search: '   ' });
      });

      expect(result.current.filteredTemplates).toHaveLength(mockAllTemplates.length);
      expect(result.current.hasActiveFilter).toBe(false);
    });
  });

  describe('Filtering - Category', () => {
    it('should filter by category', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      act(() => {
        result.current.setFilter({ category: 'HOME' });
      });

      expect(result.current.filteredTemplates).toHaveLength(1);
      expect(result.current.filteredTemplates[0].category).toBe('HOME');
    });

    it('should show all templates when category is "all"', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialFilter: { category: 'HOME' },
        })
      );

      act(() => {
        result.current.setFilter({ category: 'all' });
      });

      expect(result.current.filteredTemplates).toHaveLength(mockAllTemplates.length);
    });

    it('should return empty array for category with no templates', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      act(() => {
        result.current.setFilter({ category: 'ENTERPRISE' as any });
      });

      expect(result.current.filteredTemplates).toHaveLength(0);
    });
  });

  describe('Filtering - Complexity', () => {
    it('should filter by complexity level', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      act(() => {
        result.current.setFilter({ complexity: 'SIMPLE' });
      });

      const simpleTemplates = result.current.filteredTemplates;
      expect(simpleTemplates.every((t) => t.complexity === 'SIMPLE')).toBe(true);
    });

    it('should show all templates when complexity is "all"', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialFilter: { complexity: 'ADVANCED' },
        })
      );

      act(() => {
        result.current.setFilter({ complexity: 'all' });
      });

      expect(result.current.filteredTemplates).toHaveLength(mockAllTemplates.length);
    });
  });

  describe('Filtering - Built-in/Custom', () => {
    it('should filter built-in templates only', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      act(() => {
        result.current.setFilter({ builtInOnly: true });
      });

      const filtered = result.current.filteredTemplates;
      expect(filtered.every((t) => t.isBuiltIn === true)).toBe(true);
      expect(filtered).not.toContainEqual(mockCustomTemplate);
    });

    it('should filter custom templates only', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      act(() => {
        result.current.setFilter({ customOnly: true });
      });

      const filtered = result.current.filteredTemplates;
      expect(filtered.every((t) => t.isBuiltIn === false)).toBe(true);
      expect(filtered).toContainEqual(mockCustomTemplate);
    });

    it('should return empty array if both builtInOnly and customOnly are true', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      act(() => {
        result.current.setFilter({ builtInOnly: true, customOnly: true });
      });

      expect(result.current.filteredTemplates).toHaveLength(0);
    });
  });

  describe('Filtering - Combined', () => {
    it('should apply multiple filters together', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      act(() => {
        result.current.setFilter({
          category: 'HOME',
          complexity: 'MODERATE',
          builtInOnly: true,
        });
      });

      const filtered = result.current.filteredTemplates;
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(mockHomeNetworkTemplate.id);
      expect(filtered[0].category).toBe('HOME');
      expect(filtered[0].complexity).toBe('MODERATE');
      expect(filtered[0].isBuiltIn).toBe(true);
    });

    it('should clear all filters', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialFilter: {
            search: 'test',
            category: 'HOME',
            complexity: 'ADVANCED',
            builtInOnly: true,
          },
        })
      );

      act(() => {
        result.current.clearFilter();
      });

      expect(result.current.filter).toEqual({
        search: '',
        category: 'all',
        complexity: 'all',
        builtInOnly: false,
        customOnly: false,
      });
      expect(result.current.hasActiveFilter).toBe(false);
      expect(result.current.filteredTemplates).toHaveLength(mockAllTemplates.length);
    });
  });

  describe('Sorting', () => {
    it('should sort by name ascending', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialSort: { field: 'name', direction: 'asc' },
        })
      );

      const sorted = result.current.filteredTemplates;
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].name.localeCompare(sorted[i + 1].name)).toBeLessThanOrEqual(0);
      }
    });

    it('should sort by name descending', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialSort: { field: 'name', direction: 'desc' },
        })
      );

      const sorted = result.current.filteredTemplates;
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].name.localeCompare(sorted[i + 1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should sort by complexity ascending (SIMPLE < MODERATE < ADVANCED)', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialSort: { field: 'complexity', direction: 'asc' },
        })
      );

      const sorted = result.current.filteredTemplates;
      const complexityOrder = { SIMPLE: 1, MODERATE: 2, ADVANCED: 3, EXPERT: 4 };

      for (let i = 0; i < sorted.length - 1; i++) {
        expect(complexityOrder[sorted[i].complexity]).toBeLessThanOrEqual(
          complexityOrder[sorted[i + 1].complexity]
        );
      }
    });

    it('should sort by ruleCount ascending', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialSort: { field: 'ruleCount', direction: 'asc' },
        })
      );

      const sorted = result.current.filteredTemplates;
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].ruleCount).toBeLessThanOrEqual(sorted[i + 1].ruleCount);
      }
    });

    it('should sort by ruleCount descending', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialSort: { field: 'ruleCount', direction: 'desc' },
        })
      );

      const sorted = result.current.filteredTemplates;
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].ruleCount).toBeGreaterThanOrEqual(sorted[i + 1].ruleCount);
      }
    });

    it('should toggle sort direction when clicking same field', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialSort: { field: 'name', direction: 'asc' },
        })
      );

      act(() => {
        result.current.setSort('name');
      });

      expect(result.current.sort.direction).toBe('desc');

      act(() => {
        result.current.setSort('name');
      });

      expect(result.current.sort.direction).toBe('asc');
    });

    it('should default to ascending when switching to new field', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialSort: { field: 'name', direction: 'desc' },
        })
      );

      act(() => {
        result.current.setSort('ruleCount');
      });

      expect(result.current.sort.field).toBe('ruleCount');
      expect(result.current.sort.direction).toBe('asc');
    });

    it('should toggle sort direction independently', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialSort: { field: 'name', direction: 'asc' },
        })
      );

      act(() => {
        result.current.toggleSortDirection();
      });

      expect(result.current.sort.direction).toBe('desc');

      act(() => {
        result.current.toggleSortDirection();
      });

      expect(result.current.sort.direction).toBe('asc');
    });
  });

  describe('Selection', () => {
    it('should select a template', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          onSelect,
        })
      );

      act(() => {
        result.current.selectTemplate(mockBasicSecurityTemplate);
      });

      expect(result.current.selection.selectedId).toBe(mockBasicSecurityTemplate.id);
      expect(result.current.selection.selectedTemplate).toEqual(mockBasicSecurityTemplate);
      expect(onSelect).toHaveBeenCalledWith(mockBasicSecurityTemplate);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialSelectedId: mockBasicSecurityTemplate.id,
        })
      );

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selection.selectedId).toBeNull();
      expect(result.current.selection.selectedTemplate).toBeNull();
    });

    it('should clear selection when passing null to selectTemplate', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialSelectedId: mockBasicSecurityTemplate.id,
        })
      );

      act(() => {
        result.current.selectTemplate(null);
      });

      expect(result.current.selection.selectedId).toBeNull();
      expect(result.current.selection.selectedTemplate).toBeNull();
    });

    it('should not call onSelect when selecting null', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          onSelect,
        })
      );

      act(() => {
        result.current.selectTemplate(null);
      });

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should change selection when selecting different template', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialSelectedId: mockBasicSecurityTemplate.id,
        })
      );

      act(() => {
        result.current.selectTemplate(mockHomeNetworkTemplate);
      });

      expect(result.current.selection.selectedId).toBe(mockHomeNetworkTemplate.id);
      expect(result.current.selection.selectedTemplate).toEqual(mockHomeNetworkTemplate);
    });
  });

  describe('Computed Metadata', () => {
    it('should calculate category counts', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      const counts = result.current.categoryCount;
      expect(counts['BASIC']).toBe(1);
      expect(counts['HOME']).toBe(1);
      expect(counts['GAMING']).toBe(1);
      expect(counts['IOT']).toBe(1);
      expect(counts['GUEST']).toBe(1);
      expect(counts['CUSTOM']).toBe(1);
    });

    it('should calculate complexity counts', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      const counts = result.current.complexityCount;
      expect(counts['SIMPLE']).toBeGreaterThan(0);
      expect(counts['MODERATE']).toBeGreaterThan(0);
      expect(counts['ADVANCED']).toBeGreaterThan(0);
    });

    it('should maintain counts even with active filters', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialFilter: { category: 'HOME' },
        })
      );

      // Counts should be for ALL templates, not filtered
      const counts = result.current.categoryCount;
      expect(Object.keys(counts).length).toBeGreaterThan(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty templates array', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: [],
        })
      );

      expect(result.current.filteredTemplates).toHaveLength(0);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.filteredCount).toBe(0);
    });

    it('should handle template with null updatedAt', () => {
      const templatesWithNull = [
        { ...mockBasicSecurityTemplate, updatedAt: null },
        { ...mockHomeNetworkTemplate, updatedAt: new Date('2026-01-15') },
      ] as FirewallTemplate[];

      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: templatesWithNull,
          initialSort: { field: 'updatedAt', direction: 'asc' },
        })
      );

      // Templates with null updatedAt should be pushed to the end
      const sorted = result.current.filteredTemplates;
      expect(sorted[sorted.length - 1].updatedAt).toBeNull();
    });

    it('should maintain selection after filtering', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialSelectedId: mockHomeNetworkTemplate.id,
        })
      );

      act(() => {
        result.current.setFilter({ category: 'BASIC' });
      });

      // Selection should persist even if selected template is filtered out
      expect(result.current.selection.selectedId).toBe(mockHomeNetworkTemplate.id);
      expect(result.current.selection.selectedTemplate).toEqual(mockHomeNetworkTemplate);
    });

    it('should handle rapid filter changes', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
        })
      );

      act(() => {
        result.current.setFilter({ search: 'Basic' });
        result.current.setFilter({ category: 'HOME' });
        result.current.setFilter({ complexity: 'ADVANCED' });
      });

      expect(result.current.filter.search).toBe('Basic');
      expect(result.current.filter.category).toBe('HOME');
      expect(result.current.filter.complexity).toBe('ADVANCED');
    });
  });

  describe('hasActiveFilter', () => {
    it('should return true when search is active', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialFilter: { search: 'test' },
        })
      );

      expect(result.current.hasActiveFilter).toBe(true);
    });

    it('should return false when search is empty string', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialFilter: { search: '' },
        })
      );

      expect(result.current.hasActiveFilter).toBe(false);
    });

    it('should return true when category is not "all"', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialFilter: { category: 'HOME' },
        })
      );

      expect(result.current.hasActiveFilter).toBe(true);
    });

    it('should return true when complexity is not "all"', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialFilter: { complexity: 'SIMPLE' },
        })
      );

      expect(result.current.hasActiveFilter).toBe(true);
    });

    it('should return true when builtInOnly is true', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialFilter: { builtInOnly: true },
        })
      );

      expect(result.current.hasActiveFilter).toBe(true);
    });

    it('should return true when customOnly is true', () => {
      const { result } = renderHook(() =>
        useTemplateGallery({
          templates: mockAllTemplates,
          initialFilter: { customOnly: true },
        })
      );

      expect(result.current.hasActiveFilter).toBe(true);
    });
  });
});
