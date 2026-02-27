# Alerts System

The alerts system provides rule-based notifications for router and service events. Users define conditions, choose channels for delivery, configure quiet hours, and receive in-app or external notifications when conditions trigger.

**Key files:**
- `libs/features/alerts/src/components/` — all UI components
- `libs/features/alerts/src/hooks/` — alert-specific hooks
- `libs/features/alerts/src/schemas/` — Zod validation schemas
- `libs/state/stores/src/alert-notification.store.ts` — in-app notification queue
- `libs/state/stores/src/alert-rule-template-ui.store.ts` — template browser UI state
- `libs/api-client/queries/src/alerts/` — GraphQL hooks

**Cross-references:**
- See `../data-fetching/graphql-hooks.md` for subscription patterns
- See `../state-management/zustand-stores.md` for store patterns

---

## Alert Rules

An alert rule defines:
- **Trigger condition** — metric, operator, threshold (e.g., CPU > 80%)
- **Severity** — CRITICAL, WARNING, or INFO
- **Channels** — where notifications are sent
- **Enabled flag** — pause without deleting

### AlertRuleForm Component

`libs/features/alerts/src/components/AlertRuleForm.tsx`

Used for both create and edit workflows:

```typescript
interface AlertRuleFormProps {
  initialData?: Partial<AlertRuleFormData>;
  ruleId?: string;       // If provided, edits existing rule
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

The form uses React Hook Form + Zod (`alertRuleFormSchema` from `schemas/alert-rule.schema.ts`). Fields include:
- Condition metric (CPU, memory, link state, etc.)
- Operator (greater than, less than, equals, etc.)
- Threshold value
- Severity selector (CRITICAL/WARNING/INFO with color indicators)
- Channel checkboxes (multi-select)
- Enabled toggle

Mutation hooks used internally:
- `useCreateAlertRule()` for new rules
- `useUpdateAlertRule()` for edits

Submit button is disabled when `!isDirty` (no changes from initial data).

---

## Notification Channels

### Supported Channels

| Channel | Type | Key Files |
|---------|------|-----------|
| In-App | Push (internal) | `InAppNotificationPreferences.tsx` |
| Email | HTTP | `EmailChannelFormDesktop.tsx`, `EmailChannelFormMobile.tsx` |
| Webhook | HTTP | `WebhookConfigFormDesktop.tsx`, `WebhookConfigFormMobile.tsx` |
| Ntfy | Push | `ChannelForms/NtfyChannelFormDesktop.tsx`, `NtfyChannelFormMobile.tsx` |
| Pushover | Push (external) | configured via webhook |
| Telegram | Push (external) | configured via webhook |

All channel forms follow the platform presenter pattern — Desktop and Mobile variants render from a shared headless hook.

### Email Channel Form

`libs/features/alerts/src/components/EmailChannelFormDesktop.tsx`

SMTP configuration fields:
- Host / Port
- Username / Password (sensitive)
- TLS mode (none/starttls/tls)
- From address
- To addresses (comma-separated or multi-value)
- Subject template

### Webhook Channel Form

`libs/features/alerts/src/components/WebhookConfigFormDesktop.tsx`

Fields:
- URL (required, validated as HTTPS)
- HTTP method (POST/GET/PUT)
- Custom headers (key-value pairs)
- Payload template (Handlebars-style `{{severity}}`, `{{message}}`)
- Secret for HMAC signing (optional)

### Ntfy Channel Form

`libs/features/alerts/src/components/ChannelForms/NtfyChannelFormDesktop.tsx`

Fields:
- Server URL (default: `https://ntfy.sh`)
- Topic name
- Access token (optional, for private topics)
- Priority (min/low/default/high/max)

---

## In-App Notification Store

`libs/state/stores/src/alert-notification.store.ts`

Manages the in-app notification queue with:
- Real-time notification queue (max 100 items)
- 2-second deduplication window (prevents duplicate toasts from rapid events)
- 24-hour automatic expiry
- Unread count tracking
- User settings persistence (only settings are persisted, not the queue itself)

### State Structure

```typescript
interface AlertNotificationState {
  notifications: InAppNotification[];  // In-memory, max 100
  unreadCount: number;                 // Derived
  settings: NotificationSettings;     // Persisted to localStorage
}

interface InAppNotification {
  id: string;
  alertId: string;        // Backend alert ID (used for dedup)
  title: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  deviceId?: string;
  ruleId?: string;
  read: boolean;
  receivedAt: string;     // ISO timestamp
}

interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  severityFilter: 'CRITICAL' | 'WARNING' | 'INFO' | 'ALL';
  autoDismissTiming: number;  // ms, 0 = no auto-dismiss
}
```

### Usage

```typescript
import {
  useAlertNotificationStore,
  useNotifications,
  useUnreadCount,
} from '@nasnet/state/stores';

// Add a new notification (called from GraphQL subscription)
const { addNotification } = useAlertNotificationStore();
addNotification({
  alertId: 'alert-123',
  title: 'High CPU',
  message: 'CPU usage exceeded 90% for 5 minutes',
  severity: 'WARNING',
  deviceId: 'router-1',
});

// Read notifications
const notifications = useNotifications();
const unreadCount = useUnreadCount();

// Actions
const { markAsRead, markAllRead, clearNotification, clearAll, updateSettings } =
  useAlertNotificationStore();
```

