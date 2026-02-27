/**
 * A11yProvider Tests
 *
 * @see NAS-4.17: Implement Accessibility (a11y) Foundation
 */

import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  A11yProvider,
  useA11y,
  useA11yOptional,
  useReducedMotion,
  useKeyboardUser,
  useHighContrast,
  useAnnounce,
} from './a11y-provider';

// Mock matchMedia
function createMatchMediaMock(matches: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('A11yProvider', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    window.matchMedia = createMatchMediaMock(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.documentElement.removeAttribute('data-keyboard-user');
    document.documentElement.removeAttribute('data-reduced-motion');
  });

  describe('Provider rendering', () => {
    it('should render children', () => {
      render(
        <A11yProvider>
          <div data-testid="child">Child content</div>
        </A11yProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should render live region for announcements', () => {
      render(
        <A11yProvider>
          <div>Content</div>
        </A11yProvider>
      );

      const liveRegion = document.querySelector('[role="status"][aria-live]');
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe('useA11y hook', () => {
    function TestComponent() {
      const { reducedMotion, highContrast, keyboardUser } = useA11y();
      return (
        <div>
          <span data-testid="reducedMotion">{String(reducedMotion)}</span>
          <span data-testid="highContrast">{String(highContrast)}</span>
          <span data-testid="keyboardUser">{String(keyboardUser)}</span>
        </div>
      );
    }

    it('should provide context values', () => {
      render(
        <A11yProvider>
          <TestComponent />
        </A11yProvider>
      );

      expect(screen.getByTestId('reducedMotion')).toHaveTextContent('false');
      expect(screen.getByTestId('highContrast')).toHaveTextContent('false');
      expect(screen.getByTestId('keyboardUser')).toHaveTextContent('false');
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow(
        'useA11y must be used within an A11yProvider'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('useA11yOptional hook', () => {
    function OptionalTestComponent() {
      const context = useA11yOptional();
      return <span data-testid="context">{context ? 'has-context' : 'no-context'}</span>;
    }

    it('should return null when used outside provider', () => {
      render(<OptionalTestComponent />);
      expect(screen.getByTestId('context')).toHaveTextContent('no-context');
    });

    it('should return context when used inside provider', () => {
      render(
        <A11yProvider>
          <OptionalTestComponent />
        </A11yProvider>
      );
      expect(screen.getByTestId('context')).toHaveTextContent('has-context');
    });
  });

  describe('Reduced motion detection', () => {
    it('should detect reduced motion preference', () => {
      // Mock matchMedia to return true for reduced motion
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      function TestComponent() {
        const reducedMotion = useReducedMotion();
        return <span data-testid="reducedMotion">{String(reducedMotion)}</span>;
      }

      render(
        <A11yProvider>
          <TestComponent />
        </A11yProvider>
      );

      expect(screen.getByTestId('reducedMotion')).toHaveTextContent('true');
    });

    it('should set data-reduced-motion attribute when reduced motion is preferred', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <A11yProvider>
          <div>Content</div>
        </A11yProvider>
      );

      expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('true');
    });
  });

  describe('High contrast detection', () => {
    it('should detect high contrast preference', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-contrast: more)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      function TestComponent() {
        const highContrast = useHighContrast();
        return <span data-testid="highContrast">{String(highContrast)}</span>;
      }

      render(
        <A11yProvider>
          <TestComponent />
        </A11yProvider>
      );

      expect(screen.getByTestId('highContrast')).toHaveTextContent('true');
    });
  });

  describe('Keyboard user detection', () => {
    function TestComponent() {
      const keyboardUser = useKeyboardUser();
      return <span data-testid="keyboardUser">{String(keyboardUser)}</span>;
    }

    it('should set keyboardUser to true when Tab is pressed', () => {
      render(
        <A11yProvider>
          <TestComponent />
        </A11yProvider>
      );

      expect(screen.getByTestId('keyboardUser')).toHaveTextContent('false');

      act(() => {
        fireEvent.keyDown(window, { key: 'Tab' });
      });

      expect(screen.getByTestId('keyboardUser')).toHaveTextContent('true');
    });

    it('should set keyboardUser to false when mouse is used', () => {
      render(
        <A11yProvider>
          <TestComponent />
        </A11yProvider>
      );

      // First, simulate keyboard usage
      act(() => {
        fireEvent.keyDown(window, { key: 'Tab' });
      });
      expect(screen.getByTestId('keyboardUser')).toHaveTextContent('true');

      // Then simulate mouse usage
      act(() => {
        fireEvent.mouseDown(window);
      });
      expect(screen.getByTestId('keyboardUser')).toHaveTextContent('false');
    });

    it('should set data-keyboard-user attribute when using keyboard', () => {
      render(
        <A11yProvider>
          <TestComponent />
        </A11yProvider>
      );

      expect(document.documentElement.hasAttribute('data-keyboard-user')).toBe(false);

      act(() => {
        fireEvent.keyDown(window, { key: 'Tab' });
      });

      expect(document.documentElement.getAttribute('data-keyboard-user')).toBe('true');
    });
  });

  describe('announce function', () => {
    function TestComponent() {
      const announce = useAnnounce();
      return (
        <button
          onClick={() => announce('Test announcement')}
          data-testid="announce-btn"
        >
          Announce
        </button>
      );
    }

    it('should announce messages to screen readers', async () => {
      render(
        <A11yProvider>
          <TestComponent />
        </A11yProvider>
      );

      const button = screen.getByTestId('announce-btn');

      await act(async () => {
        fireEvent.click(button);
        // Wait for requestAnimationFrame
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });

      await waitFor(() => {
        const liveRegion = document.querySelector('[role="status"][aria-live]');
        expect(liveRegion).toHaveTextContent('Test announcement');
      });
    });

    it('should support assertive announcements', async () => {
      function AssertiveTestComponent() {
        const announce = useAnnounce();
        return (
          <button
            onClick={() => announce('Urgent!', 'assertive')}
            data-testid="announce-btn"
          >
            Announce
          </button>
        );
      }

      render(
        <A11yProvider>
          <AssertiveTestComponent />
        </A11yProvider>
      );

      const button = screen.getByTestId('announce-btn');

      await act(async () => {
        fireEvent.click(button);
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });

      await waitFor(() => {
        const liveRegion = document.querySelector('[role="status"][aria-live="assertive"]');
        expect(liveRegion).toHaveTextContent('Urgent!');
      });
    });
  });

  describe('Media query change handling', () => {
    it('should update reducedMotion when media query changes', () => {
      let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn((event, handler) => {
          if (query === '(prefers-reduced-motion: reduce)') {
            changeHandler = handler;
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      function TestComponent() {
        const reducedMotion = useReducedMotion();
        return <span data-testid="reducedMotion">{String(reducedMotion)}</span>;
      }

      render(
        <A11yProvider>
          <TestComponent />
        </A11yProvider>
      );

      expect(screen.getByTestId('reducedMotion')).toHaveTextContent('false');

      // Simulate media query change
      act(() => {
        if (changeHandler) {
          changeHandler({ matches: true } as MediaQueryListEvent);
        }
      });

      expect(screen.getByTestId('reducedMotion')).toHaveTextContent('true');
    });
  });
});
