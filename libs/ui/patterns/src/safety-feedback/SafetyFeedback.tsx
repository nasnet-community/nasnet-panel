/**
 * Safety Feedback Component
 * Displays feedback for configuration changes, rollbacks, and validation errors
 * Based on UX Design Specification - Invisible Safety Pipeline Pattern
 */

import * as React from 'react';

import { AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

import { cn, Button } from '@nasnet/ui/primitives';

/**
 * Feedback action configuration
 */
export interface FeedbackAction {
  /** Action label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button variant */
  variant?: 'default' | 'action' | 'destructive' | 'ghost';
}

/**
 * Feedback type
 */
export type FeedbackType = 'rollback' | 'validation-error' | 'success' | 'warning';

/**
 * SafetyFeedback Props
 */
export interface SafetyFeedbackProps {
  /** Type of feedback */
  type: FeedbackType;
  /** Main message */
  message: string;
  /** Optional detailed description */
  details?: string;
  /** Action buttons */
  actions?: FeedbackAction[];
  /** Custom className */
  className?: string;
  /** Auto-dismiss after ms (0 = no auto-dismiss) */
  autoDismiss?: number;
  /** Dismiss callback */
  onDismiss?: () => void;
}

/**
 * Get configuration based on feedback type
 */
function getFeedbackConfig(type: FeedbackType) {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircle,
        iconColor: 'text-success',
        bgColor: 'bg-success/10 dark:bg-success/20',
        borderColor: 'border-success',
        textColor: 'text-success-dark dark:text-success-light',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        iconColor: 'text-warning',
        bgColor: 'bg-warning/10 dark:bg-warning/20',
        borderColor: 'border-warning',
        textColor: 'text-warning-dark dark:text-warning-light',
      };
    case 'rollback':
      return {
        icon: AlertTriangle,
        iconColor: 'text-warning',
        bgColor: 'bg-warning/10 dark:bg-warning/20',
        borderColor: 'border-warning',
        textColor: 'text-warning-dark dark:text-warning-light',
      };
    case 'validation-error':
      return {
        icon: XCircle,
        iconColor: 'text-error',
        bgColor: 'bg-error/10 dark:bg-error/20',
        borderColor: 'border-error',
        textColor: 'text-error-dark dark:text-error-light',
      };
    default: {
      // Exhaustive check - this should never be reached
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

/**
 * SafetyFeedback Component
 *
 * Displays important feedback about configuration changes:
 * - Rollback confirmations
 * - Validation errors
 * - Success messages
 * - Warnings
 *
 * Features:
 * - Expandable details section
 * - Custom action buttons
 * - Auto-dismiss option
 * - Slide-in animation
 *
 * @example
 * ```tsx
 * <SafetyFeedback
 *   type="rollback"
 *   message="We detected an issue"
 *   details="Previous settings restored. Your network is working."
 *   actions={[
 *     { label: 'Details', onClick: () => showDetails() },
 *     { label: 'Try Again', onClick: () => retry(), variant: 'action' }
 *   ]}
 * />
 * ```
 */
function SafetyFeedbackComponent({
  type,
  message,
  details,
  actions = [],
  className,
  autoDismiss = 0,
  onDismiss,
}: SafetyFeedbackProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);

  const config = React.useMemo(() => getFeedbackConfig(type), [type]);
  const Icon = React.useMemo(() => config.icon, [config]);

  // Memoized action handlers
  const handleActionClick = React.useCallback((onClick: () => void) => {
    return () => onClick();
  }, []);

  const handleDismiss = React.useCallback(() => {
    setIsVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  // Auto-dismiss timer
  React.useEffect(() => {
    if (autoDismiss > 0 && type === 'success') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoDismiss, type, handleDismiss]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'animate-slide-down rounded-2xl border-2 p-6 shadow-lg transition-all duration-200 md:rounded-3xl',
        config.bgColor,
        config.borderColor,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl',
            config.bgColor
          )}
        >
          <Icon className={cn('h-6 w-6', config.iconColor)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Message */}
          <h3 className={cn('mb-2 text-lg font-semibold', config.textColor)}>{message}</h3>

          {/* Details - expandable if long */}
          {details && (
            <>
              {details.length > 100 ?
                <div>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                      'focus:ring-primary-500 mb-2 flex items-center gap-2 rounded text-sm hover:underline focus:outline-none focus:ring-2',
                      config.textColor
                    )}
                  >
                    {isExpanded ?
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Hide Details
                      </>
                    : <>
                        <ChevronDown className="h-4 w-4" />
                        Show Details
                      </>
                    }
                  </button>
                  {isExpanded && (
                    <p className="mb-4 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                      {details}
                    </p>
                  )}
                </div>
              : <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">{details}</p>}
            </>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={handleActionClick(action.onClick)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

SafetyFeedbackComponent.displayName = 'SafetyFeedback';

/**
 * Memoized SafetyFeedback component
 */
export const SafetyFeedback = React.memo(SafetyFeedbackComponent);
