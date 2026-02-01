import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import {
  useMemoizedFilter,
  useMemoizedSort,
  useMemoizedFilterSort,
  useMemoizedMap,
  useMemoizedFind,
  useMemoizedGroupBy,
  useMemoizedReduce,
  useMemoizedUnique,
} from '../useMemoizedFilter';

interface TestItem {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  priority: number;
}

const createTestItems = (): TestItem[] => [
  { id: 1, name: 'Alpha', status: 'active', priority: 3 },
  { id: 2, name: 'Beta', status: 'inactive', priority: 1 },
  { id: 3, name: 'Gamma', status: 'active', priority: 2 },
  { id: 4, name: 'Delta', status: 'inactive', priority: 4 },
];

describe('useMemoizedFilter', () => {
  it('should filter items based on predicate', () => {
    const items = createTestItems();
    const { result } = renderHook(() =>
      useMemoizedFilter(items, (item) => item.status === 'active', [])
    );

    expect(result.current).toHaveLength(2);
    expect(result.current.map((i) => i.name)).toEqual(['Alpha', 'Gamma']);
  });

  it('should return stable reference when inputs unchanged', () => {
    const items = createTestItems();
    const { result, rerender } = renderHook(() =>
      useMemoizedFilter(items, (item) => item.status === 'active', [])
    );

    const firstResult = result.current;
    rerender();
    expect(result.current).toBe(firstResult);
  });

  it('should recompute when items change', () => {
    const items = createTestItems();
    const { result, rerender } = renderHook(
      ({ data }) => useMemoizedFilter(data, (item) => item.status === 'active', []),
      { initialProps: { data: items } }
    );

    const firstResult = result.current;
    const newItems = [...items, { id: 5, name: 'Epsilon', status: 'active' as const, priority: 5 }];
    rerender({ data: newItems });

    expect(result.current).not.toBe(firstResult);
    expect(result.current).toHaveLength(3);
  });
});

describe('useMemoizedSort', () => {
  it('should sort items based on comparator', () => {
    const items = createTestItems();
    const { result } = renderHook(() =>
      useMemoizedSort(items, (a, b) => a.priority - b.priority, [])
    );

    expect(result.current.map((i) => i.name)).toEqual(['Beta', 'Gamma', 'Alpha', 'Delta']);
  });

  it('should not mutate original array', () => {
    const items = createTestItems();
    const originalOrder = items.map((i) => i.name);

    renderHook(() => useMemoizedSort(items, (a, b) => a.priority - b.priority, []));

    expect(items.map((i) => i.name)).toEqual(originalOrder);
  });

  it('should sort strings correctly', () => {
    const items = createTestItems();
    const { result } = renderHook(() =>
      useMemoizedSort(items, (a, b) => a.name.localeCompare(b.name), [])
    );

    expect(result.current.map((i) => i.name)).toEqual(['Alpha', 'Beta', 'Delta', 'Gamma']);
  });
});

describe('useMemoizedFilterSort', () => {
  it('should filter and sort together', () => {
    const items = createTestItems();
    const { result } = renderHook(() =>
      useMemoizedFilterSort(
        items,
        (item) => item.status === 'active',
        (a, b) => a.priority - b.priority,
        []
      )
    );

    expect(result.current.map((i) => i.name)).toEqual(['Gamma', 'Alpha']);
  });

  it('should handle null filter', () => {
    const items = createTestItems();
    const { result } = renderHook(() =>
      useMemoizedFilterSort(items, null, (a, b) => a.priority - b.priority, [])
    );

    expect(result.current).toHaveLength(4);
  });

  it('should handle null sort', () => {
    const items = createTestItems();
    const { result } = renderHook(() =>
      useMemoizedFilterSort(items, (item) => item.status === 'active', null, [])
    );

    expect(result.current).toHaveLength(2);
  });
});

describe('useMemoizedMap', () => {
  it('should transform items', () => {
    const items = createTestItems();
    const { result } = renderHook(() => useMemoizedMap(items, (item) => item.name, []));

    expect(result.current).toEqual(['Alpha', 'Beta', 'Gamma', 'Delta']);
  });

  it('should pass index to mapper', () => {
    const items = createTestItems();
    const { result } = renderHook(() =>
      useMemoizedMap(items, (item, index) => `${index}: ${item.name}`, [])
    );

    expect(result.current).toEqual(['0: Alpha', '1: Beta', '2: Gamma', '3: Delta']);
  });
});

describe('useMemoizedFind', () => {
  it('should find matching item', () => {
    const items = createTestItems();
    const { result } = renderHook(() => useMemoizedFind(items, (item) => item.id === 3, []));

    expect(result.current?.name).toBe('Gamma');
  });

  it('should return undefined when not found', () => {
    const items = createTestItems();
    const { result } = renderHook(() => useMemoizedFind(items, (item) => item.id === 999, []));

    expect(result.current).toBeUndefined();
  });
});

describe('useMemoizedGroupBy', () => {
  it('should group items by key', () => {
    const items = createTestItems();
    const { result } = renderHook(() => useMemoizedGroupBy(items, (item) => item.status, []));

    expect(result.current.get('active')).toHaveLength(2);
    expect(result.current.get('inactive')).toHaveLength(2);
  });

  it('should preserve item references', () => {
    const items = createTestItems();
    const { result } = renderHook(() => useMemoizedGroupBy(items, (item) => item.status, []));

    expect(result.current.get('active')![0]).toBe(items[0]);
  });
});

describe('useMemoizedReduce', () => {
  it('should reduce to sum', () => {
    const items = createTestItems();
    const { result } = renderHook(() =>
      useMemoizedReduce(items, (sum, item) => sum + item.priority, 0, [])
    );

    expect(result.current).toBe(10); // 3 + 1 + 2 + 4
  });

  it('should reduce to object', () => {
    const items = createTestItems();
    const { result } = renderHook(() =>
      useMemoizedReduce(
        items,
        (acc, item) => ({ ...acc, [item.id]: item.name }),
        {} as Record<number, string>,
        []
      )
    );

    expect(result.current).toEqual({
      1: 'Alpha',
      2: 'Beta',
      3: 'Gamma',
      4: 'Delta',
    });
  });
});

describe('useMemoizedUnique', () => {
  it('should dedupe primitive array', () => {
    const items = ['a', 'b', 'a', 'c', 'b'];
    const { result } = renderHook(() => useMemoizedUnique(items, null, []));

    expect(result.current).toEqual(['a', 'b', 'c']);
  });

  it('should dedupe objects by key', () => {
    const items = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 1, name: 'A duplicate' },
    ];
    const { result } = renderHook(() => useMemoizedUnique(items, (item) => item.id, []));

    expect(result.current).toHaveLength(2);
    expect(result.current.map((i) => i.id)).toEqual([1, 2]);
  });

  it('should preserve first occurrence', () => {
    const items = [
      { id: 1, name: 'First' },
      { id: 1, name: 'Second' },
    ];
    const { result } = renderHook(() => useMemoizedUnique(items, (item) => item.id, []));

    expect(result.current[0].name).toBe('First');
  });
});
