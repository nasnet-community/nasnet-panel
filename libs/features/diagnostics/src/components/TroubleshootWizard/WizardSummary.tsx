// libs/features/diagnostics/src/components/TroubleshootWizard/WizardSummary.tsx
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@nasnet/ui/primitives';
import { Card } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { DiagnosticSummary, DiagnosticStep } from '../../types/troubleshoot.types';
import { TROUBLESHOOT_MESSAGES } from '../../i18n/troubleshoot-messages';

interface WizardSummaryProps {
  /** Summary data from completed wizard */
  summary: DiagnosticSummary;
  /** List of all steps with final states */
  steps: DiagnosticStep[];
  /** Callback to restart wizard */
  onRestart: () => void;
  /** Callback to close wizard */
  onClose: () => void;
}

export function WizardSummary({ summary, steps, onRestart, onClose }: WizardSummaryProps) {
  const getSummaryIcon = () => {
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
  };

  const getSummaryMessage = () => {
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
  };

  const getDurationText = () => {
    const seconds = Math.floor(summary.durationMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {getSummaryIcon()}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Troubleshooting Complete</h2>
            <p className="text-muted-foreground">{getSummaryMessage()}</p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-md">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{summary.passedSteps}</div>
              <div className="text-xs text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-error">{summary.failedSteps}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">{getDurationText()}</div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Results */}
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-3">Detailed Results</h3>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-md',
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
                <AlertTriangle
                  className="h-5 w-5 text-muted-foreground flex-shrink-0"
                  aria-hidden="true"
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground">{step.name}</div>
                {step.result?.message && (
                  <div
                    className={cn(
                      'text-xs mt-0.5',
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
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {(step.result.executionTimeMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Applied Fixes */}
      {summary.appliedFixes.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3">Applied Fixes</h3>
          <ul className="space-y-2">
            {summary.appliedFixes.map((fixCode, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" aria-hidden="true" />
                <span className="text-muted-foreground">{fixCode.replace(/_/g, ' ')}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onRestart} className="flex-1 min-h-[44px]">
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Run Again
        </Button>
        <Button onClick={onClose} className="flex-1 min-h-[44px]">
          <X className="mr-2 h-4 w-4" aria-hidden="true" />
          Close
        </Button>
      </div>
    </div>
  );
}
