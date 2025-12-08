/**
 * Log Settings Dialog Component
 * Configure RouterOS logging rules and destinations
 * Epic 0.8: System Logs - RouterOS Log Settings
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Skeleton,
} from '@nasnet/ui/primitives';
import { Settings, Plus, Trash2, AlertCircle, Save } from 'lucide-react';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  useLoggingRules,
  useLoggingActions,
  useCreateLoggingRule,
  useUpdateLoggingRule,
  useDeleteLoggingRule,
  useToggleLoggingRule,
  useUpdateLoggingAction,
  type LoggingRule,
  type LoggingAction,
  type UpdateLoggingActionInput,
} from '@nasnet/api-client/queries';

/**
 * Available log topics for selection
 */
const LOG_TOPICS = [
  'system',
  'firewall',
  'wireless',
  'dhcp',
  'dns',
  'ppp',
  'l2tp',
  'pptp',
  'sstp',
  'ovpn',
  'ipsec',
  'interface',
  'bridge',
  'route',
  'script',
  'scheduler',
  'critical',
  'debug',
  'error',
  'info',
  'warning',
];

export interface LogSettingsDialogProps {
  /**
   * Trigger element (defaults to Settings icon button)
   */
  trigger?: React.ReactNode;
}

/**
 * Dialog for configuring RouterOS logging settings
 */
