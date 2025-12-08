/**
 * PasswordField Component
 * Displays a password with masking, show/hide toggle, and copy functionality
 * Implements FR0-16: View security profile settings with password reveal
 */

import { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { cn } from '@nasnet/ui/primitives';

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
 * - Provides show/hide toggle
 * - Provides copy-to-clipboard functionality
 * - Shows toast notification on successful copy
 */
export function PasswordField({
  password,
  label = 'Password',
  className,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  /**
   * Toggle password visibility
   */
  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  /**
   * Copy password to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy password:', error);
    }
  };

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <span className="text-sm text-slate-600 dark:text-slate-400">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {/* Password display */}
        <code
          className="text-sm font-mono text-slate-900 dark:text-slate-50"
          aria-label={isVisible ? 'Password visible' : 'Password hidden'}
        >
          {isVisible ? password : '••••••••'}
        </code>

        {/* Show/Hide toggle button */}
        <button
          onClick={handleToggleVisibility}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          ) : (
            <Eye className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {/* Copy button (only visible when password is shown) */}
        {isVisible && (
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Copy password"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
