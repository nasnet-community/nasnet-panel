/**
 * Headless useNotificationChannels Hook
 *
 * @description Manages notification channel testing via GraphQL mutations.
 * Provides a reusable interface for testing various notification channels
 * (email, Telegram, Pushover, webhook) with memoized callbacks and cleanup.
 *
 * @module @nasnet/features/alerts/hooks
 */
import { useMutation, gql } from '@apollo/client';
import { useCallback, useEffect, useMemo, useState } from 'react';

const TEST_NOTIFICATION_CHANNEL = gql`
  mutation TestNotificationChannel($channel: String!, $config: JSON!) {
    testNotificationChannel(channel: $channel, config: $config) {
      success
      message
      errors {
        code
        message
      }
    }
  }
`;

/**
 * Channel configuration interface supporting email, Telegram, Pushover, and webhooks
 */
export interface ChannelConfig {
  // Email config
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

  // Telegram config
  /** Telegram bot API token */
  botToken?: string;
  /** Deprecated: Single chat ID for backward compatibility */
  chatId?: string;
  /** Multiple Telegram chat IDs for notifications */
  chatIds?: string[];

  // Pushover config
  /** Pushover user key */
  userKey?: string;
  /** Pushover API token */
  apiToken?: string;
  /** Pushover device identifier */
  device?: string;

  // Webhook config
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
export function useNotificationChannels(): UseNotificationChannelsReturn {
  const [mutate] = useMutation<any, any>(TEST_NOTIFICATION_CHANNEL);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  /**
   * Test a notification channel
   * Sends a test message using the provided channel configuration
   */
  const testChannel = useCallback(
    async (channel: string, config: ChannelConfig): Promise<TestResult> => {
      try {
        const { data } = await mutate({
          variables: { channel, config },
        });

        const result: TestResult = {
          success: data?.testNotificationChannel?.success ?? false,
          message: data?.testNotificationChannel?.message ?? 'Test completed',
        };

        setTestResults((prev) => ({ ...prev, [channel]: result }));
        return result;
      } catch (err) {
        const result: TestResult = {
          success: false,
          message: err instanceof Error ? err.message : 'Test failed',
        };
        setTestResults((prev) => ({ ...prev, [channel]: result }));
        return result;
      }
    },
    [mutate]
  );

  /**
   * Cleanup on unmount: clear all test results
   */
  useEffect(() => {
    return () => {
      setTestResults({});
    };
  }, []);

  /**
   * Memoize return object for stable reference
   */
  const returnValue = useMemo<UseNotificationChannelsReturn>(
    () => ({
      testChannel,
      testResults,
    }),
    [testChannel, testResults]
  );

  return returnValue;
}
