/**
 * RawRuleEditor Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <RawRuleEditor
 *   routerId="router-1"
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSave={async (rule) => {
 *     await createRawRule({ routerId, rule });
 *   }}
 * />
 * ```
 *
 * @module @nasnet/ui/patterns/raw-rule-editor
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { RawRuleEditorDesktop } from './RawRuleEditorDesktop';
import { RawRuleEditorMobile } from './RawRuleEditorMobile';

import type { RawRuleEditorProps } from './raw-rule-editor.types';

/**
 * RawRuleEditor - RAW rule creation and editing
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Sheet with card-based form sections, 44px touch targets
 * - Tablet/Desktop (>=640px): Dialog with inline form and live preview panel
 */
export const RawRuleEditor = memo(function RawRuleEditor(props: RawRuleEditorProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <RawRuleEditorMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <RawRuleEditorDesktop {...props} />;
  }
});

RawRuleEditor.displayName = 'RawRuleEditor';

export default RawRuleEditor;
