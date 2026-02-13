import { z } from 'zod';

/**
 * Service Port Types and Schemas
 *
 * Type definitions for custom service port management, enabling users to:
 * - Define custom service names (e.g., "my-app" → port 9999)
 * - Create service groups for quick selection (e.g., "web" → ports 80, 443, 8080)
 * - Use service names instead of port numbers in firewall rules
 *
 * Architecture:
 * - ServicePortDefinition: Unified model for both built-in and custom services
 * - ServiceGroup: Collection of services for bulk selection
 * - CustomServicePortInput: Form input schema for adding custom services
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-8-implement-service-ports-management.md
 * @module @nasnet/core/types/firewall/service-port
 */

// ============================================================================
// Protocol and Category Enums
// ============================================================================

/**
 * Protocol type for service ports
 */
export const ServicePortProtocolSchema = z.enum(['tcp', 'udp', 'both']);
export type ServicePortProtocol = z.infer<typeof ServicePortProtocolSchema>;

/**
 * Category for grouping services in suggestions
 */
export const ServicePortCategorySchema = z.enum([
  'web',
  'secure',
  'database',
  'messaging',
  'mail',
  'network',
  'system',
  'containers',
  'mikrotik',
  'custom', // For user-defined services
]);
export type ServicePortCategory = z.infer<typeof ServicePortCategorySchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates port number (1-65535)
 */
const isValidPortNumber = (port: number): boolean => {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
};

/**
 * Validates service name (alphanumeric, hyphens, underscores)
 * Examples: "my-app", "web_server", "api-v2"
 */
const serviceNameRegex = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
const isValidServiceName = (name: string): boolean => {
  return serviceNameRegex.test(name) && name.length >= 1 && name.length <= 100;
};

// ============================================================================
// Core Schemas
// ============================================================================

/**
 * Unified service port definition
 *
 * Used for both built-in ports (from WELL_KNOWN_PORTS) and custom user-defined services.
 * Built-in services are read-only (builtIn=true), custom services are editable (builtIn=false).
 */
export const ServicePortDefinitionSchema = z.object({
  /** Port number (1-65535) */
  port: z.number().int().min(1).max(65535, 'Port must be between 1 and 65535'),

  /** Service name (e.g., "HTTP", "my-app") */
  service: z
    .string()
    .min(1, 'Service name is required')
    .max(100, 'Service name must be less than 100 characters')
    .refine(isValidServiceName, {
      message: 'Service name must be alphanumeric with optional hyphens/underscores',
    }),

  /** Protocol (TCP, UDP, or both) */
  protocol: ServicePortProtocolSchema,

  /** Category for grouping */
  category: ServicePortCategorySchema,

  /** Optional description */
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),

  /** Built-in flag (true = read-only, false = user-editable) */
  builtIn: z.boolean().default(false),

  /** Timestamp when service was created (ISO 8601) */
  createdAt: z.string().datetime().optional(),

  /** Timestamp when service was last updated (ISO 8601) */
  updatedAt: z.string().datetime().optional(),
});

export type ServicePortDefinition = z.infer<typeof ServicePortDefinitionSchema>;

/**
 * Custom service port input (for forms)
 *
 * Subset of ServicePortDefinition used for adding custom services.
 * Excludes built-in flag and timestamps (auto-generated).
 */
