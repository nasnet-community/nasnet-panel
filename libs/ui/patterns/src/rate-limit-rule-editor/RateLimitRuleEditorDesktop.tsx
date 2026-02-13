/**
 * RateLimitRuleEditorDesktop - Desktop Platform Presenter
 *
 * Dialog-based form with inline layout and live preview panel.
 * Optimized for keyboard navigation and dense data entry.
 *
 * @module @nasnet/ui/patterns/rate-limit-rule-editor
 */

import { memo, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { Shield, AlertCircle, Info, Trash2, Clock, Network } from 'lucide-react';

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
  Badge,
  Separator,
  Label,
} from '@nasnet/ui/primitives';
import { RHFFormField } from '@nasnet/ui/patterns/rhf-form-field';

import {
  RateLimitActionSchema,
  TimeWindowSchema,
  TIMEOUT_PRESETS,
  CONNECTION_LIMIT_PRESETS,
} from '@nasnet/core/types/firewall';

import { useRateLimitEditor } from '../rate-limit-editor/use-rate-limit-editor';
import type { RateLimitRuleEditorProps } from './types';

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
  const actionBadgeVariant = useMemo(() => {
    const action = rule.action;
    if (!action) return 'default';

    if (action === 'drop') return 'destructive';
    if (action === 'tarpit') return 'warning';
    if (action === 'add-to-list') return 'info';
    return 'default';
  }, [rule.action]);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {mode === 'create' ? 'Create Rate Limit Rule' : 'Edit Rate Limit Rule'}
            </DialogTitle>
            <DialogDescription>
              Configure connection rate limiting to protect against DDoS and flooding attacks
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editor.handleSubmit} className="space-y-6">
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

            {/* Rate Limit Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Rate Limit Configuration
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <RHFFormField
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
                </RHFFormField>

                <RHFFormField
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
                        <SelectTrigger>
                          <SelectValue placeholder="Select time window" />
                        </SelectTrigger>
                        <SelectContent>
                          {TimeWindowSchema.options.map((window) => (
                            <SelectItem key={window} value={window}>
                              {window === 'per-second' && 'Per Second'}
                              {window === 'per-minute' && 'Per Minute'}
                              {window === 'per-hour' && 'Per Hour'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </RHFFormField>
              </div>
            </div>

            <Separator />

            {/* Action Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Action Configuration
              </h3>

              <RHFFormField
                name="action"
                label="Action"
                description="What to do when rate limit is exceeded"
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
                        {RateLimitActionSchema.options.map((action) => (
                          <SelectItem key={action} value={action}>
                            {action === 'drop' && 'Drop - Block connections immediately'}
                            {action === 'tarpit' && 'Tarpit - Slow down connections'}
                            {action === 'add-to-list' && 'Add to List - Add IP to address list'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </RHFFormField>

              {/* Conditional fields for add-to-list action */}
              {visibleFields.addressList && (
                <>
                  <RHFFormField
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
                          {addressLists.length > 0 ? (
                            <Select value={field.value || ''} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select address list" />
                              </SelectTrigger>
                              <SelectContent>
                                {addressLists.map((list) => (
                                  <SelectItem key={list} value={list}>
                                    {list}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              {...field}
                              placeholder="e.g., rate-limited"
                              value={field.value || ''}
                            />
                          )}
                          {addressListExists === false && field.value && (
                            <p className="text-xs text-warning flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Address list will be created automatically
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </RHFFormField>

                  <RHFFormField
                    name="addressListTimeout"
                    label="Timeout"
                    description="How long to keep IPs in the list"
                  >
                    <Controller
                      name="addressListTimeout"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2">
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timeout" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIMEOUT_PRESETS.map((preset) => (
                                <SelectItem key={preset.value} value={preset.value}>
                                  {preset.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    />
                  </RHFFormField>
                </>
              )}
            </div>

            <Separator />

            {/* Source Matching */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Network className="h-4 w-4" />
                Source Matching (optional)
              </h3>

              <RHFFormField
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
              </RHFFormField>

              <RHFFormField
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
              </RHFFormField>
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
                onClick={editor.handleSubmit}
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

RateLimitRuleEditorDesktop.displayName = 'RateLimitRuleEditorDesktop';
