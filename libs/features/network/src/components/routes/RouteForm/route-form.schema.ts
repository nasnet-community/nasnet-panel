/**
 * RouteForm Validation Schema
 * NAS-6.5: Static Route Management
 *
 * Zod schema for route form validation using network validators.
 * Validates static route configuration according to RouterOS constraints.
 */

import { z } from 'zod';
import { cidr, ipv4, comment } from '@nasnet/core/forms';

// Route configuration constants
const DEFAULT_ROUTING_TABLE = 'main';
const DEFAULT_DISTANCE = 1;
const MAX_DISTANCE = 255;
const MIN_DISTANCE = 1;

/**
 * Route form validation schema
 *
 * Validates static route configuration with the following rules:
 * - Destination: Valid CIDR notation (e.g., 192.168.1.0/24 or 0.0.0.0/0)
 * - Gateway: Optional valid IPv4 address (displayed in technical mono font)
 * - Interface: Optional interface name (technical identifier)
 * - At least one of gateway OR interface must be provided
 * - Distance: 1-255 (default: 1) for route metric/priority
 * - Routing mark: Optional string for policy-based routing
 * - Routing table: Optional string (default: main) for routing table selection
 * - Comment: Optional string, max 255 characters for documentation
 */
export const ROUTE_FORM_SCHEMA = z
  .object({
    destination: cidr,
    gateway: ipv4.optional().nullable(),
    interface: z.string().min(1).optional().nullable(),
    distance: z
      .number()
      .int()
      .min(MIN_DISTANCE, `Distance must be at least ${MIN_DISTANCE}`)
      .max(MAX_DISTANCE, `Distance must be at most ${MAX_DISTANCE}`)
      .default(DEFAULT_DISTANCE),
    routingMark: z.string().optional().nullable(),
    routingTable: z.string().default(DEFAULT_ROUTING_TABLE),
    comment: comment.optional().nullable(),
  })
  .refine(
    (data) => {
      // At least one of gateway or interface must be provided
      const hasGateway = data.gateway !== null && data.gateway !== undefined && data.gateway !== '';
      const hasInterface =
        data.interface !== null && data.interface !== undefined && data.interface !== '';
      return hasGateway || hasInterface;
    },
    {
      message: 'Specify either a gateway IP address or interface name to complete this route',
      path: ['gateway'], // Show error on gateway field
    }
  );

/**
 * Inferred TypeScript type from schema
 */
export type RouteFormData = z.infer<typeof ROUTE_FORM_SCHEMA>;

/**
 * Default values for route form
 */
export const ROUTE_FORM_DEFAULTS: RouteFormData = {
  destination: '',
  gateway: null,
  interface: null,
  distance: DEFAULT_DISTANCE,
  routingMark: null,
  routingTable: DEFAULT_ROUTING_TABLE,
  comment: null,
};

// Backwards compatibility exports
export const routeFormSchema = ROUTE_FORM_SCHEMA;
export const routeFormDefaults = ROUTE_FORM_DEFAULTS;
