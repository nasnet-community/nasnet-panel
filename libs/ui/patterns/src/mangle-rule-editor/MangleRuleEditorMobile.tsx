/**
 * MangleRuleEditorMobile - Mobile Platform Presenter
 *
 * Sheet-based form with card sections and 44px touch targets.
 * Optimized for touch interaction and vertical scrolling.
 *
 * @module @nasnet/ui/patterns/mangle-rule-editor
 */

import { forwardRef, memo, useMemo } from 'react';

import { Network, Shield, Settings, AlertCircle, Info, Trash2, ChevronDown } from 'lucide-react';
import { Controller, FormProvider } from 'react-hook-form';

import { cn } from '@nasnet/ui/utils';

import {
  MangleChainSchema,
  MangleActionSchema,
  ConnectionStateSchema,
  DSCP_CLASSES,
} from '@nasnet/core/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
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
} from '@nasnet/ui/primitives';

import { RHFFormField, type RHFFormFieldProps } from '../rhf-form-field';
import { useMangleRuleEditor } from './use-mangle-rule-editor';

import type { MangleRuleEditorProps } from './mangle-rule-editor.types';

// Force FieldValues default to prevent generic inference issues across multiple JSX usages
type FormFieldProps = RHFFormFieldProps;
const FormField = RHFFormField as React.FC<FormFieldProps>;

/**
 * Mobile presenter for mangle rule editor.
 *
 * Features:
 * - Sheet with card-based form sections
 * - 44px minimum touch targets
 * - Vertical stacking for easy scrolling
 * - Sticky header with preview
 * - Bottom action bar
 */
