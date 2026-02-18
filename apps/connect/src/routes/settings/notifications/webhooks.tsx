/**
 * Webhook Configuration Route
 * NAS-18.4: Webhook Notifications Feature
 *
 * Provides webhook management UI with create/edit/test functionality.
 * Uses WebhookConfigForm with Platform Presenter pattern (Mobile/Desktop).
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Webhook as WebhookIcon } from 'lucide-react';

import type { Webhook } from '@nasnet/api-client/queries/notifications';
import { WebhookConfigForm } from '@nasnet/features/alerts';
import { Button } from '@nasnet/ui/primitives';

export const Route = createFileRoute('/settings/notifications/webhooks')({
  component: WebhooksPage,
});

/**
 * Webhooks configuration page component.
 *
 * Features:
 * - Create new webhooks with WebhookConfigForm
 * - HTTPS-only URL validation
 * - Multiple authentication methods (NONE, BASIC, BEARER)
 * - Template presets (GENERIC, SLACK, DISCORD, TEAMS, CUSTOM)
 * - Custom headers management
 * - Test webhook functionality
 * - One-time signing secret display
 * - Platform Presenter pattern (auto-detects mobile/desktop)
 */
function WebhooksPage() {
  const navigate = useNavigate();

  const handleSuccess = (webhook: Webhook, signingSecret?: string) => {
    console.log('Webhook created/updated:', webhook);

    if (signingSecret) {
      // The signing secret dialog is shown automatically by WebhookConfigForm
      // This is ONE TIME ONLY - cannot be retrieved later
      console.log('Signing secret was displayed to user');
    }

    // Optional: Navigate back to notification settings or show success toast
    // navigate({ to: '/settings/notifications' });
  };

  const handleError = (error: Error) => {
    console.error('Webhook save failed:', error);
    // Could show error toast here
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/settings/notifications' })}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Notification Settings
        </Button>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <WebhookIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Webhook Configuration</h1>
            <p className="text-muted-foreground mt-2">
              Configure webhook endpoints to receive alert notifications via HTTP POST requests.
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <span>💡</span>
          About Webhooks
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
          <li>Webhooks send alert notifications to your custom HTTP endpoints</li>
          <li>Only HTTPS URLs are allowed for security (HTTP is rejected)</li>
          <li>Choose from preset templates (Slack, Discord, Teams) or create custom JSON</li>
          <li>Optional HMAC signing with secret for request verification</li>
          <li>Test your webhook before saving to verify connectivity</li>
        </ul>
      </div>

      {/* Webhook Configuration Form */}
      <div className="bg-card border rounded-lg p-6">
        <WebhookConfigForm
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>

      {/* Security Note */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-900 dark:text-amber-200">
          <span className="font-semibold">🔒 Security Note:</span> Your signing secret will only be
          shown once after creation. Save it securely - it cannot be retrieved later. You can
          regenerate a new secret by updating the webhook configuration.
        </p>
      </div>
    </div>
  );
}
