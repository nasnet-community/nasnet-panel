/**
 * IPAddressFormDesktop - Desktop/Tablet Presenter
 * NAS-6.2: IP Address Management
 *
 * Dialog-based form optimized for mouse/keyboard interaction.
 */

import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
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

import type { IPAddressFormProps } from './types';
import { useIPAddressForm } from './useIPAddressForm';

export function IPAddressFormDesktop(props: IPAddressFormProps) {
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

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Add IP Address' : 'Edit IP Address'}
        </CardTitle>
        <CardDescription>
          Configure an IP address on a network interface in CIDR notation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* IP Address Input with CIDR */}
            <FormField
              control={form.control}
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
                    Enter IP address with prefix length (e.g., 192.168.1.1/24)
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
                      Conflicting IP: <code>{conflictInfo.conflictingAddress.address}</code> on{' '}
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
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Subnet Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Network:</div>
                    <code className="text-sm">{subnetCalculations.networkAddress}</code>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Broadcast:</div>
                    <code className="text-sm">{subnetCalculations.broadcastAddress}</code>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Subnet Mask:</div>
                    <code className="text-sm">{subnetCalculations.subnetMask}</code>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Usable Hosts:</div>
                    <span>{subnetCalculations.usableHostCount}</span>
                  </div>
                  <div className="col-span-2">
                    <div className="text-muted-foreground">Usable Range:</div>
                    <code className="text-sm">
                      {subnetCalculations.firstUsableHost} - {subnetCalculations.lastUsableHost}
                    </code>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interface Selector */}
            <FormField
              control={form.control}
              name="interfaceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interface</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select interface" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {interfaces.map((iface) => (
                        <SelectItem
                          key={iface.id}
                          value={iface.id}
                          disabled={iface.disabled}
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
                    Physical interface to assign this IP address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comment Field */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Management IP, Guest network, etc."
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Add a description for this IP address (max 255 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Disabled Toggle */}
            <FormField
              control={form.control}
              name="disabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Disabled</FormLabel>
                    <FormDescription>
                      IP address will be configured but not active
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

            {/* Form Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || hasConflict}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Add IP Address' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
