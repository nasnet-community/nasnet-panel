# Feature Module: Alerts (`libs/features/alerts`)

## 1. Overview

The `@nasnet/features/alerts` library is a Layer 3 domain feature module (NAS-18) that provides the
complete frontend alert system for NasNetConnect. It covers:

- **Alert rules** — create, edit, delete, enable/disable rules that trigger on router events.
- **Alert notifications** — real-time delivery via GraphQL subscriptions, in-app badge, toast
  notifications, and sound.
- **Notification channels** — Email (SMTP), Telegram Bot, Pushover, Webhook (via a dedicated webhook
  configuration page), Ntfy.sh, and In-App.
- **Quiet hours** — time-windowed suppression of non-critical alerts with day-of-week and timezone
  selectors.
- **Alert templates** — a browseable gallery of pre-built alert rule templates (built-in and custom)
  with variable substitution, apply flow, import/export, and custom template persistence.

The module is kept strictly isolated from other feature modules. It imports only from `@nasnet/ui`,
`@nasnet/core`, `@nasnet/api-client`, and `@nasnet/state`.

### Public import path

```ts
import {
  AlertBadge,
  AlertList,
  AlertRuleForm,
  QuietHoursConfig,
  QueuedAlertBadge,
  NtfyChannelForm,
  EmailChannelForm,
  WebhookConfigForm,
  AlertTemplateBrowser,
  AlertTemplateApplyDialog,
  NotificationSettingsPage,
  alertRuleFormSchema,
  ntfyConfigSchema,
  webhookConfigSchema,
  useAlertNotifications,
  useAlertRules,
  useAlerts,
} from '@nasnet/features/alerts';
```

---

## 2. Directory Tree

```
libs/features/alerts/
├── src/
│   ├── index.ts                              # Public barrel export (200 lines)
│   ├── components/
│   │   ├── AlertBadge.tsx                    # Header notification count badge
│   │   ├── AlertList.tsx                     # Paginated list of alert events
│   │   ├── AlertRuleForm.tsx                 # Full rule creation/edit form
│   │   ├── InAppNotificationPreferences.tsx  # User preferences for in-app notifications
│   │   ├── QueuedAlertBadge.tsx              # Queued / quiet-hours bypass indicator
│   │   ├── EmailChannelForm.tsx              # Dispatcher for email form
│   │   ├── EmailChannelFormDesktop.tsx       # Desktop SMTP config form
│   │   ├── EmailChannelFormMobile.tsx        # Mobile SMTP config form
│   │   ├── WebhookConfigForm.tsx             # Dispatcher for webhook form
│   │   ├── WebhookConfigFormDesktop.tsx      # Desktop webhook form
│   │   ├── WebhookConfigFormMobile.tsx       # Mobile webhook form
│   │   ├── ChannelForms/
│   │   │   ├── NtfyChannelForm.tsx           # Dispatcher for ntfy form
│   │   │   ├── NtfyChannelFormDesktop.tsx    # Desktop ntfy config form
│   │   │   └── NtfyChannelFormMobile.tsx     # Mobile ntfy config form
│   │   ├── QuietHoursConfig/
│   │   │   ├── index.ts
│   │   │   ├── types.ts                      # QuietHoursConfigProps, QuietHoursConfigData, DayOfWeek
│   │   │   ├── QuietHoursConfig.tsx          # Platform dispatcher
│   │   │   ├── QuietHoursConfig.Desktop.tsx  # Desktop 2-column grid layout
│   │   │   ├── QuietHoursConfig.Mobile.tsx   # Mobile single-column layout
│   │   │   ├── DayOfWeekSelector.tsx         # Toggle buttons Mon-Sun
│   │   │   ├── TimeRangeInput.tsx            # HH:MM start/end time inputs
│   │   │   ├── TimezoneSelector.tsx          # IANA timezone combobox
│   │   │   └── useQuietHoursConfig.ts        # Headless logic hook
│   │   └── alert-templates/
│   │       ├── index.ts
│   │       ├── AlertTemplateBrowser.tsx      # Platform-adaptive gallery (NAS-18.12)
│   │       ├── AlertTemplateBrowserNew.tsx   # Alternate new-style browser variant
│   │       ├── AlertTemplateBrowserDesktop.tsx
│   │       ├── AlertTemplateBrowserMobile.tsx
│   │       ├── AlertTemplateDetailPanel.tsx  # Right-side detail panel for selected template
│   │       ├── AlertTemplateVariableInputForm.tsx # Variable value form for apply
│   │       ├── AlertTemplateApplyDialog.tsx  # Apply flow dialog
│   │       ├── SaveTemplateDialog.tsx        # Save current rule as custom template
│   │       ├── ImportTemplateDialog.tsx      # Import JSON template file
│   │       ├── ExportTemplateDialog.tsx      # Download template as JSON
│   │       └── useTemplateBrowser.ts         # Headless hook for browser state
│   ├── hooks/
│   │   ├── useAlerts.ts                      # useAlerts, useAcknowledgeAlert, useUnacknowledgedAlertCount
│   │   ├── useAlertRules.ts                  # CRUD hooks for alert rules
│   │   ├── useAlertRuleTemplates.ts          # Template CRUD + apply/import/export
│   │   ├── useAlertNotifications.ts          # Real-time subscription + store + toast + sound
│   │   ├── useNotificationChannels.ts        # Test and manage channel configurations
│   │   ├── useEmailChannelForm.ts            # RHF headless hook for email form
│   │   ├── useWebhookConfigForm.ts           # RHF headless hook for webhook form
│   │   ├── useNtfyChannelForm.ts             # RHF headless hook for ntfy form
│   │   └── usePushoverUsage.ts              # Pushover monthly message quota tracker
│   ├── pages/
│   │   └── NotificationSettingsPage.tsx      # Full notification configuration page
│   ├── schemas/
│   │   ├── alert-rule.schema.ts              # alertRuleFormSchema, COMMON_EVENT_TYPES, NOTIFICATION_CHANNELS
│   │   ├── alert-rule-template.schema.ts     # alertRuleTemplateSchema, variable types, apply input
│   │   ├── email-config.schema.ts            # emailConfigSchema, SMTP_PORT_PRESETS
│   │   ├── ntfy-config.schema.ts             # ntfyConfigSchema, priority presets
│   │   └── webhook.schema.ts                 # webhookConfigSchema, AUTH_TYPE_OPTIONS, template presets
│   ├── utils/
│   │   └── alert-template-categories.ts     # ALERT_TEMPLATE_CATEGORIES, getCategoryMeta, getAllCategories
│   └── __test-utils__/
│       └── alert-rule-template-fixtures.ts  # Shared test fixtures for template specs
├── test-setup.ts
├── vitest.config.ts
├── tsconfig.json
└── project.json
```

