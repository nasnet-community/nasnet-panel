// libs/features/diagnostics/src/components/TroubleshootWizard/TroubleshootWizardMobile.tsx
import { memo, useState, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button, Card, Progress, Sheet, SheetContent, SheetHeader, SheetTitle } from '@nasnet/ui/primitives';
import { VStepper } from '@nasnet/ui/patterns';
import { useTroubleshootWizard } from '../../hooks/useTroubleshootWizard';
import { DiagnosticStep } from './DiagnosticStep';
import { FixSuggestion } from './FixSuggestion';
import { WizardSummary } from './WizardSummary';
import { StepAnnouncer } from './StepAnnouncer';
import { TroubleshootWizardSkeletonMobile } from './TroubleshootWizardSkeleton';
import type { ISPInfo } from '../../types/troubleshoot.types';

/**
 * Props for TroubleshootWizardMobile presenter
 */
interface TroubleshootWizardMobileProps {
  /** Router UUID to run diagnostics against */
  routerId: string;
  /** Auto-start wizard on mount (default: false) */
  autoStart?: boolean;
  /** Callback when wizard is closed/cancelled */
  onClose?: () => void;
  /** ISP information for contact suggestions */
  ispInfo?: ISPInfo;
}

/**
 * Mobile presenter for No Internet Troubleshooting Wizard (<640px)
 *
 * Displays touch-optimized wizard with 44px+ touch targets,
 * vertical step list, bottom sheet for fix details, and
 * progress bar for mobile context.
 *
 * @see TroubleshootWizard for responsive wrapper
 */
export const TroubleshootWizardMobile = memo(function TroubleshootWizardMobile({
  routerId,
  autoStart = false,
  onClose,
  ispInfo,
}: TroubleshootWizardMobileProps) {
  const [showFixSheet, setShowFixSheet] = useState(false);

  const wizard = useTroubleshootWizard({
    routerId,
    autoStart,
    onComplete: (summary) => {
      console.log('Wizard completed:', summary);
    },
    onFixApplied: (fix) => {
      console.log('Fix applied:', fix);
      setShowFixSheet(false);
    },
  });

  // Memoize sheet open/close handlers
  const handleOpenFixSheet = useCallback(() => {
    setShowFixSheet(true);
  }, []);

  const handleCloseFixSheet = useCallback(() => {
    setShowFixSheet(false);
  }, []);

  const handleFixApply = useCallback(() => {
    wizard.applyFix();
    setShowFixSheet(false);
  }, [wizard]);

  const handleFixSkip = useCallback(() => {
    wizard.skipFix();
    setShowFixSheet(false);
  }, [wizard]);

  const handleCompletionClose = useCallback(() => {
    wizard.restart();
    onClose?.();
  }, [wizard, onClose]);

  if (wizard.isInitializing) {
    return <TroubleshootWizardSkeletonMobile />;
  }

  // Show summary when completed
  if (wizard.isCompleted) {

    return (
      <div className="p-4">
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
          onClose={handleCompletionClose}
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background sticky top-0 z-10">
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Go back"
            className="min-h-[44px] min-w-[44px]"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
        )}
        <h1 className="text-lg font-semibold text-foreground">No Internet Help</h1>
      </div>

      {/* Progress Bar */}
      {!wizard.isIdle && (
        <div className="p-4 border-b bg-background" role="progressbar" aria-valuenow={Math.round(wizard.progress.percentage)} aria-valuemin={0} aria-valuemax={100} aria-label={`Diagnostic progress: step ${wizard.progress.current} of ${wizard.progress.total}`}>
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-muted-foreground">
              Step {wizard.progress.current} of {wizard.progress.total}
            </span>
            <span className="font-medium text-foreground">{Math.round(wizard.progress.percentage)}%</span>
          </div>
          <Progress value={wizard.progress.percentage} className="h-2" />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {wizard.isIdle && (
          <Card className="p-6 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Ready to troubleshoot?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              We'll run automated tests to find and fix internet issues.
            </p>
            <Button onClick={wizard.start} className="w-full min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="Start diagnostic troubleshooting">
              Start Diagnostic
            </Button>
          </Card>
        )}

        {(wizard.isRunning || wizard.isAwaitingFixDecision || wizard.isApplyingFix || wizard.isVerifying) && (
          <>
            {/* Vertical Stepper with all steps */}
            <div className="space-y-3" role="list" aria-label="Diagnostic steps">
              {wizard.steps.map((step, index) => (
                <DiagnosticStep
                  key={step.id}
                  step={step}
                  isActive={index === wizard.currentStepIndex}
                  stepNumber={index + 1}
                  totalSteps={wizard.steps.length}
                />
              ))}
            </div>

            {/* Current Step Details */}
            {wizard.currentStep.status === 'running' && (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">{wizard.messages.runningMessage}</p>
              </Card>
            )}

            {/* Verifying Message */}
            {wizard.isVerifying && (
              <Card className="p-4 bg-primary/10">
                <p className="text-sm text-foreground text-center">
                  Verifying fix... Please wait.
                </p>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Fix Action Buttons (Fixed Bottom) */}
      {wizard.isAwaitingFixDecision && wizard.currentStep.fix && !showFixSheet && (
        <div className="p-4 border-t bg-background sticky bottom-0 z-20">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={wizard.skipFix}
              className="flex-1 min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Skip this fix"
            >
              Skip
            </Button>
            {wizard.currentStep.fix.isManualFix ? (
              <Button
                onClick={handleOpenFixSheet}
                variant="secondary"
                className="flex-1 min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="View manual fix steps"
              >
                View Steps
              </Button>
            ) : (
              <Button
                onClick={handleOpenFixSheet}
                className="flex-1 min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="View automatic fix details"
              >
                View Fix
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Fix Details Sheet */}
      <Sheet open={showFixSheet} onOpenChange={handleCloseFixSheet}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{wizard.currentStep.fix?.title}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {wizard.currentStep.fix && (
              <FixSuggestion
                fix={wizard.currentStep.fix}
                status={wizard.isApplyingFix ? 'applying' : 'idle'}
                onApply={handleFixApply}
                onSkip={handleFixSkip}
                showCommandPreview={false}
                ispInfo={ispInfo}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

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
});

TroubleshootWizardMobile.displayName = 'TroubleshootWizardMobile';
