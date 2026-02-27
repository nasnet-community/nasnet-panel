/**
 * VLAN Form Desktop Presenter
 *
 * Desktop layout for VLAN configuration form with data table density.
 */

import { memo } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  Input,
  Label,
  Textarea,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Switch,
  Alert,
  AlertDescription,
} from '@nasnet/ui/primitives';
import { InterfaceSelector, Icon } from '@nasnet/ui/patterns';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import type { VlanFormValues } from '../../schemas';

/**
 * VlanFormDesktop Props
 * @interface VlanFormDesktopProps
 */
export interface VlanFormDesktopProps {
  form: UseFormReturn<VlanFormValues>;
  routerId: string;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  mode: 'create' | 'edit';
  warnings: string[];
  checkingDuplicate: boolean;
  isDuplicateVlanId: boolean;
}

function VlanFormDesktopContent({
  form,
  routerId,
  onSubmit,
  onCancel,
  isLoading,
  mode,
  warnings,
  checkingDuplicate,
  isDuplicateVlanId,
}: VlanFormDesktopProps) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const disabledValue = watch('disabled');

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create VLAN Interface' : 'Edit VLAN Interface'}</CardTitle>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent className="space-y-component-lg">
          {/* Name Field */}
          <div className="space-y-component-sm">
            <Label htmlFor="name">
              Name <span className="text-error">*</span>
            </Label>
            <Input
              id="name"
              placeholder="vlan-guest"
              {...register('name')}
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p
                id="name-error"
                className="text-error text-sm"
              >
                {errors.name.message}
              </p>
            )}
            <p className="text-muted-foreground text-sm">
              Unique name for the VLAN interface (letters, digits, hyphens, underscores)
            </p>
          </div>

          {/* VLAN ID Field */}
          <div className="space-y-component-sm">
            <Label htmlFor="vlanId">
              VLAN ID <span className="text-error">*</span>
            </Label>
            <div className="relative">
              <Input
                id="vlanId"
                type="number"
                min={1}
                max={4094}
                placeholder="10"
                className="font-mono"
                {...register('vlanId', { valueAsNumber: true })}
                aria-invalid={errors.vlanId ? 'true' : 'false'}
                aria-describedby={errors.vlanId ? 'vlanId-error' : undefined}
              />
              {checkingDuplicate && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2
                    className="text-muted-foreground h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
            {errors.vlanId && (
              <p
                id="vlanId-error"
                className="text-error text-sm"
              >
                {errors.vlanId.message}
              </p>
            )}
            {!errors.vlanId && isDuplicateVlanId && (
              <p className="text-error text-sm">
                This VLAN ID is already in use on the selected interface
              </p>
            )}
            <p className="text-muted-foreground text-sm">IEEE 802.1Q VLAN tag (1-4094)</p>
          </div>

          {/* Parent Interface Field */}
          <div className="space-y-component-sm">
            <Label htmlFor="interface">
              Parent Interface <span className="text-error">*</span>
            </Label>
            <InterfaceSelector
              routerId={routerId}
              value={watch('interface')}
              onChange={(value) => setValue('interface', Array.isArray(value) ? value[0] : value)}
              types={['ethernet', 'bridge']}
              placeholder="Select parent interface"
              aria-invalid={errors.interface ? 'true' : 'false'}
              aria-describedby={errors.interface ? 'interface-error' : undefined}
            />
            {errors.interface && (
              <p
                id="interface-error"
                className="text-error text-sm"
              >
                {errors.interface.message}
              </p>
            )}
            <p className="text-muted-foreground text-sm">
              Physical interface or bridge to create VLAN on
            </p>
          </div>

          {/* MTU Field */}
          <div className="space-y-component-sm">
            <Label htmlFor="mtu">MTU (bytes)</Label>
            <Input
              id="mtu"
              type="number"
              min={68}
              max={65535}
              placeholder="1500 (default from parent)"
              className="font-mono"
              {...register('mtu', {
                valueAsNumber: true,
                setValueAs: (v) => (v === '' || isNaN(v) ? null : v),
              })}
              aria-invalid={errors.mtu ? 'true' : 'false'}
              aria-describedby={errors.mtu ? 'mtu-error' : undefined}
            />
            {errors.mtu && (
              <p
                id="mtu-error"
                className="text-error text-sm"
              >
                {errors.mtu.message}
              </p>
            )}
            <p className="text-muted-foreground text-sm">
              Optional: Maximum transmission unit (leave empty to inherit from parent)
            </p>
          </div>

          {/* Comment Field */}
          <div className="space-y-component-sm">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              placeholder="Guest network VLAN"
              rows={3}
              {...register('comment', {
                setValueAs: (v) => (v === '' ? null : v),
              })}
              aria-invalid={errors.comment ? 'true' : 'false'}
              aria-describedby={errors.comment ? 'comment-error' : undefined}
            />
            {errors.comment && (
              <p
                id="comment-error"
                className="text-error text-sm"
              >
                {errors.comment.message}
              </p>
            )}
            <p className="text-muted-foreground text-sm">
              Optional description (max 255 characters)
            </p>
          </div>

          {/* Disabled Toggle */}
          <div className="p-component-md flex items-center justify-between rounded-[var(--semantic-radius-card)] border">
            <div className="space-y-0.5">
              <Label htmlFor="disabled">Disabled</Label>
              <p className="text-muted-foreground text-sm">
                Administratively disable this VLAN interface
              </p>
            </div>
            <Switch
              id="disabled"
              checked={disabledValue}
              onCheckedChange={(checked) => setValue('disabled', checked)}
            />
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <Alert
              variant="warning"
              role="alert"
              aria-live="polite"
            >
              <AlertTriangle
                className="h-4 w-4"
                aria-hidden="true"
              />
              <AlertDescription>
                <ul className="list-inside list-disc space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Info about VLAN creation */}
          {mode === 'create' && (
            <Alert
              role="status"
              aria-live="polite"
            >
              <Info
                className="h-4 w-4"
                aria-hidden="true"
              />
              <AlertDescription>
                Creating a VLAN interface adds an 802.1Q VLAN tag to traffic on the parent
                interface. Configure bridge ports or switch settings to use this VLAN.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="gap-component-md flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || isDuplicateVlanId || checkingDuplicate}
          >
            {isLoading && (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {mode === 'create' ? 'Create VLAN' : 'Save Changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export const VlanFormDesktop = memo(VlanFormDesktopContent);
VlanFormDesktop.displayName = 'VlanFormDesktop';