---

## 3. Component Catalogue

### 3.1 Core Alert Components

| Component                      | File                                          | Platform | Purpose                                                                                                                                                                               |
| ------------------------------ | --------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AlertBadge`                   | `components/AlertBadge.tsx`                   | Shared   | Displays count of unacknowledged alerts in the app header. Hides when count is 0; shows "99+" when count exceeds 99. Subscribes via `useUnacknowledgedAlertCount`.                    |
| `AlertList`                    | `components/AlertList.tsx`                    | Shared   | Paginated list of alert events with severity icons, timestamps, acknowledge actions, and "mark all as read"                                                                           |
| `AlertRuleForm`                | `components/AlertRuleForm.tsx`                | Shared   | Full rule creation and edit form (name, eventType, conditions, severity, channels, throttle, quietHours). Built with React Hook Form + `alertRuleFormSchema`.                         |
| `InAppNotificationPreferences` | `components/InAppNotificationPreferences.tsx` | Shared   | Preferences panel for in-app notification settings (enabled, severity filter, sound on/off, auto-dismiss duration)                                                                    |
| `QueuedAlertBadge`             | `components/QueuedAlertBadge.tsx`             | Shared   | Shows either a "Queued until HH:MM" countdown badge (blue) or a "Bypassed quiet hours" badge (amber) for critical alerts during quiet hours. Renders `null` when neither prop is set. |

### 3.2 Email Channel Forms

| Component                 | File                                     | Platform | Purpose                                                                                                         |
| ------------------------- | ---------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `EmailChannelForm`        | `components/EmailChannelForm.tsx`        | Shared   | Platform dispatcher — renders Desktop or Mobile variant                                                         |
| `EmailChannelFormDesktop` | `components/EmailChannelFormDesktop.tsx` | Desktop  | Two-column SMTP config form (host, port, user, pass, TLS, from, to[]); uses `useEmailChannelForm` headless hook |
| `EmailChannelFormMobile`  | `components/EmailChannelFormMobile.tsx`  | Mobile   | Single-column stacked SMTP form with 44px inputs                                                                |

### 3.3 Webhook Config Forms

| Component                  | File                                      | Platform | Purpose                                                                                                                                                                                              |
| -------------------------- | ----------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WebhookConfigForm`        | `components/WebhookConfigForm.tsx`        | Shared   | Dispatcher for webhook configuration form                                                                                                                                                            |
| `WebhookConfigFormDesktop` | `components/WebhookConfigFormDesktop.tsx` | Desktop  | Full webhook form: name, HTTPS URL, auth type (None/Basic/Bearer), template preset (Generic/Slack/Discord/Teams/Custom), custom JSON template, custom headers, HMAC signing secret, timeout, retries |
| `WebhookConfigFormMobile`  | `components/WebhookConfigFormMobile.tsx`  | Mobile   | Simplified mobile webhook form; advanced fields collapsed behind an accordion                                                                                                                        |

