/**
 * Hook for managing notification channel settings
 * Per Task 6.8: Implement useNotificationChannels hook
 */
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { useState } from 'react';

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

export interface ChannelConfig {
  // Email config
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  from?: string;
  to?: string;
  useTLS?: boolean;

  // Telegram config
  botToken?: string;
  chatId?: string;       // DEPRECATED: Backward compat - use chatIds
  chatIds?: string[];    // NEW: Multiple chat IDs

  // Pushover config
  userKey?: string;
  apiToken?: string;

  // Webhook config
  url?: string;
  secret?: string;
  headers?: Record<string, string>;
}

/**
 * Hook for testing notification channels
 */
export function useNotificationChannels() {
  const [mutate] = useMutation(TEST_NOTIFICATION_CHANNEL);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const testChannel = async (channel: string, config: ChannelConfig) => {
    try {
      const { data } = await mutate({
        variables: { channel, config },
      });

      const result = {
        success: data?.testNotificationChannel?.success ?? false,
        message: data?.testNotificationChannel?.message ?? 'Test completed',
      };

      setTestResults((prev) => ({ ...prev, [channel]: result }));
      return result;
    } catch (err) {
      const result = {
        success: false,
        message: err instanceof Error ? err.message : 'Test failed',
      };
      setTestResults((prev) => ({ ...prev, [channel]: result }));
      return result;
    }
  };

  return {
    testChannel,
    testResults,
  };
}
