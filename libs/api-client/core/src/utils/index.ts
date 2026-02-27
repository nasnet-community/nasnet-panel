/**
 * API Client Utilities
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

// Error Messages - Code to user-friendly message mapping
export {
  getErrorMessage,
  getErrorInfo,
  getErrorCategory,
  getErrorSeverity,
  getErrorAction,
  isRecoverableError,
  isAuthError,
  isNetworkError,
  isValidationError,
} from './error-messages';
export type { ErrorCategory, ErrorSeverity, ErrorInfo } from './error-messages';

// Error Logging - Structured error logging for observability
export {
  logError,
  logGraphQLError,
  logNetworkError,
  logComponentError,
  flushErrorBuffer,
  getErrorBufferSize,
} from './error-logging';
export type { ErrorLogEntry, ErrorLogInput } from './error-logging';
