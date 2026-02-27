/**
 * RouteFormMobile - Mobile Presenter
 * NAS-6.5: Static Route Management
 *
 * Card-based form layout optimized for touch interaction.
 * 44px minimum touch targets, simplified UI.
 */

import { memo } from 'react';
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@nasnet/ui/primitives';
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import type { RouteFormData } from './route-form.schema';
import type { ReachabilityInfo, InterfaceOption } from './types';

export interface RouteFormMobileProps {
  form: UseFormReturn<RouteFormData>;
  reachabilityInfo: ReachabilityInfo;
  tableOptions: string[];
  interfaces: InterfaceOption[];
  loading: boolean;
  handleSubmit: () => void;
  handleCancel: () => void;
  mode: 'create' | 'edit';
}

function RouteFormMobileComponent({
  form,
  reachabilityInfo,
  tableOptions,
  interfaces,
  loading,
  handleSubmit,
  handleCancel,
  mode,
}: RouteFormMobileProps) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const gatewayValue = watch('gateway');
  const interfaceValue = watch('interface');

  return (
    <form onSubmit={handleSubmit} className="space-y-component-md pb-component-md">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold font-display">
          {mode === 'create' ? 'Add Static Route' : 'Edit Static Route'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure a static route to direct traffic to a specific network.
        </p>
      </div>

      {/* Destination (CIDR) */}
      <div className="space-y-component-sm">
        <Label htmlFor="destination-mobile">
          Destination Network <span className="text-error">*</span>
        </Label>
        <Input
          id="destination-mobile"
          placeholder="192.168.1.0/24 or 0.0.0.0/0"
          className="min-h-[44px] font-mono text-foreground"
          {...register('destination')}
          aria-invalid={errors.destination ? 'true' : 'false'}
        />
        {errors.destination && (
          <p className="text-sm text-error flex items-center gap-component-sm">
            <AlertCircle className="h-4 w-4" />
            {errors.destination.message}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          CIDR notation. Use 0.0.0.0/0 for default route.
        </p>
      </div>

      {/* Gateway (IPv4) */}
      <div className="space-y-component-sm">
        <Label htmlFor="gateway-mobile">
          Gateway
          {!interfaceValue && <span className="text-error"> *</span>}
        </Label>
        <Input
          id="gateway-mobile"
          placeholder="192.168.1.1"
          className="min-h-[44px] font-mono text-foreground"
          {...register('gateway')}
          aria-invalid={errors.gateway ? 'true' : 'false'}
        />
        {errors.gateway && (
          <p className="text-sm text-error flex items-center gap-component-sm">
            <AlertCircle className="h-4 w-4" />
            {errors.gateway.message}
          </p>
        )}

        {/* Gateway Reachability Indicator */}
        {gatewayValue && !errors.gateway && (
          <div className="space-y-component-sm">
            {reachabilityInfo.checking && (
              <div className="flex items-center gap-component-sm text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking reachability...</span>
              </div>
            )}

            {!reachabilityInfo.checking && reachabilityInfo.reachable === true && (
              <Badge variant="default" className="bg-success text-success-foreground">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Gateway reachable
                {reachabilityInfo.latency && ` (${reachabilityInfo.latency}ms)`}
              </Badge>
            )}

            {!reachabilityInfo.checking && reachabilityInfo.reachable === false && (
              <div>
                <Badge variant="outline" className="border-warning text-warning">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Gateway may not be reachable
                </Badge>
                <div role="alert" className="mt-2 rounded-lg border border-warning/50 bg-warning/10 p-component-sm text-sm text-foreground">
                  <div className="flex gap-component-sm">
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="space-y-component-sm">
                      <p className="font-medium">Warning</p>
                      <p className="text-muted-foreground">{reachabilityInfo.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          IPv4 address of the next hop. Required if interface is not specified.
        </p>
      </div>

      {/* Interface */}
      <div className="space-y-component-sm">
        <Label htmlFor="interface-mobile">
          Interface
          {!gatewayValue && <span className="text-error"> *</span>}
        </Label>
        <Select
          value={interfaceValue || 'none'}
          onValueChange={(value) =>
            setValue('interface', value === 'none' ? null : value, {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger id="interface-mobile" className="min-h-[44px]">
            <SelectValue placeholder="Select interface (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {interfaces.map((iface) => (
              <SelectItem key={iface.id} value={iface.name} disabled={iface.disabled}>
                {iface.name}
                {iface.type && ` (${iface.type})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.interface && (
          <p className="text-sm text-error flex items-center gap-component-sm">
            <AlertCircle className="h-4 w-4" />
            {errors.interface.message}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Outgoing interface. Required if gateway is not specified.
        </p>
      </div>

      {/* Distance (Metric) */}
      <div className="space-y-component-sm">
        <Label htmlFor="distance-mobile">Distance (Metric)</Label>
        <Input
          id="distance-mobile"
          type="number"
          min={1}
          max={255}
          className="min-h-[44px]"
          {...register('distance', { valueAsNumber: true })}
          aria-invalid={errors.distance ? 'true' : 'false'}
        />
        {errors.distance && (
          <p className="text-sm text-error flex items-center gap-component-sm">
            <AlertCircle className="h-4 w-4" />
            {errors.distance.message}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Lower values have higher priority. Default: 1
        </p>
      </div>

      {/* Routing Mark */}
      <div className="space-y-component-sm">
        <Label htmlFor="routingMark-mobile">Routing Mark</Label>
        <Input
          id="routingMark-mobile"
          placeholder="Optional"
          className="min-h-[44px]"
          {...register('routingMark')}
        />
        <p className="text-sm text-muted-foreground">
          For policy-based routing. Leave empty if not needed.
        </p>
      </div>

      {/* Routing Table */}
      <div className="space-y-component-sm">
        <Label htmlFor="routingTable-mobile">Routing Table</Label>
        <Select
          value={watch('routingTable')}
          onValueChange={(value) => setValue('routingTable', value)}
        >
          <SelectTrigger id="routingTable-mobile" className="min-h-[44px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tableOptions.map((table) => (
              <SelectItem key={table} value={table}>
                {table}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Routing table for this route. Default: main
        </p>
      </div>

      {/* Comment */}
      <div className="space-y-component-sm">
        <Label htmlFor="comment-mobile">Comment</Label>
        <Textarea
          id="comment-mobile"
          placeholder="Optional description"
          {...register('comment')}
          rows={3}
          maxLength={255}
          className="min-h-[80px]"
        />
        {errors.comment && (
          <p className="text-sm text-error flex items-center gap-component-sm">
            <AlertCircle className="h-4 w-4" />
            {errors.comment.message}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Optional description (max 255 characters)
        </p>
      </div>

      {/* Action Buttons - Full width with 44px height */}
      <div className="space-y-component-sm pt-component-sm">
        <Button
          type="submit"
          className="w-full min-h-[44px]"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Add Route' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full min-h-[44px]"
          onClick={handleCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export const RouteFormMobile = memo(RouteFormMobileComponent);
