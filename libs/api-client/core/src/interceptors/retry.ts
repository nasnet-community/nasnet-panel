/**
 * Retry Interceptor
 * Implements exponential backoff retry strategy for transient failures
 * Updates connection state during retries (Epic 0.1, Story 0-1-7)
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useConnectionStore } from '@nasnet/state/stores';

/**
 * Extended request config with retry tracking
 */
interface RetryableConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
}

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000; // 1 second base delay

/**
 * Sleep utility for async delays
 * @param ms Milliseconds to sleep
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determines if an error is retryable
 * Only retries on transient failures (5xx errors and network errors)
 * 4xx errors are permanent failures and should not be retried
 *
 * @param error Axios error
 * @returns true if error is retryable
 */
function isRetryableError(error: AxiosError): boolean {
  // Retry on network errors (no response)
  if (!error.response) {
    return true;
  }

  // Retry on 5xx server errors
  const status = error.response.status;
  return status >= 500;
}

/**
 * Calculates exponential backoff delay
 * Formula: 2^retryCount * INITIAL_DELAY_MS
 * Example: retry 1 = 2s, retry 2 = 4s, retry 3 = 8s
 *
 * @param retryCount The retry attempt number (1-indexed)
 * @returns Delay in milliseconds
 */
function getRetryDelay(retryCount: number): number {
  return Math.pow(2, retryCount) * INITIAL_DELAY_MS;
}

/**
 * Error response interceptor for retry logic
 * Implements exponential backoff for transient failures
 * - Max 3 retries
 * - Only retries 5xx and network errors
 * - Skips retries for 4xx errors (permanent failures)
 * - Updates connection state during retries (Epic 0.1, Story 0-1-7)
 *
 * @param error Axios error
 * @returns Response promise or rejected error
 */
export async function retryInterceptor(error: AxiosError): Promise<never | unknown> {
  const config = error.config as RetryableConfig | undefined;

  // Cannot retry if no config is available
  if (!config) {
    return Promise.reject(error);
  }

  // Initialize retry count if not set
  if (!config.retryCount) {
    config.retryCount = 0;
  }

  // Check if we've exceeded max retries
  if (config.retryCount >= MAX_RETRIES) {
    // All retries exhausted - set connection to disconnected
    const { setDisconnected } = useConnectionStore.getState();
    setDisconnected();
    return Promise.reject(error);
  }

  // Check if this error is retryable
  if (!isRetryableError(error)) {
    return Promise.reject(error);
  }

  // Increment retry count
  config.retryCount++;

  // Set connection state to reconnecting on first retry
  if (config.retryCount === 1) {
    const { setReconnecting } = useConnectionStore.getState();
    setReconnecting();
  }

  // Calculate backoff delay
  const delay = getRetryDelay(config.retryCount);

  // Log retry attempt
  console.debug('[API Retry]', {
    url: config.url,
    attempt: config.retryCount,
    delay: `${delay}ms`,
    status: error.response?.status,
  });

  // Wait before retrying
  await sleep(delay);

  // Retry the request - extract AxiosRequestConfig from RetryableConfig
  const response = await axios.request(config);

  // Successful retry - set connection back to connected
  const { setConnected } = useConnectionStore.getState();
  setConnected();

  return response;
}
