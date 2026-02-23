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
 * - Keyboard accessible with full keyboard support
 * - Screen reader friendly with descriptive aria-label
 * - Smooth icon rotation animation on hover
 * - Persistent state via Zustand store
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * <ThemeToggle className="ml-2" />
 * ```
 */

import { Moon, Sun, Monitor } from 'lucide-react';

import { useThemeStore, type ThemeMode } from '@nasnet/state/stores';
import { Button, cn } from '@nasnet/ui/primitives';
import { useMemo, useCallback, memo } from 'react';

/**
 * Props for ThemeToggle component
 * Controls styling of the theme toggle button
 */
export interface ThemeToggleProps {
  /**
   * Optional className for styling
   */
  className?: string;
}

/**
 * ThemeToggle Component
 */
function ThemeToggleComponent({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useThemeStore();

  /**
   * Cycle through theme modes: Light → Dark → System → Light
   */
  const handleToggle = useCallback(() => {
    const nextTheme: ThemeMode =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(nextTheme);
  }, [theme, setTheme]);

  // Memoize icon selection and labels for performance
  const { Icon, currentLabel, nextLabel, ariaLabel } = useMemo(() => {
    const icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
    const current =
      theme === 'light'
        ? 'light mode'
        : theme === 'dark'
          ? 'dark mode'
          : 'system mode';
    const next =
      theme === 'light'
        ? 'dark mode'
        : theme === 'dark'
          ? 'system mode'
          : 'light mode';
    return {
      Icon: icon,
      currentLabel: current,
      nextLabel: next,
      ariaLabel: `Switch to ${next} (current: ${current})`,
    };
  }, [theme]);

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
      aria-pressed={theme === 'dark'}
      title={ariaLabel}
    >
      <Icon className="h-5 w-5 text-muted-foreground transition-transform duration-300 hover:rotate-12" />
    </Button>
  );
}

export const ThemeToggle = memo(ThemeToggleComponent);
ThemeToggle.displayName = 'ThemeToggle';
