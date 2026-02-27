// libs/features/diagnostics/src/components/TroubleshootWizard/WizardSummary.tsx
import { memo, useCallback, useMemo } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button, Card } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { DiagnosticSummary, DiagnosticStep } from '../../types/troubleshoot.types';
import { TROUBLESHOOT_MESSAGES } from '../../i18n/troubleshoot-messages';

interface WizardSummaryProps {
  /** Summary data from completed diagnostic wizard including final status and applied fixes */
  summary: DiagnosticSummary;
  /** List of all diagnostic steps with their final status and results */
  steps: DiagnosticStep[];
  /** Callback when user clicks Run Again button to restart wizard */
  onRestart: () => void;
  /** Callback when user clicks Close button to dismiss wizard */
  onClose: () => void;
}

/**
 * Displays a comprehensive summary of completed diagnostics including:
 * - Overall status (all passed, issues resolved, contact ISP, or issues remaining)
 * - Statistics (passed/failed/duration)
 * - Detailed results for each step
 * - List of applied fixes
 * - Action buttons to restart or close
 *
 * @example
 * ```tsx
 * <WizardSummary
 *   summary={summary}
 *   steps={steps}
 *   onRestart={handleRestart}
 *   onClose={handleClose}
 * />
 * ```
 *
 * @wcag AAA compliance:
 * - Uses semantic HTML: <h2>, <h3>, role="list"
 * - Color-coded status with icon + text labels (not color alone)
 * - All buttons have min 44px touch targets
 * - Focus indicators on all interactive elements
 * - Statistics clearly labeled and accessible to screen readers
 * - Detailed results with proper heading hierarchy
 */
