import { describe, it, expect } from 'vitest';
import {
  ServicePortDefinitionSchema,
  CustomServicePortInputSchema,
  ServiceGroupSchema,
  ServiceGroupInputSchema,
  ServicePortProtocolSchema,
  ServicePortCategorySchema,
  hasBuiltInConflict,
  hasCustomConflict,
  mergeServices,
  findServiceByPort,
  findServiceByName,
  formatPortList,
  expandGroupToPorts,
  hasGroupNameConflict,
  DEFAULT_CUSTOM_SERVICE_INPUT,
  DEFAULT_SERVICE_GROUP_INPUT,
  type ServicePortDefinition,
  type ServiceGroup,
} from './service-port.types';

/**
 * Service Port Types - Schema Validation Tests
 *
 * Comprehensive tests for Zod schemas and utility functions.
 * Ensures proper validation, conflict detection, and data integrity.
 */

describe('ServicePortProtocolSchema', () => {
  it('should accept valid protocols', () => {
    expect(() => ServicePortProtocolSchema.parse('tcp')).not.toThrow();
    expect(() => ServicePortProtocolSchema.parse('udp')).not.toThrow();
    expect(() => ServicePortProtocolSchema.parse('both')).not.toThrow();
  });

  it('should reject invalid protocols', () => {
    expect(() => ServicePortProtocolSchema.parse('icmp')).toThrow();
    expect(() => ServicePortProtocolSchema.parse('http')).toThrow();
    expect(() => ServicePortProtocolSchema.parse('')).toThrow();
  });
});

describe('ServicePortCategorySchema', () => {
  it('should accept valid categories', () => {
    const validCategories = [
      'web',
      'secure',
      'database',
      'messaging',
      'mail',
      'network',
      'system',
      'containers',
      'mikrotik',
      'custom',
    ];

    validCategories.forEach((category) => {
      expect(() => ServicePortCategorySchema.parse(category)).not.toThrow();
    });
  });

  it('should reject invalid categories', () => {
    expect(() => ServicePortCategorySchema.parse('unknown')).toThrow();
    expect(() => ServicePortCategorySchema.parse('gaming')).toThrow();
    expect(() => ServicePortCategorySchema.parse('')).toThrow();
  });
});

