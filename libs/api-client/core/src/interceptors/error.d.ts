/**
 * Error Interceptor
 * Transforms API errors into user-friendly messages
 */
import { AxiosError } from 'axios';
/**
 * Error response interceptor
 * Logs errors for debugging and transforms them into user-friendly messages
 *
 * @param error Axios error
 * @returns Rejected promise with ApiError
 */
export declare function errorInterceptor(error: AxiosError): Promise<never>;
//# sourceMappingURL=error.d.ts.map