/**
 * FilterRuleEditorMobile - Mobile Platform Presenter
 *
 * Sheet-based form with card sections and 44px touch targets.
 * Optimized for touch interaction and vertical scrolling.
 *
 * @module @nasnet/ui/patterns/filter-rule-editor
 */

import { forwardRef, memo, useMemo } from 'react';

import {
  Network,
  Settings,
  Info,
  Trash2,
} from 'lucide-react';
import { Controller, FormProvider } from 'react-hook-form';

import { cn } from '@nasnet/ui/utils';

import {
  FilterChainSchema,
  FilterActionSchema,
  ConnectionStateSchema,
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
import { useFilterRuleEditor } from './use-filter-rule-editor';

import type { FilterRuleEditorProps } from './filter-rule-editor.types';

// Force FieldValues default to prevent generic inference issues across multiple JSX usages
type FormFieldProps = RHFFormFieldProps;
const FormField = RHFFormField as React.FC<FormFieldProps>;

/**
 * Mobile presenter for filter rule editor.
 *
 * Features:
 * - Sheet with card-based form sections
 * - 44px minimum touch targets
 * - Vertical stacking for easy scrolling
 * - Sticky header with preview
 * - Bottom action bar
 */
export const FilterRuleEditorMobile = memo(function FilterRuleEditorMobile({
  routerId,
  initialRule,
  open,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  mode = initialRule?.id ? 'edit' : 'create',
}: FilterRuleEditorProps) {
  const editor = useFilterRuleEditor({
    initialRule,
    onSubmit: onSave,
  });

  const { form, rule, preview, visibleFields, canUseOutInterface, canUseInInterface } = editor;
  const { control, formState } = form;

  // Get action-specific badge color
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
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>
            {mode === 'create' ? 'Create Filter Rule' : 'Edit Filter Rule'}
          </SheetTitle>
          <SheetDescription>
            Configure firewall rules
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pb-20">
          {/* Live Preview */}
          <Card className="p-4 bg-info/10 border-info/20">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-info mb-1">Preview</p>
                <p className="text-sm text-muted-foreground font-mono break-words">
                  {preview}
                </p>
              </div>
            </div>
            <Badge variant={actionBadgeVariant} className="mt-2">
              {rule.action || 'No action'}
            </Badge>
          </Card>

          {/* Chain and Action */}
          <Card className="p-4 space-y-4">
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select chain" />
                    </SelectTrigger>
                    <SelectContent>
                      {FilterChainSchema.options.map((chain: string) => (
                        <SelectItem key={chain} value={chain} className="h-11">
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
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      {FilterActionSchema.options.map((action: string) => (
                        <SelectItem key={action} value={action} className="h-11">
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
          {(visibleFields.includes('logPrefix') || visibleFields.includes('jumpTarget')) && (
            <Card className="p-4 space-y-4">
              <h3 className="text-sm font-semibold">Action Settings</h3>

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
                        className="h-11"
                      />
                    )}
                  />
                </FormField>
              )}

              {visibleFields.includes('jumpTarget') && (
                <FormField
                  name="jumpTarget"
                  label="Jump Target"
                  description="Custom chain name"
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
                        className="h-11"
                      />
                    )}
                  />
                </FormField>
              )}
            </Card>
          )}

          {/* Traffic Matchers */}
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Network className="h-4 w-4" />
              Traffic Matchers
            </h3>

            <FormField name="protocol" label="Protocol">
              <Controller
                name="protocol"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Any protocol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tcp" className="h-11">TCP</SelectItem>
                      <SelectItem value="udp" className="h-11">UDP</SelectItem>
                      <SelectItem value="icmp" className="h-11">ICMP</SelectItem>
                      <SelectItem value="all" className="h-11">All</SelectItem>
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
                    className="h-11"
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
                    className="h-11"
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
                    className="h-11"
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
                      className="h-11"
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
                      className="h-11"
                    />
                  )}
                />
              </FormField>
            )}
          </Card>

          {/* Meta */}
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </h3>

            <FormField name="comment" label="Comment">
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

            <label htmlFor="filter-disabled-switch" className="flex items-center justify-between h-11 cursor-pointer">
              <span className="text-sm font-medium">Disabled</span>
              <Controller
                name="disabled"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="filter-disabled-switch"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Disabled"
                  />
                )}
              />
            </label>

            <label htmlFor="filter-log-switch" className="flex items-center justify-between h-11 cursor-pointer">
              <span className="text-sm font-medium">Log Packets</span>
              <Controller
                name="log"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="filter-log-switch"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Log Packets"
                  />
                )}
              />
            </label>
          </Card>
        </div>

        <SheetFooter className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="flex flex-col gap-2 w-full">
            {mode === 'edit' && onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="lg"
                onClick={onDelete}
                disabled={isDeleting || isSaving}
                className="h-11"
              >
                <Trash2 className="h-4 w-4 mr-2" />
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
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                onClick={editor.onSubmit}
                disabled={!formState.isValid || isSaving || isDeleting}
                className="flex-1 h-11"
              >
                {isSaving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    </FormProvider>
  );
});

FilterRuleEditorMobile.displayName = 'FilterRuleEditorMobile';
