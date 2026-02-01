/**
 * Resource Schemas Tests
 *
 * Tests for Zod validation schemas for the Universal State v2 resource model.
 */

import { describe, it, expect } from 'vitest';
import {
  ResourceCategorySchema,
  ResourceLifecycleStateSchema,
  ValidationSeveritySchema,
  RuntimeHealthSchema,
  ValidationErrorSchema,
  ValidationResultSchema,
  DeploymentStateSchema,
  RuntimeStateSchema,
  ResourceMetadataSchema,
  CreateResourceInputSchema,
  UpdateResourceInputSchema,
} from '../schemas';

describe('Resource Schemas', () => {
  describe('ResourceCategorySchema', () => {
    it('should accept valid categories', () => {
      expect(ResourceCategorySchema.parse('NETWORK')).toBe('NETWORK');
      expect(ResourceCategorySchema.parse('VPN')).toBe('VPN');
      expect(ResourceCategorySchema.parse('INFRASTRUCTURE')).toBe('INFRASTRUCTURE');
      expect(ResourceCategorySchema.parse('APPLICATION')).toBe('APPLICATION');
      expect(ResourceCategorySchema.parse('FEATURE')).toBe('FEATURE');
      expect(ResourceCategorySchema.parse('PLUGIN')).toBe('PLUGIN');
    });

    it('should reject invalid categories', () => {
      expect(() => ResourceCategorySchema.parse('INVALID')).toThrow();
      expect(() => ResourceCategorySchema.parse('')).toThrow();
      expect(() => ResourceCategorySchema.parse(123)).toThrow();
    });
  });

  describe('ResourceLifecycleStateSchema', () => {
    it('should accept all lifecycle states', () => {
      const states = [
        'DRAFT',
        'VALIDATING',
        'VALID',
        'APPLYING',
        'ACTIVE',
        'DEGRADED',
        'ERROR',
        'DEPRECATED',
        'ARCHIVED',
      ];

      states.forEach((state) => {
        expect(ResourceLifecycleStateSchema.parse(state)).toBe(state);
      });
    });

    it('should reject invalid states', () => {
      expect(() => ResourceLifecycleStateSchema.parse('PENDING')).toThrow();
      expect(() => ResourceLifecycleStateSchema.parse('running')).toThrow();
    });
  });

  describe('ValidationErrorSchema', () => {
    it('should accept valid validation errors', () => {
      const error = {
        code: 'INVALID_PORT',
        message: 'Port must be between 1 and 65535',
        field: 'configuration.listenPort',
        severity: 'ERROR' as const,
      };

      const result = ValidationErrorSchema.parse(error);
      expect(result.code).toBe('INVALID_PORT');
      expect(result.message).toBe('Port must be between 1 and 65535');
      expect(result.field).toBe('configuration.listenPort');
      expect(result.severity).toBe('ERROR');
    });

    it('should accept optional fields', () => {
      const error = {
        code: 'MISSING_KEY',
        message: 'Private key is required',
        field: 'configuration.privateKey',
        severity: 'ERROR' as const,
        suggestedFix: 'Generate a new WireGuard private key',
        docsUrl: 'https://docs.example.com/wireguard-keys',
      };

      const result = ValidationErrorSchema.parse(error);
      expect(result.suggestedFix).toBe('Generate a new WireGuard private key');
      expect(result.docsUrl).toBe('https://docs.example.com/wireguard-keys');
    });

    it('should reject missing required fields', () => {
      expect(() =>
        ValidationErrorSchema.parse({
          code: 'ERR',
          message: 'Error',
          // missing field and severity
        })
      ).toThrow();
    });
  });

  describe('ValidationResultSchema', () => {
    it('should accept valid validation result', () => {
      const result = {
        canApply: true,
        stage: 'FINAL' as const,
        errors: [],
        warnings: [],
        validatedAt: '2024-01-15T10:30:00Z',
      };

      const parsed = ValidationResultSchema.parse(result);
      expect(parsed.canApply).toBe(true);
      expect(parsed.stage).toBe('FINAL');
      expect(parsed.errors).toHaveLength(0);
    });

    it('should accept result with errors and warnings', () => {
      const result = {
        canApply: false,
        stage: 'SEMANTIC' as const,
        errors: [
          {
            code: 'ERR1',
            message: 'Error 1',
            field: 'field1',
            severity: 'ERROR' as const,
          },
        ],
        warnings: [
          {
            code: 'WARN1',
            message: 'Warning 1',
            field: 'field2',
            severity: 'WARNING' as const,
          },
        ],
        validatedAt: '2024-01-15T10:30:00Z',
        validationDurationMs: 150,
      };

      const parsed = ValidationResultSchema.parse(result);
      expect(parsed.canApply).toBe(false);
      expect(parsed.errors).toHaveLength(1);
      expect(parsed.warnings).toHaveLength(1);
      expect(parsed.validationDurationMs).toBe(150);
    });
  });

  describe('RuntimeStateSchema', () => {
    it('should accept valid runtime state', () => {
      const state = {
        isRunning: true,
        health: 'HEALTHY' as const,
        lastUpdated: '2024-01-15T10:30:00Z',
      };

      const parsed = RuntimeStateSchema.parse(state);
      expect(parsed.isRunning).toBe(true);
      expect(parsed.health).toBe('HEALTHY');
    });

    it('should accept runtime state with metrics', () => {
      const state = {
        isRunning: true,
        health: 'HEALTHY' as const,
        lastUpdated: '2024-01-15T10:30:00Z',
        metrics: {
          bytesIn: 1024000,
          bytesOut: 512000,
          packetsIn: 1000,
          packetsOut: 800,
          errors: 0,
          drops: 0,
          throughputIn: 1024,
          throughputOut: 512,
        },
        activeConnections: 5,
        uptime: 86400,
      };

      const parsed = RuntimeStateSchema.parse(state);
      expect(parsed.metrics?.bytesIn).toBe(1024000);
      expect(parsed.activeConnections).toBe(5);
      expect(parsed.uptime).toBe(86400);
    });

    it('should reject invalid health values', () => {
      const state = {
        isRunning: true,
        health: 'INVALID',
        lastUpdated: '2024-01-15T10:30:00Z',
      };

      expect(() => RuntimeStateSchema.parse(state)).toThrow();
    });
  });

  describe('CreateResourceInputSchema', () => {
    it('should accept valid create input', () => {
      const input = {
        routerId: 'router-1',
        type: 'wireguard-client',
        category: 'VPN' as const,
        configuration: {
          name: 'my-vpn',
          listenPort: 51820,
        },
      };

      const parsed = CreateResourceInputSchema.parse(input);
      expect(parsed.routerId).toBe('router-1');
      expect(parsed.type).toBe('wireguard-client');
      expect(parsed.category).toBe('VPN');
    });

    it('should accept create input with metadata', () => {
      const input = {
        routerId: 'router-1',
        type: 'wireguard-client',
        category: 'VPN' as const,
        configuration: { name: 'my-vpn' },
        metadata: {
          tags: ['production', 'vpn'],
          description: 'Production VPN client',
        },
      };

      const parsed = CreateResourceInputSchema.parse(input);
      expect(parsed.metadata?.tags).toEqual(['production', 'vpn']);
      expect(parsed.metadata?.description).toBe('Production VPN client');
    });

    it('should reject missing required fields', () => {
      expect(() =>
        CreateResourceInputSchema.parse({
          routerId: 'router-1',
          // missing type, category, configuration
        })
      ).toThrow();
    });
  });

  describe('UpdateResourceInputSchema', () => {
    it('should accept valid update input', () => {
      const input = {
        uuid: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        configuration: {
          name: 'updated-vpn',
          listenPort: 51821,
        },
      };

      const parsed = UpdateResourceInputSchema.parse(input);
      expect(parsed.uuid).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
      expect(parsed.configuration?.name).toBe('updated-vpn');
    });

    it('should accept metadata-only update', () => {
      const input = {
        uuid: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        metadata: {
          isFavorite: true,
          tags: ['important'],
        },
      };

      const parsed = UpdateResourceInputSchema.parse(input);
      expect(parsed.metadata?.isFavorite).toBe(true);
      expect(parsed.metadata?.tags).toEqual(['important']);
    });

    it('should require uuid', () => {
      expect(() =>
        UpdateResourceInputSchema.parse({
          configuration: { name: 'test' },
        })
      ).toThrow();
    });
  });
});