### 3.4 Ntfy Channel Forms

| Component                | File                                                 | Platform | Purpose                                                                 |
| ------------------------ | ---------------------------------------------------- | -------- | ----------------------------------------------------------------------- |
| `NtfyChannelForm`        | `components/ChannelForms/NtfyChannelForm.tsx`        | Shared   | Dispatcher for ntfy form                                                |
| `NtfyChannelFormDesktop` | `components/ChannelForms/NtfyChannelFormDesktop.tsx` | Desktop  | Ntfy server URL, topic, optional auth (user/pass), priority (1-5), tags |
| `NtfyChannelFormMobile`  | `components/ChannelForms/NtfyChannelFormMobile.tsx`  | Mobile   | Same fields in single-column mobile layout                              |

### 3.5 Quiet Hours Components

| Component                  | File                                                       | Platform | Purpose                                                                                                 |
| -------------------------- | ---------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- | --------------------- |
| `QuietHoursConfig`         | `components/QuietHoursConfig/QuietHoursConfig.tsx`         | Shared   | Platform dispatcher using `usePlatform()` — selects Desktop or Mobile variant                           |
| `QuietHoursConfig.Desktop` | `components/QuietHoursConfig/QuietHoursConfig.Desktop.tsx` | Desktop  | 2-column grid: start/end time on left, day-of-week and timezone on right; bypass-critical toggle        |
| `QuietHoursConfig.Mobile`  | `components/QuietHoursConfig/QuietHoursConfig.Mobile.tsx`  | Mobile   | Single-column stacked form with 44px touch targets                                                      |
| `DayOfWeekSelector`        | `components/QuietHoursConfig/DayOfWeekSelector.tsx`        | Shared   | 7 toggle buttons (Mon-Sun) using `DayOfWeek` = `0-6` (0 = Sunday). Multiple selections allowed.         |
| `TimeRangeInput`           | `components/QuietHoursConfig/TimeRangeInput.tsx`           | Shared   | Two HH:MM text inputs for startTime and endTime; validates against `TIME_FORMAT_PATTERN = /^([0-1][0-9] | 2[0-3]):[0-5][0-9]$/` |
| `TimezoneSelector`         | `components/QuietHoursConfig/TimezoneSelector.tsx`         | Shared   | Searchable combobox over IANA timezone list (e.g., `America/New_York`)                                  |

`QuietHoursConfig` uses a headless hook `useQuietHoursConfig` for all business logic.

### 3.6 Alert Template Components (NAS-18.12)

