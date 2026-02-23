/**
 * Alert Rule Template Validation Schemas
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Zod schemas for validating alert rule template data on the frontend.
 * Used with React Hook Form for form validation.
 */
import { z } from 'zod';
/**
 * Alert rule template categories
 */
export declare const alertRuleTemplateCategorySchema: z.ZodEnum<["NETWORK", "SECURITY", "RESOURCES", "VPN", "DHCP", "SYSTEM", "CUSTOM"]>;
/**
 * Template variable types
 */
export declare const alertRuleTemplateVariableTypeSchema: z.ZodEnum<["STRING", "INTEGER", "DURATION", "PERCENTAGE"]>;
/**
 * Alert severity levels
 */
export declare const alertSeveritySchema: z.ZodEnum<["CRITICAL", "WARNING", "INFO"]>;
/**
 * Condition operators
 */
export declare const conditionOperatorSchema: z.ZodEnum<["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN", "CONTAINS", "REGEX"]>;
/**
 * Alert rule template variable schema
 * @description Defines a variable that can be customized when applying a template
 */
export declare const alertRuleTemplateVariableSchema: z.ZodObject<{
    name: z.ZodString;
    label: z.ZodString;
    type: z.ZodEnum<["STRING", "INTEGER", "DURATION", "PERCENTAGE"]>;
    required: z.ZodDefault<z.ZodBoolean>;
    defaultValue: z.ZodOptional<z.ZodString>;
    min: z.ZodOptional<z.ZodNumber>;
    max: z.ZodOptional<z.ZodNumber>;
    unit: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    label: string;
    name: string;
    type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
    required: boolean;
    max?: number | undefined;
    min?: number | undefined;
    defaultValue?: string | undefined;
    description?: string | undefined;
    unit?: string | undefined;
}, {
    label: string;
    name: string;
    type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
    max?: number | undefined;
    min?: number | undefined;
    defaultValue?: string | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    unit?: string | undefined;
}>;
/**
 * Variable values for template application
 * Maps variable names to their values
 */
export declare const templateVariableValuesSchema: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
/**
 * Alert condition schema
 * @description Defines a single condition with field, operator, and value
 */
export declare const alertConditionSchema: z.ZodObject<{
    field: z.ZodString;
    operator: z.ZodEnum<["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN", "CONTAINS", "REGEX"]>;
    value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
    value: string;
    field: string;
}, {
    operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
    value: string;
    field: string;
}>;
/**
 * Throttle configuration schema
 * @description Limits alert frequency to prevent notification spam
 */
export declare const throttleConfigSchema: z.ZodObject<{
    maxAlerts: z.ZodNumber;
    periodSeconds: z.ZodNumber;
    groupByField: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    maxAlerts: number;
    periodSeconds: number;
    groupByField?: string | undefined;
}, {
    maxAlerts: number;
    periodSeconds: number;
    groupByField?: string | undefined;
}>;
/**
 * Alert rule template schema
 * @description Core template structure with all fields
 */
export declare const alertRuleTemplateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<["NETWORK", "SECURITY", "RESOURCES", "VPN", "DHCP", "SYSTEM", "CUSTOM"]>;
    eventType: z.ZodString;
    severity: z.ZodEnum<["CRITICAL", "WARNING", "INFO"]>;
    conditions: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN", "CONTAINS", "REGEX"]>;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }, {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }>, "many">;
    channels: z.ZodArray<z.ZodString, "many">;
    throttle: z.ZodOptional<z.ZodObject<{
        maxAlerts: z.ZodNumber;
        periodSeconds: z.ZodNumber;
        groupByField: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        maxAlerts: number;
        periodSeconds: number;
        groupByField?: string | undefined;
    }, {
        maxAlerts: number;
        periodSeconds: number;
        groupByField?: string | undefined;
    }>>;
    variables: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        label: z.ZodString;
        type: z.ZodEnum<["STRING", "INTEGER", "DURATION", "PERCENTAGE"]>;
        required: z.ZodDefault<z.ZodBoolean>;
        defaultValue: z.ZodOptional<z.ZodString>;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        name: string;
        type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
        required: boolean;
        max?: number | undefined;
        min?: number | undefined;
        defaultValue?: string | undefined;
        description?: string | undefined;
        unit?: string | undefined;
    }, {
        label: string;
        name: string;
        type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
        max?: number | undefined;
        min?: number | undefined;
        defaultValue?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        unit?: string | undefined;
    }>, "many">>;
    isBuiltIn: z.ZodDefault<z.ZodBoolean>;
    version: z.ZodDefault<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
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
}, {
    severity: "CRITICAL" | "WARNING" | "INFO";
    id: string;
    name: string;
    description: string;
    category: "VPN" | "DHCP" | "NETWORK" | "CUSTOM" | "SECURITY" | "RESOURCES" | "SYSTEM";
    eventType: string;
    conditions: {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }[];
    channels: string[];
    version?: string | undefined;
    throttle?: {
        maxAlerts: number;
        periodSeconds: number;
        groupByField?: string | undefined;
    } | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    isBuiltIn?: boolean | undefined;
    variables?: {
        label: string;
        name: string;
        type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
        max?: number | undefined;
        min?: number | undefined;
        defaultValue?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        unit?: string | undefined;
    }[] | undefined;
}>;
/**
 * Validation info schema
 * Result of template validation
 */
