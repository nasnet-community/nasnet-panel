export interface VlanSelectorProps {
    label: string;
    description?: string;
    value: number[];
    onChange: (value: number[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}
/**
 * VLAN Selector Component - Multi-select for VLAN IDs
 * Allows adding VLAN IDs (1-4094) with visual chips
 *
 * @description Multi-select VLAN ID picker with validation and visual feedback
 */
export declare const VlanSelector: import("react").NamedExoticComponent<VlanSelectorProps>;
//# sourceMappingURL=VlanSelector.d.ts.map