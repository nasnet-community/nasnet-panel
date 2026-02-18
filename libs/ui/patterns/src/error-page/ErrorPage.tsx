/**
 * Error Page Component
 * Full-page error display for critical failures
 *
 * Used for:
 * - Unrecoverable application errors
 * - Critical server errors
 * - Resource not found (404)
 * - Authorization errors (403)
 * - Server errors (500)
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

import * as React from 'react';

import {
  AlertTriangle,
  WifiOff,
  ShieldX,
  FileQuestion,
  ServerCrash,
  RefreshCw,
  Home,
  ArrowLeft,
  Bug,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { cn, Button } from '@nasnet/ui/primitives';

/**
 * Error page variant types
 */
export type ErrorPageVariant = 'error' | 'network' | 'unauthorized' | 'not-found' | 'server-error';

/**
 * Error Page Props
 */
export interface ErrorPageProps {
  /** Error variant for styling and default messaging */
  variant?: ErrorPageVariant;
  /** HTTP status code */
  statusCode?: number;
  /** Custom error title */
  title?: string;
  /** Custom error description */
  description?: string;
  /** Technical error message */
  technicalMessage?: string;
  /** Error code */
  errorCode?: string;
  /** Stack trace (dev only) */
  stackTrace?: string;
  /** Retry handler */
  onRetry?: () => void;
  /** Custom retry button label */
  retryLabel?: string;
  /** Show home button */
  showHomeButton?: boolean;
  /** Show back button */
  showBackButton?: boolean;
  /** Report issue handler */
  onReport?: () => void;
  /** Additional class name */
  className?: string;
  /** Children to render below the error message */
  children?: React.ReactNode;
}

/**
 * Variant configuration
 */
interface VariantConfig {
  icon: React.ElementType;
  defaultTitle: string;
  defaultDescription: string;
  iconBg: string;
  iconColor: string;
}

const variantConfigs: Record<ErrorPageVariant, VariantConfig> = {
  error: {
    icon: AlertTriangle,
    defaultTitle: 'Something went wrong',
    defaultDescription: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    iconBg: 'bg-error/10',
    iconColor: 'text-error',
  },
  network: {
    icon: WifiOff,
    defaultTitle: 'Connection lost',
    defaultDescription: 'Unable to connect to the server. Please check your network connection and try again.',
    iconBg: 'bg-info/10',
    iconColor: 'text-info',
  },
  unauthorized: {
    icon: ShieldX,
    defaultTitle: 'Access denied',
    defaultDescription: "You don't have permission to access this page. Please contact your administrator if you believe this is an error.",
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  'not-found': {
    icon: FileQuestion,
    defaultTitle: 'Page not found',
    defaultDescription: "The page you're looking for doesn't exist or has been moved.",
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
  'server-error': {
    icon: ServerCrash,
    defaultTitle: 'Server error',
    defaultDescription: 'The server encountered an error while processing your request. Our team has been notified.',
    iconBg: 'bg-error/10',
    iconColor: 'text-error',
  },
};

/**
 * Error Page Component
 *
 * A full-page error display for critical failures that require user attention.
 *
 * @example Basic usage
 * ```tsx
 * <ErrorPage
 *   variant="error"
 *   title="Application crashed"
 *   onRetry={() => window.location.reload()}
 * />
 * ```
 *
 * @example 404 page
 * ```tsx
 * <ErrorPage
 *   variant="not-found"
 *   statusCode={404}
 *   showHomeButton
 *   showBackButton
 * />
 * ```
 *
 * @example Server error with details
 * ```tsx
 * <ErrorPage
 *   variant="server-error"
 *   statusCode={500}
 *   errorCode="S600"
 *   technicalMessage="Database connection failed"
 *   onRetry={refetch}
 *   onReport={reportError}
 * />
 * ```
 */
export function ErrorPage({
  variant = 'error',
  statusCode,
  title,
  description,
  technicalMessage,
  errorCode,
  stackTrace,
  onRetry,
  retryLabel = 'Try Again',
  showHomeButton = true,
  showBackButton = false,
  onReport,
  className,
  children,
}: ErrorPageProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  const config = variantConfigs[variant];
  const Icon = config.icon;

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleCopyError = () => {
    const errorData = {
      statusCode,
      errorCode,
      message: technicalMessage,
      stack: stackTrace,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(errorData, null, 2));
  };

  return (
    <div
      className={cn(
        'min-h-[70vh] flex items-center justify-center p-4 sm:p-6',
        className
      )}
      role="main"
      aria-labelledby="error-title"
    >
      <div className="max-w-lg w-full text-center">
        {/* Status Code */}
        {statusCode && (
          <p className="text-6xl sm:text-8xl font-bold text-muted-foreground/30 mb-2">
            {statusCode}
          </p>
        )}

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className={cn(
              'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center',
              config.iconBg
            )}
          >
            <Icon
              className={cn('w-8 h-8 sm:w-10 sm:h-10', config.iconColor)}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Title */}
        <h1
          id="error-title"
          className="text-2xl sm:text-3xl font-bold text-foreground mb-3"
        >
          {title || config.defaultTitle}
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {description || config.defaultDescription}
        </p>

        {/* Error Code Badge */}
        {errorCode && (
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
              Error Code: {errorCode}
            </span>
          </div>
        )}

        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          {onRetry && (
            <Button onClick={onRetry} size="lg">
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              {retryLabel}
            </Button>
          )}

          {showBackButton && (
            <Button onClick={handleGoBack} variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Go Back
            </Button>
          )}

          {showHomeButton && (
            <Button onClick={handleGoHome} variant="outline" size="lg">
              <Home className="w-4 h-4 mr-2" aria-hidden="true" />
              Go to Dashboard
            </Button>
          )}
        </div>

        {/* Secondary Actions */}
        <div className="flex justify-center gap-4">
          {(technicalMessage || stackTrace) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-expanded={showDetails}
            >
              {showDetails ? (
                <>
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  Show details
                </>
              )}
            </button>
          )}

          {onReport && (
            <button
              onClick={onReport}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bug className="w-4 h-4" aria-hidden="true" />
              Report Issue
            </button>
          )}
        </div>

        {/* Technical Details */}
        {showDetails && (technicalMessage || stackTrace) && (
          <div className="mt-6 p-4 bg-muted rounded-lg text-left max-w-md mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Technical Details
              </span>
              <button
                onClick={handleCopyError}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Copy
              </button>
            </div>
            {technicalMessage && (
              <p className="text-sm font-mono text-foreground break-all">
                {technicalMessage}
              </p>
            )}
            {import.meta.env.DEV && stackTrace && (
              <pre className="mt-3 text-xs text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap">
                {stackTrace}
              </pre>
            )}
          </div>
        )}

        {/* Additional Content */}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}