| Component                        | File                                                            | Platform | Purpose                                                                                                                                             |
| -------------------------------- | --------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AlertTemplateBrowser`           | `components/alert-templates/AlertTemplateBrowser.tsx`           | Adaptive | Composes Layer 2 `TemplateGallery` with alert-specific data from `useAlertRuleTemplates` query; handles apply mutation with toast feedback          |
| `AlertTemplateBrowserNew`        | `components/alert-templates/AlertTemplateBrowserNew.tsx`        | Adaptive | Alternate newer-style browser variant with updated filtering UI                                                                                     |
| `AlertTemplateBrowserDesktop`    | `components/alert-templates/AlertTemplateBrowserDesktop.tsx`    | Desktop  | Desktop-specific template gallery layout with side-by-side list and detail panel                                                                    |
| `AlertTemplateBrowserMobile`     | `components/alert-templates/AlertTemplateBrowserMobile.tsx`     | Mobile   | Full-screen template list with detail sheet on selection                                                                                            |
| `AlertTemplateDetailPanel`       | `components/alert-templates/AlertTemplateDetailPanel.tsx`       | Shared   | Right-panel showing template name, description, category badge, severity, conditions, variables list, and "Apply" CTA                               |
| `AlertTemplateVariableInputForm` | `components/alert-templates/AlertTemplateVariableInputForm.tsx` | Shared   | Dynamic form generated from template `variables[]`; each variable maps to a typed input (STRING, INTEGER, DURATION, PERCENTAGE)                     |
| `AlertTemplateApplyDialog`       | `components/alert-templates/AlertTemplateApplyDialog.tsx`       | Shared   | Modal dialog that composes `AlertTemplateVariableInputForm`; on submit calls `useApplyAlertRuleTemplate` mutation                                   |
| `SaveTemplateDialog`             | `components/alert-templates/SaveTemplateDialog.tsx`             | Shared   | Dialog to snapshot an existing alert rule as a named custom template; calls `useSaveCustomAlertRuleTemplate`                                        |
| `ImportTemplateDialog`           | `components/alert-templates/ImportTemplateDialog.tsx`           | Shared   | File-upload dialog that accepts a JSON template file; validates against `alertRuleTemplateImportSchema` before calling `useImportAlertRuleTemplate` |
| `ExportTemplateDialog`           | `components/alert-templates/ExportTemplateDialog.tsx`           | Shared   | Download dialog that serializes a template to JSON and triggers a browser download                                                                  |

---

## 4. Desktop / Mobile Variants Summary

| Domain           | Desktop Component             | Mobile Component             | Dispatcher                                     |
| ---------------- | ----------------------------- | ---------------------------- | ---------------------------------------------- |
| Email channel    | `EmailChannelFormDesktop`     | `EmailChannelFormMobile`     | `EmailChannelForm`                             |
| Webhook config   | `WebhookConfigFormDesktop`    | `WebhookConfigFormMobile`    | `WebhookConfigForm`                            |
| Ntfy channel     | `NtfyChannelFormDesktop`      | `NtfyChannelFormMobile`      | `NtfyChannelForm`                              |
| Quiet hours      | `QuietHoursConfig.Desktop`    | `QuietHoursConfig.Mobile`    | `QuietHoursConfig`                             |
| Template browser | `AlertTemplateBrowserDesktop` | `AlertTemplateBrowserMobile` | `AlertTemplateBrowser` (via `TemplateGallery`) |

All dispatchers use `usePlatform()` from `@nasnet/ui/layouts`:

```tsx
// QuietHoursConfig.tsx — canonical example
const platform = usePlatform();
switch (platform) {
  case 'mobile':
    return <QuietHoursConfigMobile {...props} />;
  case 'tablet':
  case 'desktop':
  default:
    return <QuietHoursConfigDesktop {...props} />;
}
```

---

## 5. Notification Channels

The system supports six delivery channels:

| Channel  | Value      | Config Schema                        | Form Component                 | Description                                                                                                  |
| -------- | ---------- | ------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| In-App   | `inapp`    | (Zustand store)                      | `InAppNotificationPreferences` | Always enabled; no external config required. Delivered via subscription + Zustand store + toast.             |
| Email    | `email`    | `emailConfigSchema`                  | `EmailChannelForm`             | SMTP-based email delivery; supports TLS, multiple recipients, preset port configs                            |
| Telegram | `telegram` | Inline in `NotificationSettingsPage` | `TelegramChannelForm` (inline) | Bot token + one or more Chat IDs (numeric user/group or @channel username)                                   |
| Pushover | `pushover` | Inline in `NotificationSettingsPage` | `PushoverChannelForm` (inline) | User Key + API Token + optional device name; shows monthly usage quota bar                                   |
| Webhook  | `webhook`  | `webhookConfigSchema`                | `WebhookConfigForm`            | HTTPS-only; supports Basic/Bearer auth, presets (Slack/Discord/Teams), HMAC signing, custom headers, retries |
| Ntfy     | `ntfy`     | `ntfyConfigSchema`                   | `NtfyChannelForm`              | Push notifications via ntfy.sh (or self-hosted); topic-based routing with priority 1-5                       |

The `NOTIFICATION_CHANNELS` constant in `alert-rule.schema.ts` lists all channels with display
labels and icon identifiers:

```ts
export const NOTIFICATION_CHANNELS = [
  { value: 'inapp', label: 'In-App Notifications', icon: 'Bell' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'telegram', label: 'Telegram', icon: 'MessageCircle' },
  { value: 'pushover', label: 'Pushover', icon: 'Smartphone' },
  { value: 'webhook', label: 'Webhook', icon: 'Webhook' },
] as const;
```

---

## 6. Alert Rule Form and Schema

### 6.1 Main Schema (`schemas/alert-rule.schema.ts`)

```ts
export const alertRuleFormSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  eventType: z.string().min(1), // e.g., 'device.offline', 'interface.down'
  conditions: z.array(alertConditionSchema).min(1).max(10),
  severity: z.enum(['CRITICAL', 'WARNING', 'INFO']),
  channels: z.array(z.string()).min(1).max(5),
  throttle: throttleConfigSchema.optional(),
  quietHours: quietHoursConfigSchema.optional(),
  deviceId: z.string().optional(),
  enabled: z.boolean().default(true),
});
```

### 6.2 Alert Condition Schema

```ts
export const alertConditionSchema = z.object({
  field: z.string().min(1), // field to monitor, e.g., 'cpu_usage'
  operator: z.enum(['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'CONTAINS', 'REGEX']),
  value: z.string().min(1), // comparison value, e.g., '80'
});
```

**Constraints**: min 1, max 10 conditions per rule.

### 6.3 Throttle Config Schema

```ts
export const throttleConfigSchema = z.object({
  maxAlerts: z.number().int().min(1), // max alerts per period
  periodSeconds: z.number().int().min(60), // period minimum 60 seconds
  groupByField: z.string().optional(),
});
```

### 6.4 Quiet Hours Config Schema

```ts
export const quietHoursConfigSchema = z.object({
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM
  timezone: z.string().min(1), // IANA timezone
  bypassCritical: z.boolean().default(true),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1), // 0=Sunday
});
```

### 6.5 Severity Configuration

```ts
export const SEVERITY_CONFIG = {
  CRITICAL: { label: 'Critical', color: 'semantic.error', badgeClass: 'bg-error text-white' },
  WARNING: { label: 'Warning', color: 'semantic.warning', badgeClass: 'bg-warning text-white' },
  INFO: { label: 'Info', color: 'semantic.info', badgeClass: 'bg-info text-white' },
} as const;
```

### 6.6 Common Event Types

`COMMON_EVENT_TYPES` provides autocomplete suggestions for the `eventType` field:

```ts
'device.offline' | 'device.online' | 'device.cpu.high' | 'device.memory.high';
'device.disk.full' | 'interface.down' | 'interface.up' | 'interface.traffic.high';
'vpn.tunnel.down' | 'vpn.tunnel.up' | 'dhcp.lease.exhausted';
'firewall.attack.detected' | 'backup.failed' | 'update.available';
```

### 6.7 Default Alert Rule

```ts
export const defaultAlertRule: Partial<AlertRuleFormData> = {
  name: '',
  description: '',
  eventType: '',
  conditions: [{ field: '', operator: 'EQUALS', value: '' }],
  severity: 'WARNING',
  channels: ['inapp'],
  enabled: true,
};
```

---

## 7. Quiet Hours Configuration

### 7.1 Data Shape

```ts
interface QuietHoursConfigData {
  startTime: string; // "HH:MM" e.g., "22:00"
  endTime: string; // "HH:MM" e.g., "08:00"
  timezone: string; // IANA e.g., "America/New_York"
  bypassCritical: boolean; // true = CRITICAL alerts bypass quiet hours
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
}
```

### 7.2 Component Composition

```
QuietHoursConfig (dispatcher)
  ├── QuietHoursConfig.Desktop
  │     ├── TimeRangeInput (startTime, endTime)
  │     ├── DayOfWeekSelector (0-6 toggle buttons)
  │     ├── TimezoneSelector (IANA combobox)
  │     └── Checkbox (bypassCritical)
  └── QuietHoursConfig.Mobile
        └── (same sub-components, single-column layout)
```

### 7.3 Headless Hook

`useQuietHoursConfig` encapsulates all business logic including:

- Local state management for the form values
- Validation using `quietHoursConfigSchema`
- `onChange` callback propagation to parent
- Day-of-week toggle handlers
- Cross-midnight range validation (if `endTime < startTime`, the window spans midnight)

---

## 8. Alert Template System (NAS-18.12)

### 8.1 Template Categories

Seven categories are defined in `utils/alert-template-categories.ts`:

| Category  | ID          | Description                                       | Icon       | Color  |
| --------- | ----------- | ------------------------------------------------- | ---------- | ------ |
| Network   | `NETWORK`   | Connectivity, device status, interface monitoring | `network`  | Blue   |
| Security  | `SECURITY`  | Firewall events, intrusion detection              | `shield`   | Red    |
| Resources | `RESOURCES` | CPU, memory, disk usage                           | `cpu`      | Orange |
| VPN       | `VPN`       | Tunnel status, connection failures                | `lock`     | Green  |
| DHCP      | `DHCP`      | Pool exhaustion, lease conflicts                  | `server`   | Purple |
| System    | `SYSTEM`    | Updates, backups, configuration changes           | `settings` | Gray   |
| Custom    | `CUSTOM`    | User-created templates                            | `star`     | Amber  |

### 8.2 Template Schema (`schemas/alert-rule-template.schema.ts`)

```ts
const alertRuleTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  category: z.enum(['NETWORK', 'SECURITY', 'RESOURCES', 'VPN', 'DHCP', 'SYSTEM', 'CUSTOM']),
  eventType: z.string().regex(/^[a-z]+\.[a-z_]+$/),
  severity: z.enum(['CRITICAL', 'WARNING', 'INFO']),
  conditions: z.array(alertConditionSchema).min(1),
  channels: z.array(z.string()).min(1).max(5),
  throttle: throttleConfigSchema.optional(),
  variables: z.array(alertRuleTemplateVariableSchema).default([]),
  isBuiltIn: z.boolean().default(false),
  version: z.string().default('1.0.0'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
```

### 8.3 Template Variable Schema

```ts
const alertRuleTemplateVariableSchema = z.object({
  name: z.string().regex(/^[A-Z][A-Z0-9_]*$/, 'UPPER_SNAKE_CASE required'), // e.g., CPU_THRESHOLD
  label: z.string().min(1).max(100),
  type: z.enum(['STRING', 'INTEGER', 'DURATION', 'PERCENTAGE']),
  required: z.boolean().default(true),
  defaultValue: z.string().optional(),
  min: z.number().int().optional(),
  max: z.number().int().optional(),
  unit: z.string().max(20).optional(), // e.g., '%', 'ms', 'seconds'
  description: z.string().max(500).optional(),
});
```

Variable names in condition values use `{{VARIABLE_NAME}}` substitution syntax. The
`extractVariablesFromConditions` helper (in the schema file) scans condition values for `{{...}}`
references and validates they are all defined in the variables array.

### 8.4 Apply Input Schema

```ts
const applyAlertRuleTemplateInputSchema = z.object({
  templateId: z.string().min(1),
  variables: z.record(z.string().regex(/^[A-Z][A-Z0-9_]*/), z.union([z.string(), z.number()])),
  customizations: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      deviceId: z.string().optional(),
      enabled: z.boolean().default(true),
    })
    .optional(),
});
```

### 8.5 Template Apply Flow

```
User clicks "Apply" in AlertTemplateDetailPanel
  └─> AlertTemplateApplyDialog opens
        └─> AlertTemplateVariableInputForm (dynamic form)
              └─> User fills in variable values
                    └─> Submit → useApplyAlertRuleTemplate mutation
                          └─> Apollo GraphQL mutation: applyAlertRuleTemplate
                                └─> Backend creates alert rule with resolved conditions
                                      └─> toast.success("Alert rule created")
                                            └─> onRuleCreated(ruleId) callback
