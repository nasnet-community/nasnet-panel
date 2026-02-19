// libs/features/diagnostics/src/components/TroubleshootWizard/StepAnnouncer.tsx
import { memo, useEffect, useState } from 'react';
import { TROUBLESHOOT_MESSAGES } from '../../i18n/troubleshoot-messages';
import type { DiagnosticStep } from '../../types/troubleshoot.types';

interface StepAnnouncerProps {
  currentStep: DiagnosticStep;
  currentStepIndex: number;
  totalSteps: number;
  isApplyingFix: boolean;
  isVerifying: boolean;
  isCompleted: boolean;
}

/**
 * ARIA live region for screen reader announcements
 * Announces step progress, results, and fix application status
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

  useEffect(() => {
    const messages = TROUBLESHOOT_MESSAGES.announcements;

    if (isCompleted) {
      // Announce completion
      setAnnouncement(messages.wizardComplete.replace('{summary}', 'Check results below'));
      return;
    }

    if (isVerifying) {
      setAnnouncement(messages.fixApplied);
      return;
    }

    if (isApplyingFix && currentStep.fix) {
      setAnnouncement(messages.fixApplying.replace('{title}', currentStep.fix.title));
      return;
    }

    // Announce step status
    if (currentStep.status === 'running') {
      const announcement = messages.stepStarted
        .replace('{current}', String(currentStepIndex + 1))
        .replace('{total}', String(totalSteps))
        .replace('{name}', currentStep.name)
        .replace('{description}', currentStep.description);
      setAnnouncement(announcement);
    } else if (currentStep.status === 'passed' && currentStep.result) {
      const announcement = messages.stepPassed
        .replace('{current}', String(currentStepIndex + 1))
        .replace('{message}', currentStep.result.message);
      setAnnouncement(announcement);
    } else if (currentStep.status === 'failed' && currentStep.result) {
      const announcement = messages.stepFailed
        .replace('{current}', String(currentStepIndex + 1))
        .replace('{message}', currentStep.result.message);
      setAnnouncement(announcement);
    }
  }, [
    currentStep,
    currentStepIndex,
    totalSteps,
    isApplyingFix,
    isVerifying,
    isCompleted,
  ]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
});
