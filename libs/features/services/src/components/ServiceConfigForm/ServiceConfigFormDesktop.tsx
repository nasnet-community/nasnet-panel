import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@nasnet/ui/primitives';
import { Button } from '@nasnet/ui/primitives';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@nasnet/ui/primitives';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { DynamicField } from './DynamicField';
import type { UseServiceConfigFormReturn } from '../../hooks/useServiceConfigForm';

export interface ServiceConfigFormDesktopProps {
  /** Hook return value from useServiceConfigForm */
  formState: UseServiceConfigFormReturn;

  /** Title for the form */
  title?: string;

  /** Description for the form */
  description?: string;

  /** Whether the form is in read-only mode */
  readOnly?: boolean;

  /** Callback when cancel is clicked */
  onCancel?: () => void;
}

/**
 * Desktop presenter for service configuration form
 *
 * Desktop-specific features:
 * - Tabbed layout with groups as tabs
 * - 2-column grid for fields (responsive)
 * - Inline action buttons (Save + Cancel)
 * - Denser layout with more information density
 * - Keyboard shortcuts support
 */
export function ServiceConfigFormDesktop({
  formState,
  title = 'Service Configuration',
  description,
  readOnly,
  onCancel,
}: ServiceConfigFormDesktopProps) {
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
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!schema) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No configuration schema available
        </CardContent>
      </Card>
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

  const groups = Object.keys(groupedFields);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardContent>
          {groups.length === 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleFields.map((field) => (
                <div
                  key={field.name}
                  className={field.type === 'TEXT_AREA' ? 'md:col-span-2' : ''}
                >
                  <DynamicField field={field} form={form} disabled={readOnly} />
                </div>
              ))}
            </div>
          ) : (
            <Tabs defaultValue={groups[0]} className="w-full">
              <TabsList>
                {groups.map((group) => (
                  <TabsTrigger key={group} value={group}>
                    {group}
                  </TabsTrigger>
                ))}
              </TabsList>

              {groups.map((group) => (
                <TabsContent key={group} value={group} className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groupedFields[group].map((field) => (
                      <div
                        key={field.name}
                        className={
                          field.type === 'TEXT_AREA' ? 'md:col-span-2' : ''
                        }
                      >
                        <DynamicField
                          field={field}
                          form={form}
                          disabled={readOnly}
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>

        {!readOnly && (
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                onCancel?.();
              }}
              disabled={isSubmitting}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting || isValidating}>
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
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
