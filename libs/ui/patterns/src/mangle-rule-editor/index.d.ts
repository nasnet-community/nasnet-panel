/**
 * Mangle Rule Editor Pattern Component
 *
 * Form editor for creating and editing mangle rules with platform-specific presenters.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @module @nasnet/ui/patterns/mangle-rule-editor
 * @see NAS-7.5: Implement Mangle Rules
 */
export { MangleRuleEditor } from './MangleRuleEditor';
export { MangleRuleEditorDesktop } from './MangleRuleEditorDesktop';
export { MangleRuleEditorMobile } from './MangleRuleEditorMobile';
export { useMangleRuleEditor, validateMarkName } from './use-mangle-rule-editor';
export type { MangleRuleEditorProps, ChainSelectorProps, ActionSelectorProps, DscpSelectorProps, } from './mangle-rule-editor.types';
export type { UseMangleRuleEditorOptions, UseMangleRuleEditorReturn, } from './use-mangle-rule-editor';
//# sourceMappingURL=index.d.ts.map