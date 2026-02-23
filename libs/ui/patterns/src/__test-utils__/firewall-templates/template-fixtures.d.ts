/**
 * Firewall Template Test Fixtures
 *
 * Mock data and utilities for comprehensive testing of the Firewall Templates feature (NAS-7.6).
 * This file provides complete mock data for templates, variables, rules, and API responses.
 *
 * @see libs/features/firewall/src/components/TemplatesPage.tsx
 * @see libs/ui/patterns/src/template-gallery/
 * @see libs/ui/patterns/src/template-preview/
 */
import type { FirewallTemplate, TemplateVariable, TemplateRule, TemplatePreviewResult, TemplateConflict, ImpactAnalysis, FirewallTemplateResult, TemplateCategory, TemplateComplexity, VariableType, FirewallTable, TemplateConflictType } from '@nasnet/core/types';
export type { FirewallTemplate, TemplateVariable, TemplateRule, TemplatePreviewResult, TemplateConflict, ImpactAnalysis, FirewallTemplateResult, TemplateCategory, TemplateComplexity, VariableType, FirewallTable, TemplateConflictType, };
export declare const mockInterfaceVariable: TemplateVariable;
export declare const mockWanInterfaceVariable: TemplateVariable;
export declare const mockSubnetVariable: TemplateVariable;
export declare const mockVlanIdVariable: TemplateVariable;
export declare const mockFilterRule: TemplateRule;
export declare const mockNatRule: TemplateRule;
export declare const mockMangleRule: TemplateRule;
export declare const mockDropRule: TemplateRule;
export declare const mockBasicSecurityTemplate: FirewallTemplate;
export declare const mockHomeNetworkTemplate: FirewallTemplate;
export declare const mockGamingOptimizedTemplate: FirewallTemplate;
export declare const mockIotIsolationTemplate: FirewallTemplate;
export declare const mockGuestNetworkTemplate: FirewallTemplate;
export declare const mockCustomTemplate: FirewallTemplate;
export declare const mockBuiltInTemplates: FirewallTemplate[];
export declare const mockCustomTemplates: FirewallTemplate[];
export declare const mockAllTemplates: FirewallTemplate[];
export declare const mockDuplicateRuleConflict: TemplateConflict;
export declare const mockIpOverlapConflict: TemplateConflict;
export declare const mockChainConflict: TemplateConflict;
export declare const mockPositionConflict: TemplateConflict;
export declare const mockConflicts: TemplateConflict[];
export declare const mockImpactAnalysis: ImpactAnalysis;
export declare const mockSafeImpactAnalysis: ImpactAnalysis;
export declare const mockHighImpactAnalysis: ImpactAnalysis;
export declare const mockPreviewResult: TemplatePreviewResult;
export declare const mockPreviewResultWithConflicts: TemplatePreviewResult;
export declare const mockSuccessfulApplyResult: FirewallTemplateResult;
export declare const mockPartialFailureResult: FirewallTemplateResult;
export declare const mockCompleteFailureResult: FirewallTemplateResult;
export declare const mockFirewallTemplatesResponse: {
    data: {
        firewallTemplates: {
            id: string;
            name: string;
            version: string;
            rules: readonly {
                table: "FILTER" | "NAT" | "MANGLE" | "RAW";
                action: string;
                position: number | null;
                chain: string;
                properties: Record<string, unknown>;
                comment?: string | undefined;
            }[];
            description: string;
            category: "VPN" | "BASIC" | "CUSTOM" | "HOME" | "GAMING" | "IOT" | "GUEST" | "SECURITY";
            isBuiltIn: boolean;
            complexity: "ADVANCED" | "SIMPLE" | "MODERATE" | "EXPERT";
            ruleCount: number;
            variables: readonly {
                label: string;
                name: string;
                type: "PORT" | "INTERFACE" | "SUBNET" | "IP" | "PORT_RANGE" | "VLAN_ID" | "STRING" | "NUMBER" | "BOOLEAN";
                isRequired: boolean;
                defaultValue?: string | undefined;
                description?: string | undefined;
                options?: string[] | undefined;
            }[];
            updatedAt?: Date | null | undefined;
            createdAt?: Date | null | undefined;
        }[];
    };
};
export declare const mockFirewallTemplatesByCategory: (category: TemplateCategory) => {
    data: {
        firewallTemplates: {
            id: string;
            name: string;
            version: string;
            rules: readonly {
                table: "FILTER" | "NAT" | "MANGLE" | "RAW";
                action: string;
                position: number | null;
                chain: string;
                properties: Record<string, unknown>;
                comment?: string | undefined;
            }[];
            description: string;
            category: "VPN" | "BASIC" | "CUSTOM" | "HOME" | "GAMING" | "IOT" | "GUEST" | "SECURITY";
            isBuiltIn: boolean;
            complexity: "ADVANCED" | "SIMPLE" | "MODERATE" | "EXPERT";
            ruleCount: number;
            variables: readonly {
                label: string;
                name: string;
                type: "PORT" | "INTERFACE" | "SUBNET" | "IP" | "PORT_RANGE" | "VLAN_ID" | "STRING" | "NUMBER" | "BOOLEAN";
                isRequired: boolean;
                defaultValue?: string | undefined;
                description?: string | undefined;
                options?: string[] | undefined;
            }[];
            updatedAt?: Date | null | undefined;
            createdAt?: Date | null | undefined;
        }[];
    };
};
export declare const mockPreviewTemplateResponse: {
    data: {
        previewTemplate: {
            template: {
                id: string;
                name: string;
                version: string;
                rules: readonly {
                    table: "FILTER" | "NAT" | "MANGLE" | "RAW";
                    action: string;
                    position: number | null;
                    chain: string;
                    properties: Record<string, unknown>;
                    comment?: string | undefined;
                }[];
                description: string;
                category: "VPN" | "BASIC" | "CUSTOM" | "HOME" | "GAMING" | "IOT" | "GUEST" | "SECURITY";
                isBuiltIn: boolean;
                complexity: "ADVANCED" | "SIMPLE" | "MODERATE" | "EXPERT";
                ruleCount: number;
                variables: readonly {
                    label: string;
                    name: string;
                    type: "PORT" | "INTERFACE" | "SUBNET" | "IP" | "PORT_RANGE" | "VLAN_ID" | "STRING" | "NUMBER" | "BOOLEAN";
                    isRequired: boolean;
                    defaultValue?: string | undefined;
                    description?: string | undefined;
                    options?: string[] | undefined;
                }[];
                updatedAt?: Date | null | undefined;
                createdAt?: Date | null | undefined;
            };
            conflicts: readonly {
                type: "DUPLICATE_RULE" | "IP_OVERLAP" | "CHAIN_CONFLICT" | "POSITION_CONFLICT" | "PORT_CONFLICT";
                message: string;
                existingRuleId?: string | undefined;
                proposedRule?: {
                    table: "FILTER" | "NAT" | "MANGLE" | "RAW";
                    action: string;
                    position: number | null;
                    chain: string;
                    properties: Record<string, unknown>;
                    comment?: string | undefined;
                } | undefined;
            }[];
            resolvedRules: readonly {
                table: "FILTER" | "NAT" | "MANGLE" | "RAW";
                action: string;
                position: number | null;
                chain: string;
                properties: Record<string, unknown>;
                comment?: string | undefined;
            }[];
            impactAnalysis: {
                warnings: readonly string[];
                newRulesCount: number;
                affectedChains: readonly string[];
                estimatedApplyTime: number;
            };
        };
    };
};
export declare const mockPreviewTemplateWithConflictsResponse: {
    data: {
        previewTemplate: {
            template: {
                id: string;
                name: string;
                version: string;
                rules: readonly {
                    table: "FILTER" | "NAT" | "MANGLE" | "RAW";
                    action: string;
                    position: number | null;
                    chain: string;
                    properties: Record<string, unknown>;
                    comment?: string | undefined;
                }[];
                description: string;
                category: "VPN" | "BASIC" | "CUSTOM" | "HOME" | "GAMING" | "IOT" | "GUEST" | "SECURITY";
                isBuiltIn: boolean;
                complexity: "ADVANCED" | "SIMPLE" | "MODERATE" | "EXPERT";
                ruleCount: number;
                variables: readonly {
                    label: string;
                    name: string;
                    type: "PORT" | "INTERFACE" | "SUBNET" | "IP" | "PORT_RANGE" | "VLAN_ID" | "STRING" | "NUMBER" | "BOOLEAN";
                    isRequired: boolean;
                    defaultValue?: string | undefined;
                    description?: string | undefined;
                    options?: string[] | undefined;
                }[];
                updatedAt?: Date | null | undefined;
                createdAt?: Date | null | undefined;
            };
            conflicts: readonly {
                type: "DUPLICATE_RULE" | "IP_OVERLAP" | "CHAIN_CONFLICT" | "POSITION_CONFLICT" | "PORT_CONFLICT";
                message: string;
                existingRuleId?: string | undefined;
                proposedRule?: {
                    table: "FILTER" | "NAT" | "MANGLE" | "RAW";
                    action: string;
                    position: number | null;
                    chain: string;
                    properties: Record<string, unknown>;
                    comment?: string | undefined;
                } | undefined;
            }[];
            resolvedRules: readonly {
                table: "FILTER" | "NAT" | "MANGLE" | "RAW";
                action: string;
                position: number | null;
                chain: string;
                properties: Record<string, unknown>;
                comment?: string | undefined;
            }[];
            impactAnalysis: {
                warnings: readonly string[];
                newRulesCount: number;
                affectedChains: readonly string[];
                estimatedApplyTime: number;
            };
        };
    };
};
export declare const mockApplyTemplateResponse: {
    data: {
        applyFirewallTemplate: {
            errors: readonly string[];
            isSuccessful: boolean;
            appliedRulesCount: number;
            rollbackId: string;
        };
    };
};
export declare const mockApplyTemplateErrorResponse: {
    data: {
        applyFirewallTemplate: {
            errors: readonly string[];
            isSuccessful: boolean;
            appliedRulesCount: number;
            rollbackId: string;
        };
    };
};
export declare const mockRollbackTemplateResponse: {
    data: {
        rollbackFirewallTemplate: boolean;
    };
};
export declare const mockSaveTemplateResponse: {
    data: {
        saveFirewallTemplate: {
            id: string;
            name: string;
            version: string;
            rules: readonly {
                table: "FILTER" | "NAT" | "MANGLE" | "RAW";
                action: string;
                position: number | null;
                chain: string;
                properties: Record<string, unknown>;
                comment?: string | undefined;
            }[];
            description: string;
            category: "VPN" | "BASIC" | "CUSTOM" | "HOME" | "GAMING" | "IOT" | "GUEST" | "SECURITY";
            isBuiltIn: boolean;
            complexity: "ADVANCED" | "SIMPLE" | "MODERATE" | "EXPERT";
            ruleCount: number;
            variables: readonly {
                label: string;
                name: string;
                type: "PORT" | "INTERFACE" | "SUBNET" | "IP" | "PORT_RANGE" | "VLAN_ID" | "STRING" | "NUMBER" | "BOOLEAN";
                isRequired: boolean;
                defaultValue?: string | undefined;
                description?: string | undefined;
                options?: string[] | undefined;
            }[];
            updatedAt?: Date | null | undefined;
            createdAt?: Date | null | undefined;
        };
    };
};
export declare const mockDeleteTemplateResponse: {
    data: {
        deleteFirewallTemplate: boolean;
    };
};
export declare const mockRouterInterfacesResponse: {
    data: {
        routerInterfaces: string[];
    };
};
/**
 * Resolve template variables in a string.
 * Replaces {{VARIABLE_NAME}} with actual values.
 */
export declare function resolveVariables(text: string, variables: Record<string, string>): string;
/**
 * Resolve all variables in template rules.
 */
export declare function resolveTemplateRules(rules: TemplateRule[], variables: Record<string, string>): TemplateRule[];
/**
 * Validate template variables against requirements.
 */
export declare function validateTemplateVariables(template: FirewallTemplate, providedVariables: Record<string, string>): {
    valid: boolean;
    errors: string[];
};
/**
 * Generate mock template variables for testing.
 */
export declare function generateMockVariables(): Record<string, string>;
/**
 * Filter templates by category.
 */
export declare function filterTemplatesByCategory(templates: FirewallTemplate[], category?: TemplateCategory): FirewallTemplate[];
/**
 * Filter templates by complexity.
 */
export declare function filterTemplatesByComplexity(templates: FirewallTemplate[], complexity?: TemplateComplexity): FirewallTemplate[];
/**
 * Search templates by name or description.
 */
export declare function searchTemplates(templates: FirewallTemplate[], query: string): FirewallTemplate[];
//# sourceMappingURL=template-fixtures.d.ts.map