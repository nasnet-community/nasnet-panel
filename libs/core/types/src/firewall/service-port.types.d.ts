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
/**
 * Protocol type for service ports
 * Supports TCP, UDP, or both protocols
 */
export declare const ServicePortProtocolSchema: z.ZodEnum<['tcp', 'udp', 'both']>;
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
export declare const ServicePortCategorySchema: z.ZodEnum<
  [
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
  ]
>;
/**
 * Type for service port category
 * @example
 * const category: ServicePortCategory = 'web';
 */
export type ServicePortCategory = z.infer<typeof ServicePortCategorySchema>;
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
export declare const isValidPortNumber: (port: number) => boolean;
/**
 * Regex pattern for valid service names
 * Allows alphanumeric characters, hyphens, and underscores
 * Must start with alphanumeric character
 */
export declare const SERVICE_NAME_REGEX: RegExp;
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
export declare const isValidServiceName: (name: string) => boolean;
/**
 * Unified service port definition
 *
 * Used for both built-in ports (from WELL_KNOWN_PORTS) and custom user-defined services.
 * Built-in services are read-only (builtIn=true), custom services are editable (builtIn=false).
 */
export declare const ServicePortDefinitionSchema: z.ZodObject<
  {
    /** Port number (1-65535) */
    port: z.ZodNumber;
    /** Service name (e.g., "HTTP", "my-app") */
    service: z.ZodEffects<z.ZodString, string, string>;
    /** Protocol (TCP, UDP, or both) */
    protocol: z.ZodEnum<['tcp', 'udp', 'both']>;
    /** Category for grouping */
    category: z.ZodEnum<
      [
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
      ]
    >;
    /** Optional description */
    description: z.ZodOptional<z.ZodString>;
    /** Built-in flag (true = read-only, false = user-editable) */
    isBuiltIn: z.ZodDefault<z.ZodBoolean>;
    /** Timestamp when service was created (ISO 8601) */
    createdAt: z.ZodOptional<z.ZodString>;
    /** Timestamp when service was last updated (ISO 8601) */
    updatedAt: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    category:
      | 'system'
      | 'custom'
      | 'network'
      | 'web'
      | 'secure'
      | 'database'
      | 'messaging'
      | 'mail'
      | 'containers'
      | 'mikrotik';
    protocol: 'both' | 'tcp' | 'udp';
    port: number;
    service: string;
    isBuiltIn: boolean;
    description?: string | undefined;
    updatedAt?: string | undefined;
    createdAt?: string | undefined;
  },
  {
    category:
      | 'system'
      | 'custom'
      | 'network'
      | 'web'
      | 'secure'
      | 'database'
      | 'messaging'
      | 'mail'
      | 'containers'
      | 'mikrotik';
    protocol: 'both' | 'tcp' | 'udp';
    port: number;
    service: string;
    description?: string | undefined;
    updatedAt?: string | undefined;
    createdAt?: string | undefined;
    isBuiltIn?: boolean | undefined;
  }
>;
export type ServicePortDefinition = z.infer<typeof ServicePortDefinitionSchema>;
/**
 * Custom service port input (for forms)
 *
 * Subset of ServicePortDefinition used for adding custom services.
 * Excludes built-in flag and timestamps (auto-generated).
 */
export declare const CustomServicePortInputSchema: z.ZodObject<
  {
    /** Port number (1-65535) */
    port: z.ZodNumber;
    /** Service name (e.g., "my-app") */
    service: z.ZodEffects<z.ZodString, string, string>;
    /** Protocol (TCP, UDP, or both) */
    protocol: z.ZodEnum<['tcp', 'udp', 'both']>;
    /** Optional description */
    description: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    protocol: 'both' | 'tcp' | 'udp';
    port: number;
    service: string;
    description?: string | undefined;
  },
  {
    protocol: 'both' | 'tcp' | 'udp';
    port: number;
    service: string;
    description?: string | undefined;
  }
>;
export type CustomServicePortInput = z.infer<typeof CustomServicePortInputSchema>;
/**
 * Service group for bulk selection
 *
 * Groups multiple services together for quick selection in firewall rules.
 * Example: "web" group containing HTTP (80), HTTPS (443), HTTP-Alt (8080)
 */
