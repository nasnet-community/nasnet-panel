/**
 * NAT Rule Builder - Pattern Component
 *
 * Barrel exports for NAT rule builder components.
 *
 * @module @nasnet/ui/patterns/security/nat-rule-builder
 */

export { NATRuleBuilder } from './NATRuleBuilder';
export { NATRuleBuilderDesktop } from './NATRuleBuilderDesktop';
export { NATRuleBuilderMobile } from './NATRuleBuilderMobile';
export { useNATRuleBuilder } from './use-nat-rule-builder';

export type {
  NATRuleBuilderProps,
  ChainSelectorProps,
  ActionSelectorProps,
  ProtocolSelectorProps,
} from './nat-rule-builder.types';

export type {
  UseNATRuleBuilderOptions,
  UseNATRuleBuilderReturn,
} from './use-nat-rule-builder';
