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

const ALL_SEVERITIES: LogSeverity[] = [
  'debug',
  'info',
  'warning',
  'error',
  'critical',
];

export interface AlertSettingsDialogProps {
  /**
   * Trigger element (defaults to Bell icon button)
   */
  trigger?: React.ReactNode;
}

/**
 * Dialog for configuring log alert settings
 */
export function AlertSettingsDialog({ trigger }: AlertSettingsDialogProps) {
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

  const handleRequestPermission = async () => {
    const permission = await requestPermission();
    if (permission === 'denied') {
      alert(
        'Notification permission was denied. Please enable it in your browser settings.'
      );
    }
  };

  const handleCreateRule = () => {
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
  };

  const handleSaveRule = (rule: AlertRule) => {
    upsertRule(rule);
    setEditingRule(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            {isEnabled ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
            <span className="sr-only md:not-sr-only">Alerts</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Alert Settings</DialogTitle>
          <DialogDescription>
            Configure real-time alerts for important log events
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Global Enable */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Alerts</p>
              <p className="text-sm text-muted-foreground">
                Receive notifications for matching log entries
              </p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setEnabled} />
          </div>

          {isEnabled && (
            <>
              {/* Browser Notification Permission */}
              {isBrowserNotificationSupported && (
                <div className="flex items-center justify-between p-4 rounded-card-sm bg-slate-50 dark:bg-slate-800">
                  <div>
                    <p className="font-medium">Browser Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Status:{' '}
                      <span
                        className={
                          notificationPermission === 'granted'
                            ? 'text-success'
                            : notificationPermission === 'denied'
                              ? 'text-error'
                              : 'text-warning'
                        }
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
                <label className="font-medium">Notification Type</label>
                <Select
                  value={settings.notificationPreference}
                  onValueChange={(value) =>
                    setNotificationPreference(value as NotificationPreference)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">
                      Browser + In-App Toast
                    </SelectItem>
                    <SelectItem value="browser">Browser Only</SelectItem>
                    <SelectItem value="toast">In-App Toast Only</SelectItem>
                    <SelectItem value="none">None (Logging Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings.soundEnabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Alert Sound</p>
                    <p className="text-sm text-muted-foreground">
                      Play sound for alerts
                    </p>
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
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Rule
                  </Button>
                </div>

                <div className="space-y-3">
                  {settings.rules.map((rule) => (
                    <Card key={rule.id} className="card-flat">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{rule.name}</CardTitle>
                          <div className="flex items-center gap-2">
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
                        <div className="text-sm text-muted-foreground">
                          <span>
                            Topics:{' '}
                            {rule.topics.length > 0
                              ? rule.topics.join(', ')
                              : 'All'}
                          </span>
                          <span className="mx-2">•</span>
                          <span>
                            Severities:{' '}
                            {rule.severities.length > 0
                              ? rule.severities.join(', ')
                              : 'All'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {settings.rules.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No alert rules configured. Add a rule to start receiving
                      alerts.
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
}

/**
 * Rule Editor Dialog Component
 */
interface RuleEditorDialogProps {
  rule: AlertRule;
  onSave: (rule: AlertRule) => void;
  onCancel: () => void;
}

function RuleEditorDialog({ rule, onSave, onCancel }: RuleEditorDialogProps) {
  const [editedRule, setEditedRule] = React.useState<AlertRule>({ ...rule });

  const handleTopicToggle = (topic: LogTopic) => {
    setEditedRule((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic],
    }));
  };

  const handleSeverityToggle = (severity: LogSeverity) => {
    setEditedRule((prev) => ({
      ...prev,
      severities: prev.severities.includes(severity)
        ? prev.severities.filter((s) => s !== severity)
        : [...prev.severities, severity],
    }));
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {rule.id.startsWith('rule-') ? 'Create Alert Rule' : 'Edit Alert Rule'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Rule Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rule Name</label>
            <Input
              value={editedRule.name}
              onChange={(e) =>
                setEditedRule((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter rule name"
            />
          </div>

          {/* Topics */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Topics (empty = all topics)
            </label>
            <div className="flex flex-wrap gap-2">
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
            </div>
          </div>

          {/* Severities */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Severities (empty = all severities)
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_SEVERITIES.map((severity) => (
                <Button
                  key={severity}
                  variant={
                    editedRule.severities.includes(severity) ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => handleSeverityToggle(severity)}
                  className="text-xs"
                >
                  {severity}
                </Button>
              ))}
            </div>
          </div>

          {/* Notification Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notification Type</label>
            <Select
              value={editedRule.notificationType}
              onValueChange={(value) =>
                setEditedRule((prev) => ({
                  ...prev,
                  notificationType: value as NotificationPreference,
                }))
              }
            >
              <SelectTrigger className="w-full">
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
            <label className="text-sm font-medium">Play Sound</label>
            <Switch
              checked={editedRule.soundEnabled}
              onCheckedChange={(checked) =>
                setEditedRule((prev) => ({ ...prev, soundEnabled: checked }))
              }
            />
          </div>

          {/* Message Pattern */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Message Pattern (optional regex)
            </label>
            <Input
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

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave(editedRule)}>Save Rule</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



























