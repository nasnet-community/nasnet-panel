/**
 * Zod validation schema for alert rules
 * Per Task 4.9: Add form validation with Zod schema
 */
import { z } from 'zod';

/**
 * Condition operator enum matching GraphQL schema
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
 */
export const alertSeveritySchema = z.enum(['CRITICAL', 'WARNING', 'INFO']);

/**
 * Alert condition schema
 */
export const alertConditionSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  operator: conditionOperatorSchema,
  value: z.string().min(1, 'Value is required'),
});

/**
 * Throttle configuration schema
 */
export const throttleConfigSchema = z.object({
  maxAlerts: z.number().int().min(1, 'Max alerts must be at least 1'),
  periodSeconds: z.number().int().min(60, 'Period must be at least 60 seconds'),
  groupByField: z.string().optional(),
});

/**
 * Quiet hours configuration schema
 */
export const quietHoursConfigSchema = z.object({
  startTime: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  timezone: z.string().min(1, 'Timezone is required'),
  bypassCritical: z.boolean().default(true),
  daysOfWeek: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'At least one day must be selected')
    .refine(
      (days) => {
        const uniqueDays = new Set(days);
        return uniqueDays.size === days.length;
      },
      { message: 'Duplicate days are not allowed' }
    ),
});

/**
 * Main alert rule form schema
 * Per AC1: User can create alert rules with name, trigger condition, severity,
 * notification channels, and optional quiet hours
 */
export const alertRuleFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Rule name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  eventType: z.string().min(1, 'Event type is required'),
  conditions: z
    .array(alertConditionSchema)
    .min(1, 'At least one condition is required')
    .max(10, 'Maximum 10 conditions allowed'),
  severity: alertSeveritySchema,
  channels: z
    .array(z.string())
    .min(1, 'At least one notification channel is required')
    .max(5, 'Maximum 5 channels allowed'),
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
 * Common event types for autocomplete
 */
export const commonEventTypes = [
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
 * Available notification channels
 */
export const notificationChannels = [
  { value: 'inapp', label: 'In-App Notifications', icon: 'Bell' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'telegram', label: 'Telegram', icon: 'MessageCircle' },
  { value: 'pushover', label: 'Pushover', icon: 'Smartphone' },
  { value: 'webhook', label: 'Webhook', icon: 'Webhook' },
] as const;

/**
 * Severity display configuration
 */
export const severityConfig = {
  CRITICAL: {
    label: 'Critical',
    color: 'semantic.error' as const,
    description: 'Requires immediate attention',
  },
  WARNING: {
    label: 'Warning',
    color: 'semantic.warning' as const,
    description: 'Should be addressed soon',
  },
  INFO: {
    label: 'Info',
    color: 'semantic.info' as const,
    description: 'For your information',
  },
} as const;

/**
 * Operator display configuration
 */
export const operatorConfig = {
  EQUALS: { label: 'Equals', symbol: '=' },
  NOT_EQUALS: { label: 'Not Equals', symbol: '≠' },
  GREATER_THAN: { label: 'Greater Than', symbol: '>' },
  LESS_THAN: { label: 'Less Than', symbol: '<' },
  CONTAINS: { label: 'Contains', symbol: '⊃' },
  REGEX: { label: 'Matches Regex', symbol: '/.*/' },
} as const;
