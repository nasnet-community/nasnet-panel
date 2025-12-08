import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AxiosRequestConfig } from 'axios';
import {
  authInterceptor,
  storeCredentials,
  clearCredentials,
} from '../auth';

describe('Auth Interceptor', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('storeCredentials', () => {
    it('should store credentials in localStorage', () => {
      const creds = { username: 'user', password: 'pass' };
      storeCredentials(creds);

      const stored = localStorage.getItem('nasnet:api:credentials');
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.username).toBe('user');
      expect(parsed.password).toBe('pass');
    });

    it('should throw if localStorage is unavailable', () => {
      const saveItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('QuotaExceededError');
      };

      expect(() => {
        storeCredentials({ username: 'user', password: 'pass' });
      }).toThrow();

      localStorage.setItem = saveItem;
    });
  });

  describe('clearCredentials', () => {
    it('should remove credentials from localStorage', () => {
      storeCredentials({ username: 'user', password: 'pass' });
      expect(localStorage.getItem('nasnet:api:credentials')).toBeDefined();

      clearCredentials();
      expect(localStorage.getItem('nasnet:api:credentials')).toBeNull();
    });

    it('should not throw if localStorage is unavailable', () => {
      const removeItem = localStorage.removeItem;
      localStorage.removeItem = () => {
        throw new Error('Error');
      };

      expect(() => {
        clearCredentials();
      }).not.toThrow();

      localStorage.removeItem = removeItem;
    });
  });

  describe('authInterceptor', () => {
    it('should add Authorization header with Basic auth', () => {
      storeCredentials({ username: 'testuser', password: 'testpass' });

      const config: AxiosRequestConfig = {
        url: 'http://localhost:8080/api/v1/status',
        method: 'get',
        headers: {},
      };

      const result = authInterceptor(config);

      expect(result.headers?.Authorization).toBeDefined();
      expect(result.headers?.Authorization).toMatch(/^Basic /);

      // Verify encoding: "testuser:testpass" in base64
      const expectedEncoded = btoa('testuser:testpass');
      expect(result.headers?.Authorization).toBe(`Basic ${expectedEncoded}`);
    });

    it('should not add header if no credentials stored', () => {
      const config: AxiosRequestConfig = {
        url: 'http://localhost:8080/api/v1/status',
        method: 'get',
        headers: {},
      };

      const result = authInterceptor(config);

      expect(result.headers?.Authorization).toBeUndefined();
    });

    it('should create headers object if it does not exist', () => {
      storeCredentials({ username: 'user', password: 'pass' });

      const config: AxiosRequestConfig = {
        url: 'http://localhost:8080/api/v1/status',
        method: 'get',
      };

      const result = authInterceptor(config);

      expect(result.headers).toBeDefined();
      expect(result.headers?.Authorization).toBeDefined();
    });

    it('should return config unchanged if credentials incomplete', () => {
      // Store invalid credentials
      localStorage.setItem(
        'nasnet:api:credentials',
        JSON.stringify({ username: 'user' })
      );

      const config: AxiosRequestConfig = {
        url: 'http://localhost:8080/api/v1/status',
        headers: {},
      };

      const result = authInterceptor(config);
      expect(result.headers?.Authorization).toBeUndefined();
    });

    it('should return the modified config', () => {
      storeCredentials({ username: 'user', password: 'pass' });

      const config: AxiosRequestConfig = {
        url: 'http://localhost:8080/api/v1/status',
        method: 'get',
      };

      const result = authInterceptor(config);
      expect(result).toBe(config);
    });
  });
});
