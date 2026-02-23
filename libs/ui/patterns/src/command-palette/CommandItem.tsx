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

import { WifiOff } from 'lucide-react';
import type { Command } from '@nasnet/state/stores';
import { cn, Icon as IconComponent } from '@nasnet/ui/primitives';

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
 * Format keyboard shortcut for display
 */
function formatShortcut(shortcut: string): string[] {
  // Split by space for multi-key shortcuts (e.g., "g h")
  const parts = shortcut.split(' ');

  return parts.flatMap((part) => {
    // Split by + for modifier combinations (e.g., "cmd+k")
    return part.split('+').map((key) => {
      // Normalize key names
      const lowerKey = key.toLowerCase();
      switch (lowerKey) {
        case 'cmd':
        case 'meta':
          return '⌘';
        case 'ctrl':
          return 'Ctrl';
        case 'alt':
          return 'Alt';
        case 'shift':
          return '⇧';
        case 'enter':
          return '↵';
        case 'escape':
        case 'esc':
          return 'Esc';
        default:
          return key.toUpperCase();
      }
    });
  });
}

/**
 * Keyboard key component for shortcut display
 */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
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
const CommandItem = React.memo(
  React.forwardRef<HTMLDivElement, CommandItemProps>(
    (
      {
        command,
        selected,
        showShortcut = true,
        isOnline = true,
        onSelect,
        className,
      },
      ref
    ) => {
      const Icon = command.icon;
      const isDisabled = command.requiresNetwork && !isOnline;
      const shortcutKeys = command.shortcut ? formatShortcut(command.shortcut) : [];

      return (
        <div
          ref={ref}
          role="option"
          aria-selected={selected}
          aria-disabled={isDisabled}
          data-selected={selected}
          data-disabled={isDisabled}
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 outline-none transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            'focus:bg-accent focus:text-accent-foreground',
            selected && 'bg-accent text-accent-foreground',
            isDisabled && 'cursor-not-allowed opacity-50',
            className
          )}
          onClick={() => !isDisabled && onSelect()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isDisabled) {
              e.preventDefault();
              onSelect();
            }
          }}
          tabIndex={-1}
        >
          {/* Icon */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>

          {/* Label and description */}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{command.label}</span>
            {command.description && (
              <span className="truncate text-xs text-muted-foreground">
                {command.description}
              </span>
            )}
          </div>

          {/* Offline badge */}
          {command.requiresNetwork && !isOnline && (
            <div className="flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive" title="This command requires network connectivity">
              <IconComponent icon={WifiOff} size="sm" />
              <span>Offline</span>
            </div>
          )}

          {/* Keyboard shortcut (desktop only) */}
          {showShortcut && command.shortcut && shortcutKeys.length > 0 && (
            <div className="flex shrink-0 items-center gap-1">
              {shortcutKeys.map((key, index) => (
                <Kbd key={index}>{key}</Kbd>
              ))}
            </div>
          )}
        </div>
      );
    }
  )
);

CommandItem.displayName = 'CommandItem';

export { CommandItem };
