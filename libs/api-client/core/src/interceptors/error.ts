/**
 * Error Interceptor
 * Transforms API errors into user-friendly messages
 */

import { AxiosError } from 'axios';
import { ApiError } from '../types';

/**
 * Maps HTTP status codes to user-friendly error messages
 * Avoids technical jargon and provides actionable guidance
 *
 * @param error Axios error object
 * @returns User-friendly error message
 */
function getErrorMessage(error: AxiosError): string {
  // Network error (no response from server)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. The server took too long to respond.';
    }
    if (error.message === 'Network Error') {
      return 'Network error. Check your connection.';
    }
    return 'Network error. Check your internet connection.';
  }

  // HTTP status code errors
  const status = error.response.status;

  switch (status) {
    case 400:
      return 'Bad request. Please check your input.';
    case 401:
      return 'Authentication failed. Check your credentials.';
    case 403:
      return 'Permission denied. You do not have access.';
    case 404:
      return 'Resource not found.';
    case 409:
      return 'Conflict. The resource may have changed.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again.';
    case 502:
      return 'Gateway error. The server is temporarily unavailable.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Gateway timeout. The server is not responding.';
    default:
      if (status >= 500) {
        return 'Server error. Please try again.';
      }
      if (status >= 400) {
        return 'Request failed. Please try again.';
      }
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Error response interceptor
 * Logs errors for debugging and transforms them into user-friendly messages
 *
 * @param error Axios error
 * @returns Rejected promise with ApiError
 */
export function errorInterceptor(error: AxiosError): Promise<never> {
  const message = getErrorMessage(error);
  const statusCode = error.response?.status;

  // Log error details for debugging
  console.error('[API Error]', {
    url: error.config?.url,
    method: error.config?.method,
    status: statusCode,
    message: error.message,
    timestamp: new Date().toISOString(),
  });

  // Create and reject with ApiError for type-safe handling
  return Promise.reject(
    new ApiError(message, error, statusCode, `HTTP_${statusCode}`)
  );
}
