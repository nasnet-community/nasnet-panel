/**
 * Health Check Form Component
 *
 * Configure WAN health monitoring with netwatch integration.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 5: Health Check)
 *
 * @description Form for configuring WAN health checks with target IP, interval, timeout,
 * and failure threshold. Includes quick presets and real-time validation.
 */
import { type HealthCheckFormValues } from '../../schemas/health-check.schema';
export interface HealthCheckFormProps {
    routerID: string;
    wanID: string;
    gateway?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    initialValues?: Partial<HealthCheckFormValues>;
}
export declare const HealthCheckForm: import("react").MemoExoticComponent<{
    ({ routerID, wanID, gateway, onSuccess, onCancel, initialValues, }: HealthCheckFormProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
}>;
//# sourceMappingURL=HealthCheckForm.d.ts.map