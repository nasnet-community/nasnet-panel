/**
 * Notifications Settings Route
 * Parent route for notification configuration pages
 */

import { createFileRoute } from '@tanstack/react-router';
import { NotificationSettingsPage } from '@nasnet/features/alerts';

export const Route = createFileRoute('/settings/notifications')({
  component: NotificationSettingsPage,
});
