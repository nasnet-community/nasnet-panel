// libs/features/diagnostics/src/components/TroubleshootWizard/TroubleshootWizardDesktop.tsx
import { X } from 'lucide-react';
import { Button } from '@nasnet/ui/primitives';
import { Card } from '@nasnet/ui/primitives';
import { HStepper } from '@nasnet/ui/patterns';
import { useTroubleshootWizard } from '../../hooks/useTroubleshootWizard';
import { DiagnosticStep } from './DiagnosticStep';
import { FixSuggestion } from './FixSuggestion';
import { WizardSummary } from './WizardSummary';
import { StepAnnouncer } from './StepAnnouncer';
import { TroubleshootWizardSkeletonDesktop } from './TroubleshootWizardSkeleton';
import type { ISPInfo } from '../../types/troubleshoot.types';

interface TroubleshootWizardDesktopProps {
  routerId: string;
  autoStart?: boolean;
  onClose?: () => void;
  ispInfo?: ISPInfo;
}

export function TroubleshootWizardDesktop({
  routerId,
  autoStart = false,
  onClose,
  ispInfo,
}: TroubleshootWizardDesktopProps) {
  const wizard = useTroubleshootWizard({
    routerId,
    autoStart,
    onComplete: (summary) => {
      console.log('Wizard completed:', summary);
    },
    onFixApplied: (fix) => {
      console.log('Fix applied:', fix);
    },
  });

  // Show loading skeleton while initializing
  if (wizard.isInitializing) {
    return <TroubleshootWizardSkeletonDesktop />;
  }

  // Show summary when completed
  if (wizard.isCompleted) {
    return (
      <div className="max-w-4xl mx-auto">
        <WizardSummary
          summary={{
            totalSteps: wizard.steps.length,
            passedSteps: wizard.steps.filter((s) => s.status === 'passed').length,
            failedSteps: wizard.steps.filter((s) => s.status === 'failed').length,
            skippedSteps: wizard.steps.filter((s) => s.status === 'skipped').length,
            appliedFixes: wizard.appliedFixes,
            durationMs: 0,
            finalStatus:
              wizard.steps.filter((s) => s.status === 'failed').length === 0
                ? 'all_passed'
                : wizard.appliedFixes.length > 0
                  ? 'issues_resolved'
                  : 'issues_remaining',
          }}
          steps={wizard.steps}
          onRestart={wizard.restart}
          onClose={() => {
            wizard.restart();
            onClose?.();
          }}
        />
        <StepAnnouncer
          currentStep={wizard.currentStep}
          currentStepIndex={wizard.currentStepIndex}
          totalSteps={wizard.steps.length}
          isApplyingFix={wizard.isApplyingFix}
          isVerifying={wizard.isVerifying}
          isCompleted={wizard.isCompleted}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">No Internet Troubleshooting</h1>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close troubleshooting wizard"
            className="h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Horizontal Stepper */}
      <HStepper
        {...{
          currentStep: wizard.currentStepIndex,
          totalSteps: wizard.steps.length,
          steps: wizard.steps.map((step) => ({
            label: step.name,
            status:
              step.status === 'passed'
                ? 'complete'
                : step.status === 'running'
                  ? 'current'
                  : step.status === 'failed'
                    ? 'error'
                    : 'upcoming',
          })),
        } as any}
      />

      {/* Main Content */}
      <Card className="p-6">
        {wizard.isIdle && (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Ready to troubleshoot your internet connection?
            </h2>
            <p className="text-muted-foreground mb-6">
              We'll run a series of automated tests to identify and fix common internet connectivity
              issues.
            </p>
            <Button onClick={wizard.start} size="lg" className="min-h-[44px]">
              Start Diagnostic
            </Button>
          </div>
        )}

        {(wizard.isRunning || wizard.isAwaitingFixDecision || wizard.isApplyingFix || wizard.isVerifying) && (
          <div className="space-y-6">
            {/* Current Step Display */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {wizard.messages.name}
              </h2>
              <p className="text-muted-foreground mb-4">{wizard.messages.description}</p>

              <DiagnosticStep
                step={wizard.currentStep}
                isActive={true}
                stepNumber={wizard.currentStepIndex + 1}
                totalSteps={wizard.steps.length}
              />
            </div>

            {/* Fix Suggestion */}
            {wizard.isAwaitingFixDecision && wizard.currentStep.fix && (
              <FixSuggestion
                fix={wizard.currentStep.fix}
                status={wizard.isApplyingFix ? 'applying' : 'idle'}
                onApply={wizard.applyFix}
                onSkip={wizard.skipFix}
                showCommandPreview={true}
                ispInfo={ispInfo}
              />
            )}

            {/* Verifying Message */}
            {wizard.isVerifying && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-md text-center">
                <p className="text-sm text-foreground">
                  Verifying fix effectiveness... Please wait.
                </p>
              </div>
            )}

            {/* Progress Indicator */}
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>
                Step {wizard.progress.current} of {wizard.progress.total}
              </span>
              <span>{Math.round(wizard.progress.percentage)}% complete</span>
            </div>
          </div>
        )}
      </Card>

      {/* Accessibility Announcer */}
      <StepAnnouncer
        currentStep={wizard.currentStep}
        currentStepIndex={wizard.currentStepIndex}
        totalSteps={wizard.steps.length}
        isApplyingFix={wizard.isApplyingFix}
        isVerifying={wizard.isVerifying}
        isCompleted={wizard.isCompleted}
      />
    </div>
  );
}
