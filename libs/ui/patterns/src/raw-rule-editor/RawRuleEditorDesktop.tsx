/**
 * RawRuleEditorDesktop - Desktop Platform Presenter
 *
 * Dialog-based form with inline layout and live preview panel.
 * Optimized for keyboard navigation and dense data entry.
 *
 * @module @nasnet/ui/patterns/raw-rule-editor
 */

import { memo, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import {
  Zap,
  Shield,
  Settings,
  Info,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@nasnet/ui/primitives';
import {
  Button,
  Card,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
  Badge,
  Separator,
  Alert,
  AlertDescription,
} from '@nasnet/ui/primitives';
import { RHFFormField } from '@nasnet/ui/patterns/rhf-form-field';

import {
  RawChainSchema,
  RawActionSchema,
  RawProtocolSchema,
  getActionColor,
  getActionDescription,
  SUGGESTED_LOG_PREFIXES,
} from '@nasnet/core/types/firewall';

import { useRawRuleEditor } from './use-raw-rule-editor';
import type { RawRuleEditorProps } from './raw-rule-editor.types';

/**
 * Desktop presenter for RAW rule editor.
 *
 * Features:
 * - Dialog with inline form layout
 * - Live preview panel showing rule description
 * - Action-specific field groups
 * - Performance tips for notrack action
 * - Chain-specific interface validation
 */
export const RawRuleEditorDesktop = memo(function RawRuleEditorDesktop({
  routerId,
  initialRule,
  open,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  mode = initialRule?.id ? 'edit' : 'create',
  showPerformanceTips = true,
  addressLists = [],
  interfaceLists = [],
}: RawRuleEditorProps) {
  const editor = useRawRuleEditor({
    initialRule,
    onSubmit: onSave,
  });

  const { form, rule, preview, visibleFields, errors, canUseOutInterface, canUseInInterface } = editor;
  const { control, formState } = form;

  // Get action-specific badge variant
  const actionBadgeVariant = useMemo(() => {
    const action = rule.action;
    if (!action) return 'default';

    if (action === 'accept') return 'success';
    if (action === 'drop') return 'destructive';
    if (action === 'log') return 'info';
    if (action === 'notrack' || action === 'jump') return 'warning';
    return 'default';
  }, [rule.action]);

  // Show performance tip for notrack action
  const showNotrackTip = showPerformanceTips && rule.action === 'notrack';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create RAW Rule' : 'Edit RAW Rule'}
          </DialogTitle>
          <DialogDescription>
            Configure RAW rules to bypass connection tracking for performance or early packet dropping
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={editor.onSubmit} className="space-y-6">
          {/* Live Preview */}
          <Card className="p-4 bg-info/10 border-info/20">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-info mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-info mb-1">Rule Preview</p>
                <p className="text-sm text-muted-foreground font-mono break-words">
                  {preview}
                </p>
              </div>
              <Badge variant={actionBadgeVariant}>
                {rule.action || 'No action'}
              </Badge>
            </div>
          </Card>

          {/* Notrack Performance Tip */}
          {showNotrackTip && (
            <Alert variant="warning">
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>Performance Optimization:</strong> Notrack skips connection tracking, improving throughput for trusted traffic. Use for high-bandwidth services (e.g., LAN file sharing, streaming).
              </AlertDescription>
            </Alert>
          )}

          {/* Chain and Action */}
          <div className="grid grid-cols-2 gap-4">
            <RHFFormField
              name="chain"
              label="Chain"
              description="Packet processing stage"
              required
            >
              <Controller
                name="chain"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select chain" />
                    </SelectTrigger>
                    <SelectContent>
                      {RawChainSchema.options.map((chain) => (
                        <SelectItem key={chain} value={chain}>
                          {chain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </RHFFormField>

            <RHFFormField
              name="action"
              label="Action"
              description="What to do with matched packets"
              required
            >
              <Controller
                name="action"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      {RawActionSchema.options.map((action) => (
                        <SelectItem key={action} value={action}>
                          <div className="flex flex-col items-start">
                            <span>{action}</span>
                            <span className="text-xs text-muted-foreground">
                              {getActionDescription(action)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </RHFFormField>
          </div>

          <Separator />

          {/* Action-Specific Fields */}
          {visibleFields.includes('logPrefix') && (
            <RHFFormField
              name="logPrefix"
              label="Log Prefix"
              description="Prefix for log entries"
              required
            >
              <Controller
                name="logPrefix"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Input
                      {...field}
                      placeholder="e.g., RAW-DROP-"
                      value={field.value || ''}
                    />
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_LOG_PREFIXES.map((suggestion) => (
                        <Button
                          key={suggestion.value}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => field.onChange(suggestion.value)}
                        >
                          {suggestion.value}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              />
            </RHFFormField>
          )}

          {visibleFields.includes('jumpTarget') && (
            <RHFFormField
              name="jumpTarget"
              label="Jump Target Chain"
              description="Custom chain name to jump to"
              required
            >
              <Controller
                name="jumpTarget"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="e.g., custom-chain"
                    value={field.value || ''}
                  />
                )}
              />
            </RHFFormField>
          )}

          {visibleFields.length > 0 && <Separator />}

          {/* Traffic Matchers */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Traffic Matchers (optional)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <RHFFormField name="protocol" label="Protocol">
                <Controller
                  name="protocol"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any protocol" />
                      </SelectTrigger>
                      <SelectContent>
                        {RawProtocolSchema.options.map((protocol) => (
                          <SelectItem key={protocol} value={protocol}>
                            {protocol.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </RHFFormField>

              <RHFFormField name="srcAddress" label="Source Address">
                <Controller
                  name="srcAddress"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="192.168.1.0/24"
                      value={field.value || ''}
                    />
                  )}
                />
              </RHFFormField>

              <RHFFormField name="dstAddress" label="Destination Address">
                <Controller
                  name="dstAddress"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="10.0.0.0/8"
                      value={field.value || ''}
                    />
                  )}
                />
              </RHFFormField>

              <RHFFormField name="srcPort" label="Source Port">
                <Controller
                  name="srcPort"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="1024-65535"
                      value={field.value || ''}
                    />
                  )}
                />
              </RHFFormField>

              <RHFFormField name="dstPort" label="Destination Port">
                <Controller
                  name="dstPort"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="80,443 or 8000-9000"
                      value={field.value || ''}
                    />
                  )}
                />
              </RHFFormField>

              {canUseInInterface && (
                <RHFFormField name="inInterface" label="Input Interface">
                  <Controller
                    name="inInterface"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="ether1"
                        value={field.value || ''}
                      />
                    )}
                  />
                </RHFFormField>
              )}

              {canUseOutInterface && (
                <RHFFormField name="outInterface" label="Output Interface">
                  <Controller
                    name="outInterface"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="ether2"
                        value={field.value || ''}
                      />
                    )}
                  />
                </RHFFormField>
              )}
            </div>
          </div>

          <Separator />

          {/* Meta */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Rule Settings
            </h3>

            <RHFFormField name="comment" label="Comment">
              <Controller
                name="comment"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Description of this rule"
                    value={field.value || ''}
                  />
                )}
              />
            </RHFFormField>

            <div className="flex items-center gap-6">
              <RHFFormField name="disabled" label="Disabled">
                <Controller
                  name="disabled"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </RHFFormField>
            </div>
          </div>
        </form>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {mode === 'edit' && onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting || isSaving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving || isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={editor.onSubmit}
              disabled={!formState.isValid || isSaving || isDeleting}
            >
              {isSaving ? 'Saving...' : mode === 'create' ? 'Create Rule' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

RawRuleEditorDesktop.displayName = 'RawRuleEditorDesktop';
