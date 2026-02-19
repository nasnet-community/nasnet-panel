// libs/features/diagnostics/src/components/TroubleshootWizard/DiagnosticStep.tsx
import { memo } from 'react';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import type { DiagnosticStep as DiagnosticStepType } from '../../types/troubleshoot.types';

interface DiagnosticStepProps {
  /** Step configuration and state */
  step: DiagnosticStepType;
  /** Whether this step is currently active */
  isActive: boolean;
  /** Step index for display (1-based) */
  stepNumber: number;
  /** Total steps for progress */
  totalSteps: number;
  /** Click handler for completed steps */
  onClick?: () => void;
}

export const DiagnosticStep = memo(function DiagnosticStep({
  step,
  isActive,
  stepNumber,
  totalSteps,
  onClick,
}: DiagnosticStepProps) {
  const getStatusIcon = () => {
    switch (step.status) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-error" aria-hidden="true" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" aria-hidden="true" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />;
    }
  };

  const getStatusColor = () => {
    switch (step.status) {
      case 'passed':
        return 'border-success bg-success/10';
      case 'failed':
        return 'border-error bg-error/10';
      case 'running':
        return 'border-primary bg-primary/10';
      case 'pending':
      default:
        return 'border-border bg-muted/50';
    }
  };

  const getAriaLabel = () => {
    let label = `Step ${stepNumber} of ${totalSteps}: ${step.name}`;
    if (step.status === 'passed') label += ' - Passed';
    if (step.status === 'failed') label += ' - Failed';
    if (step.status === 'running') label += ' - Running';
    if (step.status === 'pending') label += ' - Pending';
    return label;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border-2 transition-all min-h-[44px]',
        getStatusColor(),
        isActive && 'ring-2 ring-primary ring-offset-2',
        onClick && 'cursor-pointer hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        step.status === 'pending' && 'opacity-60'
      )}
      onClick={onClick}
      role="listitem"
      aria-label={getAriaLabel()}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">{getStatusIcon()}</div>

      {/* Step Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate text-foreground">{step.name}</h3>
          {step.result?.executionTimeMs && step.status !== 'running' && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {(step.result.executionTimeMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        {step.result?.message && step.status !== 'pending' && (
          <p
            className={cn(
              'text-xs mt-1',
              step.status === 'passed' && 'text-success',
              step.status === 'failed' && 'text-error',
              step.status === 'running' && 'text-muted-foreground'
            )}
          >
            {step.result.message}
          </p>
        )}
      </div>

      {/* Step Number Badge */}
      <div
        className={cn(
          'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
          step.status === 'passed' && 'bg-success text-success-foreground',
          step.status === 'failed' && 'bg-error text-error-foreground',
          step.status === 'running' && 'bg-primary text-primary-foreground',
          step.status === 'pending' && 'bg-muted text-muted-foreground'
        )}
        aria-hidden="true"
      >
        {stepNumber}
      </div>
    </div>
  );
});
