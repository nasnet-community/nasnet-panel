// libs/features/diagnostics/src/components/TroubleshootWizard/FixSuggestion.tsx
import { memo, useCallback, useMemo } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button, Card } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { FixSuggestion as FixSuggestionType, ISPInfo } from '../../types/troubleshoot.types';

interface FixSuggestionProps {
  /** The fix suggestion to display with confidence level and actionable remediation */
  fix: FixSuggestionType;
  /** Current fix application state: idle (ready), applying (in progress), applied (success), failed (error) */
  status: 'idle' | 'applying' | 'applied' | 'failed';
  /** Callback when user clicks Apply Fix button */
  onApply: () => void;
  /** Callback when user clicks Skip or Continue button */
  onSkip: () => void;
  /** Whether to show detailed RouterOS command preview for manual review */
  showCommandPreview?: boolean;
  /** ISP contact information for "Contact ISP" fix suggestions */
  ispInfo?: ISPInfo;
}

/**
 * Displays a diagnostic fix suggestion with confidence level, manual steps, and action buttons.
 * Supports both automatic fixes (with Apply button) and manual fixes (with manual steps).
 * Includes ISP contact information when applicable for internet connectivity issues.
 *
 * @example
 * ```tsx
 * <FixSuggestion
 *   fix={suggestion}
 *   status={fixStatus}
 *   onApply={() => applyFix(suggestion)}
 *   onSkip={() => skipFix()}
 *   showCommandPreview
 * />
 * ```
 */
export const FixSuggestion = memo(function FixSuggestion({
  fix,
  status,
  onApply,
  onSkip,
  showCommandPreview = false,
  ispInfo,
}: FixSuggestionProps) {
  const getConfidenceBadge = useCallback(() => {
    if (!fix.confidence) return null;

    const colors = {
      high: 'bg-confidenceHigh/10 text-confidenceHigh border-confidenceHigh/20',
      medium: 'bg-confidenceMedium/10 text-confidenceMedium border-confidenceMedium/20',
      low: 'bg-confidenceLow/10 text-confidenceLow border-confidenceLow/20',
    };

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border',
          colors[fix.confidence]
        )}
        role="status"
        aria-label={`Confidence level: ${fix.confidence}`}
      >
        {fix.confidence === 'high' && <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
        {fix.confidence === 'medium' && <AlertCircle className="h-3 w-3" aria-hidden="true" />}
        {fix.confidence} confidence
      </span>
    );
  }, [fix.confidence]);

  const manualStepsContent = useMemo(
    () =>
      fix.isManualFix && fix.manualSteps ? (
        <div className="mb-4 p-3 bg-muted/50 rounded-md">
          <p className="text-xs font-medium text-foreground mb-2">Follow these steps:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
            {fix.manualSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null,
    [fix.isManualFix, fix.manualSteps]
  );

  const ispInfoContent = useMemo(
    () =>
      fix.isManualFix && fix.issueCode.includes('INTERNET') && ispInfo?.detected ? (
        <div
          className="mb-4 p-3 bg-info/10 border border-info/20 rounded-md"
          role="complementary"
          aria-label="ISP contact information"
        >
          <p className="text-xs font-medium text-info mb-2">ISP Information</p>
          <div className="space-y-1 text-xs">
            {ispInfo.name && <p className="text-foreground">Provider: {ispInfo.name}</p>}
            {ispInfo.supportPhone && (
              <p className="text-foreground">
                Phone:{' '}
                <a
                  href={`tel:${ispInfo.supportPhone}`}
                  className="text-info hover:underline focus:outline-none focus:ring-2 focus:ring-info focus:ring-offset-2 rounded px-1"
                >
                  {ispInfo.supportPhone}
                </a>
              </p>
            )}
            {ispInfo.supportUrl && (
              <p className="text-foreground">
                Website:{' '}
                <a
                  href={ispInfo.supportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-info hover:underline focus:outline-none focus:ring-2 focus:ring-info focus:ring-offset-2 rounded px-1"
                >
                  {ispInfo.supportUrl.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </p>
            )}
          </div>
        </div>
      ) : null,
    [fix.isManualFix, fix.issueCode, ispInfo?.detected, ispInfo?.name, ispInfo?.supportPhone, ispInfo?.supportUrl]
  );

  const commandPreviewContent = useMemo(
    () =>
      showCommandPreview && fix.command ? (
        <div className="mb-4 p-3 bg-muted/50 rounded-md font-mono text-xs">
          <p className="text-muted-foreground mb-1">RouterOS Command:</p>
          <code className="text-foreground break-all">{fix.command}</code>
        </div>
      ) : null,
    [showCommandPreview, fix.command]
  );

  const handleApplyClick = useCallback(() => {
    onApply();
  }, [onApply]);

  const handleSkipClick = useCallback(() => {
    onSkip();
  }, [onSkip]);

  return (
    <Card
      className="p-4 border-2 border-warning/50 bg-warning/5"
      role="region"
      aria-label={`Fix suggestion: ${fix.title}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" aria-hidden="true" />
          <h3 className="font-semibold text-foreground">{fix.title}</h3>
        </div>
        {getConfidenceBadge()}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4" id={`fix-description-${fix.issueCode}`}>
        {fix.description}
      </p>

      {/* Manual Fix Steps */}
      {manualStepsContent}

      {/* ISP Contact Information */}
      {ispInfoContent}

      {/* Command Preview */}
      {commandPreviewContent}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleSkipClick}
          disabled={status === 'applying'}
          className="min-h-[44px]"
          aria-label={fix.isManualFix ? 'Continue to next step' : 'Skip this fix'}
        >
          {fix.isManualFix ? 'Continue' : 'Skip'}
        </Button>

        {!fix.isManualFix && (
          <Button
            onClick={handleApplyClick}
            disabled={status === 'applying' || status === 'applied'}
            className="flex-1 min-h-[44px]"
            aria-describedby={`fix-description-${fix.issueCode}`}
            aria-busy={status === 'applying'}
          >
            {status === 'applying' && (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Applying Fix...</span>
              </>
            )}
            {status === 'applied' && (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Applied</span>
              </>
            )}
            {status === 'idle' && <span>Apply Fix</span>}
            {status === 'failed' && <span>Try Again</span>}
          </Button>
        )}
      </div>
    </Card>
  );
});

FixSuggestion.displayName = 'FixSuggestion';
