/**
 * MangleRuleEditorDesktop - Desktop Platform Presenter
 *
 * Dialog-based form with inline layout and live preview panel.
 * Optimized for keyboard navigation and dense data entry.
 *
 * @module @nasnet/ui/patterns/mangle-rule-editor
 */

import { memo, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import {
  Network,
  Shield,
  Settings,
  AlertCircle,
  Info,
  Trash2,
  Copy,
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
} from '@nasnet/ui/primitives';
import {
  IPInput,
  PortInput,
  InterfaceSelector,
} from '@nasnet/ui/patterns/network-inputs';
import { ConfirmationDialog } from '@nasnet/ui/patterns/confirmation-dialog';
import { RHFFormField } from '@nasnet/ui/patterns/rhf-form-field';

import {
  MangleChainSchema,
  MangleActionSchema,
  ConnectionStateSchema,
  DSCP_CLASSES,
  MARK_TYPES,
} from '@nasnet/core/types/firewall';

import { useMangleRuleEditor } from './use-mangle-rule-editor';
import type { MangleRuleEditorProps } from './mangle-rule-editor.types';

/**
 * Desktop presenter for mangle rule editor.
 *
 * Features:
 * - Dialog with inline form layout
 * - Live preview panel showing rule description
 * - Action-specific field groups
 * - DSCP selector with QoS descriptions
 * - Address list autocomplete
 * - Dangerous action confirmation
 */
export const MangleRuleEditorDesktop = memo(function MangleRuleEditorDesktop({
  routerId,
  initialRule,
  open,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  mode = initialRule?.id ? 'edit' : 'create',
  showChainDiagram = true,
  addressLists = [],
  interfaceLists = [],
}: MangleRuleEditorProps) {
  const editor = useMangleRuleEditor({
    initialRule,
    onSubmit: onSave,
  });

  const { form, rule, preview, visibleFields, errors } = editor;
  const { control, formState } = form;

  // Get action-specific badge color
  const actionBadgeVariant = useMemo(() => {
    const action = rule.action;
    if (!action) return 'default';

    if (action.startsWith('mark-')) return 'info';
    if (action.startsWith('change-')) return 'warning';
    if (action === 'accept') return 'success';
    if (action === 'drop') return 'destructive';
    return 'default';
  }, [rule.action]);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Create Mangle Rule' : 'Edit Mangle Rule'}
            </DialogTitle>
            <DialogDescription>
              Configure traffic marking and manipulation rules for QoS and policy routing
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
                        {MangleChainSchema.options.map((chain) => (
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
                        {MangleActionSchema.options.map((action) => (
                          <SelectItem key={action} value={action}>
                            {action}
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
            {visibleFields.includes('newConnectionMark') && (
              <RHFFormField
                name="newConnectionMark"
                label="Connection Mark"
                description="Mark name for all packets in connection"
                required
              >
                <Controller
                  name="newConnectionMark"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., voip-traffic"
                      value={field.value || ''}
                    />
                  )}
                />
              </RHFFormField>
            )}

            {visibleFields.includes('newPacketMark') && (
              <RHFFormField
                name="newPacketMark"
                label="Packet Mark"
                description="Mark name for individual packets"
                required
              >
                <Controller
                  name="newPacketMark"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., high-priority"
                      value={field.value || ''}
                    />
                  )}
                />
              </RHFFormField>
            )}

            {visibleFields.includes('newRoutingMark') && (
              <RHFFormField
                name="newRoutingMark"
                label="Routing Mark"
                description="Mark name for routing decisions"
                required
              >
                <Controller
                  name="newRoutingMark"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., wan2-route"
                      value={field.value || ''}
                    />
                  )}
                />
              </RHFFormField>
            )}

            {visibleFields.includes('newDscp') && (
              <RHFFormField
                name="newDscp"
                label="DSCP Value"
                description="QoS Differentiated Services Code Point"
                required
              >
                <Controller
                  name="newDscp"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(v) => field.onChange(parseInt(v, 10))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select DSCP class" />
                      </SelectTrigger>
                      <SelectContent>
                        {DSCP_CLASSES.map((dscp) => (
                          <SelectItem key={dscp.value} value={dscp.value.toString()}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">
                                {dscp.value} - {dscp.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {dscp.description} - {dscp.useCase}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </RHFFormField>
            )}

            {visibleFields.includes('passthrough') && (
              <RHFFormField
                name="passthrough"
                label="Passthrough"
                description="Continue to next rule after marking"
              >
                <Controller
                  name="passthrough"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <span className="text-sm text-muted-foreground">
                        {field.value ? 'Continue processing' : 'Terminal action'}
                      </span>
                    </div>
                  )}
                />
              </RHFFormField>
            )}

            <Separator />

            {/* Traffic Matchers */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Network className="h-4 w-4" />
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
                          <SelectItem value="tcp">TCP</SelectItem>
                          <SelectItem value="udp">UDP</SelectItem>
                          <SelectItem value="icmp">ICMP</SelectItem>
                          <SelectItem value="gre">GRE</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </RHFFormField>

                <RHFFormField name="connectionState" label="Connection State">
                  <Controller
                    name="connectionState"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value?.[0] || ''}
                        onValueChange={(v) => field.onChange(v ? [v] : [])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any state" />
                        </SelectTrigger>
                        <SelectContent>
                          {ConnectionStateSchema.options.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
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

              <div className="flex items-center gap-4">
                <RHFFormField name="disabled" label="Disabled">
                  <Controller
                    name="disabled"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </RHFFormField>

                <RHFFormField name="log" label="Log Packets">
                  <Controller
                    name="log"
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
    </>
  );
});

MangleRuleEditorDesktop.displayName = 'MangleRuleEditorDesktop';
