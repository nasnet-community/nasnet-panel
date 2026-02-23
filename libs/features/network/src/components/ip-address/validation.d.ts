/**
 * IP Address Form Validation Schema
 * NAS-6.2: IP Address Management
 *
 * @description Provides Zod validation schemas for IP address forms with CIDR notation,
 * interface selection, and comment validation.
 */
import { z } from 'zod';
/**
 * IP Address form input schema with CIDR validation.
 *
 * @description Schema for IP address form with CIDR notation validation,
 * interface selection, optional comments, and disabled state flag.
 *
 * Validates:
 * - address: CIDR notation (e.g., "192.168.1.1/24")
 * - interfaceId: Non-empty interface identifier
 * - comment: Optional comment (max 255 chars, no control characters)
 * - disabled: Boolean flag for interface disable state
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   resolver: zodResolver(ipAddressFormSchema),
 *   defaultValues: {
 *     address: '',
 *     interfaceId: '',
 *     comment: '',
 *     disabled: false,
 *   },
 * });
 * ```
 */
export declare const ipAddressFormSchema: z.ZodObject<{
    /**
     * IP address in CIDR notation.
     * Format: 192.168.1.1/24
     * Uses the existing cidr validator from @nasnet/core/forms
     */
    address: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    /**
     * Interface ID where the IP address will be assigned.
     * Must be a non-empty string (RouterOS interface name or ID).
     */
    interfaceId: z.ZodString;
    /**
     * Optional comment for the IP address.
     * Max 255 characters, no control characters.
     * Uses the existing comment validator from @nasnet/core/forms.
     */
    comment: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    /**
     * Disabled state for the IP address.
     * If true, the IP address will be present in RouterOS but not active.
     */
    disabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    disabled: boolean;
    address: string;
    interfaceId: string;
    comment?: string | undefined;
}, {
    address: string;
    interfaceId: string;
    disabled?: boolean | undefined;
    comment?: string | undefined;
}>;
/**
 * Inferred TypeScript type from the IP address form schema.
 *
 * @description Type-safe representation of validated IP address form data.
 * Use this type for form state, submission handlers, and API mutations.
 *
 * @example
 * ```tsx
 * const handleSubmit = async (data: IpAddressFormData) => {
 *   await createIpAddress({
 *     variables: {
 *       routerId: router.id,
 *       input: data,
 *     },
 *   });
 * };
 * ```
 */
export type IpAddressFormData = z.infer<typeof ipAddressFormSchema>;
/**
 * Default values for IP address form initialization.
 *
 * @description Provides empty, valid default form values for new IP address creation.
 * Use this to initialize the form or reset after submission.
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   resolver: zodResolver(ipAddressFormSchema),
 *   defaultValues: ipAddressFormDefaults,
 * });
 * ```
 */
export declare const ipAddressFormDefaults: IpAddressFormData;
//# sourceMappingURL=validation.d.ts.map