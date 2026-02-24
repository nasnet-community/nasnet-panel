/**
 * NtfyChannelFormMobile - Mobile Presenter
 *
 * @description
 * Touch-optimized ntfy.sh configuration form for mobile (<640px).
 * Features single-column layout, 44px touch targets, accordion sections, and simplified UI.
 *
 * @module @nasnet/features/alerts/components/ChannelForms
 * @see NAS-18.X: Ntfy.sh notification configuration
 */

import { Bell, Server, Shield, Tag, Eye, EyeOff, X, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
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
import { NTFY_PRIORITY_PRESETS } from '../../schemas/ntfy-config.schema';
import type { UseNtfyChannelFormReturn } from '../../hooks/useNtfyChannelForm';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for NtfyChannelFormMobile presenter
 */
export interface NtfyChannelFormMobileProps {
  /**
   * Headless hook instance containing form state, handlers, and validation logic
   */
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
  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        const added = addTag(tagInput);
        if (added) {
          setTagInput('');
        }
      }
    }
  }, [tagInput, addTag]);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim()) {
      const added = addTag(tagInput);
      if (added) {
        setTagInput('');
      }
    }
  }, [tagInput, addTag]);

  return (
    <form onSubmit={handleSubmit} className="space-y-component-md pb-24">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between rounded-[var(--semantic-radius-card)] border border-border bg-card p-component-md min-h-[56px]">
        <div className="flex items-center gap-component-md">
          <Icon icon={Bell} size="lg" className="text-muted-foreground" aria-hidden="true" />
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
              className="h-6 w-6 rounded border-border cursor-pointer"
              aria-label="Enable ntfy.sh notifications"
            />
          )}
        />
      </div>

      {/* Server Configuration Section */}
      <div className="space-y-component-sm">
        <button
          type="button"
          onClick={() => setShowServer(!showServer)}
          className="flex w-full items-center justify-between rounded-[var(--semantic-radius-card)] border border-border bg-card p-component-md min-h-[56px] hover:bg-card/90 focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={showServer}
          aria-label="Server Configuration"
        >
          <div className="flex items-center gap-component-sm">
            <Icon icon={Server} size="lg" aria-hidden="true" />
            <span className="font-semibold">Server Configuration</span>
          </div>
          <Icon
            icon={ChevronDown}
            size="lg"
            className={`transition-transform ${showServer ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {showServer && (
          <div className="space-y-component-md rounded-[var(--semantic-radius-card)] border border-border bg-card p-component-md">
            {/* Server URL */}
            <div className="space-y-component-sm">
              <Label htmlFor="serverUrl">
                Server URL <span className="text-error">*</span>
              </Label>
              <Input
                id="serverUrl"
                placeholder="https://ntfy.sh"
                type="url"
                {...register('serverUrl')}
                error={!!errors.serverUrl}
              />
              {errors.serverUrl && (
                <p className="text-sm text-error" role="alert">{errors.serverUrl.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Use https://ntfy.sh or your self-hosted server
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
                {...register('topic')}
                error={!!errors.topic}
              />
              {errors.topic && (
                <p className="text-sm text-error" role="alert">{errors.topic.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Only letters, numbers, hyphens, underscores
              </p>
            </div>

            {/* Priority */}
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
                <p className="text-sm text-error" role="alert">{errors.priority.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Authentication Section (Optional) */}
      <div className="space-y-component-sm">
        <button
          type="button"
          onClick={() => setShowAuth(!showAuth)}
          className="flex w-full items-center justify-between rounded-[var(--semantic-radius-card)] border border-border bg-card p-component-md min-h-[56px] hover:bg-card/90 focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={showAuth}
          aria-label="Authentication"
        >
          <div className="flex items-center gap-component-sm">
            <Icon icon={Shield} size="lg" aria-hidden="true" />
            <span className="font-semibold">Authentication</span>
            <Badge variant="secondary" className="text-xs">Optional</Badge>
          </div>
          <Icon
            icon={ChevronDown}
            size="lg"
            className={`transition-transform ${showAuth ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {showAuth && (
          <div className="space-y-component-md rounded-[var(--semantic-radius-card)] border border-border bg-card p-component-md">
            <p className="text-sm text-muted-foreground">
              Required for protected topics on ntfy.sh or self-hosted servers
            </p>

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
                <p className="text-sm text-error" role="alert">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-component-sm">
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
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon
                    icon={showPassword ? EyeOff : Eye}
                    size="lg"
                    aria-hidden="true"
                  />
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-error" role="alert">{errors.password.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tags Section (Optional) */}
      <div className="space-y-component-sm">
        <button
          type="button"
          onClick={() => setShowTags(!showTags)}
          className="flex w-full items-center justify-between rounded-[var(--semantic-radius-card)] border border-border bg-card p-component-md min-h-[56px] hover:bg-card/90 focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={showTags}
          aria-label="Tags"
        >
          <div className="flex items-center gap-component-sm">
            <Icon icon={Tag} size="lg" aria-hidden="true" />
            <span className="font-semibold">Tags</span>
            <Badge variant="secondary" className="text-xs">Optional</Badge>
            {tags.length > 0 && (
              <Badge variant="default" className="text-xs">{tags.length}</Badge>
            )}
          </div>
          <Icon
            icon={ChevronDown}
            size="lg"
            className={`transition-transform ${showTags ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {showTags && (
          <div className="space-y-component-md rounded-[var(--semantic-radius-card)] border border-border bg-card p-component-md">
            <p className="text-sm text-muted-foreground">
              Add tags to categorize your notifications (max 10)
            </p>

            {/* Tag Input */}
            <div className="flex gap-component-sm">
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
              <div className="flex flex-wrap gap-component-sm">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-component-sm text-sm py-2 px-3">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-1 p-0.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                      aria-label={`Remove ${tag}`}
                    >
                      <Icon icon={X} size="md" aria-hidden="true" />
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
          <Icon
            icon={testResult.success ? CheckCircle2 : AlertCircle}
            size="md"
            aria-hidden="true"
          />
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Fixed Action Buttons (Mobile Bottom Bar) */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-component-md space-y-component-sm">
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={!isValid || isTesting}
          className="w-full min-h-[44px]"
          aria-label={isTesting ? 'Testing notification' : 'Test notification'}
        >
          {isTesting ? 'Testing...' : 'Test Notification'}
        </Button>
        <Button type="submit" disabled={!isValid} className="w-full min-h-[44px]" aria-label="Save configuration">
          Save Configuration
        </Button>
      </div>
    </form>
  );
}

export const NtfyChannelFormMobile = memo(NtfyChannelFormMobileComponent);
NtfyChannelFormMobile.displayName = 'NtfyChannelFormMobile';
