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
      high: 'bg-success/10 text-success border-success/20',
      medium: 'bg-warning/10 text-warning border-warning/20',
      low: 'bg-error/10 text-error border-error/20',
    };

    return (
      <span
        className={cn(
          'gap-component-sm px-component-sm focus-visible:ring-ring inline-flex items-center rounded-[var(--semantic-radius-badge)] border py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          colors[fix.confidence]
        )}
        role="status"
        aria-label={`Confidence level: ${fix.confidence}`}
      >
        {fix.confidence === 'high' && (
          <CheckCircle2
            className="h-3 w-3"
            aria-hidden="true"
          />
        )}
        {fix.confidence === 'medium' && (
          <AlertCircle
            className="h-3 w-3"
            aria-hidden="true"
          />
        )}
        {fix.confidence} confidence
      </span>
    );
  }, [fix.confidence]);

  const manualStepsContent = useMemo(
    () =>
      fix.isManualFix && fix.manualSteps ?
        <div className="mb-component-md p-component-sm bg-muted/50 rounded-[var(--semantic-radius-card)]">
          <p className="text-foreground mb-component-sm text-xs font-medium">Follow these steps:</p>
          <ol className="space-y-component-xs text-muted-foreground list-inside list-decimal text-xs">
            {fix.manualSteps.map((step, index) => (
              <li
                key={index}
                className="font-mono"
              >
                {step}
              </li>
            ))}
          </ol>
        </div>
      : null,
    [fix.isManualFix, fix.manualSteps]
  );

  const ispInfoContent = useMemo(
    () =>
      fix.isManualFix && fix.issueCode.includes('INTERNET') && ispInfo?.detected ?
        <div
          className="mb-component-md p-component-sm bg-info/10 border-info/20 rounded-[var(--semantic-radius-card)] border"
          role="complementary"
          aria-label="ISP contact information"
        >
          <p className="text-info mb-component-sm text-xs font-medium">ISP Information</p>
          <div className="space-y-component-xs text-xs">
            {ispInfo.name && <p className="text-foreground font-mono">{ispInfo.name}</p>}
            {ispInfo.supportPhone && (
              <p className="text-foreground">
                Phone:{' '}
                <a
                  href={`tel:${ispInfo.supportPhone}`}
                  className="text-info focus-visible:ring-ring px-component-xs inline-flex min-h-[44px] items-center rounded font-mono hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
                  className="text-info focus-visible:ring-ring px-component-xs inline-flex min-h-[44px] items-center rounded font-mono hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  {ispInfo.supportUrl.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </p>
            )}
          </div>
        </div>
      : null,
    [
      fix.isManualFix,
      fix.issueCode,
      ispInfo?.detected,
      ispInfo?.name,
      ispInfo?.supportPhone,
      ispInfo?.supportUrl,
    ]
  );

  const commandPreviewContent = useMemo(
    () =>
      showCommandPreview && fix.command ?
        <div className="mb-component-md p-component-sm bg-muted/50 rounded-[var(--semantic-radius-card)] font-mono text-xs">
          <p className="text-muted-foreground mb-component-xs">RouterOS Command:</p>
          <code className="text-foreground break-all font-mono">{fix.command}</code>
        </div>
      : null,
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
      className="p-component-md border-warning/50 bg-warning/5 border-2"
      role="region"
      aria-label={`Fix suggestion: ${fix.title}`}
    >
      {/* Header */}
      <div className="gap-component-md mb-component-md flex items-start justify-between">
        <div className="gap-component-sm flex items-center">
          <AlertCircle
            className="text-warning h-5 w-5 flex-shrink-0"
            aria-hidden="true"
          />
          <h3 className="text-foreground font-semibold">{fix.title}</h3>
        </div>
        {getConfidenceBadge()}
      </div>

      {/* Description */}
      <p
        className="text-muted-foreground mb-component-md text-sm"
        id={`fix-description-${fix.issueCode}`}
      >
        {fix.description}
      </p>

      {/* Manual Fix Steps */}
      {manualStepsContent}

      {/* ISP Contact Information */}
      {ispInfoContent}

      {/* Command Preview */}
      {commandPreviewContent}

      {/* Action Buttons */}
      <div className="gap-component-sm flex">
        <Button
          variant="outline"
          onClick={handleSkipClick}
          disabled={status === 'applying'}
          className="focus-visible:ring-ring min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-label={fix.isManualFix ? 'Continue to next step' : 'Skip this fix'}
        >
          {fix.isManualFix ? 'Continue' : 'Skip'}
        </Button>

        {!fix.isManualFix && (
          <Button
            onClick={handleApplyClick}
            disabled={status === 'applying' || status === 'applied'}
            className="focus-visible:ring-ring min-h-[44px] flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-describedby={`fix-description-${fix.issueCode}`}
            aria-busy={status === 'applying'}
          >
            {status === 'applying' && (
              <>
                <Loader2
                  className="mr-component-sm h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                <span>Applying Fix...</span>
              </>
            )}
            {status === 'applied' && (
              <>
                <CheckCircle2
                  className="mr-component-sm h-4 w-4"
                  aria-hidden="true"
                />
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
