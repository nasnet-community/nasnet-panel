/**
 * Port Knock Sequence Form (Platform Wrapper)
 *
 * Wrapper component that detects platform and renders the appropriate presenter.
 * Follows the Headless + Platform Presenters pattern.
 *
 * Features:
 * - Automatic platform detection (Mobile/Desktop)
 * - Drag-drop reordering (Desktop only)
 * - Touch-optimized controls (Mobile: 44px targets)
 * - Real-time preview and rule generation
 * - SSH lockout risk detection
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 3
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */

import React from 'react';
import { useMediaQuery } from '@nasnet/ui/primitives';

import { PortKnockSequenceFormDesktop } from './PortKnockSequenceFormDesktop';
import { PortKnockSequenceFormMobile } from './PortKnockSequenceFormMobile';

import type { UsePortKnockSequenceFormReturn } from './use-port-knock-sequence-form';

export interface PortKnockSequenceFormProps {
  /** Headless hook return value */
  formState: UsePortKnockSequenceFormReturn;

  /** Whether form is in edit mode */
  isEditMode?: boolean;

  /** Whether form is submitting */
  isSubmitting?: boolean;

  /** Additional class names */
  className?: string;
}

/**
 * PortKnockSequenceForm Component
 *
 * Platform-aware wrapper that renders:
 * - Desktop: Two-column layout with drag-drop reordering
 * - Mobile: Card-based layout with touch-friendly controls
 *
 * @param props - Component props
 * @returns Platform-appropriate port knock sequence form
 */
function PortKnockSequenceFormComponent({
  formState,
  isEditMode = false,
  isSubmitting = false,
  className,
}: PortKnockSequenceFormProps) {
  // Platform detection: <640px = Mobile, >=640px = Desktop
  const isMobile = useMediaQuery('(max-width: 640px)');

  return isMobile ?
      <PortKnockSequenceFormMobile
        formState={formState}
        isEditMode={isEditMode}
        isSubmitting={isSubmitting}
        className={className}
      />
    : <PortKnockSequenceFormDesktop
        formState={formState}
        isEditMode={isEditMode}
        isSubmitting={isSubmitting}
        className={className}
      />;
}

export const PortKnockSequenceForm = React.memo(PortKnockSequenceFormComponent);
PortKnockSequenceForm.displayName = 'PortKnockSequenceForm';
