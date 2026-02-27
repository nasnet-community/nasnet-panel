import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLogCache } from './useLogCache';
import * as logCacheModule from './logCache';

// Mock the logCache module
vi.mock('./logCache');

describe('useLogCache', () => {
  const mockRouterIp = '192.168.1.1';
  const mockLogs = [
    {
      id: '1',
      timestamp: new Date(),
      message: 'Test log 1',
      topic: 'system' as const,
      severity: 'info' as const,
    },
    {
      id: '2',
      timestamp: new Date(),
      message: 'Test log 2',
      topic: 'firewall' as const,
      severity: 'warning' as const,
    },
  ];

  const mockCacheStats = {
    totalEntries: 2,
    oldestEntry: new Date(Date.now() - 3600000),
    newestEntry: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  it('should initialize with default values', () => {
    const mockCache = {
      getLogs: vi.fn().mockResolvedValue([]),
      getStats: vi.fn().mockResolvedValue(null),
      cleanupExpired: vi.fn().mockResolvedValue(0),
      storeLogs: vi.fn().mockResolvedValue(undefined),
      clearAll: vi.fn().mockResolvedValue(undefined),
      init: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    };

    vi.spyOn(logCacheModule, 'getLogCache').mockReturnValue(mockCache as any);

    const { result } = renderHook(() => useLogCache({ routerIp: mockRouterIp, enabled: true }));

    expect(result.current.cachedLogs).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isOffline).toBe(false);
    expect(result.current.cacheStats).toBeNull();
  });

  it('should load cached logs on mount', async () => {
    const mockCache = {
      getLogs: vi.fn().mockResolvedValue(mockLogs),
      getStats: vi.fn().mockResolvedValue(mockCacheStats),
      cleanupExpired: vi.fn().mockResolvedValue(0),
      storeLogs: vi.fn().mockResolvedValue(undefined),
      clearAll: vi.fn().mockResolvedValue(undefined),
      init: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    };

    vi.spyOn(logCacheModule, 'getLogCache').mockReturnValue(mockCache as any);

    const { result } = renderHook(() => useLogCache({ routerIp: mockRouterIp, enabled: true }));

    await waitFor(() => {
      expect(result.current.cachedLogs).toEqual(mockLogs);
      expect(result.current.cacheStats).toEqual(mockCacheStats);
    });

    expect(mockCache.getLogs).toHaveBeenCalledWith(mockRouterIp);
    expect(mockCache.cleanupExpired).toHaveBeenCalled();
  });

  it('should store logs and update stats', async () => {
    const mockCache = {
      getLogs: vi.fn().mockResolvedValue([]),
      getStats: vi.fn().mockResolvedValue(null),
      cleanupExpired: vi.fn().mockResolvedValue(0),
      storeLogs: vi.fn().mockResolvedValue(undefined),
      clearAll: vi.fn().mockResolvedValue(undefined),
      init: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    };

    vi.spyOn(logCacheModule, 'getLogCache').mockReturnValue(mockCache as any);

    const { result } = renderHook(() => useLogCache({ routerIp: mockRouterIp, enabled: true }));

    await act(async () => {
      await result.current.storeLogs(mockLogs);
    });

    expect(mockCache.storeLogs).toHaveBeenCalledWith(mockRouterIp, mockLogs);
  });

  it('should clear cache', async () => {
    const mockCache = {
      getLogs: vi.fn().mockResolvedValue(mockLogs),
      getStats: vi.fn().mockResolvedValue(mockCacheStats),
      cleanupExpired: vi.fn().mockResolvedValue(0),
      storeLogs: vi.fn().mockResolvedValue(undefined),
      clearAll: vi.fn().mockResolvedValue(undefined),
      init: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    };

    vi.spyOn(logCacheModule, 'getLogCache').mockReturnValue(mockCache as any);

    const { result } = renderHook(() => useLogCache({ routerIp: mockRouterIp, enabled: true }));

    await waitFor(() => {
      expect(result.current.cachedLogs).toEqual(mockLogs);
    });

    await act(async () => {
      await result.current.clearCache();
    });

    expect(mockCache.clearAll).toHaveBeenCalled();
    expect(result.current.cachedLogs).toEqual([]);
    expect(result.current.cacheStats).toEqual({
      totalEntries: 0,
      oldestEntry: null,
      newestEntry: null,
    });
  });

  it('should handle offline status changes', async () => {
    const mockCache = {
      getLogs: vi.fn().mockResolvedValue([]),
      getStats: vi.fn().mockResolvedValue(null),
      cleanupExpired: vi.fn().mockResolvedValue(0),
      storeLogs: vi.fn().mockResolvedValue(undefined),
      clearAll: vi.fn().mockResolvedValue(undefined),
      init: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    };

    vi.spyOn(logCacheModule, 'getLogCache').mockReturnValue(mockCache as any);

    const { result } = renderHook(() => useLogCache({ routerIp: mockRouterIp, enabled: true }));

    expect(result.current.isOffline).toBe(false);

    // Simulate going offline
    act(() => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(result.current.isOffline).toBe(true);
    });

    // Simulate coming back online
    act(() => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(result.current.isOffline).toBe(false);
    });
  });

  it('should not load logs when disabled', async () => {
    const mockCache = {
      getLogs: vi.fn().mockResolvedValue([]),
      getStats: vi.fn().mockResolvedValue(null),
      cleanupExpired: vi.fn().mockResolvedValue(0),
      storeLogs: vi.fn().mockResolvedValue(undefined),
      clearAll: vi.fn().mockResolvedValue(undefined),
      init: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    };

    vi.spyOn(logCacheModule, 'getLogCache').mockReturnValue(mockCache as any);

    const { result } = renderHook(() => useLogCache({ routerIp: mockRouterIp, enabled: false }));

    expect(result.current.cachedLogs).toEqual([]);
    expect(mockCache.getLogs).not.toHaveBeenCalled();
  });

  it('should cleanup event listeners on unmount', () => {
    const mockCache = {
      getLogs: vi.fn().mockResolvedValue([]),
      getStats: vi.fn().mockResolvedValue(null),
      cleanupExpired: vi.fn().mockResolvedValue(0),
      storeLogs: vi.fn().mockResolvedValue(undefined),
      clearAll: vi.fn().mockResolvedValue(undefined),
      init: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    };

    vi.spyOn(logCacheModule, 'getLogCache').mockReturnValue(mockCache as any);
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useLogCache({ routerIp: mockRouterIp, enabled: true }));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Cache error');
    const mockCache = {
      getLogs: vi.fn().mockRejectedValue(mockError),
      getStats: vi.fn().mockResolvedValue(null),
      cleanupExpired: vi.fn().mockRejectedValue(mockError),
      storeLogs: vi.fn().mockRejectedValue(mockError),
      clearAll: vi.fn().mockRejectedValue(mockError),
      init: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    };

    vi.spyOn(logCacheModule, 'getLogCache').mockReturnValue(mockCache as any);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useLogCache({ routerIp: mockRouterIp, enabled: true }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    expect(result.current.cachedLogs).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should skip operations when routerIp is empty', async () => {
    const mockCache = {
      getLogs: vi.fn().mockResolvedValue([]),
      getStats: vi.fn().mockResolvedValue(null),
      cleanupExpired: vi.fn().mockResolvedValue(0),
      storeLogs: vi.fn().mockResolvedValue(undefined),
      clearAll: vi.fn().mockResolvedValue(undefined),
      init: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    };

    vi.spyOn(logCacheModule, 'getLogCache').mockReturnValue(mockCache as any);

    const { result } = renderHook(() => useLogCache({ routerIp: '', enabled: true }));

    expect(result.current.cachedLogs).toEqual([]);
    expect(mockCache.getLogs).not.toHaveBeenCalled();
  });

  it('should memoize return value correctly', async () => {
    const mockCache = {
      getLogs: vi.fn().mockResolvedValue(mockLogs),
      getStats: vi.fn().mockResolvedValue(mockCacheStats),
      cleanupExpired: vi.fn().mockResolvedValue(0),
      storeLogs: vi.fn().mockResolvedValue(undefined),
      clearAll: vi.fn().mockResolvedValue(undefined),
      init: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    };

    vi.spyOn(logCacheModule, 'getLogCache').mockReturnValue(mockCache as any);

    const { result, rerender } = renderHook(() =>
      useLogCache({ routerIp: mockRouterIp, enabled: true })
    );

    const firstReturn = result.current;

    await waitFor(() => {
      expect(result.current.cachedLogs).toEqual(mockLogs);
    });

    rerender();
    const secondReturn = result.current;

    // Return object should be different if dependencies changed
    expect(firstReturn).not.toBe(secondReturn);
  });
});