```

### 8.6 Import / Export

**Import**: `ImportTemplateDialog` accepts a JSON file. The content is parsed and validated against
`alertRuleTemplateImportSchema` (which is `alertRuleTemplateSchema` minus `id`, `isBuiltIn`,
`createdAt`, and `updatedAt`). On validation success, `useImportAlertRuleTemplate` mutation is
called.

**Export**: `ExportTemplateDialog` serializes the template to JSON and triggers a browser file
download via the `Blob` + `URL.createObjectURL` pattern.

### 8.7 useTemplateBrowser Hook

`useTemplateBrowser` provides all headless state for the template browser:

```ts
interface UseTemplateBrowserReturn {
  templates: AlertRuleTemplate[];
  loading: boolean;
  filter: TemplateFilter; // { category, search, isBuiltIn? }
  sort: TemplateSort; // { field: TemplateSortField; direction: SortDirection }
  selection: TemplateSelection; // { selectedId, selectedTemplate }
  setFilter: (filter: Partial<TemplateFilter>) => void;
  setSort: (sort: Partial<TemplateSort>) => void;
  selectTemplate: (id: string | null) => void;
  clearSelection: () => void;
}
```

---

## 9. Hooks

### 9.1 `useAlertNotifications`

The central hook that connects the backend alert stream to the UI. Must be mounted once at
app-layout level.

```ts
export function useAlertNotifications(options?: {
  deviceId?: string; // scopes subscription to specific router
  enabled?: boolean; // default true
}): void;
```

**Internal flow:**

1. Subscribes to `alertEvents(deviceId)` via Apollo `useSubscription`.
2. Deduplicates events using a `useRef<Set<string>>(processedAlerts)` — clears to last 100 on
   overflow.
3. Filters by `settings.severityFilter` (CRITICAL > WARNING > INFO hierarchy).
4. Calls `addNotification()` on the Zustand `useAlertNotificationStore`.
5. Calls `playAlertSound(severity, soundEnabled)` — maps severity to `/sounds/alert-{level}.mp3`;
   critical alerts never auto-dismiss.
6. Maps `alert.eventType` to an app route via `eventTypeToRoute` for contextual "View" actions in
   toast.
7. Shows toast: `.error()` for CRITICAL, `.warning()` for WARNING, `.info()` for INFO.

**Auto-dismiss timing:**

| Severity | Duration                               |
| -------- | -------------------------------------- |
| CRITICAL | Never (requires manual acknowledgment) |
| WARNING  | 8,000 ms                               |
| INFO     | 5,000 ms                               |

### 9.2 `useAlertRules`

```ts
export function useAlertRules(): { rules; loading; error };
export function useAlertRule(id: string): { rule; loading; error };
export function useCreateAlertRule(): [createFn, { loading }];
export function useUpdateAlertRule(): [updateFn, { loading }];
export function useDeleteAlertRule(): [deleteFn, { loading }];
```

### 9.3 `useAlerts`

```ts
export function useAlerts(options?): { alerts; loading; error; fetchMore };
export function useAcknowledgeAlert(): [acknowledgeFn, { loading }];
export function useAcknowledgeAlerts(): [acknowledgeAllFn, { loading }];
export function useUnacknowledgedAlertCount(deviceId?: string): number;
```

`useUnacknowledgedAlertCount` is used directly by `AlertBadge` to render the header count.

### 9.4 `useNotificationChannels`

```ts
export type ChannelConfig = Record<string, unknown>;

