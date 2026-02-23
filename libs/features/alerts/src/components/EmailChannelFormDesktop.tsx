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
import { X, AlertCircle, CheckCircle2, Mail, Server, Shield, Eye, EyeOff, ChevronDown } from 'lucide-react';
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
  const handleRecipientKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (recipientInput.trim()) {
        const added = addRecipient(recipientInput);
        if (added) {
          setRecipientInput('');
        }
      }
    }
  }, [recipientInput, addRecipient]);

  const handleAddRecipient = useCallback(() => {
    if (recipientInput.trim()) {
      const added = addRecipient(recipientInput);
      if (added) {
        setRecipientInput('');
      }
    }
  }, [recipientInput, addRecipient]);

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Enable Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div>
            <Label className="text-base font-semibold">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Send alerts via SMTP email
            </p>
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
              className="h-5 w-5 rounded border-border"
              aria-label="Enable email notifications"
            />
          )}
        />
      </div>

      {/* SMTP Server Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">SMTP Server</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* SMTP Host */}
          <div className="space-y-2">
            <Label htmlFor="host">
              SMTP Host <span className="text-destructive">*</span>
            </Label>
            <Input
              id="host"
              placeholder="smtp.gmail.com"
              {...register('host')}
              error={!!errors.host}
            />
            {errors.host && (
              <p className="text-sm text-destructive">{errors.host.message}</p>
            )}
          </div>

          {/* Port with Preset Selector */}
          <div className="space-y-2">
            <Label htmlFor="port">
              Port <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Controller
                control={control}
                name="port"
                render={({ field }) => (
                  <Input
                    id="port"
                    type="number"
                    className="flex-1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    error={!!errors.port}
                  />
                )}
              />
              <Select
                onValueChange={(value) => {
                  const preset = SMTP_PORT_PRESETS.find(
                    (p) => p.port.toString() === value
                  );
                  if (preset) {
                    applyPortPreset(preset.port, preset.tls);
                  }
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Preset" />
                </SelectTrigger>
                <SelectContent>
                  {SMTP_PORT_PRESETS.map((preset) => (
                    <SelectItem key={preset.port} value={preset.port.toString()}>
                      {preset.port}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.port && (
              <p className="text-sm text-destructive">{errors.port.message}</p>
            )}
          </div>
        </div>

        {/* Username and Password */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username">
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="username"
              placeholder="user@example.com"
              autoComplete="username"
              {...register('username')}
              error={!!errors.username}
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="pr-10"
                {...register('password')}
                error={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Email Addresses */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Email Addresses</h3>

        <div className="grid grid-cols-2 gap-4">
          {/* From Address */}
          <div className="space-y-2">
            <Label htmlFor="fromAddress">
              From Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fromAddress"
              type="email"
              placeholder="alerts@example.com"
              {...register('fromAddress')}
              error={!!errors.fromAddress}
            />
            {errors.fromAddress && (
              <p className="text-sm text-destructive">{errors.fromAddress.message}</p>
            )}
          </div>

          {/* From Name (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="fromName">From Name</Label>
            <Input
              id="fromName"
              placeholder="NasNet Alerts"
              {...register('fromName')}
            />
            <p className="text-xs text-muted-foreground">Optional display name</p>
          </div>
        </div>

        {/* Recipients (Multi-chip input) */}
        <div className="space-y-2">
          <Label htmlFor="recipientInput">
            Recipients <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="recipientInput"
              type="email"
              placeholder="admin@example.com"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              onKeyDown={handleRecipientKeyDown}
              className="flex-1"
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
          <p className="text-xs text-muted-foreground">
            Press Enter or comma to add multiple recipients (max 10)
          </p>

          {/* Recipient Chips */}
          {recipients.length > 0 && (
            <div className="flex flex-wrap gap-2 rounded-md border border-border bg-muted/50 p-3">
              {recipients.map((email, index) => (
                <Badge key={index} variant="secondary" className="gap-1 pr-1">
                  {email}
                  <button
                    type="button"
                    onClick={() => removeRecipient(index)}
                    className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                    aria-label={`Remove ${email}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {errors.toAddresses && (
            <p className="text-sm text-destructive">{errors.toAddresses.message}</p>
          )}
        </div>
      </div>

      {/* Advanced Settings (Manual Collapsible) */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Advanced TLS Settings</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              showAdvanced ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showAdvanced && (
          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            {/* Use TLS */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
              <div>
                <Label className="font-medium">Use TLS/SSL</Label>
                <p className="text-sm text-muted-foreground">
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
                    className="h-5 w-5 rounded border-border"
                    aria-label="Use TLS/SSL encryption"
                  />
                )}
              />
            </div>

            {/* Skip Certificate Verification */}
            <div className="flex items-center justify-between rounded-lg border border-warning bg-warning/10 p-4">
              <div>
                <Label className="font-medium text-warning">
                  Skip Certificate Verification
                </Label>
                <p className="text-sm text-warning/80">
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
                    className="h-5 w-5 rounded border-border"
                    aria-label="Skip certificate verification"
                  />
                )}
              />
            </div>

            <Alert variant="default" className="border-warning bg-warning/10">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning/90">
                Skipping certificate verification reduces security. Only use for
                self-signed certificates in trusted environments.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {/* Test Result */}
      {testResult && (
        <Alert variant={testResult.success ? 'success' : 'destructive'}>
          {testResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={!isValid || isTesting}
          className="flex-1"
        >
          {isTesting ? 'Testing...' : 'Test Notification'}
        </Button>
        <Button type="submit" disabled={!isValid} className="flex-1">
          Save Configuration
        </Button>
      </div>
    </form>
  );
});

EmailChannelFormDesktop.displayName = 'EmailChannelFormDesktop';
