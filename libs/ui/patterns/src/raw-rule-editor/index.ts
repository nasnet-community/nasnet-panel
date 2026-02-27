/**
 * RAW Rule Editor Pattern Component
 *
 * Exports for RAW rule creation and editing with platform-adaptive UI.
 *
 * @module @nasnet/ui/patterns/raw-rule-editor
 */

export { RawRuleEditor } from './RawRuleEditor';
export { RawRuleEditorDesktop } from './RawRuleEditorDesktop';
export { RawRuleEditorMobile } from './RawRuleEditorMobile';
export { useRawRuleEditor, validateLogPrefix, validateJumpTarget } from './use-raw-rule-editor';
export type {
  RawRuleEditorProps,
  ChainSelectorProps,
  ActionSelectorProps,
} from './raw-rule-editor.types';
export type { UseRawRuleEditorOptions, UseRawRuleEditorReturn } from './use-raw-rule-editor';