export declare const validationInfoSchema: z.ZodObject<{
    isValid: z.ZodBoolean;
    missingVariables: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    warnings: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    isValid: boolean;
    warnings: string[];
    missingVariables: string[];
}, {
    isValid: boolean;
    warnings?: string[] | undefined;
    missingVariables?: string[] | undefined;
}>;
/**
 * Template preview schema
 * Result of previewing a template with variable substitution
 */
export declare const alertRuleTemplatePreviewSchema: z.ZodObject<{
    template: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        category: z.ZodEnum<["NETWORK", "SECURITY", "RESOURCES", "VPN", "DHCP", "SYSTEM", "CUSTOM"]>;
        eventType: z.ZodString;
        severity: z.ZodEnum<["CRITICAL", "WARNING", "INFO"]>;
        conditions: z.ZodArray<z.ZodObject<{
            field: z.ZodString;
            operator: z.ZodEnum<["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN", "CONTAINS", "REGEX"]>;
            value: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
            value: string;
            field: string;
        }, {
            operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
            value: string;
            field: string;
        }>, "many">;
        channels: z.ZodArray<z.ZodString, "many">;
        throttle: z.ZodOptional<z.ZodObject<{
            maxAlerts: z.ZodNumber;
            periodSeconds: z.ZodNumber;
            groupByField: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            maxAlerts: number;
            periodSeconds: number;
            groupByField?: string | undefined;
        }, {
            maxAlerts: number;
            periodSeconds: number;
            groupByField?: string | undefined;
        }>>;
        variables: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            label: z.ZodString;
            type: z.ZodEnum<["STRING", "INTEGER", "DURATION", "PERCENTAGE"]>;
            required: z.ZodDefault<z.ZodBoolean>;
            defaultValue: z.ZodOptional<z.ZodString>;
            min: z.ZodOptional<z.ZodNumber>;
            max: z.ZodOptional<z.ZodNumber>;
            unit: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            label: string;
            name: string;
            type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
            required: boolean;
            max?: number | undefined;
            min?: number | undefined;
            defaultValue?: string | undefined;
            description?: string | undefined;
            unit?: string | undefined;
        }, {
            label: string;
            name: string;
            type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
            max?: number | undefined;
            min?: number | undefined;
            defaultValue?: string | undefined;
            required?: boolean | undefined;
            description?: string | undefined;
            unit?: string | undefined;
        }>, "many">>;
        isBuiltIn: z.ZodDefault<z.ZodBoolean>;
        version: z.ZodDefault<z.ZodString>;
        createdAt: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
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
    }, {
        severity: "CRITICAL" | "WARNING" | "INFO";
        id: string;
        name: string;
        description: string;
        category: "VPN" | "DHCP" | "NETWORK" | "CUSTOM" | "SECURITY" | "RESOURCES" | "SYSTEM";
        eventType: string;
        conditions: {
            operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
            value: string;
            field: string;
        }[];
        channels: string[];
        version?: string | undefined;
        throttle?: {
            maxAlerts: number;
            periodSeconds: number;
            groupByField?: string | undefined;
        } | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        isBuiltIn?: boolean | undefined;
        variables?: {
            label: string;
            name: string;
            type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
            max?: number | undefined;
            min?: number | undefined;
            defaultValue?: string | undefined;
            required?: boolean | undefined;
            description?: string | undefined;
            unit?: string | undefined;
        }[] | undefined;
    }>;
    resolvedConditions: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN", "CONTAINS", "REGEX"]>;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }, {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }>, "many">;
    validationInfo: z.ZodObject<{
        isValid: z.ZodBoolean;
        missingVariables: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        warnings: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        isValid: boolean;
        warnings: string[];
        missingVariables: string[];
    }, {
        isValid: boolean;
        warnings?: string[] | undefined;
        missingVariables?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    template: {
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
    };
    resolvedConditions: {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }[];
    validationInfo: {
        isValid: boolean;
        warnings: string[];
        missingVariables: string[];
    };
}, {
    template: {
        severity: "CRITICAL" | "WARNING" | "INFO";
        id: string;
        name: string;
        description: string;
        category: "VPN" | "DHCP" | "NETWORK" | "CUSTOM" | "SECURITY" | "RESOURCES" | "SYSTEM";
        eventType: string;
        conditions: {
            operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
            value: string;
            field: string;
        }[];
        channels: string[];
        version?: string | undefined;
        throttle?: {
            maxAlerts: number;
            periodSeconds: number;
            groupByField?: string | undefined;
        } | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        isBuiltIn?: boolean | undefined;
        variables?: {
            label: string;
            name: string;
            type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
            max?: number | undefined;
            min?: number | undefined;
            defaultValue?: string | undefined;
            required?: boolean | undefined;
            description?: string | undefined;
            unit?: string | undefined;
        }[] | undefined;
    };
    resolvedConditions: {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }[];
    validationInfo: {
        isValid: boolean;
        warnings?: string[] | undefined;
        missingVariables?: string[] | undefined;
    };
}>;
/**
 * Input for saving a custom template
 * @description Used with the saveCustomAlertRuleTemplate mutation to create and update custom alert rule templates
 */
export declare const customAlertRuleTemplateInputSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<["NETWORK", "SECURITY", "RESOURCES", "VPN", "DHCP", "SYSTEM", "CUSTOM"]>;
    severity: z.ZodEnum<["CRITICAL", "WARNING", "INFO"]>;
    eventType: z.ZodString;
    conditions: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN", "CONTAINS", "REGEX"]>;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }, {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }>, "many">;
    channels: z.ZodArray<z.ZodString, "many">;
    throttle: z.ZodOptional<z.ZodObject<{
        maxAlerts: z.ZodNumber;
        periodSeconds: z.ZodNumber;
        groupByField: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        maxAlerts: number;
        periodSeconds: number;
        groupByField?: string | undefined;
    }, {
        maxAlerts: number;
        periodSeconds: number;
        groupByField?: string | undefined;
    }>>;
    variables: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        label: z.ZodString;
        type: z.ZodEnum<["STRING", "INTEGER", "DURATION", "PERCENTAGE"]>;
        required: z.ZodDefault<z.ZodBoolean>;
        defaultValue: z.ZodOptional<z.ZodString>;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        name: string;
        type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
        required: boolean;
        max?: number | undefined;
        min?: number | undefined;
        defaultValue?: string | undefined;
        description?: string | undefined;
        unit?: string | undefined;
    }, {
        label: string;
        name: string;
        type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
        max?: number | undefined;
        min?: number | undefined;
        defaultValue?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        unit?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    severity: "CRITICAL" | "WARNING" | "INFO";
    name: string;
    description: string;
    category: "VPN" | "DHCP" | "NETWORK" | "CUSTOM" | "SECURITY" | "RESOURCES" | "SYSTEM";
    eventType: string;
    conditions: {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }[];
    channels: string[];
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
}, {
    severity: "CRITICAL" | "WARNING" | "INFO";
    name: string;
    description: string;
    category: "VPN" | "DHCP" | "NETWORK" | "CUSTOM" | "SECURITY" | "RESOURCES" | "SYSTEM";
    eventType: string;
    conditions: {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }[];
    channels: string[];
    throttle?: {
        maxAlerts: number;
        periodSeconds: number;
        groupByField?: string | undefined;
    } | undefined;
    variables?: {
        label: string;
        name: string;
        type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
        max?: number | undefined;
        min?: number | undefined;
        defaultValue?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        unit?: string | undefined;
    }[] | undefined;
}>, {
    severity: "CRITICAL" | "WARNING" | "INFO";
    name: string;
    description: string;
    category: "VPN" | "DHCP" | "NETWORK" | "CUSTOM" | "SECURITY" | "RESOURCES" | "SYSTEM";
    eventType: string;
    conditions: {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }[];
    channels: string[];
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
}, {
    severity: "CRITICAL" | "WARNING" | "INFO";
    name: string;
    description: string;
    category: "VPN" | "DHCP" | "NETWORK" | "CUSTOM" | "SECURITY" | "RESOURCES" | "SYSTEM";
    eventType: string;
    conditions: {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }[];
    channels: string[];
    throttle?: {
        maxAlerts: number;
        periodSeconds: number;
        groupByField?: string | undefined;
    } | undefined;
    variables?: {
        label: string;
        name: string;
        type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
        max?: number | undefined;
        min?: number | undefined;
        defaultValue?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        unit?: string | undefined;
    }[] | undefined;
}>;
/**
 * Input for applying a template to create an alert rule
 */
