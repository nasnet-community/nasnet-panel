/**
 * MangleRuleEditor Types
 *
 * TypeScript interfaces for mangle rule editor components.
 *
 * @module @nasnet/ui/patterns/mangle-rule-editor
 */
import type { MangleRule, MangleRuleInput } from '@nasnet/core/types';
/**
 * MangleRuleEditor Props
 */
export interface MangleRuleEditorProps {
    /** Router ID for fetching address lists and interfaces */
    routerId: string;
    /** Initial rule values for editing (undefined for creating new rule) */
    initialRule?: Partial<MangleRule>;
    /** Is editor open */
    open: boolean;
    /** Callback when editor is closed */
    onClose: () => void;
    /** Callback when rule is saved */
    onSave: (rule: MangleRuleInput) => void | Promise<void>;
    /** Callback when rule is deleted (only for existing rules) */
    onDelete?: () => void | Promise<void>;
    /** Is save operation in progress */
    isSaving?: boolean;
    /** Is delete operation in progress */
    isDeleting?: boolean;
    /** Editor mode */
    mode?: 'create' | 'edit';
    /** Show chain selector with visual diagram */
    showChainDiagram?: boolean;
    /** Available address lists for autocomplete */
    addressLists?: string[];
    /** Available interface lists for autocomplete */
    interfaceLists?: string[];
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
}
/**
 * DSCP Selector Props
 */
export interface DscpSelectorProps {
    /** Selected DSCP value */
    value: number | undefined;
    /** Callback when DSCP changes */
    onChange: (dscp: number | undefined) => void;
    /** Is disabled */
    disabled?: boolean;
    /** Show use cases */
    showUseCases?: boolean;
}
//# sourceMappingURL=mangle-rule-editor.types.d.ts.map