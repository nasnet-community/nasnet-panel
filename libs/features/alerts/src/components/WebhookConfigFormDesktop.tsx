/**
 * WebhookConfigFormDesktop - Desktop Presenter
 *
 * Dense, pro-grade webhook configuration form for desktop (≥640px).
 * Features two-column layout, inline test results, and code editor for custom templates.
 *
 * @module @nasnet/features/alerts/components
 * @see NAS-18.4: Webhook notification configuration
 * @description Renders a desktop-optimized webhook configuration form with
 * dense 2-column layout, advanced header management, template selector, and signing secret dialog.
 */

import { Controller } from 'react-hook-form';
import {
  Webhook,
  Shield,
  Code,
  Settings,
  AlertCircle,
  CheckCircle2,
  Copy,
  Plus,
  X,
} from 'lucide-react';
import { useState, useCallback, memo } from 'react';
import { cn } from '@nasnet/ui/utils';
import {
  Button,
  Input,
  Label,
  Badge,
  Alert,
  AlertDescription,
  Textarea,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';
import {
  WEBHOOK_TEMPLATE_PRESETS,
  AUTH_TYPE_OPTIONS,
} from '../schemas/webhook.schema';
import type { UseWebhookConfigFormReturn } from '../hooks/useWebhookConfigForm';

// ============================================================================
// Types
// ============================================================================

export interface WebhookConfigFormDesktopProps {
  /** Headless hook instance */
  webhookForm: UseWebhookConfigFormReturn;
  /** Optional CSS class name for wrapper */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Desktop presenter for webhook configuration form.
 * Dense 2-column grid layout optimized for pro users with inline test results.
 */
const WebhookConfigFormDesktopComponent = memo(function WebhookConfigFormDesktop({
  webhookForm,
  className,
}: WebhookConfigFormDesktopProps) {
  const {
    form,
    isValid,
    handleSubmit,
    handleTest,
    isSubmitting,
    isTesting,
    testResult,
    clearTestResult,
    isEditMode,
    signingSecret,
    clearSigningSecret,
    addHeader,
    removeHeader,
    headers,
  } = webhookForm;

  const { control, watch } = form;

  // Watch form fields
  const authType = watch('authType');
  const template = watch('template');

  // Custom header input state
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');

  // Signing secret dialog
  const [showSigningSecretDialog, setShowSigningSecretDialog] = useState(!!signingSecret);
  const [copied, setCopied] = useState(false);

  const handleCopySecret = useCallback(() => {
    if (signingSecret) {
      navigator.clipboard.writeText(signingSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [signingSecret]);

  const handleCloseSecretDialog = useCallback(() => {
    setShowSigningSecretDialog(false);
    clearSigningSecret();
  }, [clearSigningSecret]);

  const handleAddHeader = useCallback(() => {
    if (newHeaderKey && newHeaderValue) {
      addHeader(newHeaderKey, newHeaderValue);
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  }, [newHeaderKey, newHeaderValue, addHeader]);

  return (
    <>
      <form onSubmit={handleSubmit} className={cn('space-y-component-lg', className)}>
        {/* Basic Configuration */}
        <div className="space-y-component-md">
          <h3 className="text-lg font-semibold font-display flex items-center gap-component-sm">
            <Webhook className="w-5 h-5" />
            Basic Configuration
          </h3>

          <div className="grid grid-cols-2 gap-component-md">
            {/* Name */}
            <div className="space-y-component-sm">
              <Label htmlFor="name">
                Webhook Name <span className="text-error">*</span>
              </Label>
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState }) => (
                  <div>
                    <Input
                      {...field}
                      id="name"
                      placeholder="Production Alerts"
                      className={fieldState.error ? 'border-error' : ''}
                    />
                    {fieldState.error && (
                      <p className="text-sm text-error mt-1">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* URL */}
            <div className="space-y-component-sm">
              <Label htmlFor="url">
                Webhook URL <span className="text-error">*</span>
              </Label>
              <Controller
                control={control}
                name="url"
                render={({ field, fieldState }) => (
                  <div>
                    <Input
                      {...field}
                      id="url"
                      type="url"
                      placeholder="https://api.example.com/webhook"
                      className={fieldState.error ? 'border-error font-mono' : 'font-mono'}
                    />
                    {fieldState.error && (
                      <p className="text-sm text-error mt-1">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Description */}
            <div className="space-y-component-sm col-span-2">
              <Label htmlFor="description">Description</Label>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="description"
                    placeholder="Optional description of this webhook"
                    rows={2}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="space-y-component-md">
          <h3 className="text-lg font-semibold font-display flex items-center gap-component-sm">
            <Shield className="w-5 h-5" />
            Authentication
          </h3>

          <div className="grid grid-cols-2 gap-component-md">
            {/* Auth Type */}
            <div className="space-y-component-sm">
              <Label htmlFor="authType">Authentication Type</Label>
              <Controller
                control={control}
                name="authType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="authType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTH_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Conditional Auth Fields */}
            {authType === 'BASIC' && (
              <>
                <div className="space-y-component-sm">
                  <Label htmlFor="username">Username</Label>
                  <Controller
                    control={control}
                    name="username"
                    render={({ field }) => <Input {...field} id="username" className="font-mono" />}
                  />
                </div>
                <div className="space-y-component-sm col-span-2">
                  <Label htmlFor="password">Password</Label>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field }) => (
                      <Input {...field} id="password" type="password" className="font-mono" />
                    )}
                  />
                </div>
              </>
            )}

            {authType === 'BEARER' && (
              <div className="space-y-component-sm col-span-2">
                <Label htmlFor="bearerToken">Bearer Token</Label>
                <Controller
                  control={control}
                  name="bearerToken"
                  render={({ field }) => (
                    <Input {...field} id="bearerToken" type="password" className="font-mono" />
                  )}
                />
              </div>
            )}
          </div>
        </div>

        {/* Template Configuration */}
        <div className="space-y-component-md">
          <h3 className="text-lg font-semibold font-display flex items-center gap-component-sm">
            <Code className="w-5 h-5" />
            Payload Template
          </h3>

          <div className="grid grid-cols-2 gap-component-md">
            {/* Template Type */}
            <div className="space-y-component-sm col-span-2">
              <Label htmlFor="template">Template Type</Label>
              <Controller
                control={control}
                name="template"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="template">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEBHOOK_TEMPLATE_PRESETS.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          <div>
                            <div className="font-medium">{preset.label}</div>
                            <div className="text-xs text-muted-foreground">{preset.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Custom Template */}
            {template === 'CUSTOM' && (
              <div className="space-y-component-sm col-span-2">
                <Label htmlFor="customTemplate">
                  Custom Template JSON <span className="text-error">*</span>
                </Label>
                <Controller
                  control={control}
                  name="customTemplate"
                  render={({ field, fieldState }) => (
                    <div>
                      <Textarea
                        {...field}
                        id="customTemplate"
                        placeholder='{"message": "{{message}}", "severity": "{{severity}}"}'
                        rows={6}
                        className={`font-mono text-sm rounded-[var(--semantic-radius-button)] ${fieldState.error ? 'border-error' : ''}`}
                      />
                      {fieldState.error && (
                        <p className="text-sm text-error mt-1">{fieldState.error.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>
            )}
          </div>
        </div>

        {/* Custom Headers */}
        <div className="space-y-component-md">
          <h3 className="text-lg font-semibold font-display">Custom Headers</h3>

          <div className="space-y-component-sm">
            {/* Existing Headers */}
            {Object.keys(headers).length > 0 && (
              <div className="space-y-component-sm mb-4">
                {Object.entries(headers).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-component-sm p-component-sm bg-muted rounded-[var(--semantic-radius-button)]">
                    <code className="flex-1 text-sm font-mono">
                      {key}: {value}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHeader(key)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Header */}
            <div className="flex gap-component-sm">
              <Input
                placeholder="Header name"
                value={newHeaderKey}
                onChange={(e) => setNewHeaderKey(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Header value"
                value={newHeaderValue}
                onChange={(e) => setNewHeaderValue(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddHeader}
                disabled={!newHeaderKey || !newHeaderValue}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-component-md">
          <h3 className="text-lg font-semibold font-display flex items-center gap-component-sm">
            <Settings className="w-5 h-5" />
            Advanced Settings
          </h3>

          <div className="grid grid-cols-3 gap-component-md">
            <div className="space-y-component-sm">
              <Label htmlFor="timeoutSeconds">Timeout (seconds)</Label>
              <Controller
                control={control}
                name="timeoutSeconds"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="timeoutSeconds"
                    type="number"
                    min={1}
                    max={60}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                )}
              />
            </div>

            <div className="space-y-component-sm">
              <Label htmlFor="maxRetries">Max Retries</Label>
              <Controller
                control={control}
                name="maxRetries"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="maxRetries"
                    type="number"
                    min={0}
                    max={5}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    className="font-mono"
                  />
                )}
              />
            </div>

            <div className="space-y-component-sm">
              <Label htmlFor="signingSecret">Signing Secret (optional)</Label>
              <Controller
                control={control}
                name="signingSecret"
                render={({ field }) => (
                  <Input {...field} id="signingSecret" type="password" className="font-mono" />
                )}
              />
            </div>
          </div>

          <div className="flex gap-component-md">
            <Controller
              control={control}
              name="retryEnabled"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="retryEnabled"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="retryEnabled" className="cursor-pointer">
                    Enable retries on failure
                  </Label>
                </div>
              )}
            />

            <Controller
              control={control}
              name="enabled"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="enabled"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="enabled" className="cursor-pointer">
                    Webhook enabled
                  </Label>
                </div>
              )}
            />
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <Alert variant={testResult.success ? 'default' : 'destructive'}>
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <div className="flex-1">
                <AlertDescription>{testResult.message}</AlertDescription>
                {testResult.responseTimeMs && (
                  <p className="text-sm text-muted mt-1">
                    Response time: {testResult.responseTimeMs}ms
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearTestResult}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Alert>
        )}

        {/* Form Actions */}
        <div className="flex gap-component-md pt-4 border-t">
          <Button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Webhook' : 'Create Webhook'}
          </Button>

          {isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isTesting}
            >
              {isTesting ? 'Testing...' : 'Test Webhook'}
            </Button>
          )}
        </div>
      </form>

      {/* Signing Secret Dialog (ONE TIME ONLY) */}
      <Dialog open={showSigningSecretDialog} onOpenChange={setShowSigningSecretDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook Signing Secret</DialogTitle>
            <DialogDescription>
              This is your webhook signing secret. Save it now - it will only be shown once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-component-md">
            <div className="p-component-md bg-muted rounded-[var(--semantic-radius-card)]">
              <code className="text-sm break-all font-mono">{signingSecret}</code>
            </div>

            <Button onClick={handleCopySecret} className="w-full">
              <Copy className="w-4 h-4 mr-2" />
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>

            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Use this secret to verify webhook signatures. It cannot be retrieved later.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={handleCloseSecretDialog}>I've Saved the Secret</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

WebhookConfigFormDesktopComponent.displayName = 'WebhookConfigFormDesktop';

export const WebhookConfigFormDesktop = WebhookConfigFormDesktopComponent;
