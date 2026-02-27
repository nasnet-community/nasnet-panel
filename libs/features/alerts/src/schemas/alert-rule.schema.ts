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

// ============================================================================
// Constants (UPPER_SNAKE_CASE per checklist)
// ============================================================================

/** Maximum allowed characters in rule name */
export const MAX_RULE_NAME_LENGTH = 100;

/** Maximum allowed characters in description */
export const MAX_DESCRIPTION_LENGTH = 500;

/** Maximum number of conditions per rule */
export const MAX_CONDITIONS_PER_RULE = 10;

/** Minimum number of conditions required */
export const MIN_CONDITIONS_PER_RULE = 1;

/** Maximum number of notification channels per rule */
export const MAX_CHANNELS_PER_RULE = 5;

/** Minimum number of notification channels required */
export const MIN_CHANNELS_PER_RULE = 1;

/** Minimum throttle period in seconds */
export const MIN_THROTTLE_PERIOD_SECONDS = 60;

/** Minimum throttle alert count */
export const MIN_THROTTLE_MAX_ALERTS = 1;

/** Maximum number of tags per condition */
export const MAX_CONDITION_TAGS = 5;

/** Pattern for valid HH:MM time format */
const TIME_FORMAT_PATTERN = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

// ============================================================================
// Schemas
// ============================================================================

/**
 * Condition operator enum matching GraphQL schema
 * Options: EQUALS, NOT_EQUALS, GREATER_THAN, LESS_THAN, CONTAINS, REGEX
 */
export const conditionOperatorSchema = z.enum([
  'EQUALS',
  'NOT_EQUALS',
  'GREATER_THAN',
  'LESS_THAN',
  'CONTAINS',
  'REGEX',
]);

/**
 * Alert severity enum matching GraphQL schema
 * Options: CRITICAL (immediate attention), WARNING (address soon), INFO (informational)
 */
export const alertSeveritySchema = z.enum(['CRITICAL', 'WARNING', 'INFO']);

/**
 * Alert condition schema
 * Validates individual alert trigger conditions
 */
export const alertConditionSchema = z.object({
  field: z
    .string()
    .min(1, 'Specify which field to monitor (e.g., "cpu_usage", "interface_status")'),
  operator: conditionOperatorSchema,
  value: z.string().min(1, 'Enter a comparison value (e.g., "80" for CPU > 80%)'),
});

/**
 * Throttle configuration schema
 * Prevents alert flooding by limiting frequency
 */
export const throttleConfigSchema = z.object({
  maxAlerts: z
    .number()
    .int()
    .min(MIN_THROTTLE_MAX_ALERTS, `Minimum ${MIN_THROTTLE_MAX_ALERTS} alert allowed per period`),
  periodSeconds: z
    .number()
    .int()
    .min(
      MIN_THROTTLE_PERIOD_SECONDS,
      `Period must be at least ${MIN_THROTTLE_PERIOD_SECONDS} seconds (1 minute)`
    ),
  groupByField: z.string().optional(),
});

/**
 * Quiet hours configuration schema
 * Suppresses alerts during specified time windows
 */
export const quietHoursConfigSchema = z.object({
  startTime: z
    .string()
    .regex(TIME_FORMAT_PATTERN, 'Start time must be in HH:MM format (e.g., "09:00")'),
  endTime: z
    .string()
    .regex(TIME_FORMAT_PATTERN, 'End time must be in HH:MM format (e.g., "17:00")'),
  timezone: z.string().min(1, 'Select a timezone for quiet hours (e.g., "America/New_York")'),
  bypassCritical: z.boolean().default(true),
  daysOfWeek: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'Select at least one day of the week')
    .refine(
      (days) => {
        const uniqueDays = new Set(days);
        return uniqueDays.size === days.length;
      },
      { message: 'Remove duplicate days from selection' }
    ),
});

/**
 * Main alert rule form schema
 *
 * @description Comprehensive validation for alert rule creation with name, trigger conditions,
 * severity level, notification channels, and optional quiet hours. All error messages are
 * actionable and guide users to fix validation issues.
 */