describe('ServicePortDefinitionSchema', () => {
  it('should accept valid service port definition', () => {
    const validService = {
      port: 8080,
      service: 'my-app',
      protocol: 'tcp',
      category: 'custom',
      description: 'My custom application',
      builtIn: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = ServicePortDefinitionSchema.parse(validService);
    expect(result.port).toBe(8080);
    expect(result.service).toBe('my-app');
    expect(result.protocol).toBe('tcp');
  });

  it('should default builtIn to false', () => {
    const service = {
      port: 9999,
      service: 'test-service',
      protocol: 'udp',
      category: 'custom',
    };

    const result = ServicePortDefinitionSchema.parse(service);
    expect(result.builtIn).toBe(false);
  });

  it('should reject invalid port numbers', () => {
    const invalidPorts = [0, -1, 65536, 70000, 1.5, NaN];

    invalidPorts.forEach((port) => {
      const service = {
        port,
        service: 'test',
        protocol: 'tcp',
        category: 'custom',
      };

      expect(() => ServicePortDefinitionSchema.parse(service)).toThrow();
    });
  });

  it('should reject invalid service names', () => {
    const invalidNames = [
      '',
      ' ',
      'service with spaces',
      'service@special',
      'service!',
      '-starts-with-hyphen',
      '_starts-with-underscore',
      'a'.repeat(101), // > 100 chars
    ];

    invalidNames.forEach((service) => {
      const def = {
        port: 8080,
        service,
        protocol: 'tcp',
        category: 'custom',
      };

      expect(() => ServicePortDefinitionSchema.parse(def)).toThrow();
    });
  });

  it('should accept valid service names', () => {
    const validNames = [
      'my-app',
      'web_server',
      'api-v2',
      'service123',
      'MyApp',
      'HTTP',
      'a', // Single char
      'a'.repeat(100), // Exactly 100 chars
    ];

    validNames.forEach((service) => {
      const def = {
        port: 8080,
        service,
        protocol: 'tcp',
        category: 'custom',
      };

      expect(() => ServicePortDefinitionSchema.parse(def)).not.toThrow();
    });
  });

  it('should reject descriptions longer than 500 characters', () => {
    const longDescription = 'a'.repeat(501);
    const service = {
      port: 8080,
      service: 'test',
      protocol: 'tcp',
      category: 'custom',
      description: longDescription,
    };

    expect(() => ServicePortDefinitionSchema.parse(service)).toThrow();
  });

  it('should accept ISO 8601 datetime strings', () => {
    const service = {
      port: 8080,
      service: 'test',
      protocol: 'tcp',
      category: 'custom',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
    };

    expect(() => ServicePortDefinitionSchema.parse(service)).not.toThrow();
  });
});

describe('CustomServicePortInputSchema', () => {
  it('should accept valid custom service input', () => {
    const validInput = {
      port: 9999,
      service: 'my-custom-app',
      protocol: 'tcp',
      description: 'My custom application',
    };

    const result = CustomServicePortInputSchema.parse(validInput);
    expect(result.port).toBe(9999);
    expect(result.service).toBe('my-custom-app');
  });

  it('should not include builtIn or timestamps', () => {
    const input = {
      port: 9999,
      service: 'test',
      protocol: 'tcp',
    };

    const result = CustomServicePortInputSchema.parse(input);
    expect(result).not.toHaveProperty('builtIn');
    expect(result).not.toHaveProperty('createdAt');
    expect(result).not.toHaveProperty('updatedAt');
  });

  it('should make description optional', () => {
    const input = {
      port: 9999,
      service: 'test',
      protocol: 'tcp',
    };

    expect(() => CustomServicePortInputSchema.parse(input)).not.toThrow();
  });
});

describe('ServiceGroupSchema', () => {
  it('should accept valid service group', () => {
    const validGroup = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'web-services',
      description: 'Common web services',
      ports: [80, 443, 8080],
      protocol: 'tcp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = ServiceGroupSchema.parse(validGroup);
    expect(result.name).toBe('web-services');
    expect(result.ports).toHaveLength(3);
  });

  it('should reject invalid UUIDs', () => {
    const group = {
      id: 'not-a-uuid',
      name: 'test',
      ports: [80],
      protocol: 'tcp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(() => ServiceGroupSchema.parse(group)).toThrow();
  });

  it('should require at least one port', () => {
    const group = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'test',
      ports: [],
      protocol: 'tcp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(() => ServiceGroupSchema.parse(group)).toThrow(/at least one port/i);
  });

  it('should reject duplicate ports', () => {
    const group = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'test',
      ports: [80, 443, 80], // Duplicate 80
      protocol: 'tcp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(() => ServiceGroupSchema.parse(group)).toThrow(/duplicate/i);
  });

  it('should reject invalid port numbers in group', () => {
    const group = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'test',
      ports: [80, 65536], // 65536 is invalid
      protocol: 'tcp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(() => ServiceGroupSchema.parse(group)).toThrow();
  });
});

describe('ServiceGroupInputSchema', () => {
  it('should omit id and timestamps', () => {
    const input = {
      name: 'test-group',
      description: 'Test',
      ports: [80, 443],
      protocol: 'tcp',
    };

    const result = ServiceGroupInputSchema.parse(input);
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('createdAt');
    expect(result).not.toHaveProperty('updatedAt');
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('hasBuiltInConflict', () => {
  const builtInServices: ServicePortDefinition[] = [
    { port: 80, service: 'HTTP', protocol: 'tcp', category: 'web', builtIn: true },
    { port: 443, service: 'HTTPS', protocol: 'tcp', category: 'web', builtIn: true },
  ];

  it('should detect case-insensitive conflicts with built-in services', () => {
    expect(hasBuiltInConflict('http', builtInServices)).toBe(true);
    expect(hasBuiltInConflict('HTTP', builtInServices)).toBe(true);
    expect(hasBuiltInConflict('HtTp', builtInServices)).toBe(true);
    expect(hasBuiltInConflict('https', builtInServices)).toBe(true);
  });

  it('should return false for non-conflicting names', () => {
    expect(hasBuiltInConflict('my-app', builtInServices)).toBe(false);
    expect(hasBuiltInConflict('custom-service', builtInServices)).toBe(false);
  });

  it('should trim whitespace', () => {
    expect(hasBuiltInConflict('  http  ', builtInServices)).toBe(true);
  });
});

describe('hasCustomConflict', () => {
  const customServices: ServicePortDefinition[] = [
    { port: 8080, service: 'my-app', protocol: 'tcp', category: 'custom', builtIn: false },
    { port: 9000, service: 'custom-service', protocol: 'udp', category: 'custom', builtIn: false },
  ];

  it('should detect case-insensitive conflicts with custom services', () => {
    expect(hasCustomConflict('my-app', customServices)).toBe(true);
    expect(hasCustomConflict('MY-APP', customServices)).toBe(true);
    expect(hasCustomConflict('My-App', customServices)).toBe(true);
  });

  it('should return false for non-conflicting names', () => {
    expect(hasCustomConflict('another-app', customServices)).toBe(false);
  });

  it('should exclude port when updating existing service', () => {
    // When editing service on port 8080, don't conflict with itself
    expect(hasCustomConflict('my-app', customServices, 8080)).toBe(false);
    // But still conflict with different port
    expect(hasCustomConflict('my-app', customServices, 9999)).toBe(true);
  });
});

describe('mergeServices', () => {
  const builtInServices: ServicePortDefinition[] = [
    { port: 80, service: 'HTTP', protocol: 'tcp', category: 'web', builtIn: true },
    { port: 443, service: 'HTTPS', protocol: 'tcp', category: 'web', builtIn: true },
  ];

  const customServices: ServicePortDefinition[] = [
    { port: 8080, service: 'my-app', protocol: 'tcp', category: 'custom', builtIn: false },
  ];

  it('should merge built-in and custom services', () => {
    const merged = mergeServices(builtInServices, customServices);
    expect(merged).toHaveLength(3);
    expect(merged[0].service).toBe('HTTP');
    expect(merged[1].service).toBe('HTTPS');
    expect(merged[2].service).toBe('my-app');
  });

  it('should preserve built-in flag', () => {
    const merged = mergeServices(builtInServices, customServices);
    expect(merged[0].builtIn).toBe(true);
    expect(merged[1].builtIn).toBe(true);
    expect(merged[2].builtIn).toBe(false);
  });
});

describe('findServiceByPort', () => {
  const services: ServicePortDefinition[] = [
    { port: 80, service: 'HTTP', protocol: 'tcp', category: 'web', builtIn: true },
    { port: 443, service: 'HTTPS', protocol: 'tcp', category: 'web', builtIn: true },
    { port: 8080, service: 'my-app', protocol: 'tcp', category: 'custom', builtIn: false },
  ];

  it('should find service by port number', () => {
    const http = findServiceByPort(80, services);
    expect(http?.service).toBe('HTTP');

    const myApp = findServiceByPort(8080, services);
    expect(myApp?.service).toBe('my-app');
  });

  it('should return undefined for non-existent port', () => {
    const notFound = findServiceByPort(9999, services);
    expect(notFound).toBeUndefined();
  });
});

describe('findServiceByName', () => {
  const services: ServicePortDefinition[] = [
    { port: 80, service: 'HTTP', protocol: 'tcp', category: 'web', builtIn: true },
    { port: 8080, service: 'my-app', protocol: 'tcp', category: 'custom', builtIn: false },
  ];

  it('should find service by name (case-insensitive)', () => {
    expect(findServiceByName('http', services)?.port).toBe(80);
    expect(findServiceByName('HTTP', services)?.port).toBe(80);
    expect(findServiceByName('HtTp', services)?.port).toBe(80);
    expect(findServiceByName('my-app', services)?.port).toBe(8080);
  });

  it('should return undefined for non-existent name', () => {
    expect(findServiceByName('not-found', services)).toBeUndefined();
  });

  it('should trim whitespace', () => {
    expect(findServiceByName('  http  ', services)?.port).toBe(80);
  });
});

describe('formatPortList', () => {
  it('should format ports as comma-separated sorted list', () => {
    expect(formatPortList([443, 80, 8080])).toBe('80, 443, 8080');
    expect(formatPortList([9000, 8000, 7000])).toBe('7000, 8000, 9000');
  });

  it('should handle single port', () => {
    expect(formatPortList([80])).toBe('80');
  });

  it('should handle empty array', () => {
    expect(formatPortList([])).toBe('');
  });
});

describe('expandGroupToPorts', () => {
  const webGroup: ServiceGroup = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'web',
    ports: [443, 80, 8080],
    protocol: 'tcp',
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-01-15T10:30:00.000Z',
  };

  it('should expand group to sorted port string', () => {
    expect(expandGroupToPorts(webGroup)).toBe('80, 443, 8080');
  });
});

describe('hasGroupNameConflict', () => {
  const existingGroups: ServiceGroup[] = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'web',
      ports: [80, 443],
      protocol: 'tcp',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
    },
    {
      id: '223e4567-e89b-12d3-a456-426614174000',
      name: 'database',
      ports: [3306, 5432],
      protocol: 'tcp',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
    },
  ];

  it('should detect case-insensitive name conflicts', () => {
    expect(hasGroupNameConflict('web', existingGroups)).toBe(true);
    expect(hasGroupNameConflict('WEB', existingGroups)).toBe(true);
    expect(hasGroupNameConflict('Database', existingGroups)).toBe(true);
  });

  it('should return false for non-conflicting names', () => {
    expect(hasGroupNameConflict('mail', existingGroups)).toBe(false);
    expect(hasGroupNameConflict('custom-group', existingGroups)).toBe(false);
  });

  it('should exclude current group when editing', () => {
    // When editing group with id 123e..., don't conflict with itself
    expect(hasGroupNameConflict('web', existingGroups, '123e4567-e89b-12d3-a456-426614174000')).toBe(false);
    // But still conflict with different group
    expect(hasGroupNameConflict('web', existingGroups, '999e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });
});

describe('DEFAULT_CUSTOM_SERVICE_INPUT', () => {
  it('should have valid default values', () => {
    expect(DEFAULT_CUSTOM_SERVICE_INPUT.port).toBe(8080);
    expect(DEFAULT_CUSTOM_SERVICE_INPUT.service).toBe('');
    expect(DEFAULT_CUSTOM_SERVICE_INPUT.protocol).toBe('tcp');
    expect(DEFAULT_CUSTOM_SERVICE_INPUT.description).toBe('');
  });

  it('should pass schema validation', () => {
    const withRequiredFields = {
      ...DEFAULT_CUSTOM_SERVICE_INPUT,
      service: 'test-service',
    };
    expect(() => CustomServicePortInputSchema.parse(withRequiredFields)).not.toThrow();
  });
});

describe('DEFAULT_SERVICE_GROUP_INPUT', () => {
  it('should have valid default values', () => {
    expect(DEFAULT_SERVICE_GROUP_INPUT.name).toBe('');
    expect(DEFAULT_SERVICE_GROUP_INPUT.description).toBe('');
    expect(DEFAULT_SERVICE_GROUP_INPUT.ports).toEqual([]);
    expect(DEFAULT_SERVICE_GROUP_INPUT.protocol).toBe('tcp');
  });
});
