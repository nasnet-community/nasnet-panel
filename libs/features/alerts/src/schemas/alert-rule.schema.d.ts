/**
 * Zod validation schemas for alert rules
 *
 * @description Provides form validation for alert rule creation and configuration.
 * All error messages are actionable, not generic. Constants follow UPPER_SNAKE_CASE naming.
 *
 * @module @nasnet/features/alerts/schemas
 * @see NAS-18.9: Alert rule form validation schema
 */
import { z } from 'zod';
/** Maximum allowed characters in rule name */
export declare const MAX_RULE_NAME_LENGTH = 100;
/** Maximum allowed characters in description */
export declare const MAX_DESCRIPTION_LENGTH = 500;
/** Maximum number of conditions per rule */
export declare const MAX_CONDITIONS_PER_RULE = 10;
/** Minimum number of conditions required */
export declare const MIN_CONDITIONS_PER_RULE = 1;
/** Maximum number of notification channels per rule */
export declare const MAX_CHANNELS_PER_RULE = 5;
/** Minimum number of notification channels required */
export declare const MIN_CHANNELS_PER_RULE = 1;
/** Minimum throttle period in seconds */
export declare const MIN_THROTTLE_PERIOD_SECONDS = 60;
/** Minimum throttle alert count */
export declare const MIN_THROTTLE_MAX_ALERTS = 1;
/** Maximum number of tags per condition */
export declare const MAX_CONDITION_TAGS = 5;
/**
 * Condition operator enum matching GraphQL schema
 * Options: EQUALS, NOT_EQUALS, GREATER_THAN, LESS_THAN, CONTAINS, REGEX
 */
export declare const conditionOperatorSchema: z.ZodEnum<["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN", "CONTAINS", "REGEX"]>;
/**
 * Alert severity enum matching GraphQL schema
 * Options: CRITICAL (immediate attention), WARNING (address soon), INFO (informational)
 */
export declare const alertSeveritySchema: z.ZodEnum<["CRITICAL", "WARNING", "INFO"]>;
/**
 * Alert condition schema
 * Validates individual alert trigger conditions
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
 * Prevents alert flooding by limiting frequency
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
 * Quiet hours configuration schema
 * Suppresses alerts during specified time windows
 */
export declare const quietHoursConfigSchema: z.ZodObject<{
    startTime: z.ZodString;
    endTime: z.ZodString;
    timezone: z.ZodString;
    bypassCritical: z.ZodDefault<z.ZodBoolean>;
    daysOfWeek: z.ZodEffects<z.ZodArray<z.ZodNumber, "many">, number[], number[]>;
}, "strip", z.ZodTypeAny, {
    startTime: string;
    endTime: string;
    timezone: string;
    bypassCritical: boolean;
    daysOfWeek: number[];
}, {
    startTime: string;
    endTime: string;
    timezone: string;
    daysOfWeek: number[];
    bypassCritical?: boolean | undefined;
}>;
/**
 * Main alert rule form schema
 *
 * @description Comprehensive validation for alert rule creation with name, trigger conditions,
 * severity level, notification channels, and optional quiet hours. All error messages are
 * actionable and guide users to fix validation issues.
 */
export declare const alertRuleFormSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
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
    severity: z.ZodEnum<["CRITICAL", "WARNING", "INFO"]>;
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
    quietHours: z.ZodOptional<z.ZodObject<{
        startTime: z.ZodString;
        endTime: z.ZodString;
        timezone: z.ZodString;
        bypassCritical: z.ZodDefault<z.ZodBoolean>;
        daysOfWeek: z.ZodEffects<z.ZodArray<z.ZodNumber, "many">, number[], number[]>;
    }, "strip", z.ZodTypeAny, {
        startTime: string;
        endTime: string;
        timezone: string;
        bypassCritical: boolean;
        daysOfWeek: number[];
    }, {
        startTime: string;
        endTime: string;
        timezone: string;
        daysOfWeek: number[];
        bypassCritical?: boolean | undefined;
    }>>;
    deviceId: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    severity: "CRITICAL" | "WARNING" | "INFO";
    name: string;
    enabled: boolean;
    eventType: string;
    conditions: {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }[];
    channels: string[];
    deviceId?: string | undefined;
    description?: string | undefined;
    throttle?: {
        maxAlerts: number;
        periodSeconds: number;
        groupByField?: string | undefined;
    } | undefined;
    quietHours?: {
        startTime: string;
        endTime: string;
        timezone: string;
        bypassCritical: boolean;
        daysOfWeek: number[];
    } | undefined;
}, {
    severity: "CRITICAL" | "WARNING" | "INFO";
    name: string;
    eventType: string;
    conditions: {
        operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "REGEX";
        value: string;
        field: string;
    }[];
    channels: string[];
    deviceId?: string | undefined;
    description?: string | undefined;
    enabled?: boolean | undefined;
    throttle?: {
        maxAlerts: number;
        periodSeconds: number;
        groupByField?: string | undefined;
    } | undefined;
    quietHours?: {
        startTime: string;
        endTime: string;
        timezone: string;
        daysOfWeek: number[];
        bypassCritical?: boolean | undefined;
    } | undefined;
}>;
/**
 * Type inference for alert rule form
 */