export const CustomServicePortInputSchema = z.object({
  /** Port number (1-65535) */
  port: z.number().int().min(1).max(65535, 'Port must be between 1 and 65535'),

  /** Service name (e.g., "my-app") */
  service: z
    .string()
    .min(1, 'Service name is required')
    .max(100, 'Service name must be less than 100 characters')
    .refine(isValidServiceName, {
      message: 'Service name must be alphanumeric with optional hyphens/underscores',
    }),

  /** Protocol (TCP, UDP, or both) */
  protocol: ServicePortProtocolSchema,

  /** Optional description */
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

export type CustomServicePortInput = z.infer<typeof CustomServicePortInputSchema>;

/**
 * Service group for bulk selection
 *
 * Groups multiple services together for quick selection in firewall rules.
 * Example: "web" group containing HTTP (80), HTTPS (443), HTTP-Alt (8080)
 */
export const ServiceGroupSchema = z.object({
  /** Unique identifier (UUID v4) */
  id: z.string().uuid('Invalid group ID'),

  /** Group name (e.g., "web", "database-tier") */
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be less than 100 characters')
    .refine(isValidServiceName, {
      message: 'Group name must be alphanumeric with optional hyphens/underscores',
    }),

  /** Optional description */
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),

  /** Port numbers included in group (minimum 1) */
  ports: z
    .array(z.number().int().min(1).max(65535))
    .min(1, 'Group must contain at least one port')
    .refine((ports) => ports.every(isValidPortNumber), {
      message: 'All ports must be valid (1-65535)',
    })
    .refine((ports) => new Set(ports).size === ports.length, {
      message: 'Duplicate ports not allowed in group',
    }),

  /** Protocol constraint for group (tcp, udp, or both) */
  protocol: ServicePortProtocolSchema,

  /** Timestamp when group was created (ISO 8601) */
  createdAt: z.string().datetime(),

  /** Timestamp when group was last updated (ISO 8601) */
  updatedAt: z.string().datetime(),
});

export type ServiceGroup = z.infer<typeof ServiceGroupSchema>;

/**
 * Service group input (for forms)
 *
 * Subset of ServiceGroup used for creating/editing groups.
 * Excludes id and timestamps (auto-generated).
 */
export const ServiceGroupInputSchema = ServiceGroupSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ServiceGroupInput = z.infer<typeof ServiceGroupInputSchema>;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if a service name conflicts with built-in services (case-insensitive)
 */
export function hasBuiltInConflict(
  serviceName: string,
  builtInServices: ServicePortDefinition[]
): boolean {
  const normalizedName = serviceName.toLowerCase().trim();
  return builtInServices.some(
    (service) => service.builtIn && service.service.toLowerCase() === normalizedName
  );
}

/**
 * Checks if a service name conflicts with custom services (case-insensitive)
 */
export function hasCustomConflict(
  serviceName: string,
  customServices: ServicePortDefinition[],
  excludePort?: number
): boolean {
  const normalizedName = serviceName.toLowerCase().trim();
  return customServices.some(
    (service) =>
      !service.builtIn &&
      service.service.toLowerCase() === normalizedName &&
      service.port !== excludePort
  );
}

/**
 * Merges built-in and custom services, prioritizing custom overrides
 */
export function mergeServices(
  builtInServices: ServicePortDefinition[],
  customServices: ServicePortDefinition[]
): ServicePortDefinition[] {
  // Built-in services first (read-only)
  // Custom services second (editable)
  return [...builtInServices, ...customServices];
}

/**
 * Finds a service by port number
 */
export function findServiceByPort(
  port: number,
  services: ServicePortDefinition[]
): ServicePortDefinition | undefined {
  return services.find((service) => service.port === port);
}

/**
 * Finds a service by name (case-insensitive)
 */
export function findServiceByName(
  serviceName: string,
  services: ServicePortDefinition[]
): ServicePortDefinition | undefined {
  const normalizedName = serviceName.toLowerCase().trim();
  return services.find((service) => service.service.toLowerCase() === normalizedName);
}

/**
 * Formats port list for display (e.g., "80, 443, 8080")
 */
export function formatPortList(ports: number[]): string {
  return ports.sort((a, b) => a - b).join(', ');
}

/**
 * Expands service group to comma-separated port string
 */
export function expandGroupToPorts(group: ServiceGroup): string {
  return formatPortList(group.ports);
}

/**
 * Validates that a service group name doesn't conflict with existing groups
 */
export function hasGroupNameConflict(
  groupName: string,
  existingGroups: ServiceGroup[],
  excludeId?: string
): boolean {
  const normalizedName = groupName.toLowerCase().trim();
  return existingGroups.some(
    (group) => group.name.toLowerCase() === normalizedName && group.id !== excludeId
  );
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default custom service input values
 */
export const DEFAULT_CUSTOM_SERVICE_INPUT: CustomServicePortInput = {
  port: 8080,
  service: '',
  protocol: 'tcp',
  description: '',
};

/**
 * Default service group input values
 */
export const DEFAULT_SERVICE_GROUP_INPUT: ServiceGroupInput = {
  name: '',
  description: '',
  ports: [],
  protocol: 'tcp',
};
