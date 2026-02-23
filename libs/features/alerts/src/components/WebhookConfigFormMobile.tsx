/**
 * WebhookConfigFormMobile - Mobile Presenter
 *
 * Touch-optimized webhook configuration form for mobile (<640px).
 * Features stacked layout, 44px minimum touch targets, and bottom sheet for test results.
 *
 * @module @nasnet/features/alerts/components
 * @see NAS-18.4: Webhook notification configuration
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
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
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

export interface WebhookConfigFormMobileProps {
  /** Headless hook instance */
  webhookForm: UseWebhookConfigFormReturn;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Mobile presenter for webhook configuration form.
 * Stacked full-width inputs with 44px minimum touch targets.
 */
export function WebhookConfigFormMobile({ webhookForm }: WebhookConfigFormMobileProps) {
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

  // Section expansion state
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    auth: false,
    template: false,
    headers: false,
    advanced: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Signing secret dialog
  const [showSigningSecretDialog, setShowSigningSecretDialog] = useState(!!signingSecret);
  const [copied, setCopied] = useState(false);

  // Test result bottom sheet
  const [showTestSheet, setShowTestSheet] = useState(false);

  const handleCopySecret = () => {
    if (signingSecret) {
      navigator.clipboard.writeText(signingSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseSecretDialog = () => {
    setShowSigningSecretDialog(false);
    clearSigningSecret();
  };

  const handleAddHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      addHeader(newHeaderKey, newHeaderValue);
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  // Show test result in bottom sheet
  if (testResult && !showTestSheet) {
    setShowTestSheet(true);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 pb-24">
        {/* Basic Configuration Section */}
        <div className="bg-surface rounded-lg border">
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 text-left"
            style={{ minHeight: '44px' }}
            onClick={() => toggleSection('basic')}
          >
            <div className="flex items-center gap-3">
              <Webhook className="w-5 h-5" />
              <span className="font-semibold">Basic Configuration</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${expandedSections.basic ? 'rotate-180' : ''}`}
            />
          </button>

          {expandedSections.basic && (
            <div className="p-4 space-y-4 border-t">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name-mobile">
                  Webhook Name <span className="text-error">*</span>
                </Label>
                <Controller
                  control={control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        {...field}
                        id="name-mobile"
                        placeholder="Production Alerts"
                        style={{ minHeight: '44px' }}
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
              <div className="space-y-2">
                <Label htmlFor="url-mobile">
                  Webhook URL <span className="text-error">*</span>
                </Label>
                <Controller
                  control={control}
                  name="url"
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        {...field}
                        id="url-mobile"
                        type="url"
                        placeholder="https://api.example.com/webhook"
                        style={{ minHeight: '44px' }}
                        className={fieldState.error ? 'border-error' : ''}
                      />
                      {fieldState.error && (
                        <p className="text-sm text-error mt-1">{fieldState.error.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description-mobile">Description</Label>
                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="description-mobile"
                      placeholder="Optional description"
                      rows={3}
                      style={{ minHeight: '44px' }}
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* Authentication Section */}
        <div className="bg-surface rounded-lg border">
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 text-left"
            style={{ minHeight: '44px' }}
            onClick={() => toggleSection('auth')}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <span className="font-semibold">Authentication</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${expandedSections.auth ? 'rotate-180' : ''}`}
            />
          </button>

          {expandedSections.auth && (
            <div className="p-4 space-y-4 border-t">
              {/* Auth Type */}
              <div className="space-y-2">
                <Label htmlFor="authType-mobile">Authentication Type</Label>
                <Controller
                  control={control}
                  name="authType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="authType-mobile" style={{ minHeight: '44px' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUTH_TYPE_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            style={{ minHeight: '44px' }}
                          >
                            <div className="py-1">
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted">{option.description}</div>
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
                  <div className="space-y-2">
                    <Label htmlFor="username-mobile">Username</Label>
                    <Controller
                      control={control}
                      name="username"
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="username-mobile"
                          style={{ minHeight: '44px' }}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-mobile">Password</Label>
                    <Controller
                      control={control}
                      name="password"
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="password-mobile"
                          type="password"
                          style={{ minHeight: '44px' }}
                        />
                      )}
                    />
                  </div>
                </>
              )}

              {authType === 'BEARER' && (
                <div className="space-y-2">
                  <Label htmlFor="bearerToken-mobile">Bearer Token</Label>
                  <Controller
                    control={control}
                    name="bearerToken"
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="bearerToken-mobile"
                        type="password"
                        style={{ minHeight: '44px' }}
                      />
                    )}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Template Configuration Section */}
        <div className="bg-surface rounded-lg border">
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 text-left"
            style={{ minHeight: '44px' }}
            onClick={() => toggleSection('template')}
          >
            <div className="flex items-center gap-3">
              <Code className="w-5 h-5" />
              <span className="font-semibold">Payload Template</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${expandedSections.template ? 'rotate-180' : ''}`}
            />
          </button>

          {expandedSections.template && (
            <div className="p-4 space-y-4 border-t">
              {/* Template Type */}
              <div className="space-y-2">
                <Label htmlFor="template-mobile">Template Type</Label>
                <Controller
                  control={control}
                  name="template"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="template-mobile" style={{ minHeight: '44px' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEBHOOK_TEMPLATE_PRESETS.map((preset) => (
                          <SelectItem
                            key={preset.value}
                            value={preset.value}
                            style={{ minHeight: '44px' }}
                          >
                            <div className="py-1">
                              <div className="font-medium">{preset.label}</div>
                              <div className="text-xs text-muted">{preset.description}</div>
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
                <div className="space-y-2">
                  <Label htmlFor="customTemplate-mobile">
                    Custom Template JSON <span className="text-error">*</span>
                  </Label>
                  <Controller
                    control={control}
                    name="customTemplate"
                    render={({ field, fieldState }) => (
                      <div>
                        <Textarea
                          {...field}
                          id="customTemplate-mobile"
                          placeholder='{"message": "{{message}}"}'
                          rows={8}
                          className={`font-mono text-sm ${fieldState.error ? 'border-error' : ''}`}
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
          )}
        </div>

        {/* Custom Headers Section */}
        <div className="bg-surface rounded-lg border">
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 text-left"
            style={{ minHeight: '44px' }}
            onClick={() => toggleSection('headers')}
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold">Custom Headers</span>
              {Object.keys(headers).length > 0 && (
                <Badge variant="secondary">{Object.keys(headers).length}</Badge>
              )}
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${expandedSections.headers ? 'rotate-180' : ''}`}
            />
          </button>

          {expandedSections.headers && (
            <div className="p-4 space-y-4 border-t">
              {/* Existing Headers */}
              {Object.keys(headers).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(headers).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 p-3 bg-muted rounded">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{key}</div>
                        <div className="text-xs text-muted truncate">{value}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHeader(key)}
                        style={{ minHeight: '44px', minWidth: '44px' }}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Header */}
              <div className="space-y-2">
                <Input
                  placeholder="Header name"
                  value={newHeaderKey}
                  onChange={(e) => setNewHeaderKey(e.target.value)}
                  style={{ minHeight: '44px' }}
                />
                <Input
                  placeholder="Header value"
                  value={newHeaderValue}
                  onChange={(e) => setNewHeaderValue(e.target.value)}
                  style={{ minHeight: '44px' }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddHeader}
                  disabled={!newHeaderKey || !newHeaderValue}
                  className="w-full"
                  style={{ minHeight: '44px' }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Header
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Settings Section */}
        <div className="bg-surface rounded-lg border">
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 text-left"
            style={{ minHeight: '44px' }}
            onClick={() => toggleSection('advanced')}
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5" />
              <span className="font-semibold">Advanced Settings</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${expandedSections.advanced ? 'rotate-180' : ''}`}
            />
          </button>

          {expandedSections.advanced && (
            <div className="p-4 space-y-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="timeoutSeconds-mobile">Timeout (seconds)</Label>
                <Controller
                  control={control}
                  name="timeoutSeconds"
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="timeoutSeconds-mobile"
                      type="number"
                      min={1}
                      max={60}
                      style={{ minHeight: '44px' }}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxRetries-mobile">Max Retries</Label>
                <Controller
                  control={control}
                  name="maxRetries"
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="maxRetries-mobile"
                      type="number"
                      min={0}
                      max={5}
                      style={{ minHeight: '44px' }}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signingSecret-mobile">Signing Secret (optional)</Label>
                <Controller
                  control={control}
                  name="signingSecret"
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="signingSecret-mobile"
                      type="password"
                      style={{ minHeight: '44px' }}
                    />
                  )}
                />
              </div>

              <div className="space-y-3">
                <Controller
                  control={control}
                  name="retryEnabled"
                  render={({ field }) => (
                    <div
                      className="flex items-center gap-3 p-3 bg-muted rounded cursor-pointer"
                      style={{ minHeight: '44px' }}
                      onClick={() => field.onChange(!field.value)}
                    >
                      <Checkbox
                        id="retryEnabled-mobile"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="retryEnabled-mobile" className="cursor-pointer">
                        Enable retries on failure
                      </Label>
                    </div>
                  )}
                />

                <Controller
                  control={control}
                  name="enabled"
                  render={({ field }) => (
                    <div
                      className="flex items-center gap-3 p-3 bg-muted rounded cursor-pointer"
                      style={{ minHeight: '44px' }}
                      onClick={() => field.onChange(!field.value)}
                    >
                      <Checkbox
                        id="enabled-mobile"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="enabled-mobile" className="cursor-pointer">
                        Webhook enabled
                      </Label>
                    </div>
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* Form Actions - Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t space-y-2">
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full"
            style={{ minHeight: '44px' }}
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Webhook' : 'Create Webhook'}
          </Button>

          {isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isTesting}
              className="w-full"
              style={{ minHeight: '44px' }}
            >
              {isTesting ? 'Testing...' : 'Test Webhook'}
            </Button>
          )}
        </div>
      </form>

      {/* Test Result Bottom Sheet */}
      <Dialog open={showTestSheet} onOpenChange={setShowTestSheet}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {testResult?.success ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <AlertCircle className="w-5 h-5 text-error" />
              )}
              Test Result
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant={testResult?.success ? 'default' : 'destructive'}>
              <AlertDescription>{testResult?.message}</AlertDescription>
            </Alert>

            {testResult?.responseTimeMs && (
              <div className="text-sm text-muted">
                Response time: {testResult.responseTimeMs}ms
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowTestSheet(false);
                clearTestResult();
              }}
              className="w-full"
              style={{ minHeight: '44px' }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signing Secret Dialog (ONE TIME ONLY) */}
      <Dialog open={showSigningSecretDialog} onOpenChange={setShowSigningSecretDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook Signing Secret</DialogTitle>
            <DialogDescription>
              Save this secret now - it will only be shown once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <code className="text-sm break-all">{signingSecret}</code>
            </div>

            <Button
              onClick={handleCopySecret}
              className="w-full"
              style={{ minHeight: '44px' }}
            >
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
            <Button
              onClick={handleCloseSecretDialog}
              className="w-full"
              style={{ minHeight: '44px' }}
            >
              I've Saved the Secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
