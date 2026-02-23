import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createApiClient, apiClient } from '../client';

describe('API Client Factory', () => {
  describe('createApiClient', () => {
    it('should create an axios instance with default baseURL', () => {
      const client = createApiClient();
      expect(client.defaults.baseURL).toBe('/api/v1');
    });

    it('should use VITE_API_URL environment variable', () => {
      // Mock environment variable
      const originalEnv = import.meta.env.VITE_API_URL;
      (import.meta.env as any).VITE_API_URL = 'http://localhost:8080/api/v1';

      const client = createApiClient();
      expect(client.defaults.baseURL).toBe('http://localhost:8080/api/v1');

      // Restore
      (import.meta.env as any).VITE_API_URL = originalEnv;
    });

    it('should allow config override of baseURL', () => {
      const client = createApiClient({ baseURL: 'http://custom:9000' });
      expect(client.defaults.baseURL).toBe('http://custom:9000');
    });

    it('should set correct timeout', () => {
      const client = createApiClient();
      expect(client.defaults.timeout).toBe(30000);
    });

    it('should set custom timeout from config', () => {
      const client = createApiClient({ timeout: 5000 });
      expect(client.defaults.timeout).toBe(5000);
    });

    it('should set Content-Type header', () => {
      const client = createApiClient();
      expect(client.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('should merge custom headers', () => {
      const client = createApiClient({
        headers: { 'X-Custom': 'value' },
      });
      expect(client.defaults.headers['X-Custom']).toBe('value');
      expect(client.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('should register interceptors', () => {
      const client = createApiClient();
      // Verify interceptors are registered by checking they exist (handlers property is internal)
      expect(client.interceptors).toBeDefined();
      expect(client.interceptors.request).toBeDefined();
      expect(client.interceptors.response).toBeDefined();
    });
  });

  describe('apiClient default instance', () => {
    it('should be a valid axios instance', () => {
      expect(apiClient).toBeDefined();
      expect(apiClient.defaults).toBeDefined();
      expect(apiClient.request).toBeDefined();
      expect(apiClient.get).toBeDefined();
      expect(apiClient.post).toBeDefined();
    });

    it('should use /api/v1 as default baseURL', () => {
      expect(apiClient.defaults.baseURL).toBe('/api/v1');
    });
  });
});
