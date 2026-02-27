/**
 * PasswordField Component
 * Displays a password with masking, show/hide toggle, and copy functionality
 * Implements FR0-16: View security profile settings with password reveal
 */

import * as React from 'react';
import { Eye, EyeOff, Check, Copy } from 'lucide-react';
import { Icon, cn } from '@nasnet/ui/primitives';

export interface PasswordFieldProps {
  /** The password value to display */
  password: string;
  /** Optional label for the field */
  label?: string;
  /** Optional CSS className */
  className?: string;
}

/**
 * Password Field Component
 * - Displays password masked by default
 * - Provides show/hide toggle with keyboard support
 * - Provides copy-to-clipboard functionality
 * - Shows visual feedback on successful copy
 *
 * @description Sensitive field component with password masking and reveal toggle
 */
function PasswordFieldComponent({
  password,
  label = 'Password',
  className,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  /**
   * Toggle password visibility
   */
  const handleToggleVisibility = React.useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  /**
   * Copy password to clipboard
   */
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy password:', error);
    }
  }, [password]);

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <span className="text-sm text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-component-sm">
        {/* Password display */}
        <code
          className="text-sm font-mono text-foreground"
          aria-label={isVisible ? 'Password visible' : 'Password hidden'}
        >
          {isVisible ? password : '••••••••'}
        </code>

        {/* Show/Hide toggle button */}
        <button
          onClick={handleToggleVisibility}
          type="button"
          className="h-11 w-11 flex items-center justify-center rounded hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
        >
          <Icon
            icon={isVisible ? EyeOff : Eye}
            size="sm"
            className="text-muted-foreground"
          />
        </button>

        {/* Copy button (only visible when password is shown) */}
        {isVisible && (
          <button
            onClick={handleCopy}
            type="button"
            className="h-11 w-11 flex items-center justify-center rounded hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Copy password"
          >
            <Icon
              icon={copied ? Check : Copy}
              size="sm"
              className={copied ? 'text-success' : 'text-muted-foreground'}
            />
          </button>
        )}
      </div>
    </div>
  );
}

export const PasswordField = React.memo(PasswordFieldComponent);
PasswordField.displayName = 'PasswordField';
