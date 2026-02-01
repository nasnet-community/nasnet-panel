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
export function SafetyFeedback({
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

  const config = getFeedbackConfig(type);
  const Icon = config.icon;

  // Auto-dismiss timer
  React.useEffect(() => {
    if (autoDismiss > 0 && type === 'success') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoDismiss, type, onDismiss]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'rounded-2xl md:rounded-3xl border-2 p-6 shadow-lg transition-all duration-200 animate-slide-down',
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
            'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
            config.bgColor
          )}
        >
          <Icon className={cn('w-6 h-6', config.iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Message */}
          <h3 className={cn('text-lg font-semibold mb-2', config.textColor)}>
            {message}
          </h3>

          {/* Details - expandable if long */}
          {details && (
            <>
              {details.length > 100 ? (
                <div>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                      'flex items-center gap-2 text-sm mb-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded',
                      config.textColor
                    )}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Show Details
                      </>
                    )}
                  </button>
                  {isExpanded && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 whitespace-pre-wrap">
                      {details}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                  {details}
                </p>
              )}
            </>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={action.onClick}
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
