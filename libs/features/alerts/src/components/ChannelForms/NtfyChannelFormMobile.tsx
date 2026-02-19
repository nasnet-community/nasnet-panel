/**
 * NtfyChannelFormMobile - Mobile Presenter
 *
 * Touch-optimized ntfy.sh configuration form for mobile (<640px).
 * Features single-column layout, 44px touch targets, accordion sections, and simplified UI.
 *
 * @module @nasnet/features/alerts/components/ChannelForms
 * @see NAS-18.X: Ntfy.sh notification configuration
 */

import { Controller } from 'react-hook-form';
import { X, AlertCircle, CheckCircle2, Bell, Server, Shield, Eye, EyeOff, ChevronDown, Tag as TagIcon } from 'lucide-react';
import { memo, useState } from 'react';
import { Button, Input, Label, Badge, Alert, AlertDescription } from '@nasnet/ui/primitives';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';
import { NTFY_PRIORITY_PRESETS } from '../../schemas/ntfy-config.schema';
import type { UseNtfyChannelFormReturn } from '../../hooks/useNtfyChannelForm';

// ============================================================================
// Types
// ============================================================================

export interface NtfyChannelFormMobileProps {
  /** Headless hook instance */
  ntfyForm: UseNtfyChannelFormReturn;
}

// ============================================================================
// Component
// ============================================================================

function NtfyChannelFormMobileComponent({ ntfyForm }: NtfyChannelFormMobileProps) {
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
    hasAuthentication,
    toggleAuthentication,
  } = ntfyForm;

  const { control, formState, register } = form;
  const { errors } = formState;

  // Local state for accordion sections
  const [tagInput, setTagInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showServer, setShowServer] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showTags, setShowTags] = useState(false);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-24">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <div>
            <Label className="text-base font-semibold">Ntfy.sh Notifications</Label>
            <p className="text-sm text-muted-foreground">Send push notifications</p>
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
              className="h-6 w-6 rounded border-border"
              aria-label="Enable ntfy.sh notifications"
            />
          )}
        />
      </div>

      {/* Server Configuration Section */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowServer(!showServer)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 min-h-[56px]"
          aria-expanded={showServer}
          aria-label="Server Configuration"
        >
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" aria-hidden="true" />
            <span className="font-semibold">Server Configuration</span>
          </div>
          <ChevronDown
            className={`h-5 w-5 transition-transform ${showServer ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {showServer && (
          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            {/* Server URL */}
            <div className="space-y-2">
              <Label htmlFor="serverUrl">
                Server URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="serverUrl"
                placeholder="https://ntfy.sh"
                type="url"
                {...register('serverUrl')}
                error={!!errors.serverUrl}
              />
              {errors.serverUrl && (
                <p className="text-sm text-destructive" role="alert">{errors.serverUrl.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Use https://ntfy.sh or your self-hosted server
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
                Only letters, numbers, hyphens, underscores
              </p>
            </div>

            {/* Priority */}
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
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {NTFY_PRIORITY_PRESETS.map((preset) => (
                        <SelectItem
                          key={preset.value}
                          value={preset.value.toString()}
                          className="min-h-[44px]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{preset.icon}</span>
                            <div>
                              <div className="font-medium">{preset.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {preset.description}
                              </div>
                            </div>
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
            </div>
          </div>
        )}
      </div>

      {/* Authentication Section (Optional) */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowAuth(!showAuth)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 min-h-[56px]"
          aria-expanded={showAuth}
          aria-label="Authentication"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" aria-hidden="true" />
            <span className="font-semibold">Authentication</span>
            <Badge variant="secondary" className="text-xs">Optional</Badge>
          </div>
          <ChevronDown
            className={`h-5 w-5 transition-transform ${showAuth ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {showAuth && (
          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Required for protected topics on ntfy.sh or self-hosted servers
            </p>

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
                  className="pr-14"
                  {...register('password')}
                  error={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive" role="alert">{errors.password.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tags Section (Optional) */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowTags(!showTags)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 min-h-[56px]"
          aria-expanded={showTags}
          aria-label="Tags"
        >
          <div className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" aria-hidden="true" />
            <span className="font-semibold">Tags</span>
            <Badge variant="secondary" className="text-xs">Optional</Badge>
            {tags.length > 0 && (
              <Badge variant="default" className="text-xs">{tags.length}</Badge>
            )}
          </div>
          <ChevronDown
            className={`h-5 w-5 transition-transform ${showTags ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {showTags && (
          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Add tags to categorize your notifications (max 10)
            </p>

            {/* Tag Input */}
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Enter tag"
                aria-label="Tag name"
                disabled={tags.length >= 10}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 10}
                className="min-h-[44px] min-w-[44px] shrink-0"
              >
                Add
              </Button>
            </div>

            {/* Tag List */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1 text-sm py-2 px-3">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-1 min-h-[24px] min-w-[24px] flex items-center justify-center hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {tags.length >= 10 && (
              <p className="text-sm text-muted-foreground">Maximum 10 tags reached</p>
            )}
          </div>
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

      {/* Fixed Action Buttons (Mobile Bottom Bar) */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-4 space-y-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={!isValid || isTesting}
          className="w-full min-h-[44px]"
        >
          {isTesting ? 'Testing...' : 'Test Notification'}
        </Button>
        <Button type="submit" disabled={!isValid} className="w-full min-h-[44px]">
          Save Configuration
        </Button>
      </div>
    </form>
  );
}

export const NtfyChannelFormMobile = memo(NtfyChannelFormMobileComponent);
NtfyChannelFormMobile.displayName = 'NtfyChannelFormMobile';
