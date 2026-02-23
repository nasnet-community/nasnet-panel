/**
 * QuotaSettingsForm Component
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 *
 * @description
 * Form for configuring traffic quota limits with validation and error handling.
 * Supports quota periods, limit configuration in GB, warning thresholds, and
 * action selection when limits are reached. Provides visual feedback for
 * success/error states.
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Period selection (daily/weekly/monthly)
 * - Limit input in GB (converted to bytes)
 * - Warning threshold percentage
 * - Action selection with descriptions
 * - Remove quota button
 * - Success/error feedback
 *
 * Uses React Hook Form + Zod validation
 */
import * as React from 'react';
import type { TrafficQuota } from '@nasnet/api-client/generated';
/**
 * QuotaSettingsForm props
 */
export interface QuotaSettingsFormProps {
    /** Router ID */
    routerID: string;
    /** Service instance ID */
    instanceID: string;
    /** Current quota (if set) */
    currentQuota?: TrafficQuota | null;
    /** Success callback */
    onSuccess?: () => void;
    /** Error callback */
    onError?: (error: Error) => void;
    /** Additional CSS classes */
    className?: string;
}
/**
 * QuotaSettingsForm component
 *
 * Displays and manages traffic quota configuration with validation,
 * success/error feedback, and quota removal option.
 */
export declare const QuotaSettingsForm: React.NamedExoticComponent<QuotaSettingsFormProps>;
//# sourceMappingURL=QuotaSettingsForm.d.ts.map