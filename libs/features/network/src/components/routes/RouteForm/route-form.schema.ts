/**
 * RouteForm Validation Schema
 * NAS-6.5: Static Route Management
 *
 * Zod schema for route form validation using network validators.
 */

import { z } from 'zod';
import { cidr, ipv4, comment } from '@nasnet/core/forms';

/**
 * Route form validation schema
 *
 * Requirements:
 * - Destination: Valid CIDR notation (e.g., 192.168.1.0/24 or 0.0.0.0/0)
 * - Gateway: Optional valid IPv4 address
 * - Interface: Optional interface name
 * - At least one of gateway OR interface must be provided
 * - Distance: 1-255 (default: 1)
 * - Routing mark: Optional string for policy routing
 * - Routing table: Optional string (default: main)
 * - Comment: Optional string, max 255 characters
 */
export const routeFormSchema = z
  .object({
    destination: cidr,
    gateway: ipv4.optional().nullable(),
    interface: z.string().min(1).optional().nullable(),
    distance: z
      .number()
      .int()
      .min(1, 'Distance must be at least 1')
      .max(255, 'Distance must be at most 255')
      .default(1),
    routingMark: z.string().optional().nullable(),
    routingTable: z.string().default('main'),
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
      message: 'At least one of gateway or interface must be provided',
      path: ['gateway'], // Show error on gateway field
    }
  );

/**
 * Inferred TypeScript type from schema
 */
export type RouteFormData = z.infer<typeof routeFormSchema>;

/**
 * Default values for route form
 */
export const routeFormDefaults: RouteFormData = {
  destination: '',
  gateway: null,
  interface: null,
  distance: 1,
  routingMark: null,
  routingTable: 'main',
  comment: null,
};
