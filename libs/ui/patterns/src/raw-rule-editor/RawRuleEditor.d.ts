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
import type { RawRuleEditorProps } from './raw-rule-editor.types';
/**
 * RawRuleEditor - RAW rule creation and editing
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Sheet with card-based form sections, 44px touch targets
 * - Tablet/Desktop (>=640px): Dialog with inline form and live preview panel
 */
export declare const RawRuleEditor: import("react").NamedExoticComponent<RawRuleEditorProps>;
export default RawRuleEditor;
//# sourceMappingURL=RawRuleEditor.d.ts.map