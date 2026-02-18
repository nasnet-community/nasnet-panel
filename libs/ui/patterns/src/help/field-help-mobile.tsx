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

import { cn } from '@nasnet/ui/primitives';

import { HelpIcon } from './help-icon';
import { HelpSheet } from './help-sheet';

import type { FieldHelpMobileProps } from './help.types';

/**
 * FieldHelpMobile - Mobile presenter for field help
 *
 * Combines HelpIcon trigger with HelpSheet bottom sheet display.
 * All state and content is managed by the headless hook passed via helpState.
 *
 * @internal This component is used by the FieldHelp auto-detecting wrapper
 */
export function FieldHelpMobile({
  field,
  className,
  helpState,
}: FieldHelpMobileProps) {
  const { content, isOpen, setIsOpen, ariaLabel } = helpState;

  return (
    <>
      <HelpIcon
        field={field}
        className={cn(className)}
        onClick={() => setIsOpen(true)}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      />
      <HelpSheet content={content} open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
