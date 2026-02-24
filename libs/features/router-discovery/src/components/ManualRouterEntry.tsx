/**
 * Manual Router Entry Component
 * Allows users to manually add routers by IP address (Story 0-1-2)
 */

import { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@nasnet/ui/primitives';

export interface ManualRouterEntryProps {
  /**
   * Callback when user submits router information
   */
  onSubmit?: (data: { ipAddress: string; name?: string }) => void;

  /**
   * Callback when user cancels entry
   */
  onCancel?: () => void;

  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * ManualRouterEntry Component
 *
 * @description Provides a form for manually adding routers when auto-discovery
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
export const ManualRouterEntry = memo(function ManualRouterEntry({ onSubmit, onCancel, className }: ManualRouterEntryProps) {
  const [ipAddress, setIpAddress] = useState('');
  const [routerName, setRouterName] = useState('');
  const [errors, setErrors] = useState<{
    ipAddress?: string;
  }>({});

  /**
   * Validates IPv4 address format
   */
  const validateIpAddress = useCallback((ip: string): boolean => {
    const ipv4Regex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
  }, []);

  /**
   * Handles IP address input change with validation
   */
  const handleIpChange = useCallback((value: string) => {
    setIpAddress(value);

    // Clear error when user starts typing
    if (errors.ipAddress) {
      setErrors({});
    }
  }, [errors.ipAddress]);

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
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
  }, [ipAddress, routerName, validateIpAddress, onSubmit]);

  /**
   * Handles cancel action
   */
  const handleCancel = useCallback(() => {
    setIpAddress('');
    setRouterName('');
    setErrors({});
    onCancel?.();
  }, [onCancel]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('bg-card border border-border rounded-[var(--semantic-radius-card)] shadow-sm', className)}
    >
      <div className="p-component-lg">
        <div className="mb-component-md">
          <h3 className="text-lg font-display font-semibold text-foreground">
            Add Router Manually
          </h3>
          <p className="mt-component-sm text-sm text-muted-foreground">
            Enter the IP address of your MikroTik router
          </p>
        </div>

        {/* Help paragraph */}
        <p className="text-xs text-muted-foreground mb-component-md">
          💡 Tip: Default MikroTik IP addresses are typically 192.168.88.1, 192.168.1.1, or 10.0.0.1
        </p>

        <form onSubmit={handleSubmit} className="space-y-component-md" aria-label="Add router manually">
          {/* IP Address Input */}
          <div>
            <label
              htmlFor="ipAddress"
              className="block text-sm font-medium text-foreground mb-component-sm"
            >
              IP Address <span className="text-error">*</span>
            </label>
            <input
              id="ipAddress"
              type="text"
              value={ipAddress}
              onChange={(e) => handleIpChange(e.target.value)}
              placeholder="192.168.88.1"
              aria-required="true"
              aria-invalid={!!errors.ipAddress}
              aria-describedby={errors.ipAddress ? 'ipAddress-error' : 'ipAddress-hint'}
              className={cn('w-full min-h-[44px] px-component-sm py-component-sm border rounded-[var(--semantic-radius-button)] shadow-sm bg-card text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', errors.ipAddress ? 'border-error' : 'border-border')}
              autoFocus
            />
            {errors.ipAddress && (
              <motion.p
                id="ipAddress-error"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-component-sm text-sm text-error"
                role="alert"
              >
                {errors.ipAddress}
              </motion.p>
            )}
            <p id="ipAddress-hint" className="mt-component-sm text-xs text-muted-foreground">
              Enter IPv4 address (e.g., 192.168.88.1)
            </p>
          </div>

          {/* Router Name Input (Optional) */}
          <div>
            <label
              htmlFor="routerName"
              className="block text-sm font-medium text-foreground mb-component-sm"
            >
              Router Name{' '}
              <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="routerName"
              type="text"
              value={routerName}
              onChange={(e) => setRouterName(e.target.value)}
              placeholder="My Router"
              aria-describedby="routerName-hint"
              className={cn('w-full min-h-[44px] px-component-sm py-component-sm border rounded-[var(--semantic-radius-button)] shadow-sm bg-card text-foreground font-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', 'border-border')}
            />
            <p id="routerName-hint" className="mt-component-sm text-xs text-muted-foreground">
              Give your router a friendly name for easy identification
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-component-md pt-component-sm">
            <button
              type="submit"
              aria-label="Add router"
              className={cn('flex-1 min-h-[44px] px-component-md py-component-sm rounded-[var(--semantic-radius-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors font-medium', 'bg-primary text-primary-foreground hover:bg-primary/90')}
            >
              Add Router
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                aria-label="Cancel adding router"
                className={cn('min-h-[44px] px-component-md py-component-sm rounded-[var(--semantic-radius-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors font-medium', 'bg-muted text-foreground hover:bg-muted/80')}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Common IP Presets */}
      <div className="px-component-lg py-component-md bg-muted/50 border-t border-border rounded-b-[var(--semantic-radius-card)]">
        <p className="text-xs font-medium text-muted-foreground mb-component-sm">
          Common MikroTik IPs:
        </p>
        <div className="flex flex-wrap gap-component-sm">
          {['192.168.88.1', '192.168.1.1', '10.0.0.1'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setIpAddress(preset)}
              aria-label={`Use IP address ${preset}`}
              className={cn('min-h-[44px] px-component-sm py-component-sm text-xs font-mono border rounded-[var(--semantic-radius-button)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', 'bg-card border-border hover:border-primary hover:bg-primary/5')}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

ManualRouterEntry.displayName = 'ManualRouterEntry';
