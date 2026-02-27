/**
 * MangleRuleEditor Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <MangleRuleEditor
 *   routerId="router-1"
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSave={async (rule) => {
 *     await createMangleRule({ routerId, rule });
 *   }}
 * />
 * ```
 *
 * @module @nasnet/ui/patterns/mangle-rule-editor
 * @see NAS-7.5: Implement Mangle Rules
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { MangleRuleEditorDesktop } from './MangleRuleEditorDesktop';
import { MangleRuleEditorMobile } from './MangleRuleEditorMobile';

import type { MangleRuleEditorProps } from './mangle-rule-editor.types';

/**
 * MangleRuleEditor - Mangle rule creation and editing
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Sheet with card-based form sections, 44px touch targets
 * - Tablet/Desktop (>=640px): Dialog with inline form and live preview panel
 */
export const MangleRuleEditor = memo(function MangleRuleEditor(props: MangleRuleEditorProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <MangleRuleEditorMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <MangleRuleEditorDesktop {...props} />;
  }
});

MangleRuleEditor.displayName = 'MangleRuleEditor';

export default MangleRuleEditor;
