/**
 * NotificationCenter Types
 *
 * Type definitions for the notification center pattern component.
 */

import type { InAppNotification, AlertSeverity } from '@nasnet/state/stores';

/**
 * Severity filter option (includes 'ALL' option)
 */
export type SeverityFilterOption = AlertSeverity | 'ALL';

/**
 * Props for NotificationCenter component
 */
export interface NotificationCenterProps {
  /** Whether the notification center is open */
  open: boolean;

  /** Callback when the notification center should close */
  onClose: () => void;

  /** Optional className for customization */
  className?: string;
}

/**
 * Props for NotificationItem component
 */
export interface NotificationItemProps {
  /** The notification to display */
  notification: InAppNotification;

  /** Callback when the notification is clicked */
  onClick?: (notification: InAppNotification) => void;

  /** Optional className for customization */
  className?: string;
}
