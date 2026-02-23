/**
 * Custom Templates Hook Unit Tests
 *
 * Tests for IndexedDB CRUD operations using localforage.
 * Uses in-memory storage for tests (no actual IndexedDB).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCustomTemplates, customTemplatesStore } from './useCustomTemplates';
import type { FirewallTemplate } from '../schemas/templateSchemas';

// Mock localforage to use in-memory storage
vi.mock('localforage', () => {
  const storage = new Map();

  return {
    default: {
      createInstance: () => ({
        ready: vi.fn().mockResolvedValue(undefined),
        getItem: vi.fn((key: string) => Promise.resolve(storage.get(key) || null)),
        setItem: vi.fn((key: string, value: unknown) => {
          storage.set(key, value);
          return Promise.resolve(value);
        }),
        removeItem: vi.fn((key: string) => {
          storage.delete(key);
          return Promise.resolve();
        }),
        clear: vi.fn(() => {
          storage.clear();
          return Promise.resolve();
        }),
        length: vi.fn(() => Promise.resolve(storage.size)),
        iterate: vi.fn((callback: (value: unknown) => void) => {
          storage.forEach((value) => callback(value));
          return Promise.resolve();
        }),
      }),
    },
  };
});

// =============================================================================
// TEST FIXTURES
// =============================================================================

const mockTemplate1: FirewallTemplate = {
  id: 'custom-vpn',
  name: 'Custom VPN Rules',
  description: 'Custom VPN configuration',
  category: 'CUSTOM',
  complexity: 'MODERATE',
  ruleCount: 3,
  variables: [
    {
      name: 'VPN_PORT',
      label: 'VPN Port',
      type: 'PORT',
      isRequired: true,
    },
  ],
  rules: [
    {
      table: 'FILTER',
      chain: 'input',
      action: 'accept',
      position: null,
      properties: {},
    },
  ],
  isBuiltIn: false,
  version: '1.0.0',
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15'),
};

const mockTemplate2: FirewallTemplate = {
  id: 'custom-gaming',
  name: 'Custom Gaming Rules',
  description: 'Custom gaming configuration',
  category: 'CUSTOM',
  complexity: 'ADVANCED',
  ruleCount: 5,
  variables: [],
  rules: [
    {
      table: 'MANGLE',
      chain: 'prerouting',
      action: 'mark-connection',
      position: null,
      properties: {},
    },
  ],
  isBuiltIn: false,
  version: '1.0.0',
  createdAt: new Date('2026-01-20'),
  updatedAt: new Date('2026-01-20'),
};

// =============================================================================
// STORE TESTS
// =============================================================================

describe('CustomTemplatesStore', () => {
  beforeEach(async () => {
    // Clear store before each test
    await customTemplatesStore.clear();
  });

  describe('save and getAll', () => {
    it('should save and retrieve templates', async () => {
      await customTemplatesStore.save(mockTemplate1);
      await customTemplatesStore.save(mockTemplate2);

      const templates = await customTemplatesStore.getAll();

      expect(templates).toHaveLength(2);
      expect(templates.map((t) => t.id)).toContain(mockTemplate1.id);
      expect(templates.map((t) => t.id)).toContain(mockTemplate2.id);
    });

    it('should sort templates by name', async () => {
      await customTemplatesStore.save(mockTemplate2); // Gaming (later alphabetically)
      await customTemplatesStore.save(mockTemplate1); // VPN (earlier alphabetically)

      const templates = await customTemplatesStore.getAll();

      expect(templates[0].name).toBe('Custom Gaming Rules');
      expect(templates[1].name).toBe('Custom VPN Rules');
    });

    it('should mark templates as non-built-in', async () => {
      const template = { ...mockTemplate1, isBuiltIn: true };
      await customTemplatesStore.save(template);

      const saved = await customTemplatesStore.getById(template.id);

      expect(saved?.isBuiltIn).toBe(false);
    });

    it('should update timestamps', async () => {
      const template = { ...mockTemplate1, updatedAt: new Date('2020-01-01') };
      const saveBefore = Date.now();

      await customTemplatesStore.save(template);

      const saved = await customTemplatesStore.getById(template.id);
      const saveAfter = Date.now();

      expect(saved?.updatedAt).toBeDefined();
      const updatedTime = saved?.updatedAt ? new Date(saved.updatedAt).getTime() : 0;
      expect(updatedTime).toBeGreaterThanOrEqual(saveBefore);
      expect(updatedTime).toBeLessThanOrEqual(saveAfter);
    });
  });

  describe('getById', () => {
    it('should retrieve a specific template', async () => {
      await customTemplatesStore.save(mockTemplate1);
      await customTemplatesStore.save(mockTemplate2);

      const template = await customTemplatesStore.getById(mockTemplate1.id);

      expect(template).toBeDefined();
      expect(template?.id).toBe(mockTemplate1.id);
      expect(template?.name).toBe(mockTemplate1.name);
    });

    it('should return null for non-existent template', async () => {
      const template = await customTemplatesStore.getById('non-existent');

      expect(template).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove a template', async () => {
      await customTemplatesStore.save(mockTemplate1);
      await customTemplatesStore.save(mockTemplate2);

      await customTemplatesStore.remove(mockTemplate1.id);

      const templates = await customTemplatesStore.getAll();
      expect(templates).toHaveLength(1);
      expect(templates[0].id).toBe(mockTemplate2.id);
    });

    it('should not throw when removing non-existent template', async () => {
      await expect(customTemplatesStore.remove('non-existent')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all templates', async () => {
      await customTemplatesStore.save(mockTemplate1);
      await customTemplatesStore.save(mockTemplate2);

      await customTemplatesStore.clear();

      const templates = await customTemplatesStore.getAll();
      expect(templates).toHaveLength(0);
    });
  });

  describe('exists', () => {
    it('should return true for existing template', async () => {
      await customTemplatesStore.save(mockTemplate1);

      const exists = await customTemplatesStore.exists(mockTemplate1.id);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent template', async () => {
      const exists = await customTemplatesStore.exists('non-existent');

      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    it('should return correct count', async () => {
      expect(await customTemplatesStore.count()).toBe(0);

      await customTemplatesStore.save(mockTemplate1);
      expect(await customTemplatesStore.count()).toBe(1);

      await customTemplatesStore.save(mockTemplate2);
      expect(await customTemplatesStore.count()).toBe(2);

      await customTemplatesStore.remove(mockTemplate1.id);
      expect(await customTemplatesStore.count()).toBe(1);
    });
  });

  describe('export and import', () => {
    it('should export templates as JSON', async () => {
      await customTemplatesStore.save(mockTemplate1);
      await customTemplatesStore.save(mockTemplate2);

      const json = await customTemplatesStore.export();
      const exported = JSON.parse(json);

      expect(Array.isArray(exported)).toBe(true);
      expect(exported).toHaveLength(2);
    });

    it('should import templates from JSON', async () => {
      const json = JSON.stringify([mockTemplate1, mockTemplate2]);

      const imported = await customTemplatesStore.import(json);

      expect(imported).toBe(2);

      const templates = await customTemplatesStore.getAll();
      expect(templates).toHaveLength(2);
    });

    it('should handle invalid JSON gracefully', async () => {
      await expect(customTemplatesStore.import('invalid json')).rejects.toThrow();
    });

    it('should handle non-array JSON', async () => {
      await expect(customTemplatesStore.import(JSON.stringify({ invalid: true }))).rejects.toThrow();
    });
  });
});

// =============================================================================
// HOOK TESTS
// =============================================================================

describe('useCustomTemplates', () => {
  beforeEach(async () => {
    await customTemplatesStore.clear();
  });

  it('should load templates on mount', async () => {
    await customTemplatesStore.save(mockTemplate1);

    const { result } = renderHook(() => useCustomTemplates());

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for load to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.templates).toHaveLength(1);
    expect(result.current.templates[0].id).toBe(mockTemplate1.id);
    expect(result.current.count).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('should handle empty store', async () => {
    const { result } = renderHook(() => useCustomTemplates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.templates).toHaveLength(0);
    expect(result.current.count).toBe(0);
  });

  it('should save a template', async () => {
    const { result } = renderHook(() => useCustomTemplates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.save(mockTemplate1);
    });

    await waitFor(() => {
      expect(result.current.templates).toHaveLength(1);
      expect(result.current.count).toBe(1);
    });
  });

  it('should remove a template', async () => {
    await customTemplatesStore.save(mockTemplate1);
    await customTemplatesStore.save(mockTemplate2);

    const { result } = renderHook(() => useCustomTemplates());

    await waitFor(() => {
      expect(result.current.templates).toHaveLength(2);
    });

    await act(async () => {
      await result.current.remove(mockTemplate1.id);
    });

    await waitFor(() => {
      expect(result.current.templates).toHaveLength(1);
      expect(result.current.templates[0].id).toBe(mockTemplate2.id);
      expect(result.current.count).toBe(1);
    });
  });

  it('should clear all templates', async () => {
    await customTemplatesStore.save(mockTemplate1);
    await customTemplatesStore.save(mockTemplate2);

    const { result } = renderHook(() => useCustomTemplates());

    await waitFor(() => {
      expect(result.current.templates).toHaveLength(2);
    });

    await act(async () => {
      await result.current.clear();
    });

    await waitFor(() => {
      expect(result.current.templates).toHaveLength(0);
      expect(result.current.count).toBe(0);
    });
  });

  it('should reload templates', async () => {
    const { result } = renderHook(() => useCustomTemplates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Add template directly to store (bypass hook)
    await customTemplatesStore.save(mockTemplate1);

    await act(async () => {
      await result.current.reload();
    });

    await waitFor(() => {
      expect(result.current.templates).toHaveLength(1);
    });
  });

  it('should check if template exists', async () => {
    await customTemplatesStore.save(mockTemplate1);

    const { result } = renderHook(() => useCustomTemplates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const exists = await result.current.exists(mockTemplate1.id);
    const notExists = await result.current.exists('non-existent');

    expect(exists).toBe(true);
    expect(notExists).toBe(false);
  });

  it('should export templates', async () => {
    await customTemplatesStore.save(mockTemplate1);

    const { result } = renderHook(() => useCustomTemplates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const json = await result.current.exportTemplates();
    const exported = JSON.parse(json);

    expect(Array.isArray(exported)).toBe(true);
    expect(exported).toHaveLength(1);
  });

  it('should import templates', async () => {
    const { result } = renderHook(() => useCustomTemplates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const json = JSON.stringify([mockTemplate1, mockTemplate2]);

    let imported = 0;
    await act(async () => {
      imported = await result.current.importTemplates(json);
    });

    expect(imported).toBe(2);

    await waitFor(() => {
      expect(result.current.templates).toHaveLength(2);
      expect(result.current.count).toBe(2);
    });
  });
});
