/**
 * Headless Hook: usePortKnockSequenceForm
 *
 * Business logic for port knock sequence form:
 * - React Hook Form integration with Zod validation
 * - Knock ports array field management (add/remove/reorder)
 * - Real-time preview computation
 * - Lockout detection (SSH protection warning)
 * - Port uniqueness validation
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-12-implement-port-knocking.md
 */
import { useForm } from 'react-hook-form';
import { type PortKnockSequenceInput, type KnockPort } from '@nasnet/core/types';
/**
 * Preview of generated firewall rules
 */
export interface RulePreview {
    stage: number;
    description: string;
    ruleType: 'knock' | 'accept';
    addressList?: string;
    port?: number;
    protocol?: string;
}
/**
 * Hook return type
 */
export interface UsePortKnockSequenceFormReturn {
    /** React Hook Form instance */
    form: ReturnType<typeof useForm<PortKnockSequenceInput>>;
    /** Current knock ports array */
    knockPorts: KnockPort[];
    /** Add a new knock port */
    addKnockPort: () => void;
    /** Remove knock port by index */
    removeKnockPort: (index: number) => void;
    /** Reorder knock ports */
    reorderKnockPorts: (fromIndex: number, toIndex: number) => void;
    /** Preview of generated rules */
    preview: RulePreview[];
    /** Whether sequence protects SSH (lockout risk) */
    isLockoutRisk: boolean;
    /** Form submission handler */
    onSubmit: (data: PortKnockSequenceInput) => void | Promise<void>;
}
export interface UsePortKnockSequenceFormOptions {
    /** Initial values for editing */
    initialValues?: PortKnockSequenceInput;
    /** Submit handler */
    onSubmit: (data: PortKnockSequenceInput) => void | Promise<void>;
    /** Whether form is in edit mode */
    isEditMode?: boolean;
}
/**
 * Headless hook for port knock sequence form logic
 */
export declare function usePortKnockSequenceForm(options: UsePortKnockSequenceFormOptions): UsePortKnockSequenceFormReturn;
//# sourceMappingURL=use-port-knock-sequence-form.d.ts.map