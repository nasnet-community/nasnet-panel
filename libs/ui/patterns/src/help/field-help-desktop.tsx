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

import { cn } from '@nasnet/ui/primitives';

import { HelpIcon } from './help-icon';
import { HelpPopover } from './help-popover';

import type { FieldHelpDesktopProps } from './help.types';

/**
 * FieldHelpDesktop - Desktop presenter for field help
 *
 * Combines HelpIcon trigger with HelpPopover content display.
 * All state and content is managed by the headless hook passed via helpState.
 *
 * @internal This component is used by the FieldHelp auto-detecting wrapper
 */
export function FieldHelpDesktop({
  field,
  placement = 'right',
  className,
  helpState,
}: FieldHelpDesktopProps) {
  const { content, isOpen, setIsOpen, ariaLabel } = helpState;

  return (
    <HelpPopover
      content={content}
      placement={placement}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <HelpIcon
        field={field}
        className={cn(className)}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      />
    </HelpPopover>
  );
}
