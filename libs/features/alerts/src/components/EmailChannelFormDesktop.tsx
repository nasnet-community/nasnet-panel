/**
 * EmailChannelFormDesktop - Desktop Presenter
 *
 * Dense, pro-grade email configuration form for desktop (>1024px).
 * Features two-column layout, inline validation, and keyboard shortcuts.
 *
 * @module @nasnet/features/alerts/components
 * @see NAS-18.3: Email notification configuration
 * @description Renders a desktop-optimized email channel configuration form with
 * two-column grid layout, port presets, recipient chip management, and TLS settings.
 */

import { Controller } from 'react-hook-form';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Mail,
  Server,
  Shield,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';
import { useState, useCallback, useMemo, memo } from 'react';
import { cn } from '@nasnet/ui/utils';
import {
  Button,
  Input,
  Label,
  Badge,
  Alert,
  AlertDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Icon,
} from '@nasnet/ui/primitives';
import { SMTP_PORT_PRESETS } from '../schemas/email-config.schema';
import type { UseEmailChannelFormReturn } from '../hooks/useEmailChannelForm';

// ============================================================================
// Types
// ============================================================================

export interface EmailChannelFormDesktopProps {
  /** Headless hook instance */
  emailForm: UseEmailChannelFormReturn;
  /** Optional CSS class name for wrapper */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Desktop presenter for email channel configuration.
 * Optimized for pro users with dense two-column layout.
 */
export const EmailChannelFormDesktop = memo(function EmailChannelFormDesktop({
  emailForm,
  className,
}: EmailChannelFormDesktopProps) {
  const {
    form,
    recipients,
    addRecipient,
    removeRecipient,
    isValid,
    handleSubmit,
    handleTest,
    isTesting,
    testResult,
    applyPortPreset,
  } = emailForm;

  const { control, formState, register } = form;
  const { errors } = formState;

  // Local state
  const [recipientInput, setRecipientInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle recipient input (Enter or comma)
  const handleRecipientKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        if (recipientInput.trim()) {
          const added = addRecipient(recipientInput);
          if (added) {
            setRecipientInput('');
          }
        }
      }
    },
    [recipientInput, addRecipient]
  );

  const handleAddRecipient = useCallback(() => {
    if (recipientInput.trim()) {
      const added = addRecipient(recipientInput);
      if (added) {
        setRecipientInput('');
      }
    }
  }, [recipientInput, addRecipient]);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-component-lg', className)}
    >
      {/* Enable Toggle */}
      <div className="border-border bg-card p-component-md flex items-center justify-between rounded-[var(--semantic-radius-card)] border">
        <div className="gap-component-md flex items-center">
          <Icon
            icon={Mail}
            size="md"
            className="text-category-monitoring"
            aria-hidden="true"
          />
          <div>
            <Label className="text-base font-semibold">Email Notifications</Label>
            <p className="text-muted-foreground text-sm">Send alerts via SMTP email</p>
          </div>
        </div>
        <Controller
          control={control}
          name="enabled"
          render={({ field }) => (
            <input
              type="checkbox"
              checked={field.value}
              onChange={field.onChange}
              className="border-border h-5 w-5 rounded"
              aria-label="Enable email notifications"
            />
          )}
        />
      </div>

      {/* SMTP Server Settings */}
      <div className="space-y-component-md">
        <div className="gap-component-md flex items-center">
          <Icon
            icon={Server}
            size="sm"
            className="text-category-monitoring"
            aria-hidden="true"
          />
          <h3 className="font-display text-lg font-semibold">SMTP Server</h3>
        </div>

        <div className="gap-component-md grid grid-cols-2">
          {/* SMTP Host */}
          <div className="space-y-component-sm">
            <Label htmlFor="host">
              SMTP Host <span className="text-error">*</span>
            </Label>
            <Input
              id="host"
              placeholder="smtp.gmail.com"
              className="font-mono"
              {...register('host')}
              error={!!errors.host}
            />
            {errors.host && <p className="text-error text-sm">{errors.host.message}</p>}
          </div>

