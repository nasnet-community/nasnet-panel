/**
 * Channel configuration interface supporting email, Telegram, Pushover, and webhooks
 */
export interface ChannelConfig {
    /** SMTP server hostname */
    host?: string;
    /** SMTP server port */
    port?: number;
    /** SMTP authentication username */
    username?: string;
    /** SMTP authentication password */
    password?: string;
    /** From email address */
    from?: string;
    /** Recipient email address */
    to?: string;
    /** Use TLS for SMTP connection */
    useTLS?: boolean;
    /** Telegram bot API token */
    botToken?: string;
    /** Deprecated: Single chat ID for backward compatibility */
    chatId?: string;
    /** Multiple Telegram chat IDs for notifications */
    chatIds?: string[];
    /** Pushover user key */
    userKey?: string;
    /** Pushover API token */
    apiToken?: string;
    /** Pushover device identifier */
    device?: string;
    /** Webhook endpoint URL */
    url?: string;
    /** Webhook signing secret */
    secret?: string;
    /** Custom HTTP headers for webhook */
    headers?: Record<string, string>;
}
/**
 * Test result object returned after channel test
 */
export interface TestResult {
    /** Whether the test was successful */
    success: boolean;
    /** Human-readable message describing the result */
    message: string;
}
/**
 * Return value from useNotificationChannels hook
 */
export interface UseNotificationChannelsReturn {
    /** Test a notification channel and return result */
    testChannel: (channel: string, config: ChannelConfig) => Promise<TestResult>;
    /** Stored test results keyed by channel name */
    testResults: Record<string, TestResult>;
}
/**
 * Headless hook for testing notification channels
 *
 * @example
 * ```tsx
 * const { testChannel, testResults } = useNotificationChannels();
 *
 * const handleTest = async () => {
 *   const result = await testChannel('email', {
 *     host: 'smtp.example.com',
 *     port: 587,
 *     username: 'user@example.com',
 *     password: 'password',
 *     from: 'user@example.com',
 *     to: 'recipient@example.com',
 *     useTLS: true,
 *   });
 *   // result: { success: true, message: '...' }
 * };
 * ```
 */
export declare function useNotificationChannels(): UseNotificationChannelsReturn;
//# sourceMappingURL=useNotificationChannels.d.ts.map