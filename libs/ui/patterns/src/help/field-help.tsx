/**
 * FieldHelp Component
 * Auto-detecting wrapper that selects the appropriate presenter based on platform
 *
 * Features:
 * - Automatic platform detection (mobile vs desktop/tablet)
 * - Unified API for both platforms
 * - Headless hook integration for shared logic
 *
 * @see NAS-4A.12: Build Help System Components
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { FieldHelpDesktop } from './field-help-desktop';
import { FieldHelpMobile } from './field-help-mobile';
import { useFieldHelp } from './use-field-help';

import type { FieldHelpProps } from './help.types';

/**
 * FieldHelp - Auto-detecting contextual help component
 *
 * Automatically selects the appropriate presenter based on the current platform:
 * - Mobile (<640px): Bottom sheet with touch-friendly interactions
 * - Tablet/Desktop (≥640px): Popover with hover/click interactions
 *
 * @example
 * ```tsx
 * // Basic usage - place next to form label
 * <div className="flex items-center gap-1">
 *   <Label htmlFor="gateway">Gateway</Label>
 *   <FieldHelp field="gateway" />
 * </div>
 * ```
 *
 * @example
 * ```tsx
 * // With custom placement
 * <FieldHelp field="ip" placement="bottom" />
 * ```
 *
 * @example
 * ```tsx
 * // Override global mode
 * <FieldHelp field="subnet" mode="technical" />
 * ```
 */
export const FieldHelp = React.memo(function FieldHelp({
  field,
  mode,
  placement = 'right',
  className,
}: FieldHelpProps) {
  // Detect platform for presenter selection
  const platform = usePlatform();

  // Get help state from headless hook
  const helpState = useFieldHelp({ field, mode, placement });

  // Select presenter based on platform
  // Mobile: Bottom sheet
  // Tablet/Desktop: Popover
  if (platform === 'mobile') {
    return (
      <FieldHelpMobile
        field={field}
        mode={mode}
        placement={placement}
        className={className}
        helpState={helpState}
      />
    );
  }

  return (
    <FieldHelpDesktop
      field={field}
      mode={mode}
      placement={placement}
      className={className}
      helpState={helpState}
    />
  );
});

FieldHelp.displayName = 'FieldHelp';
