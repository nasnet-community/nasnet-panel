/**
 * VLAN Form Mobile Presenter
 *
 * Mobile layout for VLAN configuration form with touch-friendly controls.
 */

import type { UseFormReturn } from 'react-hook-form';
import {
  Input,
  Label,
  Textarea,
  Button,
  Switch,
  Alert,
  AlertDescription,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@nasnet/ui/primitives';
import { InterfaceSelector } from '@nasnet/ui/patterns';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import type { VlanFormValues } from '../../schemas';

export interface VlanFormMobileProps {
  form: UseFormReturn<VlanFormValues>;
  routerId: string;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  mode: 'create' | 'edit';
  warnings: string[];
  checkingDuplicate: boolean;
  isDuplicateVlanId: boolean;
}

export function VlanFormMobile({
  form,
  routerId,
  onSubmit,
  onCancel,
  loading,
  mode,
  warnings,
  checkingDuplicate,
  isDuplicateVlanId,
}: VlanFormMobileProps) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const disabledValue = watch('disabled');

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onCancel()}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {mode === 'create' ? 'Create VLAN Interface' : 'Edit VLAN Interface'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={onSubmit} className="mt-6">
          <div className="space-y-6 pb-20">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name-mobile">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name-mobile"
                placeholder="vlan-guest"
                className="h-11"
                {...register('name')}
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'name-error-mobile' : undefined}
              />
              {errors.name && (
                <p id="name-error-mobile" className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Unique name for the VLAN interface
              </p>
            </div>

            {/* VLAN ID Field */}
            <div className="space-y-2">
              <Label htmlFor="vlanId-mobile">
                VLAN ID <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="vlanId-mobile"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={4094}
                  placeholder="10"
                  className="h-11"
                  {...register('vlanId', { valueAsNumber: true })}
                  aria-invalid={errors.vlanId ? 'true' : 'false'}
                  aria-describedby={
                    errors.vlanId ? 'vlanId-error-mobile' : undefined
                  }
                />
                {checkingDuplicate && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              {errors.vlanId && (
                <p id="vlanId-error-mobile" className="text-sm text-destructive">
                  {errors.vlanId.message}
                </p>
              )}
              {!errors.vlanId && isDuplicateVlanId && (
                <p className="text-sm text-destructive">
                  This VLAN ID is already in use on the selected interface
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                IEEE 802.1Q VLAN tag (1-4094)
              </p>
            </div>

            {/* Parent Interface Field */}
            <div className="space-y-2">
              <Label htmlFor="interface-mobile">
                Parent Interface <span className="text-destructive">*</span>
              </Label>
              <InterfaceSelector
                routerId={routerId}
                value={watch('interface')}
                onChange={(value) => setValue('interface', value)}
                types={['ethernet', 'bridge']}
                placeholder="Select parent interface"
                aria-invalid={errors.interface ? 'true' : 'false'}
                aria-describedby={
                  errors.interface ? 'interface-error-mobile' : undefined
                }
              />
              {errors.interface && (
                <p id="interface-error-mobile" className="text-sm text-destructive">
                  {errors.interface.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Physical interface or bridge to create VLAN on
              </p>
            </div>

            {/* MTU Field */}
            <div className="space-y-2">
              <Label htmlFor="mtu-mobile">MTU (bytes)</Label>
              <Input
                id="mtu-mobile"
                type="number"
                inputMode="numeric"
                min={68}
                max={65535}
                placeholder="1500 (default)"
                className="h-11"
                {...register('mtu', {
                  valueAsNumber: true,
                  setValueAs: (v) => (v === '' || isNaN(v) ? null : v),
                })}
                aria-invalid={errors.mtu ? 'true' : 'false'}
                aria-describedby={errors.mtu ? 'mtu-error-mobile' : undefined}
              />
              {errors.mtu && (
                <p id="mtu-error-mobile" className="text-sm text-destructive">
                  {errors.mtu.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Optional: Leave empty to inherit from parent
              </p>
            </div>

            {/* Comment Field */}
            <div className="space-y-2">
              <Label htmlFor="comment-mobile">Comment</Label>
              <Textarea
                id="comment-mobile"
                placeholder="Guest network VLAN"
                rows={4}
                className="resize-none"
                {...register('comment', {
                  setValueAs: (v) => (v === '' ? null : v),
                })}
                aria-invalid={errors.comment ? 'true' : 'false'}
                aria-describedby={
                  errors.comment ? 'comment-error-mobile' : undefined
                }
              />
              {errors.comment && (
                <p id="comment-error-mobile" className="text-sm text-destructive">
                  {errors.comment.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Optional description (max 255 characters)
              </p>
            </div>

            {/* Disabled Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="disabled-mobile">Disabled</Label>
                <p className="text-sm text-muted-foreground">
                  Administratively disable this VLAN
                </p>
              </div>
              <Switch
                id="disabled-mobile"
                checked={disabledValue}
                onCheckedChange={(checked) => setValue('disabled', checked)}
              />
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index} className="text-sm">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Info about VLAN creation */}
            {mode === 'create' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Creating a VLAN interface adds an 802.1Q VLAN tag to traffic. Configure bridge ports to use this VLAN.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Fixed Bottom Actions */}
          <SheetFooter className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || isDuplicateVlanId || checkingDuplicate}
              className="flex-1 h-11"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
