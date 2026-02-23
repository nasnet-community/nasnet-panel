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
import { useTranslation } from '@nasnet/core/i18n';
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
export function WebhooksPage() {
  const { t } = useTranslation('common');
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
          {t('webhook.backToNotifications')}
        </Button>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <WebhookIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{t('webhook.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('webhook.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <span>💡</span>
          {t('webhook.aboutWebhooks')}
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
          <li>{t('webhook.info1')}</li>
          <li>{t('webhook.info2')}</li>
          <li>{t('webhook.info3')}</li>
          <li>{t('webhook.info4')}</li>
          <li>{t('webhook.info5')}</li>
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
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
        <p className="text-sm text-warning-foreground">
          <span className="font-semibold">🔒 {t('webhook.securityNoteTitle')}</span> {t('webhook.securityNoteText')}
        </p>
      </div>
    </div>
  );
}
