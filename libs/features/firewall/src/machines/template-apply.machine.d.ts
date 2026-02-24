/**
 * Template Apply Machine
 *
 * @description XState machine for safe firewall template application with multi-step
 * approval flow, conflict detection, impact analysis, and rollback capability.
 * Implements the Safety Pipeline pattern with variable validation, preview, optional
 * high-risk confirmation, apply, and 10-second undo window.
 *
 * State flow:
 * ```
 * idle → configuring → previewing → reviewing → [confirming] → applying → success → [rollingBack] → [rolledBack]
 *                                                ↓                           ↓
 *                                            error ←────────────────────────→ error
 * ```
 *
 * @example
 * ```ts
 * const machine = createTemplateApplyMachine({
 *   previewTemplate: async (params) => previewAPI(params),
 *   applyTemplate: async (params) => applyAPI(params),
 *   executeRollback: async (params) => rollbackAPI(params),
 * });
 * const actor = createActor(machine).start();
 * actor.send({ type: 'SELECT_TEMPLATE', template, routerId });
 * ```
 *
 * @see NAS-7.6: Firewall Templates Feature
 * @see Docs/architecture/novel-pattern-designs.md - Safety Pipeline pattern
 */
import type { FirewallTemplate, TemplatePreviewResult, FirewallTemplateResult } from '../schemas/templateSchemas';
/**
 * Context for the template apply machine
 */
export interface TemplateApplyContext {
    /**
     * Router ID to apply template to
     */
    routerId: string | null;
    /**
     * Selected template to apply
     */
    template: FirewallTemplate | null;
    /**
     * Variable values provided by user
     */
    variables: Record<string, string>;
    /**
     * Validation errors for variables
     */
    validationErrors: Array<{
        field: string;
        message: string;
    }>;
    /**
     * Preview result with resolved rules and conflicts
     */
    previewResult: TemplatePreviewResult | null;
    /**
     * Apply result with success status and rollback ID
     */
    applyResult: FirewallTemplateResult | null;
    /**
     * Timestamp when apply started (for rollback timer)
     */
    applyStartedAt: number | null;
    /**
     * Error message if operation failed
     */
    errorMessage: string | null;
}
/**
 * Events for the template apply machine
 */
export type TemplateApplyEvent = {
    type: 'SELECT_TEMPLATE';
    template: FirewallTemplate;
    routerId: string;
} | {
    type: 'UPDATE_VARIABLES';
    variables: Record<string, string>;
} | {
    type: 'PREVIEW';
} | {
    type: 'CONFIRM';
} | {
    type: 'APPLY';
} | {
    type: 'ACKNOWLEDGED';
} | {
    type: 'ROLLBACK';
} | {
    type: 'RETRY';
} | {
    type: 'CANCEL';
} | {
    type: 'RESET';
};
/**
 * Configuration for template apply machine
 */
export interface TemplateApplyConfig {
    /**
     * Unique machine ID
     */
    id?: string;
    /**
     * Preview template with variable resolution and conflict detection
     */
    previewTemplate: (params: {
        routerId: string;
        template: FirewallTemplate;
        variables: Record<string, string>;
    }) => Promise<TemplatePreviewResult>;
    /**
     * Apply template to router
     */
    applyTemplate: (params: {
        routerId: string;
        template: FirewallTemplate;
        variables: Record<string, string>;
    }) => Promise<FirewallTemplateResult>;
    /**
     * Execute rollback to previous state
     */
    executeRollback: (params: {
        routerId: string;
        rollbackId: string;
    }) => Promise<void>;
    /**
     * Callback on successful apply
     */
    onSuccess?: () => void;
    /**
     * Callback on rollback
     */
    onRollback?: () => void;
    /**
     * Callback on error
     */
    onError?: (error: string) => void;
}
/**
 * Create a template apply machine with configurable handlers
 *
 * @param config - Machine configuration with API handlers and callbacks
 * @returns Configured XState machine ready for actor initialization
 *
 * @example
 * ```ts
 * const machine = createTemplateApplyMachine({
 *   id: 'firewall-template-apply',
 *   previewTemplate: async ({ routerId, template, variables }) => {
 *     return previewTemplateAPI(routerId, template.id, variables);
 *   },
 *   applyTemplate: async ({ routerId, template, variables }) => {
 *     return applyTemplateAPI(routerId, template.id, variables);
 *   },
 *   executeRollback: async ({ routerId, rollbackId }) => {
 *     await rollbackTemplateAPI(routerId, rollbackId);
 *   },
 *   onSuccess: () => {
 *     toast.success('Template applied successfully');
 *   },
 * });
 * ```
 */
