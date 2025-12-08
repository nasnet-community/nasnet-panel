/**
 * Credential Dialog Component
 * Modal dialog for entering and validating router credentials (Story 0-1-3)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
}

/**
 * CredentialDialog Component
 *
 * Modal dialog for entering router login credentials with validation.
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
export function CredentialDialog({
  isOpen,
  routerIp,
  routerName,
  isValidating = false,
  validationError,
  onSubmit,
  onCancel,
  initialCredentials,
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
  const handleSubmit = (e: React.FormEvent) => {
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
  };

  /**
   * Handles cancel action
   */
  const handleCancel = () => {
    // Reset to initial or default values
    setUsername(initialCredentials?.username || DEFAULT_CREDENTIALS.username);
    setPassword(initialCredentials?.password || DEFAULT_CREDENTIALS.password);
    setShowPassword(false);
    onCancel?.();
  };

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Connect to Router
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {routerName ? (
                    <>
                      {routerName}{' '}
                      <span className="font-mono text-xs">({routerIp})</span>
                    </>
                  ) : (
                    <span className="font-mono">{routerIp}</span>
                  )}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-4">
                <div className="space-y-4">
                  {/* Username Input */}
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white disabled:opacity-50"
                      autoFocus
                    />
                  </div>

                  {/* Password Input */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isValidating}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                      >
                        {showPassword ? (
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
                        ) : (
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <label
                      htmlFor="saveCredentials"
                      className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
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
                        className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
                      >
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-red-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-800 dark:text-red-200">
                              {validationError}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isValidating}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isValidating || !username.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isValidating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      'Connect'
                    )}
                  </button>
                </div>
              </form>

              {/* Footer Help Text */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 Default MikroTik credentials: username{' '}
                  <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded">
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
}
