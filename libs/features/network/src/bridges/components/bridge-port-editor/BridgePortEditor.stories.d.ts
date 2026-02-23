/**
 * Storybook stories for BridgePortEditor.
 *
 * BridgePortEditor is a Dialog-based form for configuring VLAN and STP
 * settings on a single bridge port. It internally calls `useUpdateBridgePort`
 * (Apollo mutation), which requires a live GraphQL provider.
 *
 * To make the stories self-contained, this file defines a
 * `BridgePortEditorPreview` wrapper that accepts a plain `onSave` callback
 * and renders the same form layout without the Apollo hook – mirroring the
 * same technique used in ConnectionIndicator.stories.tsx.
 *
 * Stories cover:
 *   - Access port (PVID=1, admit-all, no VLANs, edge=true)
 *   - Trunk port (tagged VLANs, ingress filtering)
 *   - PVID misconfiguration warning
 *   - STP-focused port (path cost set, not edge)
 *   - Closed dialog
 *   - Null port (renders nothing)
 */
import { z } from 'zod';
import type { Meta, StoryObj } from '@storybook/react';
declare const schema: z.ZodEffects<z.ZodObject<{
    pvid: z.ZodNumber;
    frameTypes: z.ZodEnum<["ADMIT_ALL", "ADMIT_ONLY_UNTAGGED_AND_PRIORITY", "ADMIT_ONLY_VLAN_TAGGED"]>;
    ingressFiltering: z.ZodBoolean;
    taggedVlans: z.ZodArray<z.ZodNumber, "many">;
    untaggedVlans: z.ZodArray<z.ZodNumber, "many">;
    edge: z.ZodBoolean;
    pathCost: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    pvid: number;
    edge: boolean;
    frameTypes: "ADMIT_ALL" | "ADMIT_ONLY_UNTAGGED_AND_PRIORITY" | "ADMIT_ONLY_VLAN_TAGGED";
    ingressFiltering: boolean;
    taggedVlans: number[];
    untaggedVlans: number[];
    pathCost?: number | undefined;
}, {
    pvid: number;
    edge: boolean;
    frameTypes: "ADMIT_ALL" | "ADMIT_ONLY_UNTAGGED_AND_PRIORITY" | "ADMIT_ONLY_VLAN_TAGGED";
    ingressFiltering: boolean;
    taggedVlans: number[];
    untaggedVlans: number[];
    pathCost?: number | undefined;
}>, {
    pvid: number;
    edge: boolean;
    frameTypes: "ADMIT_ALL" | "ADMIT_ONLY_UNTAGGED_AND_PRIORITY" | "ADMIT_ONLY_VLAN_TAGGED";
    ingressFiltering: boolean;
    taggedVlans: number[];
    untaggedVlans: number[];
    pathCost?: number | undefined;
}, {
    pvid: number;
    edge: boolean;
    frameTypes: "ADMIT_ALL" | "ADMIT_ONLY_UNTAGGED_AND_PRIORITY" | "ADMIT_ONLY_VLAN_TAGGED";
    ingressFiltering: boolean;
    taggedVlans: number[];
    untaggedVlans: number[];
    pathCost?: number | undefined;
}>;
type FormData = z.infer<typeof schema>;
interface MockPort {
    id: string;
    interface: {
        id: string;
        name: string;
    };
    pvid: number | null;
    frameTypes: string | null;
    ingressFiltering: boolean | null;
    taggedVlans: number[];
    untaggedVlans: number[];
    edge: boolean | null;
    pathCost: number | null;
}
interface BridgePortEditorPreviewProps {
    port: MockPort | null;
    open: boolean;
    onClose: () => void;
    onSave?: (data: FormData) => void;
    saving?: boolean;
}
declare function StoryWrapper(props: BridgePortEditorPreviewProps): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof StoryWrapper>;
export default meta;
type Story = StoryObj<typeof StoryWrapper>;
export declare const AccessPort: Story;
export declare const TrunkPort: Story;
export declare const PvidMisconfigurationWarning: Story;
export declare const StpFocused: Story;
export declare const SavingInProgress: Story;
export declare const ClosedDialog: Story;
//# sourceMappingURL=BridgePortEditor.stories.d.ts.map