export const alertRuleFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Enter a descriptive name for this alert rule (e.g., "High CPU Alert")')
    .max(MAX_RULE_NAME_LENGTH, `Rule name must be ${MAX_RULE_NAME_LENGTH} characters or fewer`),
  description: z
    .string()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`
    )
    .optional(),
  eventType: z
    .string()
    .min(1, 'Select an event type to trigger alerts on (e.g., "device.offline", "interface.down")'),
  conditions: z
    .array(alertConditionSchema)
    .min(
      MIN_CONDITIONS_PER_RULE,
      `Add at least ${MIN_CONDITIONS_PER_RULE} condition to trigger this alert`
    )
    .max(MAX_CONDITIONS_PER_RULE, `Maximum ${MAX_CONDITIONS_PER_RULE} conditions allowed per rule`),
  severity: alertSeveritySchema,
  channels: z
    .array(z.string())
    .min(
      MIN_CHANNELS_PER_RULE,
      `Select at least ${MIN_CHANNELS_PER_RULE} notification channel (email, Telegram, webhook, etc.)`
    )
    .max(MAX_CHANNELS_PER_RULE, `Maximum ${MAX_CHANNELS_PER_RULE} notification channels allowed`),
  throttle: throttleConfigSchema.optional(),
  quietHours: quietHoursConfigSchema.optional(),
  deviceId: z.string().optional(),
  enabled: z.boolean().default(true),
});

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
export const defaultAlertRule: Partial<AlertRuleFormData> = {
  name: '',
  description: '',
  eventType: '',
  conditions: [
    {
      field: '',
      operator: 'EQUALS',
      value: '',
    },
  ],
  severity: 'WARNING',
  channels: ['inapp'],
  enabled: true,
  throttle: undefined,
  quietHours: undefined,
};

/**
 * Common event types for alert rule autocomplete
 * Provides suggested trigger events for quick rule creation
 */
export const COMMON_EVENT_TYPES = [
  'device.offline',
  'device.online',
  'device.cpu.high',
  'device.memory.high',
  'device.disk.full',
  'interface.down',
  'interface.up',
  'interface.traffic.high',
  'vpn.tunnel.down',
  'vpn.tunnel.up',
  'dhcp.lease.exhausted',
  'firewall.attack.detected',
  'backup.failed',
  'update.available',
] as const;

/**
 * Available notification channels for alert delivery
 * Includes icon and display label for each channel type
 */
export const NOTIFICATION_CHANNELS = [
  { value: 'inapp', label: 'In-App Notifications', icon: 'Bell' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'telegram', label: 'Telegram', icon: 'MessageCircle' },
  { value: 'pushover', label: 'Pushover', icon: 'Smartphone' },
  { value: 'webhook', label: 'Webhook', icon: 'Webhook' },
] as const;

/**
 * Alert severity level configuration
 * Defines color, label, and description for each severity tier
 */
export const SEVERITY_CONFIG = {
  CRITICAL: {
    label: 'Critical',
    color: 'semantic.error' as const,
    badgeClass: 'bg-error text-white',
    borderClass: 'border-l-error',
    description: 'Requires immediate attention',
  },
  WARNING: {
    label: 'Warning',
    color: 'semantic.warning' as const,
    badgeClass: 'bg-warning text-white',
    borderClass: 'border-l-warning',
    description: 'Should be addressed soon',
  },
  INFO: {
    label: 'Info',
    color: 'semantic.info' as const,
    badgeClass: 'bg-info text-white',
    borderClass: 'border-l-info',
    description: 'For your information',
  },
} as const;

/**
 * Condition operator display configuration
 * Maps operator enum values to human-readable labels and mathematical symbols
 */
export const OPERATOR_CONFIG = {
  EQUALS: { label: 'Equals', symbol: '=' },
  NOT_EQUALS: { label: 'Not Equals', symbol: '≠' },
  GREATER_THAN: { label: 'Greater Than', symbol: '>' },
  LESS_THAN: { label: 'Less Than', symbol: '<' },
  CONTAINS: { label: 'Contains', symbol: '⊃' },
  REGEX: { label: 'Matches Regex', symbol: '/.*/' },
} as const;
