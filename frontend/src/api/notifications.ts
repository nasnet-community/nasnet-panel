import { apiRequest } from './http';
import type { SystemCredentials } from './system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  /** RFC 3339 timestamp. */
  createdAt: string;
  read: boolean;
}

export async function fetchNotifications(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<AppNotification[]> {
  const data = await apiRequest<AppNotification[] | null>('/api/notifications', {
    method: 'GET',
    auth: creds,
    cache: 'no-store',
    skipAuthRedirect: true,
    signal,
  });
  return Array.isArray(data) ? data : [];
}

export async function markNotificationRead(creds: SystemCredentials, id: string): Promise<void> {
  await apiRequest<unknown>(`/api/notifications/${encodeURIComponent(id)}/read`, {
    method: 'POST',
    auth: creds,
  });
}

export async function markAllNotificationsRead(creds: SystemCredentials): Promise<void> {
  await apiRequest<unknown>('/api/notifications/read-all', {
    method: 'POST',
    auth: creds,
  });
}
