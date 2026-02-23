/* eslint-disable @typescript-eslint/ban-types */
/**
 * Template Install Wizard Machine
 *
 * XState machine for the template installation wizard flow.
 * Manages the 4-step process: Variables → Review → Installing → Routing
 */
import type { ServiceTemplate } from '@nasnet/api-client/generated';
/**
 * Template installation context
 */
export interface TemplateInstallContext {
    /** Router ID */
    routerId: string;
    /** Template being installed */
    template: ServiceTemplate | null;
    /** Template ID */
    templateId: string;
    /** Variable values entered by user */
    variables: Record<string, unknown>;
    /** Whether this is a dry run (preview) */
    dryRun: boolean;
    /** Installation result */
    installResult: {
        success: boolean;
        instanceIDs: string[];
        errors: string[];
    } | null;
    /** Installation progress */
    progress: {
        phase: string;
        current: number;
        total: number;
        currentService: string | null;
    } | null;
    /** Selected routing rules to apply */
    selectedRoutingRules: string[];
    /** Current step (1-4) */
    currentStep: number;
    /** Validation errors */
    errors: Record<string, string>;
}
/**
 * Template install wizard events
 */
export type TemplateInstallEvent = {
    type: 'NEXT';
} | {
    type: 'PREV';
} | {
    type: 'SET_VARIABLES';
    variables: Record<string, unknown>;
} | {
    type: 'START_INSTALL';
} | {
    type: 'INSTALL_COMPLETE';
    result: {
        success: boolean;
        instanceIDs: string[];
        errors: string[];
    };
} | {
    type: 'INSTALL_FAILED';
    error: string;
} | {
    type: 'PROGRESS_UPDATE';
    progress: {
        phase: string;
        current: number;
        total: number;
        currentService: string | null;
    };
} | {
    type: 'TOGGLE_ROUTING_RULE';
    ruleId: string;
} | {
    type: 'SKIP_ROUTING';
} | {
    type: 'APPLY_ROUTING';
} | {
    type: 'CANCEL';
} | {
    type: 'COMPLETE';
};
/**
 * Validation result
 */
interface ValidationResult {
    valid: boolean;
    errors?: Record<string, string>;
}
/**
 * Create template installation wizard machine
 *
 * @description Creates an XState machine for the template installation wizard flow.
 * Manages a 4-step process: Variables → Review → Installing → Routing.
 *
 * @param initialContext - Initial context values for the machine
 * @returns XState machine builder for template installation
 */
export declare function createTemplateInstallMachine(initialContext: Partial<TemplateInstallContext>): import("xstate").StateMachine<TemplateInstallContext, {
    type: "NEXT";
} | {
    type: "PREV";
} | {
    type: "SET_VARIABLES";
    variables: Record<string, unknown>;
} | {
    type: "START_INSTALL";
} | {
    type: "INSTALL_COMPLETE";
    result: {
        success: boolean;
        instanceIDs: string[];
        errors: string[];
    };
} | {
    type: "INSTALL_FAILED";
    error: string;
} | {
    type: "PROGRESS_UPDATE";
    progress: {
        phase: string;
        current: number;
        total: number;
        currentService: string | null;
    };
} | {
    type: "TOGGLE_ROUTING_RULE";
    ruleId: string;
} | {
    type: "SKIP_ROUTING";
} | {
    type: "APPLY_ROUTING";
} | {
    type: "CANCEL";
} | {
    type: "COMPLETE";
}, {
    [x: string]: import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<ValidationResult, {
        variables: Record<string, unknown>;
        template: ServiceTemplate | null;
    }, import("xstate").EventObject>> | undefined;
}, {
    src: "validateVariables";
    logic: import("xstate").PromiseActorLogic<ValidationResult, {
        variables: Record<string, unknown>;
        template: ServiceTemplate | null;
    }, import("xstate").EventObject>;
    id: string | undefined;
}, never, {
    type: "canGoNext";
    params: unknown;
} | {
    type: "canGoPrev";
    params: unknown;
}, never, "variables" | "failed" | "routing" | "completed" | "cancelled" | "installing" | "review", string, import("xstate").NonReducibleUnknown, import("xstate").NonReducibleUnknown, import("xstate").EventObject, import("xstate").MetaObject, {
    id: "templateInstall";
    states: {
        readonly variables: {};
        readonly review: {};
        readonly installing: {};
        readonly routing: {};
        readonly completed: {};
        readonly cancelled: {};
        readonly failed: {};
    };
}>;
export {};
//# sourceMappingURL=templateInstallMachine.d.ts.map