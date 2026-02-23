/**
 * useIPAddressForm Hook
 * NAS-6.2: IP Address Management
 *
 * Headless logic for IP address form.
 * Handles subnet calculations, conflict detection, and form submission.
 */
import type { IPAddressFormProps, SubnetCalculations, ConflictInfo } from './types';
export declare function useIPAddressForm(props: IPAddressFormProps): {
    form: import("react-hook-form").UseFormReturn<{
        disabled: boolean;
        address: string;
        interfaceId: string;
        comment?: string | undefined;
    }, any, {
        disabled: boolean;
        address: string;
        interfaceId: string;
        comment?: string | undefined;
    }>;
    subnetCalculations: SubnetCalculations | null;
    conflictInfo: ConflictInfo | null;
    conflictLoading: boolean;
    hasConflict: any;
    loading: boolean;
    handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
    onCancel: (() => void) | undefined;
};
//# sourceMappingURL=useIPAddressForm.d.ts.map