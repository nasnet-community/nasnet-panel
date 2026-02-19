/**
 * Network Error Display Component
 * Specialized error display for network/connectivity issues
 *
 * Extends ErrorCard with network-specific features:
 * - Connection troubleshooting tips
 * - Auto-retry indicator
 * - Network status integration
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

import * as React from 'react';

import {
  WifiOff,
  Wifi,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
} from 'lucide-react';

import { cn, Button, Card, CardContent } from '@nasnet/ui/primitives';

import { useNetworkStatus } from '../offline-indicator';

/**
 * Network error type
 */
export type NetworkErrorType =
  | 'offline'
  | 'timeout'
  | 'connection-refused'
  | 'dns-failed'
  | 'server-error'
  | 'unknown';

/**
 * Network Error Display Props
 */
export interface NetworkErrorDisplayProps {
  /** Network error type for contextual messaging */
  type?: NetworkErrorType;
  /** Custom error title */
  title?: string;
  /** Custom error description */
  description?: string;
  /** Technical error message */
  technicalMessage?: string;
  /** Error code (e.g., N300) */
  errorCode?: string;
  /** Retry handler */
  onRetry?: () => void;
  /** Whether auto-retry is in progress */
  isRetrying?: boolean;
  /** Current retry attempt (e.g., 2 of 5) */
  retryAttempt?: number;
  /** Max retry attempts */
  maxRetries?: number;
  /** Time until next retry (seconds) */
  nextRetryIn?: number;
  /** Whether to show troubleshooting tips */
  showTroubleshooting?: boolean;
  /** Open network settings handler (mobile only) */
  onOpenSettings?: () => void;
  /** Additional class name */
  className?: string;
  /** Variant: default or compact */
  variant?: 'default' | 'compact';
}

/**
 * Get default messages for network error types
 */
function getNetworkErrorConfig(type: NetworkErrorType) {
  switch (type) {
    case 'offline':
      return {
        title: "You're offline",
        description: 'Your device is not connected to the internet. Check your network connection.',
      };
    case 'timeout':
      return {
        title: 'Connection timed out',
        description: 'The server took too long to respond. This may be due to slow network or server issues.',
      };
    case 'connection-refused':
      return {
        title: 'Connection refused',
        description: 'Unable to connect to the router. Make sure the router is powered on and accessible.',
      };
    case 'dns-failed':
      return {
        title: 'DNS resolution failed',
        description: 'Unable to resolve the server address. Check your DNS settings.',
      };
    case 'server-error':
      return {
        title: 'Server error',
        description: 'The server encountered an error. Please try again later.',
      };
    case 'unknown':
    default:
      return {
        title: 'Network error',
        description: 'Unable to complete the request. Please check your connection and try again.',
      };
  }
}

/**
 * Troubleshooting tips for network errors
 */
const troubleshootingTips = [
  'Check if your device is connected to WiFi or Ethernet',
  'Try restarting your router',
  'Verify the router IP address is correct',
  'Ensure no firewall is blocking the connection',
  'Try accessing the router from another device',
];

/**
 * Network Error Display Component
 *
 * Shows network/connectivity errors with retry functionality
 * and optional troubleshooting tips.
 *
 * @example Basic usage
 * ```tsx
 * <NetworkErrorDisplay
 *   type="offline"
 *   onRetry={() => refetch()}
 * />
 * ```
 *
 * @example With auto-retry
 * ```tsx
 * <NetworkErrorDisplay
 *   type="timeout"
 *   isRetrying
 *   retryAttempt={2}
 *   maxRetries={5}
 *   nextRetryIn={4}
 *   onRetry={manualRetry}
 * />
 * ```
 *
 * @example With troubleshooting
 * ```tsx
 * <NetworkErrorDisplay
 *   type="connection-refused"
 *   showTroubleshooting
 *   errorCode="R200"
 *   technicalMessage="ECONNREFUSED 192.168.88.1:8728"
 * />
 * ```
 */
