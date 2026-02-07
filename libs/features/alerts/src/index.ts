/**
 * Public exports for @nasnet/features/alerts
 */

// Hooks
export { useAlertRules, useAlertRule, useCreateAlertRule, useUpdateAlertRule, useDeleteAlertRule } from './hooks/useAlertRules';
export { useAlerts, useAcknowledgeAlert, useAcknowledgeAlerts, useUnacknowledgedAlertCount } from './hooks/useAlerts';
export { useNotificationChannels } from './hooks/useNotificationChannels';
export type { ChannelConfig } from './hooks/useNotificationChannels';

// Components
export { AlertRuleForm } from './components/AlertRuleForm';
export { AlertList } from './components/AlertList';
export { AlertBadge } from './components/AlertBadge';

// Pages
export { NotificationSettingsPage } from './pages/NotificationSettingsPage';

// Schemas
export {
  alertRuleFormSchema,
  alertConditionSchema,
  throttleConfigSchema,
  quietHoursConfigSchema,
  defaultAlertRule,
  commonEventTypes,
  notificationChannels,
  severityConfig,
  operatorConfig,
} from './schemas/alert-rule.schema';

export type {
  AlertRuleFormData,
  AlertConditionData,
  ThrottleConfigData,
  QuietHoursConfigData,
} from './schemas/alert-rule.schema';
