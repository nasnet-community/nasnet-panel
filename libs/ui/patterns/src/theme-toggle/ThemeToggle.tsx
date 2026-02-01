import { Moon, Sun, Monitor } from 'lucide-react';

import { useThemeStore, type ThemeMode } from '@nasnet/state/stores';
import { Button, cn } from '@nasnet/ui/primitives';

/**
 * ThemeToggle Props
 */
export interface ThemeToggleProps {
  /**
   * Optional className for styling
   */
  className?: string;
}

/**
 * ThemeToggle Component
 *
 * Provides a button to cycle through three theme modes:
 * 1. Light (Sun icon)
 * 2. Dark (Moon icon)
 * 3. System (Monitor icon) - follows OS preference
 *
 * Features:
 * - Three-state toggle: Light → Dark → System → Light
 * - Displays appropriate icon for each mode
 * - Keyboard accessible
 * - Screen reader friendly with aria-label
 *
 * Usage:
 * ```tsx
 * <ThemeToggle />
 * ```
 *
 * @param props - Component props
 * @returns Theme toggle button
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useThemeStore();

  /**
   * Cycle through theme modes: Light → Dark → System → Light
   */
  const handleToggle = () => {
    const nextTheme: ThemeMode =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(nextTheme);
  };

  // Determine which icon to show based on current theme mode
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  // Create readable labels for screen readers
  const currentLabel =
    theme === 'light'
      ? 'light mode'
      : theme === 'dark'
        ? 'dark mode'
        : 'system mode';
  const nextLabel =
    theme === 'light'
      ? 'dark mode'
      : theme === 'dark'
        ? 'system mode'
        : 'light mode';
  const ariaLabel = `Switch to ${nextLabel} (current: ${currentLabel})`;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={cn(
        'rounded-full hover:bg-accent transition-all duration-200',
        className
      )}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <Icon className="h-5 w-5 text-muted-foreground transition-transform duration-300 hover:rotate-12" />
    </Button>
  );
}