export const WizardSummary = memo(function WizardSummary({
  summary,
  steps,
  onRestart,
  onClose,
}: WizardSummaryProps) {
  const getSummaryIcon = useCallback(() => {
    switch (summary.finalStatus) {
      case 'all_passed':
        return (
          <CheckCircle2
            className="text-success h-12 w-12"
            aria-hidden="true"
          />
        );
      case 'issues_resolved':
        return (
          <CheckCircle2
            className="text-success h-12 w-12"
            aria-hidden="true"
          />
        );
      case 'contact_isp':
        return (
          <AlertTriangle
            className="text-warning h-12 w-12"
            aria-hidden="true"
          />
        );
      case 'issues_remaining':
      default:
        return (
          <XCircle
            className="text-error h-12 w-12"
            aria-hidden="true"
          />
        );
    }
  }, [summary.finalStatus]);

  const summaryMessage = useMemo(() => {
    const messages = TROUBLESHOOT_MESSAGES.summary;
    switch (summary.finalStatus) {
      case 'all_passed':
        return messages.all_passed;
      case 'issues_resolved':
        return messages.issues_resolved.replace('{count}', String(summary.appliedFixes.length));
      case 'contact_isp':
        return messages.contact_isp;
      case 'issues_remaining':
      default:
        return messages.issues_remaining;
    }
  }, [summary.finalStatus, summary.appliedFixes.length]);

  const getDurationText = useCallback(() => {
    const seconds = Math.floor(summary.durationMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }, [summary.durationMs]);

  const durationText = useMemo(() => getDurationText(), [getDurationText]);

  const handleRestart = useCallback(() => {
    onRestart();
  }, [onRestart]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <div
      className="space-y-component-lg"
      role="region"
      aria-label="Diagnostic results summary"
    >
      {/* Summary Header */}
      <Card className="p-component-lg">
        <div className="space-y-component-md flex flex-col items-center text-center">
          {getSummaryIcon()}
          <div>
            <h2 className="text-category-networking mb-component-sm text-2xl font-bold">
              Troubleshooting Complete
            </h2>
            <p className="text-muted-foreground">{summaryMessage}</p>
          </div>

          {/* Statistics */}
          <div
            className="gap-component-md grid w-full max-w-md grid-cols-3"
            role="region"
            aria-label="Diagnostic statistics"
          >
            <div className="text-center">
              <div
                className="text-success text-2xl font-bold"
                aria-label={`${summary.passedSteps} tests passed`}
              >
                {summary.passedSteps}
              </div>
              <div className="text-muted-foreground text-xs">Passed</div>
            </div>
            <div className="text-center">
              <div
                className="text-error text-2xl font-bold"
                aria-label={`${summary.failedSteps} tests failed`}
              >
                {summary.failedSteps}
              </div>
              <div className="text-muted-foreground text-xs">Failed</div>
            </div>
            <div className="text-center">
              <div
                className="text-muted-foreground text-2xl font-bold"
                aria-label={`Duration: ${durationText}`}
              >
                {durationText}
              </div>
              <div className="text-muted-foreground text-xs">Duration</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Results */}
      <Card className="p-component-md">
        <h3 className="text-foreground mb-component-md font-semibold">Detailed Results</h3>
        <div
          className="space-y-component-xs"
          role="list"
          aria-label="Diagnostic step results"
        >
          {steps.map((step) => (
            <div
              key={step.id}
              role="listitem"
              aria-label={`${step.name}: ${step.status}`}
              className={cn(
                'gap-component-sm p-component-sm rounded-card-sm flex items-center',
                step.status === 'passed' && 'bg-success/10',
                step.status === 'failed' && 'bg-error/10',
                step.status === 'skipped' && 'bg-muted/50'
              )}
            >
              {step.status === 'passed' && (
                <CheckCircle2
                  className="text-success h-5 w-5 flex-shrink-0"
                  aria-hidden="true"
                />
              )}
              {step.status === 'failed' && (
                <XCircle
                  className="text-error h-5 w-5 flex-shrink-0"
                  aria-hidden="true"
                />
              )}
              {step.status === 'skipped' && (
                <AlertTriangle
                  className="text-muted-foreground h-5 w-5 flex-shrink-0"
                  aria-hidden="true"
                />
              )}

              <div className="min-w-0 flex-1">
                <div className="text-foreground text-sm font-medium">{step.name}</div>
                {step.result?.message && (
                  <div
                    className={cn(
                      'mt-component-xs font-mono text-xs',
                      step.status === 'passed' && 'text-success',
                      step.status === 'failed' && 'text-error',
                      step.status === 'skipped' && 'text-muted-foreground'
                    )}
                  >
                    {step.result.message}
                  </div>
                )}
              </div>

              {step.result?.executionTimeMs && (
                <span
                  className="text-muted-foreground whitespace-nowrap font-mono text-xs"
                  aria-label={`Execution time: ${(step.result.executionTimeMs / 1000).toFixed(1)} seconds`}
                >
                  {(step.result.executionTimeMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Applied Fixes */}
      {summary.appliedFixes.length > 0 && (
        <Card className="p-component-md">
          <h3 className="text-foreground mb-component-md font-semibold">Applied Fixes</h3>
          <ul
            className="space-y-component-sm"
            aria-label="List of applied fixes"
          >
            {summary.appliedFixes.map((fixCode) => (
              <li
                key={fixCode}
                className="gap-component-sm flex items-center text-sm"
              >
                <CheckCircle2
                  className="text-success h-4 w-4 flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="text-muted-foreground font-mono">
                  {fixCode.replace(/_/g, ' ')}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="gap-component-sm flex">
        <Button
          variant="outline"
          onClick={handleRestart}
          className="focus-visible:ring-ring min-h-[44px] flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-label="Run diagnostics again"
        >
          <RefreshCw
            className="mr-component-sm h-4 w-4"
            aria-hidden="true"
          />
          Run Again
        </Button>
        <Button
          onClick={handleClose}
          className="focus-visible:ring-ring min-h-[44px] flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-label="Close troubleshooting wizard"
        >
          <X
            className="mr-component-sm h-4 w-4"
            aria-hidden="true"
          />
          Close
        </Button>
      </div>
    </div>
  );
});

WizardSummary.displayName = 'WizardSummary';
