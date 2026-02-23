/**
 * FieldHelpDesktop Component
 * Desktop platform presenter for field help
 *
 * Uses HelpIcon as trigger and HelpPopover for content display.
 * Handles all desktop-specific interactions (hover hints, quick dismiss).
 *
 * @see NAS-4A.12: Build Help System Components
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
import type { FieldHelpDesktopProps } from './help.types';
/**
 * FieldHelpDesktop - Desktop presenter for field help
 *
 * Combines HelpIcon trigger with HelpPopover content display.
 * All state and content is managed by the headless hook passed via helpState.
 *
 * @internal This component is used by the FieldHelp auto-detecting wrapper
 */
export declare const FieldHelpDesktop: React.NamedExoticComponent<FieldHelpDesktopProps>;
//# sourceMappingURL=field-help-desktop.d.ts.map