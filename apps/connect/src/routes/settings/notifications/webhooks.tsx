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
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/settings/notifications' })}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('webhook.backToNotifications')}
        </Button>

        <div className="flex items-start gap-4">
          <div className="bg-primary/10 rounded-lg p-3">
            <WebhookIcon className="text-primary h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{t('webhook.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('webhook.description')}</p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-muted/50 space-y-2 rounded-lg border p-4">
        <h3 className="flex items-center gap-2 font-semibold">
          <span>💡</span>
          {t('webhook.aboutWebhooks')}
        </h3>
        <ul className="text-muted-foreground ml-6 list-disc space-y-1 text-sm">
          <li>{t('webhook.info1')}</li>
          <li>{t('webhook.info2')}</li>
          <li>{t('webhook.info3')}</li>
          <li>{t('webhook.info4')}</li>
          <li>{t('webhook.info5')}</li>
        </ul>
      </div>

      {/* Webhook Configuration Form */}
      <div className="bg-card rounded-lg border p-6">
        <WebhookConfigForm
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>

      {/* Security Note */}
      <div className="bg-warning/10 border-warning/30 rounded-lg border p-4">
        <p className="text-warning-foreground text-sm">
          <span className="font-semibold">🔒 {t('webhook.securityNoteTitle')}</span>{' '}
          {t('webhook.securityNoteText')}
        </p>
      </div>
    </div>
  );
}
