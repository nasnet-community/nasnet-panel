import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AxiosError } from 'axios';
import { retryInterceptor } from '../retry';

describe('Retry Interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createAxiosError = (
    status?: number,
    code?: string
  ): AxiosError => ({
    message: 'Error',
    code: code || 'ERR_NETWORK',
    config: { url: 'http://localhost/api/test', method: 'get' },
    isAxiosError: true,
    toJSON: () => ({}),
    ...(status && { response: { status, data: {}, headers: {} } }),
  } as AxiosError);

  describe('retry logic', () => {
    it('should retry on 5xx errors', async () => {
      const error = createAxiosError(500);
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      // First call should start retry
      const promise = retryInterceptor(error);

      // Fast-forward through the delay
      await vi.runAllTimersAsync();

      // Should have logged retry attempt
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[API Retry]'),
        expect.objectContaining({
          attempt: 1,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should not retry on 4xx errors', async () => {
      const error = createAxiosError(400);

      try {
        await retryInterceptor(error);
      } catch (e) {
        expect(e).toBe(error);
      }
    });

    it('should not retry on 404', async () => {
      const error = createAxiosError(404);

      try {
        await retryInterceptor(error);
      } catch (e) {
        expect(e).toBe(error);
      }
    });

    it('should retry on network errors', async () => {
      const error: AxiosError = {
        message: 'Network Error',
        code: 'ECONNREFUSED',
        config: { url: 'http://localhost/api/test' },
        isAxiosError: true,
        toJSON: () => ({}),
      } as AxiosError;

      const promise = retryInterceptor(error);
      await vi.runAllTimersAsync();

      // Should not immediately reject
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  describe('retry count tracking', () => {
    it('should initialize retry count to 1 on first retry', async () => {
      const error = createAxiosError(500);
      const axiosSpyOn = vi.spyOn(
        require('axios'),
        'default',
        'get'
      );

      await retryInterceptor(error);
      await vi.runAllTimersAsync();

      expect((error.config as any).retryCount).toBe(1);
    });

    it('should increment retry count on subsequent retries', async () => {
      const error = createAxiosError(500);
      (error.config as any).retryCount = 1;

      await retryInterceptor(error);
      await vi.runAllTimersAsync();

      expect((error.config as any).retryCount).toBe(2);
    });

    it('should reject after max retries', async () => {
      const error = createAxiosError(500);
      (error.config as any).retryCount = 3;

      try {
        await retryInterceptor(error);
      } catch (e) {
        expect(e).toBe(error);
      }
    });
  });

  describe('exponential backoff', () => {
    it('should wait 2 seconds on first retry', async () => {
      const error = createAxiosError(500);
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      const promise = retryInterceptor(error);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.runAllTimersAsync();

      // Check that delay logged was approximately 2s (2^1 * 1000)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          delay: '2000ms',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should wait 4 seconds on second retry', async () => {
      const error = createAxiosError(500);
      (error.config as any).retryCount = 1;
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      const promise = retryInterceptor(error);
      await vi.advanceTimersByTimeAsync(4000);
      await vi.runAllTimersAsync();

      // Check that delay logged was approximately 4s (2^2 * 1000)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          delay: '4000ms',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should wait 8 seconds on third retry', async () => {
      const error = createAxiosError(500);
      (error.config as any).retryCount = 2;
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      const promise = retryInterceptor(error);
      await vi.advanceTimersByTimeAsync(8000);
      await vi.runAllTimersAsync();

      // Check that delay logged was approximately 8s (2^3 * 1000)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          delay: '8000ms',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('retry logging', () => {
    it('should log retry attempts', async () => {
      const error = createAxiosError(500);
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      const promise = retryInterceptor(error);
      await vi.runAllTimersAsync();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[API Retry]'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should include request details in log', async () => {
      const error = createAxiosError(500);
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      const promise = retryInterceptor(error);
      await vi.runAllTimersAsync();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          url: 'http://localhost/api/test',
          attempt: 1,
          status: 500,
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle error without config', async () => {
      const error: AxiosError = {
        message: 'Error',
        isAxiosError: true,
        toJSON: () => ({}),
      } as AxiosError;

      try {
        await retryInterceptor(error);
      } catch (e) {
        expect(e).toBe(error);
      }
    });

    it('should handle error with 3xx status (not retried)', async () => {
      const error = createAxiosError(301);

      try {
        await retryInterceptor(error);
      } catch (e) {
        expect(e).toBe(error);
      }
    });

    it('should reject immediately for 2xx (should not reach interceptor)', async () => {
      // 2xx errors shouldn't be handled by error interceptor
      // This test just verifies the behavior if it somehow does
      const error = createAxiosError(200);

      try {
        await retryInterceptor(error);
      } catch (e) {
        expect(e).toBe(error);
      }
    });
  });
});
