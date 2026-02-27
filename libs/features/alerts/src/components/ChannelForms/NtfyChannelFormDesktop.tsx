/**
 * NtfyChannelFormDesktop - Desktop Presenter
 *
 * @description
 * Dense, pro-grade ntfy.sh configuration form for desktop (>1024px).
 * Features two-column layout, inline validation, and keyboard shortcuts.
 *
 * @module @nasnet/features/alerts/components/ChannelForms
 * @see NAS-18.X: Ntfy.sh notification configuration
 */

import { Bell, Server, Shield, Tag, Eye, EyeOff, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { memo, useState, useCallback } from 'react';
import {
  Button,
  Input,
  Label,
  Badge,
  Alert,
  AlertDescription,
  Icon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';
import { NTFY_PRIORITY_PRESETS, NTFY_SERVER_PRESETS } from '../../schemas/ntfy-config.schema';
import type { UseNtfyChannelFormReturn } from '../../hooks/useNtfyChannelForm';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for NtfyChannelFormDesktop presenter
 */
export interface NtfyChannelFormDesktopProps {
  /**
   * Headless hook instance containing form state, handlers, and validation logic
   */
  ntfyForm: UseNtfyChannelFormReturn;
}

// ============================================================================
// Component
// ============================================================================

function NtfyChannelFormDesktopComponent({ ntfyForm }: NtfyChannelFormDesktopProps) {
  const {
    form,
    tags,
    addTag,
    removeTag,
    isValid,
    handleSubmit,
    handleTest,
    isTesting,
    testResult,
    applyPriorityPreset,
    applyServerPreset,
    hasAuthentication,
    toggleAuthentication,
  } = ntfyForm;

  const { control, formState, register } = form;
  const { errors } = formState;

  // Local state
  const [tagInput, setTagInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAuthFields, setShowAuthFields] = useState(hasAuthentication);

  // Handle tag input (Enter or comma)
  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        if (tagInput.trim()) {
          const added = addTag(tagInput);
          if (added) {
            setTagInput('');
          }
        }
      }
    },
    [tagInput, addTag]
  );

  const handleAddTag = useCallback(() => {
    if (tagInput.trim()) {
      const added = addTag(tagInput);
      if (added) {
        setTagInput('');
      }
    }
  }, [tagInput, addTag]);

  const handleToggleAuth = useCallback(() => {
    const newState = !showAuthFields;
    setShowAuthFields(newState);
    if (!newState) {
      toggleAuthentication(false);
    }
  }, [showAuthFields, toggleAuthentication]);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-component-lg"
    >
      {/* Enable Toggle */}
      <div className="border-border bg-card p-component-md flex items-center justify-between rounded-[var(--semantic-radius-card)] border">
        <div className="gap-component-md flex items-center">
          <Icon
            icon={Bell}
            size="md"
            className="text-category-monitoring"
            aria-hidden="true"
          />
          <div>
            <Label className="text-base font-semibold">Ntfy.sh Notifications</Label>
            <p className="text-muted-foreground text-sm">Send push notifications via ntfy.sh</p>
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
              className="border-border h-5 w-5 cursor-pointer rounded"
              aria-label="Enable ntfy.sh notifications"
            />
          )}
        />
      </div>

      {/* Server Settings */}
      <div className="space-y-component-md">
        <div className="gap-component-sm flex items-center">
          <Icon
            icon={Server}
            size="md"
            className="text-muted-foreground"
            aria-hidden="true"
          />
          <h3 className="text-lg font-semibold">Server Configuration</h3>
        </div>

        <div className="gap-component-md grid grid-cols-2">
          {/* Server URL with Preset Selector */}
          <div className="space-y-component-sm col-span-2">
            <Label htmlFor="serverUrl">
              Server URL <span className="text-error">*</span>
            </Label>
            <div className="gap-component-md flex">
              <Input
                id="serverUrl"
                placeholder="https://ntfy.sh"
                className="flex-1 font-mono"
                {...register('serverUrl')}
                error={!!errors.serverUrl}
              />
              <Select
                onValueChange={(value) => {
                  if (value) {
                    applyServerPreset(value);
                  }
                }}
              >
                <SelectTrigger className="w-[200px] rounded-[var(--semantic-radius-button)]">
                  <SelectValue placeholder="Preset" />
                </SelectTrigger>
                <SelectContent>
                  {NTFY_SERVER_PRESETS.map((preset, index) => (
                    <SelectItem
                      key={index}
                      value={preset.url || 'custom'}
                      disabled={!preset.url}
                    >
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.serverUrl && (
              <p
                className="text-error text-sm"
                role="alert"
              >
                {errors.serverUrl.message}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Use https://ntfy.sh or your self-hosted instance
            </p>
          </div>

          {/* Topic */}
          <div className="space-y-component-sm">
            <Label htmlFor="topic">
              Topic <span className="text-error">*</span>
            </Label>
            <Input
              id="topic"
              placeholder="my-alerts"
              className="font-mono"
              {...register('topic')}
              error={!!errors.topic}
            />
            {errors.topic && (
              <p
                className="text-error text-sm"
                role="alert"
              >
                {errors.topic.message}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Letters, numbers, hyphens, and underscores only
            </p>
          </div>

          {/* Priority Selector */}
          <div className="space-y-component-sm">
            <Label htmlFor="priority">Message Priority</Label>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <Select
                  value={field.value?.toString()}
                  onValueChange={(value) => {
                    const priority = parseInt(value);
                    applyPriorityPreset(priority);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {NTFY_PRIORITY_PRESETS.map((preset) => (
                      <SelectItem
                        key={preset.value}
                        value={preset.value.toString()}
                      >
                        <div className="gap-component-sm flex items-center">
                          <span>{preset.icon}</span>
                          <span>{preset.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.priority && (
              <p
                className="text-error text-sm"
                role="alert"
              >
                {errors.priority.message}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Higher priority = more prominent notifications
            </p>
          </div>
        </div>
      </div>

      {/* Authentication (Optional) */}
      <div className="space-y-component-md">
        <div className="flex items-center justify-between">
          <div className="gap-component-md flex items-center">
            <Icon
              icon={Shield}
              size="md"
              className="text-category-monitoring"
              aria-hidden="true"
            />
            <h3 className="text-lg font-semibold">Authentication (Optional)</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggleAuth}
            aria-expanded={showAuthFields}
            aria-controls="auth-fields"
          >
            {showAuthFields ? 'Hide' : 'Show'}
          </Button>
        </div>

        {showAuthFields && (
          <div
            className="gap-component-md grid grid-cols-2"
            id="auth-fields"
          >
            <div className="space-y-component-sm">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="username"
                autoComplete="username"
                {...register('username')}
                error={!!errors.username}
              />
              {errors.username && (
                <p
                  className="text-error text-sm"
                  role="alert"
                >
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-component-sm">
              <Label htmlFor="password">Password</Label>
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
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-sm p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon
                    icon={showPassword ? EyeOff : Eye}
                    size="sm"
                    aria-hidden="true"
                  />
                </button>
              </div>
              {errors.password && (
                <p
                  className="text-error text-sm"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tags (Optional) */}
      <div className="space-y-component-md">
        <div className="gap-component-md flex items-center">
          <Icon
            icon={Tag}
            size="md"
            className="text-category-monitoring"
            aria-hidden="true"
          />
          <h3 className="text-lg font-semibold">Tags (Optional)</h3>
        </div>

        {/* Tag Input */}
        <div className="gap-component-md flex">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Enter tag and press Enter"
            aria-label="Tag name"
            disabled={tags.length >= 10}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddTag}
            disabled={!tagInput.trim() || tags.length >= 10}
            aria-label="Add tag"
          >
            Add Tag
          </Button>
        </div>

        {/* Tag List */}
        {tags.length > 0 && (
          <div className="gap-component-md flex flex-wrap">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="gap-component-md flex items-center font-mono"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-component-xs hover:text-error focus-visible:ring-ring flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  aria-label={`Remove ${tag}`}
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

        {tags.length >= 10 && (
          <p className="text-muted-foreground text-sm">Maximum 10 tags reached</p>
        )}
      </div>

      {/* Test Result */}
      {testResult && (
        <Alert
          variant={testResult.success ? 'default' : 'destructive'}
          role="alert"
        >
          <Icon
            icon={testResult.success ? CheckCircle2 : AlertCircle}
            size="sm"
            aria-hidden="true"
          />
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="gap-component-lg flex items-center justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={!isValid || isTesting}
          className="min-h-[44px]"
        >
          {isTesting ? 'Testing...' : 'Test Notification'}
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          className="min-h-[44px]"
        >
          Save Configuration
        </Button>
      </div>
    </form>
  );
}

export const NtfyChannelFormDesktop = memo(NtfyChannelFormDesktopComponent);
NtfyChannelFormDesktop.displayName = 'NtfyChannelFormDesktop';
