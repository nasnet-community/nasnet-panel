/**
 * LTE Modem Configuration Form Component
 *
 * Form for configuring LTE/4G modem WAN interfaces.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 7: LTE Support)
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@nasnet/ui/primitives';
import {
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Card,
  Badge,
  Alert,
  AlertDescription,
} from '@nasnet/ui/primitives';
import { FormSection } from '@nasnet/ui/patterns';
import {
  Smartphone,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  SignalZero,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  lteModemSchema,
  lteModemDefaultValues,
  APN_PRESETS,
  LTE_NETWORK_MODES,
  getSignalStrength,
  type LteModemFormValues,
} from '../../schemas/lte-modem.schema';

export interface LteModemFormProps {
  /**
   * Router ID for the configuration
   */
  routerId: string;

  /**
   * Existing LTE configuration (for editing)
   */
  initialData?: Partial<LteModemFormValues>;

  /**
   * Current signal strength in dBm (for display)
   */
  signalStrength?: number;

  /**
   * Current signal quality percentage (0-100)
   */
  signalQuality?: number;

  /**
   * Callback when configuration is successful
   */
  onSuccess?: () => void;

  /**
   * Callback when configuration is cancelled
   */
  onCancel?: () => void;
}

/**
 * Signal Strength Indicator Component
 */
function SignalStrengthIndicator({
  rssi,
  quality,
}: {
  rssi?: number;
  quality?: number;
}) {
  if (rssi === undefined) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <SignalZero className="h-5 w-5" />
        <span className="text-sm">No signal data</span>
      </div>
    );
  }

  const strength = getSignalStrength(rssi);
  const SignalIcon =
    strength.label === 'Excellent'
      ? SignalHigh
      : strength.label === 'Good'
      ? Signal
      : strength.label === 'Fair'
      ? SignalMedium
      : strength.label === 'Poor'
      ? SignalLow
      : SignalZero;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
      <div className="flex items-center gap-3">
        <SignalIcon className={`h-5 w-5 text-${strength.color}`} />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{strength.label}</span>
            <Badge variant="outline" className={`text-${strength.color}`}>
              {rssi} dBm
            </Badge>
          </div>
          {quality !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              Signal Quality: {quality}%
            </p>
          )}
        </div>
      </div>

      {/* Visual signal bars */}
      <div className="flex items-end gap-1 h-8">
        {[1, 2, 3, 4, 5].map((bar) => {
          const threshold = -120 + bar * 10; // -120, -110, -100, -90, -80
          const isActive = rssi >= threshold;
          return (
            <div
              key={bar}
              className={`w-2 rounded-sm transition-colors ${
                isActive ? `bg-${strength.color}` : 'bg-muted'
              }`}
              style={{ height: `${bar * 20}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * LTE Modem Configuration Form
 */
export function LteModemForm({
  routerId,
  initialData,
  signalStrength,
  signalQuality,
  onSuccess,
  onCancel,
}: LteModemFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('Custom');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form
  const form = useForm<LteModemFormValues>({
    resolver: zodResolver(lteModemSchema) as any,
    defaultValues: {
      ...lteModemDefaultValues,
      ...initialData,
    },
  });

  const watchAuthProtocol = form.watch('authProtocol');

  /**
   * Handle APN preset selection
   */
  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    if (presetName !== 'Custom') {
      const preset = APN_PRESETS[presetName as keyof typeof APN_PRESETS];
      form.setValue('apn', preset.apn);
      form.setValue('authProtocol', preset.authProtocol);
    }
  };

  /**
   * Handle form submission
   */
  const onSubmit = (async (data: LteModemFormValues) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // TODO: Call GraphQL mutation
      console.log('Configuring LTE modem:', { routerId, ...data });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess(true);

      // Call success callback after short delay
      setTimeout(() => {
        onSuccess?.();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to configure LTE modem');
    } finally {
      setIsSubmitting(false);
    }
  }) as any;

  /**
   * Success state
   */
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <CheckCircle2 className="h-16 w-16 text-success" />
        <h3 className="text-lg font-semibold">LTE Modem Configured</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Your LTE modem has been configured successfully. The interface is now
          connecting to the cellular network.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Signal Strength Display */}
        {signalStrength !== undefined && (
          <FormSection
            title="Signal Status"
            description="Current cellular signal strength"
          >
            <SignalStrengthIndicator rssi={signalStrength} quality={signalQuality} />
          </FormSection>
        )}

        {/* Interface Selection */}
        <FormSection
          title="LTE Interface"
          description="Select the LTE modem interface to configure"
        >
          <FormField
            control={form.control as any}
            name="interface"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interface Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="lte1"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  LTE interface name (e.g., lte1, lte2)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* APN Configuration */}
        <FormSection
          title="APN Settings"
          description="Access Point Name configuration from your carrier"
        >
          {/* Preset Selector */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Carrier Preset
              </label>
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier preset" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(APN_PRESETS).map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      {preset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Quick setup for popular carriers
              </p>
            </div>

            {/* APN Input */}
            <FormField
              control={form.control as any}
              name="apn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>APN</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="internet.carrier.com"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Access Point Name provided by your carrier
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Profile Number */}
            <FormField
              control={form.control as any}
              name="profileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      max={10}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    APN profile number (1-10, usually 1)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Authentication */}
        <FormSection
          title="Authentication"
          description="APN authentication credentials (optional)"
          collapsible
          defaultOpen={watchAuthProtocol !== 'none'}
        >
          <div className="space-y-4">
            {/* Auth Protocol */}
            <FormField
              control={form.control as any}
              name="authProtocol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authentication Protocol</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select auth protocol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="pap">PAP</SelectItem>
                      <SelectItem value="chap">CHAP</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Username & Password (only if auth enabled) */}
            {watchAuthProtocol !== 'none' && (
              <>
                <FormField
                  control={form.control as any}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="username"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            disabled={isSubmitting}
                            autoComplete="off"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </FormSection>

        {/* SIM PIN */}
        <FormSection
          title="SIM PIN"
          description="Enter SIM PIN if your SIM card is locked"
          collapsible
          defaultOpen={false}
        >
          <FormField
            control={form.control as any}
            name="pin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PIN (4-8 digits)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPin ? 'text' : 'password'}
                      placeholder="••••"
                      maxLength={8}
                      disabled={isSubmitting}
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowPin(!showPin)}
                    >
                      {showPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>
                  Leave empty if SIM has no PIN
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              PIN will be stored encrypted and used only for modem unlock
            </AlertDescription>
          </Alert>
        </FormSection>

        {/* Advanced Options */}
        <FormSection
          title="Advanced Options"
          description="MTU and routing settings"
          collapsible
          defaultOpen={false}
        >
          <div className="space-y-4">
            {/* MTU */}
            <FormField
              control={form.control as any}
              name="mtu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MTU (Maximum Transmission Unit)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={576}
                      max={1500}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Default: 1500 bytes (576-1500)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Default Route */}
            <FormField
              control={form.control as any}
              name="isDefaultRoute"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Default Route</FormLabel>
                    <FormDescription>
                      Use this LTE connection as the default internet gateway
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Enable/Disable */}
            <FormField
              control={form.control as any}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Interface</FormLabel>
                    <FormDescription>
                      Activate the LTE interface after configuration
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Configure LTE Modem
          </Button>
        </div>
      </form>
    </Form>
  );
}
