/**
 * NotificationSettingsPage component
 * Per Task 6.1: Create NotificationSettingsPage for channel configuration
 * Per AC4: User can configure notification channels with test button
 * Per Task #7: Integrated QuietHoursConfig component for global quiet hours
 * Per NAS-18.3: Email form refactored to Platform Presenter pattern
 */
import { useState } from 'react';
import { useNotificationChannels, type ChannelConfig } from '../hooks/useNotificationChannels';
import { usePushoverUsage } from '../hooks/usePushoverUsage';
import { notificationChannels } from '../schemas/alert-rule.schema';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { QuietHoursConfig } from '../components/QuietHoursConfig';
import type { QuietHoursConfigData } from '../components/QuietHoursConfig';
import { EmailChannelForm } from '../components/EmailChannelForm';
import type { EmailConfig } from '../schemas/email-config.schema';

type ChannelType = 'email' | 'telegram' | 'pushover' | 'webhook';

interface ChannelFormProps {
  channel: ChannelType;
  onTest: (config: ChannelConfig) => Promise<void>;
  testing: boolean;
  testResult?: { success: boolean; message: string };
}

/**
 * Telegram Bot Configuration Form
 * Per Task 6.3: Implement Telegram Bot setup with instructions
 * NAS-18.6: Enhanced with multi-chat support via textarea
 */
