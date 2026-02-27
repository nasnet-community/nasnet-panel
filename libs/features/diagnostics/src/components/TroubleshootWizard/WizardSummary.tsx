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
        return <CheckCircle2 className="h-12 w-12 text-success" aria-hidden="true" />;
      case 'issues_resolved':
        return <CheckCircle2 className="h-12 w-12 text-success" aria-hidden="true" />;
      case 'contact_isp':
        return <AlertTriangle className="h-12 w-12 text-warning" aria-hidden="true" />;
      case 'issues_remaining':
      default:
        return <XCircle className="h-12 w-12 text-error" aria-hidden="true" />;
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
    <div className="space-y-component-lg" role="region" aria-label="Diagnostic results summary">
      {/* Summary Header */}
      <Card className="p-component-lg">
        <div className="flex flex-col items-center text-center space-y-component-md">
          {getSummaryIcon()}
          <div>
            <h2 className="text-2xl font-bold text-category-networking mb-component-sm">Troubleshooting Complete</h2>
            <p className="text-muted-foreground">{summaryMessage}</p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-component-md w-full max-w-md" role="region" aria-label="Diagnostic statistics">
            <div className="text-center">
              <div className="text-2xl font-bold text-success" aria-label={`${summary.passedSteps} tests passed`}>
                {summary.passedSteps}
              </div>
              <div className="text-xs text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-error" aria-label={`${summary.failedSteps} tests failed`}>
                {summary.failedSteps}
              </div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground" aria-label={`Duration: ${durationText}`}>
                {durationText}
              </div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Results */}
      <Card className="p-component-md">
        <h3 className="font-semibold text-foreground mb-component-md">Detailed Results</h3>
        <div className="space-y-component-xs" role="list" aria-label="Diagnostic step results">
          {steps.map((step) => (
            <div
              key={step.id}
              role="listitem"
              aria-label={`${step.name}: ${step.status}`}
              className={cn(
                'flex items-center gap-component-sm p-component-sm rounded-card-sm',
                step.status === 'passed' && 'bg-success/10',
                step.status === 'failed' && 'bg-error/10',
                step.status === 'skipped' && 'bg-muted/50'
              )}
            >
              {step.status === 'passed' && (
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" aria-hidden="true" />
              )}
              {step.status === 'failed' && (
                <XCircle className="h-5 w-5 text-error flex-shrink-0" aria-hidden="true" />
              )}
              {step.status === 'skipped' && (
                <AlertTriangle className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              )}

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground">{step.name}</div>
                {step.result?.message && (
                  <div
                    className={cn(
                      'text-xs mt-component-xs font-mono',
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
                <span className="font-mono text-xs text-muted-foreground whitespace-nowrap" aria-label={`Execution time: ${(step.result.executionTimeMs / 1000).toFixed(1)} seconds`}>
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
          <h3 className="font-semibold text-foreground mb-component-md">Applied Fixes</h3>
          <ul className="space-y-component-sm" aria-label="List of applied fixes">
            {summary.appliedFixes.map((fixCode) => (
              <li key={fixCode} className="flex items-center gap-component-sm text-sm">
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" aria-hidden="true" />
                <span className="text-muted-foreground font-mono">{fixCode.replace(/_/g, ' ')}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-component-sm">
        <Button
          variant="outline"
          onClick={handleRestart}
          className="flex-1 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Run diagnostics again"
        >
          <RefreshCw className="mr-component-sm h-4 w-4" aria-hidden="true" />
          Run Again
        </Button>
        <Button
          onClick={handleClose}
          className="flex-1 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Close troubleshooting wizard"
        >
          <X className="mr-component-sm h-4 w-4" aria-hidden="true" />
          Close
        </Button>
      </div>
    </div>
  );
});

WizardSummary.displayName = 'WizardSummary';
