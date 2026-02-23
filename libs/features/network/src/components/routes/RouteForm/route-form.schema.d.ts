/**
 * RouteForm Validation Schema
 * NAS-6.5: Static Route Management
 *
 * Zod schema for route form validation using network validators.
 * Validates static route configuration according to RouterOS constraints.
 */
import { z } from 'zod';
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
export declare const ROUTE_FORM_SCHEMA: z.ZodEffects<z.ZodObject<{
    destination: z.ZodEffects<z.ZodString, string, string>;
    gateway: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
    interface: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    distance: z.ZodDefault<z.ZodNumber>;
    routingMark: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    routingTable: z.ZodDefault<z.ZodString>;
    comment: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
}, "strip", z.ZodTypeAny, {
    destination: string;
    distance: number;
    routingTable: string;
    interface?: string | null | undefined;
    gateway?: string | null | undefined;
    comment?: string | null | undefined;
    routingMark?: string | null | undefined;
}, {
    destination: string;
    interface?: string | null | undefined;
    gateway?: string | null | undefined;
    comment?: string | null | undefined;
    routingMark?: string | null | undefined;
    distance?: number | undefined;
    routingTable?: string | undefined;
}>, {
    destination: string;
    distance: number;
    routingTable: string;
    interface?: string | null | undefined;
    gateway?: string | null | undefined;
    comment?: string | null | undefined;
    routingMark?: string | null | undefined;
}, {
    destination: string;
    interface?: string | null | undefined;
    gateway?: string | null | undefined;
    comment?: string | null | undefined;
    routingMark?: string | null | undefined;
    distance?: number | undefined;
    routingTable?: string | undefined;
}>;
/**
 * Inferred TypeScript type from schema
 */
export type RouteFormData = z.infer<typeof ROUTE_FORM_SCHEMA>;
/**
 * Default values for route form
 */
export declare const ROUTE_FORM_DEFAULTS: RouteFormData;
export declare const routeFormSchema: z.ZodEffects<z.ZodObject<{
    destination: z.ZodEffects<z.ZodString, string, string>;
    gateway: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
    interface: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    distance: z.ZodDefault<z.ZodNumber>;
    routingMark: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    routingTable: z.ZodDefault<z.ZodString>;
    comment: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
}, "strip", z.ZodTypeAny, {
    destination: string;
    distance: number;
    routingTable: string;
    interface?: string | null | undefined;
    gateway?: string | null | undefined;
    comment?: string | null | undefined;
    routingMark?: string | null | undefined;
}, {
    destination: string;
    interface?: string | null | undefined;
    gateway?: string | null | undefined;
    comment?: string | null | undefined;
    routingMark?: string | null | undefined;
    distance?: number | undefined;
    routingTable?: string | undefined;
}>, {
    destination: string;
    distance: number;
    routingTable: string;
    interface?: string | null | undefined;
    gateway?: string | null | undefined;
    comment?: string | null | undefined;
    routingMark?: string | null | undefined;
}, {
    destination: string;
    interface?: string | null | undefined;
    gateway?: string | null | undefined;
    comment?: string | null | undefined;
    routingMark?: string | null | undefined;
    distance?: number | undefined;
    routingTable?: string | undefined;
}>;
export declare const routeFormDefaults: {
    destination: string;
    distance: number;
    routingTable: string;
    interface?: string | null | undefined;
    gateway?: string | null | undefined;
    comment?: string | null | undefined;
    routingMark?: string | null | undefined;
};
//# sourceMappingURL=route-form.schema.d.ts.map