export declare const applyAlertRuleTemplateInputSchema: z.ZodObject<{
    templateId: z.ZodString;
    variables: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    customizations: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        deviceId: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        deviceId?: string | undefined;
        name?: string | undefined;
        description?: string | undefined;
    }, {
        deviceId?: string | undefined;
        name?: string | undefined;
        description?: string | undefined;
        enabled?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    variables: Record<string, string | number>;
    templateId: string;
    customizations?: {
        enabled: boolean;
        deviceId?: string | undefined;
        name?: string | undefined;
        description?: string | undefined;
    } | undefined;
}, {
    variables: Record<string, string | number>;
    templateId: string;
    customizations?: {
        deviceId?: string | undefined;
        name?: string | undefined;
        description?: string | undefined;
        enabled?: boolean | undefined;
    } | undefined;
}>;
/**
 * Template import schema
 * Validates imported JSON templates
 */
export declare const alertRuleTemplateImportSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<["NETWORK", "SECURITY", "RESOURCES", "VPN", "DHCP", "SYSTEM", "CUSTOM"]>;
    eventType: z.ZodString;
    severity: z.ZodEnum<["CRITICAL", "WARNING", "INFO"]>;
    conditions: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN", "CONTAINS", "REGEX"]>;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }, {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }>, "many">;
    channels: z.ZodArray<z.ZodString, "many">;
    throttle: z.ZodOptional<z.ZodObject<{
        maxAlerts: z.ZodNumber;
        periodSeconds: z.ZodNumber;
        groupByField: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        maxAlerts: number;
        periodSeconds: number;
        groupByField?: string | undefined;
    }, {
        maxAlerts: number;
        periodSeconds: number;
        groupByField?: string | undefined;
    }>>;
    variables: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        label: z.ZodString;
        type: z.ZodEnum<["STRING", "INTEGER", "DURATION", "PERCENTAGE"]>;
        required: z.ZodDefault<z.ZodBoolean>;
        defaultValue: z.ZodOptional<z.ZodString>;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        name: string;
        type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
        required: boolean;
        max?: number | undefined;
        min?: number | undefined;
        defaultValue?: string | undefined;
        description?: string | undefined;
        unit?: string | undefined;
    }, {
        label: string;
        name: string;
        type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
        max?: number | undefined;
        min?: number | undefined;
        defaultValue?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        unit?: string | undefined;
    }>, "many">>;
    isBuiltIn: z.ZodDefault<z.ZodBoolean>;
    version: z.ZodDefault<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "id" | "createdAt" | "updatedAt" | "isBuiltIn">, "strip", z.ZodTypeAny, {
    severity: "CRITICAL" | "WARNING" | "INFO";
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
}, {
    severity: "CRITICAL" | "WARNING" | "INFO";
    name: string;
    description: string;
    category: "VPN" | "DHCP" | "NETWORK" | "CUSTOM" | "SECURITY" | "RESOURCES" | "SYSTEM";
    eventType: string;
    conditions: {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }[];
    channels: string[];
    version?: string | undefined;
    throttle?: {
        maxAlerts: number;
        periodSeconds: number;
        groupByField?: string | undefined;
    } | undefined;
    variables?: {
        label: string;
        name: string;
        type: "STRING" | "INTEGER" | "DURATION" | "PERCENTAGE";
        max?: number | undefined;
        min?: number | undefined;
        defaultValue?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        unit?: string | undefined;
    }[] | undefined;
}>;
export type AlertRuleTemplateCategory = z.infer<typeof alertRuleTemplateCategorySchema>;
export type AlertRuleTemplateVariableType = z.infer<typeof alertRuleTemplateVariableTypeSchema>;
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;
export type ConditionOperator = z.infer<typeof conditionOperatorSchema>;
export type AlertRuleTemplateVariable = z.infer<typeof alertRuleTemplateVariableSchema>;
export type AlertCondition = z.infer<typeof alertConditionSchema>;
export type ThrottleConfig = z.infer<typeof throttleConfigSchema>;
export type AlertRuleTemplate = z.infer<typeof alertRuleTemplateSchema>;
export type AlertRuleTemplatePreview = z.infer<typeof alertRuleTemplatePreviewSchema>;
export type CustomAlertRuleTemplateInput = z.infer<typeof customAlertRuleTemplateInputSchema>;
export type ApplyAlertRuleTemplateInput = z.infer<typeof applyAlertRuleTemplateInputSchema>;
export type AlertRuleTemplateImport = z.infer<typeof alertRuleTemplateImportSchema>;
export type ValidationInfo = z.infer<typeof validationInfoSchema>;
//# sourceMappingURL=alert-rule-template.schema.d.ts.map