/**
 * KillConnectionButton Component
 *
 * Action button to kill a firewall connection with confirmation dialog.
 * Uses existing ConfirmationDialog with standard (yellow) warning level.
 */
import * as React from 'react';
import type { ConnectionEntry } from './types';
export interface KillConnectionButtonProps {
    /** Connection to kill */
    connection: ConnectionEntry;
    /** Callback when kill is confirmed */
    onKill: (connection: ConnectionEntry) => Promise<void>;
    /** Button variant */
    variant?: 'default' | 'outline' | 'ghost';
    /** Button size */
    size?: 'default' | 'sm' | 'lg';
    /** Additional CSS classes */
    className?: string;
    /** Custom button text */
    children?: React.ReactNode;
    /** Whether the action is loading */
    isLoading?: boolean;
}
/**
 * Button to kill a connection with confirmation dialog
 *
 * Features:
 * - Standard level confirmation (yellow warning)
 * - Shows connection details in dialog
 * - Toast notification on success/failure
 * - Loading state during action
 *
 * @example
 * ```tsx
 * <KillConnectionButton
 *   connection={conn}
 *   onKill={async (conn) => {
 *     await killConnectionMutation({ id: conn.id });
 *   }}
 * />
 * ```
 */
export declare function KillConnectionButton({ connection, onKill, variant, size, className, children, isLoading: externalLoading, }: KillConnectionButtonProps): import("react/jsx-runtime").JSX.Element;
export declare namespace KillConnectionButton {
    var displayName: string;
}
//# sourceMappingURL=KillConnectionButton.d.ts.map