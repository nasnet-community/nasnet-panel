/**
 * AlertTemplateApplyDialog Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Full-featured dialog for applying an alert rule template.
 * Includes dynamic variable input form, real-time validation, and condition preview.
 *
 * Features:
 * - Fetches template data using useAlertRuleTemplate hook
 * - Dynamic form generation based on template variables
 * - React Hook Form + Zod validation
 * - Real-time preview of resolved conditions
 * - Responsive (Dialog for desktop, Sheet for mobile)
 * - Optimistic mutations with error handling
 */

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Textarea,
  cn,
  useMediaQuery,
  Icon,
} from '@nasnet/ui/primitives';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

import {
  useAlertRuleTemplate,
  usePreviewAlertRuleTemplate,
  useApplyAlertRuleTemplate,
  type AlertRuleTemplate,
  type AlertRuleTemplateVariable,
  applyAlertRuleTemplateInputSchema,
  type ApplyAlertRuleTemplateInput,
} from '../..';

// =============================================================================
// Props Interface
// =============================================================================

/**
 * Props for AlertTemplateApplyDialog component
 */
export interface AlertTemplateApplyDialogProps {
  /** @description Template ID to apply */
  templateId: string | null;

  /** @description Open state (controlled) */
  open: boolean;

  /** @description Callback when dialog is closed */
  onClose: () => void;

  /** @description Callback when template is successfully applied */
  onSuccess?: (alertRuleId: string) => void;

  /** @description Callback when application fails */
  onError?: (error: string) => void;
}

// =============================================================================
// Variable Input Component
// =============================================================================

/**
 * Props for VariableInput component
 */
interface VariableInputProps {
  /** @description Variable definition */
  variable: AlertRuleTemplateVariable;
  /** @description Current variable value */
  value: string | number;
  /** @description Callback when value changes */
  onChange: (value: string | number) => void;
  /** @description Validation error message */
  error?: string;
}

/**
 * VariableInput - Type-specific input for template variables
 */
