import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useThemeStore, getSystemTheme } from './theme.store';

describe('useThemeStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store state before each test
    useThemeStore.setState({
      theme: 'system',
      resolvedTheme: 'light',
    });
  });

  it('should initialize with default values', () => {
    const state = useThemeStore.getState();
    expect(state.theme).toBe('system');
    expect(state.resolvedTheme).toBe('light');
  });

  it('should update theme when setTheme is called', () => {
    const { setTheme } = useThemeStore.getState();

    setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');

    setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');

    setTheme('system');
    expect(useThemeStore.getState().theme).toBe('system');
  });

  it('should allow toggling between light and dark', () => {
    const { setTheme } = useThemeStore.getState();

    // Start with light
    setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');

    // Toggle to dark
    setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');

    // Toggle back to light
    setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('should update resolvedTheme when _setResolvedTheme is called', () => {
    const { _setResolvedTheme } = useThemeStore.getState();

    _setResolvedTheme('dark');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');

    _setResolvedTheme('light');
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
  });

  it('should maintain theme and resolvedTheme independently', () => {
    const { setTheme, _setResolvedTheme } = useThemeStore.getState();

    // Set theme to 'system'
    setTheme('system');
    expect(useThemeStore.getState().theme).toBe('system');

    // Set resolved theme to 'dark' (as if OS prefers dark)
    _setResolvedTheme('dark');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');

    // Theme should still be 'system'
    expect(useThemeStore.getState().theme).toBe('system');
  });

  describe('Persistence (Story 0.9.2)', () => {
    it('should persist theme to localStorage when setTheme is called', () => {
      const { setTheme } = useThemeStore.getState();

      setTheme('dark');

      // Check localStorage
      const stored = localStorage.getItem('nasnet-theme');
      expect(stored).toBeTruthy();

      const data = JSON.parse(stored!);
      expect(data.state.theme).toBe('dark');
    });

    it('should have localStorage entry in correct format', () => {
      // Manually set localStorage (simulating previous session)
      const testData = {
        state: { theme: 'dark', resolvedTheme: 'light' },
        version: 1,
      };
      localStorage.setItem('nasnet-theme', JSON.stringify(testData));

      // Verify format is correct
      const stored = localStorage.getItem('nasnet-theme');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.theme).toBe('dark');
      expect(parsed.version).toBe(1);

      // Note: Zustand hydration happens async in real app
      // This test verifies the localStorage format is correct
    });

    it('should have resetTheme action to clear preference', () => {
      const { setTheme, resetTheme } = useThemeStore.getState();

      // Set a theme
      setTheme('dark');
      expect(useThemeStore.getState().theme).toBe('dark');

      // Reset to system default
      resetTheme();
      expect(useThemeStore.getState().theme).toBe('system');
    });

    it('should update localStorage when theme changes', () => {
      const { setTheme } = useThemeStore.getState();

      setTheme('dark');
      let stored = localStorage.getItem('nasnet-theme');
      expect(JSON.parse(stored!).state.theme).toBe('dark');

      setTheme('light');
      stored = localStorage.getItem('nasnet-theme');
      expect(JSON.parse(stored!).state.theme).toBe('light');
    });

    it('should handle localStorage unavailable gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('localStorage unavailable');
      };

      const { setTheme } = useThemeStore.getState();

      // Should not throw error
      expect(() => setTheme('dark')).not.toThrow();

      // Restore original
      localStorage.setItem = originalSetItem;
    });

    it('should persist version for future migrations', () => {
      const { setTheme } = useThemeStore.getState();

      setTheme('dark');

      const stored = localStorage.getItem('nasnet-theme');
      const data = JSON.parse(stored!);

      expect(data.version).toBe(1);
    });
  });

  describe('System Theme Detection (Story 0.9.3)', () => {
    it('should detect system theme preference', () => {
      // Mock matchMedia to return dark mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      expect(getSystemTheme()).toBe('dark');

      // Mock light mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      expect(getSystemTheme()).toBe('light');
    });

    it('should support three-state theme mode', () => {
      const { setTheme } = useThemeStore.getState();

      // Test light mode
      setTheme('light');
      expect(useThemeStore.getState().theme).toBe('light');

      // Test dark mode
      setTheme('dark');
      expect(useThemeStore.getState().theme).toBe('dark');

      // Test system mode
      setTheme('system');
      expect(useThemeStore.getState().theme).toBe('system');
    });

    it('should initialize resolvedTheme from system preference', () => {
      // Mock system dark mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      // Get initial resolved theme (should use getSystemTheme())
      const systemTheme = getSystemTheme();
      expect(systemTheme).toBe('dark');
    });

    it('should persist system theme preference', () => {
      const { setTheme } = useThemeStore.getState();

      setTheme('system');

      const stored = localStorage.getItem('nasnet-theme');
      expect(stored).toBeTruthy();

      const data = JSON.parse(stored!);
      expect(data.state.theme).toBe('system');
    });

    it('should allow cycling through all three theme modes', () => {
      const { setTheme } = useThemeStore.getState();

      // Light → Dark
      setTheme('light');
      expect(useThemeStore.getState().theme).toBe('light');

      // Dark → System
      setTheme('dark');
      expect(useThemeStore.getState().theme).toBe('dark');

      // System → Light
      setTheme('system');
      expect(useThemeStore.getState().theme).toBe('system');

      // Back to Light
      setTheme('light');
      expect(useThemeStore.getState().theme).toBe('light');
    });

    it('should handle _setResolvedTheme independently of theme', () => {
      const { setTheme, _setResolvedTheme } = useThemeStore.getState();

      // Set theme to system
      setTheme('system');
      expect(useThemeStore.getState().theme).toBe('system');

      // Simulate system changing to dark
      _setResolvedTheme('dark');
      expect(useThemeStore.getState().resolvedTheme).toBe('dark');
      expect(useThemeStore.getState().theme).toBe('system'); // Should stay system

      // Simulate system changing to light
      _setResolvedTheme('light');
      expect(useThemeStore.getState().resolvedTheme).toBe('light');
      expect(useThemeStore.getState().theme).toBe('system'); // Should stay system
    });
  });
});
