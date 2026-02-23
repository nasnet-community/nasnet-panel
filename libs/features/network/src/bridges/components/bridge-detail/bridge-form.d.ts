import { z } from 'zod';
import type { Bridge } from '@nasnet/api-client/generated';
declare const bridgeFormSchema: z.ZodObject<{
    name: z.ZodString;
    comment: z.ZodOptional<z.ZodString>;
    protocol: z.ZodEnum<["none", "stp", "rstp", "mstp"]>;
    priority: z.ZodDefault<z.ZodNumber>;
    vlanFiltering: z.ZodDefault<z.ZodBoolean>;
    pvid: z.ZodDefault<z.ZodNumber>;
    mtu: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    protocol: "none" | "stp" | "rstp" | "mstp";
    mtu: number;
    priority: number;
    vlanFiltering: boolean;
    pvid: number;
    comment?: string | undefined;
}, {
    name: string;
    protocol: "none" | "stp" | "rstp" | "mstp";
    comment?: string | undefined;
    mtu?: number | undefined;
    priority?: number | undefined;
    vlanFiltering?: boolean | undefined;
    pvid?: number | undefined;
}>;
export type BridgeFormData = z.infer<typeof bridgeFormSchema>;
export interface BridgeFormProps {
    bridge?: Bridge | null;
    onSubmit: (data: BridgeFormData) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
}
export declare const BridgeForm: import("react").NamedExoticComponent<BridgeFormProps>;
export {};
//# sourceMappingURL=bridge-form.d.ts.map