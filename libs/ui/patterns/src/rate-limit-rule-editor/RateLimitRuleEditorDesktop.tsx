/**
 * RateLimitRuleEditorDesktop - Desktop Platform Presenter
 *
 * Dialog-based form with inline layout and live preview panel.
 * Optimized for keyboard navigation and dense data entry.
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
  Badge,
  Separator,
} from '@nasnet/ui/primitives';

import { useRateLimitEditor } from '../rate-limit-editor/use-rate-limit-editor';
import { RHFFormField, type RHFFormFieldProps } from '../rhf-form-field';

import type { RateLimitRuleEditorProps } from './types';

// Force FieldValues default to prevent generic inference issues across multiple JSX usages
type FormFieldProps = RHFFormFieldProps;
const FormField = RHFFormField as React.FC<FormFieldProps>;

/**
 * Desktop presenter for rate limit rule editor.
 *
 * Features:
 * - Dialog with inline form layout
 * - Live preview panel showing rule description
 * - Action-specific field groups (addressList + timeout for add-to-list)
 * - Address list autocomplete
 * - Connection limit presets
 */
export const RateLimitRuleEditorDesktop = memo(function RateLimitRuleEditorDesktop({
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

    if (action === 'drop') return 'error';
    if (action === 'tarpit') return 'warning';
    if (action === 'add-to-list') return 'info';
    return 'default';
  }, [rule.action]);

  return (
    <FormProvider {...form}>
      <Dialog
        open={open}
        onOpenChange={onClose}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="text-primary h-5 w-5" />
              {mode === 'create' ? 'Create Rate Limit Rule' : 'Edit Rate Limit Rule'}
            </DialogTitle>
            <DialogDescription>
              Configure connection rate limiting to protect against DDoS and flooding attacks
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={editor.handleSubmit}
            className="space-y-6"
          >
            {/* Live Preview */}
            <Card className="p-component-md bg-info-light border-info/20 border-t-category-firewall rounded-[var(--semantic-radius-card)] border border-t-2">
              <div className="flex items-start gap-3">
                <Info className="text-info mt-0.5 h-5 w-5" />
                <div className="min-w-0 flex-1">
                  <p className="text-info-dark mb-1 text-xs font-semibold">Rule Preview</p>
                  <p className="text-muted-foreground break-words font-mono text-xs">{preview}</p>
                </div>
                <Badge variant={actionBadgeVariant}>{rule.action || 'No action'}</Badge>
              </div>
            </Card>

            {/* Rate Limit Configuration */}
            <div className="space-y-component-md">
              <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                <Clock className="h-4 w-4" />
                Rate Limit Configuration
              </h3>

              <div className="gap-component-md grid grid-cols-2">
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
                              className="h-7 text-xs"
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time window" />
                        </SelectTrigger>
                        <SelectContent>
                          {TimeWindowSchema.options.map((window: string) => (
                            <SelectItem
                              key={window}
                              value={window}
                            >
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
              </div>
            </div>

            <Separator />

            {/* Action Configuration */}
            <div className="space-y-component-md">
              <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                <AlertCircle className="h-4 w-4" />
                Action Configuration
              </h3>

              <FormField
                name="action"
                label="Action"
                description="What to do when rate limit is exceeded"
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        {RateLimitActionSchema.options.map((action: string) => (
                          <SelectItem
                            key={action}
                            value={action}
                          >
                            {action === 'drop' && 'Drop - Block connections immediately'}
                            {action === 'tarpit' && 'Tarpit - Slow down connections'}
                            {action === 'add-to-list' && 'Add to List - Add IP to address list'}
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
                    description="Target address list for blocked IPs"
                    required
                  >
                    <Controller
                      name="addressList"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2">
                          {addressLists.length > 0 ?
                            <Select
                              value={field.value || ''}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select address list" />
                              </SelectTrigger>
                              <SelectContent>
                                {addressLists.map((list) => (
                                  <SelectItem
                                    key={list}
                                    value={list}
                                  >
                                    {list}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          : <Input
                              {...field}
                              placeholder="e.g., rate-limited"
                              value={field.value || ''}
                            />
                          }
                          {addressListExists === false && field.value && (
                            <p className="text-warning flex items-center gap-1 text-xs">
                              <AlertCircle className="h-3 w-3" />
                              Address list will be created automatically
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </FormField>

                  <FormField
                    name="addressListTimeout"
                    label="Timeout"
                    description="How long to keep IPs in the list"
                  >
                    <Controller
                      name="addressListTimeout"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2">
                          <Select
                            value={field.value || ''}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select timeout" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIMEOUT_PRESETS.map((preset: { value: string; label: string }) => (
                                <SelectItem
                                  key={preset.value}
                                  value={preset.value}
                                >
                                  {preset.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    />
                  </FormField>
                </>
              )}
            </div>

            <Separator />

            {/* Source Matching */}
            <div className="space-y-component-md">
              <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                <Network className="h-4 w-4" />
                Source Matching (optional)
              </h3>

              <FormField
                name="srcAddress"
                label="Source Address"
                description="IP or CIDR to match (leave empty for any)"
              >
                <Controller
                  name="srcAddress"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="192.168.1.0/24 or leave empty for any"
                      value={field.value || ''}
                    />
                  )}
                />
              </FormField>

              <FormField
                name="comment"
                label="Comment"
                description="Optional description for this rule"
              >
                <Controller
                  name="comment"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., Protect SSH from brute force"
                      value={field.value || ''}
                    />
                  )}
                />
              </FormField>
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
                  <Trash2 className="mr-2 h-4 w-4" />
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
                onClick={editor.handleSubmit}
                disabled={!formState.isValid || isSaving || isDeleting}
              >
                {isSaving ?
                  'Saving...'
                : mode === 'create' ?
                  'Create Rule'
                : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
});

RateLimitRuleEditorDesktop.displayName = 'RateLimitRuleEditorDesktop';
