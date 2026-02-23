/**
 * NAT Rule Builder Types
 *
 * TypeScript interfaces for NAT rule builder components.
 *
 * @module @nasnet/ui/patterns/security/nat-rule-builder
 */
import type { NATRuleInput } from '@nasnet/core/types';
/**
 * NAT Rule Builder Props
 */
export interface NATRuleBuilderProps {
    /** Router ID for fetching interfaces and address lists */
    routerId: string;
    /** Initial rule values for editing (undefined for creating new rule) */
    initialRule?: Partial<NATRuleInput>;
    /** Is builder open */
    open: boolean;
    /** Callback when builder is closed */
    onClose: () => void;
    /** Callback when rule is saved */
    onSave: (rule: NATRuleInput) => void | Promise<void>;
    /** Callback when rule is deleted (only for existing rules) */
    onDelete?: () => void | Promise<void>;
    /** Is save operation in progress */
    isSaving?: boolean;
    /** Is delete operation in progress */
    isDeleting?: boolean;
    /** Builder mode */
    mode?: 'create' | 'edit';
    /** Show chain selector with visual diagram */
    showChainDiagram?: boolean;
    /** Available interfaces for selection */
    interfaces?: string[];
    /** Available interface lists for selection */
    interfaceLists?: string[];
    /** Available address lists for autocomplete */
    addressLists?: string[];
}
/**
 * Chain Selector Props
 */
export interface ChainSelectorProps {
    /** Selected chain */
    value: string;
    /** Callback when chain changes */
    onChange: (chain: string) => void;
    /** Show visual diagram */
    showDiagram?: boolean;
    /** Is disabled */
    disabled?: boolean;
}
/**
 * Action Selector Props
 */
export interface ActionSelectorProps {
    /** Selected action */
    value: string;
    /** Callback when action changes */
    onChange: (action: string) => void;
    /** Is disabled */
    disabled?: boolean;
    /** Show action descriptions */
    showDescriptions?: boolean;
}
/**
 * Protocol Selector Props
 */
export interface ProtocolSelectorProps {
    /** Selected protocol */
    value: string | undefined;
    /** Callback when protocol changes */
    onChange: (protocol: string | undefined) => void;
    /** Is disabled */
    disabled?: boolean;
}
//# sourceMappingURL=nat-rule-builder.types.d.ts.map