export function NetworkErrorDisplay({
  type = 'unknown',
  title,
  description,
  technicalMessage,
  errorCode,
  onRetry,
  isRetrying = false,
  retryAttempt,
  maxRetries,
  nextRetryIn,
  showTroubleshooting = false,
  onOpenSettings,
  className,
  variant = 'default',
}: NetworkErrorDisplayProps) {
  const [showTips, setShowTips] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const { isOnline } = useNetworkStatus();

  const config = getNetworkErrorConfig(type);
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  // If we came back online while showing the error, show success state
  const showOnlineSuccess = type === 'offline' && isOnline;

  // Compact variant
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border',
          showOnlineSuccess
            ? 'bg-success/5 border-success/30'
            : 'bg-info/5 border-info/30',
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            showOnlineSuccess ? 'bg-success/10' : 'bg-info/10'
          )}
        >
          {showOnlineSuccess ? (
            <Wifi className="w-4 h-4 text-success" aria-hidden="true" />
          ) : (
            <WifiOff className="w-4 h-4 text-info" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm">
            {showOnlineSuccess ? 'Back online' : displayTitle}
          </p>
          {!showOnlineSuccess && isRetrying && nextRetryIn && (
            <p className="text-xs text-muted-foreground">
              Retrying in {nextRetryIn}s...
            </p>
          )}
        </div>
        {!showOnlineSuccess && onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            aria-label={isRetrying ? 'Retrying connection' : 'Retry connection'}
          >
            {isRetrying ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </Button>
        )}
      </div>
    );
  }

  // Default variant - full card
  return (
    <Card
      className={cn(
        showOnlineSuccess
          ? 'border-success/30 bg-success/5'
          : 'border-info/30 bg-info/5',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div
            className={cn(
              'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0',
              showOnlineSuccess ? 'bg-success/10' : 'bg-info/10'
            )}
          >
            {showOnlineSuccess ? (
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-success" aria-hidden="true" />
            ) : (
              <WifiOff className="w-5 h-5 sm:w-6 sm:h-6 text-info" aria-hidden="true" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title with error code */}
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-foreground">
                {showOnlineSuccess ? 'Connection restored' : displayTitle}
              </h4>
              {!showOnlineSuccess && errorCode && (
                <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {errorCode}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mt-1">
              {showOnlineSuccess
                ? 'Your network connection has been restored.'
                : displayDescription}
            </p>

            {/* Retry Status */}
            {!showOnlineSuccess && isRetrying && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                <span>
                  Retrying{retryAttempt && maxRetries && ` (${retryAttempt}/${maxRetries})`}
                  {nextRetryIn && `... ${nextRetryIn}s`}
                </span>
              </div>
            )}

            {/* Actions */}
            {!showOnlineSuccess && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {onRetry && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={onRetry}
                    disabled={isRetrying}
                    aria-label={isRetrying ? 'Retrying connection' : 'Retry connection now'}
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" aria-hidden="true" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                        Retry Now
                      </>
                    )}
                  </Button>
                )}

                {onOpenSettings && (
                  <Button size="sm" variant="outline" onClick={onOpenSettings}>
                    <Settings className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    Network Settings
                  </Button>
                )}

                {showTroubleshooting && (
                  <button
                    onClick={() => setShowTips(!showTips)}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                    aria-expanded={showTips}
                    aria-label={showTips ? 'Hide troubleshooting tips' : 'Show troubleshooting tips'}
                  >
                    {showTips ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                        Hide tips
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                        Troubleshooting tips
                      </>
                    )}
                  </button>
                )}

                {technicalMessage && (
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                    aria-expanded={showDetails}
                    aria-label={showDetails ? 'Hide technical details' : 'Show technical details'}
                  >
                    {showDetails ? 'Hide details' : 'Show details'}
                  </button>
                )}
              </div>
            )}

            {/* Troubleshooting Tips */}
            {showTips && !showOnlineSuccess && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium text-foreground mb-2">
                  Things to try:
                </p>
                <ul className="space-y-1">
                  {troubleshootingTips.map((tip, index) => (
                    <li
                      key={index}
                      className="text-xs text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-info">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Details */}
            {showDetails && technicalMessage && !showOnlineSuccess && (
              <div className="mt-3 p-2 bg-muted rounded text-xs font-mono text-foreground break-all">
                {technicalMessage}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
