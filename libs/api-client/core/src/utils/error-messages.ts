/**
 * Error Message Mapping Utility
 *
 * Maps error codes to user-friendly messages.
 * Uses i18n keys when available, falls back to default messages.
 *
 * Error Code Categories:
 * - P1xx: Platform errors (capability not available)
 * - R2xx: Protocol errors (connection failed, timeout)
 * - N3xx: Network errors (unreachable, DNS, timeout)
 * - V4xx: Validation errors (schema, reference, conflict)
 * - A5xx: Auth errors (failed, insufficient, expired)
 * - S6xx: Resource errors (not found, locked, invalid state)
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

// ===== Types =====

/**
 * Error code categories
 */
export type ErrorCategory = 'P1' | 'R2' | 'N3' | 'V4' | 'A5' | 'S6';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Structured error information
 */
export interface ErrorInfo {
  /** User-friendly error message */
  message: string;
  /** Error severity */
  severity: ErrorSeverity;
  /** Whether the error is recoverable */
  recoverable: boolean;
  /** Suggested action */
  action?: string;
  /** i18n key for translation */
  i18nKey?: string;
}

// ===== Error Message Maps =====

/**
 * Specific error code to message mapping
 */
const ERROR_CODE_MESSAGES: Record<string, ErrorInfo> = {
  // Platform errors (P1xx)
  P100: {
    message: 'This feature is not supported on your router',
    severity: 'warning',
    recoverable: false,
    action: 'Check router compatibility',
    i18nKey: 'errors.platform.notSupported',
  },
  P101: {
    message: 'This capability is not available',
    severity: 'warning',
    recoverable: false,
    action: 'Install required package',
    i18nKey: 'errors.platform.capabilityUnavailable',
  },
  P102: {
    message: 'RouterOS version is too old for this feature',
    severity: 'warning',
    recoverable: false,
    action: 'Update RouterOS',
    i18nKey: 'errors.platform.versionTooOld',
  },
  P103: {
    message: 'Required package is not installed',
    severity: 'warning',
    recoverable: true,
    action: 'Install missing package',
    i18nKey: 'errors.platform.packageMissing',
  },

  // Protocol errors (R2xx)
  R200: {
    message: 'Failed to connect to router',
    severity: 'error',
    recoverable: true,
    action: 'Check router IP and credentials',
    i18nKey: 'errors.protocol.connectionFailed',
  },
  R201: {
    message: 'Connection timed out',
    severity: 'error',
    recoverable: true,
    action: 'Try again or check network',
    i18nKey: 'errors.protocol.timeout',
  },
  R202: {
    message: 'Protocol error occurred',
    severity: 'error',
    recoverable: true,
    action: 'Try reconnecting',
    i18nKey: 'errors.protocol.error',
  },
  R203: {
    message: 'All connection methods failed',
    severity: 'error',
    recoverable: true,
    action: 'Verify router is accessible',
    i18nKey: 'errors.protocol.allFailed',
  },

  // Network errors (N3xx)
  N300: {
    message: 'Cannot reach the router',
    severity: 'error',
    recoverable: true,
    action: 'Check your network connection',
    i18nKey: 'errors.network.unreachable',
  },
  N301: {
    message: 'Cannot resolve router address',
    severity: 'error',
    recoverable: true,
    action: 'Check DNS settings',
    i18nKey: 'errors.network.dns',
  },
  N302: {
    message: 'Network request timed out',
    severity: 'error',
    recoverable: true,
    action: 'Try again',
    i18nKey: 'errors.network.timeout',
  },

  // Validation errors (V4xx)
  V400: {
    message: 'Invalid input provided',
    severity: 'warning',
    recoverable: true,
    action: 'Check your input',
    i18nKey: 'errors.validation.schemaFailed',
  },
  V401: {
    message: 'Referenced item not found',
    severity: 'warning',
    recoverable: true,
    action: 'Select a valid reference',
    i18nKey: 'errors.validation.referenceNotFound',
  },
  V402: {
    message: 'Circular dependency detected',
    severity: 'error',
    recoverable: true,
    action: 'Review configuration',
    i18nKey: 'errors.validation.circularDependency',
  },
  V403: {
    message: 'Conflicting configuration detected',
    severity: 'error',
    recoverable: true,
    action: 'Resolve conflicts',
    i18nKey: 'errors.validation.conflict',
  },

  // Auth errors (A5xx)
  A500: {
    message: 'Authentication failed',
    severity: 'error',
    recoverable: true,
    action: 'Check your credentials',
    i18nKey: 'errors.auth.failed',
  },
  A501: {
    message: 'You don\'t have permission for this action',
    severity: 'warning',
    recoverable: false,
    action: 'Contact administrator',
    i18nKey: 'errors.auth.insufficient',
  },
  A502: {
    message: 'Your session has expired',
    severity: 'warning',
    recoverable: true,
    action: 'Please log in again',
    i18nKey: 'errors.auth.expired',
  },

  // Resource errors (S6xx)
  S600: {
    message: 'The requested item was not found',
    severity: 'warning',
    recoverable: false,
    action: 'Item may have been deleted',
    i18nKey: 'errors.resource.notFound',
  },
  S601: {
    message: 'This resource is locked',
    severity: 'warning',
    recoverable: true,
    action: 'Wait and try again',
    i18nKey: 'errors.resource.locked',
  },
  S602: {
    message: 'Invalid state transition',
    severity: 'error',
    recoverable: false,
    action: 'Refresh and try again',
    i18nKey: 'errors.resource.invalidState',
  },
  S603: {
    message: 'Dependent resource not ready',
    severity: 'warning',
    recoverable: true,
    action: 'Wait for dependencies',
    i18nKey: 'errors.resource.dependencyNotReady',
  },
};

