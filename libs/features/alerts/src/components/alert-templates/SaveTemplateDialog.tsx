/**
 * SaveTemplateDialog Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Dialog for saving an existing alert rule as a reusable template.
 * Allows users to name the template, add description, categorize it,
 * and optionally define variables for customization.
 *
 * @description Manages the save workflow: populate form with alert rule data,
 * allow customization, validate with Zod schema, and persist to backend.
 */

import React, { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@nasnet/ui/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from '@nasnet/ui/primitives';
import { useSaveCustomAlertRuleTemplate } from '@nasnet/api-client/queries';
import {
  customAlertRuleTemplateInputSchema,
  type CustomAlertRuleTemplateInput,
  type AlertRuleTemplateCategory,
} from '../../schemas/alert-rule-template.schema';
import { ALERT_TEMPLATE_CATEGORIES } from '../../utils/alert-template-categories';

// =============================================================================
// Props Interface
// =============================================================================

export interface SaveTemplateDialogProps {
  /** Whether the dialog is open */
  open: boolean;

  /** Callback when dialog is closed */
  onOpenChange: (open: boolean) => void;

  /** Alert rule to save as template */
  alertRule: {
    name: string;
    description: string;
    eventType: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    conditions: Array<{
      field: string;
      operator: string;
      value: string;
    }>;
    channels: string[];
    throttle?: {
      maxAlerts: number;
      periodSeconds: number;
      groupByField?: string;
    };
  };

  /** Callback when template is successfully saved */
  onTemplateSaved?: (templateId: string) => void;

  /** Optional CSS class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * SaveTemplateDialog - Save alert rule as reusable template
 *
 * Features:
 * - Pre-fills form with alert rule data
 * - Template naming and description
 * - Category selection (7 categories)
 * - Optional variable definitions for customization
 * - Validation with Zod schema
 * - Success/error feedback with toast notifications
 *
 * Workflow:
 * 1. User opens dialog from existing alert rule
 * 2. Form pre-filled with rule data
 * 3. User customizes name, description, category
 * 4. User optionally defines variables (future enhancement)
 * 5. Save creates custom template
 * 6. Template appears in browser with CUSTOM category
 *
 * @example
 * ```tsx
 * <SaveTemplateDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   alertRule={selectedRule}
 *   onTemplateSaved={(id) => console.log('Saved:', id)}
 * />
 * ```
 */
function SaveTemplateDialogComponent(props: SaveTemplateDialogProps) {
  const { open, onOpenChange, alertRule, onTemplateSaved, className } = props;

  const { toast } = useToast();

  // Save template mutation
  const [saveTemplate, { loading }] = useSaveCustomAlertRuleTemplate({
    onCompleted: (result) => {
      if (result.saveCustomAlertRuleTemplate.template) {
        toast({
          title: 'Template saved',
          description: `Successfully saved "${result.saveCustomAlertRuleTemplate.template.name}"`,
          variant: 'success',
        });
        onTemplateSaved?.(result.saveCustomAlertRuleTemplate.template.id);
        onOpenChange(false);
        form.reset();
      } else if (result.saveCustomAlertRuleTemplate.errors.length > 0) {
        toast({
          title: 'Failed to save template',
          description: result.saveCustomAlertRuleTemplate.errors[0].message,
          variant: 'error',
        });
      }
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save template',
        variant: 'error',
      });
    },
  });

  // Form with validation
  const form = useForm<CustomAlertRuleTemplateInput>({
    resolver: zodResolver(customAlertRuleTemplateInputSchema) as any,
    defaultValues: {
      name: alertRule.name,
      description: alertRule.description,
      category: 'CUSTOM',
      eventType: alertRule.eventType,
      severity: alertRule.severity,
      conditions: alertRule.conditions as any,
      channels: alertRule.channels,
      throttle: alertRule.throttle,
      variables: [],
    },
  });

  // Handle form submission with useCallback
  const onSubmit = useCallback(
    async (data: CustomAlertRuleTemplateInput) => {
      await saveTemplate({
        variables: {
          input: data,
        },
      });
    },
    [saveTemplate]
  );

  // Memoize available categories
  const categories = useMemo(
    () => Object.values(ALERT_TEMPLATE_CATEGORIES),
    []
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sm:max-w-[600px]', className)}>
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save this alert rule as a reusable template. Templates can be used to quickly create
            similar alert rules in the future.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Template Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., High CPU Alert" />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this template
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Template Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe what this template monitors and when it alerts..."
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Help others understand what this template is for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category Selection */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <span className={category.color}>{category.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Categorize this template for easier discovery
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Template'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

SaveTemplateDialogComponent.displayName = 'SaveTemplateDialog';

/**
 * Memoized save template dialog for preventing unnecessary re-renders.
 * @description Compares props shallowly to determine if re-render is needed.
 * Beneficial when parent component re-renders frequently.
 */
export const SaveTemplateDialog = React.memo(SaveTemplateDialogComponent);
