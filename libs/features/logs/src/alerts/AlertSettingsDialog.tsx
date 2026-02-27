/**
 * Alert Settings Dialog Component
 * Epic 0.8: System Logs - Real-time Alerts/Notifications
 */

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Switch,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
} from '@nasnet/ui/primitives';
import { Bell, BellOff, Plus, Trash2, Volume2, VolumeX } from 'lucide-react';
import type { LogTopic, LogSeverity } from '@nasnet/core/types';
import { useLogAlerts } from './useLogAlerts';
import type { AlertRule, NotificationPreference } from './LogAlertService';

const ALL_TOPICS: LogTopic[] = [
  'system',
  'firewall',
  'wireless',
  'dhcp',
  'dns',
  'ppp',
  'vpn',
  'interface',
  'route',
  'script',
];

const ALL_SEVERITIES: LogSeverity[] = ['debug', 'info', 'warning', 'error', 'critical'];

export interface AlertSettingsDialogProps {
  /**
   * Trigger element (defaults to Bell icon button)
   */
  trigger?: React.ReactNode;
  /**
   * Additional class names
   */
  className?: string;
}

/**
 * @description Dialog for configuring log alert settings and notification rules
 * Allows users to enable/disable alerts, configure notification preferences, manage alert rules, and set up browser notifications.
 */
