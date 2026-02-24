import React, { useCallback, useMemo } from 'react';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Icon,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
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

  /** Optional CSS class name for the container */
  className?: string;
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
 *
 * @example
 * ```tsx
 * const formState = useServiceConfigForm({ ... });
 * <ServiceConfigFormDesktop
 *   formState={formState}
 *   title="Configure Service"
 *   onCancel={() => navigate(-1)}
 * />
 * ```
 */
export const ServiceConfigFormDesktop = React.memo(
  function ServiceConfigFormDesktop({
    formState,
    title = 'Service Configuration',
    description,
    readOnly,
    onCancel,
    className,
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

    const groups = useMemo(() => Object.keys(groupedFields), [groupedFields]);

    // Wrap callbacks to ensure stable references
    const handleReset = useCallback(() => {
      form.reset();
      onCancel?.();
    }, [form, onCancel]);

    const handleFormSubmit = useCallback(
      async (data: unknown) => {
        await handleSubmit();
      },
      [handleSubmit]
    );

    if (loading.schema || loading.config) {
      return (
        <Card className={cn('w-full', className)}>
          <CardContent className="flex items-center justify-center p-component-lg">
            <Icon
              icon={Loader2}
              className="h-8 w-8 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
            <span className="sr-only">Loading configuration...</span>
          </CardContent>
        </Card>
      );
    }

    if (!schema) {
      return (
        <Card className={cn('w-full', className)}>
          <CardContent className="p-component-lg text-center text-muted-foreground">
            No configuration schema available
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </CardHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardContent>
            {groups.length === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-component-lg">
                {visibleFields.map((field) => (
                  <div
                    key={field.name}
                    className={cn(
                      field.type === 'TEXT_AREA' && 'md:col-span-2'
                    )}
                  >
                    <DynamicField
                      field={field}
                      form={form}
                      disabled={readOnly}
                    />
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
                  <TabsContent key={group} value={group} className="mt-component-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-component-lg">
                      {groupedFields[group].map((field: any) => (
                        <div
                          key={field.name}
                          className={cn(
                            field.type === 'TEXT_AREA' && 'md:col-span-2'
                          )}
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
                onClick={handleReset}
                disabled={isSubmitting}
                aria-label="Reset form"
              >
                <Icon
                  icon={RotateCcw}
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                />
                Reset
              </Button>
              <Button
                type="submit"
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
            </CardFooter>
          )}
        </form>
      </Card>
    );
  }
);

ServiceConfigFormDesktop.displayName = 'ServiceConfigFormDesktop';
