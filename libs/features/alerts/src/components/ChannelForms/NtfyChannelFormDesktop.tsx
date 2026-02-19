/**
 * NtfyChannelFormDesktop - Desktop Presenter
 *
 * Dense, pro-grade ntfy.sh configuration form for desktop (>1024px).
 * Features two-column layout, inline validation, and keyboard shortcuts.
 *
 * @module @nasnet/features/alerts/components/ChannelForms
 * @see NAS-18.X: Ntfy.sh notification configuration
 */

import { Controller } from 'react-hook-form';
import { X, AlertCircle, CheckCircle2, Bell, Server, Shield, Eye, EyeOff, Tag as TagIcon } from 'lucide-react';
import { memo, useState } from 'react';
import { Button, Input, Label, Badge, Alert, AlertDescription } from '@nasnet/ui/primitives';
import {
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

export interface NtfyChannelFormDesktopProps {
  /** Headless hook instance */
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
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        const added = addTag(tagInput);
        if (added) {
          setTagInput('');
        }
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const added = addTag(tagInput);
      if (added) {
        setTagInput('');
      }
    }
  };

  const handleToggleAuth = () => {
    const newState = !showAuthFields;
    setShowAuthFields(newState);
    if (!newState) {
      toggleAuthentication(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <div>
            <Label className="text-base font-semibold">Ntfy.sh Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Send push notifications via ntfy.sh
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
              aria-label="Enable ntfy.sh notifications"
            />
          )}
        />
      </div>

      {/* Server Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Server Configuration</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Server URL with Preset Selector */}
          <div className="space-y-2 col-span-2">
            <Label htmlFor="serverUrl">
              Server URL <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="serverUrl"
                placeholder="https://ntfy.sh"
                className="flex-1"
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
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Preset" />
                </SelectTrigger>
                <SelectContent>
                  {NTFY_SERVER_PRESETS.map((preset, index) => (
                    <SelectItem key={index} value={preset.url || 'custom'} disabled={!preset.url}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.serverUrl && (
              <p className="text-sm text-destructive" role="alert">{errors.serverUrl.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Use https://ntfy.sh or your self-hosted instance
            </p>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">
              Topic <span className="text-destructive">*</span>
            </Label>
            <Input
              id="topic"
              placeholder="my-alerts"
              {...register('topic')}
              error={!!errors.topic}
            />
            {errors.topic && (
              <p className="text-sm text-destructive" role="alert">{errors.topic.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Letters, numbers, hyphens, and underscores only
            </p>
          </div>

          {/* Priority Selector */}
          <div className="space-y-2">
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
                      <SelectItem key={preset.value} value={preset.value.toString()}>
                        <div className="flex items-center gap-2">
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
              <p className="text-sm text-destructive" role="alert">{errors.priority.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Higher priority = more prominent notifications
            </p>
          </div>
        </div>
      </div>

      {/* Authentication (Optional) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <h3 className="text-lg font-semibold">Authentication (Optional)</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggleAuth}
          >
            {showAuthFields ? 'Hide' : 'Show'}
          </Button>
        </div>

        {showAuthFields && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="username"
                autoComplete="username"
                {...register('username')}
                error={!!errors.username}
              />
              {errors.username && (
                <p className="text-sm text-destructive" role="alert">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive" role="alert">{errors.password.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tags (Optional) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TagIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Tags (Optional)</h3>
        </div>

        {/* Tag Input */}
        <div className="flex gap-2">
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
          >
            Add Tag
          </Button>
        </div>

        {/* Tag List */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-1 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {tags.length >= 10 && (
          <p className="text-sm text-muted-foreground">
            Maximum 10 tags reached
          </p>
        )}
      </div>

      {/* Test Result */}
      {testResult && (
        <Alert variant={testResult.success ? 'default' : 'destructive'} role="alert">
          {testResult.success ? (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
          )}
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={!isValid || isTesting}
        >
          {isTesting ? 'Testing...' : 'Test Notification'}
        </Button>
        <Button type="submit" disabled={!isValid}>
          Save Configuration
        </Button>
      </div>
    </form>
  );
}

export const NtfyChannelFormDesktop = memo(NtfyChannelFormDesktopComponent);
NtfyChannelFormDesktop.displayName = 'NtfyChannelFormDesktop';
