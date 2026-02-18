/**
 * RateLimitRuleEditorMobile - Mobile Platform Presenter
 *
 * Sheet-based form with card sections and 44px touch targets.
 * Optimized for touch interaction and vertical scrolling.
 *
 * @module @nasnet/ui/patterns/rate-limit-rule-editor
 */

import { memo, useMemo } from 'react';

import { Shield, AlertCircle, Info, Trash2, Clock, Network } from 'lucide-react';
import { Controller, FormProvider } from 'react-hook-form';

import {
  RateLimitActionSchema,
  TimeWindowSchema,
  TIMEOUT_PRESETS,
  CONNECTION_LIMIT_PRESETS,
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
  Badge,
} from '@nasnet/ui/primitives';

import { useRateLimitEditor } from '../rate-limit-editor/use-rate-limit-editor';
import { RHFFormField, type RHFFormFieldProps } from '../rhf-form-field';

import type { RateLimitRuleEditorProps } from './types';

// Force FieldValues default to prevent generic inference issues across multiple JSX usages
type FormFieldProps = RHFFormFieldProps;
const FormField = RHFFormField as React.FC<FormFieldProps>;

/**
 * Mobile presenter for rate limit rule editor.
 *
 * Features:
 * - Sheet with card-based form sections
 * - 44px minimum touch targets
 * - Vertical stacking for easy scrolling
 * - Sticky header with preview
 * - Bottom action bar
 */
export const RateLimitRuleEditorMobile = memo(function RateLimitRuleEditorMobile({
  routerId,
  initialRule,
  open,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  mode = initialRule?.id ? 'edit' : 'create',
  addressLists = [],
}: RateLimitRuleEditorProps) {
  const editor = useRateLimitEditor({
    initialRule,
    onSubmit: onSave,
  });

  const { form, rule, preview, visibleFields, addressListExists } = editor;
  const { control, formState } = form;

  // Get action-specific badge color
  const actionBadgeVariant = useMemo((): 'default' | 'secondary' | 'outline' | 'error' | 'success' | 'warning' | 'info' => {
    const action = rule.action;
    if (!action) return 'default';

    if (action === 'drop') return 'error';
    if (action === 'tarpit') return 'warning';
    if (action === 'add-to-list') return 'info';
    return 'default';
  }, [rule.action]);

  return (
    <FormProvider {...form}>
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {mode === 'create' ? 'Create Rate Limit Rule' : 'Edit Rate Limit Rule'}
          </SheetTitle>
          <SheetDescription>
            Configure connection rate limiting
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

          {/* Rate Limit Configuration */}
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Rate Limit
            </h3>

            <FormField
              name="connectionLimit"
              label="Connection Limit"
              description="Maximum connections allowed"
              required
            >
              <Controller
                name="connectionLimit"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      max={100000}
                      placeholder="100"
                      className="h-11"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    />
                    {/* Presets */}
                    <div className="flex flex-wrap gap-1">
                      {CONNECTION_LIMIT_PRESETS.map((preset) => (
                        <Button
                          key={preset.label}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            form.setValue('connectionLimit', preset.limit);
                            form.setValue('timeWindow', preset.timeWindow);
                          }}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              />
            </FormField>

            <FormField
              name="timeWindow"
              label="Time Window"
              description="Rate calculation period"
              required
            >
              <Controller
                name="timeWindow"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select time window" />
                    </SelectTrigger>
                    <SelectContent>
                      {TimeWindowSchema.options.map((window: string) => (
                        <SelectItem key={window} value={window} className="h-11">
                          {window === 'per-second' && 'Per Second'}
                          {window === 'per-minute' && 'Per Minute'}
                          {window === 'per-hour' && 'Per Hour'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </Card>

          {/* Action Configuration */}
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Action
            </h3>

            <FormField
              name="action"
              label="Action"
              description="What to do when rate limit exceeded"
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
                      {RateLimitActionSchema.options.map((action: string) => (
                        <SelectItem key={action} value={action} className="h-auto py-3">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">
                              {action === 'drop' && 'Drop'}
                              {action === 'tarpit' && 'Tarpit'}
                              {action === 'add-to-list' && 'Add to List'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {action === 'drop' && 'Block connections immediately'}
                              {action === 'tarpit' && 'Slow down connections'}
                              {action === 'add-to-list' && 'Add IP to address list'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            {/* Conditional fields for add-to-list action */}
            {visibleFields.addressList && (
              <>
                <FormField
                  name="addressList"
                  label="Address List"
                  description="Target list for blocked IPs"
                  required
                >
                  <Controller
                    name="addressList"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        {addressLists.length > 0 ? (
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select address list" />
                            </SelectTrigger>
                            <SelectContent>
                              {addressLists.map((list) => (
                                <SelectItem key={list} value={list} className="h-11">
                                  {list}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            {...field}
                            placeholder="e.g., rate-limited"
                            className="h-11"
                            value={field.value || ''}
                          />
                        )}
                        {addressListExists === false && field.value && (
                          <p className="text-xs text-warning flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            List will be created automatically
                          </p>
                        )}
                      </div>
                    )}
                  />
                </FormField>

                <FormField
                  name="addressListTimeout"
                  label="Timeout"
                  description="How long to keep IPs in list"
                >
                  <Controller
                    name="addressListTimeout"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select timeout" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEOUT_PRESETS.map((preset: { value: string; label: string }) => (
                            <SelectItem key={preset.value} value={preset.value} className="h-11">
                              {preset.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              </>
            )}
          </Card>

          {/* Source Matching */}
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Network className="h-4 w-4" />
              Source Matching
            </h3>

            <FormField
              name="srcAddress"
              label="Source Address"
              description="IP or CIDR (optional)"
            >
              <Controller
                name="srcAddress"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="192.168.1.0/24 or leave empty"
                    className="h-11"
                    value={field.value || ''}
                  />
                )}
              />
            </FormField>

            <FormField
              name="comment"
              label="Comment"
              description="Optional description"
            >
              <Controller
                name="comment"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="e.g., Protect SSH"
                    className="h-11"
                    value={field.value || ''}
                  />
                )}
              />
            </FormField>
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
                onClick={editor.handleSubmit}
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

RateLimitRuleEditorMobile.displayName = 'RateLimitRuleEditorMobile';