export declare function createTemplateApplyMachine(config: TemplateApplyConfig): import("xstate").StateMachine<TemplateApplyContext, {
    type: "SELECT_TEMPLATE";
    template: FirewallTemplate;
    routerId: string;
} | {
    type: "UPDATE_VARIABLES";
    variables: Record<string, string>;
} | {
    type: "PREVIEW";
} | {
    type: "CONFIRM";
} | {
    type: "APPLY";
} | {
    type: "ACKNOWLEDGED";
} | {
    type: "ROLLBACK";
} | {
    type: "RETRY";
} | {
    type: "CANCEL";
} | {
    type: "RESET";
}, {
    [x: string]: import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<{
        conflicts: readonly {
            type: "DUPLICATE_RULE" | "IP_OVERLAP" | "CHAIN_CONFLICT" | "POSITION_CONFLICT" | "PORT_CONFLICT";
            message: string;
            existingRuleId?: string | undefined;
            proposedRule?: {
                chain: string;
                action: string;
                position: number | null;
                table: "FILTER" | "NAT" | "MANGLE" | "RAW";
                properties: Record<string, unknown>;
                comment?: string | undefined;
            } | undefined;
        }[];
        template: {
            version: string;
            description: string;
            id: string;
            category: "BASIC" | "VPN" | "CUSTOM" | "HOME" | "GAMING" | "IOT" | "GUEST" | "SECURITY";
            name: string;
            isBuiltIn: boolean;
            complexity: "ADVANCED" | "SIMPLE" | "MODERATE" | "EXPERT";
            ruleCount: number;
            variables: readonly {
                type: "PORT" | "INTERFACE" | "SUBNET" | "IP" | "PORT_RANGE" | "VLAN_ID" | "STRING" | "NUMBER" | "BOOLEAN";
                name: string;
                label: string;
                isRequired: boolean;
                description?: string | undefined;
                options?: string[] | undefined;
                defaultValue?: string | undefined;
            }[];
            rules: readonly {
                chain: string;
                action: string;
                position: number | null;
                table: "FILTER" | "NAT" | "MANGLE" | "RAW";
                properties: Record<string, unknown>;
                comment?: string | undefined;
            }[];
            updatedAt?: Date | null | undefined;
            createdAt?: Date | null | undefined;
        };
        resolvedRules: readonly {
            chain: string;
            action: string;
            position: number | null;
            table: "FILTER" | "NAT" | "MANGLE" | "RAW";
            properties: Record<string, unknown>;
            comment?: string | undefined;
        }[];
        impactAnalysis: {
            warnings: readonly string[];
            newRulesCount: number;
            affectedChains: readonly string[];
            estimatedApplyTime: number;
        };
    }, {
        routerId: string;
        template: FirewallTemplate;
        variables: Record<string, string>;
    }, import("xstate").EventObject>> | import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<{
        errors: readonly string[];
        isSuccessful: boolean;
        appliedRulesCount: number;
        rollbackId: string;
    }, {
        routerId: string;
        template: FirewallTemplate;
        variables: Record<string, string>;
    }, import("xstate").EventObject>> | import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<void, {
        routerId: string;
        rollbackId: string;
    }, import("xstate").EventObject>> | undefined;
}, {
    src: "previewTemplate";
    logic: import("xstate").PromiseActorLogic<{
        conflicts: readonly {
            type: "DUPLICATE_RULE" | "IP_OVERLAP" | "CHAIN_CONFLICT" | "POSITION_CONFLICT" | "PORT_CONFLICT";
            message: string;
            existingRuleId?: string | undefined;
            proposedRule?: {
                chain: string;
                action: string;
                position: number | null;
                table: "FILTER" | "NAT" | "MANGLE" | "RAW";
                properties: Record<string, unknown>;
                comment?: string | undefined;
            } | undefined;
        }[];
        template: {
            version: string;
            description: string;
            id: string;
            category: "BASIC" | "VPN" | "CUSTOM" | "HOME" | "GAMING" | "IOT" | "GUEST" | "SECURITY";
            name: string;
            isBuiltIn: boolean;
            complexity: "ADVANCED" | "SIMPLE" | "MODERATE" | "EXPERT";
            ruleCount: number;
            variables: readonly {
                type: "PORT" | "INTERFACE" | "SUBNET" | "IP" | "PORT_RANGE" | "VLAN_ID" | "STRING" | "NUMBER" | "BOOLEAN";
                name: string;
                label: string;
                isRequired: boolean;
                description?: string | undefined;
                options?: string[] | undefined;
                defaultValue?: string | undefined;
            }[];
            rules: readonly {
                chain: string;
                action: string;
                position: number | null;
                table: "FILTER" | "NAT" | "MANGLE" | "RAW";
                properties: Record<string, unknown>;
                comment?: string | undefined;
            }[];
            updatedAt?: Date | null | undefined;
            createdAt?: Date | null | undefined;
        };
        resolvedRules: readonly {
            chain: string;
            action: string;
            position: number | null;
            table: "FILTER" | "NAT" | "MANGLE" | "RAW";
            properties: Record<string, unknown>;
            comment?: string | undefined;
        }[];
        impactAnalysis: {
            warnings: readonly string[];
            newRulesCount: number;
            affectedChains: readonly string[];
            estimatedApplyTime: number;
        };
    }, {
        routerId: string;
        template: FirewallTemplate;
        variables: Record<string, string>;
    }, import("xstate").EventObject>;
    id: string | undefined;
} | {
    src: "applyTemplate";
    logic: import("xstate").PromiseActorLogic<{
        errors: readonly string[];
        isSuccessful: boolean;
        appliedRulesCount: number;
        rollbackId: string;
    }, {
        routerId: string;
        template: FirewallTemplate;
        variables: Record<string, string>;
    }, import("xstate").EventObject>;
    id: string | undefined;
} | {
    src: "executeRollback";
    logic: import("xstate").PromiseActorLogic<void, {
        routerId: string;
        rollbackId: string;
    }, import("xstate").EventObject>;
    id: string | undefined;
}, {
    type: "clearErrors";
    params: unknown;
} | {
    type: "storeTemplate";
    params: unknown;
} | {
    type: "storeVariables";
    params: unknown;
} | {
    type: "storePreviewResult";
    params: unknown;
} | {
    type: "recordApplyResult";
    params: unknown;
} | {
    type: "setErrorMessage";
    params: unknown;
} | {
    type: "resetMachine";
    params: unknown;
} | {
    type: "startRollbackTimer";
    params: unknown;
} | {
    type: "notifySuccess";
    params: unknown;
} | {
    type: "notifyRolledBack";
    params: unknown;
} | {
    type: "notifyError";
    params: unknown;
}, {
    type: "hasConflicts";
    params: unknown;
} | {
    type: "hasValidationErrors";
    params: unknown;
} | {
    type: "isValidated";
    params: unknown;
} | {
    type: "isHighRisk";
    params: unknown;
} | {
    type: "applySucceeded";
    params: unknown;
} | {
    type: "applyFailed";
    params: unknown;
} | {
    type: "hasRollbackData";
    params: unknown;
}, never, "success" | "error" | "idle" | "configuring" | "previewing" | "reviewing" | "confirming" | "applying" | "rollingBack" | "rolledBack", string, import("xstate").NonReducibleUnknown, import("xstate").NonReducibleUnknown, import("xstate").EventObject, import("xstate").MetaObject, {
    id: string;
    states: {
        readonly idle: {};
        readonly configuring: {};
        readonly previewing: {};
        readonly reviewing: {};
        readonly confirming: {};
        readonly applying: {};
        readonly success: {};
        readonly rollingBack: {};
        readonly rolledBack: {};
        readonly error: {};
    };
}>;
/**
 * Valid states for the template apply machine
 */
export type TemplateApplyState = 'idle' | 'configuring' | 'previewing' | 'reviewing' | 'confirming' | 'applying' | 'success' | 'rollingBack' | 'rolledBack' | 'error';
/**
 * Check if machine is in a final state (no more transitions possible)
 */
export declare function isTemplateFinal(state: TemplateApplyState): boolean;
/**
 * Check if machine is in a cancellable state
 */
export declare function isTemplateCancellable(state: TemplateApplyState): boolean;
/**
 * Check if machine is processing (async operation in progress)
 */
export declare function isTemplateProcessing(state: TemplateApplyState): boolean;
/**
 * Get human-readable description of machine state for UI display
 */
export declare function getTemplateStateDescription(state: TemplateApplyState): string;
//# sourceMappingURL=template-apply.machine.d.ts.map