/**
 * CopyableValue Component
 *
 * Displays a value with inline copy functionality.
 * Shows copy icon on hover and supports different value types.
 *
 * @example
 * ```tsx
 * // IP address
 * <CopyableValue value="192.168.1.1" type="ip" />
 *
 * // MAC address
 * <CopyableValue value="00:1A:2B:3C:4D:5E" type="mac" />
 *
 * // Masked sensitive value
 * <CopyableValue value="sk_live_abc123" type="api-key" masked />
 * ```
 *
 * @see NAS-4.23 - Implement Clipboard Integration
 */

import * as React from 'react';

import { Copy, Check, Eye, EyeOff } from 'lucide-react';

import { cn, Button, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@nasnet/ui/primitives';

import { useClipboard } from '../hooks';
import { useToast } from '../hooks/useToast';

/**
 * Supported value types
 */
export type CopyableValueType =
  | 'ip'       // IP address (e.g., 192.168.1.1 or 192.168.1.0/24)
  | 'mac'      // MAC address (e.g., 00:1A:2B:3C:4D:5E)
  | 'hostname' // Hostname (e.g., router.local)
  | 'text'     // Generic text
  | 'api-key'  // API key (maskable)
  | 'password' // Password (maskable)
  | 'token';   // Token (maskable)

/**
 * Props for CopyableValue component
 */
export interface CopyableValueProps {
  /**
   * The value to display and copy
   */
  value: string;

  /**
   * Type of value (affects styling and masking behavior)
   * @default 'text'
   */
  type?: CopyableValueType;

  /**
   * Whether to mask the value
   * Automatically true for api-key, password, and token types
   */
  masked?: boolean;

  /**
   * Number of characters to show when masked
   * @default 4
   */
  maskedVisibleChars?: number;

  /**
   * Show copy icon only on hover (desktop) or always (mobile)
   * @default true (show on hover)
   */
  showIconOnHover?: boolean;

  /**
   * Show toast notification on copy
   * @default true for sensitive types, false otherwise
   */
  showToast?: boolean;

  /**
   * Accessible label for the value
   */
  'aria-label'?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Callback fired on successful copy
   */
  onCopy?: (value: string) => void;

  /**
   * Text size
   * @default 'sm'
   */
  size?: 'xs' | 'sm' | 'base';
}

/**
 * Check if type is sensitive (should be masked by default)
 */
function isSensitiveType(type: CopyableValueType): boolean {
  return type === 'api-key' || type === 'password' || type === 'token';
}

/**
 * Mask a value, showing only the first and last few characters
 */
function maskValue(value: string, visibleChars: number = 4): string {
  if (value.length <= visibleChars * 2) {
    return '•'.repeat(value.length);
  }
  const start = value.slice(0, visibleChars);
  const end = value.slice(-visibleChars);
  const hiddenLength = value.length - visibleChars * 2;
  return `${start}${'•'.repeat(Math.min(hiddenLength, 8))}${end}`;
}

/**
 * Get label for value type
 */
function getTypeLabel(type: CopyableValueType): string {
  switch (type) {
    case 'ip':
      return 'IP address';
    case 'mac':
      return 'MAC address';
    case 'hostname':
      return 'Hostname';
    case 'api-key':
      return 'API key';
    case 'password':
      return 'Password';
    case 'token':
      return 'Token';
    default:
      return 'Value';
  }
}

/**
 * CopyableValue Component
 *
 * Displays a value with inline copy functionality.
 * Hover to reveal copy icon on desktop, always visible on mobile.
 */
export function CopyableValue({
  value,
  type = 'text',
  masked: maskedProp,
  maskedVisibleChars = 4,
  showIconOnHover = true,
  showToast: showToastProp,
  'aria-label': ariaLabel,
  className,
  onCopy,
  size = 'sm',
}: CopyableValueProps) {
  const { toast } = useToast();
  const { copy, copied } = useClipboard({
    onSuccess: (val) => {
      onCopy?.(val);
      if (shouldShowToast) {
        toast({
          title: 'Copied!',
          description: `${getTypeLabel(type)} copied to clipboard`,
        });
      }
    },
    onError: () => {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    },
  });

  // Determine if value should be masked
  const sensitive = isSensitiveType(type);
  const shouldMask = maskedProp ?? sensitive;
  const shouldShowToast = showToastProp ?? sensitive;

  // State for revealed sensitive values
  const [revealed, setRevealed] = React.useState(false);

  // Displayed value (masked or revealed)
  const displayValue = shouldMask && !revealed ? maskValue(value, maskedVisibleChars) : value;

  // Text size classes
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
  };

  // Technical values use monospace font
  const useMono = type === 'ip' || type === 'mac' || type === 'hostname' || type === 'api-key' || type === 'token';

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await copy(value);
  };

  const toggleReveal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealed(!revealed);
  };

  const effectiveAriaLabel = ariaLabel ?? `${getTypeLabel(type)}: ${shouldMask && !revealed ? 'hidden' : value}`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 group',
        className
      )}
      aria-label={effectiveAriaLabel}
    >
      <span
        className={cn(
          sizeClasses[size],
          useMono ? 'font-mono' : 'font-sans',
          'text-slate-900 dark:text-slate-50',
          shouldMask && !revealed && 'select-none'
        )}
      >
        {displayValue}
      </span>

      {/* Reveal/hide button for sensitive values */}
      {shouldMask && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-6 w-6 rounded-button',
                  'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
                  showIconOnHover && 'opacity-0 group-hover:opacity-100 focus:opacity-100'
                )}
                onClick={toggleReveal}
                aria-label={revealed ? 'Hide value' : 'Reveal value'}
              >
                {revealed ? (
                  <EyeOff className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                ) : (
                  <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {revealed ? 'Hide' : 'Reveal'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Copy button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-6 w-6 rounded-button',
                'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
                showIconOnHover && 'opacity-0 group-hover:opacity-100 focus:opacity-100'
              )}
              onClick={handleCopy}
              aria-label={copied ? 'Copied' : `Copy ${getTypeLabel(type)}`}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {copied ? 'Copied!' : 'Copy'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}

CopyableValue.displayName = 'CopyableValue';
