/**
 * Retry Interceptor
 * Implements exponential backoff retry strategy for transient failures
 * Updates connection state during retries (Epic 0.1, Story 0-1-7)
 */
import { AxiosError } from 'axios';
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
export declare function retryInterceptor(error: AxiosError): Promise<never | unknown>;
//# sourceMappingURL=retry.d.ts.map
