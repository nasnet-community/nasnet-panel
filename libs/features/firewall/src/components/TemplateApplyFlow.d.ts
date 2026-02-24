/**
 * TemplateApplyFlow - XState-driven template application flow
 *
 * Features:
 * - XState machine integration with useMachine() hook
 * - Safety Pipeline with dangerous operation confirmation
 * - Multi-state UI rendering (configuring, previewing, confirming, applying, success)
 * - Undo functionality with UndoFloatingButton
 * - Error handling and recovery
 *
 * @description Manages the complete firewall template application workflow with safety confirmations
 * @module @nasnet/features/firewall/components
 */
import type { FirewallTemplate } from '../schemas/templateSchemas';
export interface TemplateApplyFlowProps {
    /** Router ID to apply template to */
    routerId: string;
    /** Template to apply */
    template: FirewallTemplate | null;
    /** Callback to preview template */
    onPreview: (params: {
        routerId: string;
        template: FirewallTemplate;
        variables: Record<string, string>;
    }) => Promise<any>;
    /** Callback to apply template */
    onApply: (params: {
        routerId: string;
        template: FirewallTemplate;
        variables: Record<string, string>;
    }) => Promise<any>;
    /** Callback to execute rollback */
    onRollback: (params: {
        routerId: string;
        rollbackId: string;
    }) => Promise<void>;
    /** Callback on success */
    onSuccess?: () => void;
    /** Callback on cancel */
    onCancel?: () => void;
    /** Callback on rollback complete */
    onRollbackComplete?: () => void;
    /** Optional CSS class name */
    className?: string;
}
/**
 * @description Orchestrates the firewall template application workflow with XState
 */
export declare const TemplateApplyFlow: import("react").NamedExoticComponent<TemplateApplyFlowProps>;
//# sourceMappingURL=TemplateApplyFlow.d.ts.map