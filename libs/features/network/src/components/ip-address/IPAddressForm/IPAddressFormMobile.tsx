/**
 * IPAddressFormMobile - Mobile Presenter
 * NAS-6.2: IP Address Management
 *
 * Touch-optimized form with 44px minimum touch targets.
 *
 * @description Mobile presenter for IP address form configuration with full-width
 * inputs, 44px minimum touch targets, and vertical button layout optimized for
 * single-column touch interaction.
 */

import { memo, useCallback } from 'react';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@nasnet/ui/primitives';
import { IPInput } from '@nasnet/ui/patterns';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';

import type { IPAddressFormProps } from './types';
import { useIPAddressForm } from './useIPAddressForm';

function IPAddressFormMobileComponent(props: IPAddressFormProps) {
  const { mode, interfaces } = props;
  const {
    form,
    subnetCalculations,
    conflictInfo,
    conflictLoading,
    hasConflict,
    loading,
    handleSubmit,
    onCancel,
  } = useIPAddressForm(props);

  const handleInterfaceChange = useCallback(
    (value: string) => {
      form.setValue('interfaceId', value);
    },
    [form]
  );

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h2 className="text-xl font-semibold">
          {mode === 'create' ? 'Add IP Address' : 'Edit IP Address'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure an IP address on a network interface
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* IP Address Input with CIDR */}
          <FormField
            control={form.control as any}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IP Address (CIDR)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <IPInput
                      {...field}
                      allowCIDR
                      showType
                      disabled={loading}
                      error={form.formState.errors.address?.message}
                    />
                    {conflictLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Format: 192.168.1.1/24
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Conflict Warning */}
          {hasConflict && conflictInfo && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {conflictInfo.message}
                {conflictInfo.conflictingAddress && (
                  <div className="mt-2 text-sm">
                    Conflicting: <code>{conflictInfo.conflictingAddress.address}</code> on{' '}
                    <strong>{conflictInfo.conflictingAddress.interfaceName}</strong>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Subnet Calculations */}
          {subnetCalculations && !hasConflict && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Subnet Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network:</span>
                  <code className="text-xs">{subnetCalculations.networkAddress}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Broadcast:</span>
                  <code className="text-xs">{subnetCalculations.broadcastAddress}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mask:</span>
                  <code className="text-xs">{subnetCalculations.subnetMask}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hosts:</span>
                  <span>{subnetCalculations.usableHostCount}</span>
                </div>
                <div className="pt-1">
                  <div className="text-muted-foreground mb-1">Range:</div>
                  <code className="text-xs block">
                    {subnetCalculations.firstUsableHost} -{' '}
                    {subnetCalculations.lastUsableHost}
                  </code>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interface Selector */}
          <FormField
            control={form.control as any}
            name="interfaceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interface</FormLabel>
                <Select
                  onValueChange={handleInterfaceChange}
                  defaultValue={field.value}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Select interface" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {interfaces.map((iface) => (
                      <SelectItem
                        key={iface.id}
                        value={iface.id}
                        disabled={iface.disabled}
                        className="min-h-[44px]"
                      >
                        {iface.name}
                        {iface.type && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {iface.type}
                          </Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Interface to assign this IP
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Comment Field */}
          <FormField
            control={form.control as any}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comment (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Add description..."
                    disabled={loading}
                    className="min-h-[44px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Disabled Toggle */}
          <FormField
            control={form.control as any}
            name="disabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Disabled</FormLabel>
                  <FormDescription>
                    Configure but don't activate
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={loading}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Form Actions - Full width with 44px height */}
          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              className="w-full min-h-[44px]"
              disabled={loading || hasConflict}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Add IP Address' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full min-h-[44px]"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export const IPAddressFormMobile = memo(IPAddressFormMobileComponent);
IPAddressFormMobile.displayName = 'IPAddressFormMobile';
