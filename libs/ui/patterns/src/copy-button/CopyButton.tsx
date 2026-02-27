/**
 * CopyButton Component
 *
 * A button for copying values to clipboard with visual feedback.
 * Supports two variants: inline icon-only and button with text.
 *
 * @example
 * ```tsx
 * // Inline icon variant
 * <CopyButton value="192.168.1.1" variant="inline" aria-label="Copy IP address" />
 *
 * // Button with text variant
 * <CopyButton value={publicKey} variant="button" />
 *
 * // With toast notifications
 * <CopyButton
 *   value={serialNumber}
 *   showToast
 *   toastTitle="Serial number copied"
 * />
 * ```
 *
 * @see NAS-4.23 - Implement Clipboard Integration
 */

import * as React from 'react';

import { Copy, Check } from 'lucide-react';

import {
  Button,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  cn,
} from '@nasnet/ui/primitives';

import { useClipboard } from '../hooks';
import { useToast } from '../hooks/useToast';

/**
 * CopyButton variant types
 */
export type CopyButtonVariant = 'inline' | 'button';

/**
 * Props for CopyButton component
 */
export interface CopyButtonProps {
  /**
   * The value to copy to clipboard
   */
  value: string;

  /**
   * Button variant
   * - `inline`: Small icon-only button for inline use
   * - `button`: Standard button with "Copy" text
   * @default 'inline'
   */
  variant?: CopyButtonVariant;

  /**
   * Accessible label for the copy button
   */
  'aria-label'?: string;

  /**
   * Show tooltip on hover
   * @default true
   */
  showTooltip?: boolean;

  /**
   * Tooltip text when not copied
   * @default 'Click to copy'
   */
  tooltipText?: string;

  /**
   * Tooltip text after copying
   * @default 'Copied!'
   */
  copiedTooltipText?: string;

  /**
   * Show toast notification on copy
   * @default false
   */
  showToast?: boolean;

  /**
   * Toast title on successful copy
   * @default 'Copied!'
   */
  toastTitle?: string;

  /**
   * Toast description on successful copy
   */
  toastDescription?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Callback fired on successful copy
   */
  onCopy?: (value: string) => void;

  /**
   * Callback fired on copy error
   */
  onError?: (error: Error) => void;

  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
}

/**
 * CopyButton Component
 *
 * Provides copy-to-clipboard functionality with visual feedback.
 * Accessible via keyboard (Tab, Enter/Space) and screen readers.
 */
const CopyButtonComponent = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      value,
      variant = 'inline',
      'aria-label': ariaLabel,
      showTooltip = true,
      tooltipText = 'Click to copy',
      copiedTooltipText = 'Copied!',
      showToast = false,
      toastTitle = 'Copied!',
      toastDescription,
      className,
      onCopy,
      onError,
      disabled = false,
    },
    ref
  ) => {
    const { toast } = useToast();
    const { copy, copied, error } = useClipboard({
      onSuccess: (val) => {
        onCopy?.(val);
        if (showToast) {
          toast({
            title: toastTitle,
            description: toastDescription ?? 'Value copied to clipboard',
          });
        }
      },
      onError: (err) => {
        onError?.(err);
        if (showToast) {
          toast({
            title: 'Failed to copy',
            description: err.message || 'Could not copy to clipboard',
            variant: 'destructive',
          });
        }
      },
    });

    const handleClick = React.useCallback(
      async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation(); // Prevent click from bubbling to parent elements
        await copy(value);
      },
      [copy, value]
    );

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          copy(value);
        }
      },
      [copy, value]
    );

    // Determine effective aria-label
    const effectiveAriaLabel =
      copied ? 'Copied' : (ariaLabel ?? (variant === 'inline' ? 'Copy to clipboard' : undefined));

    // Icon component
    const IconComponent = copied ? Check : Copy;
    const iconClassName = copied ? 'h-4 w-4 text-success' : 'h-4 w-4 text-muted-foreground';

    // Render inline variant (icon only)
    if (variant === 'inline') {
      const button = (
        <Button
          ref={ref}
          variant="ghost"
          size="icon"
          className={cn('rounded-button hover:bg-muted h-8 w-8 transition-colors', className)}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label={effectiveAriaLabel}
          disabled={disabled}
        >
          <IconComponent className={iconClassName} />
        </Button>
      );

      if (showTooltip) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent
                side="top"
                className="text-xs"
              >
                {copied ? copiedTooltipText : tooltipText}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return button;
    }

    // Render button variant (with text)
    const button = (
      <Button
        ref={ref}
        variant="outline"
        size="sm"
        className={cn('rounded-button', className)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={effectiveAriaLabel}
        disabled={disabled}
      >
        <IconComponent className={cn(iconClassName, 'mr-1')} />
        {copied ? 'Copied' : 'Copy'}
      </Button>
    );

    if (showTooltip && !copied) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent
              side="top"
              className="text-xs"
            >
              {tooltipText}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  }
);

CopyButtonComponent.displayName = 'CopyButton';

export const CopyButton = React.memo(CopyButtonComponent) as typeof CopyButtonComponent;