export type AlertRuleFormData = z.infer<typeof alertRuleFormSchema>;
/**
 * Type inference for alert condition
 */
export type AlertConditionData = z.infer<typeof alertConditionSchema>;
/**
 * Type inference for throttle config
 */
export type ThrottleConfigData = z.infer<typeof throttleConfigSchema>;
/**
 * Type inference for quiet hours config
 */
export type QuietHoursConfigData = z.infer<typeof quietHoursConfigSchema>;
/**
 * Default values for new alert rule
 */
export declare const defaultAlertRule: Partial<AlertRuleFormData>;
/**
 * Common event types for alert rule autocomplete
 * Provides suggested trigger events for quick rule creation
 */
export declare const COMMON_EVENT_TYPES: readonly ["device.offline", "device.online", "device.cpu.high", "device.memory.high", "device.disk.full", "interface.down", "interface.up", "interface.traffic.high", "vpn.tunnel.down", "vpn.tunnel.up", "dhcp.lease.exhausted", "firewall.attack.detected", "backup.failed", "update.available"];
/**
 * Available notification channels for alert delivery
 * Includes icon and display label for each channel type
 */
export declare const NOTIFICATION_CHANNELS: readonly [{
    readonly value: "inapp";
    readonly label: "In-App Notifications";
    readonly icon: "Bell";
}, {
    readonly value: "email";
    readonly label: "Email";
    readonly icon: "Mail";
}, {
    readonly value: "telegram";
    readonly label: "Telegram";
    readonly icon: "MessageCircle";
}, {
    readonly value: "pushover";
    readonly label: "Pushover";
    readonly icon: "Smartphone";
}, {
    readonly value: "webhook";
    readonly label: "Webhook";
    readonly icon: "Webhook";
}];
/**
 * Alert severity level configuration
 * Defines color, label, and description for each severity tier
 */
export declare const SEVERITY_CONFIG: {
    readonly CRITICAL: {
        readonly label: "Critical";
        readonly color: "semantic.error";
        readonly description: "Requires immediate attention";
    };
    readonly WARNING: {
        readonly label: "Warning";
        readonly color: "semantic.warning";
        readonly description: "Should be addressed soon";
    };
    readonly INFO: {
        readonly label: "Info";
        readonly color: "semantic.info";
        readonly description: "For your information";
    };
};
/**
 * Condition operator display configuration
 * Maps operator enum values to human-readable labels and mathematical symbols
 */
export declare const OPERATOR_CONFIG: {
    readonly EQUALS: {
        readonly label: "Equals";
        readonly symbol: "=";
    };
    readonly NOT_EQUALS: {
        readonly label: "Not Equals";
        readonly symbol: "≠";
    };
    readonly GREATER_THAN: {
        readonly label: "Greater Than";
        readonly symbol: ">";
    };
    readonly LESS_THAN: {
        readonly label: "Less Than";
        readonly symbol: "<";
    };
    readonly CONTAINS: {
        readonly label: "Contains";
        readonly symbol: "⊃";
    };
    readonly REGEX: {
        readonly label: "Matches Regex";
        readonly symbol: "/.*/";
    };
};
//# sourceMappingURL=alert-rule.schema.d.ts.map