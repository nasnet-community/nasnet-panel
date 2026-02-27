/**
 * IPAddressFormDesktop - Desktop/Tablet Presenter
 * NAS-6.2: IP Address Management
 *
 * Dialog-based form optimized for mouse/keyboard interaction.
 * Shows all details without progressive disclosure. Supports keyboard navigation
 * and focus management. 32-38px click targets for desktop users.
 */

import { memo, useMemo } from 'react';
import { cn } from '@nasnet/ui/utils';
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

/**
 * Desktop/Tablet presenter for IP address form
 * @internal Use IPAddressForm auto-detection wrapper instead
 */
function IPAddressFormDesktopComponent(props: IPAddressFormProps) {
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

  // Memoize interface options for performance
  const interfaceOptions = useMemo(
    () =>
      interfaces.map((iface) => ({
        id: iface.id,
        name: iface.name,
        type: iface.type,
        disabled: iface.disabled,
      })),
    [interfaces]
  );

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-display text-2xl">
          {mode === 'create' ? 'Add IP Address' : 'Edit IP Address'}
        </CardTitle>
        <CardDescription>
          Configure an IP address on a network interface in CIDR notation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-component-lg">
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
                    Enter IP address with prefix length (e.g., 192.168.1.1/24)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conflict Warning */}
            {hasConflict && conflictInfo && (
              <Alert variant="destructive" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>
                  {conflictInfo.message}
                  {conflictInfo.conflictingAddress && (
                    <div className="mt-2 text-sm">
                      Conflicting IP: <code className="font-mono text-xs">{conflictInfo.conflictingAddress.address}</code> on{' '}
                      <strong className="font-mono">{conflictInfo.conflictingAddress.interfaceName}</strong>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Subnet Calculations */}
            {subnetCalculations && !hasConflict && (
              <Card className="bg-background border-border" role="complementary" aria-label="Subnet information">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-component-sm">
                    <CheckCircle className="h-4 w-4 text-success flex-shrink-0" aria-hidden="true" />
                    Subnet Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-component-sm text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Network:</div>
                    <code className="text-sm font-mono text-foreground">{subnetCalculations.networkAddress}</code>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Broadcast:</div>
                    <code className="text-sm font-mono text-foreground">{subnetCalculations.broadcastAddress}</code>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Subnet Mask:</div>
                    <code className="text-sm font-mono text-foreground">{subnetCalculations.subnetMask}</code>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Usable Hosts:</div>
                    <span className="font-mono text-foreground">{subnetCalculations.usableHostCount}</span>
                  </div>
                  <div className="col-span-2">
                    <div className="text-muted-foreground text-xs">Usable Range:</div>
                    <code className="text-sm font-mono text-foreground">
                      {subnetCalculations.firstUsableHost} - {subnetCalculations.lastUsableHost}
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Select network interface">
                        <SelectValue placeholder="Select interface" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {interfaceOptions.map((iface) => (
                        <SelectItem
                          key={iface.id}
                          value={iface.id}
                          disabled={iface.disabled}
                        >
                          <span className="font-mono">{iface.name}</span>
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
              control={form.control as any}
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
              control={form.control as any}
              name="disabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-[var(--semantic-radius-card)] border border-border bg-card p-component-sm">
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
            <div className="flex gap-component-xs justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                aria-label="Cancel and close form"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || hasConflict}
                aria-label={
                  hasConflict
                    ? 'Submit button disabled - IP address conflict detected'
                    : mode === 'create'
                    ? 'Add IP address to interface'
                    : 'Save IP address changes'
                }
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                {mode === 'create' ? 'Add IP Address' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Wrap with memo for performance optimization
export const IPAddressFormDesktop = memo(IPAddressFormDesktopComponent);

// Set display name for React DevTools debugging
IPAddressFormDesktop.displayName = 'IPAddressFormDesktop';
