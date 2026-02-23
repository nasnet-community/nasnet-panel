/**
 * FieldHelpMobile Component
 * Mobile platform presenter for field help
 *
 * Uses HelpIcon as trigger and HelpSheet for content display.
 * Optimized for touch interactions with 44px touch targets.
 *
 * @see NAS-4A.12: Build Help System Components
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
import type { FieldHelpMobileProps } from './help.types';
/**
 * FieldHelpMobile - Mobile presenter for field help
 *
 * Combines HelpIcon trigger with HelpSheet bottom sheet display.
 * All state and content is managed by the headless hook passed via helpState.
 *
 * @internal This component is used by the FieldHelp auto-detecting wrapper
 */
export declare const FieldHelpMobile: React.NamedExoticComponent<FieldHelpMobileProps>;
//# sourceMappingURL=field-help-mobile.d.ts.map