export const AlertSettingsDialog = React.memo(function AlertSettingsDialog({
  trigger,
  className,
}: AlertSettingsDialogProps) {
  const {
    settings,
    isEnabled,
    setEnabled,
    setNotificationPreference,
    setSoundEnabled,
    upsertRule,
    removeRule,
    toggleRule,
    requestPermission,
    notificationPermission,
    isBrowserNotificationSupported,
  } = useLogAlerts();

  const [isOpen, setIsOpen] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<AlertRule | null>(null);

  const handleRequestPermission = React.useCallback(async () => {
    const permission = await requestPermission();
    if (permission === 'denied') {
      alert('Notification permission was denied. Please enable it in your browser settings.');
    }
  }, [requestPermission]);

  const handleCreateRule = React.useCallback(() => {
    const newRule: AlertRule = {
      id: `rule-${Date.now()}`,
      name: 'New Alert Rule',
      enabled: true,
      topics: [],
      severities: ['error', 'critical'],
      notificationType: 'both',
      soundEnabled: false,
    };
    setEditingRule(newRule);
  }, []);

  const handleSaveRule = React.useCallback(
    (rule: AlertRule) => {
      upsertRule(rule);
      setEditingRule(null);
    },
    [upsertRule]
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="gap-component-sm"
          >
            {isEnabled ?
              <Bell className="h-4 w-4" />
            : <BellOff className="h-4 w-4" />}
            <span className="sr-only md:not-sr-only">Alerts</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Alert Settings</DialogTitle>
          <DialogDescription>Configure real-time alerts for important log events</DialogDescription>
        </DialogHeader>

        <div className="py-component-md space-y-6">
          {/* Global Enable */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Alerts</p>
              <p className="text-muted-foreground text-sm">
                Receive notifications for matching log entries
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {isEnabled && (
            <>
              {/* Browser Notification Permission */}
              {isBrowserNotificationSupported && (
                <div className="p-component-md rounded-card-sm bg-muted flex items-center justify-between">
                  <div>
                    <p className="font-medium">Browser Notifications</p>
                    <p className="text-muted-foreground text-sm">
                      Status:{' '}
                      <span
                        className={cn(
                          'font-mono',
                          notificationPermission === 'granted' ? 'text-success'
                          : notificationPermission === 'denied' ? 'text-error'
                          : 'text-warning'
                        )}
                      >
                        {notificationPermission}
                      </span>
                    </p>
                  </div>
                  {notificationPermission !== 'granted' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRequestPermission}
                    >
                      Request Permission
                    </Button>
                  )}
                </div>
              )}

              {/* Notification Preference */}
              <div className="space-y-2">
                <label
                  htmlFor="notif-pref-select"
                  className="font-medium"
                >
                  Notification Type
                </label>
                <Select
                  value={settings.notificationPreference}
                  onValueChange={(value) =>
                    setNotificationPreference(value as NotificationPreference)
                  }
                >
                  <SelectTrigger
                    id="notif-pref-select"
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Browser + In-App Toast</SelectItem>
                    <SelectItem value="browser">Browser Only</SelectItem>
                    <SelectItem value="toast">In-App Toast Only</SelectItem>
                    <SelectItem value="none">None (Logging Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <div className="gap-component-sm flex items-center">
                  {settings.soundEnabled ?
                    <Volume2 className="h-4 w-4" />
                  : <VolumeX className="text-muted-foreground h-4 w-4" />}
                  <div>
                    <p className="font-medium">Alert Sound</p>
                    <p className="text-muted-foreground text-sm">Play sound for alerts</p>
                  </div>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>

              {/* Alert Rules */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Alert Rules</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateRule}
                    className="gap-component-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Rule
                  </Button>
                </div>

                <div className="space-y-3">
                  {settings.rules.map((rule) => (
                    <Card
                      key={rule.id}
                      className="card-flat"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{rule.name}</CardTitle>
                          <div className="gap-component-sm flex items-center">
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={() => toggleRule(rule.id)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRule(rule)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRule(rule.id)}
                              className="text-error hover:text-error"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-muted-foreground text-sm">
                          <span>
                            Topics: {rule.topics.length > 0 ? rule.topics.join(', ') : 'All'}
                          </span>
                          <span className="mx-2">•</span>
                          <span>
                            Severities:{' '}
                            {rule.severities.length > 0 ? rule.severities.join(', ') : 'All'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {settings.rules.length === 0 && (
                    <p className="text-muted-foreground py-component-md text-center text-sm">
                      No alert rules configured. Add a rule to start receiving alerts.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rule Editor Dialog */}
        {editingRule && (
          <RuleEditorDialog
            rule={editingRule}
            onSave={handleSaveRule}
            onCancel={() => setEditingRule(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
});

AlertSettingsDialog.displayName = 'AlertSettingsDialog';

/**
 * @description Rule Editor Dialog for creating/editing alert rules
 */
interface RuleEditorDialogProps {
  rule: AlertRule;
  onSave: (rule: AlertRule) => void;
  onCancel: () => void;
}

const RuleEditorDialog = React.memo(function RuleEditorDialog({
  rule,
  onSave,
  onCancel,
}: RuleEditorDialogProps) {
  const [editedRule, setEditedRule] = React.useState<AlertRule>({
    ...rule,
  });

  const handleTopicToggle = React.useCallback((topic: LogTopic) => {
    setEditedRule((prev) => ({
      ...prev,
      topics:
        prev.topics.includes(topic) ?
          prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic],
    }));
  }, []);

  const handleSeverityToggle = React.useCallback((severity: LogSeverity) => {
    setEditedRule((prev) => ({
      ...prev,
      severities:
        prev.severities.includes(severity) ?
          prev.severities.filter((s) => s !== severity)
        : [...prev.severities, severity],
    }));
  }, []);

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onCancel()}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {rule.id.startsWith('rule-') ? 'Create Alert Rule' : 'Edit Alert Rule'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-component-md space-y-4">
          {/* Rule Name */}
          <div className="space-y-2">
            <label
              htmlFor="rule-name-input"
              className="text-sm font-medium"
            >
              Rule Name
            </label>
            <Input
              id="rule-name-input"
              value={editedRule.name}
              onChange={(e) => setEditedRule((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter rule name"
            />
          </div>

          {/* Topics */}
          <div className="space-y-2">
            <label
              htmlFor="topics-fieldset"
              className="text-sm font-medium"
            >
              Topics (empty = all topics)
            </label>
            <fieldset
              id="topics-fieldset"
              className="gap-component-sm flex flex-wrap"
            >
              {ALL_TOPICS.map((topic) => (
                <Button
                  key={topic}
                  variant={editedRule.topics.includes(topic) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTopicToggle(topic)}
                  className="text-xs"
                >
                  {topic}
                </Button>
              ))}
            </fieldset>
          </div>

          {/* Severities */}
          <div className="space-y-2">
            <label
              htmlFor="severities-fieldset"
              className="text-sm font-medium"
            >
              Severities (empty = all severities)
            </label>
            <fieldset
              id="severities-fieldset"
              className="gap-component-sm flex flex-wrap"
            >
              {ALL_SEVERITIES.map((severity) => (
                <Button
                  key={severity}
                  variant={editedRule.severities.includes(severity) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSeverityToggle(severity)}
                  className="text-xs"
                >
                  {severity}
                </Button>
              ))}
            </fieldset>
          </div>

          {/* Notification Type */}
          <div className="space-y-2">
            <label
              htmlFor="rule-notif-type-select"
              className="text-sm font-medium"
            >
              Notification Type
            </label>
            <Select
              value={editedRule.notificationType}
              onValueChange={(value) =>
                setEditedRule((prev) => ({
                  ...prev,
                  notificationType: value as NotificationPreference,
                }))
              }
            >
              <SelectTrigger
                id="rule-notif-type-select"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Browser + In-App Toast</SelectItem>
                <SelectItem value="browser">Browser Only</SelectItem>
                <SelectItem value="toast">In-App Toast Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between">
            <label
              htmlFor="rule-sound-switch"
              className="text-sm font-medium"
            >
              Play Sound
            </label>
            <Switch
              id="rule-sound-switch"
              checked={editedRule.soundEnabled}
              onCheckedChange={(checked) =>
                setEditedRule((prev) => ({ ...prev, soundEnabled: checked }))
              }
            />
          </div>

          {/* Message Pattern */}
          <div className="space-y-2">
            <label
              htmlFor="message-pattern-input"
              className="text-sm font-medium"
            >
              Message Pattern (optional regex)
            </label>
            <Input
              id="message-pattern-input"
              value={editedRule.messagePattern || ''}
              onChange={(e) =>
                setEditedRule((prev) => ({
                  ...prev,
                  messagePattern: e.target.value || undefined,
                }))
              }
              placeholder="e.g., failed|error|denied"
            />
          </div>
        </div>

        <div className="gap-component-sm flex justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button onClick={() => onSave(editedRule)}>Save Rule</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

RuleEditorDialog.displayName = 'RuleEditorDialog';