export function LogSettingsDialog({ trigger }: LogSettingsDialogProps) {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('rules');

  const {
    data: rules,
    isLoading: rulesLoading,
    error: rulesError,
    refetch: refetchRules,
  } = useLoggingRules(routerIp);

  const {
    data: actions,
    isLoading: actionsLoading,
    error: actionsError,
  } = useLoggingActions(routerIp);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="sr-only md:not-sr-only">Log Settings</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>RouterOS Log Settings</DialogTitle>
          <DialogDescription>
            Configure logging rules and destinations on your router
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="destinations">Destinations</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4 mt-4">
            <RulesTab
              rules={rules || []}
              isLoading={rulesLoading}
              error={rulesError}
              routerIp={routerIp}
              onRefetch={refetchRules}
            />
          </TabsContent>

          <TabsContent value="destinations" className="space-y-4 mt-4">
            <DestinationsTab
              actions={actions || []}
              isLoading={actionsLoading}
              error={actionsError}
              routerIp={routerIp}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Rules Tab Component
 */
interface RulesTabProps {
  rules: LoggingRule[];
  isLoading: boolean;
  error: Error | null;
  routerIp: string;
  onRefetch: () => void;
}

function RulesTab({
  rules,
  isLoading,
  error,
  routerIp,
  onRefetch,
}: RulesTabProps) {
  const [showAddForm, setShowAddForm] = React.useState(false);

  const toggleRule = useToggleLoggingRule(routerIp);
  const deleteRule = useDeleteLoggingRule(routerIp);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <AlertCircle className="h-8 w-8 text-error" />
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button variant="outline" size="sm" onClick={onRefetch}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule['.id']} className="card-flat">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm font-mono">
                    {rule.topics}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Action: {rule.action}
                    {rule.prefix && ` • Prefix: ${rule.prefix}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!rule.disabled}
                    onCheckedChange={(checked) =>
                      toggleRule.mutate({
                        id: rule['.id'],
                        disabled: !checked,
                      })
                    }
                    disabled={toggleRule.isPending}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (
                        confirm(
                          'Are you sure you want to delete this logging rule?'
                        )
                      ) {
                        deleteRule.mutate(rule['.id']);
                      }
                    }}
                    disabled={deleteRule.isPending}
                    className="text-error hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}

        {rules.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No logging rules configured.
          </p>
        )}
      </div>

      {showAddForm && (
        <AddRuleForm
          routerIp={routerIp}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}

/**
 * Add Rule Form Component
 */
interface AddRuleFormProps {
  routerIp: string;
  onClose: () => void;
}

function AddRuleForm({ routerIp, onClose }: AddRuleFormProps) {
  const [topics, setTopics] = React.useState<string[]>([]);
  const [action, setAction] = React.useState('memory');
  const [prefix, setPrefix] = React.useState('');

  const createRule = useCreateLoggingRule(routerIp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topics.length === 0) return;

    createRule.mutate(
      {
        topics: topics.join(','),
        action,
        prefix: prefix || undefined,
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-base">Add Logging Rule</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Topics Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Topics</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {LOG_TOPICS.map((topic) => (
                <Button
                  key={topic}
                  type="button"
                  variant={topics.includes(topic) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setTopics((prev) =>
                      prev.includes(topic)
                        ? prev.filter((t) => t !== topic)
                        : [...prev, topic]
                    )
                  }
                  className="text-xs"
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>

          {/* Action Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Action (Destination)</label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="memory">Memory</SelectItem>
                <SelectItem value="disk">Disk</SelectItem>
                <SelectItem value="echo">Echo (Console)</SelectItem>
                <SelectItem value="remote">Remote Syslog</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prefix */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Prefix (Optional)</label>
            <Input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g., FW-"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={topics.length === 0 || createRule.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Destinations Tab Component
 */
interface DestinationsTabProps {
  actions: LoggingAction[];
  isLoading: boolean;
  error: Error | null;
  routerIp: string;
}

function DestinationsTab({
  actions,
  isLoading,
  error,
  routerIp,
}: DestinationsTabProps) {
  const updateAction = useUpdateLoggingAction(routerIp);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <AlertCircle className="h-8 w-8 text-error" />
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure where logs are stored. Memory logs are temporary, disk logs
        persist across reboots.
      </p>

      <div className="space-y-3">
        {actions.map((action) => (
          <Card key={action['.id']} className="card-flat">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">{action.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Type: {action.target}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setEditingId(
                      editingId === action['.id'] ? null : action['.id']
                    )
                  }
                >
                  {editingId === action['.id'] ? 'Close' : 'Configure'}
                </Button>
              </div>
            </CardHeader>

            {editingId === action['.id'] && (
              <CardContent className="pt-0">
                <ActionConfigForm
                  action={action}
                  routerIp={routerIp}
                  onSave={() => setEditingId(null)}
                />
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Action Configuration Form
 */
interface ActionConfigFormProps {
  action: LoggingAction;
  routerIp: string;
  onSave: () => void;
}

function ActionConfigForm({ action, routerIp, onSave }: ActionConfigFormProps) {
  const updateAction = useUpdateLoggingAction(routerIp);
  const [memoryLines, setMemoryLines] = React.useState(
    action['memory-lines'] || 1000
  );
  const [diskFileCount, setDiskFileCount] = React.useState(
    action['disk-file-count'] || 2
  );
  const [diskLinesPerFile, setDiskLinesPerFile] = React.useState(
    action['disk-lines-per-file'] || 1000
  );
  const [remote, setRemote] = React.useState(action.remote || '');
  const [remotePort, setRemotePort] = React.useState(
    action['remote-port'] || 514
  );

  const handleSave = () => {
    const updates: Partial<UpdateLoggingActionInput> & { id: string } = { id: action['.id'] };

    if (action.target === 'memory') {
      updates['memory-lines'] = memoryLines;
    } else if (action.target === 'disk') {
      updates['disk-file-count'] = diskFileCount;
      updates['disk-lines-per-file'] = diskLinesPerFile;
    } else if (action.target === 'remote') {
      updates['remote'] = remote;
      updates['remote-port'] = remotePort;
    }

    updateAction.mutate(updates as UpdateLoggingActionInput, {
      onSuccess: onSave,
    });
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      {action.target === 'memory' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Memory Lines</label>
          <Input
            type="number"
            value={memoryLines}
            onChange={(e) => setMemoryLines(parseInt(e.target.value) || 1000)}
            min={1}
            max={65535}
          />
          <p className="text-xs text-muted-foreground">
            Maximum log entries to keep in memory (1-65535)
          </p>
        </div>
      )}

      {action.target === 'disk' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">File Count</label>
            <Input
              type="number"
              value={diskFileCount}
              onChange={(e) => setDiskFileCount(parseInt(e.target.value) || 2)}
              min={1}
              max={65535}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Lines Per File</label>
            <Input
              type="number"
              value={diskLinesPerFile}
              onChange={(e) =>
                setDiskLinesPerFile(parseInt(e.target.value) || 1000)
              }
              min={1}
              max={65535}
            />
          </div>
        </>
      )}

      {action.target === 'remote' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Remote Server</label>
            <Input
              value={remote}
              onChange={(e) => setRemote(e.target.value)}
              placeholder="192.168.1.100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Port</label>
            <Input
              type="number"
              value={remotePort}
              onChange={(e) => setRemotePort(parseInt(e.target.value) || 514)}
              min={1}
              max={65535}
            />
          </div>
        </>
      )}

      <Button
        onClick={handleSave}
        disabled={updateAction.isPending}
        className="w-full gap-2"
      >
        <Save className="h-4 w-4" />
        Save Changes
      </Button>
    </div>
  );
}


