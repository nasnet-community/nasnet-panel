/**
 * WirelessSettingsForm Component
 * Comprehensive form for editing wireless interface settings
 * Implements FR0-18: Modify wireless settings including SSID, password,
 * channel, channel width, TX power, hidden SSID, security mode, and country
 */

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Radio, Shield, Globe, Wifi } from 'lucide-react';
import {
  Input,
  Button,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@nasnet/ui/primitives';
import type { FrequencyBand, ChannelWidth, WirelessSecurityOption } from '@nasnet/core/types';
import {
  wirelessSettingsSchema,
  type WirelessSettingsFormData,
} from '../validation/wirelessSettings.schema';
import {
  getChannelsByBand,
  getChannelWidthsByBand,
  SECURITY_MODE_OPTIONS,
  COUNTRY_OPTIONS,
  TX_POWER_OPTIONS,
} from '../data/wirelessOptions';

export interface WirelessSettingsFormProps {
  /** Current values from the interface */
  currentValues: {
    ssid: string;
    hideSsid: boolean;
    channel: string;
    channelWidth: ChannelWidth;
    txPower: number;
    countryCode?: string;
    band: FrequencyBand;
  };
  /** Whether the form is submitting */
  isSubmitting?: boolean;
  /** Submit handler */
  onSubmit: (data: WirelessSettingsFormData) => void;
  /** Cancel handler */
  onCancel: () => void;
  /** Optional CSS className */
  className?: string;
}

/**
 * Form section header component
 */
function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-component-sm mb-component-md">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h3 className="text-sm font-semibold font-display text-foreground">
        {title}
      </h3>
    </div>
  );
}

/**
 * Form field label component
 */
function FieldLabel({
  htmlFor,
  children,
  optional,
}: {
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm font-medium text-foreground"
    >
      {children}
      {optional && (
        <span className="ml-1 text-xs text-muted-foreground">
          (optional)
        </span>
      )}
    </label>
  );
}

/**
 * Field error message component
 */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-error" role="alert">
      {message}
    </p>
  );
}

/**
 * Help text component
 */
function HelpText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="text-xs text-muted-foreground">
      {children}
    </p>
  );
}

/**
 * Wireless Settings Form Component
 * Comprehensive form with sections for:
 * - Basic settings (SSID, password, hide SSID)
 * - Radio settings (channel, channel width, TX power)
 * - Security (security mode)
 * - Regional (country/region)
 *
 * @example
 * ```tsx
 * <WirelessSettingsForm
 *   currentValues={{
 *     ssid: "HomeNetwork",
 *     hideSsid: false,
 *     channel: "auto",
 *     channelWidth: "20MHz",
 *     txPower: 17,
 *     band: "2.4GHz",
 *   }}
 *   isSubmitting={updateMutation.isPending}
 *   onSubmit={(data) => updateMutation.mutate(data)}
 *   onCancel={() => setShowModal(false)}
 * />
 * ```
 */
