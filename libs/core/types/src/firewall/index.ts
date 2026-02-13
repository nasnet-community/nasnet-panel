/**
 * Firewall Types - Centralized exports
 *
 * This barrel export provides all firewall-related types and schemas.
 */

// Filter Rules
export * from './filter-rule.types';
export type {
  FilterChain,
  FilterAction,
  FilterProtocol,
  FilterRule,
  FilterRuleInput,
} from './filter-rule.types';

export {
  FilterChainSchema,
  FilterActionSchema,
  FilterProtocolSchema,
  FilterRuleSchema,
  DEFAULT_FILTER_RULE,
  SUGGESTED_LOG_PREFIXES as FILTER_SUGGESTED_LOG_PREFIXES,
  isValidIPAddress,
  isValidPortRange,
  getRequiredFieldsForFilterAction,
  getVisibleFieldsForFilterAction,
  chainAllowsOutInterface,
  chainAllowsInInterface,
  getActionColor,
  getActionDescription,
  generateRulePreview,
} from './filter-rule.types';

// Mangle Rules
export * from './mangle-rule.types';
export type {
  MangleChain,
  MangleAction,
  MangleRule,
  MangleRuleInput,
  ConnectionState,
  ConnectionNatState,
  DscpClass,
  MarkType,
} from './mangle-rule.types';

export {
  MangleChainSchema,
  MangleActionSchema,
  MangleRuleSchema,
  ConnectionStateSchema,
  ConnectionNatStateSchema,
  DSCP_CLASSES,
  MARK_TYPES,
  DEFAULT_MANGLE_RULE,
  getDscpClass,
  getDscpClassName,
  getDscpDescription,
  isValidMarkName,
  isValidDscp,
  getRequiredFieldsForAction,
  getVisibleFieldsForAction,
} from './mangle-rule.types';

// RAW Rules
export * from './raw-rule.types';
export type {
  RawChain,
  RawAction,
  RawProtocol,
  RawRule,
  RawRuleInput,
  RateLimit,
} from './raw-rule.types';

export {
  RawChainSchema,
  RawActionSchema,
  RawProtocolSchema,
  RawRuleSchema,
  RateLimitSchema,
  DEFAULT_RAW_RULE,
  SUGGESTED_LOG_PREFIXES as RAW_SUGGESTED_LOG_PREFIXES,
  isValidIPAddress as isValidRawIPAddress,
  isValidPortRange as isValidRawPortRange,
  getRequiredFieldsForRawAction,
  getVisibleFieldsForRawAction,
  chainAllowsOutInterface as rawChainAllowsOutInterface,
  chainAllowsInInterface as rawChainAllowsInInterface,
  getActionColor as getRawActionColor,
  getActionDescription as getRawActionDescription,
  generateRulePreview as generateRawRulePreview,
  isDDoSProtectionRule,
  isPerformanceRule,
} from './raw-rule.types';

// Bogon Ranges
export * from './bogon-ranges';
export type {
  BogonRanges,
  BogonCategory,
} from './bogon-ranges';

export {
  BOGON_RANGES,
  getAllBogonRanges,
  isBogonAddress,
  getBogonCategory,
  getBogonCategoryDescription,
  getBogonSecurityRec,
} from './bogon-ranges';

// Port Knocking
export * from './port-knock.types';
export type {
  KnockProtocol,
  KnockStatus,
  KnockPort,
  PortKnockSequence,
  PortKnockSequenceInput,
  PortKnockAttempt,
} from './port-knock.types';

export {
  KnockProtocolSchema,
  KnockStatusSchema,
  KnockPortSchema,
  PortKnockSequenceSchema,
  PortKnockAttemptSchema,
  COMMON_SERVICE_PORTS,
  DEFAULT_DURATIONS,
  isSSHProtected,
  getServiceName,
  parseDuration,
  formatDuration,
} from './port-knock.types';