export const MangleRuleEditorMobile = memo(function MangleRuleEditorMobile({
  routerId,
  initialRule,
  open,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  mode = initialRule?.id ? 'edit' : 'create',
}: MangleRuleEditorProps) {
  const editor = useMangleRuleEditor({
    initialRule,
    onSubmit: onSave,
  });

  const { form, rule, preview, visibleFields } = editor;
  const { control, formState } = form;

  // Get action-specific badge color
  const actionBadgeVariant = useMemo(():
    | 'default'
    | 'secondary'
    | 'outline'
    | 'error'
    | 'success'
    | 'warning'
    | 'info' => {
    const action = rule.action;
    if (!action) return 'default';

    if (action.startsWith('mark-')) return 'info';
    if (action.startsWith('change-')) return 'warning';
    if (action === 'accept') return 'success';
    if (action === 'drop') return 'error';
    return 'default';
  }, [rule.action]);

  return (
    <FormProvider {...form}>
      <Sheet
        open={open}
        onOpenChange={onClose}
      >
        <SheetContent
          side="bottom"
          className="flex h-[90vh] flex-col"
        >
          <SheetHeader>
            <SheetTitle>{mode === 'create' ? 'Create Mangle Rule' : 'Edit Mangle Rule'}</SheetTitle>
            <SheetDescription>Configure traffic marking and manipulation</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto pb-20">
            {/* Live Preview */}
            <Card className="bg-info/10 border-info/20 p-4">
              <div className="flex items-start gap-3">
                <Info className="text-info mt-0.5 h-5 w-5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-info mb-1 text-sm font-medium">Preview</p>
                  <p className="text-muted-foreground break-words font-mono text-sm">{preview}</p>
                </div>
              </div>
              <Badge
                variant={actionBadgeVariant}
                className="mt-2"
              >
                {rule.action || 'No action'}
              </Badge>
            </Card>

            {/* Chain and Action */}
            <Card className="space-y-4 p-4">
              <h3 className="text-sm font-semibold">Chain & Action</h3>

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
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select chain" />
                      </SelectTrigger>
                      <SelectContent>
                        {MangleChainSchema.options.map((chain: string) => (
                          <SelectItem
                            key={chain}
                            value={chain}
                            className="h-11"
                          >
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
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        {MangleActionSchema.options.map((action: string) => (
                          <SelectItem
                            key={action}
                            value={action}
                            className="h-11"
                          >
                            {action}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </Card>

            {/* Action-Specific Fields */}
            {(visibleFields.includes('newConnectionMark') ||
              visibleFields.includes('newPacketMark') ||
              visibleFields.includes('newRoutingMark') ||
              visibleFields.includes('newDscp') ||
              visibleFields.includes('passthrough')) && (
              <Card className="space-y-4 p-4">
                <h3 className="text-sm font-semibold">Mark Settings</h3>

                {visibleFields.includes('newConnectionMark') && (
                  <FormField
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
                          className="h-11"
                        />
                      )}
                    />
                  </FormField>
                )}

                {visibleFields.includes('newPacketMark') && (
                  <FormField
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
                          className="h-11"
                        />
                      )}
                    />
                  </FormField>
                )}

                {visibleFields.includes('newRoutingMark') && (
                  <FormField
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
                          className="h-11"
                        />
                      )}
                    />
                  </FormField>
                )}

                {visibleFields.includes('newDscp') && (
                  <FormField
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
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select DSCP class" />
                          </SelectTrigger>
                          <SelectContent>
                            {DSCP_CLASSES.map(
                              (dscp: {
                                value: number;
                                name: string;
                                description: string;
                                useCase: string;
                              }) => (
                                <SelectItem
                                  key={dscp.value}
                                  value={dscp.value.toString()}
                                  className="h-auto py-3"
                                >
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">
                                      {dscp.value} - {dscp.name}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                      {dscp.useCase}
                                    </span>
                                  </div>
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                )}

                {visibleFields.includes('passthrough') && (
                  <FormField
                    name="passthrough"
                    label="Passthrough"
                    description="Continue to next rule after marking"
                  >
                    <Controller
                      name="passthrough"
                      control={control}
                      render={({ field }) => (
                        <div className="flex h-11 items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            {field.value ? 'Continue processing' : 'Terminal action'}
                          </span>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-label="Passthrough"
                          />
                        </div>
                      )}
                    />
                  </FormField>
                )}
              </Card>
            )}

            {/* Traffic Matchers */}
            <Card className="space-y-4 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Network className="h-4 w-4" />
                Traffic Matchers
              </h3>

              <FormField
                name="protocol"
                label="Protocol"
              >
                <Controller
                  name="protocol"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Any protocol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="tcp"
                          className="h-11"
                        >
                          TCP
                        </SelectItem>
                        <SelectItem
                          value="udp"
                          className="h-11"
                        >
                          UDP
                        </SelectItem>
                        <SelectItem
                          value="icmp"
                          className="h-11"
                        >
                          ICMP
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField
                name="srcAddress"
                label="Source Address"
              >
                <Controller
                  name="srcAddress"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="192.168.1.0/24"
                      value={field.value || ''}
                      className="h-11"
                    />
                  )}
                />
              </FormField>

              <FormField
                name="dstAddress"
                label="Destination Address"
              >
                <Controller
                  name="dstAddress"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="10.0.0.0/8"
                      value={field.value || ''}
                      className="h-11"
                    />
                  )}
                />
              </FormField>

              <FormField
                name="dstPort"
                label="Destination Port"
              >
                <Controller
                  name="dstPort"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="80,443 or 8000-9000"
                      value={field.value || ''}
                      className="h-11"
                    />
                  )}
                />
              </FormField>
            </Card>

            {/* Meta */}
            <Card className="space-y-4 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Settings className="h-4 w-4" />
                Settings
              </h3>

              <FormField
                name="comment"
                label="Comment"
              >
                <Controller
                  name="comment"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Description"
                      value={field.value || ''}
                      className="h-11"
                    />
                  )}
                />
              </FormField>

              <label
                htmlFor="mangle-disabled-switch"
                className="flex h-11 cursor-pointer items-center justify-between"
              >
                <span className="text-sm font-medium">Disabled</span>
                <Controller
                  name="disabled"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="mangle-disabled-switch"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Disabled"
                    />
                  )}
                />
              </label>

              <label
                htmlFor="mangle-log-switch"
                className="flex h-11 cursor-pointer items-center justify-between"
              >
                <span className="text-sm font-medium">Log Packets</span>
                <Controller
                  name="log"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="mangle-log-switch"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Log Packets"
                    />
                  )}
                />
              </label>
            </Card>
          </div>

          <SheetFooter className="bg-background fixed bottom-0 left-0 right-0 border-t p-4">
            <div className="flex w-full flex-col gap-2">
              {mode === 'edit' && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={onDelete}
                  disabled={isDeleting || isSaving}
                  className="h-11"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Rule
                </Button>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={onClose}
                  disabled={isSaving || isDeleting}
                  className="h-11 flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  onClick={editor.onSubmit}
                  disabled={!formState.isValid || isSaving || isDeleting}
                  className="h-11 flex-1"
                >
                  {isSaving ?
                    'Saving...'
                  : mode === 'create' ?
                    'Create'
                  : 'Save'}
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </FormProvider>
  );
});

MangleRuleEditorMobile.displayName = 'MangleRuleEditorMobile';
