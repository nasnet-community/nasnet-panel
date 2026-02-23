/**
 * Help System Components
 * Contextual help with Simple/Technical mode toggle
 *
 * Exports:
 * - FieldHelp: Auto-detecting wrapper component
 * - HelpModeToggle: Simple/Technical mode toggle
 * - HelpIcon: Trigger icon component
 * - HelpPopover: Desktop popover presenter
 * - HelpSheet: Mobile bottom sheet presenter
 * - useFieldHelp: Headless hook for field help
 * - useHelpMode: Hook for global help mode state
 *
 * @see NAS-4A.12: Build Help System Components
 * @see ADR-018: Headless Platform Presenters
 */
export type { HelpMode, HelpContent, FieldHelpConfig, UseFieldHelpReturn, FieldHelpProps, HelpIconProps, HelpPopoverProps, HelpSheetProps, HelpModeState, } from './help.types';
export { useFieldHelp } from './use-field-help';
export { useHelpMode, type UseHelpModeReturn } from './use-help-mode';
export { FieldHelp } from './field-help';
export { HelpModeToggle, type HelpModeToggleProps } from './help-mode-toggle';
export { HelpIcon, helpIconVariants, type HelpIconVariantProps } from './help-icon';
export { HelpPopover } from './help-popover';
export { HelpSheet } from './help-sheet';
export { FieldHelpDesktop } from './field-help-desktop';
export { FieldHelpMobile } from './field-help-mobile';
//# sourceMappingURL=index.d.ts.map