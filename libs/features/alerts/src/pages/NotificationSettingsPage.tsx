/**
 * NotificationSettingsPage component
 * Per Task 6.1: Create NotificationSettingsPage for channel configuration
 * Per AC4: User can configure notification channels with test button
 */
import { useState } from 'react';
import { useNotificationChannels, type ChannelConfig } from '../hooks/useNotificationChannels';
import { notificationChannels } from '../schemas/alert-rule.schema';

type ChannelType = 'email' | 'telegram' | 'pushover' | 'webhook';

interface ChannelFormProps {
  channel: ChannelType;
  onTest: (config: ChannelConfig) => Promise<void>;
  testing: boolean;
  testResult?: { success: boolean; message: string };
}

/**
 * Email SMTP Configuration Form
 * Per Task 6.4: Implement Email SMTP configuration
 */
function EmailChannelForm({ onTest, testing, testResult }: Omit<ChannelFormProps, 'channel'>) {
  const [config, setConfig] = useState<ChannelConfig>({
    host: '',
    port: 587,
    username: '',
    password: '',
    from: '',
    to: '',
    useTLS: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTest(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">SMTP Host *</label>
          <input
            type="text"
            value={config.host}
            onChange={(e) => setConfig({ ...config, host: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="smtp.gmail.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Port *</label>
          <input
            type="number"
            value={config.port}
            onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Username *</label>
          <input
            type="text"
            value={config.username}
            onChange={(e) => setConfig({ ...config, username: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Password *</label>
          <input
            type="password"
            value={config.password}
            onChange={(e) => setConfig({ ...config, password: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">From Address *</label>
          <input
            type="email"
            value={config.from}
            onChange={(e) => setConfig({ ...config, from: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="alerts@example.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">To Address *</label>
          <input
            type="email"
            value={config.to}
            onChange={(e) => setConfig({ ...config, to: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="admin@example.com"
            required
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.useTLS}
            onChange={(e) => setConfig({ ...config, useTLS: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm font-medium">Use TLS (recommended)</span>
        </label>
      </div>

      <TestButton testing={testing} testResult={testResult} />
    </form>
  );
}

/**
 * Telegram Bot Configuration Form
 * Per Task 6.3: Implement Telegram Bot setup with instructions
 */
function TelegramChannelForm({ onTest, testing, testResult }: Omit<ChannelFormProps, 'channel'>) {
  const [config, setConfig] = useState<ChannelConfig>({
    botToken: '',
    chatId: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTest(config);
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
        </ol>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Bot Token *</label>
        <input
          type="text"
          value={config.botToken}
          onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
          className="w-full px-3 py-2 border rounded-md font-mono text-sm"
          placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Chat ID *</label>
        <input
          type="text"
          value={config.chatId}
          onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
          className="w-full px-3 py-2 border rounded-md font-mono"
          placeholder="123456789"
          required
        />
      </div>

      <TestButton testing={testing} testResult={testResult} />
    </form>
  );
}

/**
 * Pushover Configuration Form
 * Per Task 6.5: Implement Pushover configuration
 */
function PushoverChannelForm({ onTest, testing, testResult }: Omit<ChannelFormProps, 'channel'>) {
  const [config, setConfig] = useState<ChannelConfig>({
    userKey: '',
    apiToken: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTest(config);
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
        <label className="block text-sm font-medium mb-2">User Key *</label>
        <input
          type="text"
          value={config.userKey}
          onChange={(e) => setConfig({ ...config, userKey: e.target.value })}
          className="w-full px-3 py-2 border rounded-md font-mono text-sm"
          placeholder="uxxxxxxxxxxxxxxxxxxxxxxxx"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">API Token *</label>
        <input
          type="text"
          value={config.apiToken}
          onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
          className="w-full px-3 py-2 border rounded-md font-mono text-sm"
          placeholder="axxxxxxxxxxxxxxxxxxxxxxxx"
          required
        />
      </div>

      <TestButton testing={testing} testResult={testResult} />
    </form>
  );
}

/**
 * Webhook Configuration Form
 * Per Task 6.6: Implement Webhook URL configuration
 */
function WebhookChannelForm({ onTest, testing, testResult }: Omit<ChannelFormProps, 'channel'>) {
  const [config, setConfig] = useState<ChannelConfig>({
    url: '',
    secret: '',
    headers: {},
  });

  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTest(config);
  };

  const addHeader = () => {
    if (headerKey && headerValue) {
      setConfig({
        ...config,
        headers: { ...config.headers, [headerKey]: headerValue },
      });
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const removeHeader = (key: string) => {
    const { [key]: removed, ...rest } = config.headers || {};
    setConfig({ ...config, headers: rest });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Webhook URL *</label>
        <input
          type="url"
          value={config.url}
          onChange={(e) => setConfig({ ...config, url: e.target.value })}
          className="w-full px-3 py-2 border rounded-md font-mono text-sm"
          placeholder="https://your-server.com/webhooks/alerts"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Secret (for HMAC signing)</label>
        <input
          type="password"
          value={config.secret}
          onChange={(e) => setConfig({ ...config, secret: e.target.value })}
          className="w-full px-3 py-2 border rounded-md font-mono"
          placeholder="Optional secret for request signing"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Custom Headers</label>
        <div className="space-y-2">
          {Object.entries(config.headers || {}).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded text-sm">
                {key}: {value}
              </code>
              <button
                type="button"
                onClick={() => removeHeader(key)}
                className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-md"
              >
                Remove
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={headerKey}
              onChange={(e) => setHeaderKey(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
              placeholder="Header name"
            />
            <input
              type="text"
              value={headerValue}
              onChange={(e) => setHeaderValue(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
              placeholder="Header value"
            />
            <button
              type="button"
              onClick={addHeader}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <TestButton testing={testing} testResult={testResult} />
    </form>
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

  const handleTest = async (channel: ChannelType, config: ChannelConfig) => {
    setTesting(true);
    try {
      await testChannel(channel, config);
    } finally {
      setTesting(false);
    }
  };

  const channels = [
    { type: 'email' as const, label: 'Email (SMTP)', icon: '📧' },
    { type: 'telegram' as const, label: 'Telegram Bot', icon: '💬' },
    { type: 'pushover' as const, label: 'Pushover', icon: '📱' },
    { type: 'webhook' as const, label: 'Webhook', icon: '🔗' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure notification channels for alert delivery
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
            onTest={(config) => handleTest('email', config)}
            testing={testing}
            testResult={testResults['email']}
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
        {activeChannel === 'webhook' && (
          <WebhookChannelForm
            onTest={(config) => handleTest('webhook', config)}
            testing={testing}
            testResult={testResults['webhook']}
          />
        )}
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
