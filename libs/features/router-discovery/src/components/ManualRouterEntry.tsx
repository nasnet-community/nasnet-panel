/**
 * Manual Router Entry Component
 * Allows users to manually add routers by IP address (Story 0-1-2)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

export interface ManualRouterEntryProps {
  /**
   * Callback when user submits router information
   */
  onSubmit?: (data: { ipAddress: string; name?: string }) => void;

  /**
   * Callback when user cancels entry
   */
  onCancel?: () => void;
}

/**
 * ManualRouterEntry Component
 *
 * Provides a form for manually adding routers when auto-discovery
 * is not available or doesn't find the router.
 *
 * Features:
 * - IP address input with validation
 * - Optional router name
 * - Real-time validation feedback
 * - Submit/cancel actions
 *
 * @example
 * ```tsx
 * <ManualRouterEntry
 *   onSubmit={(data) => addRouter(data)}
 *   onCancel={() => setShowForm(false)}
 * />
 * ```
 */
export function ManualRouterEntry({ onSubmit, onCancel }: ManualRouterEntryProps) {
  const [ipAddress, setIpAddress] = useState('');
  const [routerName, setRouterName] = useState('');
  const [errors, setErrors] = useState<{
    ipAddress?: string;
  }>({});

  /**
   * Validates IPv4 address format
   */
  const validateIpAddress = (ip: string): boolean => {
    const ipv4Regex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
  };

  /**
   * Handles IP address input change with validation
   */
  const handleIpChange = (value: string) => {
    setIpAddress(value);

    // Clear error when user starts typing
    if (errors.ipAddress) {
      setErrors({});
    }
  };

  /**
   * Handles form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate IP address
    if (!ipAddress.trim()) {
      setErrors({ ipAddress: 'IP address is required' });
      return;
    }

    if (!validateIpAddress(ipAddress)) {
      setErrors({
        ipAddress:
          'Invalid IP address format. Use IPv4 format (e.g., 192.168.88.1)',
      });
      return;
    }

    // Submit data
    onSubmit?.({
      ipAddress: ipAddress.trim(),
      name: routerName.trim() || undefined,
    });

    // Reset form
    setIpAddress('');
    setRouterName('');
    setErrors({});
  };

  /**
   * Handles cancel action
   */
  const handleCancel = () => {
    setIpAddress('');
    setRouterName('');
    setErrors({});
    onCancel?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
    >
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add Router Manually
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter the IP address of your MikroTik router
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* IP Address Input */}
          <div>
            <label
              htmlFor="ipAddress"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              IP Address <span className="text-red-500">*</span>
            </label>
            <input
              id="ipAddress"
              type="text"
              value={ipAddress}
              onChange={(e) => handleIpChange(e.target.value)}
              placeholder="192.168.88.1"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white ${
                errors.ipAddress
                  ? 'border-red-300 dark:border-red-700'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              autoFocus
            />
            {errors.ipAddress && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm text-red-600 dark:text-red-400"
              >
                {errors.ipAddress}
              </motion.p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter IPv4 address (e.g., 192.168.88.1)
            </p>
          </div>

          {/* Router Name Input (Optional) */}
          <div>
            <label
              htmlFor="routerName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Router Name{' '}
              <span className="text-gray-400 dark:text-gray-500">(optional)</span>
            </label>
            <input
              id="routerName"
              type="text"
              value={routerName}
              onChange={(e) => setRouterName(e.target.value)}
              placeholder="My Router"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Give your router a friendly name for easy identification
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
            >
              Add Router
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Common IP Presets */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          Common MikroTik IPs:
        </p>
        <div className="flex flex-wrap gap-2">
          {['192.168.88.1', '192.168.1.1', '10.0.0.1'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setIpAddress(preset)}
              className="px-3 py-1 text-xs font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
