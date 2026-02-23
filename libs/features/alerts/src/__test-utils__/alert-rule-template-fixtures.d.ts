/**
 * Alert Rule Template Test Fixtures
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Mock data for Storybook stories and tests.
 * Provides realistic template examples across all categories.
 */
import type { AlertRuleTemplate, AlertRuleTemplatePreview } from '../schemas/alert-rule-template.schema';
/**
 * Network Category Templates
 */
export declare const deviceOfflineTemplate: AlertRuleTemplate;
export declare const interfaceDownTemplate: AlertRuleTemplate;
/**
 * Security Category Templates
 */
export declare const sshFailedLoginTemplate: AlertRuleTemplate;
/**
 * Resources Category Templates
 */
export declare const highCPUTemplate: AlertRuleTemplate;
export declare const highMemoryTemplate: AlertRuleTemplate;
/**
 * VPN Category Templates
 */
export declare const vpnDisconnectedTemplate: AlertRuleTemplate;
/**
 * DHCP Category Templates
 */
export declare const dhcpPoolExhaustedTemplate: AlertRuleTemplate;
/**
 * System Category Templates
 */
export declare const diskFullTemplate: AlertRuleTemplate;
/**
 * Custom Template Example
 */
export declare const customTemplate: AlertRuleTemplate;
/**
 * All built-in templates (15 total)
 */
export declare const builtInTemplates: AlertRuleTemplate[];
/**
 * All templates including custom
 */
export declare const allTemplates: AlertRuleTemplate[];
/**
 * Templates by category
 */
export declare const templatesByCategory: {
    NETWORK: {
        severity: "CRITICAL" | "WARNING" | "INFO";
        id: string;
        name: string;
        version: string;
        description: string;
        category: "VPN" | "DHCP" | "NETWORK" | "CUSTOM" | "SECURITY" | "RESOURCES" | "SYSTEM";
        eventType: string;
        conditions: {
            operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
            value: string;
            field: string;
        }[];
        channels: string[];
        isBuiltIn: boolean;
        variables: {
            label: string;
            name: string;
            type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
            required: boolean;
            max?: number | undefined;
            min?: number | undefined;
            defaultValue?: string | undefined;
            description?: string | undefined;
            unit?: string | undefined;
        }[];
        throttle?: {
            maxAlerts: number;
            periodSeconds: number;
            groupByField?: string | undefined;
        } | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
    }[];
    SECURITY: {
        severity: "CRITICAL" | "WARNING" | "INFO";
        id: string;
        name: string;
        version: string;
        description: string;
        category: "VPN" | "DHCP" | "NETWORK" | "CUSTOM" | "SECURITY" | "RESOURCES" | "SYSTEM";
        eventType: string;
        conditions: {
            operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
            value: string;
            field: string;
        }[];
        channels: string[];
        isBuiltIn: boolean;
        variables: {
            label: string;
            name: string;
            type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
            required: boolean;
            max?: number | undefined;
            min?: number | undefined;
            defaultValue?: string | undefined;
            description?: string | undefined;
            unit?: string | undefined;
        }[];
        throttle?: {
            maxAlerts: number;
            periodSeconds: number;
            groupByField?: string | undefined;
        } | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
    }[];
    RESOURCES: {
        severity: "CRITICAL" | "WARNING" | "INFO";
        id: string;
        name: string;
        version: string;
        description: string;
        category: "VPN" | "DHCP" | "NETWORK" | "CUSTOM" | "SECURITY" | "RESOURCES" | "SYSTEM";
        eventType: string;
        conditions: {
            operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
            value: string;
            field: string;
        }[];
        channels: string[];
        isBuiltIn: boolean;
        variables: {
            label: string;
            name: string;
            type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
            required: boolean;
            max?: number | undefined;
            min?: number | undefined;
            defaultValue?: string | undefined;
            description?: string | undefined;
            unit?: string | undefined;
        }[];
        throttle?: {
            maxAlerts: number;
            periodSeconds: number;
            groupByField?: string | undefined;
        } | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
    }[];
    VPN: {
        severity: "CRITICAL" | "WARNING" | "INFO";
        id: string;
        name: string;
        version: string;
        description: string;
        category: "VPN" | "DHCP" | "NETWORK" | "CUSTOM" | "SECURITY" | "RESOURCES" | "SYSTEM";
        eventType: string;
        conditions: {
            operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
            value: string;
            field: string;
        }[];
        channels: string[];
        isBuiltIn: boolean;
        variables: {
            label: string;
            name: string;
            type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
            required: boolean;
            max?: number | undefined;
            min?: number | undefined;
            defaultValue?: string | undefined;
            description?: string | undefined;
            unit?: string | undefined;
        }[];
        throttle?: {
            maxAlerts: number;
            periodSeconds: number;
            groupByField?: string | undefined;
        } | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
    }[];
    DHCP: {
        severity: "CRITICAL" | "WARNING" | "INFO";
        id: string;
        name: string;
        version: string;
        description: string;
        category: "VPN" | "DHCP" | "NETWORK" | "CUSTOM" | "SECURITY" | "RESOURCES" | "SYSTEM";
        eventType: string;
        conditions: {
            operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
            value: string;
            field: string;
        }[];
        channels: string[];
        isBuiltIn: boolean;
        variables: {
            label: string;
            name: string;
            type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
            required: boolean;
            max?: number | undefined;
            min?: number | undefined;
            defaultValue?: string | undefined;
            description?: string | undefined;
            unit?: string | undefined;
        }[];
        throttle?: {
            maxAlerts: number;
            periodSeconds: number;
            groupByField?: string | undefined;
        } | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
    }[];
    SYSTEM: {
        severity: "CRITICAL" | "WARNING" | "INFO";
        id: string;
        name: string;
        version: string;
        description: string;
        category: "VPN" | "DHCP" | "NETWORK" | "CUSTOM" | "SECURITY" | "RESOURCES" | "SYSTEM";
        eventType: string;
        conditions: {
            operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
            value: string;
            field: string;
        }[];
        channels: string[];
        isBuiltIn: boolean;
        variables: {
            label: string;
            name: string;
            type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
            required: boolean;
            max?: number | undefined;
            min?: number | undefined;
            defaultValue?: string | undefined;
            description?: string | undefined;
            unit?: string | undefined;
        }[];
        throttle?: {
            maxAlerts: number;
            periodSeconds: number;
            groupByField?: string | undefined;
        } | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
    }[];
    CUSTOM: {
        severity: "CRITICAL" | "WARNING" | "INFO";
        id: string;
        name: string;
        version: string;
        description: string;
        category: "VPN" | "DHCP" | "NETWORK" | "CUSTOM" | "SECURITY" | "RESOURCES" | "SYSTEM";
        eventType: string;
        conditions: {
            operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
            value: string;
            field: string;
        }[];
        channels: string[];
        isBuiltIn: boolean;
        variables: {
            label: string;
            name: string;
            type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
            required: boolean;
            max?: number | undefined;
            min?: number | undefined;
            defaultValue?: string | undefined;
            description?: string | undefined;
            unit?: string | undefined;
        }[];
        throttle?: {
            maxAlerts: number;
            periodSeconds: number;
            groupByField?: string | undefined;
        } | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
    }[];
};
/**
 * Mock preview result
 */
export declare const mockPreviewResult: AlertRuleTemplatePreview;
/**
 * Mock preview with validation errors
 */
export declare const mockInvalidPreview: AlertRuleTemplatePreview;
//# sourceMappingURL=alert-rule-template-fixtures.d.ts.map