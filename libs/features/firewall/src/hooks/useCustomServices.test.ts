/**
 * Custom Services Hook Tests
 *
 * Comprehensive test suite for useCustomServices hook covering:
 * - CRUD operations (add, update, delete services/groups)
 * - Merge logic (built-in + custom services)
 * - Duplicate name validation (case-insensitive)
 * - localStorage persistence
 * - Built-in services marked read-only
 * - Error handling and edge cases
 *
 * @module @nasnet/features/firewall/hooks/useCustomServices.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCustomServices } from './useCustomServices';
import type { CustomServicePortInput, ServiceGroupInput } from '@nasnet/core/types';

// ============================================================================
// Test Setup
// ============================================================================

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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2, 9),
  },
  writable: true,
});

// ============================================================================
// Test Fixtures
// ============================================================================

const validCustomService: CustomServicePortInput = {
  port: 9999,
  service: 'my-app',
  protocol: 'tcp',
  description: 'My custom application',
};

const validServiceGroup: ServiceGroupInput = {
  name: 'web-stack',
  description: 'Common web services',
  ports: [80, 443, 8080],
  protocol: 'tcp',
};

// ============================================================================
// Tests
// ============================================================================

describe('useCustomServices', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('Initialization', () => {
    it('should initialize with empty custom services when localStorage is empty', () => {
      const { result } = renderHook(() => useCustomServices());

      expect(result.current.customServices).toEqual([]);
      expect(result.current.serviceGroups).toEqual([]);
    });

    it('should load existing custom services from localStorage', () => {
      const existingServices = [
        {
          port: 9999,
          service: 'existing-app',
          protocol: 'tcp',
          category: 'custom',
          builtIn: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      localStorageMock.setItem(
        'nasnet.firewall.customServices',
        JSON.stringify(existingServices)
      );

      const { result } = renderHook(() => useCustomServices());

      expect(result.current.customServices).toHaveLength(1);
      expect(result.current.customServices[0].service).toBe('existing-app');
    });

    it('should merge built-in services with custom services', () => {
      const { result } = renderHook(() => useCustomServices());

      // Should have built-in services (WELL_KNOWN_PORTS has ~100 entries)
      expect(result.current.services.length).toBeGreaterThan(90);

      // Built-in services should be marked as such
      const builtInHTTP = result.current.services.find((s) => s.port === 80);
      expect(builtInHTTP).toBeDefined();
      expect(builtInHTTP?.builtIn).toBe(true);
      expect(builtInHTTP?.service).toBe('HTTP');
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorageMock.setItem('nasnet.firewall.customServices', 'invalid-json');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useCustomServices());

      expect(result.current.customServices).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // ==========================================================================
  // Service CRUD Operations
  // ==========================================================================

  describe('Add Service', () => {
    it('should add a new custom service successfully', () => {
      const { result } = renderHook(() => useCustomServices());

      act(() => {
        result.current.addService(validCustomService);
      });

      expect(result.current.customServices).toHaveLength(1);
      expect(result.current.customServices[0]).toMatchObject({
        port: 9999,
        service: 'my-app',
        protocol: 'tcp',
        category: 'custom',
        builtIn: false,
      });
      expect(result.current.customServices[0].createdAt).toBeDefined();
      expect(result.current.customServices[0].updatedAt).toBeDefined();
    });

    it('should persist custom service to localStorage', () => {
      const { result } = renderHook(() => useCustomServices());

      act(() => {
        result.current.addService(validCustomService);
      });

      const stored = JSON.parse(
        localStorageMock.getItem('nasnet.firewall.customServices') || '[]'
      );
      expect(stored).toHaveLength(1);
      expect(stored[0].service).toBe('my-app');
    });

    it('should throw error when service name conflicts with built-in service', () => {
      const { result } = renderHook(() => useCustomServices());

      const conflictingService: CustomServicePortInput = {
        port: 9999,
        service: 'HTTP', // Conflicts with built-in HTTP service
        protocol: 'tcp',
      };

      expect(() => {
        act(() => {
          result.current.addService(conflictingService);
        });
      }).toThrow(/conflicts with a built-in service/);
    });

    it('should throw error when service name conflicts with custom service (case-insensitive)', () => {
      const { result } = renderHook(() => useCustomServices());

      act(() => {
        result.current.addService(validCustomService);
      });

      const conflictingService: CustomServicePortInput = {
        port: 8888,
        service: 'MY-APP', // Same name, different case
        protocol: 'tcp',
      };

      expect(() => {
        act(() => {
          result.current.addService(conflictingService);
        });
      }).toThrow(/already exists/);
    });

    it('should allow adding service with same port but different name', () => {
      const { result } = renderHook(() => useCustomServices());

      act(() => {
        result.current.addService(validCustomService);
      });

      const samePortService: CustomServicePortInput = {
        port: 9999, // Same port
        service: 'another-app', // Different name
        protocol: 'udp',
      };

      act(() => {
        result.current.addService(samePortService);
      });

      expect(result.current.customServices).toHaveLength(2);
    });
  });

  describe('Update Service', () => {
    it('should update an existing custom service successfully', () => {
      const { result } = renderHook(() => useCustomServices());

      act(() => {
        result.current.addService(validCustomService);
      });

      const updatedInput: CustomServicePortInput = {
        port: 9999,
        service: 'my-app-updated',
        protocol: 'udp',
        description: 'Updated description',
      };

      act(() => {
        result.current.updateService(9999, updatedInput);
      });

      expect(result.current.customServices).toHaveLength(1);
      expect(result.current.customServices[0]).toMatchObject({
        port: 9999,
        service: 'my-app-updated',
        protocol: 'udp',
        description: 'Updated description',
      });
      expect(result.current.customServices[0].updatedAt).toBeDefined();
    });

    it('should throw error when updating non-existent service', () => {
      const { result } = renderHook(() => useCustomServices());

      expect(() => {
        act(() => {
          result.current.updateService(9999, validCustomService);
        });
      }).toThrow(/not found/);
    });

    it('should throw error when updating service name to conflict with built-in', () => {
      const { result } = renderHook(() => useCustomServices());

      act(() => {
        result.current.addService(validCustomService);
      });

      const conflictingUpdate: CustomServicePortInput = {
        port: 9999,
        service: 'HTTPS', // Conflicts with built-in
        protocol: 'tcp',
      };

      expect(() => {
        act(() => {
          result.current.updateService(9999, conflictingUpdate);
        });
      }).toThrow(/conflicts with a built-in service/);
    });
  });

  describe('Delete Service', () => {
    it('should delete an existing custom service successfully', () => {
      const { result } = renderHook(() => useCustomServices());

      act(() => {
        result.current.addService(validCustomService);
      });

      expect(result.current.customServices).toHaveLength(1);

      act(() => {
        result.current.deleteService(9999);
      });

      expect(result.current.customServices).toHaveLength(0);
    });

    it('should persist deletion to localStorage', () => {
      const { result } = renderHook(() => useCustomServices());

      act(() => {
        result.current.addService(validCustomService);
      });

      act(() => {
        result.current.deleteService(9999);
      });

      const stored = JSON.parse(
        localStorageMock.getItem('nasnet.firewall.customServices') || '[]'
      );
      expect(stored).toHaveLength(0);
    });

    it('should throw error when deleting non-existent service', () => {
      const { result } = renderHook(() => useCustomServices());

      expect(() => {
        act(() => {
          result.current.deleteService(9999);
        });
      }).toThrow(/not found or is read-only/);
    });
  });

  // ==========================================================================
  // Service Group CRUD Operations
  // ==========================================================================

  describe('Create Group', () => {
    it('should create a new service group successfully', () => {
      const { result } = renderHook(() => useCustomServices());

      act(() => {
        result.current.createGroup(validServiceGroup);
      });

      expect(result.current.serviceGroups).toHaveLength(1);
      expect(result.current.serviceGroups[0]).toMatchObject({
        name: 'web-stack',
        description: 'Common web services',
        ports: [80, 443, 8080],
        protocol: 'tcp',
      });
      expect(result.current.serviceGroups[0].id).toBeDefined();
      expect(result.current.serviceGroups[0].createdAt).toBeDefined();
    });

    it('should persist service group to localStorage', () => {
      const { result } = renderHook(() => useCustomServices());

      act(() => {
        result.current.createGroup(validServiceGroup);
      });

      const stored = JSON.parse(
        localStorageMock.getItem('nasnet.firewall.serviceGroups') || '[]'
      );
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('web-stack');
    });

    it('should throw error when group name conflicts (case-insensitive)', () => {
      const { result } = renderHook(() => useCustomServices());

      act(() => {
        result.current.createGroup(validServiceGroup);
      });

      const conflictingGroup: ServiceGroupInput = {
        name: 'WEB-STACK', // Same name, different case
        description: 'Duplicate group',
        ports: [80],
        protocol: 'tcp',
      };

      expect(() => {
        act(() => {
          result.current.createGroup(conflictingGroup);
        });
      }).toThrow(/already exists/);
    });
  });

  describe('Update Group', () => {
    it('should update an existing service group successfully', () => {
      const { result } = renderHook(() => useCustomServices());

      let groupId: string;

      act(() => {
        result.current.createGroup(validServiceGroup);
        groupId = result.current.serviceGroups[0].id;
      });

      const updatedInput: ServiceGroupInput = {
        name: 'web-stack-updated',
        description: 'Updated description',
        ports: [80, 443],
        protocol: 'tcp',
      };

      act(() => {
        result.current.updateGroup(groupId, updatedInput);
      });

      expect(result.current.serviceGroups).toHaveLength(1);
      expect(result.current.serviceGroups[0]).toMatchObject({
        name: 'web-stack-updated',
        description: 'Updated description',
        ports: [80, 443],
      });
    });

    it('should throw error when updating non-existent group', () => {
      const { result } = renderHook(() => useCustomServices());

      expect(() => {
        act(() => {
          result.current.updateGroup('non-existent-id', validServiceGroup);
        });
      }).toThrow(/not found/);
    });
  });

  describe('Delete Group', () => {
    it('should delete an existing service group successfully', () => {
      const { result } = renderHook(() => useCustomServices());

      let groupId: string;

      act(() => {
        result.current.createGroup(validServiceGroup);
        groupId = result.current.serviceGroups[0].id;
      });

      act(() => {
        result.current.deleteGroup(groupId);
      });

      expect(result.current.serviceGroups).toHaveLength(0);
    });

    it('should persist group deletion to localStorage', () => {
      const { result } = renderHook(() => useCustomServices());

      let groupId: string;

      act(() => {
        result.current.createGroup(validServiceGroup);
        groupId = result.current.serviceGroups[0].id;
      });

      act(() => {
        result.current.deleteGroup(groupId);
      });

      const stored = JSON.parse(
        localStorageMock.getItem('nasnet.firewall.serviceGroups') || '[]'
      );
      expect(stored).toHaveLength(0);
    });

    it('should throw error when deleting non-existent group', () => {
      const { result } = renderHook(() => useCustomServices());

      expect(() => {
        act(() => {
          result.current.deleteGroup('non-existent-id');
        });
      }).toThrow(/not found/);
    });
  });

  // ==========================================================================
  // Built-in Services Tests
  // ==========================================================================

  describe('Built-in Services', () => {
    it('should mark all built-in services as read-only', () => {
      const { result } = renderHook(() => useCustomServices());

      const builtInServices = result.current.services.filter((s) => s.builtIn);
      expect(builtInServices.length).toBeGreaterThan(90); // ~100 built-in services

      builtInServices.forEach((service) => {
        expect(service.builtIn).toBe(true);
      });
    });

    it('should include MikroTik services in built-in list', () => {
      const { result } = renderHook(() => useCustomServices());

      const winbox = result.current.services.find((s) => s.port === 8291);
      const routerOSAPI = result.current.services.find((s) => s.port === 8728);
      const routerOSAPISSL = result.current.services.find((s) => s.port === 8729);

      expect(winbox).toBeDefined();
      expect(winbox?.service).toBe('Winbox');
      expect(winbox?.builtIn).toBe(true);

      expect(routerOSAPI).toBeDefined();
      expect(routerOSAPI?.service).toBe('RouterOS-API');
      expect(routerOSAPI?.builtIn).toBe(true);

      expect(routerOSAPISSL).toBeDefined();
      expect(routerOSAPISSL?.service).toBe('RouterOS-API-SSL');
      expect(routerOSAPISSL?.builtIn).toBe(true);
    });

    it('should prevent adding custom service with built-in name (case-insensitive)', () => {
      const { result } = renderHook(() => useCustomServices());

      const conflictingService: CustomServicePortInput = {
        port: 9999,
        service: 'http', // Lowercase version of built-in "HTTP"
        protocol: 'tcp',
      };

      expect(() => {
        act(() => {
          result.current.addService(conflictingService);
        });
      }).toThrow(/conflicts with a built-in service/);
    });
  });

  // ==========================================================================
  // Edge Cases and Error Handling
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle multiple custom services with different ports', () => {
      const { result } = renderHook(() => useCustomServices());

      const service1: CustomServicePortInput = {
        port: 9001,
        service: 'app-1',
        protocol: 'tcp',
      };

      const service2: CustomServicePortInput = {
        port: 9002,
        service: 'app-2',
        protocol: 'udp',
      };

      const service3: CustomServicePortInput = {
        port: 9003,
        service: 'app-3',
        protocol: 'both',
      };

      act(() => {
        result.current.addService(service1);
        result.current.addService(service2);
        result.current.addService(service3);
      });

      expect(result.current.customServices).toHaveLength(3);
    });

    it('should handle service group with large port list', () => {
      const { result } = renderHook(() => useCustomServices());

      const largeGroup: ServiceGroupInput = {
        name: 'many-ports',
        description: 'Group with many ports',
        ports: Array.from({ length: 50 }, (_, i) => 10000 + i),
        protocol: 'tcp',
      };

      act(() => {
        result.current.createGroup(largeGroup);
      });

      expect(result.current.serviceGroups).toHaveLength(1);
      expect(result.current.serviceGroups[0].ports).toHaveLength(50);
    });

    it('should maintain service order (built-in first, then custom)', () => {
      const { result } = renderHook(() => useCustomServices());

      act(() => {
        result.current.addService(validCustomService);
      });

      const builtInCount = result.current.services.filter((s) => s.builtIn).length;
      const customCount = result.current.services.filter((s) => !s.builtIn).length;

      expect(customCount).toBe(1);
      expect(builtInCount).toBeGreaterThan(90);

      // All built-in services should come before custom services
      const firstCustomIndex = result.current.services.findIndex((s) => !s.builtIn);
      const servicesBeforeCustom = result.current.services.slice(0, firstCustomIndex);
      expect(servicesBeforeCustom.every((s) => s.builtIn)).toBe(true);
    });
  });
});
