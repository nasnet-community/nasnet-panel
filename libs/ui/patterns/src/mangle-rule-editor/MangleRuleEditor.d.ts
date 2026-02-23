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
import type { MangleRuleEditorProps } from './mangle-rule-editor.types';
/**
 * MangleRuleEditor - Mangle rule creation and editing
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Sheet with card-based form sections, 44px touch targets
 * - Tablet/Desktop (>=640px): Dialog with inline form and live preview panel
 */
export declare const MangleRuleEditor: import("react").NamedExoticComponent<MangleRuleEditorProps>;
export default MangleRuleEditor;
//# sourceMappingURL=MangleRuleEditor.d.ts.map