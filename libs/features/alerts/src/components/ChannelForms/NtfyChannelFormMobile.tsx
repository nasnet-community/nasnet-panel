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

import {
  Bell,
  Server,
  Shield,
  Tag,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
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

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-component-md pb-24"
    >
      {/* Enable Toggle */}
      <div className="border-border bg-card p-component-md flex min-h-[56px] items-center justify-between rounded-[var(--semantic-radius-card)] border">
        <div className="gap-component-md flex items-center">
          <Icon
            icon={Bell}
            size="lg"
            className="text-category-monitoring"
            aria-hidden="true"
          />
          <div>
            <Label className="text-base font-semibold">Ntfy.sh Notifications</Label>
            <p className="text-muted-foreground text-sm">Send push notifications</p>
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
              className="border-border h-6 w-6 cursor-pointer rounded"
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
          className="border-border bg-card p-component-md hover:bg-card/90 focus-visible:ring-ring flex min-h-[56px] w-full items-center justify-between rounded-[var(--semantic-radius-card)] border focus-visible:ring-2"
          aria-expanded={showServer}
          aria-label="Server Configuration"
        >
          <div className="gap-component-md flex items-center">
            <Icon
              icon={Server}
              size="lg"
              className="text-category-monitoring"
              aria-hidden="true"
            />
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
          <div className="space-y-component-md border-border bg-card p-component-md rounded-[var(--semantic-radius-card)] border">
            {/* Server URL */}
            <div className="space-y-component-sm">
              <Label htmlFor="serverUrl">
                Server URL <span className="text-error">*</span>
              </Label>
              <Input
                id="serverUrl"
                placeholder="https://ntfy.sh"
                type="url"
                className="font-mono"
                {...register('serverUrl')}
                error={!!errors.serverUrl}
              />
              {errors.serverUrl && (
                <p
                  className="text-error text-sm"
                  role="alert"
                >
                  {errors.serverUrl.message}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
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
                          <div className="gap-component-sm flex items-center">
                            <span className="text-lg">{preset.icon}</span>
                            <div>
                              <div className="font-medium">{preset.label}</div>
                              <div className="text-muted-foreground text-xs">
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
                <p
                  className="text-error text-sm"
                  role="alert"
                >
                  {errors.priority.message}
                </p>
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
          className="border-border bg-card p-component-md hover:bg-card/90 focus-visible:ring-ring flex min-h-[56px] w-full items-center justify-between rounded-[var(--semantic-radius-card)] border focus-visible:ring-2"
          aria-expanded={showAuth}
          aria-label="Authentication"
        >
          <div className="gap-component-md flex items-center">
            <Icon
              icon={Shield}
              size="lg"
              className="text-category-monitoring"
              aria-hidden="true"
            />
            <span className="font-semibold">Authentication</span>
            <Badge
              variant="secondary"
              className="text-xs"
            >
              Optional
            </Badge>
          </div>
          <Icon
            icon={ChevronDown}
            size="lg"
            className={`transition-transform ${showAuth ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {showAuth && (
          <div className="space-y-component-md border-border bg-card p-component-md rounded-[var(--semantic-radius-card)] border">
            <p className="text-muted-foreground text-sm">
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
                  className="pr-14"
                  {...register('password')}
                  error={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus-visible:ring-ring absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-sm p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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

      {/* Tags Section (Optional) */}
      <div className="space-y-component-sm">
        <button
          type="button"
          onClick={() => setShowTags(!showTags)}
          className="border-border bg-card p-component-md hover:bg-card/90 focus-visible:ring-ring flex min-h-[56px] w-full items-center justify-between rounded-[var(--semantic-radius-card)] border focus-visible:ring-2"
          aria-expanded={showTags}
          aria-label="Tags"
        >
          <div className="gap-component-md flex items-center">
            <Icon
              icon={Tag}
              size="lg"
              className="text-category-monitoring"
              aria-hidden="true"
            />
            <span className="font-semibold">Tags</span>
            <Badge
              variant="secondary"
              className="text-xs"
            >
              Optional
            </Badge>
            {tags.length > 0 && (
              <Badge
                variant="default"
                className="text-xs"
              >
                {tags.length}
              </Badge>
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
          <div className="space-y-component-md border-border bg-card p-component-md rounded-[var(--semantic-radius-card)] border">
            <p className="text-muted-foreground text-sm">
              Add tags to categorize your notifications (max 10)
            </p>

            {/* Tag Input */}
            <div className="gap-component-md flex">
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
              <div className="gap-component-md flex flex-wrap">
                {tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="gap-component-md py-component-sm px-component-md flex items-center font-mono text-sm"
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
                        size="md"
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
            size="md"
            aria-hidden="true"
          />
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Fixed Action Buttons (Mobile Bottom Bar) */}
      <div className="border-border bg-background p-component-md space-y-component-md fixed bottom-0 left-0 right-0 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={!isValid || isTesting}
          className="min-h-[44px] w-full"
          aria-label={isTesting ? 'Testing notification' : 'Test notification'}
        >
          {isTesting ? 'Testing...' : 'Test Notification'}
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          className="min-h-[44px] w-full"
          aria-label="Save configuration"
        >
          Save Configuration
        </Button>
      </div>
    </form>
  );
}

export const NtfyChannelFormMobile = memo(NtfyChannelFormMobileComponent);
NtfyChannelFormMobile.displayName = 'NtfyChannelFormMobile';
