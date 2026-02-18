import { Card, CardHeader, CardTitle, CardContent } from '@nasnet/ui/primitives';
import { Button } from '@nasnet/ui/primitives';
import { Loader2, Save } from 'lucide-react';
import { DynamicField } from './DynamicField';
import type { UseServiceConfigFormReturn } from '../../hooks/useServiceConfigForm';

export interface ServiceConfigFormMobileProps {
  /** Hook return value from useServiceConfigForm */
  formState: UseServiceConfigFormReturn;

  /** Title for the form */
  title?: string;

  /** Whether the form is in read-only mode */
  readOnly?: boolean;
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
 */
export function ServiceConfigFormMobile({
  formState,
  title = 'Configuration',
  readOnly,
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

  if (loading.schema || loading.config) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No configuration schema available
      </div>
    );
  }

  // Group fields by the 'group' property
  const groupedFields = visibleFields.reduce(
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

  return (
    <div className="pb-20">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {Object.entries(groupedFields).map(([groupName, fields]) => (
          <Card key={groupName}>
            <CardHeader>
              <CardTitle className="text-base">{groupName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
          <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
            <Button
              type="submit"
              className="w-full h-11"
              disabled={isSubmitting || isValidating}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
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