### Selector Hooks

```typescript
// Optimized selectors (avoid re-render unless specific data changes)
const notifications = useNotifications();
const unread = useUnreadNotifications();
const count = useUnreadCount();
const settings = useNotificationSettings();
const criticals = useNotificationsBySeverity('CRITICAL');
const routerNotifs = useNotificationsByDevice('router-1');
```

---

## Alert List

`libs/features/alerts/src/components/AlertList.tsx`

Displays the notification history list. Typically shown in a dropdown or sidebar panel triggered by the bell icon in `AppHeader`.

Features:
- Groups notifications by time (Today, Yesterday, Older)
- Shows unread indicator dot
- Click to mark as read
- Clear all button
- Empty state illustration

---

## Alert Badge

`libs/features/alerts/src/components/AlertBadge.tsx`

Severity badge component used inline next to resource names:

```typescript
interface AlertBadgeProps {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  count?: number;  // Show a count badge
}
```

Used in resource lists to indicate which resources have active alerts.

### QueuedAlertBadge

`libs/features/alerts/src/components/QueuedAlertBadge.tsx`

Shows a count badge for alerts in the quiet-hours queue (alerts that were suppressed and will fire when quiet hours end).

---

## Quiet Hours

The quiet hours system suppresses notifications during configured time windows (e.g., nights/weekends).

### QuietHoursConfig Components

Located in `libs/features/alerts/src/components/QuietHoursConfig/`:

| File | Purpose |
|------|---------|
| `QuietHoursConfig.tsx` | Root component (platform selector) |
| `QuietHoursConfig.Desktop.tsx` | Desktop layout |
| `QuietHoursConfig.Mobile.tsx` | Mobile layout |
| `TimeRangeInput.tsx` | Start/end time picker |
| `DayOfWeekSelector.tsx` | Day checkboxes (Mon-Sun) |
| `TimezoneSelector.tsx` | IANA timezone picker |
| `useQuietHoursConfig.ts` | Shared headless logic |
| `types.ts` | QuietHoursConfig type definitions |

### Configuration Structure

```typescript
interface QuietHoursConfig {
  enabled: boolean;
  startTime: string;    // "HH:mm" in 24h format
  endTime: string;      // "HH:mm" in 24h format
  days: DayOfWeek[];    // ['MON', 'TUE', ...], empty = all days
  timezone: string;     // IANA tz string, e.g., 'America/New_York'
}
```

When quiet hours are active, the backend queues triggered alerts. When quiet hours end, queued alerts are sent. The `QueuedAlertBadge` shows the count of queued alerts.

---

## Alert Templates

Alert templates allow saving and sharing pre-configured alert rule sets.

Components in `libs/features/alerts/src/components/alert-templates/`:

| Component | Purpose |
|-----------|---------|
| `AlertTemplateBrowser.tsx` | Browse available templates (platform selector) |
| `AlertTemplateBrowserDesktop.tsx` | Desktop layout with sidebar |
| `AlertTemplateBrowserMobile.tsx` | Mobile list view |
| `AlertTemplateBrowserNew.tsx` | New template creation flow |
| `AlertTemplateDetailPanel.tsx` | Template detail view |
| `AlertTemplateApplyDialog.tsx` | Confirm before applying template |
| `AlertTemplateVariableInputForm.tsx` | Fill in template variables |
| `ExportTemplateDialog.tsx` | Export current rules as template |

### Template Application Flow

1. User opens template browser
2. Selects a template → `AlertTemplateDetailPanel` shows preview
3. Clicks "Apply" → `AlertTemplateApplyDialog` shows confirmation
4. If template has variables → `AlertTemplateVariableInputForm` collects values
5. Template applied via GraphQL mutation
6. New alert rules created with variable values substituted

### Template UI Store

`libs/state/stores/src/alert-rule-template-ui.store.ts` manages browser state:

```typescript
// Track which template is selected in the browser
const { selectedTemplateId, setSelectedTemplate } = useAlertRuleTemplateUIStore();
```

---

## Notification Preferences

`libs/features/alerts/src/components/InAppNotificationPreferences.tsx`

A settings panel for per-user notification preferences:
- Enable/disable in-app notifications
- Minimum severity filter (e.g., only CRITICAL)
- Auto-dismiss timing
- Sound toggle

Updates the `settings` slice in `useAlertNotificationStore` (persisted to localStorage).

---

## GraphQL Integration

Key query hooks from `libs/api-client/queries/src/alerts/`:

```typescript
// Alert rules
const { rules, loading } = useAlertRules(routerId);
const { createRule } = useCreateAlertRule();
const { updateRule } = useUpdateAlertRule();
const { deleteRule } = useDeleteAlertRule();

// Notification history
const { notifications, loading } = useAlertNotifications(routerId);

// Real-time alert subscription
useAlertSubscription(routerId, {
  onAlert: (alert) => {
    addNotification({ ...alert });  // Push to in-app store
  },
});

// Channel configuration
const { channels } = useAlertChannels(routerId);
const { createChannel } = useCreateAlertChannel();
const { testChannel } = useTestAlertChannel();  // Send test notification

// Quiet hours
const { quietHours } = useQuietHours(routerId);
const { updateQuietHours } = useUpdateQuietHours();
```
