// libs/features/diagnostics/src/components/TroubleshootWizard/FixSuggestion.tsx
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@nasnet/ui/primitives';
import { Card } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { FixSuggestion as FixSuggestionType, ISPInfo } from '../../types/troubleshoot.types';

interface FixSuggestionProps {
  /** The fix suggestion to display */
  fix: FixSuggestionType;
  /** Current fix application state */
  status: 'idle' | 'applying' | 'applied' | 'failed';
  /** Callback when user clicks Apply Fix */
  onApply: () => void;
  /** Callback when user clicks Skip */
  onSkip: () => void;
  /** Whether to show detailed command preview */
  showCommandPreview?: boolean;
  /** ISP info for "Contact ISP" suggestions */
  ispInfo?: ISPInfo;
}

export function FixSuggestion({
  fix,
  status,
  onApply,
  onSkip,
  showCommandPreview = false,
  ispInfo,
}: FixSuggestionProps) {
  const getConfidenceBadge = () => {
    if (!fix.confidence) return null;

    const colors = {
      high: 'bg-success/10 text-success border-success/20',
      medium: 'bg-warning/10 text-warning border-warning/20',
      low: 'bg-error/10 text-error border-error/20',
    };

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border',
          colors[fix.confidence]
        )}
      >
        {fix.confidence === 'high' && <CheckCircle2 className="h-3 w-3" />}
        {fix.confidence === 'medium' && <AlertCircle className="h-3 w-3" />}
        {fix.confidence} confidence
      </span>
    );
  };

  return (
    <Card className="p-4 border-2 border-warning/50 bg-warning/5">
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
      {fix.isManualFix && fix.manualSteps && (
        <div className="mb-4 p-3 bg-muted/50 rounded-md">
          <p className="text-xs font-medium text-foreground mb-2">Follow these steps:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
            {fix.manualSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* ISP Contact Information */}
      {fix.isManualFix && fix.issueCode.includes('INTERNET') && ispInfo?.detected && (
        <div className="mb-4 p-3 bg-info/10 border border-info/20 rounded-md">
          <p className="text-xs font-medium text-info mb-2">ISP Information</p>
          <div className="space-y-1 text-xs">
            {ispInfo.name && <p className="text-foreground">Provider: {ispInfo.name}</p>}
            {ispInfo.supportPhone && (
              <p className="text-foreground">
                Phone:{' '}
                <a href={`tel:${ispInfo.supportPhone}`} className="text-info hover:underline">
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
                  className="text-info hover:underline"
                >
                  {ispInfo.supportUrl.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Command Preview */}
      {showCommandPreview && fix.command && (
        <div className="mb-4 p-3 bg-muted/50 rounded-md font-mono text-xs">
          <p className="text-muted-foreground mb-1">RouterOS Command:</p>
          <code className="text-foreground break-all">{fix.command}</code>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onSkip}
          disabled={status === 'applying'}
          className="min-h-[44px]"
        >
          Skip
        </Button>

        {!fix.isManualFix && (
          <Button
            onClick={onApply}
            disabled={status === 'applying' || status === 'applied'}
            className="flex-1 min-h-[44px]"
            aria-describedby={`fix-description-${fix.issueCode}`}
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

        {fix.isManualFix && (
          <Button variant="secondary" onClick={onSkip} className="flex-1 min-h-[44px]">
            Continue
          </Button>
        )}
      </div>
    </Card>
  );
}
