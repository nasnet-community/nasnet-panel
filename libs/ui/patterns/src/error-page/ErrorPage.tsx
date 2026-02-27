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
    defaultDescription:
      'An unexpected error occurred. Please try again or contact support if the problem persists.',
    iconBg: 'bg-error/10',
    iconColor: 'text-error',
  },
  network: {
    icon: WifiOff,
    defaultTitle: 'Connection lost',
    defaultDescription:
      'Unable to connect to the server. Please check your network connection and try again.',
    iconBg: 'bg-info/10',
    iconColor: 'text-info',
  },
  unauthorized: {
    icon: ShieldX,
    defaultTitle: 'Access denied',
    defaultDescription:
      "You don't have permission to access this page. Please contact your administrator if you believe this is an error.",
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
    defaultDescription:
      'The server encountered an error while processing your request. Our team has been notified.',
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
function ErrorPageComponent({
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

  const config = React.useMemo(() => variantConfigs[variant], [variant]);
  const Icon = React.useMemo(() => config.icon, [config]);

  const handleGoBack = React.useCallback(() => {
    window.history.back();
  }, []);

  const handleGoHome = React.useCallback(() => {
    window.location.href = '/';
  }, []);

  const handleCopyError = React.useCallback(() => {
    const errorData = {
      statusCode,
      errorCode,
      message: technicalMessage,
      stack: stackTrace,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(errorData, null, 2));
  }, [statusCode, errorCode, technicalMessage, stackTrace]);

  const handleRetry = React.useCallback(() => {
    onRetry?.();
  }, [onRetry]);

  const handleReport = React.useCallback(() => {
    onReport?.();
  }, [onReport]);

  return (
    <div
      className={cn('flex min-h-[70vh] items-center justify-center p-4 sm:p-6', className)}
      role="main"
      aria-labelledby="error-title"
    >
      <div className="w-full max-w-lg text-center">
        {/* Status Code */}
        {statusCode && (
          <p className="text-muted-foreground/30 mb-2 text-6xl font-bold sm:text-8xl">
            {statusCode}
          </p>
        )}

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-2xl sm:h-20 sm:w-20',
              config.iconBg
            )}
          >
            <Icon
              className={cn('h-8 w-8 sm:h-10 sm:w-10', config.iconColor)}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Title */}
        <h1
          id="error-title"
          className="text-foreground mb-3 text-2xl font-bold sm:text-3xl"
        >
          {title || config.defaultTitle}
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mx-auto mb-6 max-w-md">
          {description || config.defaultDescription}
        </p>

        {/* Error Code Badge */}
        {errorCode && (
          <div className="mb-6">
            <span className="text-muted-foreground bg-muted inline-flex items-center gap-1.5 rounded px-2 py-1 font-mono text-xs">
              Error Code: {errorCode}
            </span>
          </div>
        )}

        {/* Primary Actions */}
        <div className="mb-4 flex flex-col justify-center gap-3 sm:flex-row">
          {onRetry && (
            <Button
              onClick={handleRetry}
              size="lg"
            >
              <RefreshCw
                className="mr-2 h-4 w-4"
                aria-hidden="true"
              />
              {retryLabel}
            </Button>
          )}

          {showBackButton && (
            <Button
              onClick={handleGoBack}
              variant="outline"
              size="lg"
            >
              <ArrowLeft
                className="mr-2 h-4 w-4"
                aria-hidden="true"
              />
              Go Back
            </Button>
          )}

          {showHomeButton && (
            <Button
              onClick={handleGoHome}
              variant="outline"
              size="lg"
            >
              <Home
                className="mr-2 h-4 w-4"
                aria-hidden="true"
              />
              Go to Dashboard
            </Button>
          )}
        </div>

        {/* Secondary Actions */}
        <div className="flex justify-center gap-4">
          {(technicalMessage || stackTrace) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
              aria-expanded={showDetails}
            >
              {showDetails ?
                <>
                  <ChevronUp
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  Hide details
                </>
              : <>
                  <ChevronDown
                    className="h-4 w-4"
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
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
            >
              <Bug
                className="h-4 w-4"
                aria-hidden="true"
              />
              Report Issue
            </button>
          )}
        </div>

        {/* Technical Details */}
        {showDetails && (technicalMessage || stackTrace) && (
          <div className="bg-muted mx-auto mt-6 max-w-md rounded-lg p-4 text-left">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Technical Details
              </span>
              <button
                onClick={handleCopyError}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Copy
              </button>
            </div>
            {technicalMessage && (
              <p className="text-foreground break-all font-mono text-sm">{technicalMessage}</p>
            )}
            {import.meta.env.DEV && stackTrace && (
              <pre className="text-muted-foreground mt-3 max-h-40 overflow-auto whitespace-pre-wrap text-xs">
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

ErrorPageComponent.displayName = 'ErrorPage';

/**
 * Memoized ErrorPage component
 */
export const ErrorPage = React.memo(ErrorPageComponent);