export function WirelessSettingsForm({
  currentValues,
  isSubmitting = false,
  onSubmit,
  onCancel,
  className,
}: WirelessSettingsFormProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  // Get options based on current band
  const channelOptions = getChannelsByBand(currentValues.band);
  const channelWidthOptions = getChannelWidthsByBand(currentValues.band);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm<WirelessSettingsFormData>({
    resolver: zodResolver(wirelessSettingsSchema),
    defaultValues: {
      ssid: currentValues.ssid,
      password: '', // Don't show current password for security
      hideSsid: currentValues.hideSsid,
      channel: currentValues.channel,
      channelWidth: currentValues.channelWidth,
      txPower: currentValues.txPower,
      countryCode: currentValues.countryCode,
      securityMode: 'wpa2-psk', // Default to WPA2
    },
    mode: 'onBlur', // Validate on blur per UX design
  });

  /**
   * Handle form submission
   */
  const handleFormSubmit = (data: WirelessSettingsFormData) => {
    onSubmit(data);
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    if (!isDirty) {
      reset();
    }
    onCancel();
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn('space-y-component-lg', className)}
    >
      {/* Basic Settings Section */}
      <section>
        <SectionHeader icon={Wifi} title="Basic Settings" />
        <div className="space-y-component-md">
          {/* SSID Field */}
          <div className="space-y-component-sm">
            <FieldLabel htmlFor="ssid">Network Name (SSID)</FieldLabel>
            <Input
              id="ssid"
              {...register('ssid')}
              placeholder="Enter network name"
              maxLength={32}
              disabled={isSubmitting}
              aria-invalid={errors.ssid ? 'true' : 'false'}
              aria-describedby={errors.ssid ? 'ssid-error' : undefined}
            />
            <FieldError id="ssid-error" message={errors.ssid?.message} />
          </div>

          {/* Password Field */}
          <div className="space-y-component-sm">
            <FieldLabel htmlFor="password" optional>
              Password
            </FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Leave blank to keep current"
                disabled={isSubmitting}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={
                  errors.password ? 'password-error' : 'password-help'
                }
                className="pr-10"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-component-xs rounded-[var(--semantic-radius-button)] hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {!errors.password && (
              <HelpText id="password-help">
                Minimum 8 characters for WPA2/WPA3
              </HelpText>
            )}
            <FieldError id="password-error" message={errors.password?.message} />
          </div>

          {/* Hide SSID Toggle */}
          <div className="flex items-center justify-between py-component-sm">
            <div className="space-y-component-xs">
              <FieldLabel htmlFor="hideSsid">Hide Network</FieldLabel>
              <p className="text-xs text-muted-foreground">
                Network won't appear in device WiFi lists
              </p>
            </div>
            <Controller
              name="hideSsid"
              control={control}
              render={({ field }) => (
                <Switch
                  id="hideSsid"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>
        </div>
      </section>

      {/* Radio Settings Section */}
      <section>
        <SectionHeader icon={Radio} title="Radio Settings" />
        <div className="space-y-component-md">
          {/* Channel Selection */}
          <div className="space-y-component-sm">
            <FieldLabel htmlFor="channel">Channel</FieldLabel>
            <Controller
              name="channel"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="channel">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {channelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <HelpText id="channel-help">
              Auto is recommended for best performance
            </HelpText>
          </div>

          {/* Channel Width Selection */}
          <div className="space-y-component-sm">
            <FieldLabel htmlFor="channelWidth">Channel Width</FieldLabel>
            <Controller
              name="channelWidth"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="channelWidth">
                    <SelectValue placeholder="Select width" />
                  </SelectTrigger>
                  <SelectContent>
                    {channelWidthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <HelpText id="width-help">
              Wider channels offer more speed but may have more interference
            </HelpText>
          </div>

          {/* TX Power Selection */}
          <div className="space-y-component-sm">
            <FieldLabel htmlFor="txPower">Transmit Power</FieldLabel>
            <Controller
              name="txPower"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value?.toString()}
                  onValueChange={(val) => field.onChange(parseInt(val))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="txPower">
                    <SelectValue placeholder="Select power" />
                  </SelectTrigger>
                  <SelectContent>
                    {TX_POWER_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <HelpText id="power-help">
              Higher power extends range but uses more energy
            </HelpText>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section>
        <SectionHeader icon={Shield} title="Security" />
        <div className="space-y-component-md">
          {/* Security Mode Selection */}
          <div className="space-y-component-sm">
            <FieldLabel htmlFor="securityMode">Security Mode</FieldLabel>
            <Controller
              name="securityMode"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) =>
                    field.onChange(val as WirelessSecurityOption)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="securityMode">
                    <SelectValue placeholder="Select security" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECURITY_MODE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <HelpText id="security-help">
              WPA2/WPA3 Transitional is recommended for best compatibility
            </HelpText>
          </div>
        </div>
      </section>

      {/* Regional Section */}
      <section>
        <SectionHeader icon={Globe} title="Regional" />
        <div className="space-y-component-md">
          {/* Country Selection */}
          <div className="space-y-component-sm">
            <FieldLabel htmlFor="countryCode" optional>
              Country/Region
            </FieldLabel>
            <Controller
              name="countryCode"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="countryCode">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((option) => (
                      <SelectItem key={option.code} value={option.code}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <HelpText id="country-help">
              Sets regulatory domain for available channels and power limits
            </HelpText>
            <FieldError
              id="country-error"
              message={errors.countryCode?.message}
            />
          </div>
        </div>
      </section>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-component-md pt-component-md border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="min-h-[44px]"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-h-[44px]">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
