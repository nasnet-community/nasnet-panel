/**
 * ResourceLimitsForm Component
 *
 * Form for editing service instance resource limits (memory and CPU weight).
 * Uses React Hook Form + Zod validation with optimistic updates.
 */
import { type ResourceLimits } from '@nasnet/api-client/queries';
/**
 * ResourceLimitsForm props
 */
export interface ResourceLimitsFormProps {
    /** Router ID */
    routerId: string;
    /** Service instance ID */
    instanceId: string;
    /** Current resource limits */
    currentLimits?: ResourceLimits | null;
    /** Success callback */
    onSuccess?: () => void;
    /** Error callback */
    onError?: (error: Error) => void;
}
/**
 * ResourceLimitsForm component
 *
 * @description Form for editing service instance resource limits with real-time validation.
 * Uses React Hook Form + Zod for client-side validation and mutation status tracking.
 * Displays success/error states with helpful messaging. Memory values shown in monospace font.
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Real-time error messages (blur validation)
 * - Loading states with spinner
 * - Success/error messaging
 * - Reset form functionality
 * - Current limits display with applied status
 */
export declare function ResourceLimitsForm({ routerId, instanceId, currentLimits, onSuccess, onError, }: ResourceLimitsFormProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ResourceLimitsForm.d.ts.map