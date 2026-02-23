/**
 * LTE Modem Configuration Form Component
 *
 * Form for configuring LTE/4G modem WAN interfaces.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 7: LTE Support)
 */
import { type LteModemFormValues } from '../../schemas/lte-modem.schema';
export interface LteModemFormProps {
    /**
     * Router ID for the configuration
     */
    routerId: string;
    /**
     * Existing LTE configuration (for editing)
     */
    initialData?: Partial<LteModemFormValues>;
    /**
     * Current signal strength in dBm (for display)
     */
    signalStrength?: number;
    /**
     * Current signal quality percentage (0-100)
     */
    signalQuality?: number;
    /**
     * Callback when configuration is successful
     */
    onSuccess?: () => void;
    /**
     * Callback when configuration is cancelled
     */
    onCancel?: () => void;
    /**
     * Optional CSS class name
     */
    className?: string;
}
/**
 * LTE Modem Configuration Form
 * @description Form for configuring LTE/4G modem WAN interfaces with APN and authentication settings
 */
export declare const LteModemForm: import("react").NamedExoticComponent<LteModemFormProps>;
//# sourceMappingURL=LteModemForm.d.ts.map