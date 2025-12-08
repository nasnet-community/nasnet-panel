import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosError } from 'axios';
import { errorInterceptor } from '../error';
import { ApiError } from '../../types';

describe('Error Interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('error message mapping', () => {
    const createAxiosError = (
      status?: number,
      message?: string
    ): AxiosError => ({
      message: message || 'Network Error',
      code: 'ERR_NETWORK',
      config: { url: 'http://localhost/api/test' },
      isAxiosError: true,
      toJSON: () => ({}),
      ...(status && { response: { status, data: {}, headers: {} } }),
    } as AxiosError);

    it('should handle network errors (no response)', async () => {
      const error = createAxiosError();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

      try {
        await errorInterceptor(error);
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).message).toContain('Network error');
      }

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should map 400 Bad Request', async () => {
      const error = createAxiosError(400);

      try {
        await errorInterceptor(error);
      } catch (e) {
        expect((e as ApiError).message).toContain('Bad request');
        expect((e as ApiError).statusCode).toBe(400);
      }
    });

    it('should map 401 Unauthorized', async () => {
      const error = createAxiosError(401);

      try {
        await errorInterceptor(error);
      } catch (e) {
        expect((e as ApiError).message).toContain('Authentication failed');
        expect((e as ApiError).statusCode).toBe(401);
      }
    });

    it('should map 403 Forbidden', async () => {
      const error = createAxiosError(403);

      try {
        await errorInterceptor(error);
      } catch (e) {
        expect((e as ApiError).message).toContain('Permission denied');
      }
    });

    it('should map 404 Not Found', async () => {
      const error = createAxiosError(404);

      try {
        await errorInterceptor(error);
      } catch (e) {
        expect((e as ApiError).message).toContain('Resource not found');
      }
    });

    it('should map 429 Too Many Requests', async () => {
      const error = createAxiosError(429);

      try {
        await errorInterceptor(error);
      } catch (e) {
        expect((e as ApiError).message).toContain('Too many requests');
      }
    });

    it('should map 500 Internal Server Error', async () => {
      const error = createAxiosError(500);

      try {
        await errorInterceptor(error);
      } catch (e) {
        expect((e as ApiError).message).toContain('Server error');
      }
    });

    it('should map 502 Bad Gateway', async () => {
      const error = createAxiosError(502);

      try {
        await errorInterceptor(error);
      } catch (e) {
        expect((e as ApiError).message).toContain('Gateway error');
      }
    });

    it('should map 503 Service Unavailable', async () => {
      const error = createAxiosError(503);

      try {
        await errorInterceptor(error);
      } catch (e) {
        expect((e as ApiError).message).toContain('unavailable');
      }
    });

    it('should handle unknown 5xx errors', async () => {
      const error = createAxiosError(599);

      try {
        await errorInterceptor(error);
      } catch (e) {
        expect((e as ApiError).message).toContain('Server error');
      }
    });

    it('should handle unknown 4xx errors', async () => {
      const error = createAxiosError(418); // I'm a teapot

      try {
        await errorInterceptor(error);
      } catch (e) {
        expect((e as ApiError).message).toContain('Request failed');
      }
    });
  });

  describe('error logging', () => {
    it('should log error details to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
      const error: AxiosError = {
        message: 'Network Error',
        code: 'ERR_NETWORK',
        config: { url: 'http://localhost/api/test', method: 'get' },
        isAxiosError: true,
        toJSON: () => ({}),
      } as AxiosError;

      try {
        await errorInterceptor(error);
      } catch {}

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[API Error]'),
        expect.objectContaining({
          url: 'http://localhost/api/test',
          method: 'get',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should include status code in error log', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
      const error: AxiosError = {
        message: 'Unauthorized',
        code: 'ERR_NETWORK',
        config: { url: 'http://localhost/api/test' },
        response: { status: 401, data: {}, headers: {} },
        isAxiosError: true,
        toJSON: () => ({}),
      } as AxiosError;

      try {
        await errorInterceptor(error);
      } catch {}

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ status: 401 })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('error rejection', () => {
    it('should return rejected promise', async () => {
      const error: AxiosError = {
        message: 'Test error',
        code: 'ERR_NETWORK',
        config: {},
        isAxiosError: true,
        toJSON: () => ({}),
      } as AxiosError;

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

      const result = errorInterceptor(error);
      expect(result).toBeInstanceOf(Promise);

      try {
        await result;
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
      }

      consoleSpy.mockRestore();
    });

    it('should preserve original error in ApiError', async () => {
      const originalError: AxiosError = {
        message: 'Original error',
        code: 'ERR_NETWORK',
        config: { url: 'http://localhost' },
        isAxiosError: true,
        toJSON: () => ({}),
      } as AxiosError;

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

      try {
        await errorInterceptor(originalError);
      } catch (e) {
        expect((e as ApiError).originalError).toBe(originalError);
      }

      consoleSpy.mockRestore();
    });
  });
});
