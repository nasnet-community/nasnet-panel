/**
 * AddServiceDialog - Form dialog for adding/editing custom service ports
 *
 * Provides a user-friendly form for creating and editing custom service port definitions.
 * Features:
 * - Add new custom services (port + name + protocol + description)
 * - Edit existing custom services
 * - Validation with Zod schema (CustomServicePortInputSchema)
 * - Conflict detection (built-in + custom service names)
 * - i18n support (firewall.servicePorts namespace)
 * - Form state management with React Hook Form
 *
 * @module @nasnet/features/firewall/components/AddServiceDialog
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  CustomServicePortInputSchema,
  type CustomServicePortInput,
  DEFAULT_CUSTOM_SERVICE_INPUT,
} from '@nasnet/core/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@nasnet/ui/primitives';
import { Button, Input, Label, Textarea, RadioGroup, RadioGroupItem } from '@nasnet/ui/primitives';
import { useCustomServices } from '../hooks';
import { Alert, AlertDescription } from '@nasnet/ui/primitives';
import { AlertCircle } from 'lucide-react';

// ============================================================================
// Component Props
// ============================================================================

export interface AddServiceDialogProps {
  /** Control dialog open state */
  open: boolean;
  /** Handler for dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Service to edit (undefined = add mode, defined = edit mode) */
  editService?: CustomServicePortInput;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Dialog for adding or editing custom service port definitions
 *
 * @example
 * ```tsx
 * // Add mode
 * <AddServiceDialog
 *   open={isAddDialogOpen}
 *   onOpenChange={setIsAddDialogOpen}
 * />
 *
 * // Edit mode
 * <AddServiceDialog
 *   open={isEditDialogOpen}
 *   onOpenChange={setIsEditDialogOpen}
 *   editService={{
 *     port: 9999,
 *     service: 'my-app',
 *     protocol: 'tcp',
 *     description: 'My custom application'
 *   }}
 * />
 * ```
 */
export function AddServiceDialog({ open, onOpenChange, editService }: AddServiceDialogProps) {
  const { t } = useTranslation('firewall');
  const { addService, updateService } = useCustomServices();

  // ============================================================================
  // Form State
  // ============================================================================

  const form = useForm<CustomServicePortInput>({
    resolver: zodResolver(CustomServicePortInputSchema),
    defaultValues: editService || DEFAULT_CUSTOM_SERVICE_INPUT,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    watch,
  } = form;

  const protocol = watch('protocol');

  // ============================================================================
  // Effects
  // ============================================================================

  // Reset form when dialog opens/closes or editService changes
  useEffect(() => {
    if (open) {
      reset(editService || DEFAULT_CUSTOM_SERVICE_INPUT);
    }
  }, [open, editService, reset]);

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle form submission (add or update)
   */
  const onSubmit = async (data: CustomServicePortInput) => {
    try {
      if (editService) {
        // Edit mode: Update existing service
        await updateService(editService.port, data);
      } else {
        // Add mode: Create new service
        await addService(data);
      }

      // Success: Close dialog and reset form
      onOpenChange(false);
      reset(DEFAULT_CUSTOM_SERVICE_INPUT);
    } catch (error) {
      // Error: Show error message on service field
      const errorMessage = error instanceof Error ? error.message : t('servicePorts.validation.nameExists');
      setError('service', { message: errorMessage });
    }
  };

  /**
   * Handle dialog close (also resets form)
   */
  const handleClose = () => {
    onOpenChange(false);
    reset(DEFAULT_CUSTOM_SERVICE_INPUT);
  };

  // ============================================================================
  // Render
  // ============================================================================

  const isEditMode = !!editService;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t('servicePorts.editService') : t('servicePorts.addService')}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t('servicePorts.confirmations.deleteServiceDescription')
              : t('servicePorts.emptyStates.noServicesDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Service Name Field */}
          <div className="space-y-2">
            <Label htmlFor="service" className="text-sm font-medium">
              {t('servicePorts.fields.name')}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="service"
              type="text"
              placeholder={t('servicePorts.placeholders.serviceName')}
              autoComplete="off"
              {...register('service')}
              aria-invalid={!!errors.service}
              aria-describedby={errors.service ? 'service-error' : undefined}
            />
            {errors.service && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription id="service-error">{errors.service.message}</AlertDescription>
              </Alert>
            )}
            <p className="text-xs text-muted-foreground">
              {t('servicePorts.validation.nameInvalid')}
            </p>
          </div>

          {/* Protocol Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('servicePorts.fields.protocol')}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <RadioGroup
              value={protocol}
              onValueChange={(value) => form.setValue('protocol', value as 'tcp' | 'udp' | 'both')}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tcp" id="protocol-tcp" />
                <Label htmlFor="protocol-tcp" className="font-normal cursor-pointer">
                  {t('servicePorts.protocols.tcp')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="udp" id="protocol-udp" />
                <Label htmlFor="protocol-udp" className="font-normal cursor-pointer">
                  {t('servicePorts.protocols.udp')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="protocol-both" />
                <Label htmlFor="protocol-both" className="font-normal cursor-pointer">
                  {t('servicePorts.protocols.both')}
                </Label>
              </div>
            </RadioGroup>
            {errors.protocol && (
              <p className="text-sm text-destructive">{errors.protocol.message}</p>
            )}
          </div>

          {/* Port Field */}
          <div className="space-y-2">
            <Label htmlFor="port" className="text-sm font-medium">
              {t('servicePorts.fields.port')}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="port"
              type="number"
              min={1}
              max={65535}
              placeholder={t('servicePorts.placeholders.port')}
              {...register('port', { valueAsNumber: true })}
              aria-invalid={!!errors.port}
              aria-describedby={errors.port ? 'port-error' : undefined}
            />
            {errors.port && (
              <p className="text-sm text-destructive" id="port-error">
                {errors.port.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t('servicePorts.validation.portInvalid')}
            </p>
          </div>

          {/* Description Field (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              {t('servicePorts.fields.description')}
              <span className="text-muted-foreground ml-1 text-xs">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder={t('servicePorts.placeholders.description')}
              rows={3}
              maxLength={500}
              {...register('description')}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            {errors.description && (
              <p className="text-sm text-destructive" id="description-error">
                {errors.description.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t('servicePorts.validation.descriptionTooLong')}
            </p>
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditMode
                  ? 'Updating...'
                  : 'Adding...'
                : isEditMode
                ? 'Update'
                : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
