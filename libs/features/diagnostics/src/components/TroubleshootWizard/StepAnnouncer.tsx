// libs/features/diagnostics/src/components/TroubleshootWizard/StepAnnouncer.tsx
import { memo, useEffect, useMemo, useState } from 'react';
import { TROUBLESHOOT_MESSAGES } from '../../i18n/troubleshoot-messages';
import type { DiagnosticStep } from '../../types/troubleshoot.types';

interface StepAnnouncerProps {
  /** The current diagnostic step being executed */
  currentStep: DiagnosticStep;
  /** Zero-indexed position of current step in the sequence */
  currentStepIndex: number;
  /** Total number of steps in the diagnostic sequence */
  totalSteps: number;
  /** True when a fix is being applied to the router */
  isApplyingFix: boolean;
  /** True when verifying that the applied fix resolved the issue */
  isVerifying: boolean;
  /** True when all diagnostic steps have completed */
  isCompleted: boolean;
}

/**
 * ARIA live region component for screen reader announcements.
 * Announces diagnostic step progress, results, fix application status, and wizard completion.
 * Uses `aria-live="polite"` to notify users without interrupting current speech.
 *
 * @example
 * ```tsx
 * <StepAnnouncer
 *   currentStep={step}
 *   currentStepIndex={0}
 *   totalSteps={5}
 *   isApplyingFix={false}
 *   isVerifying={false}
 *   isCompleted={false}
 * />
 * ```
 *
 * @wcag AAA compliance:
 * - Uses `aria-live="polite"` for non-intrusive announcements
 * - Uses `aria-atomic="true"` to announce full message context
 * - Hidden from visual display (`sr-only`) but available to assistive tech
 * - Announces all state changes: running, passed, failed, applying, verifying, completed
 */
export const StepAnnouncer = memo(function StepAnnouncer({
  currentStep,
  currentStepIndex,
  totalSteps,
  isApplyingFix,
  isVerifying,
  isCompleted,
}: StepAnnouncerProps) {
  const [announcement, setAnnouncement] = useState('');

  // Memoize the announcement message to avoid unnecessary computations
  const announcementMessage = useMemo(() => {
    const messages = TROUBLESHOOT_MESSAGES.announcements;

    if (isCompleted) {
      return messages.wizardComplete.replace('{summary}', 'Check results below');
    }

    if (isVerifying) {
      return messages.fixApplied;
    }

    if (isApplyingFix && currentStep.fix) {
      return messages.fixApplying.replace('{title}', currentStep.fix.title);
    }

    // Announce step status
    if (currentStep.status === 'running') {
      return messages.stepStarted
        .replace('{current}', String(currentStepIndex + 1))
        .replace('{total}', String(totalSteps))
        .replace('{name}', currentStep.name)
        .replace('{description}', currentStep.description);
    }

    if (currentStep.status === 'passed' && currentStep.result) {
      return messages.stepPassed
        .replace('{current}', String(currentStepIndex + 1))
        .replace('{message}', currentStep.result.message);
    }

    if (currentStep.status === 'failed' && currentStep.result) {
      return messages.stepFailed
        .replace('{current}', String(currentStepIndex + 1))
        .replace('{message}', currentStep.result.message);
    }

    return '';
  }, [currentStep, currentStepIndex, totalSteps, isApplyingFix, isVerifying, isCompleted]);

  useEffect(() => {
    setAnnouncement(announcementMessage);
  }, [announcementMessage]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      aria-label="Diagnostic step progress announcements"
    >
      {announcement}
    </div>
  );
});

StepAnnouncer.displayName = 'StepAnnouncer';
