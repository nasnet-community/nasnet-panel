import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useThemeStore } from '@nasnet/state/stores';

import { ThemeToggle } from './ThemeToggle';


// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Moon: () => <svg data-testid="moon-icon">Moon</svg>,
  Sun: () => <svg data-testid="sun-icon">Sun</svg>,
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Reset store before each test
    useThemeStore.setState({
      theme: 'light',
      resolvedTheme: 'light',
    });
  });

  it('should render without crashing', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should show Sun icon when in light mode', () => {
    useThemeStore.setState({ resolvedTheme: 'light' });
    render(<ThemeToggle />);
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
  });

  it('should show Moon icon when in dark mode', () => {
    useThemeStore.setState({ resolvedTheme: 'dark' });
    render(<ThemeToggle />);
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
  });

  it('should have proper aria-label for accessibility', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button.getAttribute('aria-label')).toContain('theme');
  });

  it('should toggle theme when clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole('button');

    // Initial state: light mode
    expect(useThemeStore.getState().theme).toBe('light');

    // Click to toggle to dark
    await user.click(button);
    expect(useThemeStore.getState().theme).toBe('dark');

    // Click to toggle back to light
    await user.click(button);
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('should toggle based on resolved theme when theme is system', async () => {
    const user = userEvent.setup();

    // Set theme to 'system' with resolved dark
    useThemeStore.setState({
      theme: 'system',
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    // Should show Moon icon for dark mode
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();

    // Click should toggle to light (even though theme was 'system')
    await user.click(button);
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole('button');

    // Tab to focus
    await user.tab();
    expect(button).toHaveFocus();

    // Enter key should toggle theme
    const initialTheme = useThemeStore.getState().theme;
    await user.keyboard('{Enter}');
    expect(useThemeStore.getState().theme).not.toBe(initialTheme);

    // Space key should also toggle theme
    const themeAfterEnter = useThemeStore.getState().theme;
    await user.keyboard(' ');
    expect(useThemeStore.getState().theme).not.toBe(themeAfterEnter);
  });

  it('should apply custom className when provided', () => {
    const customClass = 'custom-test-class';
    render(<ThemeToggle className={customClass} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass(customClass);
  });

  it('should update icon when theme changes', () => {
    const { rerender } = render(<ThemeToggle />);

    // Start with light mode
    useThemeStore.setState({ resolvedTheme: 'light' });
    rerender(<ThemeToggle />);
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();

    // Change to dark mode
    useThemeStore.setState({ resolvedTheme: 'dark' });
    rerender(<ThemeToggle />);
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
  });
});
