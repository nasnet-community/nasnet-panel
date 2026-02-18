import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
  Input,
  Switch,
  Textarea,
  Button,
  useToast,
} from '@nasnet/ui/primitives';
import { useUpdateInterface } from '@nasnet/api-client/queries';

/**
 * Validation schema for interface settings
 * MTU: 68-9000 bytes (RouterOS limits)
 * Comment: max 255 characters
 */
const interfaceSettingsSchema = z.object({
  enabled: z.boolean(),
  mtu: z
    .number()
    .int('MTU must be a whole number')
    .min(68, 'MTU must be at least 68 bytes')
    .max(9000, 'MTU cannot exceed 9000 bytes')
    .optional()
    .or(z.literal('')),
  comment: z
    .string()
    .max(255, 'Comment cannot exceed 255 characters')
    .optional(),
});

type InterfaceSettingsFormData = z.infer<typeof interfaceSettingsSchema>;

export interface InterfaceEditFormProps {
  routerId: string;
  interface: any; // Interface data
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Interface Edit Form Component
 * Provides form for editing interface settings with validation
 */
export function InterfaceEditForm({
  routerId,
  interface: iface,
  onSuccess,
  onCancel,
}: InterfaceEditFormProps) {
  const { toast } = useToast();
  const [updateInterface, { loading }] = useUpdateInterface();

  // Initialize form with current interface values
  const form = useForm<InterfaceSettingsFormData>({
    resolver: zodResolver(interfaceSettingsSchema),
    defaultValues: {
      enabled: iface?.enabled ?? true,
      mtu: iface?.mtu ?? 1500,
      comment: iface?.comment ?? '',
    },
  });

  const onSubmit = async (values: InterfaceSettingsFormData) => {
    try {
      const result = await updateInterface({
        variables: {
          routerId,
          interfaceId: iface.id,
          input: {
            enabled: values.enabled,
            mtu: values.mtu === '' ? null : Number(values.mtu),
            comment: values.comment || null,
          },
        },
      });

      const data = result.data?.updateInterface;
      if (data?.errors && data.errors.length > 0) {
        // Show validation errors from backend
        data.errors.forEach((error: { message: string }) => {
          toast({
            title: 'Validation error',
            description: error.message,
            variant: 'destructive',
          });
        });
      } else {
        // Success
        toast({
          title: 'Interface updated',
          description: `${iface.name} settings have been saved successfully`,
        });
        onSuccess?.();
      }
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Enabled toggle */}
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Interface</FormLabel>
                <FormDescription>
                  Enable or disable this network interface
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* MTU input */}
        <FormField
          control={form.control}
          name="mtu"
          render={({ field }) => (
            <FormItem>
              <FormLabel>MTU (Maximum Transmission Unit)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={68}
                  max={9000}
                  placeholder="1500"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? '' : parseInt(value, 10));
                  }}
                  value={field.value === '' ? '' : field.value}
                />
              </FormControl>
              <FormDescription>
                Maximum transmission unit size in bytes (68-9000). Default is 1500.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Comment textarea */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add a description or note about this interface"
                  className="resize-none"
                  rows={3}
                  maxLength={255}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional comment or description (max 255 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form actions */}
        <div className="flex gap-3 justify-end pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
