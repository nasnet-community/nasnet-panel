/**
 * Test Utilities for Pattern Library
 *
 * Provides custom render functions, mock helpers, and test utilities
 * for testing NasNetConnect pattern components.
 *
 * @module @nasnet/ui/patterns/test
 * @see NAS-4A.24: Implement Component Tests and Visual Regression
 */

import * as React from 'react';

import { render, type RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// ============================================================================
// Type Definitions
// ============================================================================

type Platform = 'mobile' | 'tablet' | 'desktop';
type Theme = 'light' | 'dark' | 'system';

interface RenderWithProvidersOptions extends RenderOptions {
  /** Initial platform for testing */
  platform?: Platform;
  /** Initial theme for testing */
  theme?: Theme;
}

// ============================================================================
// Mock Setup
// ============================================================================

/**
 * Default platform mock - can be changed per-test using mockPlatform()
 */
export const platformMock = {
  current: 'desktop' as Platform,
};

// Mock @nasnet/ui/layouts module
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: () => platformMock.current,
  usePlatformWithBreakpoint: () => ({
    platform: platformMock.current,
    breakpoint: platformMock.current === 'mobile' ? 'sm' : platformMock.current === 'tablet' ? 'md' : 'lg',
  }),
  useIsMobile: () => platformMock.current === 'mobile',
  useIsTablet: () => platformMock.current === 'tablet',
  useIsDesktop: () => platformMock.current === 'desktop',
  useIsTouchPlatform: () => platformMock.current === 'mobile' || platformMock.current === 'tablet',
  usePlatformConfig: <T,>(config: Record<Platform, T>): T => config[platformMock.current],
  detectPlatform: (width: number) => {
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  },
  PlatformProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock @nasnet/state/stores module
vi.mock('@nasnet/state/stores', () => ({
  useConnectionStore: () => ({
    state: 'connected',
    lastConnectedAt: new Date(),
    reconnectAttempts: 0,
    protocol: 'REST',
  }),
  useThemeStore: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
  useUIStore: () => ({
    sidebarOpen: true,
    setSidebarOpen: vi.fn(),
  }),
}));

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sets the mock platform for subsequent component renders.
 * Use this at the start of tests that need specific platform behavior.
 *
 * @example
 * ```typescript
 * mockPlatform('mobile');
 * render(<MyComponent />);
 * // Component will render mobile variant
 * ```
 */
export function mockPlatform(platform: Platform): void {
  platformMock.current = platform;
}

/**
 * Resets the platform mock to default (desktop).
 * Call this in beforeEach or afterEach to ensure test isolation.
 */
export function resetPlatformMock(): void {
  platformMock.current = 'desktop';
}

/**
 * Sets the viewport width and dispatches a resize event.
 * Useful for testing responsive behavior.
 *
 * @example
 * ```typescript
 * setViewport(375); // Mobile viewport
 * setViewport(768); // Tablet viewport
 * setViewport(1280); // Desktop viewport
 * ```
 */
export function setViewport(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    writable: true,
    configurable: true,
  });
  window.dispatchEvent(new Event('resize'));
}

/**
 * Helper to set viewport by platform name.
 *
 * @example
 * ```typescript
 * setViewportByPlatform('mobile');
 * ```
 */
export function setViewportByPlatform(platform: Platform): void {
  const widths: Record<Platform, number> = {
    mobile: 375,
    tablet: 768,
    desktop: 1280,
  };
  setViewport(widths[platform]);
  mockPlatform(platform);
}

// ============================================================================
// Provider Wrappers
// ============================================================================

/**
 * Basic wrapper that provides common test providers.
 */
function TestProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ============================================================================
// Custom Render Functions
// ============================================================================

/**
 * Renders a component with standard test providers.
 * Use this for most component tests.
 *
 * @example
 * ```typescript
 * const { container } = renderWithProviders(<MyComponent />);
 * expect(screen.getByText('Hello')).toBeInTheDocument();
 * ```
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderWithProvidersOptions
): ReturnType<typeof render> {
  const { platform = 'desktop', ...renderOptions } = options || {};

  // Set up platform mock
  mockPlatform(platform);

  return render(ui, {
    wrapper: TestProviders,
    ...renderOptions,
  });
}

/**
 * Renders a component with a specific platform context.
 *
 * @example
 * ```typescript
 * renderWithPlatform(<IPInput />, 'mobile');
 * // IPInput will render mobile presenter
 * ```
 */
export function renderWithPlatform(
  ui: React.ReactElement,
  platform: Platform,
  options?: RenderOptions
): ReturnType<typeof render> {
  mockPlatform(platform);
  return render(ui, {
    wrapper: TestProviders,
    ...options,
  });
}

/**
 * Renders a component with a specific theme.
 * Note: Theme is typically applied via CSS classes, not React context.
 *
 * @example
 * ```typescript
 * renderWithTheme(<MyComponent />, 'dark');
 * ```
 */
export function renderWithTheme(
  ui: React.ReactElement,
  theme: Theme,
  options?: RenderOptions
): ReturnType<typeof render> {
  // Add theme class to document for CSS variable application
  document.documentElement.classList.remove('light', 'dark');
  if (theme !== 'system') {
    document.documentElement.classList.add(theme);
  }

  return render(ui, {
    wrapper: TestProviders,
    ...options,
  });
}

// ============================================================================
// Accessibility Test Helpers
// ============================================================================

/**
 * Checks if an element meets minimum touch target requirements (44px).
 *
 * @example
 * ```typescript
 * const button = screen.getByRole('button');
 * expect(hasTouchTargetSize(button)).toBe(true);
 * ```
 */
export function hasTouchTargetSize(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  const minHeight = parseInt(styles.minHeight, 10) || rect.height;
  const minWidth = parseInt(styles.minWidth, 10) || rect.width;
  return minHeight >= 44 && minWidth >= 44;
}

/**
 * Checks if an element has the min-h-[44px] class (touch target class).
 */
export function hasTouchTargetClass(element: HTMLElement): boolean {
  return element.className.includes('min-h-[44px]') || element.className.includes('min-h-11');
}

/**
 * Checks if an element is keyboard focusable.
 */
export function isKeyboardFocusable(element: HTMLElement): boolean {
  const tabIndex = element.getAttribute('tabindex');
  if (tabIndex !== null && parseInt(tabIndex, 10) < 0) {
    return false;
  }
  return (
    element.tagName === 'BUTTON' ||
    element.tagName === 'A' ||
    element.tagName === 'INPUT' ||
    element.tagName === 'SELECT' ||
    element.tagName === 'TEXTAREA' ||
    tabIndex !== null
  );
}

// ============================================================================
// Re-exports for Convenience
// ============================================================================

export { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
export { renderHook, act } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { axe, toHaveNoViolations } from 'vitest-axe';