export function useNotificationChannels(): {
  testChannel: (channel: string, config: ChannelConfig) => Promise<void>;
  testResults: Record<string, { success: boolean; message: string }>;
};
```

Invoked by `NotificationSettingsPage` to power the "Test Notification" buttons on each channel's
config form.

### 9.5 Channel Form Hooks

Each headless hook encapsulates React Hook Form setup, Zod schema binding, and submit handler:

| Hook                   | Schema                | Returns                                               |
| ---------------------- | --------------------- | ----------------------------------------------------- |
| `useEmailChannelForm`  | `emailConfigSchema`   | `{ form, onSubmit, onTest, isSubmitting, isTesting }` |
| `useWebhookConfigForm` | `webhookConfigSchema` | `{ form, onSubmit, isSubmitting }`                    |
| `useNtfyChannelForm`   | `ntfyConfigSchema`    | `{ form, onSubmit, isSubmitting }`                    |

### 9.6 `usePushoverUsage`

Tracks the user's Pushover monthly message quota:

```ts
export function usePushoverUsage(): {
  usage: { used: number; remaining: number; limit: number; resetAt: string } | null;
  percentUsed: number;
  isNearLimit: boolean; // >= 80%
  isExceeded: boolean; // >= 100%
  loading: boolean;
};
```

Displayed in `PushoverChannelForm` (within `NotificationSettingsPage`) as a color-coded progress
bar.

### 9.7 `useAlertRuleTemplates`

Full CRUD suite for templates:

```ts
export function useAlertRuleTemplates(options?): { data; loading; error; refetch };
export function useAlertRuleTemplate(id: string): { data; loading; error };
export function usePreviewAlertRuleTemplate(): [previewFn, { data; loading }];
export function useApplyAlertRuleTemplate(options?): [applyFn, { loading }];
export function useSaveCustomAlertRuleTemplate(): [saveFn, { loading }];
export function useDeleteCustomAlertRuleTemplate(): [deleteFn, { loading }];
export function useImportAlertRuleTemplate(): [importFn, { loading }];
export function useExportAlertRuleTemplate(): [exportFn, { loading }];
```

---

## 10. Pages

### `NotificationSettingsPage`

File: `pages/NotificationSettingsPage.tsx`

The single page export of this module. It provides:

1. **QuietHoursConfig section** — renders the platform-adaptive quiet hours form; persists via
   GraphQL mutation (TODO in current codebase, logged to console).
2. **Notification Channels tab bar** — four tabs: Email, Telegram Bot, Pushover, Webhook.
3. **Channel forms** — each tab mounts the corresponding config form:
   - `EmailChannelForm` — uses `useEmailChannelForm` headless hook with SMTP presets.
   - `TelegramChannelForm` (inline) — bot token + textarea of newline-separated Chat IDs.
   - `PushoverChannelForm` (inline) — user key + API token + optional device; shows
     `usePushoverUsage` quota bar.
   - `WebhookChannelCard` (inline) — links to `/settings/notifications/webhooks` for full webhook
     config.
4. **Test button** — each form has a "Test Notification" button wired to
   `useNotificationChannels().testChannel`.
5. **Pro tip banner** — explains that in-app notifications are always enabled.

```tsx
import { NotificationSettingsPage } from '@nasnet/features/alerts';
// Mount as a lazy-loaded route:
<Route
  path="/settings/notifications"
  element={<NotificationSettingsPage />}
