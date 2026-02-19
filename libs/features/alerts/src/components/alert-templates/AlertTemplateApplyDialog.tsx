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
} from '@nasnet/ui/primitives';
import { useMediaQuery } from '@nasnet/ui/primitives';
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

export interface AlertTemplateApplyDialogProps {
  /** Template ID to apply */
  templateId: string | null;

  /** Open state */
  open: boolean;

  /** Callback when dialog is closed */
  onClose: () => void;

  /** Callback when template is successfully applied */
  onSuccess?: (alertRuleId: string) => void;

  /** Callback when application fails */
  onError?: (error: string) => void;
}

// =============================================================================
// Variable Input Component
// =============================================================================

interface VariableInputProps {
  variable: AlertRuleTemplateVariable;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
}

function VariableInput({ variable, value, onChange, error }: VariableInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;

    // Convert to number for INTEGER/DURATION/PERCENTAGE types
    if (variable.type !== 'STRING') {
      const num = parseInt(val, 10);
      onChange(isNaN(num) ? '' : num);
    } else {
      onChange(val);
    }
  };

  const inputProps = {
    id: variable.name,
    value: value?.toString() || '',
    onChange: handleChange,
    className: cn('min-h-[44px]', error && 'border-destructive'),
    'aria-invalid': !!error,
    'aria-describedby': error ? `${variable.name}-error` : undefined,
  };

  // Determine input type based on variable type
  const getInputType = () => {
    switch (variable.type) {
      case 'INTEGER':
      case 'DURATION':
      case 'PERCENTAGE':
        return 'number';
      default:
        return 'text';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={variable.name} className="text-sm font-medium">
        {variable.label}
        {variable.required && <span className="text-destructive ml-1">*</span>}
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
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {variable.defaultValue && (
          <span>Default: <code>{variable.defaultValue}</code></span>
        )}
        {variable.min !== undefined && <span>Min: {variable.min}</span>}
        {variable.max !== undefined && <span>Max: {variable.max}</span>}
        {variable.unit && <span>Unit: {variable.unit}</span>}
      </div>

      {variable.description && (
        <p className="text-xs text-muted-foreground">{variable.description}</p>
      )}

      {error && (
        <p id={`${variable.name}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Preview Section Component
// =============================================================================

interface PreviewSectionProps {
  templateId: string;
  variables: Record<string, string | number>;
}

function PreviewSection({ templateId, variables }: PreviewSectionProps) {
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
      <div className="space-y-2">
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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
        <span className="text-sm font-medium text-success">
          Preview Valid - Ready to Apply
        </span>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Resolved Conditions ({resolvedConditions.length})</Label>
        {resolvedConditions.map((condition, index) => (
          <Card key={index} className="bg-muted/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <code className="font-medium text-xs bg-background px-2 py-1 rounded">
                  {condition.field}
                </code>
                <Badge variant="outline" className="text-xs">
                  {operatorLabels[condition.operator] || condition.operator}
                </Badge>
                <code className="text-xs bg-primary/10 px-2 py-1 rounded font-medium">
                  {condition.value}
                </code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Form Content Component
// =============================================================================

interface FormContentProps {
  template: AlertRuleTemplate;
  form: any; // UseFormReturn - typed as any to avoid generic variance issues
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
}

function FormContent({ template, form, onSubmit, loading }: FormContentProps) {
  const variables = form.watch('variables');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
        {/* Template info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
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
            <div className="space-y-4">
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
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Preview</h4>
          <PreviewSection templateId={template.id} variables={variables || {}} />
        </div>

        <Separator />

        {/* Customizations */}
        <div className="space-y-4">
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
        <DialogFooter className="gap-2">
          <Button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto min-h-[44px]"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {loading ? 'Creating Alert Rule...' : 'Apply Template'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * AlertTemplateApplyDialog - Apply template with form and preview
 *
 * Complete workflow for applying an alert rule template:
 * 1. Fetch template data
 * 2. Generate dynamic form from variables
 * 3. Validate inputs with Zod
 * 4. Show real-time preview of resolved conditions
 * 5. Apply template with optimistic update
 * 6. Handle errors gracefully
 *
 * @param props - Component props
 */
export function AlertTemplateApplyDialog(props: AlertTemplateApplyDialogProps) {
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

  const handleSubmit = async (data: ApplyAlertRuleTemplateInput) => {
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
  };

  // Loading state
  if (templateLoading) {
    const content = (
      <div className="space-y-4 p-4">
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
      <div className="p-1">
        <FormContent
          template={template}
          form={form as any}
          onSubmit={handleSubmit}
          loading={applying}
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
