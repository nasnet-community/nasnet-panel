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

import { useCallback, useMemo, useState } from 'react';
import { WELL_KNOWN_PORTS } from '@nasnet/core/constants';
import {
  type ServicePortDefinition,
  type CustomServicePortInput,
  type ServiceGroup,
  type ServiceGroupInput,
  mergeServices,
  hasBuiltInConflict,
  hasCustomConflict,
  hasGroupNameConflict,
} from '@nasnet/core/types';

// ============================================================================
// localStorage Keys
// ============================================================================

const STORAGE_KEYS = {
  CUSTOM_SERVICES: 'nasnet.firewall.customServices',
  SERVICE_GROUPS: 'nasnet.firewall.serviceGroups',
} as const;

// ============================================================================
// Storage Utilities
// ============================================================================

/**
 * Loads data from localStorage with error handling and validation
 */
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Failed to load from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Saves data to localStorage with error handling
 */
function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save to localStorage (${key}):`, error);
  }
}

// ============================================================================
// Hook Interface
// ============================================================================

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

// ============================================================================
// Main Hook
// ============================================================================

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
export function useCustomServices(): UseCustomServicesReturn {
  // ============================================================================
  // State Management
  // ============================================================================

  // Load custom services from localStorage
  const [customServices, setCustomServices] = useState<ServicePortDefinition[]>(() =>
    loadFromStorage<ServicePortDefinition[]>(STORAGE_KEYS.CUSTOM_SERVICES, [])
  );

  // Load service groups from localStorage
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>(() =>
    loadFromStorage<ServiceGroup[]>(STORAGE_KEYS.SERVICE_GROUPS, [])
  );

  // ============================================================================
  // Built-in Services
  // ============================================================================

  // Convert WELL_KNOWN_PORTS to ServicePortDefinition format
  const builtInServices: ServicePortDefinition[] = useMemo(
    () =>
      WELL_KNOWN_PORTS.map((port) => ({
        port: port.port,
        service: port.service,
        protocol: port.protocol as 'tcp' | 'udp' | 'both',
        category: port.category as
          | 'web'
          | 'secure'
          | 'database'
          | 'messaging'
          | 'mail'
          | 'network'
          | 'system'
          | 'containers'
          | 'mikrotik'
          | 'custom',
        description: port.description,
        isBuiltIn: true,
      })),
    []
  );

  // ============================================================================
  // Merged Services
  // ============================================================================

  // Merge built-in (read-only) + custom (editable)
  const allServices = useMemo(
    () => mergeServices(builtInServices, customServices),
    [builtInServices, customServices]
  );

  // ============================================================================
  // Service CRUD Operations
  // ============================================================================

  /**
   * Add a new custom service
   * @throws {Error} If service name conflicts with built-in or custom services
   */
  const addService = useCallback(
    (input: CustomServicePortInput) => {
      // Validate no conflicts with built-in services
      if (hasBuiltInConflict(input.service, builtInServices)) {
        throw new Error(
          `Service name "${input.service}" conflicts with a built-in service. Please choose a different name.`
        );
      }

      // Validate no conflicts with existing custom services
      if (hasCustomConflict(input.service, customServices)) {
        throw new Error(
          `Service name "${input.service}" already exists. Please choose a different name.`
        );
      }

      // Create new service with metadata
      const newService: ServicePortDefinition = {
        ...input,
        category: 'custom',
        isBuiltIn: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update state and persist
      const updated = [...customServices, newService];
      setCustomServices(updated);
      saveToStorage(STORAGE_KEYS.CUSTOM_SERVICES, updated);
    },
    [customServices, builtInServices]
  );

  /**
   * Update an existing custom service
   * @throws {Error} If service not found or name conflicts
   */
  const updateService = useCallback(
    (port: number, input: CustomServicePortInput) => {
      // Find existing service
      const existingIndex = customServices.findIndex((s) => s.port === port && !s.isBuiltIn);
      if (existingIndex === -1) {
        throw new Error(`Custom service with port ${port} not found.`);
      }

      // Validate no conflicts with built-in services
      if (hasBuiltInConflict(input.service, builtInServices)) {
        throw new Error(
          `Service name "${input.service}" conflicts with a built-in service. Please choose a different name.`
        );
      }

      // Validate no conflicts with other custom services (exclude current port)
      if (hasCustomConflict(input.service, customServices, port)) {
        throw new Error(
          `Service name "${input.service}" already exists. Please choose a different name.`
        );
      }

      // Update service with new data
      const updatedService: ServicePortDefinition = {
        ...customServices[existingIndex],
        ...input,
        updatedAt: new Date().toISOString(),
      };

      // Update state and persist
      const updated = [...customServices];
      updated[existingIndex] = updatedService;
      setCustomServices(updated);
      saveToStorage(STORAGE_KEYS.CUSTOM_SERVICES, updated);
    },
    [customServices, builtInServices]
  );

  /**
   * Delete a custom service
   * @throws {Error} If service not found or is built-in
   */
  const deleteService = useCallback(
    (port: number) => {
      // Find service
      const serviceIndex = customServices.findIndex((s) => s.port === port && !s.isBuiltIn);
      if (serviceIndex === -1) {
        throw new Error(`Custom service with port ${port} not found or is read-only.`);
      }

      // Remove from array
      const updated = customServices.filter((s) => s.port !== port);
      setCustomServices(updated);
      saveToStorage(STORAGE_KEYS.CUSTOM_SERVICES, updated);
    },
    [customServices]
  );

  // ============================================================================
  // Service Group CRUD Operations
  // ============================================================================

  /**
   * Create a new service group
   * @throws {Error} If group name conflicts
   */
  const createGroup = useCallback(
    (input: ServiceGroupInput) => {
      // Validate no name conflicts
      if (hasGroupNameConflict(input.name, serviceGroups)) {
        throw new Error(
          `Service group "${input.name}" already exists. Please choose a different name.`
        );
      }

      // Create new group with metadata
      const newGroup: ServiceGroup = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update state and persist
      const updated = [...serviceGroups, newGroup];
      setServiceGroups(updated);
      saveToStorage(STORAGE_KEYS.SERVICE_GROUPS, updated);
    },
    [serviceGroups]
  );

  /**
   * Update an existing service group
   * @throws {Error} If group not found or name conflicts
   */
  const updateGroup = useCallback(
    (id: string, input: ServiceGroupInput) => {
      // Find existing group
      const existingIndex = serviceGroups.findIndex((g) => g.id === id);
      if (existingIndex === -1) {
        throw new Error(`Service group with ID ${id} not found.`);
      }

      // Validate no name conflicts (exclude current group)
      if (hasGroupNameConflict(input.name, serviceGroups, id)) {
        throw new Error(
          `Service group "${input.name}" already exists. Please choose a different name.`
        );
      }

      // Update group with new data
      const updatedGroup: ServiceGroup = {
        ...serviceGroups[existingIndex],
        ...input,
        updatedAt: new Date().toISOString(),
      };

      // Update state and persist
      const updated = [...serviceGroups];
      updated[existingIndex] = updatedGroup;
      setServiceGroups(updated);
      saveToStorage(STORAGE_KEYS.SERVICE_GROUPS, updated);
    },
    [serviceGroups]
  );

  /**
   * Delete a service group
   * @throws {Error} If group not found
   */
  const deleteGroup = useCallback(
    (id: string) => {
      // Find group
      const groupIndex = serviceGroups.findIndex((g) => g.id === id);
      if (groupIndex === -1) {
        throw new Error(`Service group with ID ${id} not found.`);
      }

      // Remove from array
      const updated = serviceGroups.filter((g) => g.id !== id);
      setServiceGroups(updated);
      saveToStorage(STORAGE_KEYS.SERVICE_GROUPS, updated);
    },
    [serviceGroups]
  );

  // ============================================================================
  // Return Interface
  // ============================================================================

  return {
    services: allServices,
    customServices,
    serviceGroups,
    addService,
    updateService,
    deleteService,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
