/**
 * FilterRuleEditorDesktop - Desktop Platform Presenter
 *
 * Dialog-based form with inline layout and live preview panel.
 * Optimized for keyboard navigation and dense data entry.
 *
 * @module @nasnet/ui/patterns/filter-rule-editor
 */

import { memo, useMemo } from 'react';

import {
  Network,
  Shield,
  Settings,
  Info,
  Trash2,
} from 'lucide-react';
import { Controller, FormProvider } from 'react-hook-form';

import {
  FilterChainSchema,
  FilterActionSchema,
  ConnectionStateSchema,
  getActionColor,
  getActionDescription,
  FILTER_SUGGESTED_LOG_PREFIXES as SUGGESTED_LOG_PREFIXES,
} from '@nasnet/core/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,

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

import { RHFFormField, type RHFFormFieldProps } from '../rhf-form-field';
import { useFilterRuleEditor } from './use-filter-rule-editor';

import type { FilterRuleEditorProps } from './filter-rule-editor.types';

// Force FieldValues default to prevent generic inference issues across multiple JSX usages
type FormFieldProps = RHFFormFieldProps;
const FormField = RHFFormField as React.FC<FormFieldProps>;

/**
 * Desktop presenter for filter rule editor.
 *
 * Features:
 * - Dialog with inline form layout
 * - Live preview panel showing rule description
 * - Action-specific field groups
 * - Connection state multi-select
 * - Address list autocomplete
 * - Chain-specific interface validation
 */
export const FilterRuleEditorDesktop = memo(function FilterRuleEditorDesktop({
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
}: FilterRuleEditorProps) {
  const editor = useFilterRuleEditor({
    initialRule,
    onSubmit: onSave,
  });

  const { form, rule, preview, visibleFields, errors, canUseOutInterface, canUseInInterface } = editor;
  const { control, formState } = form;

  // Get action-specific badge variant
  const actionBadgeVariant = useMemo((): 'default' | 'secondary' | 'outline' | 'error' | 'success' | 'warning' | 'info' => {
    const action = rule.action;
    if (!action) return 'default';

    if (action === 'accept') return 'success';
    if (action === 'drop' || action === 'reject' || action === 'tarpit') return 'error';
    if (action === 'log') return 'info';
    if (action === 'jump' || action === 'passthrough') return 'warning';
    return 'default';
  }, [rule.action]);

  return (
    <FormProvider {...form}>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Filter Rule' : 'Edit Filter Rule'}
          </DialogTitle>
          <DialogDescription>
            Configure firewall rules to accept, drop, reject, or log network traffic
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
            <FormField
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
                      {FilterChainSchema.options.map((chain: string) => (
                        <SelectItem key={chain} value={chain}>
                          {chain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
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
                      {FilterActionSchema.options.map((action: string) => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <Separator />

          {/* Action-Specific Fields */}
          {visibleFields.includes('logPrefix') && (
            <FormField
              name="logPrefix"
              label="Log Prefix"
              description="Prefix for log entries"
              required
            >
              <Controller
                name="logPrefix"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="e.g., DROPPED-"
                    value={field.value || ''}
                  />
                )}
              />
            </FormField>
          )}

          {visibleFields.includes('jumpTarget') && (
            <FormField
              name="jumpTarget"
              label="Jump Target Chain"
              description="Custom chain name to jump to"
              required
            >
              <Controller
                name={"jumpTarget" as any}
                control={control}
                render={({ field: { value, ...fieldRest } }) => (
                  <Input
                    {...fieldRest}
                    placeholder="e.g., custom-chain"
                    value={String(value ?? '')}
                  />
                )}
              />
            </FormField>
          )}

          <Separator />

          {/* Traffic Matchers */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Network className="h-4 w-4" />
              Traffic Matchers (optional)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField name="protocol" label="Protocol">
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
                        <SelectItem value="ipv6-icmp">IPv6-ICMP</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField name="connectionState" label="Connection State">
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
                        {ConnectionStateSchema.options.map((state: string) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField name="srcAddress" label="Source Address">
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
              </FormField>

              <FormField name="dstAddress" label="Destination Address">
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
              </FormField>

              <FormField name="srcPort" label="Source Port">
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
              </FormField>

              <FormField name="dstPort" label="Destination Port">
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
              </FormField>

              {canUseInInterface && (
                <FormField name="inInterface" label="Input Interface">
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
                </FormField>
              )}

              {canUseOutInterface && (
                <FormField name="outInterface" label="Output Interface">
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
                </FormField>
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

            <FormField name="comment" label="Comment">
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
            </FormField>

            <div className="flex items-center gap-4">
              <FormField name="disabled" label="Disabled">
                <Controller
                  name="disabled"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </FormField>

              <FormField name="log" label="Log Packets">
                <Controller
                  name="log"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </FormField>
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
    </FormProvider>
  );
});

FilterRuleEditorDesktop.displayName = 'FilterRuleEditorDesktop';
