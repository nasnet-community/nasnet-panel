/**
 * EmailChannelFormMobile - Mobile Presenter
 *
 * Touch-optimized email configuration form for mobile (<640px).
 * Features single-column layout, 44px touch targets, and simplified UI.
 *
 * @module @nasnet/features/alerts/components
 * @see NAS-18.3: Email notification configuration
 * @description Renders a mobile-optimized email channel configuration form with
 * collapsible sections, 44px minimum touch targets, and full-screen actions.
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
import { useState, useCallback, memo } from 'react';
import { cn } from '@nasnet/ui/utils';
import { Button, Input, Label, Badge, Alert, AlertDescription } from '@nasnet/ui/primitives';
import type { UseEmailChannelFormReturn } from '../hooks/useEmailChannelForm';

// ============================================================================
// Types
// ============================================================================

export interface EmailChannelFormMobileProps {
  /** Headless hook instance */
  emailForm: UseEmailChannelFormReturn;
  /** Optional CSS class name for wrapper */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Mobile presenter for email channel configuration.
 * Optimized for touch with 44px minimum targets and collapsible sections.
 */
export const EmailChannelFormMobile = memo(function EmailChannelFormMobile({
  emailForm,
  className,
}: EmailChannelFormMobileProps) {
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
  } = emailForm;

  const { control, formState, register } = form;
  const { errors } = formState;

  // Local state
  const [recipientInput, setRecipientInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showServer, setShowServer] = useState(true);
  const [showAddresses, setShowAddresses] = useState(false);
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
      className={cn('space-y-component-md pb-24', className)}
    >
      {/* Enable Toggle */}
      <div className="border-border bg-card p-component-md flex items-center justify-between rounded-[var(--semantic-radius-card)] border">
        <div className="gap-component-md flex items-center">
          <Mail
            className="text-category-monitoring h-5 w-5"
            aria-hidden="true"
          />
          <div>
            <Label className="text-base font-semibold">Email Notifications</Label>
            <p className="text-muted-foreground text-sm">Send alerts via email</p>
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
              className="border-border h-6 w-6 rounded"
              aria-label="Enable email notifications"
            />
          )}
        />
      </div>

      {/* SMTP Server Section */}
      <div className="space-y-component-sm">
        <button
          type="button"
          onClick={() => setShowServer(!showServer)}
          className="border-border bg-card p-component-md flex w-full items-center justify-between rounded-[var(--semantic-radius-card)] border"
        >
          <div className="gap-component-md flex items-center">
            <Server className="text-category-monitoring h-5 w-5" />
            <span className="font-semibold">SMTP Server</span>
          </div>
          <ChevronDown
            className={`h-5 w-5 transition-transform ${showServer ? 'rotate-180' : ''}`}
          />
        </button>

        {showServer && (
          <div className="space-y-component-md border-border bg-card p-component-md rounded-[var(--semantic-radius-card)] border">
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

            <div className="space-y-component-sm">
              <Label htmlFor="port">
                Port <span className="text-error">*</span>
              </Label>
              <Controller
                control={control}
                name="port"
                render={({ field }) => (
                  <Input
                    id="port"
                    type="number"
                    inputMode="numeric"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    error={!!errors.port}
                    className="font-mono"
                  />
                )}
              />
              <p className="text-muted-foreground text-xs">
                Common: 587 (TLS), 465 (SSL), 25 (Plain)
              </p>
              {errors.port && <p className="text-error text-sm">{errors.port.message}</p>}
            </div>

            <div className="space-y-component-sm">
              <Label htmlFor="username">
                Username <span className="text-error">*</span>
              </Label>
              <Input
                id="username"
                placeholder="user@example.com"
                autoComplete="username"
                {...register('username')}
                error={!!errors.username}
                className="font-mono"
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
                  className="p-component-sm focus-visible:ring-ring absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[var(--semantic-radius-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ?
                    <EyeOff className="h-5 w-5" />
                  : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-error text-sm">{errors.password.message}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Email Addresses Section */}
      <div className="space-y-component-sm">
        <button
          type="button"
          onClick={() => setShowAddresses(!showAddresses)}
          className="border-border bg-card p-component-md flex w-full items-center justify-between rounded-[var(--semantic-radius-card)] border"
        >
          <div className="gap-component-md flex items-center">
            <Mail className="text-category-monitoring h-5 w-5" />
            <span className="font-semibold">Email Addresses</span>
          </div>
          <ChevronDown
            className={`h-5 w-5 transition-transform ${showAddresses ? 'rotate-180' : ''}`}
          />
        </button>

        {showAddresses && (
          <div className="space-y-component-md border-border bg-card p-component-md rounded-[var(--semantic-radius-card)] border">
            <div className="space-y-component-sm">
              <Label htmlFor="fromAddress">
                From Address <span className="text-error">*</span>
              </Label>
              <Input
                id="fromAddress"
                type="email"
                inputMode="email"
                placeholder="alerts@example.com"
                {...register('fromAddress')}
                error={!!errors.fromAddress}
                className="font-mono"
              />
              {errors.fromAddress && (
                <p className="text-error text-sm">{errors.fromAddress.message}</p>
              )}
            </div>

            <div className="space-y-component-sm">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                placeholder="NasNet Alerts"
                {...register('fromName')}
              />
              <p className="text-muted-foreground text-xs">Optional display name</p>
            </div>

            <div className="space-y-component-sm">
              <Label htmlFor="recipientInput">
                Recipients <span className="text-error">*</span>
              </Label>
              <div className="gap-component-md flex">
                <Input
                  id="recipientInput"
                  type="email"
                  inputMode="email"
                  placeholder="admin@example.com"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={handleRecipientKeyDown}
                  className="flex-1 font-mono"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleAddRecipient}
                  disabled={!recipientInput.trim()}
                  className="min-h-[44px] shrink-0"
                >
                  Add
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">Tap Add or press Enter (max 10)</p>

              {recipients.length > 0 && (
                <div className="gap-component-md border-border bg-muted/50 p-component-md flex flex-wrap rounded-[var(--semantic-radius-button)] border">
                  {recipients.map((email, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="gap-component-md pr-component-xs font-mono text-sm"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeRecipient(index)}
                        className="ml-component-xs hover:bg-error/20 focus-visible:ring-ring flex h-8 w-8 items-center justify-center rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        aria-label={`Remove ${email}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {errors.toAddresses && (
                <p className="text-error text-sm">{errors.toAddresses.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Advanced TLS Settings Section */}
      <div className="space-y-component-sm">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="border-border bg-card p-component-md flex w-full items-center justify-between rounded-[var(--semantic-radius-card)] border"
        >
          <div className="gap-component-md flex items-center">
            <Shield className="text-category-monitoring h-5 w-5" />
            <span className="font-semibold">Advanced TLS Settings</span>
          </div>
          <ChevronDown
            className={`h-5 w-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          />
        </button>

        {showAdvanced && (
          <div className="space-y-component-md border-border bg-card p-component-md rounded-[var(--semantic-radius-card)] border">
            <div className="border-border bg-muted/50 p-component-md flex items-center justify-between rounded-[var(--semantic-radius-button)] border">
              <div>
                <Label className="font-medium">Use TLS/SSL</Label>
                <p className="text-muted-foreground text-sm">Encrypt connection (recommended)</p>
              </div>
              <Controller
                control={control}
                name="useTLS"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="border-border h-6 w-6 rounded"
                    aria-label="Use TLS/SSL encryption"
                  />
                )}
              />
            </div>

            <div className="border-warning bg-warning/10 p-component-md flex items-center justify-between rounded-[var(--semantic-radius-button)] border">
              <div>
                <Label className="text-warning font-medium">Skip Certificate Check</Label>
                <p className="text-warning/80 text-sm">Use with self-signed certs only</p>
              </div>
              <Controller
                control={control}
                name="skipVerify"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="border-border h-6 w-6 rounded"
                    aria-label="Skip certificate verification"
                  />
                )}
              />
            </div>

            <Alert
              variant="default"
              className="border-warning bg-warning/10"
            >
              <AlertCircle
                className="text-warning h-4 w-4"
                aria-hidden="true"
              />
              <AlertDescription className="text-warning/90 text-sm">
                Skipping certificate verification reduces security.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {/* Test Result */}
      {testResult && (
        <Alert variant={testResult.success ? 'default' : 'destructive'}>
          {testResult.success ?
            <CheckCircle2 className="h-4 w-4" />
          : <AlertCircle className="h-4 w-4" />}
          <AlertDescription className="text-sm">{testResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Fixed Bottom Action Bar */}
      <div className="border-border bg-background p-component-md safe-area-inset-bottom fixed inset-x-0 bottom-0 z-10 border-t">
        <div className="gap-component-md mx-auto flex max-w-screen-sm">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleTest}
            disabled={!isValid || isTesting}
            className="min-h-[44px] flex-1"
          >
            {isTesting ? 'Testing...' : 'Test'}
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={!isValid}
            className="min-h-[44px] flex-1"
          >
            Save
          </Button>
        </div>
      </div>
    </form>
  );
});

EmailChannelFormMobile.displayName = 'EmailChannelFormMobile';
