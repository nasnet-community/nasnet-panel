/**
 * RawRuleEditorMobile - Mobile Platform Presenter
 *
 * Sheet-based form with card sections and 44px touch targets.
 * Optimized for thumb navigation and simplified layout.
 *
 * @module @nasnet/ui/patterns/raw-rule-editor
 */

import { memo } from 'react';

import {
  Zap,
  Shield,
  Settings,
  Info,
  Trash2,
} from 'lucide-react';
import { Controller, FormProvider } from 'react-hook-form';

import {
  RawChainSchema,
  RawActionSchema,
  RawProtocolSchema,
  getRawActionDescription as getActionDescription,
  RAW_SUGGESTED_LOG_PREFIXES as SUGGESTED_LOG_PREFIXES,
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
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
  Badge,
  Alert,
  AlertDescription,
} from '@nasnet/ui/primitives';

import { RHFFormField, type RHFFormFieldProps } from '../rhf-form-field';
import { useRawRuleEditor } from './use-raw-rule-editor';

import type { RawRuleEditorProps } from './raw-rule-editor.types';

// Force FieldValues default to prevent generic inference issues across multiple JSX usages
type FormFieldProps = RHFFormFieldProps;
const FormField = RHFFormField as React.FC<FormFieldProps>;

/**
 * Mobile presenter for RAW rule editor.
 *
 * Features:
 * - Sheet with card-based sections
 * - 44px minimum touch targets
 * - Simplified layout for small screens
 * - Bottom-sheet style
 */
export const RawRuleEditorMobile = memo(function RawRuleEditorMobile({
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
}: RawRuleEditorProps) {
  const editor = useRawRuleEditor({
    initialRule,
    onSubmit: onSave,
  });

  const { form, rule, preview, visibleFields, canUseOutInterface, canUseInInterface } = editor;
  const { control, formState } = form;

  const showNotrackTip = showPerformanceTips && rule.action === 'notrack';

  return (
    <FormProvider {...form}>
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {mode === 'create' ? 'Create RAW Rule' : 'Edit RAW Rule'}
          </SheetTitle>
          <SheetDescription>
            Configure RAW rules for performance or early packet dropping
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={editor.onSubmit} className="space-y-4 py-4">
          {/* Preview */}
          <Card className="bg-info/10 border-info/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-info mb-1">Preview</p>
                  <p className="text-xs text-muted-foreground font-mono break-words">
                    {preview}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notrack Tip */}
          {showNotrackTip && (
            <Alert variant="warning">
              <Zap className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Notrack skips connection tracking for performance. Use for trusted high-bandwidth traffic.
              </AlertDescription>
            </Alert>
          )}

          {/* Chain & Action Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Chain & Action
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField name="chain" label="Chain" required>
                <Controller
                  name="chain"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RawChainSchema.options.map((chain: string) => (
                          <SelectItem key={chain} value={chain} className="py-3">
                            {chain}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField name="action" label="Action" required>
                <Controller
                  name="action"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RawActionSchema.options.map((action) => (
                          <SelectItem key={action} value={action} className="py-3">
                            <div className="flex flex-col">
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
              </FormField>

              {/* Action-Specific Fields */}
              {visibleFields.includes('logPrefix') && (
                <FormField name="logPrefix" label="Log Prefix" required>
                  <Controller
                    name="logPrefix"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Input
                          {...field}
                          placeholder="RAW-DROP-"
                          value={field.value || ''}
                          className="h-11"
                        />
                        <div className="flex flex-wrap gap-2">
                          {SUGGESTED_LOG_PREFIXES.map((suggestion: { value: string }) => (
                            <Button
                              key={suggestion.value}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => field.onChange(suggestion.value)}
                              className="h-11"
                            >
                              {suggestion.value}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  />
                </FormField>
              )}

              {visibleFields.includes('jumpTarget') && (
                <FormField name="jumpTarget" label="Jump Target" required>
                  <Controller
                    name="jumpTarget"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="custom-chain"
                        value={field.value || ''}
                        className="h-11"
                      />
                    )}
                  />
                </FormField>
              )}
            </CardContent>
          </Card>

          {/* Traffic Matchers Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Traffic Matchers (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField name="protocol" label="Protocol">
                <Controller
                  name="protocol"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        {RawProtocolSchema.options.map((protocol: string) => (
                          <SelectItem key={protocol} value={protocol} className="py-3">
                            {protocol.toUpperCase()}
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

              <FormField name="srcPort" label="Source Port">
                <Controller
                  name="srcPort"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="1024-65535"
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
                      placeholder="80,443"
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
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField name="comment" label="Comment">
                <Controller
                  name="comment"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Rule description"
                      value={field.value || ''}
                      className="h-11"
                    />
                  )}
                />
              </FormField>

              <FormField name="disabled" label="Disabled">
                <Controller
                  name="disabled"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Disable this rule</span>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </div>
                  )}
                />
              </FormField>
            </CardContent>
          </Card>
        </form>

        <SheetFooter className="flex flex-col gap-2 pt-4">
          {mode === 'edit' && onDelete && (
            <Button
              type="button"
              variant="destructive"
              size="lg"
              onClick={onDelete}
              disabled={isDeleting || isSaving}
              className="w-full h-11"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Rule
            </Button>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={editor.onSubmit}
              disabled={!formState.isValid || isSaving || isDeleting}
              className="flex-1 h-11"
            >
              {isSaving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    </FormProvider>
  );
});

RawRuleEditorMobile.displayName = 'RawRuleEditorMobile';
