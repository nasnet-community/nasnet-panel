/**
 * NAT Rule Builder Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <NATRuleBuilder
 *   routerId="router-1"
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSave={async (rule) => {
 *     await createNATRule({ routerId, rule });
 *   }}
 * />
 * ```
 *
 * @module @nasnet/ui/patterns/security/nat-rule-builder
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { NATRuleBuilderDesktop } from './NATRuleBuilderDesktop';
import { NATRuleBuilderMobile } from './NATRuleBuilderMobile';

import type { NATRuleBuilderProps } from './nat-rule-builder.types';

/**
 * NAT Rule Builder - NAT rule creation and editing
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Sheet with card-based form sections, 44px touch targets
 * - Tablet/Desktop (>=640px): Dialog with inline form and live preview panel
 */
export const NATRuleBuilder = memo(function NATRuleBuilder(props: NATRuleBuilderProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <NATRuleBuilderMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <NATRuleBuilderDesktop {...props} />;
  }
});

NATRuleBuilder.displayName = 'NATRuleBuilder';

export default NATRuleBuilder;
