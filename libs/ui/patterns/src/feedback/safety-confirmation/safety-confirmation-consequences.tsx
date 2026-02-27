/**
 * SafetyConfirmationConsequences Component
 *
 * Displays a list of consequences/risks for the dangerous operation.
 * Each consequence is shown as a bulleted list item with warning styling.
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 */

import { AlertCircle } from 'lucide-react';

import { cn, ScrollArea } from '@nasnet/ui/primitives';

import type { SafetyConfirmationConsequencesProps } from './safety-confirmation.types';

/**
 * Consequences list component for safety confirmation dialogs
 *
 * Features:
 * - Bulleted list with warning icons
 * - Scrollable if too many items
 * - Warning color scheme for emphasis
 * - Screen reader accessible
 *
 * @example
 * ```tsx
 * <SafetyConfirmationConsequences
 *   consequences={[
 *     "All configuration will be lost",
 *     "Router will reboot",
 *     "Network services will be interrupted"
 *   ]}
 * />
 * ```
 */
export function SafetyConfirmationConsequences({
  consequences,
  className,
}: SafetyConfirmationConsequencesProps) {
  if (!consequences || consequences.length === 0) {
    return null;
  }

  const listContent = (
    <ul
      className={cn('space-y-2', className)}
      aria-label="Consequences of this operation"
    >
      {consequences.map((consequence, index) => (
        <li key={index} className="flex items-start gap-2 text-sm">
          <AlertCircle
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning"
            aria-hidden="true"
          />
          <span className="text-muted-foreground">{consequence}</span>
        </li>
      ))}
    </ul>
  );

  // If more than 4 items, make it scrollable
  if (consequences.length > 4) {
    return (
      <ScrollArea className="max-h-32">
        <div className="pr-4">{listContent}</div>
      </ScrollArea>
    );
  }

  return listContent;
}
