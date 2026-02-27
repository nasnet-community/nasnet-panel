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
function ErrorCardComponent({
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

  const Icon = React.useMemo(() => getErrorIcon(type), [type]);
  const colors = React.useMemo(() => getErrorColors(type), [type]);

  // Memoized retry handler
  const handleRetry = React.useCallback(() => {
    onRetry?.();
  }, [onRetry]);

  // Memoized secondary action handler
  const handleSecondaryAction = React.useCallback(() => {
    onSecondaryAction?.();
  }, [onSecondaryAction]);

  // Memoized report handler
  const handleReport = React.useCallback(() => {
    onReport?.();
  }, [onReport]);

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
          'flex items-center gap-2 rounded-lg p-2 text-sm',
          colors.bg,
          colors.border,
          'border',
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <Icon
          className={cn('h-4 w-4 flex-shrink-0', colors.iconColor)}
          aria-hidden="true"
        />
        <span className={cn('flex-1 truncate', colors.textColor)}>{title}</span>
        {onRetry && (
          <button
            ref={retryButtonRef}
            onClick={handleRetry}
            className={cn('hover:bg-background/50 rounded p-1', colors.textColor)}
            aria-label="Retry"
          >
            <RefreshCw
              className="h-4 w-4"
              aria-hidden="true"
            />
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
          'flex items-center gap-3 rounded-lg border p-3',
          colors.bg,
          colors.border,
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', colors.iconBg)}>
          <Icon
            className={cn('h-4 w-4', colors.iconColor)}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-medium">{title}</p>
          {description && <p className="text-muted-foreground truncate text-xs">{description}</p>}
        </div>
        {onRetry && (
          <Button
            ref={retryButtonRef}
            size="sm"
            variant="outline"
            onClick={handleRetry}
          >
            <RefreshCw
              className="mr-1 h-3.5 w-3.5"
              aria-hidden="true"
            />
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Default variant - full card
  return (
    <Card
      className={cn(
        'bg-error-light/50 border-error/20 border dark:border-red-900/30 dark:bg-red-900/10',
        colors.border,
        colors.bg,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3">
          {/* Error Icon */}
          <div className="flex-shrink-0">
            <Icon
              className={cn('text-error h-6 w-6', colors.iconColor)}
              aria-hidden="true"
            />
          </div>

          {/* Error Content */}
          <div className="min-w-0 flex-1">
            {/* Title with optional error code */}
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-error-dark text-sm font-semibold dark:text-red-400">{title}</h4>
              {errorCode && (
                <span className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                  {errorCode}
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-error-dark/80 mt-1 text-sm dark:text-red-300">{description}</p>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {onRetry && (
                <Button
                  ref={retryButtonRef}
                  size="sm"
                  variant="default"
                  onClick={handleRetry}
                >
                  <RefreshCw
                    className="mr-1.5 h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  Retry
                </Button>
              )}

              {onSecondaryAction && secondaryActionLabel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSecondaryAction}
                >
                  {secondaryActionLabel}
                </Button>
              )}

              {(technicalMessage || stackTrace) && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
                  aria-expanded={showDetails}
                >
                  {showDetails ?
                    <>
                      <ChevronUp
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      Hide details
                    </>
                  : <>
                      <ChevronDown
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      Show details
                    </>
                  }
                </button>
              )}

              {onReport && (
                <button
                  onClick={handleReport}
                  className="text-muted-foreground hover:text-foreground ml-auto inline-flex items-center gap-1 text-sm transition-colors"
                >
                  <Bug
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  Report
                </button>
              )}
            </div>

            {/* Technical Details */}
            {showDetails && (technicalMessage || stackTrace) && (
              <div className="bg-muted mt-3 rounded-lg p-3">
                {technicalMessage && (
                  <p className="text-foreground break-all font-mono text-xs">{technicalMessage}</p>
                )}
                {import.meta.env.DEV && stackTrace && (
                  <pre className="text-muted-foreground mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs">
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

ErrorCardComponent.displayName = 'ErrorCard';

/**
 * Memoized ErrorCard component
 */
export const ErrorCard = React.memo(ErrorCardComponent);
