/**
 * Alert and Alert Rule Template GraphQL Queries and Mutations
 * @nasnet/api-client/queries/src/alerts
 *
 * Exports GraphQL documents and query keys for:
 * - Alert rules (NAS-18.1)
 * - Alert rule templates (NAS-18.12)
 * - Alert templates (notification templates)
 * - Digest scheduling
 */
export * from './alert-rule-templates.graphql';
export * from './alert-templates.graphql';
export * from './digest.graphql';
export * from './useAlertRuleTemplates';
export {
  useAlertEscalations,
  useAlertWithEscalation,
  useActiveEscalations,
  type AlertEscalation as AlertEscalationEntry,
  type UseAlertEscalationsOptions,
} from './useAlertEscalations';
export * from './useAlertTemplates';
export * from './useAlertTemplate';
export * from './useSaveAlertTemplate';
export * from './useResetAlertTemplate';
export * from './usePreviewAlertTemplate';
export * from './useDigestHistory';
export * from './useDigestQueueCount';
export * from './useTriggerDigestNow';
//# sourceMappingURL=index.d.ts.map
