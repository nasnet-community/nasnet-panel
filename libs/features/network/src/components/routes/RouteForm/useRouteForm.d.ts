/**
 * useRouteForm Hook
 * NAS-6.5: Static Route Management
 *
 * Headless logic for route form.
 * Handles gateway reachability checking, form validation, and submission.
 */
import type { RouteFormProps, ReachabilityInfo } from './types';
export declare function useRouteForm(props: RouteFormProps): {
    form: import("react-hook-form").UseFormReturn<{
        destination: string;
        distance: number;
        routingTable: string;
        interface?: string | null | undefined;
        gateway?: string | null | undefined;
        comment?: string | null | undefined;
        routingMark?: string | null | undefined;
    }, any, {
        destination: string;
        distance: number;
        routingTable: string;
        interface?: string | null | undefined;
        gateway?: string | null | undefined;
        comment?: string | null | undefined;
        routingMark?: string | null | undefined;
    }>;
    reachabilityInfo: ReachabilityInfo;
    tableOptions: string[];
    loading: boolean;
    handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
    handleCancel: () => void;
};
//# sourceMappingURL=useRouteForm.d.ts.map