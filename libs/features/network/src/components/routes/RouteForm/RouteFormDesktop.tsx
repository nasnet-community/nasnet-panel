/**
 * RouteFormDesktop - Desktop/Tablet Presenter
 * NAS-6.5: Static Route Management
 *
 * Dense form layout optimized for mouse/keyboard interaction.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@nasnet/ui/primitives';
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, Info } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import type { RouteFormData } from './route-form.schema';
import type { ReachabilityInfo, InterfaceOption } from './types';

export interface RouteFormDesktopProps {
  form: UseFormReturn<RouteFormData>;
  reachabilityInfo: ReachabilityInfo;
  tableOptions: string[];
  interfaces: InterfaceOption[];
  loading: boolean;
  handleSubmit: () => void;
  handleCancel: () => void;
  mode: 'create' | 'edit';
}

export function RouteFormDesktop({
  form,
  reachabilityInfo,
  tableOptions,
  interfaces,
  loading,
  handleSubmit,
  handleCancel,
  mode,
}: RouteFormDesktopProps) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const gatewayValue = watch('gateway');
  const interfaceValue = watch('interface');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'Add Static Route' : 'Edit Static Route'}</CardTitle>
          <CardDescription>
            Configure a static route to direct traffic to a specific network.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Destination (CIDR) */}
          <div className="space-y-2">
            <Label htmlFor="destination">
              Destination Network <span className="text-destructive">*</span>
            </Label>
            <Input
              id="destination"
              placeholder="192.168.1.0/24 or 0.0.0.0/0"
              {...register('destination')}
              aria-invalid={errors.destination ? 'true' : 'false'}
              aria-describedby={errors.destination ? 'destination-error' : 'destination-help'}
            />
            {errors.destination && (
              <p id="destination-error" className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.destination.message}
              </p>
            )}
            <p id="destination-help" className="text-sm text-muted-foreground">
              CIDR notation (e.g., 192.168.1.0/24). Use 0.0.0.0/0 for default route.
            </p>
          </div>

          {/* Gateway (IPv4) */}
          <div className="space-y-2">
            <Label htmlFor="gateway">
              Gateway
              {!interfaceValue && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              id="gateway"
              placeholder="192.168.1.1"
              {...register('gateway')}
              aria-invalid={errors.gateway ? 'true' : 'false'}
              aria-describedby={errors.gateway ? 'gateway-error' : 'gateway-help'}
            />
            {errors.gateway && (
              <p id="gateway-error" className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.gateway.message}
              </p>
            )}

            {/* Gateway Reachability Indicator */}
            {gatewayValue && !errors.gateway && (
              <div className="flex items-center gap-2">
                {reachabilityInfo.checking && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Checking reachability...</span>
                  </div>
                )}

                {!reachabilityInfo.checking && reachabilityInfo.reachable === true && (
                  <Badge variant="default" className="bg-success text-success-foreground">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Gateway reachable
                    {reachabilityInfo.latency && ` (${reachabilityInfo.latency}ms)`}
                    {reachabilityInfo.interface && ` via ${reachabilityInfo.interface}`}
                  </Badge>
                )}

                {!reachabilityInfo.checking && reachabilityInfo.reachable === false && (
                  <Badge variant="outline" className="border-warning text-warning">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Gateway may not be reachable
                  </Badge>
                )}
              </div>
            )}

            {!reachabilityInfo.checking && reachabilityInfo.reachable === false && (
              <div className="rounded-md border border-warning/50 bg-warning/10 p-3 text-sm">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">Gateway Reachability Warning</p>
                    <p className="text-muted-foreground">{reachabilityInfo.message}</p>
                    <p className="text-muted-foreground">
                      You can still create this route, but traffic may not flow correctly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p id="gateway-help" className="text-sm text-muted-foreground">
              IPv4 address of the next hop. Required if interface is not specified.
            </p>
          </div>

          {/* Interface */}
          <div className="space-y-2">
            <Label htmlFor="interface">
              Interface
              {!gatewayValue && <span className="text-destructive"> *</span>}
            </Label>
            <Select
              value={interfaceValue || 'none'}
              onValueChange={(value) =>
                setValue('interface', value === 'none' ? null : value, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="interface">
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
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.interface.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Outgoing interface. Required if gateway is not specified.
            </p>
          </div>

          {/* Distance (Metric) */}
          <div className="space-y-2">
            <Label htmlFor="distance">Distance (Metric)</Label>
            <Input
              id="distance"
              type="number"
              min={1}
              max={255}
              {...register('distance', { valueAsNumber: true })}
              aria-invalid={errors.distance ? 'true' : 'false'}
            />
            {errors.distance && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.distance.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Lower values have higher priority. Default: 1
            </p>
          </div>

          {/* Routing Mark */}
          <div className="space-y-2">
            <Label htmlFor="routingMark" className="flex items-center gap-2">
              Routing Mark
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                title="Routing marks are used for policy-based routing"
              >
                <Info className="h-4 w-4" />
              </button>
            </Label>
            <Input
              id="routingMark"
              placeholder="Optional"
              {...register('routingMark')}
            />
            <p className="text-sm text-muted-foreground">
              Used for policy-based routing. Leave empty if not needed.
            </p>
          </div>

          {/* Routing Table */}
          <div className="space-y-2">
            <Label htmlFor="routingTable">Routing Table</Label>
            <Select
              value={watch('routingTable')}
              onValueChange={(value) => setValue('routingTable', value)}
            >
              <SelectTrigger id="routingTable">
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
          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              placeholder="Optional description"
              {...register('comment')}
              rows={2}
              maxLength={255}
            />
            {errors.comment && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.comment.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Optional description (max 255 characters)
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Add Route' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
