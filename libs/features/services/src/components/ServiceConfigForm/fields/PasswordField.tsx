import { useState } from 'react';
import { Input } from '@nasnet/ui/primitives';
import { Button } from '@nasnet/ui/primitives';
import { Eye, EyeOff } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';

export type PasswordFieldProps = Omit<
  ComponentPropsWithoutRef<typeof Input>,
  'type'
>;

/**
 * Password field with show/hide toggle for PASSWORD type
 */
export function PasswordField(props: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={showPassword ? 'text' : 'password'}
        autoComplete="off"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Eye className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="sr-only">
          {showPassword ? 'Hide password' : 'Show password'}
        </span>
      </Button>
    </div>
  );
}
