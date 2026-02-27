/**
 * Credential Dialog Component
 * Modal dialog for entering and validating router credentials (Story 0-1-3)
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@nasnet/ui/primitives';
import type { RouterCredentials } from '@nasnet/core/types';
import { DEFAULT_CREDENTIALS } from '../services/credentialService';

export interface CredentialDialogProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Router IP address being connected to
   */
  routerIp: string;

  /**
   * Optional router name for display
   */
  routerName?: string;

  /**
   * Whether validation is in progress
   */
  isValidating?: boolean;

  /**
   * Validation error message
   */
  validationError?: string;

  /**
   * Callback when user submits credentials
   */
  onSubmit?: (credentials: RouterCredentials, saveCredentials: boolean) => void;

  /**
   * Callback when user cancels
   */
  onCancel?: () => void;

  /**
   * Initial credentials (for retry scenarios)
   */
  initialCredentials?: RouterCredentials;

  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * CredentialDialog Component
 *
 * @description Modal dialog for entering router login credentials with validation.
 *
 * Features:
 * - Username and password inputs
 * - Password visibility toggle
 * - Remember credentials checkbox
 * - Loading state during validation
 * - Error display
 *
 * @example
 * ```tsx
 * <CredentialDialog
 *   isOpen={showDialog}
 *   routerIp="192.168.88.1"
 *   routerName="Home Router"
 *   onSubmit={(creds, save) => validateAndConnect(creds, save)}
 *   onCancel={() => setShowDialog(false)}
 * />
 * ```
 */
export const CredentialDialog = memo(function CredentialDialog({
  isOpen,
  routerIp,
  routerName,
  isValidating = false,
  validationError,
  onSubmit,
  onCancel,
  initialCredentials,
  className,
}: CredentialDialogProps) {
  const [username, setUsername] = useState(
    initialCredentials?.username || DEFAULT_CREDENTIALS.username
  );
  const [password, setPassword] = useState(
    initialCredentials?.password || DEFAULT_CREDENTIALS.password
  );
  const [showPassword, setShowPassword] = useState(false);
  const [saveCredentials, setSaveCredentials] = useState(true);

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!username.trim()) {
        return;
      }

      onSubmit?.(
        {
          username: username.trim(),
          password,
        },
        saveCredentials
      );
    },
    [username, password, saveCredentials, onSubmit]
  );

  /**
   * Handles cancel action
   */
  const handleCancel = useCallback(() => {
    // Reset to initial or default values
    setUsername(initialCredentials?.username || DEFAULT_CREDENTIALS.username);
    setPassword(initialCredentials?.password || DEFAULT_CREDENTIALS.password);
    setShowPassword(false);
    onCancel?.();
  }, [initialCredentials, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className={cn('fixed inset-0 z-40 bg-black/50 backdrop-blur-sm', className)}
          />

          {/* Dialog */}
          <div className="p-component-md fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card shadow-modal w-full max-w-md rounded-lg"
            >
              {/* Header */}
              <div className="px-component-lg pt-component-lg pb-component-md border-border border-b">
                <h2 className="text-foreground text-xl font-semibold">Connect to Router</h2>
                <p className="mt-component-sm text-muted-foreground text-sm">
                  {routerName ?
                    <>
                      {routerName} <span className="font-mono text-xs">({routerIp})</span>
                    </>
                  : <span className="font-mono">{routerIp}</span>}
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="px-component-lg py-component-md"
              >
                <div className="space-y-component-md">
                  {/* Username Input */}
                  <div>
                    <label
                      htmlFor="username"
                      className="text-foreground mb-component-sm block text-sm font-medium"
                    >
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isValidating}
                      placeholder="admin"
                      className={cn(
                        'px-component-sm py-component-sm focus-visible:ring-ring bg-card text-foreground w-full rounded-md border shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50',
                        'border-border'
                      )}
                      autoFocus
                    />
                  </div>

                  {/* Password Input */}
                  <div>
                    <label
                      htmlFor="password"
                      className="text-foreground mb-component-sm block text-sm font-medium"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isValidating}
                        placeholder="Enter password"
                        className={cn(
                          'px-component-sm py-component-sm focus-visible:ring-ring bg-card text-foreground w-full rounded-md border pr-10 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50',
                          'border-border'
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isValidating}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center pr-3 disabled:opacity-50"
                      >
                        {showPassword ?
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        : <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        }
                      </button>
                    </div>
                  </div>

                  {/* Save Credentials Checkbox */}
                  <div className="flex items-center">
                    <input
                      id="saveCredentials"
                      type="checkbox"
                      checked={saveCredentials}
                      onChange={(e) => setSaveCredentials(e.target.checked)}
                      disabled={isValidating}
                      className={cn(
                        'h-4 w-4 rounded disabled:opacity-50',
                        'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
                      )}
                    />
                    <label
                      htmlFor="saveCredentials"
                      className="ml-component-sm text-foreground block text-sm"
                    >
                      Remember credentials
                    </label>
                  </div>

                  {/* Validation Error */}
                  <AnimatePresence>
                    {validationError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-error/10 border-error/20 rounded-md border p-3"
                        role="alert"
                      >
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg
                              className="text-error h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-error text-sm">{validationError}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <div className="gap-component-md mt-component-lg flex">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isValidating}
                    className={cn(
                      'px-component-md py-component-sm focus-visible:ring-ring flex-1 rounded-md font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50',
                      'bg-muted text-foreground hover:bg-muted/80'
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isValidating || !username.trim()}
                    className={cn(
                      'px-component-md py-component-sm focus-visible:ring-ring gap-component-sm flex flex-1 items-center justify-center rounded-md font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50',
                      'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                  >
                    {isValidating ?
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                        <span>Connecting...</span>
                      </>
                    : 'Connect'}
                  </button>
                </div>
              </form>

              {/* Footer Help Text */}
              <div className="px-component-lg py-component-md bg-muted border-border rounded-b-lg border-t">
                <p className="text-muted-foreground text-xs">
                  💡 Default MikroTik credentials: username{' '}
                  <code className="px-component-sm py-component-sm bg-card rounded font-mono">
                    admin
                  </code>{' '}
                  with empty password
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});

CredentialDialog.displayName = 'CredentialDialog';