/>;
```

---

## 11. Dispatch Chain Overview

The alert dispatch chain spans backend and frontend:

```
[Alert Engine]           Backend (Go)
  │ - Evaluates rules against events
  │ - Passes matching alerts to throttle queue
  │
[Throttle / Quiet Hours Queue]
  │ - Suppresses alerts exceeding maxAlerts/periodSeconds
  │ - Queues non-critical alerts during quiet hours
  │ - Bypasses quiet hours for CRITICAL severity
  │
[Channel Dispatcher]     Backend
  │ - Routes to: SMTP, Telegram Bot API, Pushover API,
  │              Webhook HTTP, Ntfy HTTP, In-App store
  │
[GraphQL Subscription]   Transport (WebSocket / SSE)
  │  alertEvents(deviceId) subscription
  │
[useAlertNotifications]  Frontend Hook
  │ - Deduplicates events (Set<string> ref)
  │ - Filters by severityFilter setting
  │ - Adds to useAlertNotificationStore (Zustand)
  │ - Plays alert sound
  │ - Shows toast (useToast)
  │
[AlertBadge]             UI — Header
  └─ useUnacknowledgedAlertCount → badge count
     (auto-hides at 0, caps at "99+")

[QueuedAlertBadge]       UI — Alert list items
  └─ Shows countdown or bypass indicator on queued alerts
