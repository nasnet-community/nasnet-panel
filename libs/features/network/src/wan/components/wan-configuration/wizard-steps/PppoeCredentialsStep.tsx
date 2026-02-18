/**
 * PPPoE Wizard - Step 2: Credentials
 *
 * Enter ISP-provided username and password with secure input.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
}

export function PppoeCredentialsStep({ stepper }: PppoeCredentialsStepProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<PppoeCredentialsStepFormValues>({
    resolver: zodResolver(pppoeCredentialsStepSchema),
    defaultValues: stepper.getStepData('credentials') || {
      username: '',
      password: '',
      serviceName: '',
    },
  });

  // Auto-save form data to stepper
  useEffect(() => {
    const subscription = form.watch((value) => {
      stepper.setStepData(value);
    });
    return () => subscription.unsubscribe();
  }, [form, stepper]);

  return (
    <div className="space-y-6">
      <FormSection
        title="ISP Credentials"
        description="Enter the username and password provided by your Internet Service Provider"
      >
        <div className="space-y-4">
          {/* Username */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="username">
                <User className="inline h-4 w-4 mr-1" />
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
            />
            {form.formState.errors.username && (
              <p
                id="username-error"
                className="text-sm text-error mt-1"
                role="alert"
              >
                {form.formState.errors.username.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="password">
                <Lock className="inline h-4 w-4 mr-1" />
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
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {form.formState.errors.password && (
              <p
                id="password-error"
                className="text-sm text-error mt-1"
                role="alert"
              >
                {form.formState.errors.password.message}
              </p>
            )}
            <p id="password-help" className="text-xs text-muted-foreground mt-1">
              Your password is encrypted in transit and stored securely
            </p>
          </div>

          {/* Service Name (Optional) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="service-name">
                <ServerCog className="inline h-4 w-4 mr-1" />
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
            />
            {form.formState.errors.serviceName && (
              <p
                id="service-name-error"
                className="text-sm text-error mt-1"
                role="alert"
              >
                {form.formState.errors.serviceName.message}
              </p>
            )}
            <p
              id="service-name-help"
              className="text-xs text-muted-foreground mt-1"
            >
              Most ISPs do not require a service name
            </p>
          </div>
        </div>
      </FormSection>

      {/* Security Notice */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex gap-3">
          <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Security Notice</p>
            <p className="text-xs text-muted-foreground">
              Your credentials are transmitted securely over HTTPS and stored
              encrypted on the router. The password is never logged or displayed
              in plain text.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