// Rate Limiting
export * from './rate-limit.types';
export type {
  RateLimitAction,
  TimeWindow,
  RateLimitRule,
  RateLimitRuleInput,
  SynFloodConfig,
  BlockedIP,
  RateLimitStats,
  RateLimitTriggeredEvent,
} from './rate-limit.types';

export {
  RateLimitActionSchema,
  TimeWindowSchema,
  RateLimitRuleSchema,
  SynFloodConfigSchema,
  BlockedIPSchema,
  RateLimitStatsSchema,
  connectionRateToRouterOS,
  routerOSToConnectionRate,
  DEFAULT_RATE_LIMIT_RULE,
  DEFAULT_SYN_FLOOD_CONFIG,
  TIMEOUT_PRESETS,
  CONNECTION_LIMIT_PRESETS,
  SYN_LIMIT_PRESETS,
} from './rate-limit.types';

// NAT Rules
export * from './nat-rule.types';
export type {
  NatChain,
  NatAction,
  Protocol,
  NATRuleInput,
  PortForward,
  PortForwardResult,
} from './nat-rule.types';

export {
  NatChainSchema,
  NatActionSchema,
  ProtocolSchema,
  NATRuleInputSchema,
  PortForwardSchema,
  getVisibleFieldsForNATAction,
  generateNATRulePreview,
  generatePortForwardSummary,
  hasPortForwardConflict,
  DEFAULT_MASQUERADE_RULE,
  DEFAULT_PORT_FORWARD,
  COMMON_SERVICE_PORTS as NAT_COMMON_SERVICE_PORTS,
} from './nat-rule.types';

// Service Ports
export * from './service-port.types';
export type {
  ServicePortProtocol,
  ServicePortCategory,
  ServicePortDefinition,
  CustomServicePortInput,
  ServiceGroup,
  ServiceGroupInput,
} from './service-port.types';

export {
  ServicePortProtocolSchema,
  ServicePortCategorySchema,
  ServicePortDefinitionSchema,
  CustomServicePortInputSchema,
  ServiceGroupSchema,
  ServiceGroupInputSchema,
  hasBuiltInConflict,
  hasCustomConflict,
  mergeServices,
  findServiceByPort,
  findServiceByName,
  formatPortList,
  expandGroupToPorts,
  hasGroupNameConflict,
  DEFAULT_CUSTOM_SERVICE_INPUT,
  DEFAULT_SERVICE_GROUP_INPUT,
} from './service-port.types';

// Firewall Logs
export * from './firewall-log.types';
export type {
  FirewallLogChain,
  InferredAction,
  FirewallLogProtocol,
  ParsedFirewallLog,
  FirewallLogEntry,
} from './firewall-log.types';

export {
  FirewallLogChainSchema,
  InferredActionSchema,
  FirewallLogProtocolSchema,
  ParsedFirewallLogSchema,
  FirewallLogEntrySchema,
  isValidFirewallLogIP,
  isValidFirewallLogPort,
  getFirewallLogActionDescription,
  getFirewallLogActionColor,
  getFirewallLogChainDescription,
  formatFirewallLogConnection,
  DEFAULT_FIREWALL_LOG_ENTRY,
} from './firewall-log.types';

// Firewall Templates
export * from './template.types';
export type {
  VariableType,
  TemplateCategory,
  TemplateComplexity,
  FirewallTable,
  TemplateConflictType,
  TemplateVariable,
  TemplateRule,
  TemplateConflict,
  ImpactAnalysis,
  FirewallTemplate,
  TemplatePreviewResult,
  FirewallTemplateResult,
} from './template.types';

export {
  VariableTypeSchema,
  TemplateCategorySchema,
  TemplateComplexitySchema,
  FirewallTableSchema,
  TemplateConflictTypeSchema,
  TemplateVariableSchema,
  TemplateRuleSchema,
  TemplateConflictSchema,
  ImpactAnalysisSchema,
  FirewallTemplateSchema,
  TemplatePreviewResultSchema,
  FirewallTemplateResultSchema,
} from './template.types';
