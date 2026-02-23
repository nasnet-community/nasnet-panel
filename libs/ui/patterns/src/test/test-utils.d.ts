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
type Platform = 'mobile' | 'tablet' | 'desktop';
type Theme = 'light' | 'dark' | 'system';
interface RenderWithProvidersOptions extends RenderOptions {
    /** Initial platform for testing */
    platform?: Platform;
    /** Initial theme for testing */
    theme?: Theme;
}
/**
 * Default platform mock - can be changed per-test using mockPlatform()
 */
export declare const platformMock: {
    current: Platform;
};
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
export declare function mockPlatform(platform: Platform): void;
/**
 * Resets the platform mock to default (desktop).
 * Call this in beforeEach or afterEach to ensure test isolation.
 */
export declare function resetPlatformMock(): void;
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
export declare function setViewport(width: number): void;
/**
 * Helper to set viewport by platform name.
 *
 * @example
 * ```typescript
 * setViewportByPlatform('mobile');
 * ```
 */
export declare function setViewportByPlatform(platform: Platform): void;
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
export declare function renderWithProviders(ui: React.ReactElement, options?: RenderWithProvidersOptions): ReturnType<typeof render>;
/**
 * Renders a component with a specific platform context.
 *
 * @example
 * ```typescript
 * renderWithPlatform(<IPInput />, 'mobile');
 * // IPInput will render mobile presenter
 * ```
 */
export declare function renderWithPlatform(ui: React.ReactElement, platform: Platform, options?: RenderOptions): ReturnType<typeof render>;
/**
 * Renders a component with a specific theme.
 * Note: Theme is typically applied via CSS classes, not React context.
 *
 * @example
 * ```typescript
 * renderWithTheme(<MyComponent />, 'dark');
 * ```
 */
export declare function renderWithTheme(ui: React.ReactElement, theme: Theme, options?: RenderOptions): ReturnType<typeof render>;
/**
 * Checks if an element meets minimum touch target requirements (44px).
 *
 * @example
 * ```typescript
 * const button = screen.getByRole('button');
 * expect(hasTouchTargetSize(button)).toBe(true);
 * ```
 */
export declare function hasTouchTargetSize(element: HTMLElement): boolean;
/**
 * Checks if an element has the min-h-[44px] class (touch target class).
 */
export declare function hasTouchTargetClass(element: HTMLElement): boolean;
/**
 * Checks if an element is keyboard focusable.
 */
export declare function isKeyboardFocusable(element: HTMLElement): boolean;
export { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
export { renderHook, act } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { axe } from 'vitest-axe';
import 'vitest-axe/extend-expect';
//# sourceMappingURL=test-utils.d.ts.map