```

---

## 12. Schemas Summary

| Schema              | File                                    | Key Exports                                                                                                                                                                                                |
| ------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alert rule          | `schemas/alert-rule.schema.ts`          | `alertRuleFormSchema`, `alertConditionSchema`, `throttleConfigSchema`, `quietHoursConfigSchema`, `COMMON_EVENT_TYPES`, `NOTIFICATION_CHANNELS`, `SEVERITY_CONFIG`, `OPERATOR_CONFIG`, `defaultAlertRule`   |
| Alert rule template | `schemas/alert-rule-template.schema.ts` | `alertRuleTemplateSchema`, `alertRuleTemplateVariableSchema`, `applyAlertRuleTemplateInputSchema`, `alertRuleTemplateImportSchema`, `customAlertRuleTemplateInputSchema`, `alertRuleTemplatePreviewSchema` |
| Email config        | `schemas/email-config.schema.ts`        | `emailConfigSchema`, `defaultEmailConfig`, `SMTP_PORT_PRESETS`, `isValidEmail`, `toEmailConfigInput`                                                                                                       |
| Ntfy config         | `schemas/ntfy-config.schema.ts`         | `ntfyConfigSchema`, `DEFAULT_NTFY_CONFIG`, `NTFY_PRIORITY_PRESETS`, `NTFY_SERVER_PRESETS`, `isValidNtfyTopic`, `formatNtfyTags`, `parseNtfyTags`                                                           |
| Webhook config      | `schemas/webhook.schema.ts`             | `webhookConfigSchema`, `DEFAULT_WEBHOOK_CONFIG`, `WEBHOOK_TEMPLATE_PRESETS`, `AUTH_TYPE_OPTIONS`, `toWebhookInput`                                                                                         |

---

## 13. Cross-References

- **Zustand stores** — `useAlertNotificationStore` (notifications, settings, addNotification),
  `useConnectionStore` (activeRouterId for subscription scoping). See `libs/state/stores`.
- **GraphQL subscriptions** — `alertEvents(deviceId)` subscription is defined inline in
  `useAlertNotifications.ts`. The subscription field is declared in `schema/alerts/`.
- **TemplateGallery (Layer 2)** — `AlertTemplateBrowser` composes `TemplateGallery` from
  `@nasnet/ui/patterns`. The alerts module provides data; the gallery handles all UI presentation.
- **Platform Presenter pattern** — `QuietHoursConfig`, `EmailChannelForm`, `WebhookConfigForm`,
  `NtfyChannelForm`, and the template browser all follow the headless + presenter pattern described
  in `Docs/design/PLATFORM_PRESENTER_GUIDE.md`.
- **Design tokens** — `bg-error/10`, `text-error`, `bg-warning/10`, `bg-info/10`, `bg-success/10`
  are used consistently for severity-coloured status indicators. See `Docs/design/DESIGN_TOKENS.md`.
- **Backend alert engine** — Go implementation in `apps/backend/internal/alerts/`. The engine
  evaluates rules, the throttle queue is in `internal/alerts/throttle/`, and the notification
  dispatcher is in `internal/notifications/dispatcher.go`.
- **GraphQL schema** — Alert types and operations are in `schema/alerts/` (24 files covering rules,
  channels, subscriptions, templates, quiet hours, webhooks).
