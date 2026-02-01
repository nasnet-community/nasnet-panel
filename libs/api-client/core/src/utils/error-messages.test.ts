/**
 * Error Messages Utility Tests
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

import { describe, it, expect } from 'vitest';
import {
  getErrorMessage,
  getErrorInfo,
  isAuthError,
  isNetworkError,
  isValidationError,
  getErrorCategory,
  getErrorSeverity,
  isRecoverableError,
  getErrorAction,
} from './error-messages';

describe('getErrorMessage', () => {
  it('returns mapped message for known error codes', () => {
    expect(getErrorMessage('P101')).toBe('This capability is not available');
    expect(getErrorMessage('R201')).toBe('Connection timed out');
    expect(getErrorMessage('N301')).toBe('Cannot resolve router address');
    expect(getErrorMessage('V401')).toBe('Referenced item not found');
    expect(getErrorMessage('A501')).toBe("You don't have permission for this action");
    expect(getErrorMessage('S601')).toBe('This resource is locked');
  });

  it('returns category fallback for unknown codes in known categories', () => {
    expect(getErrorMessage('P199')).toBe('Platform feature unavailable');
    expect(getErrorMessage('R299')).toBe('Protocol error occurred');
    expect(getErrorMessage('N399')).toBe('Network error occurred');
    expect(getErrorMessage('V499')).toBe('Validation failed');
    expect(getErrorMessage('A599')).toBe('Authentication error');
    expect(getErrorMessage('S699')).toBe('Resource error');
  });

  it('returns fallback message for unknown codes', () => {
    expect(getErrorMessage('UNKNOWN')).toBe('An error occurred. Please try again.');
    expect(getErrorMessage(undefined)).toBe('An error occurred. Please try again.');
  });

  it('uses custom fallback message when provided', () => {
    expect(getErrorMessage('UNKNOWN', 'Custom fallback')).toBe('Custom fallback');
    expect(getErrorMessage(undefined, 'My fallback')).toBe('My fallback');
  });
});

describe('getErrorInfo', () => {
  it('returns full error info for known codes', () => {
    const info = getErrorInfo('P101');
    expect(info).toEqual({
      message: 'This capability is not available',
      action: 'Install required package',
      severity: 'warning',
      recoverable: false,
      i18nKey: 'errors.platform.capabilityUnavailable',
    });
  });

  it('returns warning severity for validation errors', () => {
    const info = getErrorInfo('V401');
    expect(info.severity).toBe('warning');
  });

  it('returns warning severity for S601 (locked resource)', () => {
    const info = getErrorInfo('S601');
    expect(info.severity).toBe('warning');
  });

  it('returns default info for unknown codes', () => {
    const info = getErrorInfo('UNKNOWN');
    expect(info).toEqual({
      message: 'An error occurred. Please try again.',
      severity: 'error',
      recoverable: true,
      i18nKey: 'errors.generic',
    });
  });

  it('returns category info for unknown codes in known categories', () => {
    const info = getErrorInfo('P199');
    expect(info.message).toBe('Platform feature unavailable');
    expect(info.i18nKey).toBe('errors.platform.generic');
  });
});

describe('isAuthError', () => {
  it('returns true for A5xx codes', () => {
    expect(isAuthError('A500')).toBe(true);
    expect(isAuthError('A501')).toBe(true);
    expect(isAuthError('A502')).toBe(true);
    expect(isAuthError('A599')).toBe(true);
  });

  it('returns false for non-auth codes', () => {
    expect(isAuthError('P101')).toBe(false);
    expect(isAuthError('N301')).toBe(false);
    expect(isAuthError('V401')).toBe(false);
    expect(isAuthError(undefined)).toBe(false);
    expect(isAuthError('UNAUTHENTICATED')).toBe(false); // Only matches A5xx pattern
  });
});

describe('isNetworkError', () => {
  it('returns true for N3xx codes', () => {
    expect(isNetworkError('N300')).toBe(true);
    expect(isNetworkError('N301')).toBe(true);
    expect(isNetworkError('N302')).toBe(true);
    expect(isNetworkError('N399')).toBe(true);
  });

  it('returns true for R2xx codes (protocol errors include network)', () => {
    expect(isNetworkError('R200')).toBe(true);
    expect(isNetworkError('R201')).toBe(true);
    expect(isNetworkError('R202')).toBe(true);
  });

  it('returns false for non-network codes', () => {
    expect(isNetworkError('P101')).toBe(false);
    expect(isNetworkError('A501')).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});

describe('isValidationError', () => {
  it('returns true for V4xx codes', () => {
    expect(isValidationError('V400')).toBe(true);
    expect(isValidationError('V401')).toBe(true);
    expect(isValidationError('V402')).toBe(true);
    expect(isValidationError('V403')).toBe(true);
    expect(isValidationError('V499')).toBe(true);
  });

  it('returns false for non-validation codes', () => {
    expect(isValidationError('P101')).toBe(false);
    expect(isValidationError('A501')).toBe(false);
    expect(isValidationError(undefined)).toBe(false);
  });
});

describe('getErrorCategory', () => {
  it('returns correct category for error codes', () => {
    expect(getErrorCategory('P101')).toBe('P1');
    expect(getErrorCategory('R201')).toBe('R2');
    expect(getErrorCategory('N301')).toBe('N3');
    expect(getErrorCategory('V401')).toBe('V4');
    expect(getErrorCategory('A501')).toBe('A5');
    expect(getErrorCategory('S601')).toBe('S6');
  });

  it('returns undefined for unrecognized codes', () => {
    expect(getErrorCategory('UNKNOWN')).toBeUndefined();
    expect(getErrorCategory('X999')).toBeUndefined();
  });
});

describe('getErrorSeverity', () => {
  it('returns correct severity for known codes', () => {
    expect(getErrorSeverity('P101')).toBe('warning');
    expect(getErrorSeverity('R201')).toBe('error');
    expect(getErrorSeverity('A502')).toBe('warning');
  });

  it('returns error for unknown codes', () => {
    expect(getErrorSeverity('UNKNOWN')).toBe('error');
    expect(getErrorSeverity(undefined)).toBe('error');
  });
});

describe('isRecoverableError', () => {
  it('returns correct recoverability for known codes', () => {
    expect(isRecoverableError('P101')).toBe(false); // Capability unavailable - not recoverable
    expect(isRecoverableError('R201')).toBe(true); // Timeout - recoverable
    expect(isRecoverableError('A501')).toBe(false); // Insufficient permission - not recoverable
    expect(isRecoverableError('A502')).toBe(true); // Session expired - recoverable
  });

  it('returns true for unknown codes (assume recoverable)', () => {
    expect(isRecoverableError('UNKNOWN')).toBe(true);
    expect(isRecoverableError(undefined)).toBe(true);
  });
});

describe('getErrorAction', () => {
  it('returns action for known codes', () => {
    expect(getErrorAction('P101')).toBe('Install required package');
    expect(getErrorAction('R201')).toBe('Try again or check network');
    expect(getErrorAction('A502')).toBe('Please log in again');
  });

  it('returns category action for unknown codes in known categories', () => {
    expect(getErrorAction('P199')).toBeUndefined(); // P1 fallback has no action
    expect(getErrorAction('R299')).toBe('Try reconnecting');
  });

  it('returns undefined for unknown codes', () => {
    expect(getErrorAction('UNKNOWN')).toBeUndefined();
    expect(getErrorAction(undefined)).toBeUndefined();
  });
});
