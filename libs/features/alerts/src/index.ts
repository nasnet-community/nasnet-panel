/**
 * Public exports for @nasnet/features/alerts
 */

// Hooks
export { useAlertRules, useAlertRule, useCreateAlertRule, useUpdateAlertRule, useDeleteAlertRule } from './hooks/useAlertRules';
export { useAlerts, useAcknowledgeAlert, useAcknowledgeAlerts, useUnacknowledgedAlertCount } from './hooks/useAlerts';
export { useNotificationChannels } from './hooks/useNotificationChannels';
export type { ChannelConfig } from './hooks/useNotificationChannels';
export { useAlertNotifications, playAlertSound } from './hooks/useAlertNotifications';
export type { UseAlertNotificationsOptions } from './hooks/useAlertNotifications';
export { usePushoverUsage } from './hooks/usePushoverUsage';
export type { UsePushoverUsageResult, PushoverUsageData } from './hooks/usePushoverUsage';
export { useEmailChannelForm } from './hooks/useEmailChannelForm';
export type { UseEmailChannelFormOptions, UseEmailChannelFormReturn } from './hooks/useEmailChannelForm';
export { useWebhookConfigForm } from './hooks/useWebhookConfigForm';
export type { UseWebhookConfigFormOptions, UseWebhookConfigFormReturn } from './hooks/useWebhookConfigForm';
export { useNtfyChannelForm } from './hooks/useNtfyChannelForm';
export type { UseNtfyChannelFormOptions, UseNtfyChannelFormReturn } from './hooks/useNtfyChannelForm';

// Alert Rule Template hooks (NAS-18.12)
export {
  useAlertRuleTemplates,
  useAlertRuleTemplate,
  usePreviewAlertRuleTemplate,
  useApplyAlertRuleTemplate,
  useSaveCustomAlertRuleTemplate,
  useDeleteCustomAlertRuleTemplate,
  useImportAlertRuleTemplate,
  useExportAlertRuleTemplate,
} from './hooks/useAlertRuleTemplates';

// Components
export { AlertRuleForm } from './components/AlertRuleForm';
export { AlertList } from './components/AlertList';
export { AlertBadge } from './components/AlertBadge';
export { InAppNotificationPreferences } from './components/InAppNotificationPreferences';
export type { InAppNotificationPreferencesProps } from './components/InAppNotificationPreferences';
export {
  QuietHoursConfig,
  DayOfWeekSelector,
  TimeRangeInput,
  TimezoneSelector,
} from './components/QuietHoursConfig';
export type {
  QuietHoursConfigData as QuietHoursConfigComponentData,
  QuietHoursConfigProps,
  DayOfWeek,
} from './components/QuietHoursConfig';
export { QueuedAlertBadge } from './components/QueuedAlertBadge';
export type { QueuedAlertBadgeProps } from './components/QueuedAlertBadge';
export { EmailChannelForm } from './components/EmailChannelForm';
export type { EmailChannelFormProps } from './components/EmailChannelForm';
export { EmailChannelFormDesktop } from './components/EmailChannelFormDesktop';
export type { EmailChannelFormDesktopProps } from './components/EmailChannelFormDesktop';
export { EmailChannelFormMobile } from './components/EmailChannelFormMobile';
export type { EmailChannelFormMobileProps } from './components/EmailChannelFormMobile';
export { WebhookConfigForm } from './components/WebhookConfigForm';
export type { WebhookConfigFormProps } from './components/WebhookConfigForm';
export { WebhookConfigFormDesktop } from './components/WebhookConfigFormDesktop';
export type { WebhookConfigFormDesktopProps } from './components/WebhookConfigFormDesktop';
export { WebhookConfigFormMobile } from './components/WebhookConfigFormMobile';
export type { WebhookConfigFormMobileProps } from './components/WebhookConfigFormMobile';
export { NtfyChannelForm } from './components/ChannelForms/NtfyChannelForm';
export type { NtfyChannelFormProps } from './components/ChannelForms/NtfyChannelForm';
export { NtfyChannelFormDesktop } from './components/ChannelForms/NtfyChannelFormDesktop';
export type { NtfyChannelFormDesktopProps } from './components/ChannelForms/NtfyChannelFormDesktop';
export { NtfyChannelFormMobile } from './components/ChannelForms/NtfyChannelFormMobile';
export type { NtfyChannelFormMobileProps } from './components/ChannelForms/NtfyChannelFormMobile';

// Alert Rule Template Components (NAS-18.12)
export {
  AlertTemplateBrowser,
  AlertTemplateDetailPanel,
  AlertTemplateApplyDialog,
  SaveTemplateDialog,
  ImportTemplateDialog,
  ExportTemplateDialog,
} from './components/alert-templates';
export type {
  AlertTemplateBrowserProps,
  AlertTemplateDetailPanelProps,
  AlertTemplateApplyDialogProps,
  SaveTemplateDialogProps,
  ImportTemplateDialogProps,
  ExportTemplateDialogProps,
} from './components/alert-templates';

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

export {
  emailConfigSchema,
  defaultEmailConfig,
  SMTP_PORT_PRESETS,
  isValidEmail,
  toEmailConfigInput,
} from './schemas/email-config.schema';

export type { EmailConfig } from './schemas/email-config.schema';

export {
  webhookConfigSchema,
  defaultWebhookConfig,
  WEBHOOK_TEMPLATE_PRESETS,
  AUTH_TYPE_OPTIONS,
  toWebhookInput,
} from './schemas/webhook.schema';

export type { WebhookConfig } from './schemas/webhook.schema';

export {
  ntfyConfigSchema,
  defaultNtfyConfig,
  NTFY_PRIORITY_PRESETS,
  NTFY_SERVER_PRESETS,
  isValidNtfyTopic,
  isValidNtfyServerUrl,
  formatNtfyTags,
  parseNtfyTags,
} from './schemas/ntfy-config.schema';

export type { NtfyConfig } from './schemas/ntfy-config.schema';

// Alert Rule Template schemas (NAS-18.12)
export {
  alertRuleTemplateSchema,
  alertRuleTemplateVariableSchema,
  alertRuleTemplatePreviewSchema,
  customAlertRuleTemplateInputSchema,
  applyAlertRuleTemplateInputSchema,
  alertRuleTemplateImportSchema,
  alertRuleTemplateCategorySchema,
  alertRuleTemplateVariableTypeSchema,
  alertSeveritySchema,
  alertConditionSchema as alertRuleTemplateConditionSchema,
  throttleConfigSchema as alertRuleTemplateThrottleConfigSchema,
  validationInfoSchema as alertRuleTemplateValidationInfoSchema,
} from './schemas/alert-rule-template.schema';

export type {
  AlertRuleTemplate,
  AlertRuleTemplateVariable,
  AlertRuleTemplatePreview,
  CustomAlertRuleTemplateInput,
  ApplyAlertRuleTemplateInput,
  AlertRuleTemplateImport,
  AlertRuleTemplateCategory,
  AlertRuleTemplateVariableType,
  AlertSeverity as AlertRuleTemplateSeverity,
  ConditionOperator,
  AlertCondition as AlertRuleTemplateCondition,
  ThrottleConfig as AlertRuleTemplateThrottleConfig,
  ValidationInfo as AlertRuleTemplateValidationInfo,
} from './schemas/alert-rule-template.schema';

// Alert Rule Template utilities (NAS-18.12)
export {
  ALERT_TEMPLATE_CATEGORIES,
  getCategoryMeta,
  getAllCategories,
  getCategoryLabel,
} from './utils/alert-template-categories';
export type { AlertTemplateCategoryMeta } from './utils/alert-template-categories';
