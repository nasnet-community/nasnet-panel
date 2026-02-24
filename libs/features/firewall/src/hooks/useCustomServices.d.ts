/**
 * Custom Services Hook
 *
 * Manages custom service port definitions and service groups in localStorage.
 * Merges built-in services from WELL_KNOWN_PORTS with user-defined custom services.
 *
 * @description
 * Architecture:
 * - Built-in services (read-only, from WELL_KNOWN_PORTS) + Custom services (editable)
 * - Service groups for bulk selection (e.g., "web" → [80, 443, 8080])
 * - localStorage persistence with automatic sync
 * - Conflict detection (case-insensitive name matching)
 *
 * @module @nasnet/features/firewall/hooks/useCustomServices
 */
import { type ServicePortDefinition, type CustomServicePortInput, type ServiceGroup, type ServiceGroupInput } from '@nasnet/core/types';
export interface UseCustomServicesReturn {
    /** All services (built-in + custom, merged) */
    services: ServicePortDefinition[];
    /** Custom services only (user-editable) */
    customServices: ServicePortDefinition[];
    /** Service groups */
    serviceGroups: ServiceGroup[];
    /** Add a new custom service */
    addService: (input: CustomServicePortInput) => void;
    /** Update an existing custom service */
    updateService: (port: number, input: CustomServicePortInput) => void;
    /** Delete a custom service */
    deleteService: (port: number) => void;
    /** Create a new service group */
    createGroup: (input: ServiceGroupInput) => void;
    /** Update an existing service group */
    updateGroup: (id: string, input: ServiceGroupInput) => void;
    /** Delete a service group */
    deleteGroup: (id: string) => void;
}
/**
 * Manages custom service ports and service groups
 *
 * @example
 * ```tsx
 * const {
 *   services,
 *   customServices,
 *   serviceGroups,
 *   addService,
 *   updateService,
 *   deleteService,
 *   createGroup,
 *   updateGroup,
 *   deleteGroup,
 * } = useCustomServices();
 *
 * // Add a custom service
 * addService({
 *   port: 9999,
 *   service: 'my-app',
 *   protocol: 'tcp',
 *   description: 'My custom application',
 * });
 *
 * // Create a service group
 * createGroup({
 *   name: 'web-stack',
 *   description: 'Common web services',
 *   ports: [80, 443, 8080],
 *   protocol: 'tcp',
 * });
 * ```
 */
export declare function useCustomServices(): UseCustomServicesReturn;
//# sourceMappingURL=useCustomServices.d.ts.map