/**
 * RateLimitRuleEditor Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <RateLimitRuleEditor
 *   routerId="router-1"
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSave={async (rule) => {
 *     await createRateLimitRule({ routerId, rule });
 *   }}
 * />
 * ```
 *
 * @module @nasnet/ui/patterns/rate-limit-rule-editor
 * @see NAS-7.11: Implement Connection Rate Limiting
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { RateLimitRuleEditorDesktop } from './RateLimitRuleEditorDesktop';
import { RateLimitRuleEditorMobile } from './RateLimitRuleEditorMobile';

import type { RateLimitRuleEditorProps } from './types';

/**
 * RateLimitRuleEditor - Rate limit rule creation and editing
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Sheet with card-based form sections, 44px touch targets
 * - Tablet/Desktop (>=640px): Dialog with inline form and live preview panel
 */
export const RateLimitRuleEditor = memo(function RateLimitRuleEditor(
  props: RateLimitRuleEditorProps
) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <RateLimitRuleEditorMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <RateLimitRuleEditorDesktop {...props} />;
  }
});

RateLimitRuleEditor.displayName = 'RateLimitRuleEditor';

export default RateLimitRuleEditor;