/**
 * Category-level fallback messages
 */
const CATEGORY_FALLBACKS: Record<ErrorCategory, ErrorInfo> = {
  P1: {
    message: 'Platform feature unavailable',
    severity: 'warning',
    recoverable: false,
    i18nKey: 'errors.platform.generic',
  },
  R2: {
    message: 'Protocol error occurred',
    severity: 'error',
    recoverable: true,
    action: 'Try reconnecting',
    i18nKey: 'errors.protocol.generic',
  },
  N3: {
    message: 'Network error occurred',
    severity: 'error',
    recoverable: true,
    action: 'Check your connection',
    i18nKey: 'errors.network.generic',
  },
  V4: {
    message: 'Validation failed',
    severity: 'warning',
    recoverable: true,
    action: 'Check your input',
    i18nKey: 'errors.validation.generic',
  },
  A5: {
    message: 'Authentication error',
    severity: 'error',
    recoverable: true,
    action: 'Please log in again',
    i18nKey: 'errors.auth.generic',
  },
  S6: {
    message: 'Resource error',
    severity: 'error',
    recoverable: true,
    action: 'Try again',
    i18nKey: 'errors.resource.generic',
  },
};

// ===== Functions =====

/**
 * Get error category from error code
 */
export function getErrorCategory(code: string): ErrorCategory | undefined {
  const prefix = code.substring(0, 2) as ErrorCategory;
  if (CATEGORY_FALLBACKS[prefix]) {
    return prefix;
  }
  return undefined;
}

/**
 * Get error severity from error code
 */
export function getErrorSeverity(code: string | undefined): ErrorSeverity {
  if (!code) return 'error';

  const info = ERROR_CODE_MESSAGES[code];
  if (info) return info.severity;

  const category = getErrorCategory(code);
  if (category) return CATEGORY_FALLBACKS[category].severity;

  return 'error';
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(code: string | undefined): boolean {
  if (!code) return true;

  const info = ERROR_CODE_MESSAGES[code];
  if (info) return info.recoverable;

  const category = getErrorCategory(code);
  if (category) return CATEGORY_FALLBACKS[category].recoverable;

  return true;
}

/**
 * Get user-friendly error message for an error code
 *
 * @param code - Error code (e.g., "N300", "A501")
 * @param fallbackMessage - Fallback if code not found
 * @returns User-friendly message
 *
 * @example
 * ```ts
 * const message = getErrorMessage('N300');
 * // "Cannot reach the router"
 *
 * const message = getErrorMessage('UNKNOWN', 'Something went wrong');
 * // "Something went wrong"
 * ```
 */
export function getErrorMessage(
  code: string | undefined,
  fallbackMessage?: string
): string {
  if (!code) {
    return fallbackMessage || 'An error occurred. Please try again.';
  }

  // Check for exact match
  const exactMatch = ERROR_CODE_MESSAGES[code];
  if (exactMatch) {
    return exactMatch.message;
  }

  // Check for category match
  const category = getErrorCategory(code);
  if (category) {
    return CATEGORY_FALLBACKS[category].message;
  }

  // Return fallback
  return fallbackMessage || 'An error occurred. Please try again.';
}

/**
 * Get detailed error information for an error code
 *
 * @param code - Error code
 * @param fallbackMessage - Fallback message if code not found
 * @returns Detailed error information
 *
 * @example
 * ```ts
 * const info = getErrorInfo('A502');
 * // {
 * //   message: 'Your session has expired',
 * //   severity: 'warning',
 * //   recoverable: true,
 * //   action: 'Please log in again',
 * //   i18nKey: 'errors.auth.expired'
 * // }
 * ```
 */
export function getErrorInfo(
  code: string | undefined,
  fallbackMessage?: string
): ErrorInfo {
  if (!code) {
    return {
      message: fallbackMessage || 'An error occurred. Please try again.',
      severity: 'error',
      recoverable: true,
      i18nKey: 'errors.generic',
    };
  }

  // Check for exact match
  const exactMatch = ERROR_CODE_MESSAGES[code];
  if (exactMatch) {
    return exactMatch;
  }

  // Check for category match
  const category = getErrorCategory(code);
  if (category) {
    return CATEGORY_FALLBACKS[category];
  }

  // Return generic error info
  return {
    message: fallbackMessage || 'An error occurred. Please try again.',
    severity: 'error',
    recoverable: true,
    i18nKey: 'errors.generic',
  };
}

/**
 * Get suggested action for an error code
 */
export function getErrorAction(code: string | undefined): string | undefined {
  if (!code) return undefined;

  const info = ERROR_CODE_MESSAGES[code];
  if (info?.action) return info.action;

  const category = getErrorCategory(code);
  if (category) return CATEGORY_FALLBACKS[category].action;

  return undefined;
}

/**
 * Check if error code indicates auth error
 */
export function isAuthError(code: string | undefined): boolean {
  if (!code) return false;
  return code.startsWith('A5');
}

/**
 * Check if error code indicates network error
 */
export function isNetworkError(code: string | undefined): boolean {
  if (!code) return false;
  return code.startsWith('N3') || code.startsWith('R2');
}

/**
 * Check if error code indicates validation error
 */
export function isValidationError(code: string | undefined): boolean {
  if (!code) return false;
  return code.startsWith('V4');
}
