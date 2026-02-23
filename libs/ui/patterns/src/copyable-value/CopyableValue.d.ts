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
import React from 'react';
/**
 * Supported value types
 */
export type CopyableValueType = 'ip' | 'mac' | 'hostname' | 'text' | 'api-key' | 'password' | 'token';
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
 * CopyableValue Component
 *
 * Displays a value with inline copy functionality.
 * Hover to reveal copy icon on desktop, always visible on mobile.
 */
export declare const CopyableValue: React.FC<CopyableValueProps>;
//# sourceMappingURL=CopyableValue.d.ts.map