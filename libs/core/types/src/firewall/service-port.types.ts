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
 * Supports TCP, UDP, or both protocols
 */
export const ServicePortProtocolSchema = z.enum(['tcp', 'udp', 'both']);
/**
 * Type for service port protocol
 * @example
 * const protocol: ServicePortProtocol = 'tcp';
 */
export type ServicePortProtocol = z.infer<typeof ServicePortProtocolSchema>;

/**
 * Category for grouping services in suggestions
 * Used to organize and filter service ports by functional category
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
/**
 * Type for service port category
 * @example
 * const category: ServicePortCategory = 'web';
 */
export type ServicePortCategory = z.infer<typeof ServicePortCategorySchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates port number (1-65535)
 * Ensures port is an integer within the valid range
 *
 * @param port - Port number to validate
 * @returns True if port is valid, false otherwise
 *
 * @example
 * isValidPortNumber(80)  // Returns true
 * isValidPortNumber(99999) // Returns false
 */
export const isValidPortNumber = (port: number): boolean => {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
};

/**
 * Regex pattern for valid service names
 * Allows alphanumeric characters, hyphens, and underscores
 * Must start with alphanumeric character
 */
export const SERVICE_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

/**
 * Validates service name (alphanumeric, hyphens, underscores)
 * Names must be 1-100 characters and follow the naming pattern
 *
 * @param name - Service name to validate
 * @returns True if name is valid, false otherwise
 *
 * @example
 * isValidServiceName('my-app') // Returns true
 * isValidServiceName('web_server') // Returns true
 * isValidServiceName('-invalid') // Returns false
 */
export const isValidServiceName = (name: string): boolean => {
  return SERVICE_NAME_REGEX.test(name) && name.length >= 1 && name.length <= 100;
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
  isBuiltIn: z.boolean().default(false),

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
    })
    .readonly(),

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
 *
 * @param serviceName - Service name to check
 * @param builtInServices - Array of built-in service definitions
 * @returns True if a conflict exists, false otherwise
 *
 * @example
 * hasBuiltInConflict('HTTP', builtInServices) // Returns true if HTTP is built-in
 */
export function hasBuiltInConflict(
  serviceName: string,
  builtInServices: readonly ServicePortDefinition[]
): boolean {
  const normalizedName = serviceName.toLowerCase().trim();
  return builtInServices.some(
    (service) => service.isBuiltIn && service.service.toLowerCase() === normalizedName
  );
}

/**
 * Checks if a service name conflicts with custom services (case-insensitive)
 *
 * @param serviceName - Service name to check
 * @param customServices - Array of custom service definitions
 * @param excludePort - Optional port number to exclude from conflict check (for updates)
 * @returns True if a conflict exists, false otherwise
 *
 * @example
 * hasCustomConflict('my-app', customServices, 8080) // Excludes port 8080
 */
export function hasCustomConflict(
  serviceName: string,
  customServices: readonly ServicePortDefinition[],
  excludePort?: number
): boolean {
  const normalizedName = serviceName.toLowerCase().trim();
  return customServices.some(
    (service) =>
      !service.isBuiltIn &&
      service.service.toLowerCase() === normalizedName &&
      service.port !== excludePort
  );
}

/**
 * Merges built-in and custom services into a single array
 * Built-in services appear first, followed by custom services
 *
 * @param builtInServices - Array of built-in service definitions
 * @param customServices - Array of custom service definitions
 * @returns Merged array of service definitions
 *
 * @example
 * mergeServices(builtIn, custom) // Returns [builtIn..., custom...]
 */
export function mergeServices(
  builtInServices: readonly ServicePortDefinition[],
  customServices: readonly ServicePortDefinition[]
): ServicePortDefinition[] {
  return [...builtInServices, ...customServices];
}

/**
 * Finds a service by port number
 *
 * @param port - Port number to search for
 * @param services - Array of service definitions
 * @returns Service definition if found, undefined otherwise
 *
 * @example
 * findServiceByPort(443, services) // Returns HTTPS service
 */
export function findServiceByPort(
  port: number,
  services: readonly ServicePortDefinition[]
): ServicePortDefinition | undefined {
  return services.find((service) => service.port === port);
}

/**
 * Finds a service by name (case-insensitive)
 *
 * @param serviceName - Service name to search for
 * @param services - Array of service definitions
 * @returns Service definition if found, undefined otherwise
 *
 * @example
 * findServiceByName('HTTP', services) // Returns service named http
 */
export function findServiceByName(
  serviceName: string,
  services: readonly ServicePortDefinition[]
): ServicePortDefinition | undefined {
  const normalizedName = serviceName.toLowerCase().trim();
  return services.find((service) => service.service.toLowerCase() === normalizedName);
}

/**
 * Formats port list for display as comma-separated string
 * Sorts ports in ascending order before formatting
 *
 * @param ports - Array of port numbers
 * @returns Formatted port string
 *
 * @example
 * formatPortList([443, 80, 8080]) // Returns "80, 443, 8080"
 */
export function formatPortList(ports: readonly number[]): string {
  return [...ports].sort((a, b) => a - b).join(', ');
}

/**
 * Expands service group ports to comma-separated port string
 *
 * @param group - Service group to expand
 * @returns Formatted port string
 *
 * @example
 * expandGroupToPorts(webGroup) // Returns "80, 443, 8080"
 */
export function expandGroupToPorts(group: ServiceGroup): string {
  return formatPortList(group.ports);
}

/**
 * Validates that a service group name doesn't conflict with existing groups (case-insensitive)
 *
 * @param groupName - Group name to check
 * @param existingGroups - Array of existing service groups
 * @param excludeId - Optional group ID to exclude from conflict check (for updates)
 * @returns True if a conflict exists, false otherwise
 *
 * @example
 * hasGroupNameConflict('web', existingGroups) // Returns true if "web" group exists
 */
export function hasGroupNameConflict(
  groupName: string,
  existingGroups: readonly ServiceGroup[],
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
 * Default custom service input values for form initialization
 * Used when creating a new custom service
 */
export const DEFAULT_CUSTOM_SERVICE_INPUT = {
  port: 8080,
  service: '',
  protocol: 'tcp',
  description: '',
} as const satisfies CustomServicePortInput;

/**
 * Default service group input values for form initialization
 * Used when creating a new service group
 */
export const DEFAULT_SERVICE_GROUP_INPUT = {
  name: '',
  description: '',
  ports: [],
  protocol: 'tcp',
} as const satisfies ServiceGroupInput;
