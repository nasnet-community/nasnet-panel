import React, { useCallback, useMemo } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Icon } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import { DynamicField } from './DynamicField';
import type { UseServiceConfigFormReturn } from '../../hooks/useServiceConfigForm';

export interface ServiceConfigFormMobileProps {
  /** Hook return value from useServiceConfigForm */
  formState: UseServiceConfigFormReturn;

  /** Title for the form */
  title?: string;

  /** Whether the form is in read-only mode */
  readOnly?: boolean;

  /** Optional CSS class name for the container */
  className?: string;
}

/**
 * Mobile presenter for service configuration form
 *
 * Mobile-specific features:
 * - Accordion-style layout with collapsible groups
 * - Full-width inputs (single column)
 * - 44px minimum touch targets
 * - Bottom sticky action buttons
 * - Simplified layout for small screens
 *
 * @example
 * ```tsx
 * const formState = useServiceConfigForm({ ... });
 * <ServiceConfigFormMobile
 *   formState={formState}
 *   title="Configure Service"
 * />
 * ```
 */
export const ServiceConfigFormMobile = React.memo(
  function ServiceConfigFormMobile({
    formState,
    title = 'Configuration',
    readOnly,
    className,
  }: ServiceConfigFormMobileProps) {
    const {
      schema,
      form,
      visibleFields,
      handleSubmit,
      isSubmitting,
      isValidating,
      loading,
    } = formState;

    // Memoize grouped fields to prevent unnecessary recalculation
    const groupedFields = useMemo(() => {
      return visibleFields.reduce(
        (acc, field) => {
          const groupName = field.group || 'General';
          if (!acc[groupName]) {
            acc[groupName] = [];
          }
          acc[groupName].push(field);
          return acc;
        },
        {} as Record<string, typeof visibleFields>
      );
    }, [visibleFields]);

    const handleFormSubmit = useCallback(
      async (data: unknown) => {
        await handleSubmit();
      },
      [handleSubmit]
    );

    if (loading.schema || loading.config) {
      return (
        <div className="flex items-center justify-center p-component-lg">
          <Icon
            icon={Loader2}
            className="h-6 w-6 animate-spin text-primary"
            aria-hidden="true"
          />
          <span className="sr-only">Loading configuration...</span>
        </div>
      );
    }

    if (!schema) {
      return (
        <div className="p-component-sm text-center text-muted-foreground">
          No configuration schema available
        </div>
      );
    }

    return (
      <div className={cn('pb-20 space-y-component-md', className)}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-component-md">
          {Object.entries(groupedFields).map(([groupName, fields]) => (
            <Card key={groupName}>
              <CardHeader>
                <CardTitle className="text-base">{groupName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-component-md">
                {(fields as any[]).map((field: any) => (
                  <DynamicField
                    key={field.name}
                    field={field}
                    form={form}
                    disabled={readOnly}
                  />
                ))}
              </CardContent>
            </Card>
          ))}

          {!readOnly && (
            <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-component-sm">
              <Button
                type="submit"
                className="w-full min-h-[44px]"
                disabled={isSubmitting || isValidating}
                aria-label={
                  isSubmitting
                    ? 'Applying configuration'
                    : 'Save configuration'
                }
              >
                {isSubmitting ? (
                  <>
                    <Icon
                      icon={Loader2}
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Applying...
                  </>
                ) : (
                  <>
                    <Icon
                      icon={Save}
                      className="mr-2 h-4 w-4"
                      aria-hidden="true"
                    />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </div>
    );
  }
);

ServiceConfigFormMobile.displayName = 'ServiceConfigFormMobile';
