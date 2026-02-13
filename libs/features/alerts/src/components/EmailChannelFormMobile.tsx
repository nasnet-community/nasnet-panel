/**
 * EmailChannelFormMobile - Mobile Presenter
 *
 * Touch-optimized email configuration form for mobile (<640px).
 * Features single-column layout, 44px touch targets, and simplified UI.
 *
 * @module @nasnet/features/alerts/components
 * @see NAS-18.3: Email notification configuration
 */

import { Controller } from 'react-hook-form';
import { X, AlertCircle, CheckCircle2, Mail, Server, Shield, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button, Input, Label, Badge, Alert, AlertDescription } from '@nasnet/ui/primitives';
import type { UseEmailChannelFormReturn } from '../hooks/useEmailChannelForm';

// ============================================================================
// Types
// ============================================================================

export interface EmailChannelFormMobileProps {
  /** Headless hook instance */
  emailForm: UseEmailChannelFormReturn;
}

// ============================================================================
// Component
// ============================================================================

export function EmailChannelFormMobile({ emailForm }: EmailChannelFormMobileProps) {
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
  const handleRecipientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (recipientInput.trim()) {
        const added = addRecipient(recipientInput);
        if (added) {
          setRecipientInput('');
        }
      }
    }
  };

  const handleAddRecipient = () => {
    if (recipientInput.trim()) {
      const added = addRecipient(recipientInput);
      if (added) {
        setRecipientInput('');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-24">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div>
            <Label className="text-base font-semibold">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">Send alerts via email</p>
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
              className="h-6 w-6 rounded border-gray-300"
            />
          )}
        />
      </div>

      {/* SMTP Server Section */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowServer(!showServer)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            <span className="font-semibold">SMTP Server</span>
          </div>
          <ChevronDown
            className={`h-5 w-5 transition-transform ${showServer ? 'rotate-180' : ''}`}
          />
        </button>

        {showServer && (
          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
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

            <div className="space-y-2">
              <Label htmlFor="port">
                Port <span className="text-destructive">*</span>
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
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                Common: 587 (TLS), 465 (SSL), 25 (Plain)
              </p>
              {errors.port && (
                <p className="text-sm text-destructive">{errors.port.message}</p>
              )}
            </div>

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
                  className="pr-12"
                  {...register('password')}
                  error={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Email Addresses Section */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowAddresses(!showAddresses)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <span className="font-semibold">Email Addresses</span>
          </div>
          <ChevronDown
            className={`h-5 w-5 transition-transform ${showAddresses ? 'rotate-180' : ''}`}
          />
        </button>

        {showAddresses && (
          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            <div className="space-y-2">
              <Label htmlFor="fromAddress">
                From Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fromAddress"
                type="email"
                inputMode="email"
                placeholder="alerts@example.com"
                {...register('fromAddress')}
                error={!!errors.fromAddress}
              />
              {errors.fromAddress && (
                <p className="text-sm text-destructive">{errors.fromAddress.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input id="fromName" placeholder="NasNet Alerts" {...register('fromName')} />
              <p className="text-xs text-muted-foreground">Optional display name</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientInput">
                Recipients <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="recipientInput"
                  type="email"
                  inputMode="email"
                  placeholder="admin@example.com"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={handleRecipientKeyDown}
                  className="flex-1"
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
              <p className="text-xs text-muted-foreground">Tap Add or press Enter (max 10)</p>

              {recipients.length > 0 && (
                <div className="flex flex-wrap gap-2 rounded-md border border-border bg-muted/50 p-3">
                  {recipients.map((email, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 pr-1 text-sm">
                      {email}
                      <button
                        type="button"
                        onClick={() => removeRecipient(index)}
                        className="ml-1 rounded-full p-1 min-h-[32px] min-w-[32px] flex items-center justify-center hover:bg-destructive/20"
                        aria-label={`Remove ${email}`}
                      >
                        <X className="h-4 w-4" />
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
        )}
      </div>

      {/* Advanced TLS Settings Section */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">Advanced TLS Settings</span>
          </div>
          <ChevronDown
            className={`h-5 w-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          />
        </button>

        {showAdvanced && (
          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
              <div>
                <Label className="font-medium">Use TLS/SSL</Label>
                <p className="text-sm text-muted-foreground">Encrypt connection (recommended)</p>
              </div>
              <Controller
                control={control}
                name="useTLS"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-6 w-6 rounded border-gray-300"
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 p-4">
              <div>
                <Label className="font-medium text-amber-600">Skip Certificate Check</Label>
                <p className="text-sm text-amber-700">Use with self-signed certs only</p>
              </div>
              <Controller
                control={control}
                name="skipVerify"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-6 w-6 rounded border-amber-400"
                  />
                )}
              />
            </div>

            <Alert variant="default" className="border-amber-300 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-700">
                Skipping certificate verification reduces security.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {/* Test Result */}
      {testResult && (
        <Alert variant={testResult.success ? 'default' : 'destructive'}>
          {testResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription className="text-sm">{testResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Fixed Bottom Action Bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background p-4 safe-area-inset-bottom">
        <div className="mx-auto flex max-w-screen-sm gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleTest}
            disabled={!isValid || isTesting}
            className="flex-1 min-h-[44px]"
          >
            {isTesting ? 'Testing...' : 'Test'}
          </Button>
          <Button type="submit" size="lg" disabled={!isValid} className="flex-1 min-h-[44px]">
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}