const VariableInput = React.memo(function VariableInput({
  variable,
  value,
  onChange,
  error,
}: VariableInputProps) {
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;

    // Convert to number for INTEGER/DURATION/PERCENTAGE types
    if (variable.type !== 'STRING') {
      const num = parseInt(val, 10);
      onChange(isNaN(num) ? '' : num);
    } else {
      onChange(val);
    }
  }, [variable.type, onChange]);

  const inputProps = React.useMemo(() => ({
    id: variable.name,
    value: value?.toString() || '',
    onChange: handleChange,
    className: cn('min-h-[44px]', error && 'border-error focus-visible:ring-error/50'),
    'aria-invalid': !!error,
    'aria-describedby': error ? `${variable.name}-error` : undefined,
  }), [variable.name, value, error, handleChange]);

  // Determine input type based on variable type
  const getInputType = React.useCallback(() => {
    switch (variable.type) {
      case 'INTEGER':
      case 'DURATION':
      case 'PERCENTAGE':
        return 'number';
      default:
        return 'text';
    }
  }, [variable.type]);

  return (
    <div className="space-y-component-sm">
      <Label htmlFor={variable.name} className="text-sm font-medium">
        {variable.label}
        {variable.required && <span className="text-error ml-component-sm">*</span>}
      </Label>

      {variable.type === 'STRING' && variable.description ? (
        <Textarea {...inputProps} placeholder={variable.defaultValue} rows={3} />
      ) : (
        <Input
          {...inputProps}
          type={getInputType()}
          placeholder={variable.defaultValue}
          min={variable.min}
          max={variable.max}
        />
      )}

      {/* Variable constraints */}
      <div className="flex items-center gap-component-md text-xs text-muted-foreground">
        {variable.defaultValue && (
          <span>Default: <code className="font-mono text-xs">{variable.defaultValue}</code></span>
        )}
        {variable.min !== undefined && <span>Min: {variable.min}</span>}
        {variable.max !== undefined && <span>Max: {variable.max}</span>}
        {variable.unit && <span>Unit: {variable.unit}</span>}
      </div>

      {variable.description && (
        <p className="text-xs text-muted-foreground">{variable.description}</p>
      )}

      {error && (
        <p id={`${variable.name}-error`} className="text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

VariableInput.displayName = 'VariableInput';

// =============================================================================
// Preview Section Component
// =============================================================================

/**
 * Props for PreviewSection component
 */
interface PreviewSectionProps {
  /** @description Template ID to preview */
  templateId: string;
  /** @description Variable values for preview */
  variables: Record<string, string | number>;
}

/**
 * PreviewSection - Real-time preview of resolved conditions
 */
const PreviewSection = React.memo(function PreviewSection({
  templateId,
  variables,
}: PreviewSectionProps) {
  const { data, loading, error } = usePreviewAlertRuleTemplate(templateId, variables, {
    enabled: Object.keys(variables).length > 0,
  });

  const preview = data?.previewAlertRuleTemplate.preview;
  const validationInfo = preview?.validationInfo;
  const resolvedConditions = preview?.resolvedConditions || [];

  const operatorLabels: Record<string, string> = {
    EQUALS: '=',
    NOT_EQUALS: '≠',
    GREATER_THAN: '>',
    LESS_THAN: '<',
    CONTAINS: 'contains',
    REGEX: 'matches regex',
  };

  if (Object.keys(variables).length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription className="text-sm">
          Fill in the variables above to preview the resolved conditions
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="space-y-component-sm">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription className="text-sm">{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!validationInfo?.isValid) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>
          <p className="font-medium mb-2">Validation Errors:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {validationInfo?.missingVariables.map((variable) => (
              <li key={variable}>Missing required variable: {variable}</li>
            ))}
            {validationInfo?.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-component-sm">
      <div className="flex items-center gap-component-sm">
        <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
        <span className="text-sm font-medium text-success">
          Preview Valid - Ready to Apply
        </span>
      </div>

      <div className="space-y-component-sm">
        <Label className="text-sm font-medium">Resolved Conditions ({resolvedConditions.length})</Label>
        {resolvedConditions.map((condition, index) => (
          <Card key={index} className="bg-muted/50">
            <CardContent className="p-component-sm">
              <div className="flex items-center gap-component-sm text-sm flex-wrap">
                <code className="font-mono text-xs bg-background px-component-sm py-component-xs rounded-[var(--semantic-radius-button)]">
                  {condition.field}
                </code>
                <Badge variant="outline" className="text-xs">
                  {operatorLabels[condition.operator] || condition.operator}
                </Badge>
                <code className="font-mono text-xs bg-muted px-component-sm py-component-xs rounded-[var(--semantic-radius-button)]">
                  {condition.value}
                </code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

PreviewSection.displayName = 'PreviewSection';

// =============================================================================
// Form Content Component
// =============================================================================

/**
 * Props for FormContent component
 */
interface FormContentProps {
  /** @description Template to display form for */
  template: AlertRuleTemplate;
  /** @description Form instance from React Hook Form */
  form: any; // UseFormReturn - typed as any to avoid generic variance issues
  /** @description Callback when form is submitted */
  onSubmit: (data: any) => Promise<void>;
  /** @description Whether form is submitting */
  isLoading?: boolean;
}

/**
 * FormContent - Dynamic form for template variables and customizations
 */
const FormContent = React.memo(function FormContent({
  template,
  form,
  onSubmit,
  isLoading = false,
}: FormContentProps) {
  const variables = form.watch('variables');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-component-lg">
        {/* Template info */}
        <div className="space-y-component-sm">
          <div className="flex items-center gap-component-sm">
            <Badge variant="outline">{template.category}</Badge>
            <Badge variant="secondary">{template.severity}</Badge>
            {template.isBuiltIn && <Badge>Built-in</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </div>

        <Separator />

        {/* Variables form */}
        {template.variables.length > 0 && (
          <>
            <div className="space-y-component-md">
              <h4 className="text-sm font-semibold">Template Variables</h4>
              {template.variables.map((variable) => (
                <FormField
                  key={variable.name}
                  control={form.control}
                  name={`variables.${variable.name}`}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <VariableInput
                        variable={variable}
                        value={field.value as string | number}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <Separator />
          </>
        )}

        {/* Preview section */}
        <div className="space-y-component-sm">
          <h4 className="text-sm font-semibold">Preview</h4>
          <PreviewSection templateId={template.id} variables={variables || {}} />
        </div>

        <Separator />

        {/* Customizations */}
        <div className="space-y-component-md">
          <h4 className="text-sm font-semibold">Customizations (Optional)</h4>

          <FormField
            control={form.control}
            name="customizations.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rule Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={`${template.name} Rule`}
                    className="min-h-[44px]"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Optional: Override the default rule name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customizations.description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Optional description for this alert rule"
                    rows={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit button */}
        <DialogFooter className="gap-component-sm">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto min-h-[44px]"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {isLoading ? 'Creating Alert Rule...' : 'Apply Template'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
});

FormContent.displayName = 'FormContent';

// =============================================================================
// Main Component
// =============================================================================

/**
 * AlertTemplateApplyDialog - Apply template with form and preview
 *
 * @description Complete workflow for applying an alert rule template including
 * dynamic form generation, real-time preview, and optimistic mutations.
 *
 * @param props - Component props
 * @returns React component
 */
export const AlertTemplateApplyDialog = React.memo(
  function AlertTemplateApplyDialog(props: AlertTemplateApplyDialogProps) {
  const { templateId, open, onClose, onSuccess, onError } = props;

  const isDesktop = useMediaQuery('(min-width: 640px)');

  // Fetch template data
  const { data: templateData, loading: templateLoading, error: templateError } = useAlertRuleTemplate(
    templateId || '',
    { enabled: !!templateId && open }
  );

  const template = templateData?.alertRuleTemplate;

  // Apply template mutation
  const [applyTemplate, { loading: applying }] = useApplyAlertRuleTemplate();

  // Form setup
  const form = useForm<ApplyAlertRuleTemplateInput>({
    resolver: zodResolver(applyAlertRuleTemplateInputSchema) as any,
    defaultValues: {
      templateId: templateId || '',
      variables: template?.variables.reduce((acc, variable) => {
        if (variable.defaultValue) {
          acc[variable.name] = variable.defaultValue;
        }
        return acc;
      }, {} as Record<string, string | number>) || {},
      customizations: {
        enabled: true,
      },
    },
  });

  // Reset form when template changes
  React.useEffect(() => {
    if (template) {
      form.reset({
        templateId: template.id,
        variables: template.variables.reduce((acc, variable) => {
          if (variable.defaultValue) {
            acc[variable.name] = variable.defaultValue;
          }
          return acc;
        }, {} as Record<string, string | number>),
        customizations: {
          enabled: true,
        },
      });
    }
  }, [template, form]);

  const handleSubmit = React.useCallback(
    async (data: ApplyAlertRuleTemplateInput) => {
      try {
        const result = await applyTemplate({ variables: data });
        const alertRule = result.data?.applyAlertRuleTemplate.alertRule;
        const errors = result.data?.applyAlertRuleTemplate.errors;

        if (alertRule) {
          onSuccess?.(alertRule.id);
          onClose();
        } else if (errors && errors.length > 0) {
          onError?.(errors.map((e: { message: string }) => e.message).join(', '));
        }
      } catch (error: any) {
        onError?.(error?.message || 'Failed to apply template');
      }
    },
    [applyTemplate, onSuccess, onClose, onError]
  );

  // Loading state
  if (templateLoading) {
    const content = (
      <div className="space-y-component-md p-component-md">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Separator />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );

    return isDesktop ? (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Apply Template</DialogTitle>
            <DialogDescription>Loading template...</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    ) : (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="max-h-[90vh]">
          <SheetHeader>
            <SheetTitle>Apply Template</SheetTitle>
            <SheetDescription>Loading template...</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  // Error state
  if (templateError || !template) {
    const errorContent = (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>
          {templateError?.message || 'Failed to load template'}
        </AlertDescription>
      </Alert>
    );

    return isDesktop ? (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Apply Template</DialogTitle>
          </DialogHeader>
          {errorContent}
        </DialogContent>
      </Dialog>
    ) : (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Apply Template</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{errorContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  const formContent = (
    <ScrollArea className="max-h-[calc(90vh-8rem)]">
      <div className="p-component-sm">
        <FormContent
          template={template}
          form={form as any}
          onSubmit={handleSubmit}
          isLoading={applying}
        />
      </div>
    </ScrollArea>
  );

  // Desktop: Use Dialog
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{template.name}</DialogTitle>
            <DialogDescription>
              Configure variables and apply this template
            </DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Use Sheet
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="max-h-[90vh]">
        <SheetHeader>
          <SheetTitle>{template.name}</SheetTitle>
          <SheetDescription>
            Configure variables and apply this template
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">{formContent}</div>
      </SheetContent>
    </Sheet>
  );
  }
);

AlertTemplateApplyDialog.displayName = 'AlertTemplateApplyDialog';
