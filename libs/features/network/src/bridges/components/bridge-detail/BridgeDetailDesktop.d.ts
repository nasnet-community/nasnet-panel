import type { Bridge } from '@nasnet/api-client/generated';
import { type BridgeFormData } from './bridge-form';
export interface BridgeDetailDesktopProps {
    bridge: Bridge | null | undefined;
    loading: boolean;
    error: Error | null;
    open: boolean;
    onClose: () => void;
    onSubmit: (data: BridgeFormData) => Promise<void>;
    isSubmitting: boolean;
}
export declare const BridgeDetailDesktop: import("react").NamedExoticComponent<BridgeDetailDesktopProps>;
//# sourceMappingURL=BridgeDetailDesktop.d.ts.map