/**
 * PPPoE Wizard - Step 2: Credentials
 *
 * Enter ISP-provided username and password with secure input.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */

import { useEffect, useState, memo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@nasnet/ui/utils';
import { FormSection, FieldHelp } from '@nasnet/ui/patterns';
import { Label, Input, Button } from '@nasnet/ui/primitives';
import type { UseStepperReturn } from '@nasnet/ui/patterns';
import {
  pppoeCredentialsStepSchema,
  type PppoeCredentialsStepFormValues,
} from '../../../schemas/pppoe-client.schema';
import { Eye, EyeOff, Lock, User, ServerCog } from 'lucide-react';

interface PppoeCredentialsStepProps {
  stepper: UseStepperReturn;
  className?: string;
}

export const PppoeCredentialsStep = memo(function PppoeCredentialsStep({
  stepper,
  className,
}: PppoeCredentialsStepProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<PppoeCredentialsStepFormValues>({
    resolver: zodResolver(pppoeCredentialsStepSchema),
    defaultValues: stepper.getStepData('credentials') || {
      username: '',
      password: '',
      serviceName: '',
    },
  });

  /**
   * Toggle password visibility
   */
  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Auto-save form data to stepper
  useEffect(() => {
    const subscription = form.watch((value) => {
      stepper.setStepData(value);
    });
    return () => subscription.unsubscribe();
  }, [form, stepper]);

  return (
    <div className={cn('space-y-6', className)}>
      <FormSection
        title="ISP Credentials"
        description="Enter the username and password provided by your Internet Service Provider"
      >
        <div className="space-y-component-md">
          {/* Username */}
          <div>
            <div className="gap-component-sm mb-component-md flex items-center">
              <Label htmlFor="username">
                <User
                  className="mr-component-xs inline h-4 w-4"
                  aria-hidden="true"
                />
                Username
              </Label>
              <FieldHelp field="username" />
            </div>
            <Input
              id="username"
              type="text"
              placeholder="user@isp.com or username"
              autoComplete="username"
              {...form.register('username')}
              aria-describedby="username-error"
              className="category-networking font-mono text-sm"
            />
            {form.formState.errors.username && (
              <p
                id="username-error"
                className="text-error mt-1 text-sm"
                role="alert"
              >
                {form.formState.errors.username.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="gap-component-sm mb-component-md flex items-center">
              <Label htmlFor="password">
                <Lock
                  className="mr-component-xs inline h-4 w-4"
                  aria-hidden="true"
                />
                Password
              </Label>
              <FieldHelp field="password" />
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your ISP password"
                autoComplete="current-password"
                {...form.register('password')}
                aria-describedby="password-error password-help"
                className="category-networking pr-10 font-mono text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={handleTogglePassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ?
                  <EyeOff
                    className="text-muted-foreground h-4 w-4"
                    aria-hidden="true"
                  />
                : <Eye
                    className="text-muted-foreground h-4 w-4"
                    aria-hidden="true"
                  />
                }
              </Button>
            </div>
            {form.formState.errors.password && (
              <p
                id="password-error"
                className="text-error mt-component-xs text-sm"
                role="alert"
              >
                {form.formState.errors.password.message}
              </p>
            )}
            <p
              id="password-help"
              className="text-muted-foreground mt-component-xs text-xs"
            >
              Your password is encrypted in transit and stored securely
            </p>
          </div>

          {/* Service Name (Optional) */}
          <div>
            <div className="gap-component-sm mb-component-md flex items-center">
              <Label htmlFor="service-name">
                <ServerCog
                  className="mr-component-xs inline h-4 w-4"
                  aria-hidden="true"
                />
                Service Name (Optional)
              </Label>
              <FieldHelp field="serviceName" />
            </div>
            <Input
              id="service-name"
              type="text"
              placeholder="Leave empty if not required"
              {...form.register('serviceName')}
              aria-describedby="service-name-error service-name-help"
              className="category-networking font-mono text-sm"
            />
            {form.formState.errors.serviceName && (
              <p
                id="service-name-error"
                className="text-error mt-component-xs text-sm"
                role="alert"
              >
                {form.formState.errors.serviceName.message}
              </p>
            )}
            <p
              id="service-name-help"
              className="text-muted-foreground mt-component-xs text-xs"
            >
              Most ISPs do not require a service name
            </p>
          </div>
        </div>
      </FormSection>

      {/* Security Notice */}
      <div
        className="border-border bg-card/50 p-component-md rounded-lg border"
        role="note"
      >
        <div className="gap-component-md flex">
          <Lock
            className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">Security Notice</p>
            <p className="text-muted-foreground text-xs">
              Your credentials are transmitted securely over HTTPS and stored encrypted on the
              router. The password is never logged or displayed in plain text.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

PppoeCredentialsStep.displayName = 'PppoeCredentialsStep';
