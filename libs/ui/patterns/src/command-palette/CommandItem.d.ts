/**
 * CommandItem Component
 * Individual command item for the command palette
 *
 * Features:
 * - Icon display
 * - Keyboard shortcut display (desktop only)
 * - Selection highlighting
 * - Offline badge for network-dependent commands
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 */
import * as React from 'react';
import type { Command } from '@nasnet/state/stores';
/**
 * Props for CommandItem component
 * Individual command item for the command palette
 */
export interface CommandItemProps {
    /**
     * The command to display
     * Contains label, description, icon, keyboard shortcut, and network requirement
     */
    command: Command;
    /**
     * Whether this item is currently selected
     * Applied with accent background styling
     */
    selected: boolean;
    /**
     * Whether to show keyboard shortcuts (desktop only)
     * Mobile presenters hide shortcuts to save space
     * @default true
     */
    showShortcut?: boolean;
    /**
     * Whether the device is currently online
     * Network-dependent commands are disabled when offline
     * @default true
     */
    isOnline?: boolean;
    /**
     * Callback fired when the command is selected
     * Called on click or Enter key
     */
    onSelect: () => void;
    /**
     * Additional CSS classes for the container
     */
    className?: string;
}
/**
 * CommandItem component
 *
 * @example
 * ```tsx
 * <CommandItem
 *   command={command}
 *   selected={index === selectedIndex}
 *   showShortcut={!isMobile}
 *   isOnline={isOnline}
 *   onSelect={() => execute(command)}
 * />
 * ```
 */
declare const CommandItem: React.MemoExoticComponent<React.ForwardRefExoticComponent<CommandItemProps & React.RefAttributes<HTMLDivElement>>>;
export { CommandItem };
//# sourceMappingURL=CommandItem.d.ts.map