export declare const ServiceGroupSchema: z.ZodObject<
  {
    /** Unique identifier (UUID v4) */
    id: z.ZodString;
    /** Group name (e.g., "web", "database-tier") */
    name: z.ZodEffects<z.ZodString, string, string>;
    /** Optional description */
    description: z.ZodOptional<z.ZodString>;
    /** Port numbers included in group (minimum 1) */
    ports: z.ZodReadonly<
      z.ZodEffects<
        z.ZodEffects<z.ZodArray<z.ZodNumber, 'many'>, number[], number[]>,
        number[],
        number[]
      >
    >;
    /** Protocol constraint for group (tcp, udp, or both) */
    protocol: z.ZodEnum<['tcp', 'udp', 'both']>;
    /** Timestamp when group was created (ISO 8601) */
    createdAt: z.ZodString;
    /** Timestamp when group was last updated (ISO 8601) */
    updatedAt: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string;
    name: string;
    updatedAt: string;
    createdAt: string;
    protocol: 'both' | 'tcp' | 'udp';
    ports: readonly number[];
    description?: string | undefined;
  },
  {
    id: string;
    name: string;
    updatedAt: string;
    createdAt: string;
    protocol: 'both' | 'tcp' | 'udp';
    ports: readonly number[];
    description?: string | undefined;
  }
>;
export type ServiceGroup = z.infer<typeof ServiceGroupSchema>;
/**
 * Service group input (for forms)
 *
 * Subset of ServiceGroup used for creating/editing groups.
 * Excludes id and timestamps (auto-generated).
 */
export declare const ServiceGroupInputSchema: z.ZodObject<
  Omit<
    {
      /** Unique identifier (UUID v4) */
      id: z.ZodString;
      /** Group name (e.g., "web", "database-tier") */
      name: z.ZodEffects<z.ZodString, string, string>;
      /** Optional description */
      description: z.ZodOptional<z.ZodString>;
      /** Port numbers included in group (minimum 1) */
      ports: z.ZodReadonly<
        z.ZodEffects<
          z.ZodEffects<z.ZodArray<z.ZodNumber, 'many'>, number[], number[]>,
          number[],
          number[]
        >
      >;
      /** Protocol constraint for group (tcp, udp, or both) */
      protocol: z.ZodEnum<['tcp', 'udp', 'both']>;
      /** Timestamp when group was created (ISO 8601) */
      createdAt: z.ZodString;
      /** Timestamp when group was last updated (ISO 8601) */
      updatedAt: z.ZodString;
    },
    'id' | 'updatedAt' | 'createdAt'
  >,
  'strip',
  z.ZodTypeAny,
  {
    name: string;
    protocol: 'both' | 'tcp' | 'udp';
    ports: readonly number[];
    description?: string | undefined;
  },
  {
    name: string;
    protocol: 'both' | 'tcp' | 'udp';
    ports: readonly number[];
    description?: string | undefined;
  }
>;
export type ServiceGroupInput = z.infer<typeof ServiceGroupInputSchema>;
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
export declare function hasBuiltInConflict(
  serviceName: string,
  builtInServices: readonly ServicePortDefinition[]
): boolean;
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
export declare function hasCustomConflict(
  serviceName: string,
  customServices: readonly ServicePortDefinition[],
  excludePort?: number
): boolean;
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
export declare function mergeServices(
  builtInServices: readonly ServicePortDefinition[],
  customServices: readonly ServicePortDefinition[]
): ServicePortDefinition[];
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
export declare function findServiceByPort(
  port: number,
  services: readonly ServicePortDefinition[]
): ServicePortDefinition | undefined;
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
export declare function findServiceByName(
  serviceName: string,
  services: readonly ServicePortDefinition[]
): ServicePortDefinition | undefined;
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
export declare function formatPortList(ports: readonly number[]): string;
/**
 * Expands service group ports to comma-separated port string
 *
 * @param group - Service group to expand
 * @returns Formatted port string
 *
 * @example
 * expandGroupToPorts(webGroup) // Returns "80, 443, 8080"
 */
export declare function expandGroupToPorts(group: ServiceGroup): string;
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
export declare function hasGroupNameConflict(
  groupName: string,
  existingGroups: readonly ServiceGroup[],
  excludeId?: string
): boolean;
/**
 * Default custom service input values for form initialization
 * Used when creating a new custom service
 */
export declare const DEFAULT_CUSTOM_SERVICE_INPUT: {
  readonly port: 8080;
  readonly service: '';
  readonly protocol: 'tcp';
  readonly description: '';
};
/**
 * Default service group input values for form initialization
 * Used when creating a new service group
 */
export declare const DEFAULT_SERVICE_GROUP_INPUT: {
  readonly name: '';
  readonly description: '';
  readonly ports: readonly [];
  readonly protocol: 'tcp';
};
//# sourceMappingURL=service-port.types.d.ts.map
