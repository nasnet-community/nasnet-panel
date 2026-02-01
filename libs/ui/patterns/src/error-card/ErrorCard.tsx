/**
 * Error Card Component
 * Inline error display with retry action and expandable details
 *
 * Features:
 * - User-friendly error message display
 * - Retry button for recovery
 * - Expandable technical details
 * - Multiple variants (default, compact, minimal)
 * - Accessible with ARIA attributes
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

import * as React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  WifiOff,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Bug,
  ExternalLink,
} from 'lucide-react';
import { cn, Button, Card, CardContent } from '@nasnet/ui/primitives';

/**
 * Error type categories for contextual styling
 */
export type ErrorType = 'error' | 'warning' | 'network' | 'auth' | 'not-found';

/**
 * Error Card Props
 */
export interface ErrorCardProps {
  /** Error type for styling and icon selection */
  type?: ErrorType;
  /** Main error title */
  title: string;
  /** Human-readable error description */
  description?: string;
  /** Technical error message (shown in details) */
  technicalMessage?: string;
  /** Error code (e.g., N300, A501) */
  errorCode?: string;
  /** Stack trace (only shown in dev mode) */
  stackTrace?: string;
  /** Retry handler */
  onRetry?: () => void;
  /** Secondary action handler */
  onSecondaryAction?: () => void;
  /** Secondary action label */
  secondaryActionLabel?: string;
  /** Report issue handler */
  onReport?: () => void;
  /** Additional class name */
  className?: string;
  /** Variant: default, compact, or minimal */
  variant?: 'default' | 'compact' | 'minimal';
  /** Auto-focus retry button on mount */
  autoFocus?: boolean;
}

/**
 * Get icon for error type
 */
function getErrorIcon(type: ErrorType) {
  switch (type) {
    case 'network':
      return WifiOff;
    case 'warning':
      return AlertCircle;
    case 'auth':
    case 'not-found':
    case 'error':
    default:
      return AlertTriangle;
  }
}

/**
 * Get color classes for error type
 */
function getErrorColors(type: ErrorType) {
  switch (type) {
    case 'warning':
      return {
        border: 'border-warning/30',
        bg: 'bg-warning/5',
        iconBg: 'bg-warning/10',
        iconColor: 'text-warning',
        textColor: 'text-warning',
      };
    case 'network':
      return {
        border: 'border-info/30',
        bg: 'bg-info/5',
        iconBg: 'bg-info/10',
        iconColor: 'text-info',
        textColor: 'text-info',
      };
    case 'auth':
    case 'not-found':
    case 'error':
    default:
      return {
        border: 'border-error/30',
        bg: 'bg-error/5',
        iconBg: 'bg-error/10',
        iconColor: 'text-error',
        textColor: 'text-error',
      };
  }
}

/**
 * Error Card Component
 *
 * Displays errors inline with optional retry action and technical details.
 *
 * @example Basic usage
 * ```tsx
 * <ErrorCard
 *   title="Failed to load data"
 *   description="There was a problem loading the router configuration."
 *   onRetry={() => refetch()}
 * />
 * ```
 *
 * @example With error code and details
 * ```tsx
 * <ErrorCard
 *   type="network"
 *   title="Connection lost"
 *   description="Unable to reach the router. Check your network connection."
 *   errorCode="N300"
 *   technicalMessage="ECONNREFUSED 192.168.88.1:8728"
 *   onRetry={reconnect}
 *   onReport={reportIssue}
 * />
 * ```
 *
 * @example Compact variant
 * ```tsx
 * <ErrorCard
 *   variant="compact"
 *   title="Update failed"
 *   onRetry={retry}
 * />
 * ```
 */
export function ErrorCard({
  type = 'error',
  title,
  description,
  technicalMessage,
  errorCode,
  stackTrace,
  onRetry,
  onSecondaryAction,
  secondaryActionLabel,
  onReport,
  className,
  variant = 'default',
  autoFocus = false,
}: ErrorCardProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const retryButtonRef = React.useRef<HTMLButtonElement>(null);

  const Icon = getErrorIcon(type);
  const colors = getErrorColors(type);

  // Auto-focus retry button for accessibility
  React.useEffect(() => {
    if (autoFocus && retryButtonRef.current) {
      retryButtonRef.current.focus();
    }
  }, [autoFocus]);

  // Minimal variant - single line
  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg text-sm',
          colors.bg,
          colors.border,
          'border',
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <Icon className={cn('w-4 h-4 flex-shrink-0', colors.iconColor)} aria-hidden="true" />
        <span className={cn('flex-1 truncate', colors.textColor)}>{title}</span>
        {onRetry && (
          <button
            ref={retryButtonRef}
            onClick={onRetry}
            className={cn('p-1 rounded hover:bg-background/50', colors.textColor)}
            aria-label="Retry"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }

  // Compact variant - small card
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border',
          colors.bg,
          colors.border,
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.iconBg)}>
          <Icon className={cn('w-4 h-4', colors.iconColor)} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          )}
        </div>
        {onRetry && (
          <Button ref={retryButtonRef} size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Default variant - full card
  return (
    <Card
      className={cn(colors.border, colors.bg, className)}
      role="alert"
      aria-live="polite"
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Error Icon */}
          <div
            className={cn(
              'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0',
              colors.iconBg
            )}
          >
            <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', colors.iconColor)} aria-hidden="true" />
          </div>

          {/* Error Content */}
          <div className="flex-1 min-w-0">
            {/* Title with optional error code */}
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-foreground">{title}</h4>
              {errorCode && (
                <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {errorCode}
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {onRetry && (
                <Button ref={retryButtonRef} size="sm" variant="default" onClick={onRetry}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                  Retry
                </Button>
              )}

              {onSecondaryAction && secondaryActionLabel && (
                <Button size="sm" variant="outline" onClick={onSecondaryAction}>
                  {secondaryActionLabel}
                </Button>
              )}

              {(technicalMessage || stackTrace) && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  aria-expanded={showDetails}
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                      Hide details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                      Show details
                    </>
                  )}
                </button>
              )}

              {onReport && (
                <button
                  onClick={onReport}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto"
                >
                  <Bug className="w-3.5 h-3.5" aria-hidden="true" />
                  Report
                </button>
              )}
            </div>

            {/* Technical Details */}
            {showDetails && (technicalMessage || stackTrace) && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                {technicalMessage && (
                  <p className="text-xs font-mono text-foreground break-all">
                    {technicalMessage}
                  </p>
                )}
                {import.meta.env.DEV && stackTrace && (
                  <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-32 whitespace-pre-wrap">
                    {stackTrace}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