function TelegramChannelForm({ onTest, testing, testResult }: Omit<ChannelFormProps, 'channel'>) {
  const [botToken, setBotToken] = useState('');
  const [chatIdsText, setChatIdsText] = useState(''); // Store as newline-separated string for textarea

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Transform textarea to array for GraphQL
    const chatIDsArray = chatIdsText
      .split('\n')
      .map(id => id.trim())
      .filter(id => id !== '');

    onTest({
      botToken,
      chatIds: chatIDsArray,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-muted rounded-md text-sm space-y-2">
        <p className="font-medium">Setup Instructions:</p>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Message @BotFather on Telegram and create a new bot with /newbot</li>
          <li>Copy the Bot Token provided by BotFather</li>
          <li>Start a chat with your bot and send any message</li>
          <li>Visit: https://api.telegram.org/bot&lt;YOUR_BOT_TOKEN&gt;/getUpdates</li>
          <li>Find your Chat ID in the JSON response (message.chat.id)</li>
          <li>Repeat for additional chats (groups/channels)</li>
        </ol>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Bot Token *</label>
        <input
          type="text"
          value={botToken}
          onChange={(e) => setBotToken(e.target.value)}
          className="w-full px-3 py-2 border rounded-md font-mono text-sm"
          placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Chat IDs * (one per line)
        </label>
        <textarea
          value={chatIdsText}
          onChange={(e) => setChatIdsText(e.target.value)}
          className="w-full px-3 py-2 border rounded-md font-mono text-sm"
          placeholder="123456789&#10;-987654321&#10;@mychannel"
          rows={4}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Enter one Chat ID per line. Supports user IDs (numeric), group IDs (negative), or channel usernames (@channel).
        </p>
      </div>

      <TestButton testing={testing} testResult={testResult} />
    </form>
  );
}

/**
 * Pushover Configuration Form
 * Per Task 6.5: Implement Pushover configuration
 * Enhanced with usage tracking, device filter, and validation (NAS-18.2)
 */
function PushoverChannelForm({ onTest, testing, testResult }: Omit<ChannelFormProps, 'channel'>) {
  const { t } = useTranslation('alerts');
  const { usage, percentUsed, isNearLimit, isExceeded, loading: usageLoading } = usePushoverUsage();

  const [config, setConfig] = useState<ChannelConfig>({
    userKey: '',
    apiToken: '',
    device: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'userKey':
        if (value && value.length !== 30) {
          newErrors.userKey = t('notifications.pushover.validation_user_key_length');
        } else if (value && !/^[a-zA-Z0-9]+$/.test(value)) {
          newErrors.userKey = t('notifications.pushover.validation_invalid_user');
        } else {
          delete newErrors.userKey;
        }
        break;
      case 'apiToken':
        if (value && value.length !== 30) {
          newErrors.apiToken = t('notifications.pushover.validation_api_token_length');
        } else if (value && !/^[a-zA-Z0-9]+$/.test(value)) {
          newErrors.apiToken = t('notifications.pushover.validation_invalid_token');
        } else {
          delete newErrors.apiToken;
        }
        break;
      case 'device':
        if (value && value.length > 25) {
          newErrors.device = 'Device name too long (max 25 characters)';
        } else if (value && !/^[a-zA-Z0-9_-]*$/.test(value)) {
          newErrors.device = t('notifications.pushover.validation_device_format');
        } else {
          delete newErrors.device;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (field: string, value: string) => {
    setConfig({ ...config, [field]: value });
    validateField(field, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length === 0) {
      onTest(config);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-muted rounded-md text-sm space-y-2">
        <p className="font-medium">Setup Instructions:</p>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Sign up at pushover.net and install the mobile app</li>
          <li>Copy your User Key from the dashboard</li>
          <li>Create an API Token for NasNetConnect</li>
        </ol>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('notifications.pushover.user_key')} *
        </label>
        <input
          type="text"
          value={config.userKey}
          onChange={(e) => handleChange('userKey', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md font-mono text-sm ${
            errors.userKey ? 'border-red-500' : ''
          }`}
          placeholder={t('notifications.pushover.user_key_placeholder')}
          required
          maxLength={30}
        />
        {errors.userKey && (
          <p className="text-red-500 text-sm mt-1">{errors.userKey}</p>
        )}
        <p className="text-muted-foreground text-xs mt-1">
          {t('notifications.pushover.user_key_help')}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('notifications.pushover.api_token')} *
        </label>
        <input
          type="text"
          value={config.apiToken}
          onChange={(e) => handleChange('apiToken', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md font-mono text-sm ${
            errors.apiToken ? 'border-red-500' : ''
          }`}
          placeholder={t('notifications.pushover.api_token_placeholder')}
          required
          maxLength={30}
        />
        {errors.apiToken && (
          <p className="text-red-500 text-sm mt-1">{errors.apiToken}</p>
        )}
        <p className="text-muted-foreground text-xs mt-1">
          {t('notifications.pushover.api_token_help')}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('notifications.pushover.device')}
        </label>
        <input
          type="text"
          value={config.device || ''}
          onChange={(e) => handleChange('device', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md ${
            errors.device ? 'border-red-500' : ''
          }`}
          placeholder={t('notifications.pushover.device_placeholder')}
          maxLength={25}
        />
        {errors.device && (
          <p className="text-red-500 text-sm mt-1">{errors.device}</p>
        )}
        <p className="text-muted-foreground text-xs mt-1">
          {t('notifications.pushover.device_help')}
        </p>
      </div>

      {/* Usage Display Section */}
      {usage && !usageLoading && (
        <div className="space-y-2 rounded-md border p-4 bg-card">
          <h4 className="text-sm font-medium">{t('notifications.pushover.usage_title')}</h4>

          {/* Progress Bar */}
          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isExceeded
                  ? 'bg-red-500'
                  : isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          {/* Usage Stats */}
          <div className="flex justify-between text-sm">
            <p className="text-muted-foreground">
              {t('notifications.pushover.usage_remaining', {
                remaining: usage.remaining,
                limit: usage.limit,
              })}
            </p>
            <p className="font-medium">{percentUsed}%</p>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('notifications.pushover.usage_resets', {
              date: format(new Date(usage.resetAt), 'PPP'),
            })}
          </p>

          {/* Warning Alerts */}
          {isExceeded && (
            <div className="p-3 rounded-md bg-red-50 text-red-800 border border-red-200 text-sm">
              <p className="font-medium">⚠️ Limit Exceeded</p>
              <p className="mt-1">
                {t('notifications.pushover.usage_exceeded', {
                  date: format(new Date(usage.resetAt), 'PPP'),
                })}
              </p>
            </div>
          )}

          {isNearLimit && !isExceeded && (
            <div className="p-3 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-sm">
              <p className="font-medium">⚠️ {t('notifications.pushover.usage_warning', { percent: percentUsed })}</p>
            </div>
          )}
        </div>
      )}

      {usageLoading && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          {t('notifications.pushover.usage_loading')}
        </div>
      )}

      <TestButton testing={testing} testResult={testResult} />
    </form>
  );
}

/**
 * Webhook Configuration Card
 * Per NAS-18.4: Link to full webhook configuration page
 * The legacy inline form has been replaced with a dedicated route
 */
function WebhookChannelCard() {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-md text-sm space-y-2">
        <p className="font-medium">✨ Enhanced Webhook Configuration</p>
        <p className="text-muted-foreground">
          Webhook notifications have been upgraded with advanced features:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>HTTPS-only security enforcement</li>
          <li>Template presets for Slack, Discord, Microsoft Teams</li>
          <li>Custom JSON templates with variable substitution</li>
          <li>Multiple authentication methods (Basic, Bearer token)</li>
          <li>Custom headers and HMAC signing</li>
          <li>Advanced retry and timeout configuration</li>
        </ul>
      </div>

      <a
        href="/settings/notifications/webhooks"
        className="block w-full px-4 py-3 bg-primary text-primary-foreground text-center rounded-md hover:bg-primary/90 transition-colors font-medium"
      >
        Configure Webhook →
      </a>

      <p className="text-xs text-muted-foreground text-center">
        Click above to access the full webhook configuration interface
      </p>
    </div>
  );
}

/**
 * Test Button Component
 * Per Task 6.7: Add "Test Notification" button with loading/success/error states
 */
function TestButton({
  testing,
  testResult,
}: {
  testing: boolean;
  testResult?: { success: boolean; message: string };
}) {
  return (
    <div className="space-y-3">
      <button
        type="submit"
        disabled={testing}
        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {testing ? 'Testing...' : 'Test Notification'}
      </button>

      {testResult && (
        <div
          className={`p-3 rounded-md text-sm ${
            testResult.success
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <p className="font-medium">{testResult.success ? '✓ Success' : '✗ Failed'}</p>
          <p className="mt-1">{testResult.message}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Main Notification Settings Page
 * Per Task 6.2: Create channel configuration cards
 */
export function NotificationSettingsPage() {
  const { testChannel, testResults } = useNotificationChannels();
  const [activeChannel, setActiveChannel] = useState<ChannelType>('email');
  const [testing, setTesting] = useState(false);
  const [quietHours, setQuietHours] = useState<Partial<QuietHoursConfigData>>();

  const handleTest = async (channel: ChannelType, config: ChannelConfig) => {
    setTesting(true);
    try {
      await testChannel(channel, config);
    } finally {
      setTesting(false);
    }
  };

  const handleQuietHoursChange = (config: QuietHoursConfigData) => {
    setQuietHours(config);
    // TODO: Persist to backend via GraphQL mutation
    console.log('Quiet hours updated:', config);
  };

  const channels = [
    { type: 'email' as const, label: 'Email (SMTP)', icon: '📧' },
    { type: 'telegram' as const, label: 'Telegram Bot', icon: '💬' },
    { type: 'pushover' as const, label: 'Pushover', icon: '📱' },
    { type: 'webhook' as const, label: 'Webhook', icon: '🔗' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure notification channels and quiet hours for alert delivery
        </p>
      </div>

      {/* Quiet Hours Section */}
      <section>
        <QuietHoursConfig value={quietHours} onChange={handleQuietHoursChange} />
      </section>

      {/* Channel Configuration Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Notification Channels</h2>
        <p className="text-muted-foreground mb-6">
          Configure how you want to receive alerts
        </p>
      </div>

      {/* Channel Tabs */}
      <div className="flex gap-2 border-b">
        {channels.map((channel) => (
          <button
            key={channel.type}
            onClick={() => setActiveChannel(channel.type)}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeChannel === channel.type
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="mr-2">{channel.icon}</span>
            {channel.label}
          </button>
        ))}
      </div>

      {/* Channel Forms */}
      <div className="bg-card border rounded-lg p-6">
        {activeChannel === 'email' && (
          <EmailChannelForm
            onSubmit={async (config: EmailConfig) => {
              // TODO: Call GraphQL mutation to save email config
              console.log('Saving email config:', config);
            }}
            onTest={async (config: EmailConfig) => {
              // Map EmailConfig to ChannelConfig for testing
              await handleTest('email', {
                host: config.host,
                port: config.port,
                username: config.username,
                password: config.password,
                from: config.fromAddress,
                to: config.toAddresses[0] || '', // Use first recipient for legacy test
                useTLS: config.useTLS,
              });
            }}
          />
        )}
        {activeChannel === 'telegram' && (
          <TelegramChannelForm
            onTest={(config) => handleTest('telegram', config)}
            testing={testing}
            testResult={testResults['telegram']}
          />
        )}
        {activeChannel === 'pushover' && (
          <PushoverChannelForm
            onTest={(config) => handleTest('pushover', config)}
            testing={testing}
            testResult={testResults['pushover']}
          />
        )}
        {activeChannel === 'webhook' && <WebhookChannelCard />}
      </div>

      <div className="p-4 bg-muted rounded-md text-sm">
        <p className="font-medium mb-2">💡 Pro Tip:</p>
        <p className="text-muted-foreground">
          In-app notifications are always enabled and don't require configuration. Additional
          channels can be configured here and selected when creating alert rules.
        </p>
      </div>
    </div>
  );
}
