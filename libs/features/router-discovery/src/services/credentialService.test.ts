/**
 * Unit Tests for Credential Management Service
 * Tests for Epic 0.1, Stories 0-1-4, 0-1-6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateCredentials,
  saveCredentials,
  loadCredentials,
  removeCredentials,
  clearAllCredentials,
  hasCredentials,
  getRoutersWithCredentials,
  DEFAULT_CREDENTIALS,
  CredentialError,
} from './credentialService';
import type { RouterCredentials } from '@nasnet/core/types';
import { apiClient } from '@nasnet/api-client/core';

// Mock apiClient
vi.mock('@nasnet/api-client/core', () => ({
  apiClient: {
    create: vi.fn(),
    get: vi.fn(),
  },
}));

describe('credentialService', () => {
  const STORAGE_KEY = 'nasnet.router.credentials';

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('validateCredentials', () => {
    it('should return valid result on successful authentication', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            name: 'MyRouter',
            'board-name': 'hEX S',
            version: '7.10',
          },
        }),
      };

      (apiClient.create as ReturnType<typeof vi.fn>).mockReturnValue(
        mockClient
      );

      const credentials: RouterCredentials = {
        username: 'admin',
        password: 'password123',
      };

      const result = await validateCredentials('192.168.88.1', credentials);

      expect(result.isValid).toBe(true);
      expect(result.routerInfo).toEqual({
        identity: 'MyRouter',
        model: 'hEX S',
        version: '7.10',
      });
      expect(result.error).toBeUndefined();

      expect(apiClient.create).toHaveBeenCalledWith({
        baseURL: 'http://192.168.88.1',
        timeout: 10000,
        auth: {
          username: 'admin',
          password: 'password123',
        },
      });
    });

    it('should return invalid result on 401 Unauthorized', async () => {
      const mockClient = {
        get: vi.fn().mockRejectedValue({
          response: { status: 401 },
          message: 'Unauthorized',
        }),
      };

      (apiClient.create as ReturnType<typeof vi.fn>).mockReturnValue(
        mockClient
      );

      const credentials: RouterCredentials = {
        username: 'wrong',
        password: 'wrong',
      };

      const result = await validateCredentials('192.168.88.1', credentials);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid username or password');
      expect(result.routerInfo).toBeUndefined();
    });

    it('should return invalid result on connection refused', async () => {
      const mockClient = {
        get: vi.fn().mockRejectedValue({
          code: 'ECONNREFUSED',
          message: 'Connection refused',
        }),
      };

      (apiClient.create as ReturnType<typeof vi.fn>).mockReturnValue(
        mockClient
      );

      const credentials: RouterCredentials = {
        username: 'admin',
        password: 'password',
      };

      const result = await validateCredentials('192.168.1.1', credentials);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Cannot connect to router');
    });

    it('should return invalid result on timeout', async () => {
      const mockClient = {
        get: vi.fn().mockRejectedValue({
          code: 'ETIMEDOUT',
          message: 'Request timeout',
        }),
      };

      (apiClient.create as ReturnType<typeof vi.fn>).mockReturnValue(
        mockClient
      );

      const credentials: RouterCredentials = {
        username: 'admin',
        password: 'password',
      };

      const result = await validateCredentials('192.168.1.1', credentials);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Cannot connect to router');
    });

    it('should handle unknown errors gracefully', async () => {
      const mockClient = {
        get: vi.fn().mockRejectedValue(new Error('Unknown error')),
      };

      (apiClient.create as ReturnType<typeof vi.fn>).mockReturnValue(
        mockClient
      );

      const credentials: RouterCredentials = {
        username: 'admin',
        password: 'password',
      };

      const result = await validateCredentials('192.168.1.1', credentials);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('saveCredentials', () => {
    it('should save credentials to localStorage', () => {
      const credentials: RouterCredentials = {
        username: 'admin',
        password: 'secret123',
      };

      saveCredentials('router-1', credentials);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(stored['router-1']).toEqual({
        username: 'admin',
        password: 'secret123',
        savedAt: expect.any(String),
      });
    });

    it('should update existing credentials', () => {
      const credentials1: RouterCredentials = {
        username: 'admin',
        password: 'old-password',
      };
      const credentials2: RouterCredentials = {
        username: 'admin',
        password: 'new-password',
      };

      saveCredentials('router-1', credentials1);
      saveCredentials('router-1', credentials2);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(stored['router-1'].password).toBe('new-password');
    });

    it('should save multiple router credentials', () => {
      saveCredentials('router-1', { username: 'admin', password: 'pass1' });
      saveCredentials('router-2', { username: 'user', password: 'pass2' });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(Object.keys(stored)).toHaveLength(2);
      expect(stored['router-1']).toBeDefined();
      expect(stored['router-2']).toBeDefined();
    });
  });

  describe('loadCredentials', () => {
    it('should load saved credentials', () => {
      const credentials: RouterCredentials = {
        username: 'admin',
        password: 'mypassword',
      };

      saveCredentials('router-1', credentials);

      const loaded = loadCredentials('router-1');

      expect(loaded).toEqual({
        username: 'admin',
        password: 'mypassword',
      });
    });

    it('should return null for non-existent router', () => {
      const loaded = loadCredentials('non-existent');

      expect(loaded).toBeNull();
    });

    it('should return null when storage is empty', () => {
      const loaded = loadCredentials('router-1');

      expect(loaded).toBeNull();
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');

      const loaded = loadCredentials('router-1');

      expect(loaded).toBeNull();
    });
  });

  describe('removeCredentials', () => {
    it('should remove credentials for specific router', () => {
      saveCredentials('router-1', { username: 'admin', password: 'pass1' });
      saveCredentials('router-2', { username: 'user', password: 'pass2' });

      removeCredentials('router-1');

      const loaded1 = loadCredentials('router-1');
      const loaded2 = loadCredentials('router-2');

      expect(loaded1).toBeNull();
      expect(loaded2).not.toBeNull();
    });

    it('should not throw error when removing non-existent router', () => {
      expect(() => removeCredentials('non-existent')).not.toThrow();
    });
  });

  describe('clearAllCredentials', () => {
    it('should remove all saved credentials', () => {
      saveCredentials('router-1', { username: 'admin', password: 'pass1' });
      saveCredentials('router-2', { username: 'user', password: 'pass2' });

      clearAllCredentials();

      const loaded1 = loadCredentials('router-1');
      const loaded2 = loadCredentials('router-2');

      expect(loaded1).toBeNull();
      expect(loaded2).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should not throw error when storage is empty', () => {
      expect(() => clearAllCredentials()).not.toThrow();
    });
  });

  describe('hasCredentials', () => {
    it('should return true when credentials exist', () => {
      saveCredentials('router-1', { username: 'admin', password: 'pass' });

      expect(hasCredentials('router-1')).toBe(true);
    });

    it('should return false when credentials do not exist', () => {
      expect(hasCredentials('router-1')).toBe(false);
    });
  });

  describe('getRoutersWithCredentials', () => {
    it('should return array of router IDs', () => {
      saveCredentials('router-1', { username: 'admin', password: 'pass1' });
      saveCredentials('router-2', { username: 'user', password: 'pass2' });
      saveCredentials('router-3', { username: 'test', password: 'pass3' });

      const routers = getRoutersWithCredentials();

      expect(routers).toEqual(['router-1', 'router-2', 'router-3']);
    });

    it('should return empty array when no credentials saved', () => {
      const routers = getRoutersWithCredentials();

      expect(routers).toEqual([]);
    });
  });

  describe('DEFAULT_CREDENTIALS', () => {
    it('should have MikroTik default values', () => {
      expect(DEFAULT_CREDENTIALS).toEqual({
        username: 'admin',
        password: '',
      });
    });
  });

  describe('CredentialError', () => {
    it('should create error with code and message', () => {
      const error = new CredentialError('Save failed', 'SAVE_FAILED');

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Save failed');
      expect(error.code).toBe('SAVE_FAILED');
      expect(error.name).toBe('CredentialError');
    });

    it('should support all error codes', () => {
      const codes = ['SAVE_FAILED', 'REMOVE_FAILED', 'CLEAR_FAILED'] as const;

      codes.forEach((code) => {
        const error = new CredentialError(`Error: ${code}`, code);
        expect(error.code).toBe(code);
      });
    });
  });
});
