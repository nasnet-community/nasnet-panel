/**
 * DNS Settings Form Component
 *
 * Form for configuring DNS settings including:
 * - Remote requests (with security warning)
 * - Cache size
 * - Cache usage display
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */
import { type DNSSettingsFormValues } from '../../schemas';
/**
 * DNS Settings Form Props
 */
export interface DnsSettingsFormProps {
    /** Initial form values */
    initialValues: DNSSettingsFormValues;
    /** Current cache usage in KB */
    cacheUsed: number;
    /** Cache usage percentage (0-100) */
    cacheUsedPercent: number;
    /** Callback when form is submitted */
    onSubmit: (values: DNSSettingsFormValues) => void | Promise<void>;
    /** Whether submit operation is in progress */
    loading?: boolean;
}
/**
 * DNS Settings Form
 *
 * Manages DNS configuration settings with validation and security warnings.
 *
 * Features:
 * - Remote requests toggle with security warning dialog
 * - Cache size configuration with RouterOS limits (512-10240 KB)
 * - Cache usage visualization
 * - Contextual help tooltips
 *
 * @example
 * ```tsx
 * <DnsSettingsForm
 *   initialValues={{
 *     servers: ['1.1.1.1'],
 *     allowRemoteRequests: false,
 *     cacheSize: 2048,
 *   }}
 *   cacheUsed={1024}
 *   cacheUsedPercent={50}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export declare const DnsSettingsForm: import("react").NamedExoticComponent<DnsSettingsFormProps>;
//# sourceMappingURL=DnsSettingsForm.d.ts.map