          {/* Port with Preset Selector */}
          <div className="space-y-component-sm">
            <Label htmlFor="port">
              Port <span className="text-error">*</span>
            </Label>
            <div className="gap-component-md flex">
              <Controller
                control={control}
                name="port"
                render={({ field }) => (
                  <Input
                    id="port"
                    type="number"
                    className="flex-1 font-mono"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    error={!!errors.port}
                  />
                )}
              />
              <Select
                onValueChange={(value) => {
                  const preset = SMTP_PORT_PRESETS.find((p) => p.port.toString() === value);
                  if (preset) {
                    applyPortPreset(preset.port, preset.tls);
                  }
                }}
              >
                <SelectTrigger className="w-[140px] rounded-[var(--semantic-radius-button)]">
                  <SelectValue placeholder="Preset" />
                </SelectTrigger>
                <SelectContent>
                  {SMTP_PORT_PRESETS.map((preset) => (
                    <SelectItem
                      key={preset.port}
                      value={preset.port.toString()}
                    >
                      {preset.port}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.port && <p className="text-error text-sm">{errors.port.message}</p>}
          </div>
        </div>

        {/* Username and Password */}
        <div className="gap-component-md grid grid-cols-2">
          <div className="space-y-component-sm">
            <Label htmlFor="username">
              Username <span className="text-error">*</span>
            </Label>
            <Input
              id="username"
              placeholder="user@example.com"
              autoComplete="username"
              className="font-mono"
              {...register('username')}
              error={!!errors.username}
            />
            {errors.username && <p className="text-error text-sm">{errors.username.message}</p>}
          </div>

          <div className="space-y-component-sm">
            <Label htmlFor="password">
              Password <span className="text-error">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="pr-component-xl font-mono"
                {...register('password')}
                error={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-[var(--semantic-radius-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon
                  icon={showPassword ? EyeOff : Eye}
                  size="sm"
                  aria-hidden="true"
                />
              </button>
            </div>
            {errors.password && <p className="text-error text-sm">{errors.password.message}</p>}
          </div>
        </div>
      </div>

      {/* Email Addresses */}
      <div className="space-y-component-md">
        <h3 className="font-display text-lg font-semibold">Email Addresses</h3>

        <div className="gap-component-md grid grid-cols-2">
          {/* From Address */}
          <div className="space-y-component-sm">
            <Label htmlFor="fromAddress">
              From Address <span className="text-error">*</span>
            </Label>
            <Input
              id="fromAddress"
              type="email"
              placeholder="alerts@example.com"
              className="font-mono"
              {...register('fromAddress')}
              error={!!errors.fromAddress}
            />
            {errors.fromAddress && (
              <p className="text-error text-sm">{errors.fromAddress.message}</p>
            )}
          </div>

          {/* From Name (Optional) */}
          <div className="space-y-component-sm">
            <Label htmlFor="fromName">From Name</Label>
            <Input
              id="fromName"
              placeholder="NasNet Alerts"
              {...register('fromName')}
            />
            <p className="text-muted-foreground text-xs">Optional display name</p>
          </div>
        </div>

        {/* Recipients (Multi-chip input) */}
        <div className="space-y-component-sm">
          <Label htmlFor="recipientInput">
            Recipients <span className="text-error">*</span>
          </Label>
          <div className="gap-component-md flex">
            <Input
              id="recipientInput"
              type="email"
              placeholder="admin@example.com"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              onKeyDown={handleRecipientKeyDown}
              className="flex-1 font-mono"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddRecipient}
              disabled={!recipientInput.trim()}
            >
              Add
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Press Enter or comma to add multiple recipients (max 10)
          </p>

          {/* Recipient Chips */}
          {recipients.length > 0 && (
            <div className="gap-component-md border-border bg-muted/50 p-component-md flex flex-wrap rounded-[var(--semantic-radius-button)] border">
              {recipients.map((email, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="gap-component-md pr-component-xs font-mono"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeRecipient(index)}
                    className="ml-component-xs hover:bg-error/20 focus-visible:ring-ring rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    aria-label={`Remove ${email}`}
                  >
                    <Icon
                      icon={X}
                      size="sm"
                      aria-hidden="true"
                    />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {errors.toAddresses && <p className="text-error text-sm">{errors.toAddresses.message}</p>}
        </div>
      </div>

      {/* Advanced Settings (Manual Collapsible) */}
      <div className="space-y-component-md">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="border-border bg-card p-component-md hover:bg-card/80 focus-visible:ring-ring flex w-full items-center justify-between rounded-[var(--semantic-radius-card)] border focus-visible:outline-none focus-visible:ring-2"
          aria-expanded={showAdvanced}
          aria-label="Advanced TLS Settings"
        >
          <div className="gap-component-md flex items-center">
            <Icon
              icon={Shield}
              size="sm"
              className="text-category-monitoring"
              aria-hidden="true"
            />
            <span className="font-semibold">Advanced TLS Settings</span>
          </div>
          <Icon
            icon={ChevronDown}
            size="sm"
            className={`text-muted-foreground transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {showAdvanced && (
          <div className="space-y-component-md border-border bg-card p-component-md rounded-[var(--semantic-radius-card)] border">
            {/* Use TLS */}
            <div className="border-border bg-muted/50 p-component-md flex items-center justify-between rounded-[var(--semantic-radius-button)] border">
              <div>
                <Label className="font-medium">Use TLS/SSL</Label>
                <p className="text-muted-foreground text-sm">
                  Encrypt connection with TLS (recommended)
                </p>
              </div>
              <Controller
                control={control}
                name="useTLS"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="border-border h-5 w-5 rounded"
                    aria-label="Use TLS/SSL encryption"
                  />
                )}
              />
            </div>

            {/* Skip Certificate Verification */}
            <div className="border-warning bg-warning/10 p-component-md flex items-center justify-between rounded-[var(--semantic-radius-button)] border">
              <div>
                <Label className="text-warning font-medium">Skip Certificate Verification</Label>
                <p className="text-warning/80 text-sm">
                  Bypass TLS certificate validation (use with caution)
                </p>
              </div>
              <Controller
                control={control}
                name="skipVerify"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="border-border h-5 w-5 rounded"
                    aria-label="Skip certificate verification"
                  />
                )}
              />
            </div>

            <Alert
              variant="default"
              className="border-warning bg-warning/10"
            >
              <AlertCircle className="text-warning h-4 w-4" />
              <AlertDescription className="text-warning/90">
                Skipping certificate verification reduces security. Only use for self-signed
                certificates in trusted environments.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {/* Test Result */}
      {testResult && (
        <Alert variant={testResult.success ? 'default' : 'destructive'}>
          <Icon
            icon={testResult.success ? CheckCircle2 : AlertCircle}
            size="sm"
            aria-hidden="true"
          />
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="gap-component-lg flex">
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={!isValid || isTesting}
          className="min-h-[44px] flex-1"
        >
          {isTesting ? 'Testing...' : 'Test Notification'}
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          className="min-h-[44px] flex-1"
        >
          Save Configuration
        </Button>
      </div>
    </form>
  );
});

EmailChannelFormDesktop.displayName = 'EmailChannelFormDesktop';
